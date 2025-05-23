const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const invitationIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Invitation ID format'),
  }),
});

const sendInvitationSchema = z.object({
  body: z.object({
    receiverId: z.string().regex(mongoIdRegex, 'Invalid Receiver ID format'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
    sessionDetails: z.object({
      proposedDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
      }, z.date()), // Ensure it's a future date in controller if needed
      duration: z.number().int().min(15, 'Duration must be at least 15 minutes'),
      topic: z.string().min(1, 'Topic is required').max(200, 'Topic too long'),
    }),
  }).strict(),
});

const getInvitationsQuerySchema = z.object({
  query: z.object({
    type: z.enum(['sent', 'received']).optional(),
    status: z.enum(['pending', 'accepted', 'declined', 'cancelled']).optional(), // Add other statuses if any
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
  }).strict(),
});

const respondToInvitationSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Invitation ID format'),
  }),
  body: z.object({
    status: z.enum(['accepted', 'declined'], 'Invalid status for response'),
    responseMessage: z.string().max(500, 'Response message too long').optional(),
  }).strict(),
});

// For simple invitations, the response schema might be the same
const simpleRespondToInvitationSchema = respondToInvitationSchema;

module.exports = {
  invitationIdParamsSchema,
  sendInvitationSchema,
  getInvitationsQuerySchema,
  respondToInvitationSchema,
  simpleRespondToInvitationSchema,
}; 