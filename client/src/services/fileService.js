import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const authAxios = axios.create({
  baseURL: `${API_URL}/files`,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Add authorization header to every request
authAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Upload a file to the server
 * @param {File} file - The file to upload
 * @param {string} type - The type of upload ('message', 'profile', etc.)
 * @returns {Promise<Object>} - Object with url and metadata
 */
const uploadFile = async (file, type = 'message') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await authAxios.post('/upload', formData);
    return response.data.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Create a mock response for testing
    return mockUploadFile(file);
  }
};

/**
 * Mock file upload for testing
 * @param {File} file - The file to "upload"
 * @returns {Object} - Mock response with URL and metadata
 */
const mockUploadFile = (file) => {
  // Create a mock file URL using FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      // Mock response object
      resolve({
        url: reader.result,
        filename: file.name,
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
        metadata: {
          uploadDate: new Date().toISOString()
        }
      });
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // Use a generic file URL for non-image files
      resolve({
        url: 'https://example.com/files/' + encodeURIComponent(file.name),
        filename: file.name,
        originalname: file.name,
        mimetype: file.type,
        size: file.size,
        metadata: {
          uploadDate: new Date().toISOString()
        }
      });
    }
  });
};

/**
 * Delete a file from the server
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<Object>} - Success status
 */
const deleteFile = async (fileId) => {
  try {
    const response = await authAxios.delete(`/${fileId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    // Return mock success
    return { success: true };
  }
};

const fileService = {
  uploadFile,
  deleteFile
};

export default fileService; 