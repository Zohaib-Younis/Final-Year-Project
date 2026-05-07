import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    registration_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    department: {
      type: String,
      default: "General",
    },
    isEligible: {
      type: Boolean,
      default: true,
    },
    isImported: {
      type: Boolean,
      default: false,
    },
    // Students only — admins/officers are in the Admin collection
    role: {
      type: String,
      enum: ["student"],
      default: "student",
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

const User = mongoose.model("User", userSchema);

export default User;
