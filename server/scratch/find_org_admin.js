const mongoose = require('mongoose');

async function findOrgAndAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/classgrid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // 1. Find the Org
    const Org = mongoose.connection.collection('organizations');
    const org = await Org.findOne({ 
      $or: [
        { customDomain: 'nikhil.quantumchem.site' },
        { subdomain: 'nikhil' }
      ]
    });
    
    if (!org) {
      console.log('Org not found for nikhil.quantumchem.site');
      return;
    }
    
    console.log('--- ORGANIZATION FOUND ---');
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
      console.log('\n--- ORG ADMIN CREDENTIALS ---');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      // We can't show password because it's hashed, but we can give the email
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findOrgAndAdmin();
