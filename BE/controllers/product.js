import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import Product from '../models/product.js';
import Shop from '../models/shop.js';
import User from '../models/user.model.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadFile = (file, folder) => {
  const uploadPath = path.join(__dirname, "../uploads", folder, file.name);
  return new Promise((resolve, reject) => {
    file.mv(uploadPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(file.name);
      }
    });
  });
};

export const createProduct = async (req, res) => {
  try {
    console.log('📝 Create product request received:', req.body);
    
    const { name, description, category, tags, originalPrice, discountPrice, stock, userId, shopId } = req.body;

    // Validate required fields
    if (!name || !description || !category || !discountPrice) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, description, category, and discountPrice are required' 
      });
    }

    let finalShopId = shopId;

    // If no shopId provided but userId is provided, find or create shop for user
    if (!finalShopId && userId) {
      console.log('🔍 Looking for shop for user:', userId);
      
      // First, try to find existing shop for this user
      let userShop = await Shop.findOne({ userId });
      
      if (!userShop) {
        console.log('🏪 No shop found, creating default shop for user');
        
        // Get user details
        const user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({ 
            success: false,
            message: 'User not found' 
          });
        }

        // Create a default shop for the user
        userShop = await Shop.create({
          name: `${user.username}'s Shop`,
          address: 'Default Address (Please update)',
          phoneNumber: '+91-0000000000',
          userId: userId,
          zipCode: '000000',
          selectedService: 'General Store'
        });

        // Update user to mark shop as created
        await User.findByIdAndUpdate(userId, { isShopCreated: true });
        
        console.log('✅ Created default shop:', userShop._id);
      }
      
      finalShopId = userShop._id;
    }

    // If still no shop ID, create a generic one
    if (!finalShopId) {
      console.log('🏪 Creating generic shop for product');
      
      const genericShop = await Shop.create({
        name: 'Generic Store',
        address: 'Default Address',
        phoneNumber: '+91-0000000000',
        zipCode: '000000',
        selectedService: 'General Store'
      });
      
      finalShopId = genericShop._id;
      console.log('✅ Created generic shop:', finalShopId);
    }

    // Handle image upload (optional)
    const imageFile = req.files?.image;
    let imageFileName = '';

    if (imageFile) {
      try {
        console.log('📷 Processing image upload...');
        imageFileName = await uploadFile(imageFile, 'products');
        console.log('✅ Image uploaded successfully:', imageFileName);
      } catch (error) {
        console.error('❌ Image upload error:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to upload image', 
          error: error.message 
        });
      }
    }

    // Create product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category,
      tags: tags ? tags.trim() : '',
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discountPrice: parseFloat(discountPrice),
      stock: stock ? parseInt(stock) : 0,
      image: imageFileName,
      shopId: finalShopId,
    };

    console.log('📦 Creating product with data:', productData);

    const newProduct = await Product.create(productData);
    console.log('✅ Product created successfully:', newProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: newProduct,
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating product', 
      error: error.message 
    });
  }
};

export const updatedProduct = async (req, res) => {
  try {
    console.log('📝 Update product request received:', req.params.id, req.body);
    
    const productId = req.params.id;
    const { name, description, category, tags, originalPrice, discountPrice, stock } = req.body;

    // Validate required fields
    if (!name || !description || !category || !discountPrice) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, description, category, and discountPrice are required' 
      });
    }

    // Handle file upload (optional)
    let imageFileName = '';
    if (req.files && req.files.image) {
      try {
        console.log('📷 Processing image upload for update...');
        const image = req.files.image;
        imageFileName = await uploadFile(image, 'products');
        console.log('✅ Image uploaded successfully:', imageFileName);
      } catch (error) {
        console.error('❌ Image upload error:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to upload image', 
          error: error.message 
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description.trim(),
      category,
      tags: tags ? tags.trim() : '',
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discountPrice: parseFloat(discountPrice),
      stock: stock ? parseInt(stock) : 0,
    };

    // Only update image if a new one was uploaded
    if (imageFileName) {
      updateData.image = imageFileName;
    }

    console.log('📦 Updating product with data:', updateData);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      console.error('❌ Product not found:', productId);
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    console.log('✅ Product updated successfully:', updatedProduct._id);

    res.status(200).json({ 
      success: true, 
      message: 'Product updated successfully!',
      product: updatedProduct 
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating product', 
      error: error.message 
    });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    console.log('📖 Get product request:', req.params.productId);
    
    const productId = req.params.productId;
    const product = await Product.findById(productId).populate('shopId', 'name address');

    if (!product) {
      console.error('❌ Product not found:', productId);
      return res.status(404).json({ 
        success: false,
        message: "Product not found." 
      });
    }

    console.log('✅ Product found:', product.name);

    res.status(200).json({ 
      success: true,
      product 
    });

  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      message: "An error occurred while fetching the product.", 
      error: error.message 
    });
  }
};

// Get all products for a shop
export const getShopProducts = async (req, res) => {
  try {
    console.log('📋 Get shop products request:', req.params.shopId);
    
    const shopId = req.params.shopId;
    const products = await Product.find({ shopId }).populate('shopId', 'name address');

    console.log(`✅ Found ${products.length} products for shop:`, shopId);

    res.status(200).json({ 
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('❌ Error fetching shop products:', error);
    res.status(500).json({ 
      success: false,
      message: "An error occurred while fetching shop products.", 
      error: error.message 
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    console.log('🗑️ Delete product request:', req.params.id);
    
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      console.error('❌ Product not found for deletion:', productId);
      return res.status(404).json({ 
        success: false,
        message: "Product not found." 
      });
    }

    console.log('✅ Product deleted successfully:', deletedProduct.name);

    res.status(200).json({ 
      success: true,
      message: "Product deleted successfully.",
      product: deletedProduct
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: "An error occurred while deleting the product.", 
      error: error.message 
    });
  }
};