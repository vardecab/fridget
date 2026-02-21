const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000; // You can change this port if needed

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // To parse JSON request bodies

// Path to our JSON database file
const DB_FILE = path.join(__dirname, 'db.json');

// --- Helper functions for reading/writing to db.json ---
function readDb() {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    }
    // Return initial structure if file doesn't exist
    return {
        products: [],
        stats: { eaten: 0, wasted: 0 }
    };
}

function writeDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Ensure db.json exists with initial structure on server start
if (!fs.existsSync(DB_FILE)) {
    writeDb(readDb()); // This will create the file with default content
}

// --- API Endpoints for Products ---
// GET all products
app.get('/api/products', (req, res) => {
    const db = readDb();
    res.json(db.products);
});

// POST a new product
app.post('/api/products', (req, res) => {
    const db = readDb();
    const newProduct = {
        id: db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1,
        ...req.body
    };
    db.products.push(newProduct);
    writeDb(db);
    res.status(201).json(newProduct);
});

// PUT (update) a product
app.put('/api/products/:id', (req, res) => {
    const db = readDb();
    const productId = parseInt(req.params.id);
    const product = db.products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    const { name, expiryDate } = req.body;
    if (name !== undefined) product.name = name;
    if (expiryDate !== undefined) product.expiryDate = expiryDate;
    writeDb(db);
    res.json(product);
});

// DELETE a product
app.delete('/api/products/:id', (req, res) => {
    const db = readDb();
    const productId = parseInt(req.params.id);
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== productId);
    writeDb(db);

    if (db.products.length < initialLength) {
        res.status(204).send(); // No Content
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// --- API Endpoints for Stats ---
// GET stats
app.get('/api/stats', (req, res) => {
    const db = readDb();
    res.json(db.stats);
});

// POST (update) stats
app.post('/api/stats', (req, res) => {
    const db = readDb();
    const { eaten, wasted } = req.body;

    // Basic validation
    if (typeof eaten !== 'number' || typeof wasted !== 'number') {
        return res.status(400).json({ error: 'Invalid stats data. Both eaten and wasted must be numbers.' });
    }

    db.stats = { eaten, wasted };
    writeDb(db);
    res.json(db.stats); // Respond with the updated stats
});

// Serve the index-v1.html file directly for testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-v1.html'));
});

// Add this new route if you want to access it explicitly via /index-v1.html
app.get('/index-v1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-v1.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to access Fridget.`);
}); 