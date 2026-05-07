import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    manifesto: {
      type: String,
    },
    image_url: {
      type: String,
    },
    department: {
      type: String,
      default: "General",
    },
    election_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
