import { nanoid } from 'nanoid';
import Url from '../models/Url.js';

// Function to validate if a shortcode is alphanumeric and reasonable length
export const isValidShortcode = (shortcode) => {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return shortcode && 
         alphanumericRegex.test(shortcode) && 
         shortcode.length >= 4 && 
         shortcode.length <= 10;
};

// Function to check if a shortcode is already in use
export const isShortcodeAvailable = async (shortcode) => {
  const existingUrl = await Url.findOne({ shortCode: shortcode });
  return !existingUrl;
};

// Function to generate a unique shortcode
export const generateUniqueShortcode = async (customShortcode = null) => {
  // If custom shortcode is provided and valid, try to use it
  if (customShortcode && isValidShortcode(customShortcode)) {
    const isAvailable = await isShortcodeAvailable(customShortcode);
    if (isAvailable) {
      return customShortcode;
    }
    // If custom shortcode is not available, we'll generate a random one
  }
  
  // Generate a random shortcode
  let shortcode;
  let isAvailable = false;
  
  while (!isAvailable) {
    // Generate a 6-character shortcode
    shortcode = nanoid(6);
    isAvailable = await isShortcodeAvailable(shortcode);
  }
  
  return shortcode;
}; 