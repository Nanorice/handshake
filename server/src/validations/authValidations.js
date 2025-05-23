const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    // role: z.enum(['seeker', 'professional']).optional() // Role might be set by controller or a different route
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'), // Assuming MongoDB ObjectId as string
    newRole: z.enum(['seeker', 'professional', 'admin'], 'Invalid role specified'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateUserRoleSchema,
}; 