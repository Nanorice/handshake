const express = require('express');
const router = express.Router();
const { 
  getProfessionals, 
  getProfessionalById, 
  updateAvailability
} = require('../controllers/professionalController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProfessionals);

// Authenticated routes
router.get('/:id', auth, getProfessionalById);

// Professional-only routes
router.post('/availability', auth, authorize(['professional']), updateAvailability);

module.exports = router; 