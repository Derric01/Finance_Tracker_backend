// Mock authentication system for when MongoDB is unavailable
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Path to store mock users data
const MOCK_USERS_PATH = path.join(__dirname, '../.mock_users.json');

// Ensure the mock users file exists
const ensureUsersFile = () => {
  try {
    if (!fs.existsSync(MOCK_USERS_PATH)) {
      fs.writeFileSync(MOCK_USERS_PATH, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error ensuring mock users file:', error);
  }
};

// Read mock users from file
const readUsers = () => {
  ensureUsersFile();
  try {
    const data = fs.readFileSync(MOCK_USERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mock users:', error);
    return [];
  }
};

// Write mock users to file
const writeUsers = (users) => {
  try {
    fs.writeFileSync(MOCK_USERS_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing mock users:', error);
  }
};

// Find user by email
exports.findUserByEmail = (email) => {
  const users = readUsers();
  return users.find(user => user.email === email);
};

// Find user by ID
exports.findUserById = (id) => {
  const users = readUsers();
  return users.find(user => user._id === id);
};

// Create a new user
exports.createUser = async (userData) => {
  const users = readUsers();
  
  // Check if user already exists
  if (users.some(user => user.email === userData.email)) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Create new user
  const newUser = {
    _id: Date.now().toString(),
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    defaultCurrency: userData.defaultCurrency || 'USD',
    createdAt: new Date().toISOString()
  };
  
  // Add to users array and save
  users.push(newUser);
  writeUsers(users);
  
  // Return user data (without password)
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// Verify password
exports.verifyPassword = async (user, password) => {
  return await bcrypt.compare(password, user.password);
};

// Generate JWT token
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'your_jwt_secret_here',
    { expiresIn: '30d' }
  );
};
