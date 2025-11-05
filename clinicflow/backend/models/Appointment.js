import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    reason: { 
      type: String, 
      trim: true 
    },
    notes: { 
      type: String, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ["Scheduled", "Completed", "Cancelled"], 
      default: "Scheduled" 
    },
    startAt: { 
      type: Date, 
      required: true 
    },
    endAt: { 
      type: Date 
    },
    location: { 
      type: String, 
      default: "Clinic" // Optional: could be "Virtual" for teleconsultation
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  },
  { timestamps: true }
);

// Index to optimize doctor/patient calendar queries
appointmentSchema.index({ doctor: 1, startAt: 1 });
appointmentSchema.index({ patient: 1, startAt: 1 });

// Optional middleware for auto endAt if missing
appointmentSchema.pre("save", function (next) {
  if (!this.endAt && this.startAt) {
    const defaultEnd = new Date(this.startAt);
    defaultEnd.setMinutes(defaultEnd.getMinutes() + 30); // Default 30 mins duration
    this.endAt = defaultEnd;
  }
  next();
});

export default mongoose.model("Appointment", appointmentSchema);
