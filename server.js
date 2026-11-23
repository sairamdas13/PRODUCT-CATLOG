/**
 * 25SC2008 - Full Stack Web Development - Lab Workbook
 * Experiment 8: Product Catalog using MongoDB and Mongoose
 *
 * Task 1: Connect MongoDB Database -> local server OR MongoDB Atlas, with a connection check
 * Task 2: Validate Requests        -> models/Product.js (name, price, stock, unique Product ID)
 *
 * Project Structure:
 *   product-catalog-api
 *   |-- server.js
 *   |-- models/Product.js
 *   |-- routes/products.js
 *   |-- public/index.html
 *   `-- package.json
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('./models/Product');
const productRoutes = require('./routes/products');

const app = express();
const PORT = 3000;

// ---------- Task 1: MongoDB connection string ----------
// Option 1 - MongoDB Local Server (default):
const LOCAL_URI = 'mongodb://127.0.0.1:27017/productCatalog';

// Option 2 - MongoDB Atlas Cloud Database:
//   Paste your Atlas connection string in the MONGO_URI variable below, for example
//   'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/productCatalog'
//   (or set the MONGO_URI environment variable). Leave it empty to use the local server.
const MONGO_URI = process.env.MONGO_URI || '';

const DB_URI = MONGO_URI || LOCAL_URI;

// ---------- Middleware ----------
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Web page (public/index.html) to use the API in the browser
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Routes ----------
app.use('/products', productRoutes);

// Database status (use this to verify the connection)
app.get('/status', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    database: states[mongoose.connection.readyState],
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  });
});

// ---------- Error handling ----------

// Invalid routes
app.use((req, res) => {
  res.status(404).json({ message: `Invalid route: ${req.method} ${req.originalUrl}` });
});

// Invalid JSON body and any other error
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body: malformed JSON' });
  }
  console.error(err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ---------- Connect to MongoDB, then start the server ----------
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('error', err => console.error('MongoDB error:', err.message));

async function start() {
  const where = MONGO_URI ? 'MongoDB Atlas' : 'local MongoDB server';
  console.log(`Connecting to ${where} ...`);
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 });

    // Verify successful database connection
    await mongoose.connection.db.admin().ping();
    console.log('==========================================');
    console.log(' MongoDB connected successfully');
    console.log(` Database: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
    console.log('==========================================');

    // Make sure the unique index on productId exists (blocks duplicate Product IDs)
    await Product.init();

    app.listen(PORT, () => {
      console.log(`Product Catalog API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection FAILED: ' + err.message);
    console.error('Check that MongoDB is running (local) or that your Atlas connection string and IP access are correct.');
    process.exit(1);
  }
}

start();
