const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = "mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

async function resetPwd() {
  try {
    await mongoose.connect(MONGO_URI);
    const User = mongoose.connection.collection('users');
    
    const newPassword = "Nikhil@5049";
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await User.updateOne(
      { email: "nehasharmaking25@gmail.com" },
      { 
        $set: { 
          password: hashedPassword,
          loginAttempts: 0,
          lockUntil: null
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log("Successfully reset password to Nikhil@5049 for nehasharmaking25@gmail.com");
    } else {
      console.log("No user found or password was already that hash.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

resetPwd();
