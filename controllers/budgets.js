const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { convertCurrency } = require('../utils/exchange');

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    // Check if budget for this category and month already exists
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category: req.body.category,
      month: req.body.month
    });
    
    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `Budget for ${req.body.category} in ${req.body.month} already exists`
      });
    }
    
    // Create budget
    const budget = await Budget.create(req.body);
    
    res.status(201).json({
      success: true,
      data: budget
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

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by month if provided
    if (req.query.month) {
      query.month = req.query.month;
    }
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Get budgets
    const budgets = await Budget.find(query).sort({ month: -1 });
    
    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Make sure user owns budget
    if (budget.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget'
      });
    }
    
    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Make sure user owns budget
    if (budget.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }
    
    // Update budget
    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: budget
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

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Make sure user owns budget
    if (budget.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget'
      });
    }
    
    await budget.deleteOne();
    
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

// @desc    Get budget status with spending progress
// @route   GET /api/budgets/status
// @access  Private
exports.getBudgetStatus = async (req, res) => {
  try {
    // Validate required query parameter
    if (!req.query.month) {
      return res.status(400).json({
        success: false,
        message: 'Month parameter is required (format: YYYY-MM)'
      });
    }
    
    const month = req.query.month;
    
    // Get all budgets for the month
    const budgets = await Budget.find({
      userId: req.user.id,
      month
    });
    
    // Parse month to get start/end dates
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    
    // Get all expenses for the month
    const expenses = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // Calculate spending by category
    const spendingByCategory = {};
    
    for (const expense of expenses) {
      // Convert expense amount to budget currency if needed
      let amount = expense.amount;
      
      // Find matching budget for this category
      const budget = budgets.find(b => b.category === expense.category);
      
      if (budget && budget.currency !== expense.currency) {
        amount = await convertCurrency(
          expense.amount,
          expense.currency,
          budget.currency
        );
      }
      
      // Add to category total
      if (!spendingByCategory[expense.category]) {
        spendingByCategory[expense.category] = 0;
      }
      spendingByCategory[expense.category] += amount;
    }
    
    // Prepare budget status response
    const budgetStatus = [];
    
    for (const budget of budgets) {
      const spent = spendingByCategory[budget.category] || 0;
      const remaining = budget.limit - spent;
      const percentage = (spent / budget.limit) * 100;
      
      budgetStatus.push({
        budgetId: budget._id,
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        currency: budget.currency,
        status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good'
      });
    }
    
    // Add categories with spending but no budget
    const categoriesWithoutBudget = Object.keys(spendingByCategory).filter(
      category => !budgets.some(budget => budget.category === category)
    );
    
    for (const category of categoriesWithoutBudget) {
      budgetStatus.push({
        category,
        limit: 0,
        spent: spendingByCategory[category],
        remaining: -spendingByCategory[category],
        percentage: Infinity,
        currency: req.user.defaultCurrency,
        status: 'no-budget'
      });
    }
    
    res.status(200).json({
      success: true,
      month,
      data: budgetStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
