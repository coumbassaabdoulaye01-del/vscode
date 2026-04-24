import crypto from "crypto";

/**
 * Generate a unique API key with a specific format: prefix_randomstring
 * Format: tk_<32 random hex characters>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `tk_${randomBytes}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^tk_[a-f0-9]{32}$/.test(key);
}

/**
 * Check if an API key is expired
 */
export function isKeyExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if an API key is active and valid
 */
export function isKeyValid(status: string, expiresAt: Date): boolean {
  if (status !== "active") {
    return false;
  }
  return !isKeyExpired(expiresAt);
}

/**
 * Generate expiration date based on plan
 * - basic: 30 days
 * - pro: 90 days
 * - enterprise: 365 days
 */
export function getExpirationDate(plan: string = "basic"): Date {
  const now = new Date();
  const expirationDays: Record<string, number> = {
    basic: 30,
    pro: 90,
    enterprise: 365,
  };

  const days = expirationDays[plan] || 30;
  now.setDate(now.getDate() + days);
  return now;
}

/**
 * Get plan pricing (in cents)
 */
export function getPlanPrice(plan: string): number {
  const prices: Record<string, number> = {
    basic: 999, // $9.99
    pro: 2999, // $29.99
    enterprise: 9999, // $99.99
  };
  return prices[plan] || 999;
}

/**
 * Get plan details
 */
export function getPlanDetails(plan: string) {
  const details: Record<
    string,
    { name: string; price: number; duration: string; features: string[] }
  > = {
    basic: {
      name: "Basic",
      price: 999,
      duration: "30 days",
      features: ["1 API key", "100 terminal sessions/month", "Basic support"],
    },
    pro: {
      name: "Professional",
      price: 2999,
      duration: "90 days",
      features: ["5 API keys", "1000 terminal sessions/month", "Priority support"],
    },
    enterprise: {
      name: "Enterprise",
      price: 9999,
      duration: "365 days",
      features: [
        "Unlimited API keys",
        "Unlimited terminal sessions",
        "24/7 support",
      ],
    },
  };
  return details[plan] || details.basic;
}
