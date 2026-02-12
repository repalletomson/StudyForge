const mongoose = require('mongoose');

const Program = require('./Program');
const Topic = require('./Topic');
const Term = require('./Term');
const Lesson = require('./Lesson');
const ProgramAsset = require('./ProgramAsset');
const LessonAsset = require('./LessonAsset');
const User = require('./User');

const constants = require('./constants');

const initializeIndexes = async () => {
  try {
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

const validateConstraints = async () => {
  try {
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
  Program,
  Topic,
  Term,
  Lesson,
  ProgramAsset,
  LessonAsset,
  User,
  
  constants,
  
  initializeIndexes,
  validateConstraints
};