/**
 * Migration Script - Update existing data with new schema fields
 * 
 * Run this script ONCE after updating the code to add new fields to existing documents.
 * 
 * Usage: 
 *   cd backend
 *   node scripts/migrateData.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const { CLASS_STATUS, ATTENDANCE_STATUS, DEFAULT_ATTENDANCE_RADIUS, LATE_GRACE_MINUTES, END_GRACE_MINUTES } = require('../config/constants');

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // ========================
    // Migrate Users
    // ========================
    console.log('\n📦 Migrating Users...');
    
    const usersToUpdate = await User.find({
      $or: [
        { enrollmentDate: { $exists: false } },
        { isActive: { $exists: false } },
      ]
    });

    let userCount = 0;
    for (const user of usersToUpdate) {
      const updates = {};
      
      // Set enrollmentDate to createdAt if not exists
      if (!user.enrollmentDate) {
        updates.enrollmentDate = user.createdAt;
      }
      
      // Set isActive to true if not exists
      if (user.isActive === undefined) {
        updates.isActive = true;
      }

      // Add enrollment history for students
      if (user.role === 'student' && (!user.enrollmentHistory || user.enrollmentHistory.length === 0)) {
        updates.enrollmentHistory = [{
          course: user.course,
          semester: user.semester,
          enrolledAt: user.createdAt,
          status: 'active',
        }];
      }

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        userCount++;
      }
    }
    console.log(`   ✓ Updated ${userCount} users`);

    // ========================
    // Migrate Classes
    // ========================
    console.log('\n📦 Migrating Classes...');
    
    const classesToUpdate = await Class.find({
      $or: [
        { status: { $exists: false } },
        { attendanceRadius: { $exists: false } },
      ]
    });

    let classCount = 0;
    for (const cls of classesToUpdate) {
      const updates = {};
      const now = new Date();
      const classDate = new Date(cls.date);
      const [endH, endM] = cls.endTime.split(':').map(Number);
      classDate.setHours(endH, endM, 0, 0);

      // Determine class status based on date
      if (!cls.status) {
        if (classDate < now) {
          updates.status = CLASS_STATUS.COMPLETED;
        } else {
          updates.status = CLASS_STATUS.SCHEDULED;
        }
      }

      // Set default values for new fields
      if (cls.attendanceRadius === undefined) {
        updates.attendanceRadius = DEFAULT_ATTENDANCE_RADIUS;
      }
      if (cls.lateGraceMinutes === undefined) {
        updates.lateGraceMinutes = LATE_GRACE_MINUTES;
      }
      if (cls.endGraceMinutes === undefined) {
        updates.endGraceMinutes = END_GRACE_MINUTES;
      }

      if (Object.keys(updates).length > 0) {
        await Class.updateOne({ _id: cls._id }, { $set: updates });
        classCount++;
      }
    }
    console.log(`   ✓ Updated ${classCount} classes`);

    // ========================
    // Migrate Attendance
    // ========================
    console.log('\n📦 Migrating Attendance...');
    
    const attendanceToUpdate = await Attendance.find({
      $or: [
        { markedAt: { $exists: false } },
        { status: 'Present' }, // Old capitalized status
        { status: 'Absent' },  // Old capitalized status
      ]
    });

    let attendanceCount = 0;
    for (const record of attendanceToUpdate) {
      const updates = {};

      // Set markedAt to createdAt if not exists
      if (!record.markedAt) {
        updates.markedAt = record.createdAt || record.timestamp || new Date();
      }

      // Convert old capitalized status to lowercase
      if (record.status === 'Present') {
        updates.status = ATTENDANCE_STATUS.PRESENT;
      } else if (record.status === 'Absent') {
        updates.status = ATTENDANCE_STATUS.ABSENT;
      }

      if (Object.keys(updates).length > 0) {
        await Attendance.updateOne({ _id: record._id }, { $set: updates });
        attendanceCount++;
      }
    }
    console.log(`   ✓ Updated ${attendanceCount} attendance records`);

    // ========================
    // Summary
    // ========================
    console.log('\n✅ Migration completed successfully!');
    console.log('   Summary:');
    console.log(`   - Users updated: ${userCount}`);
    console.log(`   - Classes updated: ${classCount}`);
    console.log(`   - Attendance records updated: ${attendanceCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

// Run migration
migrate();

