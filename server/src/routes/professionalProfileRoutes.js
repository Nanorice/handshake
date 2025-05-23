const express = require('express');
const router = express.Router();
const { 
  getMyProfessionalProfile, 
  upsertMyProfessionalProfile,
  getPublicProfile
} = require('../controllers/professionalProfileController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validationMiddleware');
const {
  professionalProfileBodySchema,
  professionalIdParamsSchema // Assuming :id refers to a user ID for the profile
} = require('../validations/professionalValidations');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log(`[ProfileRoutes] ${req.method} ${req.path} request received`);
  next();
});

// Get current user's professional public profile
router.get('/me', auth, authorize(['professional']), getMyProfessionalProfile);

// Create or update current user's professional public profile
router.post('/', auth, authorize(['professional']), validate(professionalProfileBodySchema), upsertMyProfessionalProfile);

// PUT route for updating professional profile
router.put('/', auth, authorize(['professional']), validate(professionalProfileBodySchema), upsertMyProfessionalProfile);

// Get a specific professional's public profile by user ID (public route)
router.get('/:id', validate(professionalIdParamsSchema), getPublicProfile);

module.exports = router; 