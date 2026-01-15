/**
 * File Upload Service using MongoDB GridFS
 */
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

let gfsBucket;

// Initialize GridFS bucket
const initGridFS = () => {
  const conn = mongoose.connection;
  
  conn.once('open', () => {
    // Initialize GridFS bucket
    gfsBucket = new GridFSBucket(conn.db, {
      bucketName: 'assets'
    });
  });
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Upload file to GridFS
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File mimetype
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} - File ID
 */
const uploadToGridFS = (buffer, filename, mimetype, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    // Generate unique filename
    const fileId = new mongoose.Types.ObjectId();
    const ext = path.extname(filename);
    const uniqueFilename = `${fileId}${ext}`;

    const uploadStream = gfsBucket.openUploadStream(uniqueFilename, {
      _id: fileId,
      metadata: {
        originalName: filename,
        mimetype,
        uploadDate: new Date(),
        ...metadata
      }
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve(fileId.toString());
    });

    // Write buffer to GridFS
    uploadStream.end(buffer);
  });
};

/**
 * Get file from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<Stream>} - File stream
 */
const getFileFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('GridFS not initialized'));
    }

    try {
      const objectId = new mongoose.Types.ObjectId(fileId);
      const downloadStream = gfsBucket.openDownloadStream(objectId);
      
      downloadStream.on('error', (error) => {
        reject(error);
      });

      resolve(downloadStream);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get file info from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} - File info
 */
const getFileInfo = async (fileId) => {
  if (!gfsBucket) {
    throw new Error('GridFS not initialized');
  }

  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await gfsBucket.find({ _id: objectId }).toArray();
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    return files[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Delete file from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<void>}
 */
const deleteFileFromGridFS = async (fileId) => {
  if (!gfsBucket) {
    throw new Error('GridFS not initialized');
  }

  try {
    const objectId = new mongoose.Types.ObjectId(fileId);
    await gfsBucket.delete(objectId);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  initGridFS,
  upload,
  uploadToGridFS,
  getFileFromGridFS,
  getFileInfo,
  deleteFileFromGridFS
};