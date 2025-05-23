const { z } = require('zod');

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

// For GET /api/professionals (Query Params)
const getProfessionalsQuerySchema = z.object({
  query: z.object({
    industry: z.string().optional(),
    skills: z.string().optional(), // Could be a comma-separated string, parse in controller
    minRate: z.preprocess(val => parseFloat(val), z.number().min(0)).optional(),
    maxRate: z.preprocess(val => parseFloat(val), z.number().min(0)).optional(),
    page: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
    limit: z.preprocess(val => parseInt(val, 10), z.number().int().min(1)).optional(),
  }).strict(),
});

// For GET /api/professionals/:id (Params)
const professionalIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Professional ID format'), // This ID might be User ID or ProfessionalProfile ID depending on controller logic
  }),
});

// For POST /api/professionals/availability (Body)
const availabilitySlotSchema = z.object({
  day: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:MM)'),
});

const updateAvailabilitySchema = z.object({
  body: z.object({
    timezone: z.string().min(1, 'Timezone is required').optional(), // Or make it non-optional if always required
    slots: z.array(availabilitySlotSchema).min(0, 'At least one availability slot is required if slots array is provided').optional(),
  }).strict(),
});

// For POST /api/professionalprofiles (Body)
const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  startDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
  endDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    return null; // Allow null for ongoing jobs
  }, z.date().nullable()).optional(),
  description: z.string().max(1000, 'Experience description too long').optional(),
});

const professionalProfileBodySchema = z.object({
  body: z.object({
    // These might come from User model or be duplicated, clarify source of truth
    // name: z.string().min(1).optional(), 
    // email: z.string().email().optional(),
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    bio: z.string().min(1, 'Bio is required').max(2000, 'Bio too long'),
    profilePicture: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
    industries: z.array(z.string().min(1)).min(1, 'At least one industry is required'),
    skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
    experience: z.array(experienceSchema).optional(),
    availability: z.array(availabilitySlotSchema).optional(), // Or more detailed availability object
    rate: z.number().min(0, 'Rate must be a positive number'),
    isPublic: z.boolean().optional(),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    // any other fields from ProfessionalProfile model
  }).strict(),
});

module.exports = {
  getProfessionalsQuerySchema,
  professionalIdParamsSchema, // Can be reused for /api/professionalprofiles/:id if that ID is a user ID
  updateAvailabilitySchema,
  professionalProfileBodySchema,
}; 