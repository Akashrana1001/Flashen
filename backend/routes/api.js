import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ingestPDF } from '../controllers/ingestController.js';
import { submitGrade } from '../controllers/studyController.js';
import { getMasteryAnalytics } from '../controllers/analyticsController.js';
import { askChatbot } from '../controllers/chatController.js';
import { User, Deck, Card } from '../models/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Temp RAM storage for PDF parsing
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

const parsePositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isObjectIdLike = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const sanitizeUser = (userDoc) => ({
    _id: userDoc._id,
    name: userDoc.name || '',
    email: userDoc.email,
    college: userDoc.college || '',
    avatarUrl: userDoc.avatarUrl || '',
    hasAcceptedTerms: Boolean(userDoc.hasAcceptedTerms),
    streaks: userDoc.streaks || 0,
    totalCardsMastered: userDoc.totalCardsMastered || 0,
});

const signToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// ================= Public Auth Routes =================
router.post('/auth/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required.' });
        }

        if (!email?.trim()) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: passwordHash,
            hasAcceptedTerms: false,
        });

        const token = signToken(user._id);

        return res.status(201).json({
            success: true,
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        next(error);
    }
});

router.post('/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = signToken(user._id);

        return res.status(200).json({
            success: true,
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        next(error);
    }
});

// ================= Protected Routes Middleware =================
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Missing or invalid authorization token.' });
        }

        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
};

// Apply auth to all protected routes
router.use(authMiddleware);

const refreshLimiter = rateLimit({
    windowMs: parsePositiveInt(process.env.REFRESH_LIMIT_WINDOW_MS, 10 * 60 * 1000),
    max: parsePositiveInt(process.env.REFRESH_LIMIT_MAX, 60),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `refresh:${req.user?._id?.toString() || req.ip}`,
    message: {
        success: false,
        message: 'Refresh limit reached for this account. Please wait before trying again.'
    }
});

const chatLimiter = rateLimit({
    windowMs: parsePositiveInt(process.env.CHAT_RATE_WINDOW_MS, 60 * 1000),
    max: parsePositiveInt(process.env.CHAT_RATE_MAX, 15),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `chat:${req.user?._id?.toString() || req.ip}`,
    message: {
        success: false,
        message: 'Chat rate limit reached. Please wait a moment and try again.'
    }
});

router.get('/user/me', async (req, res) => {
    res.json({ success: true, user: sanitizeUser(req.user) });
});

router.patch('/user/accept-terms', async (req, res, next) => {
    try {
        req.user.hasAcceptedTerms = true;
        await req.user.save();

        return res.status(200).json({
            success: true,
            user: sanitizeUser(req.user),
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/user/profile', async (req, res, next) => {
    try {
        const { name, college } = req.body;

        if (typeof name === 'string') {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
            }
            req.user.name = name.trim();
        }

        if (typeof college === 'string') {
            req.user.college = college.trim();
        }

        await req.user.save();

        return res.status(200).json({
            success: true,
            user: sanitizeUser(req.user),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/ingest
 * @desc Ingest a full PDF, extract context, generate SM-2 Cards via groq-sdk
 */
router.post('/ingest', upload.single('file'), ingestPDF);

/**
 * @route POST /api/study/grade
 * @desc Compute the SM-2 outcome for a card grading (0-5)
 */
router.post('/study/grade', submitGrade);

router.get('/decks', refreshLimiter, async (req, res, next) => {
    try {
        const decks = await Deck.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();
        const deckIds = decks.map((deck) => deck._id);

        const cards = deckIds.length
            ? await Card.find({ ownerId: req.user._id, deckId: { $in: deckIds } }).sort({ createdAt: 1 }).lean()
            : [];

        const cardsByDeck = cards.reduce((acc, card) => {
            const key = card.deckId.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push(card);
            return acc;
        }, {});

        const decksWithCards = decks.map((deck) => ({
            ...deck,
            cards: cardsByDeck[deck._id.toString()] || []
        }));

        res.json({ success: true, count: decksWithCards.length, decks: decksWithCards });
    } catch (error) {
        next(error);
    }
});

router.delete('/decks/:deckId', async (req, res, next) => {
    try {
        const { deckId } = req.params;

        if (!isObjectIdLike(deckId)) {
            return res.status(400).json({ success: false, message: 'Invalid deck id.' });
        }

        const deck = await Deck.findOne({ _id: deckId, ownerId: req.user._id });
        if (!deck) {
            return res.status(404).json({ success: false, message: 'Deck not found.' });
        }

        const deletedCards = await Card.deleteMany({ ownerId: req.user._id, deckId: deck._id });
        await Deck.deleteOne({ _id: deck._id, ownerId: req.user._id });

        return res.status(200).json({
            success: true,
            deckId: deck._id,
            deletedCards: Number(deletedCards?.deletedCount || 0),
            message: 'Deck deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
});

router.get('/analytics/mastery', refreshLimiter, getMasteryAnalytics);
router.get('/stats/mastery', refreshLimiter, getMasteryAnalytics);
router.post('/chat', chatLimiter, askChatbot);

// Centralized error response module
router.use((err, req, res, next) => {
    console.error("API Error: ", err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected robust backend error occurred."
    });
});

export default router;