import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voting-system';
    await mongoose.connect(uri);
    
    // We need to register the models
    const Department = mongoose.model('Department', new mongoose.Schema({ name: String, code: String }));
    const CandidateRequest = mongoose.model('CandidateRequest', new mongoose.Schema({
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
    }));
    
    const request = await CandidateRequest.findOne().populate('department');
    console.log('Populated request:', JSON.stringify(request, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

check();
