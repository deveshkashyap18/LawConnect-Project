import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/lawconnect";

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected successfully to ${mongoose.connection.host}`);
};

export { connectDB };
