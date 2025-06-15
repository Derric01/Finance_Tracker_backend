const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  limit: {
    type: Number,
    required: [true, 'Please add a budget limit']
  },
  month: {
    type: String,
    required: [true, 'Please specify month in YYYY-MM format']
  },
  currency: {
    type: String,
    enum: ['USD', 'INR', 'EUR'],
    required: [true, 'Please specify currency']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create composite index to ensure one budget per user/category/month
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
