import express from 'express';
import { redirectToOriginalUrl } from '../controllers/urlController.js';

const router = express.Router();

// Redirect to original URL
router.get('/:shortcode', redirectToOriginalUrl);

export default router; 