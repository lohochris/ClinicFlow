import express from "express";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

/**
 * @desc    Create appointment (Patient scheduling)
 * @route   POST /api/appointments
 * @access  Patient
 */
router.post("/", protect, authorizeRoles("Patient"), asyncHandler(async (req, res) => {
  const { patientId, doctorId, startAt, endAt, reason } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  // Ensure the logged-in user owns this patient record
  if (patient.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You cannot create appointments for other patients" });
  }

  const appointment = new Appointment({
    patient: patientId,
    doctor: doctorId,
    startAt,
    endAt,
    reason,
    status: "Scheduled"
  });

  await appointment.save();
  res.status(201).json(appointment);
}));

/**
 * @desc    Doctor views own appointments
 * @route   GET /api/appointments/doctor
 * @access  Doctor
 */
router.get("/doctor", protect, authorizeRoles("Doctor"), asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate("patient", "name age gender")
    .sort({ startAt: 1 });

  res.json(appointments);
}));

/**
 * @desc    Patient views their own appointments
 * @route   GET /api/appointments/me
 * @access  Patient
 */
router.get("/me", protect, authorizeRoles("Patient"), asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return res.status(404).json({ message: "Patient profile not found" });

  const appointments = await Appointment.find({ patient: patient._id })
    .populate("doctor", "name email")
    .sort({ startAt: 1 });

  res.json(appointments);
}));

/**
 * @desc    Admin/Staff view all appointments
 * @route   GET /api/appointments
 * @access  Admin, Staff
 */
router.get("/", protect, authorizeRoles("Admin", "Staff"), asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patient", "name")
    .populate("doctor", "name")
    .sort({ startAt: 1 });

  res.json(appointments);
}));

/**
 * @desc    Update appointment (Doctor or Staff)
 * @route   PUT /api/appointments/:id
 * @access  Doctor, Staff
 */
router.put("/:id", protect, authorizeRoles("Doctor", "Staff"), asyncHandler(async (req, res) => {
  const { startAt, endAt, reason, status } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  appointment.startAt = startAt || appointment.startAt;
  appointment.endAt = endAt || appointment.endAt;
  appointment.reason = reason || appointment.reason;
  appointment.status = status || appointment.status;

  await appointment.save();
  res.json(appointment);
}));

/**
 * @desc    Cancel appointment (Patient or Doctor)
 * @route   DELETE /api/appointments/:id
 * @access  Patient, Doctor
 */
router.delete("/:id", protect, authorizeRoles("Patient", "Doctor"), asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  appointment.status = "Cancelled";
  await appointment.save();

  res.json({ message: "Appointment cancelled", appointment });
}));

export default router;
