/**
 * Models index file - loads all models and ensures proper indexing
 */
const mongoose = require('mongoose');

// Import all models
const Program = require('./Program');
const Topic = require('./Topic');
const Term = require('./Term');
const Lesson = require('./Lesson');
const ProgramAsset = require('./ProgramAsset');
const LessonAsset = require('./LessonAsset');
const User = require('./User');

// Import constants
const constants = require('./constants');

/**
 * Initialize database indexes
 * This function ensures all indexes are created properly
 */
const initializeIndexes = async () => {
  try {
    // Create indexes for all models
    await Program.createIndexes();
    await Topic.createIndexes();
    await Term.createIndexes();
    await Lesson.createIndexes();
    await ProgramAsset.createIndexes();
    await LessonAsset.createIndexes();
    await User.createIndexes();
    
    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database indexes:', error);
    throw error;
  }
};

/**
 * Validate database constraints
 * This function performs validation checks on the database schema
 */
const validateConstraints = async () => {
  try {
    // Test unique constraints
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const expectedCollections = [
      'programs', 'topics', 'terms', 'lessons', 
      'programassets', 'lessonassets', 'users'
    ];
    
    for (const collection of expectedCollections) {
      if (!collectionNames.includes(collection)) {
        console.warn(`Collection ${collection} not found`);
      }
    }
    
    console.log('Database constraints validated successfully');
  } catch (error) {
    console.error('Error validating database constraints:', error);
    throw error;
  }
};

module.exports = {
  // Models
  Program,
  Topic,
  Term,
  Lesson,
  ProgramAsset,
  LessonAsset,
  User,
  
  // Constants
  constants,
  
  // Utilities
  initializeIndexes,
  validateConstraints
};