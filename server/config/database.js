const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://kusheendhar942_db_user:UadXZQo4worTrRdc@cluster0.m7tifea.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Server will continue to run, but database operations will fail.');
    console.log('Please make sure MongoDB is running and MONGO_URI is correct.');
  }
};

module.exports = connectDB;

