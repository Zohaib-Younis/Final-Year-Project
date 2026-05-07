import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    election_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    receipt_hash: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

voteSchema.index({ user_id: 1, election_id: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
