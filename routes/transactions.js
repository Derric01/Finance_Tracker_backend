const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} = require('../controllers/transactions');

const router = express.Router();

const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.get('/summary', getTransactionSummary);

// Standard routes
router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
