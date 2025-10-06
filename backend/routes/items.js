const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all items for user
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ userId: req.user._id }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// Get item statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Item.countDocuments({ userId: req.user._id });
    const urgent = await Item.countDocuments({ 
      userId: req.user._id, 
      status: 'urgent' 
    });
    const warning = await Item.countDocuments({ 
      userId: req.user._id, 
      status: 'warning' 
    });

    res.json({
      total,
      urgent,
      warning
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// Create new item
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').isIn(['Food', 'Medicine', 'Household', 'Other']).withMessage('Valid category is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, expiryDate, barcode } = req.body;

    const item = new Item({
      name,
      category,
      expiryDate,
      barcode,
      userId: req.user._id
    });

    await item.save();
    
    res.status(201).json({
      message: 'Item added successfully!',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// Update item
router.put('/:id', [
  auth,
  body('name').optional().trim().notEmpty().withMessage('Item name cannot be empty'),
  body('category').optional().isIn(['Food', 'Medicine', 'Household', 'Other']).withMessage('Valid category is required'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Item.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update fields
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.expiryDate) updates.expiryDate = req.body.expiryDate;
    if (req.body.barcode !== undefined) updates.barcode = req.body.barcode;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Item updated successfully!',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// Search items
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      const items = await Item.find({ userId: req.user._id }).sort({ expiryDate: 1 });
      return res.json(items);
    }

    const searchQuery = query.trim();
    const items = await Item.find({
      userId: req.user._id,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ]
    }).sort({ expiryDate: 1 });

    res.json(items);
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ message: 'Server error while searching items' });
  }
});

module.exports = router;