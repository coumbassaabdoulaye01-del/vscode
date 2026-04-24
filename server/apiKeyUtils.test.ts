import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  isValidApiKeyFormat,
  isKeyExpired,
  isKeyValid,
  getExpirationDate,
  getPlanPrice,
} from "./apiKeyUtils";

describe("API Key Utilities", () => {
  describe("generateApiKey", () => {
    it("should generate a valid API key with correct format", () => {
      const key = generateApiKey();
      expect(key).toMatch(/^tk_[a-f0-9]{32}$/);
    });

    it("should generate unique keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("isValidApiKeyFormat", () => {
    it("should validate correct API key format", () => {
      const key = generateApiKey();
      expect(isValidApiKeyFormat(key)).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidApiKeyFormat("invalid")).toBe(false);
      expect(isValidApiKeyFormat("tk_short")).toBe(false);
      expect(isValidApiKeyFormat("")).toBe(false);
    });
  });

  describe("isKeyExpired", () => {
    it("should return false for future dates", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isKeyExpired(futureDate)).toBe(false);
    });

    it("should return true for past dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isKeyExpired(pastDate)).toBe(true);
    });
  });

  describe("isKeyValid", () => {
    it("should return true for active, non-expired keys", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isKeyValid("active", futureDate)).toBe(true);
    });

    it("should return false for revoked keys", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isKeyValid("revoked", futureDate)).toBe(false);
    });

    it("should return false for expired keys", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isKeyValid("active", pastDate)).toBe(false);
    });
  });

  describe("getExpirationDate", () => {
    it("should set expiration to 30 days for basic plan", () => {
      const now = new Date();
      const expiration = getExpirationDate("basic");
      const diffDays = Math.floor(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(30);
    });

    it("should set expiration to 90 days for pro plan", () => {
      const now = new Date();
      const expiration = getExpirationDate("pro");
      const diffDays = Math.floor(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(90);
    });

    it("should set expiration to 365 days for enterprise plan", () => {
      const now = new Date();
      const expiration = getExpirationDate("enterprise");
      const diffDays = Math.floor(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(365);
    });
  });

  describe("getPlanPrice", () => {
    it("should return correct prices for plans", () => {
      expect(getPlanPrice("basic")).toBe(999);
      expect(getPlanPrice("pro")).toBe(2999);
      expect(getPlanPrice("enterprise")).toBe(9999);
    });

    it("should return default price for unknown plan", () => {
      expect(getPlanPrice("unknown")).toBe(999);
    });
  });
});
