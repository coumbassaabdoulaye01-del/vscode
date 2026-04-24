import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createApiKey,
  getApiKeyByKey,
  getUserApiKeys,
  revokeApiKey,
  getAllApiKeys,
} from "../db";
import {
  generateApiKey,
  isKeyValid,
  getExpirationDate,
  getPlanDetails,
} from "../apiKeyUtils";

export const apiKeysRouter = router({
  /**
   * Get current user's API keys
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await getUserApiKeys(ctx.user.id);
    return keys.map((key) => ({
      id: key.id,
      key: key.key.substring(0, 8) + "..." + key.key.substring(key.key.length - 4),
      status: key.status,
      plan: key.plan,
      expiresAt: key.expiresAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));
  }),

  /**
   * Get full API key details (for copying)
   */
  getFullKey: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const keys = await getUserApiKeys(ctx.user.id);
      const key = keys.find((k) => k.id === input.keyId);

      if (!key) {
        throw new Error("API key not found");
      }

      return {
        id: key.id,
        key: key.key,
        status: key.status,
        plan: key.plan,
        expiresAt: key.expiresAt,
        usageCount: key.usageCount,
      };
    }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const keys = await getUserApiKeys(ctx.user.id);
      const key = keys.find((k) => k.id === input.keyId);

      if (!key) {
        throw new Error("API key not found");
      }

      await revokeApiKey(input.keyId);
      return { success: true };
    }),

  /**
   * Admin: Get all API keys with user info
   */
  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const keys = await getAllApiKeys();
    return keys.map((key) => ({
      id: key.id,
      keyPreview: key.key.substring(0, 8) + "..." + key.key.substring(key.key.length - 4),
      userId: key.userId,
      status: key.status,
      plan: key.plan,
      expiresAt: key.expiresAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));
  }),

  /**
   * Validate API key for terminal access
   */
  validate: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const apiKey = await getApiKeyByKey(input.key);

      if (!apiKey) {
        return { valid: false, reason: "Key not found" };
      }

      if (!isKeyValid(apiKey.status, apiKey.expiresAt)) {
        return { valid: false, reason: "Key is invalid or expired" };
      }

      return {
        valid: true,
        userId: apiKey.userId,
        plan: apiKey.plan,
        keyId: apiKey.id,
      };
    }),
});
