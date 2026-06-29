const mongoose = require('mongoose');

const MONGO_URI = "mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

async function findOrgAndAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // 1. Find the Org by regex to be safe
    const Org = mongoose.connection.collection('organizations');
    const orgs = await Org.find({ 
      $or: [
        { customDomain: { $regex: /quantumchem/i } },
        { subdomain: { $regex: /nikhil/i } }
      ]
    }).toArray();
    
    if (orgs.length === 0) {
      console.log('No matching orgs found for quantumchem or nikhil.');
      process.exit(0);
      return;
    }
    
    for (const org of orgs) {
      console.log('\n--- ORGANIZATION FOUND ---');
      console.log('Name:', org.name);
      console.log('Subdomain:', org.subdomain);
      console.log('Custom Domain:', org.customDomain);
      console.log('Org ID:', org._id);
      
      // 2. Find the Org Admin
      const User = mongoose.connection.collection('users');
      const admin = await User.findOne({
        organizationId: org._id,
        roles: 'org_admin'
      });
      
      if (!admin) {
        console.log('No org_admin found for this organization.');
      } else {
        console.log('--- ORG ADMIN CREDENTIALS ---');
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findOrgAndAdmin();
