/**
 * Migration 002: Create Asset Management Indexes
 * Creates indexes for program assets and lesson assets collections
 */

const createAssetIndexes = async (db) => {
  console.log('Creating asset management indexes...');

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

  // Program Assets collection indexes
  await createIndexSafely('programassets', { programId: 1, language: 1, variant: 1 }, { unique: true });
  await createIndexSafely('programassets', { programId: 1 });
  await createIndexSafely('programassets', { language: 1 });
  await createIndexSafely('programassets', { variant: 1 });
  await createIndexSafely('programassets', { assetType: 1 });
  await createIndexSafely('programassets', { createdAt: -1 });
  console.log('✓ Program Assets indexes created');

  // Lesson Assets collection indexes
  await createIndexSafely('lessonassets', { lessonId: 1, language: 1, variant: 1 }, { unique: true });
  await createIndexSafely('lessonassets', { lessonId: 1 });
  await createIndexSafely('lessonassets', { language: 1 });
  await createIndexSafely('lessonassets', { variant: 1 });
  await createIndexSafely('lessonassets', { assetType: 1 });
  await createIndexSafely('lessonassets', { createdAt: -1 });
  console.log('✓ Lesson Assets indexes created');

  // Compound indexes for efficient asset queries
  await createIndexSafely('programassets', { 
    programId: 1, 
    assetType: 1, 
    language: 1 
  });
  await createIndexSafely('lessonassets', { 
    lessonId: 1, 
    assetType: 1, 
    language: 1 
  });
  console.log('✓ Compound asset indexes created');

  // Performance indexes for asset management queries
  await createIndexSafely('programassets', { url: 1 });
  await createIndexSafely('lessonassets', { url: 1 });
  console.log('✓ Asset URL indexes created');

  console.log('Asset indexes migration completed successfully!');
};

module.exports = {
  up: createAssetIndexes,
  description: 'Create indexes for Program Assets and Lesson Assets collections'
};