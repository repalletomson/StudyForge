/**
 * Migration 001: Create Core Database Indexes
 * Creates essential indexes for optimal query performance
 */

const createCoreIndexes = async (db) => {
  console.log('Creating core database indexes...');

  // Helper function to create index safely
  const createIndexSafely = async (collection, indexSpec, options = {}) => {
    try {
      await db.collection(collection).createIndex(indexSpec, options);
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log(`⚠️  Index already exists for ${collection}:`, Object.keys(indexSpec).join(', '));
      } else {
        throw error;
      }
    }
  };

  // Users collection indexes
  await createIndexSafely('users', { email: 1 }, { unique: true });
  await createIndexSafely('users', { role: 1, isActive: 1 });
  await createIndexSafely('users', { createdAt: -1 });
  console.log('✓ Users indexes created');

  // Topics collection indexes
  await createIndexSafely('topics', { name: 1 }, { unique: true });
  await createIndexSafely('topics', { isActive: 1, name: 1 });
  console.log('✓ Topics indexes created');

  // Programs collection indexes
  await createIndexSafely('programs', { title: 1 });
  await createIndexSafely('programs', { status: 1, publishedAt: -1 });
  await createIndexSafely('programs', { topicIds: 1 });
  await createIndexSafely('programs', { languagePrimary: 1, languagesAvailable: 1 });
  await createIndexSafely('programs', { createdAt: -1 });
  await createIndexSafely('programs', { 
    title: 'text', 
    description: 'text' 
  }, { 
    name: 'programs_text_search' 
  });
  console.log('✓ Programs indexes created');

  // Terms collection indexes
  await createIndexSafely('terms', { programId: 1, termNumber: 1 }, { unique: true });
  await createIndexSafely('terms', { programId: 1 });
  console.log('✓ Terms indexes created');

  // Lessons collection indexes
  await createIndexSafely('lessons', { termId: 1, lessonNumber: 1 }, { unique: true });
  await createIndexSafely('lessons', { termId: 1 });
  await createIndexSafely('lessons', { status: 1, publishAt: 1 });
  await createIndexSafely('lessons', { status: 1, publishedAt: -1 });
  await createIndexSafely('lessons', { contentType: 1 });
  await createIndexSafely('lessons', { isPaid: 1 });
  await createIndexSafely('lessons', { 
    title: 'text', 
    'articleContentByLanguage.en': 'text' 
  }, { 
    name: 'lessons_text_search' 
  });
  console.log('✓ Lessons indexes created');

  console.log('Core indexes migration completed successfully!');
};

module.exports = {
  up: createCoreIndexes,
  description: 'Create core database indexes for Users, Topics, Programs, Terms, and Lessons'
};