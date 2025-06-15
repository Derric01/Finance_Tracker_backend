const Goal = require('../models/Goal');
const { convertCurrency } = require('../utils/exchange');

// @desc    Create new financial goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    // Create goal
    const goal = await Goal.create(req.body);
    
    res.status(201).json({
      success: true,
      data: goal
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

// @desc    Get all financial goals
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by completed status if provided
    if (req.query.completed === 'true') {
      query.completed = true;
    } else if (req.query.completed === 'false') {
      query.completed = false;
    }
    
    // Get goals
    const goals = await Goal.find(query).sort({ deadline: 1 });
    
    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single financial goal
// @route   GET /api/goals/:id
// @access  Private
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    // Make sure user owns goal
    if (goal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this goal'
      });
    }
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update financial goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    // Make sure user owns goal
    if (goal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal'
      });
    }
    
    // Check if goal is completed
    if (req.body.currentAmount >= goal.targetAmount && !goal.completed) {
      req.body.completed = true;
    }
    
    // Update goal
    goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: goal
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

// @desc    Delete financial goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    // Make sure user owns goal
    if (goal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this goal'
      });
    }
    
    await goal.deleteOne();
    
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

// @desc    Update goal progress (add to current amount)
// @route   PUT /api/goals/:id/progress
// @access  Private
exports.updateGoalProgress = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an amount'
      });
    }
    
    let goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    // Make sure user owns goal
    if (goal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this goal'
      });
    }
    
    // Convert amount if currencies differ
    let convertedAmount = amount;
    if (currency && currency !== goal.currency) {
      convertedAmount = await convertCurrency(amount, currency, goal.currency);
    }
    
    // Update current amount
    const newCurrentAmount = goal.currentAmount + convertedAmount;
    
    // Check if goal is now completed
    const completed = newCurrentAmount >= goal.targetAmount;
    
    // Update goal
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { 
        currentAmount: newCurrentAmount,
        completed: completed || goal.completed
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
