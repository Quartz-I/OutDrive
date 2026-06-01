const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Car = require('../models/Car');

const router = express.Router();

async function buildAuthPayload(user) {
  const savedVehicles = user.savedVehicles && user.savedVehicles.length > 0
    ? await Car.find({ _id: { $in: user.savedVehicles } }).select('name brand type pricePerDay seats transmission fuelType images')
    : [];

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    nationality: user.nationality,
    savedVehicles,
    rentals: user.rentals || [],
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ── POST /api/auth/signup ──────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, dateOfBirth, nationality } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !phone || !dateOfBirth || !nationality) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Save user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth,
      nationality,
      passwordHash,
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userPayload = await buildAuthPayload(user);
    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: userPayload,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/signin ──────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userPayload = await buildAuthPayload(user);
    res.status(200).json({
      message: 'Signed in successfully.',
      token,
      user: userPayload,
    });
  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userPayload = await buildAuthPayload(user);
    res.status(200).json({
      user: userPayload,
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── PUT /api/auth/me ───────────────────────────────────────────
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, nationality } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ message: 'This email is already in use.' });
      }
      user.email = email.toLowerCase();
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (nationality) user.nationality = nationality;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/bookings ────────────────────────────────────
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const { carId, pickupDate, dropoffDate, location, extras } = req.body;

    if (!carId || !pickupDate || !dropoffDate || !location) {
      return res.status(400).json({ message: 'carId, pickupDate, dropoffDate, and location are required.' });
    }

    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime())) {
      return res.status(400).json({ message: 'Invalid dates provided.' });
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (pickup < todayMidnight) {
      return res.status(400).json({ message: 'Pick-up date cannot be in the past.' });
    }
    if (dropoff <= pickup) {
      return res.status(400).json({ message: 'Drop-off date must be after pick-up date.' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Vehicle not found.' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const days = Math.round((dropoff - pickup) / 86400000);
    const SERVICE_FEE = 45;
    const TAX_RATE = 0.0825;
    const base = car.pricePerDay * days;

    let extrasTotal = 0;
    const extrasArr = Array.isArray(extras) ? extras : [];
    extrasArr.forEach(e => {
      extrasTotal += e.flat ? (e.price || 0) : (e.price || 0) * days;
    });

    const tax = Math.round((base + extrasTotal + SERVICE_FEE) * TAX_RATE);
    const total = base + extrasTotal + SERVICE_FEE + tax;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const seg = n => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const reference = `OD-${seg(4)}-${seg(4)}`;

    user.rentals.push({
      car: car._id,
      carName: car.name,
      carImage: car.images?.[0] || '',
      status: 'upcoming',
      pickupDate: pickup,
      dropoffDate: dropoff,
      location,
      total,
      days,
      reference,
    });
    await user.save();

    res.status(201).json({
      message: 'Booking confirmed.',
      booking: {
        reference,
        carName: car.name,
        carImage: car.images?.[0] || '',
        carType: car.type || '',
        pricePerDay: car.pricePerDay,
        pickupDate: pickup,
        dropoffDate: dropoff,
        location,
        days,
        base,
        extrasTotal,
        serviceFee: SERVICE_FEE,
        tax,
        total,
        status: 'upcoming',
      },
    });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── DELETE /api/auth/bookings/:rentalId ───────────────────────
router.delete('/bookings/:rentalId', authMiddleware, async (req, res) => {
  try {
    const { rentalId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const idx = user.rentals.findIndex(r => r._id.toString() === rentalId);
    if (idx === -1) return res.status(404).json({ message: 'Booking not found.' });

    const rental = user.rentals[idx];
    if (rental.status !== 'upcoming') {
      return res.status(400).json({ message: 'Only upcoming bookings can be cancelled.' });
    }

    const pickupDate = new Date(rental.pickupDate);
    const now = new Date();
    if (pickupDate <= now) {
      return res.status(400).json({ message: 'Cannot cancel a booking whose pick-up date has already passed.' });
    }

    user.rentals.splice(idx, 1);
    await user.save();

    res.status(200).json({ message: 'Booking cancelled and removed successfully.' });
  } catch (err) {
    console.error('Cancel booking error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── PUT /api/auth/saved-vehicles/:carId ────────────────────────
router.put('/saved-vehicles/:carId', authMiddleware, async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Vehicle not found.' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const idx = user.savedVehicles.findIndex(id => id.toString() === carId);
    let saved;
    if (idx > -1) {
      user.savedVehicles.splice(idx, 1);
      saved = false;
    } else {
      user.savedVehicles.push(car._id);
      saved = true;
    }
    await user.save();

    res.status(200).json({ saved, message: saved ? 'Vehicle saved.' : 'Vehicle removed from saved list.' });
  } catch (err) {
    console.error('Save vehicle error:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
