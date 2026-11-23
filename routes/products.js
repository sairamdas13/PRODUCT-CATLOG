/**
 * routes/products.js
 * CRUD + search routes for the product catalog.
 *
 *   GET    /products                 View all products
 *   GET    /products/search?q=text   Search by name, category or Product ID
 *   GET    /products/:productId      View one product
 *   POST   /products                 Add a product
 *   PUT    /products/:productId      Update a product
 *   DELETE /products/:productId      Delete a product
 */

const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Fields a client is allowed to send
const FIELDS = ['productId', 'name', 'category', 'description', 'price', 'stock'];

function pickFields(body) {
  const data = {};
  FIELDS.forEach(f => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  return data;
}

// Turns Mongoose / MongoDB errors into clean 400 / 409 responses
function sendError(err, res) {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e =>
      e.name === 'CastError' ? `${e.path} must be a valid ${e.kind}` : e.message
    );
    return res.status(400).json({ message: 'Invalid request body', errors });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid request body', errors: [`${err.path} must be a valid ${err.kind}`] });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate Product ID is not allowed' });
  }
  console.error(err.message);
  return res.status(500).json({ message: 'Internal server error' });
}

// GET /products - View all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.status(200).json(products);
  } catch (err) {
    sendError(err, res);
  }
});

// GET /products/search?q=text - Search products (must be before /:productId)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q === '') {
      return res.status(400).json({ message: 'Search text is required, use /products/search?q=text' });
    }
    // Escape special characters so the text is searched literally
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find({
      $or: [{ name: regex }, { category: regex }, { productId: regex }]
    }).sort({ createdAt: 1 });
    res.status(200).json(products);
  } catch (err) {
    sendError(err, res);
  }
});

// GET /products/:productId - View one product
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    sendError(err, res);
  }
});

// POST /products - Add a product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(pickFields(req.body));
    res.status(201).json({ message: 'Product added successfully', data: product });
  } catch (err) {
    sendError(err, res);
  }
});

// PUT /products/:productId - Update a product
router.put('/:productId', async (req, res) => {
  try {
    const data = pickFields(req.body);
    delete data.productId;   // the Product ID cannot be changed

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: ['Provide at least one field to update: name, category, description, price, stock']
      });
    }

    const product = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      data,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully', data: product });
  } catch (err) {
    sendError(err, res);
  }
});

// DELETE /products/:productId - Delete a product
router.delete('/:productId', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully', data: product });
  } catch (err) {
    sendError(err, res);
  }
});

module.exports = router;
