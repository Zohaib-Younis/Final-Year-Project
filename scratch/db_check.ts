import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voting-system';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    const CandidateRequest = mongoose.model('CandidateRequest', new mongoose.Schema({}, { strict: false }));
    const doc = await CandidateRequest.findOne({ name: 'Aiden Carter' });
    if (doc) {
      console.log('Found document:', JSON.stringify(doc, null, 2));
    } else {
      console.log('No document found for Aiden Carter');
      const all = await CandidateRequest.find().limit(5);
      console.log('First 5 documents:', JSON.stringify(all, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

check();
