const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB connection or in-memory MongoDB for development
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker';
    
    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Using in-memory mock data instead of MongoDB');
    return false;
  }
};

module.exports = connectDB;
