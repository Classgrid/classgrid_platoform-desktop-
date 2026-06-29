const mongoose = require('mongoose');

const MONGO_URI = "mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

async function clearLockout() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const User = mongoose.connection.collection('users');
    
    // Clear lockout fields for Neha using the CORRECT field names
    const result = await User.updateOne(
      { email: "nehasharmaking25@gmail.com" },
      { 
        $set: { loginAttempts: 0, lockUntil: null }
      }
    );
    
    console.log("Successfully cleared the lockout for nehasharmaking25@gmail.com");
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

clearLockout();
