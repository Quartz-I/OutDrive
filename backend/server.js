const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const seedCars = require('./seedCars');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'pages')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'pages', 'home.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'outDrive API is running' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedCars();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
