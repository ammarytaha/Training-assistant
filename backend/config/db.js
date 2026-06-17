const mongoose = require('mongoose');
const env = require('./env');

// Connect to MongoDB Atlas. Retries are handled by the driver; we just
// surface a clear error and exit if the very first connect fails.
async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
