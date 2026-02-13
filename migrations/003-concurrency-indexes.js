const createConcurrencyIndexes = async (db) => {
  console.log('Creating concurrency control indexes...');

  const createIndex = async (collection, indexSpec, options = {}) => {
    try {
      await db.collection(collection).createIndex(indexSpec, options);
    } catch (error) {
      if (error.code === 85) {
        console.log(`Index exists: ${collection}`);
      } else {
        throw error;
      }
    }
  };
  await createIndex('lessons', { version: 1 });
  await createIndex('programs', { version: 1 });
  await createIndex('terms', { version: 1 });
  console.log('✓ Version indexes for optimistic locking');

  await createIndex('lessons', { termId: 1, status: 1, lessonNumber: 1 });
  await createIndex('lessons', { status: 1, publishAt: 1, publishedAt: -1 });
  console.log('✓ Lesson compound indexes');

  await createIndex('locks', { name: 1 }, { unique: true });
  await createIndex('locks', { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await createIndex('locks', { name: 1, expiresAt: 1 });
  console.log('✓ Distributed lock indexes');


  await createIndex('programs', { status: 1, createdAt: -1, publishedAt: -1 });
  await createIndex('terms', { programId: 1, createdAt: -1 });
  console.log('✓ Performance indexes');


  await createIndex('users', { isActive: 1, role: 1 }, { 
    partialFilterExpression: { isActive: true } 
  });
  
  await createIndex('programs', { status: 1, publishedAt: -1 }, { 
    name: 'status_publishedAt_partial_idx',
    partialFilterExpression: { status: { $in: ['published', 'scheduled'] } } 
  });
  console.log('✓ Partial indexes for active records');

  console.log('Concurrency indexes complete');
};

module.exports = {
  up: createConcurrencyIndexes,
  description: 'Create indexes for better concurrency control'
};