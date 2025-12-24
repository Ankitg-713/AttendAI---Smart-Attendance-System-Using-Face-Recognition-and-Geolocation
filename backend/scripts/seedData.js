/**
 * Seed Script - Populate database with initial data
 * 
 * Creates:
 * - Admin user
 * - Teacher user  
 * - Student user
 * - Subjects for MCA (all semesters)
 * 
 * Usage:
 *   cd backend
 *   node scripts/seedData.js
 * 
 * Note: Users will have placeholder face descriptors.
 *       They should re-register or update their face descriptors for actual use.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('../models/User');
const Subject = require('../models/Subject');

// ========================
// Demo Users Data
// ========================
const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Rohan Jha',
    email: 'rohanjha6881@gmail.com',
    password: '123456',
    role: 'teacher',
  },
  {
    name: 'Ankit Gupta',
    email: 'ankitgupta6881@gmail.com',
    password: '123456',
    role: 'student',
    course: 'MCA',
    semester: 1,
  },
];

// ========================
// MCA Subjects Data
// ========================
const mcaSubjects = [
  // Semester 1
  { name: 'Programming in C', semester: 1, course: 'MCA', code: 'MCA101' },
  { name: 'Computer Organization', semester: 1, course: 'MCA', code: 'MCA102' },
  { name: 'Discrete Mathematics', semester: 1, course: 'MCA', code: 'MCA103' },
  { name: 'Operating Systems', semester: 1, course: 'MCA', code: 'MCA104' },
  { name: 'Communication Skills', semester: 1, course: 'MCA', code: 'MCA105' },
  
  // Semester 2
  { name: 'Data Structures', semester: 2, course: 'MCA', code: 'MCA201' },
  { name: 'Database Management Systems', semester: 2, course: 'MCA', code: 'MCA202' },
  { name: 'Object Oriented Programming', semester: 2, course: 'MCA', code: 'MCA203' },
  { name: 'Computer Networks', semester: 2, course: 'MCA', code: 'MCA204' },
  { name: 'Software Engineering', semester: 2, course: 'MCA', code: 'MCA205' },
  
  // Semester 3
  { name: 'Design and Analysis of Algorithms', semester: 3, course: 'MCA', code: 'MCA301' },
  { name: 'Web Technologies', semester: 3, course: 'MCA', code: 'MCA302' },
  { name: 'Java Programming', semester: 3, course: 'MCA', code: 'MCA303' },
  { name: 'Artificial Intelligence', semester: 3, course: 'MCA', code: 'MCA304' },
  { name: 'Cloud Computing', semester: 3, course: 'MCA', code: 'MCA305' },
  
  // Semester 4
  { name: 'Machine Learning', semester: 4, course: 'MCA', code: 'MCA401' },
  { name: 'Mobile Application Development', semester: 4, course: 'MCA', code: 'MCA402' },
  { name: 'Information Security', semester: 4, course: 'MCA', code: 'MCA403' },
  { name: 'Big Data Analytics', semester: 4, course: 'MCA', code: 'MCA404' },
  { name: 'Project Work', semester: 4, course: 'MCA', code: 'MCA405' },
];

// Generate a placeholder face descriptor (128 random numbers)
// Note: This won't work for actual face recognition - users need to re-register
function generatePlaceholderDescriptor() {
  return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
}

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ========================
    // Seed Users
    // ========================
    console.log('👤 Seeding Users...');
    
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`   ⏭️  User already exists: ${userData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        course: userData.course || null,
        semester: userData.semester || null,
        faceDescriptor: generatePlaceholderDescriptor(),
        enrollmentDate: new Date(),
        isActive: true,
        ...(userData.role === 'student' && {
          enrollmentHistory: [{
            course: userData.course,
            semester: userData.semester,
            enrolledAt: new Date(),
            status: 'active',
          }],
        }),
      });

      await user.save();
      console.log(`   ✓ Created ${userData.role}: ${userData.email}`);
    }

    // ========================
    // Seed Subjects
    // ========================
    console.log('\n📚 Seeding Subjects...');
    
    let subjectsCreated = 0;
    let subjectsSkipped = 0;

    for (const subjectData of mcaSubjects) {
      const existingSubject = await Subject.findOne({
        name: subjectData.name,
        course: subjectData.course,
        semester: subjectData.semester,
      });

      if (existingSubject) {
        subjectsSkipped++;
        continue;
      }

      const subject = new Subject({
        name: subjectData.name,
        semester: subjectData.semester,
        course: subjectData.course,
        code: subjectData.code,
        isActive: true,
      });

      await subject.save();
      subjectsCreated++;
    }

    console.log(`   ✓ Created ${subjectsCreated} subjects`);
    if (subjectsSkipped > 0) {
      console.log(`   ⏭️  Skipped ${subjectsSkipped} existing subjects`);
    }

    // ========================
    // Summary
    // ========================
    console.log('\n' + '='.repeat(50));
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    
    console.log('\n📋 Demo Credentials:');
    console.log('┌─────────────┬──────────────────────────────┬───────────┐');
    console.log('│ Role        │ Email                        │ Password  │');
    console.log('├─────────────┼──────────────────────────────┼───────────┤');
    console.log('│ 👑 Admin    │ admin@example.com            │ admin123  │');
    console.log('│ 👨‍🏫 Teacher  │ rohanjha6881@gmail.com       │ 123456    │');
    console.log('│ 🎓 Student  │ ankitgupta6881@gmail.com     │ 123456    │');
    console.log('└─────────────┴──────────────────────────────┴───────────┘');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('   Demo users have placeholder face descriptors.');
    console.log('   For face recognition to work, users should:');
    console.log('   1. Re-register with actual face capture, OR');
    console.log('   2. Update their face descriptor via the app');
    
    console.log('\n📚 Subjects Created:');
    console.log('   MCA Semester 1: 5 subjects');
    console.log('   MCA Semester 2: 5 subjects');
    console.log('   MCA Semester 3: 5 subjects');
    console.log('   MCA Semester 4: 5 subjects');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Login as Admin and assign teachers to subjects');
    console.log('   4. Login as Teacher and schedule classes');
    console.log('   5. Login as Student and mark attendance');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();

