import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voting-system';
    await mongoose.connect(uri);
    
    // We need to register the models - exact match with existing schemas is better
    const DepartmentSchema = new mongoose.Schema({ name: String, code: String });
    const Department = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
    
    const CandidateRequestSchema = new mongoose.Schema({
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
      name: String
    });
    const CandidateRequest = mongoose.models.CandidateRequest || mongoose.model('CandidateRequest', CandidateRequestSchema);
    
    const request = await CandidateRequest.findOne({ name: 'Zohaib Younis' }).populate('department');
    if (request) {
      console.log('Department Info:', JSON.stringify(request.department, null, 2));
    } else {
      console.log('Candidate not found');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

check();
