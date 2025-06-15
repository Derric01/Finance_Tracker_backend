# Smart Personal Finance Tracker - Backend

This is the backend API for the Smart Personal Finance Tracker application, built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Transaction management (income and expenses)
- Budget creation and tracking
- Financial goals management
- AI-powered financial insights using Gemini API
- Multi-currency support (USD, INR, EUR)
- Automated reminders system

## Tech Stack

- Node.js & Express.js
- MongoDB with Mongoose
- JSON Web Tokens for authentication
- Google's Generative AI (Gemini) for financial insights
- Node-cron for scheduled reminders

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user details
- `PUT /api/auth/updatedetails` - Update user profile
- `PUT /api/auth/updatepassword` - Update user password

### Transactions
- `GET /api/transactions` - Get all transactions (with filtering options)
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get a specific transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction
- `GET /api/transactions/summary` - Get transaction summary by categories

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create a new budget
- `GET /api/budgets/:id` - Get a specific budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget
- `GET /api/budgets/status` - Get budget status with spending progress

### Goals
- `GET /api/goals` - Get all financial goals
- `POST /api/goals` - Create a new goal
- `GET /api/goals/:id` - Get a specific goal
- `PUT /api/goals/:id` - Update a goal
- `DELETE /api/goals/:id` - Delete a goal
- `PUT /api/goals/:id/progress` - Update goal progress

### AI Insights
- `POST /api/ai/advice` - Get personalized financial advice
- `GET /api/ai/categories` - Get suggested expense and income categories

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create a new reminder
- `GET /api/reminders/:id` - Get a specific reminder
- `PUT /api/reminders/:id` - Update a reminder
- `DELETE /api/reminders/:id` - Delete a reminder
- `POST /api/reminders/defaults` - Create default reminders

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in .env file:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Run the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Currency Support

The application supports the following currencies:
- USD (US Dollar)
- INR (Indian Rupee)
- EUR (Euro)

Currency conversion is handled automatically using exchangerate.host API.
