const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { upload, uploadToGridFS, downloadFromGridFS, deleteFromGridFS, getFileInfo } = require('../config/gridfs');
const { auth } = require('../middleware/auth');

// Test route to verify file routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'File routes are working!' });
});

// Test auth route to verify authentication is working
router.get('/test-auth', auth, (req, res) => {
  res.json({ 
    message: 'Authentication is working in file routes!',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Upload profile photo
router.post('/upload/profile-photo', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('[Profile Photo Upload] Starting upload process');
    console.log('[Profile Photo Upload] User from auth:', req.user ? `${req.user.email} (${req.user._id})` : 'No user');
    console.log('[Profile Photo Upload] File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      console.log('[Profile Photo Upload] ERROR: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      console.log('[Profile Photo Upload] ERROR: No user ID found');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('[Profile Photo Upload] Uploading to GridFS...');
    // Upload file to GridFS
    const fileData = await uploadToGridFS(req.file, {
      userId: userId,
      fileType: 'profilePhoto'
    });
    console.log('[Profile Photo Upload] GridFS upload successful:', fileData);

    // Update user with new profile photo reference
    const user = await User.findById(userId);
    if (!user) {
      console.log('[Profile Photo Upload] ERROR: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile photo if it exists
    if (user.profilePhoto && user.profilePhoto.fileId) {
      try {
        console.log('[Profile Photo Upload] Deleting old profile photo:', user.profilePhoto.fileId);
        await deleteFromGridFS(user.profilePhoto.fileId);
      } catch (error) {
        console.warn('[Profile Photo Upload] Failed to delete old profile photo:', error.message);
      }
    }

    // Save new profile photo reference
    user.profilePhoto = {
      fileId: fileData.fileId,
      filename: fileData.filename,
      originalName: fileData.originalName,
      contentType: fileData.contentType,
      uploadDate: new Date()
    };

    console.log('[Profile Photo Upload] Saving user with new profile photo data...');
    await user.save();
    console.log('[Profile Photo Upload] User saved successfully');

    const responseData = {
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        url: `/api/files/file/${fileData.fileId}`,
        fileId: fileData.fileId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        contentType: fileData.contentType
      }
    };
    
    console.log('[Profile Photo Upload] SUCCESS - Sending response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('[Profile Photo Upload] FATAL ERROR:', error);
    console.error('[Profile Photo Upload] Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to upload profile photo' });
  }
});

// Upload CV
router.post('/upload/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Upload file to GridFS
    const fileData = await uploadToGridFS(req.file, {
      userId: userId,
      fileType: 'cv'
    });

    // Update user with new CV reference
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old CV if it exists
    if (user.cv && user.cv.fileId) {
      try {
        await deleteFromGridFS(user.cv.fileId);
      } catch (error) {
        console.warn('Failed to delete old CV:', error.message);
      }
    }

    // Save new CV reference
    user.cv = {
      fileId: fileData.fileId,
      filename: fileData.filename,
      originalName: fileData.originalName,
      contentType: fileData.contentType,
      uploadDate: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'CV uploaded successfully',
      file: {
        fileId: fileData.fileId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        contentType: fileData.contentType
      }
    });

  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload CV' });
  }
});

// Upload Resume (alias for CV to match frontend expectations)
router.post('/upload/resume', auth, upload.single('resume'), async (req, res) => {
  try {
    console.log('[Resume Upload] Starting upload process');
    console.log('[Resume Upload] User from auth:', req.user ? `${req.user.email} (${req.user._id})` : 'No user');
    console.log('[Resume Upload] File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      console.log('[Resume Upload] ERROR: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?._id || req.body.userId;
    if (!userId) {
      console.log('[Resume Upload] ERROR: No user ID found');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('[Resume Upload] Uploading to GridFS...');
    // Upload file to GridFS
    const fileData = await uploadToGridFS(req.file, {
      userId: userId,
      fileType: 'resume'
    });
    console.log('[Resume Upload] GridFS upload successful:', fileData);

    // Update user with new resume reference
    const user = await User.findById(userId);
    if (!user) {
      console.log('[Resume Upload] ERROR: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old resume if it exists
    if (user.resume && user.resume.fileId) {
      try {
        console.log('[Resume Upload] Deleting old resume:', user.resume.fileId);
        await deleteFromGridFS(user.resume.fileId);
      } catch (error) {
        console.warn('[Resume Upload] Failed to delete old resume:', error.message);
      }
    }

    // Save new resume reference
    user.resume = {
      fileId: fileData.fileId,
      filename: fileData.filename,
      originalName: fileData.originalName,
      contentType: fileData.contentType,
      uploadDate: new Date()
    };

    console.log('[Resume Upload] Saving user with new resume data...');
    await user.save();
    console.log('[Resume Upload] User saved successfully');

    const responseData = {
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        url: `/api/files/file/${fileData.fileId}`,
        fileId: fileData.fileId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        contentType: fileData.contentType
      }
    };
    
    console.log('[Resume Upload] SUCCESS - Sending response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('[Resume Upload] FATAL ERROR:', error);
    console.error('[Resume Upload] Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to upload resume' });
  }
});

// Get file (profile photo or CV)
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log('[File Download] Requested file ID:', fileId);

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.log('[File Download] ERROR: Invalid file ID format');
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    console.log('[File Download] Getting file info from GridFS...');
    // Get file info
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      console.log('[File Download] ERROR: File not found in GridFS');
      return res.status(404).json({ error: 'File not found' });
    }
    console.log('[File Download] File info found:', fileInfo);

    console.log('[File Download] Downloading file buffer from GridFS...');
    // Download file from GridFS
    const fileBuffer = await downloadFromGridFS(fileId);
    console.log('[File Download] File buffer size:', fileBuffer.length);

    // Set appropriate headers
    res.set({
      'Content-Type': fileInfo.contentType || 'application/octet-stream',
      'Content-Length': fileBuffer.length,
      'Content-Disposition': `inline; filename="${fileInfo.metadata.originalName}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });

    console.log('[File Download] SUCCESS: Sending file to client');
    res.send(fileBuffer);

  } catch (error) {
    console.error('[File Download] FATAL ERROR:', error);
    res.status(500).json({ error: error.message || 'Failed to download file' });
  }
});

// Get user's profile photo
router.get('/profile-photo/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.profilePhoto || !user.profilePhoto.fileId) {
      return res.status(404).json({ error: 'Profile photo not found' });
    }

    // Redirect to the generic file endpoint
    res.redirect(`/api/files/file/${user.profilePhoto.fileId}`);

  } catch (error) {
    console.error('Profile photo retrieval error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve profile photo' });
  }
});

// Get user's CV
router.get('/cv/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.cv || !user.cv.fileId) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // Redirect to the generic file endpoint
    res.redirect(`/api/files/file/${user.cv.fileId}`);

  } catch (error) {
    console.error('CV retrieval error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve CV' });
  }
});

// Delete file
router.delete('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?._id || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Check if user owns this file
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileIdStr = fileId.toString();
    let isOwner = false;
    let fileType = '';

    if (user.profilePhoto && user.profilePhoto.fileId && user.profilePhoto.fileId.toString() === fileIdStr) {
      isOwner = true;
      fileType = 'profilePhoto';
    } else if (user.cv && user.cv.fileId && user.cv.fileId.toString() === fileIdStr) {
      isOwner = true;
      fileType = 'cv';
    }

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete from GridFS
    await deleteFromGridFS(fileId);

    // Remove reference from user
    if (fileType === 'profilePhoto') {
      user.profilePhoto = undefined;
    } else if (fileType === 'cv') {
      user.cv = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: `${fileType === 'profilePhoto' ? 'Profile photo' : 'CV'} deleted successfully`
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

// Get user's file info (without downloading)
router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('profilePhoto cv');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fileInfo = {
      profilePhoto: user.profilePhoto ? {
        hasFile: true,
        filename: user.profilePhoto.filename,
        originalName: user.profilePhoto.originalName,
        contentType: user.profilePhoto.contentType,
        uploadDate: user.profilePhoto.uploadDate,
        url: `/api/files/profile-photo/${userId}`
      } : { hasFile: false },
      cv: user.cv ? {
        hasFile: true,
        filename: user.cv.filename,
        originalName: user.cv.originalName,
        contentType: user.cv.contentType,
        uploadDate: user.cv.uploadDate,
        url: `/api/files/cv/${userId}`
      } : { hasFile: false }
    };

    res.json(fileInfo);

  } catch (error) {
    console.error('File info retrieval error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve file info' });
  }
});

module.exports = router;