
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Expense Tracker API is running!'
    });
});

const PORT = process.env.PORT || 5000;

// Connect database and start server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
