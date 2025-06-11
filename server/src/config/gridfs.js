const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');

let gridfsBucket;

// Initialize GridFS when MongoDB connection is ready
mongoose.connection.once('open', () => {
  console.log('📁 Initializing GridFS for file storage...');
  gridfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('✅ GridFS initialized successfully');
});

// Configure multer for memory storage (we'll stream to GridFS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images for profile photos
    if (file.fieldname === 'profilePicture') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile photo must be an image file'), false);
      }
    }
    // Allow PDFs and Word docs for CVs and resumes
    else if (file.fieldname === 'cv' || file.fieldname === 'resume') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('CV/Resume must be a PDF or Word document'), false);
      }
    }
    else {
      cb(new Error('Unknown file field'), false);
    }
  }
});

// Helper function to upload file to GridFS
const uploadToGridFS = (file, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      metadata: {
        originalName: file.originalname,
        uploadDate: new Date(),
        contentType: file.mimetype,
        ...metadata
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id,
        filename: filename,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size
      });
    });

    // Stream the file buffer to GridFS
    uploadStream.end(file.buffer);
  });
};

// Helper function to download file from GridFS
const downloadFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    const downloadStream = gridfsBucket.openDownloadStream(mongoose.Types.ObjectId(fileId));
    const chunks = [];

    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('error', reject);
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

// Helper function to delete file from GridFS
const deleteFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    gridfsBucket.delete(mongoose.Types.ObjectId(fileId), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file info from GridFS
const getFileInfo = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gridfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    gridfsBucket.find({ _id: mongoose.Types.ObjectId(fileId) }).toArray((error, files) => {
      if (error) {
        reject(error);
      } else if (!files || files.length === 0) {
        reject(new Error('File not found'));
      } else {
        resolve(files[0]);
      }
    });
  });
};

module.exports = {
  upload,
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  getFileInfo,
  gridfsBucket: () => gridfsBucket
};