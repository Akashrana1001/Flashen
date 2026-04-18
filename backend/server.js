import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultDevOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
];

const allowedOrigins = new Set([...defaultDevOrigins, ...envOrigins]);

// ================= Security & Performance Middleware =================
app.use(helmet()); // Sets HTTP security headers
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools (no Origin header) and known local/dev origins.
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses urlencoded payloads

// Rate Limiting to prevent API abuse (Brute-force logic, AI costs, etc)
const globalRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 200);
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number.isFinite(globalRateLimitMax) && globalRateLimitMax > 0 ? globalRateLimitMax : 200,
    message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Apply rate limiter to all API requests
app.use('/api/', apiLimiter);

// ================= API Routes =================
// The main routes handling Ingestion, SM-2 Grades, Decks, and Analytics
app.use('/api', apiRoutes);

// ================= Error Handling =================
// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// ================= Database Connection =================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard-engine', {
    autoIndex: true, // Auto-build indexes on boot
})
    .then(() => {
        console.log('Connected to MongoDB (The Flashcard Engine DB)');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('   - JWT enabled');
            console.log('   - AI Ingestion Engine ready (powered by Groq/LLama3)');
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
