import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  clickData: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    referrer: {
      type: String,
      default: 'Unknown',
    },
    location: {
      type: String,
      default: 'Unknown',
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for backward compatibility
  },
  isPublic: {
    type: Boolean,
    default: false, // By default, URLs are private to the user who created them
  }
});

const Url = mongoose.model('Url', urlSchema);

export default Url; 