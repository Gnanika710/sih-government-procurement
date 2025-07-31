import { Router } from "express";
const router = Router();
import jwt from "jsonwebtoken";
import Shop from "../models/shop.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";

// create shop
export const createShop = async (req, res, next) => {
  try {
    const { name, address, phoneNumber, zipCode, website, selectedService, socialMedia, userId } = req.body;
    
    console.log("Request received:", req.body);
    
    // Validate required fields
    if (!name || !address || !phoneNumber || !userId) {
      return next(new errorHandler(400, 'Name, address, phone number, and user ID are required'));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new errorHandler(404, 'User not found'));
    }

    console.log("User found:", user);
    console.log("User type:", user.userType);

    // UPDATED: More flexible user type checking
    // If userType doesn't exist or is not set, allow shop creation for now
    // This handles legacy users and registration issues
    if (user.userType && user.userType !== 'retailer') {
      return next(new errorHandler(403, 'Only retailers can create shops'));
    }

    // If userType is missing, update it to retailer (for backward compatibility)
    if (!user.userType) {
      console.log("Updating user type to retailer for backward compatibility");
      await User.findByIdAndUpdate(userId, { userType: 'retailer' });
    }

    // Check if user already has a shop
    const existingShop = await Shop.findOne({ userId });
    if (existingShop) {
      return next(new errorHandler(400, 'User already has a shop'));
    }

    // Create a new shop object with the incoming data
    const newShop = new Shop({
      name,
      address,
      phoneNumber,
      zipCode,
      website,
      selectedService,
      socialMedia,
      userId
    });

    // Save the new shop in the database
    const savedShop = await newShop.save();

    // Update user's isShopCreated status
    await User.findByIdAndUpdate(userId, { 
      isShopCreated: true,
      userType: 'retailer' // Ensure userType is set
    });

    // Generate a token for the new shop
    const token = jwt.sign({ _id: savedShop._id, userId: userId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Return the token and shop details in the response
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      token,
      shop: {
        id: savedShop._id,
        name: savedShop.name,
        address: savedShop.address,
        phoneNumber: savedShop.phoneNumber,
        zipCode: savedShop.zipCode,
        website: savedShop.website,
        selectedService: savedShop.selectedService,
        socialMedia: savedShop.socialMedia,
        userId: savedShop.userId,
      },
    });

  } catch (error) {
    console.error('Create shop error:', error);
    return next(new errorHandler(500, error.message));
  }
};

// Get shop by user ID
export const getShopByUserId = async (req, res, next) => {
  try {
    console.log('Fetching shop info');
    const { userId } = req.params;

    // Find the shop associated with the given userId
    const shop = await Shop.findOne({ userId }).populate('userId', 'username email userType');

    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No shop found for this user.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      shop 
    });
  } catch (error) {
    console.error('Get shop error:', error);
    return next(new errorHandler(500, 'Server error: ' + error.message));
  }
};

export default router;