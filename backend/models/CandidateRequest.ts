import mongoose from 'mongoose';

const CandidateRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  father_name: { type: String, required: true },
  semester: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  gpa: { type: Number, required: true },
  cgpa: { type: Number, required: true },
  email: { type: String, required: true },
  registration_number: { type: String, required: true },
  cnic_number: { type: String, required: true },
  picture_url: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  applied_at: { type: Date, default: Date.now },
  processed_at: { type: Date },
  admin_notes: { type: String }
});

export default mongoose.models.CandidateRequest || mongoose.model('CandidateRequest', CandidateRequestSchema);
