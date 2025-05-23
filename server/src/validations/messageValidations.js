const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const threadIdParamsSchema = z.object({
  params: z.object({
    threadId: z.string().regex(mongoIdRegex, 'Invalid Thread ID format'),
  }),
});

const getThreadsQuerySchema = z.object({
  query: z.object({
    archived: z.preprocess(val => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
  }).strict(),
});

const createThreadSchema = z.object({
  body: z.object({
    participantId: z.string().regex(mongoIdRegex, 'Invalid Participant ID format'),
    initialMessage: z.string().min(1, 'Initial message cannot be empty').max(5000, 'Message too long').optional(),
    matchId: z.string().regex(mongoIdRegex, 'Invalid Match ID format').optional(),
  }).strict(),
});

const sendMessageSchema = z.object({
  // Params validation can be added if :threadId is part of this schema, or handled separately
  // params: threadIdParamsSchema.params, 
  body: z.object({
    content: z.string().min(1, 'Message content cannot be empty').max(5000, 'Message too long'),
    messageType: z.enum(['text', 'invite', 'timeProposal', 'timeSuggestion', 'timeConfirmation', 'payment']).default('text'),
    metadata: z.record(z.any()).optional(), // For flexible metadata object
  }).strict(),
});

// For GET /api/messages/:threadId/messages
const getMessagesForThreadSchema = z.object({
  params: z.object({
    threadId: z.string().regex(mongoIdRegex, 'Invalid Thread ID format'),
  }),
  query: z.object({
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    before: z.string().regex(mongoIdRegex, 'Invalid Message ID for cursor (before)').optional(),
    after: z.string().regex(mongoIdRegex, 'Invalid Message ID for cursor (after)').optional(),
  }).strict(),
});

// POST /api/messages (alternative send message route)
// This schema might be similar to sendMessageSchema but without threadId in params
const postGeneralMessageSchema = z.object({
  body: z.object({
    // If this route implies creating a thread or finding one based on participants:
    recipientId: z.string().regex(mongoIdRegex, 'Invalid Recipient ID format').optional(),
    threadId: z.string().regex(mongoIdRegex, 'Invalid Thread ID format').optional(),
    content: z.string().min(1).max(5000),
    messageType: z.enum(['text', 'invite', 'timeProposal', 'timeSuggestion', 'timeConfirmation', 'payment']).default('text'),
    metadata: z.record(z.any()).optional(),
  }).strict()
    .refine(data => data.recipientId || data.threadId, {
      message: "Either recipientId or threadId must be provided",
      path: ["recipientId", "threadId"],
    }),
});

module.exports = {
  threadIdParamsSchema,
  getThreadsQuerySchema,
  createThreadSchema,
  sendMessageSchema,
  getMessagesForThreadSchema,
  postGeneralMessageSchema,
}; 