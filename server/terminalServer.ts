import { WebSocketServer } from "ws";
import { Server as HTTPServer } from "http";
import { getApiKeyByKey, incrementApiKeyUsage } from "./db";
import { isKeyValid } from "./apiKeyUtils";
import { spawn } from "child_process";

interface TerminalSession {
  userId: number;
  keyId: number;
}

const activeSessions = new Map<string, TerminalSession>();

export function setupTerminalServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  httpServer.on("upgrade", async (request, socket, head) => {
    if (request.url?.startsWith("/api/terminal")) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const apiKey = url.searchParams.get("key");

      if (!apiKey) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Validate API key
      const keyRecord = await getApiKeyByKey(apiKey);

      if (!keyRecord || !isKeyValid(keyRecord.status, keyRecord.expiresAt)) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      // Upgrade to WebSocket
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        const sessionId = `${keyRecord.userId}_${Date.now()}`;

        // Spawn shell process
        const shellProcess = spawn("bash", [], {
          cols: 120,
          rows: 30,
        } as any);

        const session: TerminalSession = {
          userId: keyRecord.userId,
          keyId: keyRecord.id,
        };

        activeSessions.set(sessionId, session);

        // Increment usage count
        incrementApiKeyUsage(keyRecord.id).catch(console.error);

        // Send output from shell to client
        if (shellProcess.stdout) {
          shellProcess.stdout.on("data", (data: Buffer) => {
            ws.send(
              JSON.stringify({
                type: "output",
                data: data.toString(),
              })
            );
          });
        }

        if (shellProcess.stderr) {
          shellProcess.stderr.on("data", (data: Buffer) => {
            ws.send(
              JSON.stringify({
                type: "output",
                data: data.toString(),
              })
            );
          });
        }

        // Handle client messages
        ws.on("message", (message: Buffer) => {
          try {
            const msg = JSON.parse(message.toString());

            if (msg.type === "input" && shellProcess.stdin) {
              shellProcess.stdin.write(msg.data);
            } else if (msg.type === "resize" && shellProcess.stdin) {
              // Resize terminal
              shellProcess.stdin.write(
                Buffer.from([
                  27, 91, 56, 59, msg.rows, 59, msg.cols, 116,
                ])
              );
            }
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        });

        // Handle connection close
        ws.on("close", () => {
          shellProcess.kill();
          activeSessions.delete(sessionId);
        });

        // Handle shell process exit
        shellProcess.on("exit", () => {
          ws.close();
          activeSessions.delete(sessionId);
        });

        // Handle errors
        shellProcess.on("error", (error: Error) => {
          ws.send(
            JSON.stringify({
              type: "error",
              data: `Shell error: ${error.message}`,
            })
          );
          ws.close();
          activeSessions.delete(sessionId);
        });
      });
    }
  });

  return wss;
}

export function getActiveSessions() {
  return Array.from(activeSessions.entries()).map(([id, session]) => ({
    id,
    userId: session.userId,
    keyId: session.keyId,
  }));
}
