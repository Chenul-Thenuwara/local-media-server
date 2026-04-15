import mongoose from 'mongoose';

const connectDB = async (retries = 5, delay = 5000) => {
  const mongoURI = process.env.MONGO_URI || 'mongodb+srv://chenul:Helsinki@lms-cluster.cwkzgk5.mongodb.net/?appName=lms-cluster';

  while (retries > 0) {
    try {
      await mongoose.connect(mongoURI);
      console.log('MongoDB Connected...');
      return;
    } catch (err) {
      console.error(`MongoDB connection error (Retries left: ${retries - 1}):`, err);
      retries -= 1;
      if (retries === 0) {
        console.error('Detailed Error:', err);
        // Do not exit, just log final failure. The app will stay up but API calls might fail.
        // process.exit(1); 
        return;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

export default connectDB;
