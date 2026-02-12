const createCoreIndexes = async (db) => {
  console.log('Creating core indexes...');

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

  await createIndex('users', { email: 1 }, { unique: true });
  await createIndex('users', { role: 1, isActive: 1 });
  console.log('✓ Users indexes');

  await createIndex('topics', { name: 1 }, { unique: true });
  await createIndex('topics', { isActive: 1 });
  console.log('✓ Topics indexes');

  await createIndex('programs', { status: 1, publishedAt: -1 });
  await createIndex('programs', { topicIds: 1 });
  await createIndex('programs', { createdAt: -1 });
  await createIndex('programs', { title: 'text', description: 'text' });
  console.log('✓ Programs indexes');

  await createIndex('terms', { programId: 1, termNumber: 1 }, { unique: true });
  await createIndex('terms', { programId: 1 });
  console.log('✓ Terms indexes');

  await createIndex('lessons', { termId: 1, lessonNumber: 1 }, { unique: true });
  await createIndex('lessons', { status: 1, publishAt: 1 });
  await createIndex('lessons', { status: 1, publishedAt: -1 });
  console.log('✓ Lessons indexes');

  console.log('Core indexes complete');
};

module.exports = {
  up: createCoreIndexes,
  description: 'Create core database indexes'
};