const User = require('../models/User');
const { validateUserCreation, sanitizeUserData } = require('../utils/userValidation');

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    console.log(`Retrieved ${users.length} users`);
    
    res.json({ 
      users,
      total: users.length 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    console.log('Creating user with data:', { 
      email: req.body.email, 
      role: req.body.role,
      hasPassword: !!req.body.password 
    });

    const sanitizedData = sanitizeUserData(req.body);
    
    const validation = await validateUserCreation(sanitizedData);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      return res.status(400).json({ 
        message: validation.errors[0],
        errors: validation.errors 
      });
    }

    const user = new User({
      email: sanitizedData.email,
      passwordHash: sanitizedData.password,
      role: sanitizedData.role,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName
    });

    const savedUser = await user.save();
    
    console.log('User created successfully:', { 
      id: savedUser._id, 
      email: savedUser.email, 
      role: savedUser.role 
    });
    
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      console.log('Duplicate key error for email:', req.body.email);
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.log('Mongoose validation error:', messages);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error while creating user' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { email, role, isActive, firstName, lastName } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = isActive;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const debugUsers = async (req, res) => {
  try {
    console.log('=== DEBUG USERS ENDPOINT ===');
    
    const users = await User.find().select('-passwordHash');
    console.log(`Total users in database: ${users.length}`);
    
    const validationResults = [];
    for (const user of users) {
      try {
        await user.validate();
        validationResults.push({ id: user._id, email: user.email, valid: true });
      } catch (error) {
        validationResults.push({ 
          id: user._id, 
          email: user.email, 
          valid: false, 
          errors: error.errors 
        });
      }
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      validationResults,
      databaseConnection: {
        readyState: User.db.readyState,
        name: User.db.name,
        host: User.db.host
      }
    };
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ 
      message: 'Debug endpoint error', 
      error: error.message,
      stack: error.stack 
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  debugUsers
};