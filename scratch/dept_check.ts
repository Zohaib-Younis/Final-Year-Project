import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voting-system';
    await mongoose.connect(uri);
    const Department = mongoose.model('Department', new mongoose.Schema({}, { strict: false }));
    const all = await Department.find();
    console.log('Departments:', JSON.stringify(all, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

check();
