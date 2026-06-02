const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const seedCars = require('./seedCars');

const app = express();

// Cache connection across serverless invocations
let dbReady = false;

async function connectDB() {
  if (dbReady) return;
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  await seedCars();
  dbReady = true;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'pages')));

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ message: 'Service unavailable. Please try again.' });
  }
});

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

// Local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
