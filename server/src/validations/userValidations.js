const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const updateUserProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name cannot be empty').optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').optional(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    profileImage: z.string().url('Invalid profile image URL').optional().or(z.literal('')),
    // Add other updatable fields as necessary
  }).strict(), // Use .strict() to prevent unexpected fields in the body
});

const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid User ID format'),
  }),
});

module.exports = {
  updateUserProfileSchema,
  userIdParamsSchema,
}; 