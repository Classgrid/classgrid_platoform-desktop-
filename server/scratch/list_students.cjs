const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://nikhil:dharwadkar@cluster0.zowx6.mongodb.net/classgrid_platform?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const db = mongoose.connection.db;
    const orgs = await db.collection('organizations').find({}).toArray();
    for (const org of orgs) {
        const student = await db.collection('users').findOne({ organization_id: org._id, role: 'student' });
        console.log(`Type: ${org.institutionType || 'N/A'}, Org: ${org.name}, Email: ${student ? student.email : 'None found'}`);
    }
    process.exit(0);
})
.catch(console.error);
