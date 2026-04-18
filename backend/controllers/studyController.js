import { Card } from '../models/index.js';
import { calculateSM2 } from '../services/sm2.js';

/**
 * Handle POST /api/study/grade
 * Updates card with new SM-2 intervals based on performance
 * Example Body: { cardId: "123", q: 4 }
 */
export const submitGrade = async (req, res, next) => {
    try {
        const { cardId, q, grade, result } = req.body;
        const incomingGrade = q ?? grade ?? result;
        const numericQ = Number(incomingGrade);

        if (incomingGrade === undefined || Number.isNaN(numericQ) || numericQ < 0 || numericQ > 5) {
            return res.status(400).json({ success: false, message: "Invalid grade. Must be 0-5." });
        }

        const card = await Card.findOne({ _id: cardId, ownerId: req.user._id });
        if (!card) {
            return res.status(404).json({ success: false, message: "Card not found" });
        }

        // Call mathematical engine
        const { interval, repetitions, easeFactor } = calculateSM2(
            numericQ,
            card.repetitions,
            card.interval,
            card.easeFactor
        );

        // Calculate next review date
        const reviewedAt = new Date();
        const nextReviewDate = new Date(reviewedAt);
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        // Save calculation
        card.interval = interval;
        card.repetitions = repetitions;
        card.easeFactor = easeFactor;
        card.nextReview = nextReviewDate;
        card.reviewCount = Number(card.reviewCount || 0) + 1;
        card.reviewLog = [...(card.reviewLog || []), reviewedAt].slice(-240);

        await card.save();

        res.status(200).json({ success: true, card });
    } catch (error) {
        next(error);
    }
};