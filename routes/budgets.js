const express = require('express');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus
} = require('../controllers/budgets');

const router = express.Router();

const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.get('/status', getBudgetStatus);

// Standard routes
router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;
