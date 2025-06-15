const express = require('express');
const {
  getFinancialAdvice,
  getSuggestedCategories
} = require('../controllers/ai');

const router = express.Router();

const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.post('/advice', getFinancialAdvice);
router.get('/categories', getSuggestedCategories);

module.exports = router;
