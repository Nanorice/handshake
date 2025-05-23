const express = require('express');
const router = express.Router();
const { 
  getProfessionals, 
  getProfessionalById, 
  updateAvailability
} = require('../controllers/professionalController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validationMiddleware');
const {
  getProfessionalsQuerySchema,
  professionalIdParamsSchema,
  updateAvailabilitySchema
} = require('../validations/professionalValidations');

// Public routes
router.get('/', validate(getProfessionalsQuerySchema), getProfessionals);

// Authenticated routes
router.get('/:id', auth, validate(professionalIdParamsSchema), getProfessionalById);

// Professional-only routes
router.post('/availability', auth, authorize(['professional']), validate(updateAvailabilitySchema), updateAvailability);

module.exports = router; 