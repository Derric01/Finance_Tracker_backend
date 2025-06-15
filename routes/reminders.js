const express = require('express');
const {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  createDefaultReminders
} = require('../controllers/reminders');

const router = express.Router();

const { protect } = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(protect);

// Special routes
router.post('/defaults', createDefaultReminders);

// Standard routes
router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .get(getReminder)
  .put(updateReminder)
  .delete(deleteReminder);

module.exports = router;
