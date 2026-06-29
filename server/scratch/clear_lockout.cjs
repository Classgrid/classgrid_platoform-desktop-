const mongoose = require('mongoose');

const MONGO_URI = "mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

async function clearLockout() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");
    
    const User = mongoose.connection.collection('users');
    
    // Clear lockout fields for Neha
    const result = await User.updateOne(
      { email: "nehasharmaking25@gmail.com" },
      { 
        $set: { failedLoginAttempts: 0 },
        $unset: { lockedUntil: "", lockUntil: "" }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log("Successfully cleared the lockout for nehasharmaking25@gmail.com");
    } else {
      console.log("No lockout to clear, or user not found.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

clearLockout();
