import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    
    const email = 'eng_admission@classgrid.in';
    const newPassword = 'Nikhil@5049';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: hashedPassword, mustResetPassword: false, verification_status: 'verified', status: 'active', isEmailVerified: true } },
      { new: true }
    );
    
    if (user) {
      console.log(`Successfully reset password for ${user.email} to ${newPassword}`);
    } else {
      console.log("User not found.");
    }

    // Also update org_admin just in case
    const adminUser = await User.findOneAndUpdate(
      { email: 'eng_admin@classgrid.in' },
      { $set: { password: hashedPassword, mustResetPassword: false, verification_status: 'verified', status: 'active', isEmailVerified: true } },
      { new: true }
    );

    if (adminUser) {
      console.log(`Successfully reset password for ${adminUser.email} to ${newPassword}`);
    }

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    mongoose.disconnect();
  }
}

resetPassword();
