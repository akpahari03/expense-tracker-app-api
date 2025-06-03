// server.js - Updated with proper middleware ordering and debugging

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. CORS middleware FIRST (before body parsing)
app.use(cors({
    origin: ['http://localhost:19000', 'http://localhost:19006', 'exp://localhost:19000'],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 2. Body parsing middleware SECOND
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Add request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    next();
});

// 4. Rate limiter AFTER body parsing (only in production)
if (process.env.NODE_ENV === 'production') {
    app.use(rateLimiter);
    job.start();
}

// 5. Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running smoothly!",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// Add a test endpoint to debug body parsing
app.post('/api/test', (req, res) => {
    console.log('Test endpoint - Body:', req.body);
    console.log('Test endpoint - Headers:', req.headers);
    res.json({
        received: req.body,
        headers: req.headers,
        contentType: req.get('Content-Type')
    });
});

app.use('/api/transactions', transactionsRoute);

// 6. Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 7. Initialize database and start server
initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port: ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Database URL exists: ${!!process.env.DATABASE_URL}`);
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});