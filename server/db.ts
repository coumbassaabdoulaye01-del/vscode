import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, apiKeys } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createApiKey(userId: number, key: string, expiresAt: Date, plan: string = "basic"): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create API key: database not available");
    return;
  }

  try {
    await db.insert(apiKeys).values({
      key,
      userId,
      status: "active",
      expiresAt,
      usageCount: 0,
      plan,
    });
  } catch (error) {
    console.error("[Database] Failed to create API key:", error);
    throw error;
  }
}

export async function getApiKeyByKey(key: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get API key: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get API key:", error);
    throw error;
  }
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user API keys: database not available");
    return [];
  }

  try {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user API keys:", error);
    throw error;
  }
}

export async function revokeApiKey(keyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot revoke API key: database not available");
    return;
  }

  try {
    await db.update(apiKeys).set({ status: "revoked" }).where(eq(apiKeys.id, keyId));
  } catch (error) {
    console.error("[Database] Failed to revoke API key:", error);
    throw error;
  }
}

export async function incrementApiKeyUsage(keyId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment API key usage: database not available");
    return;
  }

  try {
    const keyRecord = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
    if (keyRecord.length > 0) {
      await db.update(apiKeys).set({ usageCount: (keyRecord[0].usageCount || 0) + 1 }).where(eq(apiKeys.id, keyId));
    }
  } catch (error) {
    console.error("[Database] Failed to increment API key usage:", error);
    throw error;
  }
}

export async function getAllApiKeys() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all API keys: database not available");
    return [];
  }

  try {
    return await db.select().from(apiKeys);
  } catch (error) {
    console.error("[Database] Failed to get all API keys:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
