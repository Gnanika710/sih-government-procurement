import express from 'express';
import { createShop, getShopByUserId } from '../controllers/shop.js';

const router = express.Router();

router.post('/create-shop', createShop);
router.get('/get-shop-info/:userId', getShopByUserId);

export default router;