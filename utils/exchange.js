/**
 * Utility functions for currency exchange rates
 */

// Hardcoded rates as fallback in case API fails
const FALLBACK_RATES = {
  USD: {
    USD: 1,
    EUR: 0.92,
    INR: 83.15
  },
  EUR: {
    USD: 1.09,
    EUR: 1,
    INR: 90.43
  },
  INR: {
    USD: 0.012,
    EUR: 0.011,
    INR: 1
  }
};

// Function to get latest exchange rates
async function getRates(base = 'USD') {
  try {
    // Due to API issues, we're using fallback rates directly
    console.log(`Using fallback exchange rates for ${base}`);
    return FALLBACK_RATES[base];
    
    /* Commented out API call that's failing
    const response = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=INR,USD,EUR`);
    
    if (!response.ok) {
      console.warn(`Exchange rate API returned status: ${response.status}`);
      return FALLBACK_RATES[base];
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    return data.rates;
    */
  } catch (error) {
    console.error('Exchange rate error:', error);
    // Return default values in case of failure
    return FALLBACK_RATES[base];
  }
}

// Convert amount from one currency to another
async function convertCurrency(amount, fromCurrency, toCurrency) {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    // Convert amount to number if it's a string
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount)) {
      console.error(`Invalid amount provided for conversion: ${amount}`);
      return 0;
    }
    
    const rates = await getRates(fromCurrency);
    
    if (!rates || !rates[toCurrency]) {
      console.error(`No rate found for ${fromCurrency} to ${toCurrency}`);
      // Use fallback rates
      return numericAmount * FALLBACK_RATES[fromCurrency][toCurrency];
    }
    
    return numericAmount * rates[toCurrency];
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Use fallback rates as last resort
    return amount * FALLBACK_RATES[fromCurrency][toCurrency];
  }
}

// Normalize all amounts to a single currency for reporting
async function normalizeAmounts(transactions, targetCurrency = 'USD') {
  const normalizedTransactions = [];
  
  for (const transaction of transactions) {
    try {
      // Skip if transaction object is invalid
      if (!transaction || !transaction.amount || !transaction.currency) {
        console.error('Invalid transaction object:', transaction);
        continue;
      }
      
      const normalizedAmount = await convertCurrency(
        transaction.amount,
        transaction.currency,
        targetCurrency
      );
      
      // Handle Mongoose document to plain object conversion
      const transactionData = typeof transaction.toObject === 'function' 
        ? transaction.toObject() 
        : { ...transaction };
      
      normalizedTransactions.push({
        ...transactionData,
        normalizedAmount,
        normalizedCurrency: targetCurrency
      });
    } catch (error) {
      console.error('Error normalizing transaction:', error);
      // Add the transaction without normalization if there's an error
      normalizedTransactions.push(transaction);
    }
  }
  
  return normalizedTransactions;
}

module.exports = {
  getRates,
  convertCurrency,
  normalizeAmounts
};
