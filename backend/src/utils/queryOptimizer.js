/**
 * Database Query Optimization Utilities
 */

/**
 * Pagination helper with performance optimizations
 */
const createPaginationPipeline = (page = 1, limit = 20, maxLimit = 100) => {
  const parsedLimit = Math.min(parseInt(limit) || 20, maxLimit);
  const skip = (parseInt(page) - 1) * parsedLimit;
  
  return {
    skip,
    limit: parsedLimit,
    pipeline: [
      { $skip: skip },
      { $limit: parsedLimit }
    ]
  };
};

/**
 * Optimized aggregation pipeline for programs with caching
 */
const createProgramsAggregation = (filters = {}) => {
  const pipeline = [];
  
  // Match stage - apply filters early
  const matchStage = { status: 'published' };
  
  if (filters.language) {
    matchStage.languagePrimary = filters.language;
  }
  
  if (filters.topicIds && filters.topicIds.length > 0) {
    matchStage.topicIds = { $in: filters.topicIds };
  }
  
  pipeline.push({ $match: matchStage });
  
  // Lookup only necessary fields
  pipeline.push({
    $lookup: {
      from: 'terms',
      localField: '_id',
      foreignField: 'programId',
      as: 'terms',
      pipeline: [
        { $match: { status: { $ne: 'archived' } } },
        { $project: { _id: 1, programId: 1 } }
      ]
    }
  });
  
  // Count published lessons efficiently
  pipeline.push({
    $lookup: {
      from: 'lessons',
      let: { termIds: '$terms._id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ['$termId', '$$termIds'] },
                { $eq: ['$status', 'published'] }
              ]
            }
          }
        },
        { $project: { _id: 1 } }
      ],
      as: 'publishedLessons'
    }
  });
  
  // Filter programs with published lessons
  pipeline.push({
    $match: { 'publishedLessons.0': { $exists: true } }
  });
  
  // Add computed fields
  pipeline.push({
    $addFields: {
      publishedLessonsCount: { $size: '$publishedLessons' }
    }
  });
  
  // Clean up unnecessary fields
  pipeline.push({
    $unset: ['publishedLessons', 'terms']
  });
  
  return pipeline;
};

/**
 * Cache key generator for consistent caching
 */
const generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
};

/**
 * Query performance logger
 */
const logQueryPerformance = (queryName, startTime, resultCount = 0) => {
  const duration = Date.now() - startTime;
  
  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName} took ${duration}ms, returned ${resultCount} results`);
  }
  
  return duration;
};

module.exports = {
  createPaginationPipeline,
  createProgramsAggregation,
  generateCacheKey,
  logQueryPerformance
};