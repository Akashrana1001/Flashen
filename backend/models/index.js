import mongoose from 'mongoose';

// User Schema
export const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, default: '' },
    hasAcceptedTerms: { type: Boolean, default: false },
    streaks: { type: Number, default: 0 },
    totalCardsMastered: { type: Number, default: 0 }
}, { timestamps: true });

// Deck Schema
export const deckSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourcePdf: { type: String } // e.g. path or filename
}, { timestamps: true });

// Card Schema
export const cardSchema = new mongoose.Schema({
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    category: { type: String, enum: ['Definition', 'Concept', 'Worked Example', 'General'], default: 'Concept' },

    // SM-2 fields
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    nextReview: { type: Date, default: Date.now, index: true },

    // Review telemetry for accurate analytics timelines
    reviewCount: { type: Number, default: 0 },
    reviewLog: { type: [Date], default: [] }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Deck = mongoose.model('Deck', deckSchema);
export const Card = mongoose.model('Card', cardSchema);