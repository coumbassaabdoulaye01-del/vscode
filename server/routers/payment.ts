import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createApiKey } from "../db";
import { generateApiKey, getExpirationDate, getPlanPrice } from "../apiKeyUtils";

export const paymentRouter = router({
  /**
   * Simulate payment and create API key
   * In a real app, this would integrate with Stripe or another payment provider
   */
  purchaseKey: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["basic", "pro", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Simulate payment processing
      const price = getPlanPrice(input.plan);

      // In production, you would:
      // 1. Call Stripe API to create a payment intent
      // 2. Wait for payment confirmation
      // 3. Only then create the API key

      // For now, we simulate successful payment
      const simulatedPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Generate new API key
      const apiKey = generateApiKey();
      const expiresAt = getExpirationDate(input.plan);

      // Save to database
      await createApiKey(ctx.user.id, apiKey, expiresAt, input.plan);

      return {
        success: true,
        paymentId: simulatedPaymentId,
        apiKey: apiKey,
        plan: input.plan,
        expiresAt: expiresAt,
        price: price,
        message: `Payment of $${(price / 100).toFixed(2)} processed successfully`,
      };
    }),

  /**
   * Get pricing information for all plans
   */
  getPricing: protectedProcedure.query(() => {
    return {
      plans: [
        {
          id: "basic",
          name: "Basic",
          price: 999,
          priceFormatted: "$9.99",
          duration: "30 days",
          features: ["1 API key", "100 terminal sessions/month", "Basic support"],
        },
        {
          id: "pro",
          name: "Professional",
          price: 2999,
          priceFormatted: "$29.99",
          duration: "90 days",
          features: [
            "5 API keys",
            "1000 terminal sessions/month",
            "Priority support",
          ],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 9999,
          priceFormatted: "$99.99",
          duration: "365 days",
          features: [
            "Unlimited API keys",
            "Unlimited terminal sessions",
            "24/7 support",
          ],
        },
      ],
    };
  }),
});
