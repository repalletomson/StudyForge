require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_COLLECTION = 'migrations';

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for migrations');
    return { client, db: client.db() };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

const getCompletedMigrations = async (db) => {
  try {
    const migrations = await db.collection(MIGRATIONS_COLLECTION)
      .find({}, { projection: { name: 1 } })
      .toArray();
    return migrations.map(m => m.name);
  } catch (error) {
    return [];
  }
};

const markMigrationCompleted = async (db, migrationName, description) => {
  await db.collection(MIGRATIONS_COLLECTION).insertOne({
    name: migrationName,
    description: description,
    completedAt: new Date()
  });
};

const getMigrationFiles = () => {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js') && file !== 'run.js')
    .sort();
  
  return files;
};

const runMigration = async (db, migrationFile) => {
  const migrationPath = path.join(__dirname, migrationFile);
  const migration = require(migrationPath);
  
  console.log(`\n🔄 Running migration: ${migrationFile}`);
  console.log(`📝 Description: ${migration.description}`);
  
  try {
    await migration.up(db);
    await markMigrationCompleted(db, migrationFile, migration.description);
    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error);
    throw error;
  }
};

const runMigrations = async () => {
  const { client, db } = await connectToDatabase();
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    const completedMigrations = await getCompletedMigrations(db);
    console.log(`📋 Found ${completedMigrations.length} completed migrations`);
    
    const migrationFiles = getMigrationFiles();
    console.log(`� Found ${migrationFiles.length} migration files`);
    
    const pendingMigrations = migrationFiles.filter(file => 
      !completedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✨ All migrations are up to date!');
      return;
    }
    
    console.log(`⏳ Running ${pendingMigrations.length} pending migrations...\n`);
    
    for (const migrationFile of pendingMigrations) {
      await runMigration(db, migrationFile);
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
    const allCompletedMigrations = await getCompletedMigrations(db);
    console.log('\n� Migration Status:');
    for (const migration of allCompletedMigrations) {
      console.log(`   ✅ ${migration}`);
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n� Database connection closed');
  }
};

const showMigrationStatus = async () => {
  const { client, db } = await connectToDatabase();
  
  try {
    const completedMigrations = await getCompletedMigrations(db);
    const migrationFiles = getMigrationFiles();
    
    console.log('\n📊 Migration Status:');
    console.log(`Total migrations: ${migrationFiles.length}`);
    console.log(`Completed: ${completedMigrations.length}`);
    console.log(`Pending: ${migrationFiles.length - completedMigrations.length}\n`);
    
    for (const file of migrationFiles) {
      const status = completedMigrations.includes(file) ? '✅' : '⏳';
      console.log(`   ${status} ${file}`);
    }
    
  } finally {
    await client.close();
  }
};

const command = process.argv[2];

if (command === 'status') {
  showMigrationStatus();
} else {
  runMigrations();
}

module.exports = {
  runMigrations,
  showMigrationStatus
};