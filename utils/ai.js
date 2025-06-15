/**
 * Utility functions for Gemini AI integration
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API with a check
let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } else {
    console.error('Missing GEMINI_API_KEY in environment variables');
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

/**
 * Generate financial insights based on transaction data
 * @param {Array} transactions - Array of user transactions
 * @param {Object} user - User object
 * @returns {Promise<String>} - AI-generated financial advice
 */
async function generateFinancialInsights(transactions, user) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing in environment variables');
      return "AI insights are not available. The administrator needs to configure the API key.";
    }
    
    // Format transactions for the AI prompt
    const formattedData = transactions.map(t => ({
      type: t.type,
      category: t.category,
      amount: t.amount,
      currency: t.currency,
      date: t.date,
      notes: t.notes || ''
    }));
    
    // Calculate some basic stats for context
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    
    // Create the prompt for Gemini
    const prompt = `
You are a personal finance advisor analyzing a user's recent financial activity.
Based on the following transaction data (amounts in ${user.defaultCurrency || 'USD'}):

Total Income: ${totalIncome}
Total Expenses: ${totalExpenses}
Net Cash Flow: ${totalIncome - totalExpenses}

Expense Categories:
${Object.entries(categories).map(([category, amount]) => `- ${category}: ${amount}`).join('\n')}

Transaction History:
${JSON.stringify(formattedData, null, 2)}

Provide a brief, actionable financial insight with these components:
1. Spending Pattern Analysis: Identify 1-2 key patterns from their transactions.
2. Budget Recommendation: Suggest 1 specific budget adjustment based on spending.
3. Savings Opportunity: Highlight 1 specific way they could increase savings.
4. Financial Health Score: Rate their financial health from 1-10 based on income/expense ratio, spending patterns, and category distribution.

Keep the entire response under 400 words, be specific, and personalized to their actual data.    `;

    // Get response from Gemini
    if (!genAI) {
      return "AI insights are currently unavailable. The service is being configured.";
    }
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error.message && error.message.includes('API key')) {
      return "AI insights are not available due to API key configuration issues. Please contact the administrator.";
    }
    return "I couldn't analyze your finances at this time. Please try again later.";
  }
}

module.exports = {
  generateFinancialInsights
};
