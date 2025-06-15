const Transaction = require('../models/Transaction');
const { generateFinancialInsights } = require('../utils/ai');
const { normalizeAmounts } = require('../utils/exchange');

// @desc    Get AI-generated financial advice
// @route   POST /api/ai/advice
// @access  Private
exports.getFinancialAdvice = async (req, res) => {
  try {
    // Get date range for transactions (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get transactions for the period
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });
    
    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found in the last 30 days. Add some transactions first.'
      });
    }
    
    // Normalize amounts to user's default currency
    const targetCurrency = req.user.defaultCurrency || 'USD';
    let normalizedTransactions;
    
    try {
      normalizedTransactions = await normalizeAmounts(transactions, targetCurrency);
    } catch (error) {
      console.error('Error normalizing transactions:', error);
      // If normalization fails, use original transactions
      normalizedTransactions = transactions;
    }
    
    // Generate AI insights
    const insights = await generateFinancialInsights(normalizedTransactions, req.user);
    
    res.status(200).json({
      success: true,
      data: {
        insights,
        transactionCount: transactions.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    console.error('AI Advice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial insights. Please try again later.'
    });
  }
};

// @desc    Get expense categories with brief descriptions
// @route   GET /api/ai/categories
// @access  Private
exports.getSuggestedCategories = async (req, res) => {
  // Predefined list of common expense categories with descriptions
  const categories = [
    { name: 'Housing', description: 'Rent, mortgage, property taxes, home insurance' },
    { name: 'Utilities', description: 'Electricity, water, gas, internet, phone' },
    { name: 'Groceries', description: 'Food and household items from supermarkets' },
    { name: 'Transportation', description: 'Fuel, public transit, car maintenance, parking' },
    { name: 'Healthcare', description: 'Medical bills, medications, health insurance' },
    { name: 'Insurance', description: 'Life, health, auto, and other insurance premiums' },
    { name: 'Dining Out', description: 'Restaurants, cafes, food delivery' },
    { name: 'Entertainment', description: 'Movies, concerts, streaming services, hobbies' },
    { name: 'Shopping', description: 'Clothing, electronics, personal items' },
    { name: 'Education', description: 'Tuition, books, courses, student loans' },
    { name: 'Travel', description: 'Vacations, flights, hotels, tours' },
    { name: 'Debt Payments', description: 'Credit card payments, loan repayments' },
    { name: 'Gifts & Donations', description: 'Presents, charitable contributions' },
    { name: 'Subscriptions', description: 'Digital services, memberships, software' },
    { name: 'Personal Care', description: 'Haircuts, gym, spa, grooming products' },
    { name: 'Childcare', description: 'Daycare, babysitting, school expenses' },
    { name: 'Pet Care', description: 'Food, vet visits, pet supplies' },
    { name: 'Home Maintenance', description: 'Repairs, cleaning, furniture, appliances' },
    { name: 'Taxes', description: 'Income tax, property tax, other taxes' },
    { name: 'Miscellaneous', description: 'Other expenses that don\'t fit elsewhere' }
  ];
  
  // Income categories
  const incomeCategories = [
    { name: 'Salary', description: 'Regular employment income' },
    { name: 'Freelance', description: 'Income from freelance or contract work' },
    { name: 'Business', description: 'Revenue from business ownership' },
    { name: 'Investments', description: 'Dividends, interest, capital gains' },
    { name: 'Rental Income', description: 'Money earned from property rentals' },
    { name: 'Gifts', description: 'Money received as gifts' },
    { name: 'Refunds', description: 'Money returned for returns or overpayments' },
    { name: 'Government Benefits', description: 'Social security, unemployment, etc.' },
    { name: 'Other Income', description: 'Any other sources of income' }
  ];
  
  res.status(200).json({
    success: true,
    data: {
      expense: categories,
      income: incomeCategories
    }
  });
};
