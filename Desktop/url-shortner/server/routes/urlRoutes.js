import express from 'express';
import { 
  createShortUrl, 
  getUrlStatistics, 
  getAllUrls, 
  deleteUrl,
  getUrlById,
  getUserUrls
} from '../controllers/urlController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/', protect, createShortUrl);
router.get('/user/urls', protect, getUserUrls);

// Get URL statistics
router.get('/stats/:shortCode', getUrlStatistics);

// Public routes - specific routes must come before generic ones
router.get('/', getAllUrls);
router.get('/:id', getUrlById);
router.delete('/:id', protect, deleteUrl);

export default router; 