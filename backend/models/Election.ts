import mongoose from "mongoose";

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed", "scheduled"],
      default: "active",
    },
    scheduledStart: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },
    allow_admin_vote: {
      type: Boolean,
      default: false,
    },
    allowed_email_pattern: {
      type: String,
    },
    target_department: {
      type: String,
      default: "All",
    },
    results_announced: {
      type: Boolean,
      default: false,
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

const Election = mongoose.model("Election", electionSchema);

export default Election;
