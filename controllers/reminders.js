const Reminder = require('../models/Reminder');
const { createBudgetCheckReminder } = require('../utils/reminder');

// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = async (req, res) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    // Create reminder
    const reminder = await Reminder.create(req.body);
    
    res.status(201).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all reminders
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by active status if provided
    if (req.query.active === 'true') {
      query.isActive = true;
    } else if (req.query.active === 'false') {
      query.isActive = false;
    }
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Get reminders
    const reminders = await Reminder.find(query).sort({ dateTime: 1 });
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    // Make sure user owns reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this reminder'
      });
    }
    
    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = async (req, res) => {
  try {
    let reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    // Make sure user owns reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reminder'
      });
    }
    
    // Update reminder
    reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    // Make sure user owns reminder
    if (reminder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reminder'
      });
    }
    
    await reminder.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create default reminders for user
// @route   POST /api/reminders/defaults
// @access  Private
exports.createDefaultReminders = async (req, res) => {
  try {
    // Create budget check reminder
    const budgetReminder = await createBudgetCheckReminder(req.user.id);
    
    // Create expense logging reminder (daily at 8 PM)
    const now = new Date();
    const reminderDate = new Date(now.setHours(20, 0, 0, 0));
    
    const expenseReminder = await Reminder.create({
      userId: req.user.id,
      type: 'log-expense',
      message: `Time to log today's expenses!`,
      dateTime: reminderDate,
      frequency: 'daily'
    });
    
    res.status(201).json({
      success: true,
      data: [budgetReminder, expenseReminder]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
