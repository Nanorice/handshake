const express = require('express');
const router = express.Router();
const { getMyProfessionalProfile, upsertMyProfessionalProfile } = require('../controllers/professionalProfileController');
const { auth, authorize } = require('../middleware/auth');

// Get current user's professional public profile
router.get('/me', auth, authorize(['professional']), getMyProfessionalProfile);

// Create or update current user's professional public profile
router.post('/', auth, authorize(['professional']), upsertMyProfessionalProfile);

module.exports = router; 