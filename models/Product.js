/**
 * models/Product.js
 * Mongoose schema for a product, with the validations from the lab:
 *   - Product Name is mandatory
 *   - Price cannot be negative
 *   - Stock cannot be negative
 *   - Duplicate Product IDs are not allowed (unique index)
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,            // Duplicate Product IDs are not allowed
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],   // Product Name is mandatory
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']             // Price cannot be negative
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']             // Stocks cannot be negative
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
