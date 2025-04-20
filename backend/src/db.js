// db.js (or inside your server.js file)
import mongoose from "mongoose";

// Replace with your MongoDB connection string
const MONGO_URI = 'mongodb+srv://shoaibqu7714:K4TPZ7GCaSBYKdMB@cluster0.hygcli5.mongodb.net/zoom-db?retryWrites=true&w=majority&appName=Cluster0'; // For local MongoDB
// or for MongoDB Atlas: 'mongodb+srv://<username>:<password>@cluster.mongodb.net/your_db'

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit process on failure
  }
};

export default connectDB;
