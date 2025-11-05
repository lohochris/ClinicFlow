import express from "express";
import Patient from "../models/Patient.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

/**
 * @desc    Create patient record (Admin or Doctor)
 * @route   POST /api/patients
 * @access  Admin, Doctor
 */
router.post("/", protect, authorizeRoles("Admin", "Doctor"), asyncHandler(async (req, res) => {
  const existingPatient = await Patient.findOne({ email: req.body.email });
  if (existingPatient) {
    return res.status(400).json({ message: "Patient already exists" });
  }

  const patient = new Patient({ ...req.body });
  await patient.save();

  res.status(201).json(patient);
}));

/**
 * @desc    Get all patients (Admin, Doctor, Staff)
 * @route   GET /api/patients
 * @access  Admin, Doctor, Staff
 */
router.get("/", protect, authorizeRoles("Admin", "Doctor", "Staff"), asyncHandler(async (req, res) => {
  const { search } = req.query;

  // Allow simple search by name or email
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};

  const patients = await Patient.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 });

  res.json(patients);
}));

/**
 * @desc    Get a single patient record by ID
 * @route   GET /api/patients/:id
 * @access  Admin, Doctor, or Owner (Patient)
 */
router.get("/:id", protect, asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate("user", "name email role");
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  // Allow patient to view their own record
  if (req.user.role === "Patient" && patient.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Admins and doctors can always view
  res.json(patient);
}));

/**
 * @desc    Update patient record
 * @route   PUT /api/patients/:id
 * @access  Admin, Doctor, or Owner (Patient)
 */
router.put("/:id", protect, asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  // Patient can update only their own profile
  if (req.user.role === "Patient" && patient.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update your own record" });
  }

  // Allow Admin or Doctor to update any record
  if (["Admin", "Doctor"].includes(req.user.role) || patient.user.toString() === req.user._id.toString()) {
    Object.assign(patient, req.body);
    await patient.save();
    return res.json(patient);
  }

  res.status(403).json({ message: "Forbidden" });
}));

/**
 * @desc    Delete patient record
 * @route   DELETE /api/patients/:id
 * @access  Admin only
 */
router.delete("/:id", protect, authorizeRoles("Admin"), asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  await patient.deleteOne();
  res.json({ message: "Patient record deleted successfully" });
}));

export default router;
