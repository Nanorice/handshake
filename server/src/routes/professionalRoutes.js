const express = require('express');
const router = express.Router();
const { 
  getProfessionals, 
  getProfessionalById, 
  updateProfile, 
  getIndustries 
} = require('../controllers/professionalController');
const { auth, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getProfessionals);
router.get('/industries', getIndustries);
router.get('/:id', getProfessionalById);

// Protected routes (require authentication)
router.put('/profile', auth, authorize(['professional']), updateProfile);

module.exports = router; 