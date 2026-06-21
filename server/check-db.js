import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';

dotenv.config();

async function checkConfig() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    
    // Find any org to check its admission_config
    const org = await Organization.findOne({}).select('_id name admission_config');
    if (org) {
      console.log(`\nFound Org: ${org.name} (ID: ${org._id})`);
      
      const admins = await User.find({ 
        organization_id: org._id, 
        role: { $in: ['org_admin', 'admission_head', 'super_admin'] } 
      }).select('email role first_name last_name');
      
      console.log("\n--- Admin Users for this Org ---");
      if (admins.length > 0) {
        admins.forEach(admin => {
          console.log(`Email: ${admin.email} | Role: ${admin.role} | Name: ${admin.first_name} ${admin.last_name}`);
        });
      } else {
        console.log("No admins found for this organization.");
      }
    } else {
      console.log("No organizations found in the database.");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    mongoose.disconnect();
  }
}

checkConfig();
