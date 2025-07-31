import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import {verifyToken} from '../utils/verifyUser.js'

export const signup = async (req, res, next) => {
  try {
    const { username, email, password, userType = 'customer' } = req.body;
    
    console.log('Signup request received:', { username, email, userType });
    
    // Input validation
    if (!username || !email || !password) {
      return next(new errorHandler(400, 'All fields are required'));
    }

    if (password.length < 6) {
      return next(new errorHandler(400, 'Password must be at least 6 characters long'));
    }

    // Validate userType
    const validUserTypes = ['customer', 'retailer', 'government'];
    if (!validUserTypes.includes(userType)) {
      return next(new errorHandler(400, 'Invalid user type'));
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return next(new errorHandler(400, 'Email already exists'));
      }
      if (existingUser.username === username) {
        return next(new errorHandler(400, 'Username already exists'));
      }
    }

    const hashedPassword = bcryptjs.hashSync(password, 12);
    const newUser = new User({ 
      username: username.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword,
      userType: userType,
      isShopCreated: false
    });

    await newUser.save();
    console.log('User created successfully:', { id: newUser._id, userType: newUser.userType });
    
    // Automatically log in after signup by generating a token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    const { password: pass, ...rest } = newUser._doc;
    const expiryDate = new Date(Date.now() + 3600000); // 1 hour

    const message = userType === 'retailer' 
      ? 'Retailer registered successfully! Welcome to your dashboard.' 
      : userType === 'government'
      ? 'Government official registered successfully! Welcome to your dashboard.'
      : 'User registered successfully';

    res
      .cookie('access_token', token, { 
        httpOnly: true, 
        expires: expiryDate,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      .status(201)
      .json({ 
        success: true,
        message: message, 
        user: rest,
        token 
      });
      
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new errorHandler(400, `${field} already exists`));
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new errorHandler(400, errors.join(', ')));
    }
    
    next(new errorHandler(500, 'Registration failed. Please try again.'));
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return next(new errorHandler(400, 'Email and password are required'));
    }

    const validUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!validUser) {
      return next(new errorHandler(404, 'User not found'));
    }
    
    console.log('User found:', { id: validUser._id, userType: validUser.userType });
    
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(new errorHandler(401, 'Invalid credentials'));
    }
    
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    const { password: pass, ...rest } = validUser._doc;
    const expiryDate = new Date(Date.now() + 3600000); // 1 hour
    
    res
      .cookie('access_token', token, { 
        httpOnly: true, 
        expires: expiryDate,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      .status(200)
      .json({ 
        success: true,
        message: 'Welcome back! You have successfully logged in.', 
        user: rest,
        token 
      });
      
  } catch (error) {
    console.error('Signin error:', error);
    next(new errorHandler(500, 'Login failed. Please try again.'));
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: hashedPassword, ...rest } = user._doc;
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour
      res
        .cookie('access_token', token, {
          httpOnly: true,
          expires: expiryDate,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 12);
      const newUser = new User({
        username:
          req.body.name.split(' ').join('').toLowerCase() +
          Math.random().toString(36).slice(-8),
        email: req.body.email,
        password: hashedPassword,
        profilePicture: req.body.photo,
        userType: 'customer', // Default for Google users
        isShopCreated: false
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: hashedPassword2, ...rest } = newUser._doc;
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour
      res
        .cookie('access_token', token, {
          httpOnly: true,
          expires: expiryDate,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sign out', error: error.message });
  }
};