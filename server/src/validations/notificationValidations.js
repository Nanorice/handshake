const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

// For GET /api/notifications/invitations
const getInvitationNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    read: z.preprocess(val => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
  }).strict(),
});

// Schemas for previously documented (but perhaps not implemented) notification routes
// GET /api/users/me/notifications - Similar to above but might have more types
const getAllNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    read: z.preprocess(val => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
    type: z.string().optional(), // e.g., 'booking', 'reminder', 'payment', 'system', 'message'
  }).strict(),
});

// PUT /api/notifications/:id/read
const notificationIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Notification ID format'),
  }),
});

// PUT /api/users/me/notifications/mark-all-read - No specific body/params needed for Zod usually

module.exports = {
  getInvitationNotificationsQuerySchema,
  getAllNotificationsQuerySchema, // If the generic GET /api/users/me/notifications is implemented
  notificationIdParamsSchema,   // If PUT /api/notifications/:id/read is implemented
}; 