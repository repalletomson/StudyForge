/**
 * Database seed script - Creates comprehensive sample data as required by assignment
 */
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("../models/User");
const Topic = require("../models/Topic");
const Program = require("../models/Program");
const Term = require("../models/Term");
const Lesson = require("../models/Lesson");
const ProgramAsset = require("../models/ProgramAsset");
const LessonAsset = require("../models/LessonAsset");

const logger = require("../config/logger");

/**
 * Connect to database
 */
const connectDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/cms_db";
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("Connected to MongoDB for seeding");
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

/**
 * Clear existing data
 */
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Topic.deleteMany({});
    await Program.deleteMany({});
    await Term.deleteMany({});
    await Lesson.deleteMany({});
    await ProgramAsset.deleteMany({});
    await LessonAsset.deleteMany({});
    logger.info("Cleared existing data");
  } catch (error) {
    logger.error("Error clearing data:", error);
    throw error;
  }
};

/**
 * Create users for all roles
 */
const createUsers = async () => {
  try {
    const users = [
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        passwordHash: "admin123",
        role: "admin",
        isActive: true,
        emailVerified: true,
      },
      {
        firstName: "Editor",
        lastName: "User",
        email: "editor@example.com",
        passwordHash: "editor123",
        role: "editor",
        isActive: true,
        emailVerified: true,
      },
      {
        firstName: "Viewer",
        lastName: "User",
        email: "viewer@example.com",
        passwordHash: "viewer123",
        role: "viewer",
        isActive: true,
        emailVerified: true,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }

    logger.info(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    logger.error("Error creating users:", error);
    throw error;
  }
};

/**
 * Create topics
 */
const createTopics = async () => {
  try {
    const topics = [
      {
        name: "Technology",
        description: "Programming, web development, software engineering, and tech skills",
        isActive: true,
      },
      {
        name: "Business",
        description: "Entrepreneurship, marketing, management, and business skills",
        isActive: true,
      },
      {
        name: "Design",
        description: "UI/UX, graphic design, web design, and creative skills",
        isActive: true,
      },
      {
        name: "Science",
        description: "Mathematics, physics, chemistry, and scientific concepts",
        isActive: true,
      },
      {
        name: "Mathematics",
        description: "Algebra, calculus, statistics, and mathematical concepts",
        isActive: true,
      },
      {
        name: "Language Arts",
        description: "English, writing, literature, and communication skills",
        isActive: true,
      },
      {
        name: "Data Science",
        description: "Data analysis, machine learning, statistics, and data visualization",
        isActive: true,
      },
      {
        name: "Digital Marketing",
        description: "SEO, social media marketing, content marketing, and online advertising",
        isActive: true,
      },
      {
        name: "Personal Development",
        description: "Leadership, productivity, communication, and self-improvement",
        isActive: true,
      },
      {
        name: "Health & Fitness",
        description: "Exercise, nutrition, wellness, and healthy lifestyle",
        isActive: true,
      },
      {
        name: "Finance",
        description: "Personal finance, investing, accounting, and financial planning",
        isActive: true,
      },
      {
        name: "Arts & Crafts",
        description: "Drawing, painting, crafting, and artistic skills",
        isActive: true,
      }
    ];

    const createdTopics = await Topic.insertMany(topics);
    logger.info(`Created ${createdTopics.length} topics`);
    return createdTopics;
  } catch (error) {
    logger.error("Error creating topics:", error);
    throw error;
  }
};

/**
 * Create programs with multi-language support
 */
const createPrograms = async (topics) => {
  try {
    const programs = [
      {
        title: "Full Stack Web Development",
        description:
          "Complete course on modern web development with React, Node.js, and MongoDB",
        languagePrimary: "en",
        languagesAvailable: ["en", "hi"],
        status: "draft",
        topicIds: [topics[0]._id, topics[6]._id], // Technology, Data Science
      },
      {
        title: "Digital Marketing Mastery",
        description:
          "Learn digital marketing strategies, SEO, social media marketing, and analytics",
        languagePrimary: "en",
        languagesAvailable: ["en", "te", "hi"],
        status: "draft",
        topicIds: [topics[1]._id, topics[7]._id], // Business, Digital Marketing
      },
      {
        title: "UI/UX Design Fundamentals",
        description:
          "Master the principles of user interface and user experience design",
        languagePrimary: "en",
        languagesAvailable: ["en", "hi"],
        status: "draft",
        topicIds: [topics[2]._id, topics[0]._id], // Design, Technology
      },
      {
        title: "Data Science with Python",
        description:
          "Learn data analysis, machine learning, and data visualization with Python",
        languagePrimary: "en",
        languagesAvailable: ["en", "hi", "te"],
        status: "draft",
        topicIds: [topics[6]._id, topics[4]._id, topics[0]._id], // Data Science, Mathematics, Technology
      }
    ];

    const createdPrograms = await Program.insertMany(programs);
    logger.info(`Created ${createdPrograms.length} programs`);
    return createdPrograms;
  } catch (error) {
    logger.error("Error creating programs:", error);
    throw error;
  }
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    logger.info("Starting comprehensive database seeding...");

    await connectDatabase();
    await clearData();

    const users = await createUsers();
    const topics = await createTopics();
    const programs = await createPrograms(topics);

    logger.info("Comprehensive database seeding completed successfully!");
    logger.info("");
    logger.info("Sample Data Created:");
    logger.info(`- ${users.length} users (admin, editor, viewer)`);
    logger.info(`- ${topics.length} topics`);
    logger.info(`- ${programs.length} programs with multi-language support`);
    logger.info("");
    logger.info("Login Credentials:");
    logger.info("Admin: admin@example.com / admin123");
    logger.info("Editor: editor@example.com / editor123");
    logger.info("Viewer: viewer@example.com / viewer123");
  } catch (error) {
    logger.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the seed script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };