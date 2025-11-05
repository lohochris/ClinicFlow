import express from "express";
import User from "../models/User.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.get("/", protect, authorizeRoles("Admin"), asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
}));

export default router;
