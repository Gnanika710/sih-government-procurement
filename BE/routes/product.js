import express from 'express';
import { 
  createProduct, 
  updatedProduct, 
  getProduct, 
  getShopProducts, 
  deleteProduct 
} from '../controllers/product.js';

const router = express.Router();

// Create product (POST)
router.post('/create-product', createProduct);

// Update product (PUT)
router.put('/update-product/:id', updatedProduct);

// Get single product (GET)
router.get('/get-product/:productId', getProduct);

// Get all products for a shop (GET)
router.get('/shop-products/:shopId', getShopProducts);

// Delete product (DELETE)
router.delete('/delete-product/:id', deleteProduct);

export default router;