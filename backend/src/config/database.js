
const mongoose = require("mongoose");
const logger = require("./logger");

const connectDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/cms_db";

    await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      readPreference: 'primaryPreferred',
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000
      },
      readConcern: {
        level: 'local'
      }
    });

    logger.info("MongoDB connected successfully", {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
  }
};

const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    return state === 1;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
};
