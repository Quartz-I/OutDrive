const express = require('express');
const Car = require('../models/Car');

const router = express.Router();

// GET /api/cars
router.get('/', async (req, res) => {
  try {
    const { search, type, seats, price, sort } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }
    if (seats) {
      filter.seats = Number(seats);
    }
    if (price) {
      filter.pricePerDay = { $lte: Number(price) };
    }

    let query = Car.find(filter);
    if (sort === 'price-asc') query = query.sort({ pricePerDay: 1 });
    if (sort === 'price-desc') query = query.sort({ pricePerDay: -1 });
    if (!sort) query = query.sort({ createdAt: -1 });

    const cars = await query.exec();
    res.json({ cars });
  } catch (err) {
    console.error('Fetch cars error:', err.message);
    res.status(500).json({ message: 'Unable to load cars.' });
  }
});

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found.' });
    }
    res.json({ car });
  } catch (err) {
    console.error('Fetch car error:', err.message);
    res.status(500).json({ message: 'Unable to load car details.' });
  }
});

module.exports = router;
