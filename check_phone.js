import('./server/config/db.js').then(async (m) => {
    await m.default();
    const mongoose = (await import('mongoose')).default;
    
    // Check Users
    const User = (await import('./server/src/models/User.js')).default;
    const users = await User.find({ $or: [{ phoneNumber: '1234567890' }, { phone: '1234567890' }] });
    console.log('Users with this phone:');
    console.log(users.map(u => ({ id: u._id, email: u.email, role: u.role, name: u.name })));
    
    // Check Organizations
    const Organization = (await import('./server/src/models/Organization.js')).default;
    const orgs = await Organization.find({ $or: [{ contactNumber: '1234567890' }, { 'pending_admin.phone': '1234567890' }] });
    console.log('Orgs with this phone:');
    console.log(orgs.map(o => ({ id: o._id, name: o.name, subdomain: o.subdomain })));
    
    mongoose.disconnect();
}).catch(console.error);
