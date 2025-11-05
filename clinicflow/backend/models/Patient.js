import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // links to user with role Patient
  dob: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  phone: { type: String },
  address: { type: String },
  medicalHistory: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);
