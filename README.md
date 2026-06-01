# OutDrive

A luxury car rental web application built with vanilla HTML/CSS, Node.js, Express, and MongoDB.

## Features

- Browse and filter a fleet of luxury vehicles by type, seats, and price
- View detailed car specs and image galleries
- User authentication (sign up / sign in) with JWT
- Booking flow with confirmation
- User profile, rental history, and saved vehicles

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt |

## Project Structure

```
OutDrive/
├── assets/
│   ├── css/        # Stylesheets (per-page + shared tokens)
│   ├── images/     # Car images
│   └── js/         # Frontend scripts
├── backend/
│   ├── models/     # Mongoose models (Car, User)
│   ├── routes/     # Express routes (auth, cars)
│   ├── seedCars.js # Database seeder
│   └── server.js   # Entry point
└── pages/          # HTML pages
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/OutDrive.git
   cd OutDrive/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` folder:
   ```env
   MONGO_URI=mongodb://localhost:27017/outdrive
   JWT_SECRET=your_secret_key
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/cars` | List cars (supports `search`, `type`, `seats`, `price`, `sort` query params) |
| GET | `/api/cars/:id` | Get a single car by ID |
| GET | `/api/health` | Health check |
