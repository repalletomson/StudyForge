const createAssetIndexes = async (db) => {
  console.log('Creating asset indexes...');

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

  await createIndex('programassets', { 
    programId: 1, 
    language: 1, 
    variant: 1, 
    assetType: 1 
  }, { unique: true });
  await createIndex('programassets', { programId: 1 });
  console.log('✓ Program assets indexes');

  await createIndex('lessonassets', { 
    lessonId: 1, 
    language: 1, 
    variant: 1, 
    assetType: 1 
  }, { unique: true });
  await createIndex('lessonassets', { lessonId: 1 });
  console.log('✓ Lesson assets indexes');

  console.log('Asset indexes complete');
};

module.exports = {
  up: createAssetIndexes,
  description: 'Create asset indexes'
};