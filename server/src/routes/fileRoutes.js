const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { upload, uploadToGridFS, downloadFromGridFS, deleteFromGridFS, getFileInfo } = require('../config/gridfs');

// Upload profile photo
router.post('/upload/profile-photo', upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Upload file to GridFS
    const fileData = await uploadToGridFS(req.file, {
      userId: userId,
      fileType: 'profilePhoto'
    });

    // Update user with new profile photo reference
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile photo if it exists
    if (user.profilePhoto && user.profilePhoto.fileId) {
      try {
        await deleteFromGridFS(user.profilePhoto.fileId);
      } catch (error) {
        console.warn('Failed to delete old profile photo:', error.message);
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

    await user.save();

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      file: {
        fileId: fileData.fileId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        contentType: fileData.contentType
      }
    });

  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile photo' });
  }
});

// Upload CV
router.post('/upload/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.id || req.body.userId;
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

// Get file (profile photo or CV)
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Get file info
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Download file from GridFS
    const fileBuffer = await downloadFromGridFS(fileId);

    // Set appropriate headers
    res.set({
      'Content-Type': fileInfo.contentType || 'application/octet-stream',
      'Content-Length': fileBuffer.length,
      'Content-Disposition': `inline; filename="${fileInfo.metadata.originalName}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('File download error:', error);
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
    const userId = req.user?.id || req.body.userId;

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