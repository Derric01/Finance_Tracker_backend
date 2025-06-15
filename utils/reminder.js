/**
 * Utility functions for reminders
 */
const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const mockReminders = require('./mockReminders');

// Flag to track if we're using mock data
let usingMockData = false;

// Setup cron job to check for due reminders
function setupReminderCron() {
  // Check every minute in production you might want to reduce this frequency
  cron.schedule('* * * * *', async () => {
    try {
      // Always check if we should use mock data first
      if (!global.isDbConnected) {
        usingMockData = true;
      }
      
      let dueReminders = [];
      
      if (usingMockData) {
        // Use mock reminder system
        dueReminders = mockReminders.findDueReminders();
        
        // Process each due reminder
        for (const reminder of dueReminders) {
          console.log(`[MOCK] Reminder triggered: ${reminder.message}`);
          mockReminders.processReminder(reminder);
        }
      } else {
        // Use real MongoDB
        try {
          // Find active reminders that are due
          const now = new Date();
          dueReminders = await Reminder.find({
            isActive: true,
            dateTime: { $lte: now }
          }).populate('userId', 'name email');
          
          for (const reminder of dueReminders) {
            // Process the reminder (in a real app, you would send email/push notification)
            console.log(`Reminder triggered: ${reminder.message} for ${reminder.userId.name}`);
            
            // Update reminder based on frequency
            if (reminder.frequency === 'once') {
              // Mark as inactive if it's a one-time reminder
              reminder.isActive = false;
              await reminder.save();
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
              
              reminder.dateTime = nextDateTime;
              await reminder.save();
            }
          }
        } catch (error) {
          console.error('MongoDB reminder error, switching to mock data:', error);
          usingMockData = true;
        }
      }
    } catch (error) {
      console.error('Reminder cron job error:', error);
    }
  });
  
  console.log('Reminder cron job scheduled');
}

/**
 * Create a budget check reminder for a user
 */
async function createBudgetCheckReminder(userId) {
  try {
    if (usingMockData) {
      // Use mock system for creating reminders
      const mockAuth = require('./mockAuth');
      const user = mockAuth.findUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return mockReminders.createBudgetCheckReminder(userId, user.name);
    } else {
      // Use MongoDB
      try {
        const user = await User.findById(userId);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Set reminder for the 25th of current month
        const now = new Date();
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), 25, 10, 0, 0); // 10:00 AM
        
        // If 25th has passed, set for next month
        if (now.getDate() > 25) {
          reminderDate.setMonth(reminderDate.getMonth() + 1);
        }
        
        const reminder = new Reminder({
          userId,
          type: 'budget-check',
          message: `Time to review your monthly budget, ${user.name}!`,
          dateTime: reminderDate,
          frequency: 'monthly'
        });
        
        return await reminder.save();
      } catch (error) {
        console.error('MongoDB reminder creation error, switching to mock data:', error);
        usingMockData = true;
        return createBudgetCheckReminder(userId); // Retry with mock data
      }
    }
  } catch (error) {
    console.error('Create budget reminder error:', error);
    throw error;
  }
}

// Setter for mock data flag
function setUsingMockData(value) {
  usingMockData = value;
  console.log(`Reminder system using mock data: ${value}`);
}

module.exports = {
  setupReminderCron,
  createBudgetCheckReminder,
  setUsingMockData
};
