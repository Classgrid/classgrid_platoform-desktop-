/**
 * Migrate CDU (Classgrid Demo University) → CDS (Classgrid Demo School)
 * 
 * Step 1: Delete old CDU org and all associated users
 * Step 2: Create new CDS org and all 10 role accounts
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const User = require('../src/models/User');
  const Organization = require('../src/models/Organization');

  // ──────────────────────────────────────────
  // STEP 1: DELETE OLD CDU
  // ──────────────────────────────────────────
  console.log('🗑️  STEP 1: Deleting old CDU records...');

  const oldOrg = await Organization.findOne({ subdomain: 'cdu' });
  if (oldOrg) {
    // Delete all users linked to CDU org
    const deletedUsers = await User.deleteMany({ organization: oldOrg._id });
    console.log(`   Deleted ${deletedUsers.deletedCount} CDU users`);

    // Delete the org itself
    await Organization.deleteOne({ _id: oldOrg._id });
    console.log('   Deleted CDU organization');
  } else {
    console.log('   No CDU org found (already deleted or never existed)');
  }

  // Also clean up any stray CDU emails
  const strayDelete = await User.deleteMany({ email: /@cdu\.classgrid\.in$/i });
  if (strayDelete.deletedCount > 0) {
    console.log(`   Cleaned up ${strayDelete.deletedCount} stray CDU email accounts`);
  }

  console.log('✅ CDU cleanup complete!\n');

  // ──────────────────────────────────────────
  // STEP 2: CREATE CDS (Classgrid Demo School)
  // ──────────────────────────────────────────
  console.log('🏫 STEP 2: Creating CDS (Classgrid Demo School)...');

  // Find the real platform owner to set as org owner
  const platformOwner = await User.findOne({ email: 'nikhil.shinde@classgrid.in' });
  if (!platformOwner) {
    console.error('❌ Platform owner (nikhil.shinde@classgrid.in) not found! Cannot proceed.');
    process.exit(1);
  }

  // Create the CDS organization
  const cdsOrg = await Organization.create({
    name: 'Classgrid Demo School',
    subdomain: 'cds',
    org_type: 'school',
    structure_type: 'school_with_div',
    status: 'active',
    owner_id: platformOwner._id,
    ownerName: 'School Principal',
    ownerEmail: 'admin@cds.classgrid.in',
    contactNumber: '+91 9999999999',
    website: 'https://cds.classgrid.in',
    address: 'Demo Campus, Virtual City',
    designation: 'Principal',
    affiliation: 'Classgrid Demo Board',
    isPaid: false,
    branding: {
      theme_colors: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        accent: '#f43f5e',
      },
      font_preference: 'Inter',
      tagline: 'Empowering Education',
    },
    feature_flags: {
      admission_module: true,
      hr_module: true,
      canteen_module: false,
      naac_module: false,
      marketplace_module: false,
      exam_proctoring: false,
    },
    academic_config: {
      identifierLabel: 'Roll No',
      prnRequired: false,
      prnLocked: false,
    },
  });

  console.log(`   ✅ Created org: "${cdsOrg.name}" (${cdsOrg.subdomain}.classgrid.in)`);
  console.log(`   Org ID: ${cdsOrg._id}\n`);

  // ──────────────────────────────────────────
  // STEP 3: CREATE ALL 10 ROLE ACCOUNTS
  // ──────────────────────────────────────────
  console.log('👥 STEP 3: Creating 10 demo accounts...');

  const bcrypt = require('bcryptjs');
  const commonPassword = await bcrypt.hash('demo123', 10);

  const accounts = [
    { name: 'CDS Org Admin',          email: 'admin@cds.classgrid.in',      role: 'org_admin' },
    { name: 'CDS Admission Head',     email: 'admission@cds.classgrid.in',  role: 'admission_controller' },
    { name: 'CDS Fee Manager',        email: 'fees@cds.classgrid.in',       role: 'fee_manager' },
    { name: 'CDS Exam Controller',    email: 'exam@cds.classgrid.in',       role: 'exam_controller' },
    { name: 'CDS Library Manager',    email: 'library@cds.classgrid.in',    role: 'librarian' },
    { name: 'CDS Attendance Manager', email: 'attendance@cds.classgrid.in', role: 'attendance_manager' },
    { name: 'CDS HR Manager',         email: 'hr@cds.classgrid.in',         role: 'hr_manager' },
    { name: 'CDS Hostel Warden',      email: 'hostel@cds.classgrid.in',     role: 'hostel_warden' },
    { name: 'CDS Demo Faculty',       email: 'faculty@cds.classgrid.in',    role: 'teacher' },
    { name: 'CDS Demo Student',       email: 'student@cds.classgrid.in',    role: 'student' },
  ];

  for (const acc of accounts) {
    const user = await User.create({
      name: acc.name,
      email: acc.email,
      password: commonPassword,
      role: acc.role,
      organization: cdsOrg._id,
      isEmailVerified: true,
      verification_status: 'verified',
      mustResetPassword: false,
      profile_completed: true,
    });
    console.log(`   ✅ ${acc.role.padEnd(22)} → ${acc.email} (ID: ${user._id})`);
  }

  console.log('\n🎉 Migration complete! CDU → CDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Org Name:    Classgrid Demo School');
  console.log('   Subdomain:   cds.classgrid.in');
  console.log('   Org Type:    school (school_with_div)');
  console.log('   Accounts:    10 roles created');
  console.log('   Password:    demo123 (all accounts)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
