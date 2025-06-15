const User = require('../models/User');

// Import mock auth utilities
const mockAuth = require('../utils/mockAuth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, defaultCurrency } = req.body;

    // If database is connected, use MongoDB
    if (global.isDbConnected) {
      // Check if user already exists
      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        defaultCurrency: defaultCurrency || 'USD'
      });

      sendTokenResponse(user, 201, res);
    } else {
      // Use mock auth system when database is unavailable
      try {
        // Check if user exists
        const existingUser = mockAuth.findUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User already exists'
          });
        }

        // Create mock user
        const user = await mockAuth.createUser({
          name,
          email,
          password,
          defaultCurrency: defaultCurrency || 'USD'
        });

        // Generate token
        const token = mockAuth.generateToken(user);

        res.status(201).json({
          success: true,
          token,
          data: user
        });
      } catch (mockError) {
        console.error('Mock auth error:', mockError);
        return res.status(400).json({
          success: false,
          message: mockError.message || 'Error creating account'
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // If database is connected, use MongoDB
    if (global.isDbConnected) {
      // Check for user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      sendTokenResponse(user, 200, res);
    } else {
      // Use mock auth system when database is unavailable
      try {
        // Find user
        const user = mockAuth.findUserByEmail(email);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Verify password
        const isMatch = await mockAuth.verifyPassword(user, password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Generate token
        const token = mockAuth.generateToken(user);

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
          success: true,
          token,
          data: userWithoutPassword
        });
      } catch (mockError) {
        console.error('Mock auth error:', mockError);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (global.isDbConnected) {
      const user = await User.findById(req.user.id);

      res.status(200).json({
        success: true,
        data: user
      });
    } else {
      // Use mock auth when database is unavailable
      const user = mockAuth.findUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({
        success: true,
        data: userWithoutPassword
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      defaultCurrency: req.body.defaultCurrency
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    ),
    httpOnly: true
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      data: user
    });
};
