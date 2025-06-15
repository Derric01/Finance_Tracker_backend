// Mock reminder system for when MongoDB is unavailable
const fs = require('fs');
const path = require('path');

// Path to store mock reminders data
const MOCK_REMINDERS_PATH = path.join(__dirname, '../.mock_reminders.json');

// Ensure the mock reminders file exists
const ensureRemindersFile = () => {
  try {
    if (!fs.existsSync(MOCK_REMINDERS_PATH)) {
      fs.writeFileSync(MOCK_REMINDERS_PATH, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error ensuring mock reminders file:', error);
  }
};

// Read mock reminders from file
const readReminders = () => {
  ensureRemindersFile();
  try {
    const data = fs.readFileSync(MOCK_REMINDERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mock reminders:', error);
    return [];
  }
};

// Write mock reminders to file
const writeReminders = (reminders) => {
  try {
    fs.writeFileSync(MOCK_REMINDERS_PATH, JSON.stringify(reminders, null, 2));
  } catch (error) {
    console.error('Error writing mock reminders:', error);
  }
};

// Find active reminders due now
exports.findDueReminders = () => {
  const reminders = readReminders();
  const now = new Date();
  
  return reminders.filter(reminder => {
    return reminder.isActive && new Date(reminder.dateTime) <= now;
  });
};

// Process a reminder based on frequency
exports.processReminder = (reminder) => {
  const reminders = readReminders();
  const index = reminders.findIndex(r => r._id === reminder._id);
  
  if (index === -1) return;
  
  if (reminder.frequency === 'once') {
    // Mark as inactive if it's a one-time reminder
    reminders[index].isActive = false;
  } else {
    // Update the next occurrence time based on frequency
    const nextDateTime = new Date(reminder.dateTime);
    
    switch (reminder.frequency) {
      case 'daily':
        nextDateTime.setDate(nextDateTime.getDate() + 1);
        break;
      case 'weekly':
        nextDateTime.setDate(nextDateTime.getDate() + 7);
        break;
      case 'monthly':
        nextDateTime.setMonth(nextDateTime.getMonth() + 1);
        break;
    }
    
    reminders[index].dateTime = nextDateTime.toISOString();
  }
  
  writeReminders(reminders);
  return reminders[index];
};

// Create a new reminder
exports.createReminder = (reminderData) => {
  const reminders = readReminders();
  
  const newReminder = {
    _id: Date.now().toString(),
    userId: reminderData.userId,
    type: reminderData.type || 'general',
    message: reminderData.message,
    dateTime: reminderData.dateTime || new Date().toISOString(),
    frequency: reminderData.frequency || 'once',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  reminders.push(newReminder);
  writeReminders(reminders);
  
  return newReminder;
};

// Create a budget check reminder for a user
exports.createBudgetCheckReminder = (userId, userName) => {
  // Set reminder for the 25th of current month
  const now = new Date();
  const reminderDate = new Date(now.getFullYear(), now.getMonth(), 25, 10, 0, 0); // 10:00 AM
  
  // If 25th has passed, set for next month
  if (now.getDate() > 25) {
    reminderDate.setMonth(reminderDate.getMonth() + 1);
  }
  
  return this.createReminder({
    userId,
    type: 'budget-check',
    message: `Time to review your monthly budget, ${userName}!`,
    dateTime: reminderDate.toISOString(),
    frequency: 'monthly'
  });
};

module.exports = exports;
