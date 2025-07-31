import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import product from './routes/product.js';
import shop from './routes/shop.js';
import scraperRouter from './routes/scraperRouter.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Load environment variables first
dotenv.config();

// Validate environment variables
console.log('🔍 Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGO connection string exists:', !!process.env.MONGO);
console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);

if (!process.env.MONGO) {
  console.error('❌ MONGO environment variable is missing!');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is missing!');
  process.exit(1);
}

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection with detailed logging
console.log('🔄 Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    
    // Test database operations
    try {
      const { default: User } = await import('./models/user.model.js');
      console.log('✅ User model imported successfully');
      
      const userCount = await User.countDocuments();
      console.log(`📊 Current users in database: ${userCount}`);
      
      // Migration for existing users
      const migrationResult = await User.updateMany(
        { userType: { $exists: false } },
        { 
          $set: { 
            userType: 'customer', 
            isShopCreated: false 
          } 
        }
      );
      
      if (migrationResult.modifiedCount > 0) {
        console.log(`🔄 Migrated ${migrationResult.modifiedCount} existing users`);
      } else {
        console.log('✅ No users needed migration');
      }
      
    } catch (modelError) {
      console.error('❌ Error with User model:', modelError.message);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Middleware setup with logging
console.log('🔧 Setting up middleware...');

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));

app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`📡 ${req.method} ${req.path}`, {
      body: req.body,
      headers: req.headers['content-type']
    });
  }
  next();
});

// API Routes - IMPORTANT: These must come before static file serving
console.log('🛣️ Setting up API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/shop', shop);
app.use('/api/product', product);
app.use('/api/scrapedata', scraperRouter);

// Debug endpoints
app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running successfully!',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      mongoConnected: mongoose.connection.readyState === 1,
      jwtSecretExists: !!process.env.JWT_SECRET
    },
    endpoints: {
      auth: '/api/auth/signup, /api/auth/signin',
      users: '/api/user',
      shops: '/api/shop',
      products: '/api/product',
      scraping: '/api/scrapedata'
    }
  });
});

app.get('/debug/db', async (req, res) => {
  try {
    const { default: User } = await import('./models/user.model.js');
    const userCount = await User.countDocuments();
    const sampleUser = await User.findOne().select('username email userType');
    
    res.json({ 
      success: true, 
      message: 'Database connected and operational',
      stats: {
        userCount,
        dbState: mongoose.connection.readyState,
        sampleUser
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

app.post('/debug/signup', async (req, res) => {
  try {
    console.log('🧪 Debug signup request:', req.body);
    
    const { default: User } = await import('./models/user.model.js');
    const bcryptjs = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;
    
    const { username, email, password, userType = 'customer' } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        received: { username: !!username, email: !!email, password: !!password }
      });
    }
    
    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        conflictField: existingUser.email === email ? 'email' : 'username'
      });
    }
    
    // Create user
    const hashedPassword = bcryptjs.hashSync(password, 12);
    const newUser = new User({ 
      username: username.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword,
      userType: userType,
      isShopCreated: false
    });
    
    await newUser.save();
    console.log('✅ Debug user created:', { id: newUser._id, userType: newUser.userType });
    
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    const { password: pass, ...rest } = newUser._doc;
    
    res.status(201).json({ 
      success: true,
      message: 'Debug signup successful', 
      user: rest,
      token 
    });
    
  } catch (error) {
    console.error('❌ Debug signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});

// Static file serving comes after API routes
app.use(express.static(path.join(__dirname, '/client/dist')));

// Catch-all route comes last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Error occurred:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`🌐 Backend API: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔍 Debug endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/debug/db`);
  console.log(`   - POST http://localhost:${PORT}/debug/signup`);
  console.log(`📡 Auth endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/signin`);
});