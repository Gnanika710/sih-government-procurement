import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import product from './routes/product.js';
import shop from './routes/shop.js'
import scraperRouter from './routes/scraperRouter.js'
import cookieParser from 'cookie-parser';
import path from 'path';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import User from './models/user.model.js'; // Import User model for migration
import cors from 'cors'

dotenv.config();

// MongoDB Connection with Migration
mongoose
  .connect(process.env.MONGO)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Run migration for existing users
    await migrateExistingUsers();
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

// Migration function to update existing users
async function migrateExistingUsers() {
  try {
    console.log('🔄 Starting user migration...');
    
    // Update users without userType field
    const result = await User.updateMany(
      { userType: { $exists: false } }, 
      { 
        $set: { 
          userType: 'customer', 
          isShopCreated: false 
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Migrated ${result.modifiedCount} existing users`);
    } else {
      console.log('✅ No users needed migration');
    }
    
    // Also update users with null userType
    const nullResult = await User.updateMany(
      { userType: null }, 
      { 
        $set: { 
          userType: 'customer', 
          isShopCreated: false 
        } 
      }
    );
    
    if (nullResult.modifiedCount > 0) {
      console.log(`✅ Fixed ${nullResult.modifiedCount} users with null userType`);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware setup
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization','Content-Type'],
  credentials: true,
}));

app.use(fileUpload({
  createParentPath: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/user', 
      shops: '/api/shop',
      products: '/api/product',
      scraping: '/api/scrapedata'
    }
  });
});

// API Routes - BEFORE static file serving
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/shop", shop);
app.use("/api/product", product);
app.use("/api/scrapedata", scraperRouter);

// Static files and React app serving - AFTER API routes
app.use(express.static(path.join(__dirname, '/client/dist')));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Error:', message);
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
  console.log('Backend API: http://localhost:3000');
  console.log('Test endpoint: http://localhost:3000/test');
});