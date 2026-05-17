import mongoose from "mongoose";

const connectDB = async (retryCount = 5) => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/lawconnect";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // Wait 15s for primary node
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    console.log(`MongoDB connected successfully to ${mongoose.connection.host}`);
  } catch (error) {
    if (retryCount > 0) {
      console.warn(`MongoDB connection failed. Retrying... (${retryCount} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount - 1);
    }
    throw error;
  }
};

export { connectDB };
