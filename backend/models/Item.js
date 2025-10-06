const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Medicine', 'Household', 'Other']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  daysRemaining: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'urgent'],
    default: 'normal'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barcode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Calculate days remaining before saving
itemSchema.pre('save', function(next) {
  if (this.expiryDate) {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Set status based on days remaining
    if (this.daysRemaining <= 0) {
      this.status = 'urgent';
      this.daysRemaining = 0;
    } else if (this.daysRemaining <= 7) {
      this.status = 'urgent';
    } else if (this.daysRemaining <= 30) {
      this.status = 'warning';
    } else {
      this.status = 'normal';
    }
  }
  next();
});

// Update days remaining for existing items
itemSchema.methods.updateDaysRemaining = function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const timeDiff = expiry.getTime() - today.getTime();
  this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (this.daysRemaining <= 0) {
    this.status = 'urgent';
    this.daysRemaining = 0;
  } else if (this.daysRemaining <= 7) {
    this.status = 'urgent';
  } else if (this.daysRemaining <= 30) {
    this.status = 'warning';
  } else {
    this.status = 'normal';
  }
  
  return this.save();
};

module.exports = mongoose.model('Item', itemSchema);