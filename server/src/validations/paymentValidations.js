const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createCheckoutSessionSchema = z.object({
  body: z.object({
    sessionId: z.string().regex(mongoIdRegex, 'Invalid Session ID format').optional(), // If booking a specific session
    professionalId: z.string().regex(mongoIdRegex, 'Invalid Professional ID format').optional(), // If paying for a generic service or new booking
    amount: z.number().positive('Amount must be positive'), // In smallest currency unit (e.g., cents)
    currency: z.string().length(3, 'Currency code must be 3 characters').default('usd'),
    // Add any other necessary details like success/cancel URLs if not handled by controller defaults
  }).strict(),
});

// Webhook route (POST /webhook) doesn't typically get Zod validation in the same way,
// as the body is from Stripe and should be verified using Stripe's signature.
// However, if there are specific query params you expect, you could add them.

const getPaymentHistoryQuerySchema = z.object({
  query: z.object({
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    status: z.string().optional(), // e.g., 'succeeded', 'pending', 'failed'
  }).strict(),
});

module.exports = {
  createCheckoutSessionSchema,
  getPaymentHistoryQuerySchema,
}; 