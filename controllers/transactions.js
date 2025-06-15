const Transaction = require('../models/Transaction');
const { normalizeAmounts } = require('../utils/exchange');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    // Add user ID to request body
    req.body.userId = req.user.id;
    
    // Validate required fields
    if (!req.body.type || !req.body.category || !req.body.amount || !req.body.currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, category, amount, and currency are required'
      });
    }
    
    // Ensure amount is a number
    req.body.amount = parseFloat(req.body.amount);
    if (isNaN(req.body.amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid number'
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create(req.body);
    
    res.status(201).json({
      success: true,
      data: transaction
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

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    // Build query
    let query = { userId: req.user.id };
    
    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.date = { $lte: new Date(req.query.endDate) };
    }
    
    // Filter by month (YYYY-MM format) if provided
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Execute query with sorting
    let transactions = await Transaction.find(query)
      .sort({ date: -1 });
    
    // Normalize amounts to user's preferred currency if requested
    if (req.query.normalize === 'true' && req.query.currency) {
      transactions = await normalizeAmounts(transactions, req.query.currency);
    }
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Make sure user owns transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this transaction'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Make sure user owns transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this transaction'
      });
    }
    
    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: transaction
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

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Make sure user owns transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this transaction'
      });
    }
    
    await transaction.deleteOne();
    
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

// @desc    Get transaction summary (totals by category, income vs expense)
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res) => {
  try {
    // Build date filter
    let dateFilter = {};
    
    // Filter by month (YYYY-MM format) if provided
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      dateFilter = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (req.query.startDate && req.query.endDate) {
      dateFilter = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get transactions
    const query = { userId: req.user.id };
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    const transactions = await Transaction.find(query);
    
    // Normalize amounts if requested
    let normalizedTransactions = transactions;
    if (req.query.currency) {
      normalizedTransactions = await normalizeAmounts(transactions, req.query.currency);
    }
    
    // Calculate summary
    const summary = {
      income: {
        total: 0,
        byCategory: {}
      },
      expense: {
        total: 0,
        byCategory: {}
      },
      netCashflow: 0,
      currency: req.query.currency || req.user.defaultCurrency
    };
    
    // Process each transaction
    normalizedTransactions.forEach(transaction => {
      const amount = transaction.normalizedAmount || transaction.amount;
      
      if (transaction.type === 'income') {
        summary.income.total += amount;
        
        // Add to category total
        if (!summary.income.byCategory[transaction.category]) {
          summary.income.byCategory[transaction.category] = 0;
        }
        summary.income.byCategory[transaction.category] += amount;
      } else {
        summary.expense.total += amount;
        
        // Add to category total
        if (!summary.expense.byCategory[transaction.category]) {
          summary.expense.byCategory[transaction.category] = 0;
        }
        summary.expense.byCategory[transaction.category] += amount;
      }
    });
    
    // Calculate net cashflow
    summary.netCashflow = summary.income.total - summary.expense.total;
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
