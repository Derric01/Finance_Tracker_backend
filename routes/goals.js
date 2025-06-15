const express = require('express');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress
} = require('../controllers/goals');

const router = express.Router();

const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.put('/:id/progress', updateGoalProgress);

// Standard routes
router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .get(getGoal)
  .put(updateGoal)
  .delete(deleteGoal);

module.exports = router;
