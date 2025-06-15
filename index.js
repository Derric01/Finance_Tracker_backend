const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const reminderUtil = require('./utils/reminder');

// Load env vars
dotenv.config();

// Connect to database (async)
let isDbConnected = false;
(async () => {
  isDbConnected = await connectDB();
  global.isDbConnected = isDbConnected;
  
  // Set reminder utility to use mock data if DB connection failed
  if (!isDbConnected) {
    reminderUtil.setUsingMockData(true);
  }
})();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const aiRoutes = require('./routes/ai');
const reminderRoutes = require('./routes/reminders');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reminders', reminderRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Finance Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    // Setup cron job for reminders
  reminderUtil.setupReminderCron();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
