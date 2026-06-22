const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Find all users with @classgrid.in email
    const users = await db.collection('users').find({
        email: { $regex: /@classgrid\.in$/i }
    }).toArray();
    
    console.log(`Found ${users.length} users with @classgrid.in email domain.`);
    
    // Update them
    const result = await db.collection('users').updateMany(
        { email: { $regex: /@classgrid\.in$/i } },
        { 
            $set: { 
                isEmailVerified: true,
                role: 'super_admin',
                verification_status: 'verified'
            } 
        }
    );
    
    console.log("Update result:", result);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
