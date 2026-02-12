
const mongoose = require('mongoose');
const logger = require('../config/logger');
const withTransaction = async (operation, options = {}) => {
  const session = await mongoose.startSession();
  
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
    maxCommitTimeMS: 1000,
    ...options
  };

  try {
    session.startTransaction(transactionOptions);
    
    const result = await operation(session);
    
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};
const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 1000,
    retryCondition = (error) => error.code === 11000 || error.name === 'VersionError'
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.warn(`Retrying operation (attempt ${attempt + 1}/${maxRetries + 1})`, {
        error: error.message,
        delay
      });
    }
  }
  
  throw lastError;
};

const withOptimisticLocking = async (document, updateFn) => {
  return withRetry(async () => {
    const fresh = await document.constructor.findById(document._id);
    if (!fresh) {
      throw new Error('Document not found');
    }

    await updateFn(fresh);
    

    return await fresh.save();
  }, {
    retryCondition: (error) => error.name === 'VersionError'
  });
};

const atomicIncrement = async (model, filter, field, increment = 1) => {
  return withRetry(async () => {
    return await model.findOneAndUpdate(
      filter,
      { $inc: { [field]: increment } },
      { new: true, upsert: false }
    );
  });
};

const withDistributedLock = async (lockName, ttl, operation) => {
  const Lock = mongoose.model('Lock');
  const lockId = new mongoose.Types.ObjectId();
  const expiresAt = new Date(Date.now() + ttl);
  
  try {
    await Lock.create({
      _id: lockId,
      name: lockName,
      expiresAt
    });
    
    logger.debug(`Acquired lock: ${lockName}`);
    return await operation();
    
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`Lock already held: ${lockName}`);
    }
    throw error;
  } finally {
    try {
      await Lock.deleteOne({ _id: lockId });
      logger.debug(`Released lock: ${lockName}`);
    } catch (releaseError) {
      logger.error(`Failed to release lock ${lockName}:`, releaseError);
    }
  }
};
const bulkWrite = async (model, operations, options = {}) => {
  const {
    ordered = false,
    bypassDocumentValidation = false,
    maxBatchSize = 1000
  } = options;
  
  return withRetry(async () => {
    return await model.bulkWrite(operations, {
      ordered,
      bypassDocumentValidation,
      maxBatchSize
    });
  });
};

module.exports = {
  withTransaction,
  withRetry,
  withOptimisticLocking,
  atomicIncrement,
  withDistributedLock,
  bulkWrite
};