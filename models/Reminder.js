const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['budget-check', 'log-expense', 'goal-update', 'custom'],
    required: [true, 'Please specify reminder type']
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    trim: true,
    maxlength: [200, 'Message cannot be more than 200 characters']
  },
  dateTime: {
    type: Date,
    required: [true, 'Please specify date and time']
  },
  frequency: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly'],
    default: 'once'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
ReminderSchema.index({ userId: 1, isActive: 1 });
ReminderSchema.index({ dateTime: 1, isActive: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);
