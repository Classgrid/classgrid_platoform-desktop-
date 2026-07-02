import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import User from './src/models/User.js';
import Notification from './src/models/Notification.js';

async function run() {
  await connectDB();
  try {
    const user = await User.findOne({}).select('_id').lean();
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }
    const res = await Notification.insertMany([{
      recipient: user._id,
      type: 'chat',
      title: 'Test Chat Bell Notification',
      message: 'This is a test message to see if the bell works.',
      link: '/platform/chat',
      relatedId: 'thread_123',
      isRead: false,
      emailSent: false,
      createdAt: new Date()
    }]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error inserting notification:", err);
  }
  process.exit(0);
}
run();
