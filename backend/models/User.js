const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    nationality: {
      type: String,
      required: [true, 'Nationality is required'],
      trim: true,
    },
    savedVehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
      },
    ],
    rentals: [
      {
        car: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Car',
        },
        carName: { type: String, trim: true },
        carImage: { type: String, trim: true },
        status: {
          type: String,
          enum: ['upcoming', 'completed', 'cancelled'],
          default: 'completed',
        },
        pickupDate: Date,
        dropoffDate: Date,
        location: { type: String, trim: true },
        total: { type: Number, default: 0 },
        days: { type: Number, default: 0 },
        reference: { type: String, trim: true },
      },
    ],
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('User', userSchema);
