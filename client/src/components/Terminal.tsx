import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTermTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface TerminalProps {
  apiKey: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  apiKey,
  onConnect,
  onDisconnect,
  onError,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<XTermTerminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTermTerminal({
      cols: 120,
      rows: 30,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#aeafad",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;

    // Handle terminal input
    term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon && terminalRef.current) {
        try {
          fitAddon.fit();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const cols = term.cols;
            const rows = term.rows;
            wsRef.current.send(
              JSON.stringify({ type: "resize", cols, rows })
            );
          }
        } catch (e) {
          console.error("Error fitting terminal:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/terminal?key=${encodeURIComponent(apiKey)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      term.write("\r\n\x1b[32m✓ Terminal connected\x1b[0m\r\n");
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "output") {
          term.write(message.data);
        } else if (message.type === "error") {
          term.write(`\r\n\x1b[31m✗ Error: ${message.data}\x1b[0m\r\n`);
          onError?.(message.data);
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onerror = (event) => {
      setIsConnected(false);
      setConnectionStatus("Connection Error");
      term.write("\r\n\x1b[31m✗ Connection error\x1b[0m\r\n");
      onError?.("Connection error");
    };

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionStatus("Disconnected");
      term.write("\r\n\x1b[33m⊘ Terminal disconnected\x1b[0m\r\n");
      onDisconnect?.();
    };

    wsRef.current = ws;

    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [apiKey, onConnect, onDisconnect, onError]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="text-sm text-gray-300">Terminal Session</div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-400">{connectionStatus}</span>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
    </div>
  );
};

export default Terminal;
