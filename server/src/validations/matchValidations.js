const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const matchIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Match ID format'),
  }),
});

const getUserMatchesQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(), // e.g., 'pending', 'accepted', 'rejected'
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
  }).strict(),
});

const sendMatchRequestSchema = z.object({
  body: z.object({
    professionalId: z.string().regex(mongoIdRegex, 'Invalid Professional ID format'),
    message: z.string().max(1000, 'Message too long').optional(),
    // Add any other fields relevant to a match request
  }).strict(),
});

// For PUT /:id/accept and PUT /:id/reject, often only param ID is needed for Zod,
// as the body might be empty or have a simple status if not already implied by the route.
// If they expect a body (e.g., a rejection reason), add that here.
const acceptRejectMatchSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Match ID format'),
  }),
  // Example if a message is allowed/required on rejection:
  // body: z.object({
  //   reason: z.string().max(500).optional(),
  // }).strict().optional(), // Make body optional if not always needed
});

module.exports = {
  matchIdParamsSchema,
  getUserMatchesQuerySchema,
  sendMatchRequestSchema,
  acceptRejectMatchSchema,
}; 