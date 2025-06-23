import Url from '../models/Url.js';
import { generateUniqueShortcode, isValidShortcode } from '../utils/generateShortCode.js';

// Create a shortened URL
export const createShortUrl = async (req, res) => {
  try {
    const { originalUrl, customCode, expiryDays } = req.body;
    
    // Validate URL
    if (!originalUrl) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }
    
    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }
    
    // Set expiry date (default to 30 days if not specified)
    const daysToExpire = expiryDays || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(daysToExpire));
    
    let shortCode;
    let existingUrl;
    
    // Check if custom code is provided
    if (customCode) {
      // Check if custom code already exists
      existingUrl = await Url.findOne({ shortCode: customCode });
      if (existingUrl) {
        return res.status(400).json({ error: 'Custom code already in use' });
      }
      shortCode = customCode;
    } else {
      // Generate a unique short code
      shortCode = generateUniqueShortcode();
      existingUrl = await Url.findOne({ shortCode });
      
      // Keep generating until we find a unique one
      while (existingUrl) {
        shortCode = generateUniqueShortcode();
        existingUrl = await Url.findOne({ shortCode });
      }
    }
    
    // Create the short URL
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
    
    // Create new URL document
    const url = new Url({
      originalUrl,
      shortCode,
      shortUrl,
      expiryDate,
      user: req.user ? req.user._id : null, // Associate with user if authenticated
      isPublic: req.body.isPublic || false
    });
    
    // Save to database
    await url.save();
    
    res.status(201).json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: url.shortUrl,
      expiryDate: url.expiryDate,
      isPublic: url.isPublic
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Redirect to original URL
export const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    // Find URL in database
    const urlDoc = await Url.findOne({ shortCode: shortcode });
    
    // If URL not found
    if (!urlDoc) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }
    
    // Check if URL has expired
    if (new Date() > new Date(urlDoc.expiryDate)) {
      return res.status(410).json({ 
        error: 'Short URL has expired' 
      });
    }
    
    // Increment click count
    urlDoc.clicks += 1;
    
    // Record click data
    urlDoc.clickData.push({
      timestamp: new Date(),
      referrer: req.get('referer') || 'Direct',
      location: req.ip || 'Unknown'
    });
    
    // Save updated stats
    await urlDoc.save();
    
    // Redirect to original URL
    return res.redirect(urlDoc.originalUrl);
    
  } catch (error) {
    console.error('Error redirecting to original URL:', error);
    return res.status(500).json({ 
      error: 'Server error while redirecting' 
    });
  }
};

// Get URL statistics
export const getUrlStatistics = async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    // Find URL in database
    const urlDoc = await Url.findOne({ shortCode: shortcode });
    
    // If URL not found
    if (!urlDoc) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }
    
    // Return statistics
    return res.status(200).json({
      originalUrl: urlDoc.originalUrl,
      shortUrl: urlDoc.shortUrl,
      clicks: urlDoc.clicks,
      createdAt: urlDoc.createdAt,
      expiryDate: urlDoc.expiryDate,
      isExpired: new Date() > new Date(urlDoc.expiryDate),
      clickData: urlDoc.clickData
    });
    
  } catch (error) {
    console.error('Error fetching URL statistics:', error);
    return res.status(500).json({ 
      error: 'Server error while fetching statistics' 
    });
  }
};

// Get all URLs
export const getAllUrls = async (req, res) => {
  try {
    let query = {};
    
    // If user is authenticated, show their URLs and public URLs
    if (req.user) {
      // Admin can see all URLs
      if (req.user.role === 'admin') {
        // No filter needed for admin
      } else {
        // Regular users see their own URLs and public URLs
        query = {
          $or: [
            { user: req.user._id },
            { isPublic: true }
          ]
        };
      }
    } else {
      // Unauthenticated users only see public URLs
      query = { isPublic: true };
    }
    
    const urls = await Url.find(query).sort({ createdAt: -1 });
    res.status(200).json(urls);
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get URL by ID
export const getUrlById = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check permissions
    if (!url.isPublic && (!req.user || (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin'))) {
      return res.status(403).json({ error: 'Not authorized to access this URL' });
    }

    res.status(200).json(url);
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete URL
export const deleteUrl = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check permissions (only owner or admin can delete)
    if (!req.user || (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to delete this URL' });
    }

    await url.deleteOne();
    res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get URLs for current user
export const getUserUrls = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const urls = await Url.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(urls);
  } catch (error) {
    console.error('Error fetching user URLs:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 