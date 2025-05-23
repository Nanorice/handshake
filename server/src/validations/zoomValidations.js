const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createMeetingSchema = z.object({
  body: z.object({
    sessionId: z.string().regex(mongoIdRegex, 'Invalid Session ID format'),
    topic: z.string().min(1, 'Meeting topic is required').max(200, 'Topic too long').optional(),
    // Zoom API has many options, add more as needed by your integration
    // e.g., start_time, duration, timezone, etc.
    // For now, keeping it simple, assuming controller fills in many details.
  }).strict(),
});

module.exports = {
  createMeetingSchema,
}; 