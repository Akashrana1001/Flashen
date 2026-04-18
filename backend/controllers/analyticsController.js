import { Card } from '../models/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const DAY_KEY_FORMATTER_CACHE = new Map();

const normalizeTimeZone = (value) => {
    if (!value || typeof value !== 'string') return 'UTC';

    try {
        Intl.DateTimeFormat('en-US', { timeZone: value });
        return value;
    } catch {
        return 'UTC';
    }
};

const getDayKeyFormatter = (timeZone) => {
    const cacheKey = String(timeZone);
    if (!DAY_KEY_FORMATTER_CACHE.has(cacheKey)) {
        DAY_KEY_FORMATTER_CACHE.set(
            cacheKey,
            new Intl.DateTimeFormat('en-US', {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            })
        );
    }

    return DAY_KEY_FORMATTER_CACHE.get(cacheKey);
};

const toDayKey = (value, timeZone) => {
    const formatter = getDayKeyFormatter(timeZone);
    const parts = formatter.formatToParts(new Date(value));

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
};

const buildRecentDayKeys = (count, timeZone) => {
    const now = new Date();
    return Array.from({ length: count }).map((_, index) => {
        const day = new Date(now.getTime() - ((count - 1 - index) * DAY_MS));
        return toDayKey(day, timeZone);
    });
};

const buildFutureDayKeys = (count, timeZone) => {
    const now = new Date();
    return Array.from({ length: count }).map((_, index) => {
        const day = new Date(now.getTime() + (index * DAY_MS));
        return toDayKey(day, timeZone);
    });
};

const toHeatLevel = (count) => {
    if (count <= 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
};

export const getMasteryAnalytics = async (req, res, next) => {
    try {
        const ownerId = req.user._id;

        const requestedTimeZone = req.query?.timezone || req.query?.tz;
        const timeZone = normalizeTimeZone(requestedTimeZone);

        const heatmapDayKeys = buildRecentDayKeys(90, timeZone);
        const forecastDayKeys = buildFutureDayKeys(7, timeZone);
        const todayKey = heatmapDayKeys[heatmapDayKeys.length - 1];

        // Keep a slight overlap on both sides to avoid timezone edge misses near midnight.
        const now = new Date();
        const heatmapStart = new Date(now.getTime() - (95 * DAY_MS));
        const heatmapEnd = new Date(now.getTime() + DAY_MS);
        const forecastStart = new Date(now.getTime() - DAY_MS);
        const forecastEnd = new Date(now.getTime() + (8 * DAY_MS));

        const [reviewLogHeatmapAgg, legacyHeatmapAgg, forecastAgg, strengthAgg] = await Promise.all([
            Card.aggregate([
                { $match: { ownerId } },
                {
                    $project: {
                        reviewEvents: {
                            $filter: {
                                input: { $ifNull: ['$reviewLog', []] },
                                as: 'reviewAt',
                                cond: {
                                    $and: [
                                        { $gte: ['$$reviewAt', heatmapStart] },
                                        { $lte: ['$$reviewAt', heatmapEnd] },
                                    ],
                                },
                            },
                        },
                    },
                },
                { $unwind: '$reviewEvents' },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$reviewEvents',
                                timezone: timeZone,
                            },
                        },
                        cardsReviewed: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Card.aggregate([
                {
                    $match: {
                        ownerId,
                        repetitions: { $gt: 0 },
                        updatedAt: { $gte: heatmapStart, $lte: heatmapEnd },
                    },
                },
                {
                    $addFields: {
                        reviewLogSize: {
                            $size: { $ifNull: ['$reviewLog', []] },
                        },
                    },
                },
                {
                    $match: {
                        reviewLogSize: 0,
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$updatedAt',
                                timezone: timeZone,
                            },
                        },
                        cardsReviewed: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Card.aggregate([
                {
                    $match: {
                        ownerId,
                        nextReview: { $gte: forecastStart, $lte: forecastEnd },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$nextReview',
                                timezone: timeZone,
                            },
                        },
                        cardsDue: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Card.aggregate([
                { $match: { ownerId } },
                {
                    $project: {
                        masteryScore: {
                            $min: [
                                100,
                                {
                                    $add: [
                                        {
                                            $multiply: [
                                                {
                                                    $divide: [
                                                        { $ifNull: ['$easeFactor', 2.5] },
                                                        2.5,
                                                    ],
                                                },
                                                45,
                                            ],
                                        },
                                        {
                                            $multiply: [
                                                {
                                                    $min: [
                                                        { $ifNull: ['$repetitions', 0] },
                                                        12,
                                                    ],
                                                },
                                                3,
                                            ],
                                        },
                                        {
                                            $multiply: [
                                                {
                                                    $min: [
                                                        { $ifNull: ['$interval', 0] },
                                                        30,
                                                    ],
                                                },
                                                1.3,
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalConcepts: { $sum: 1 },
                        knowledgeStrength: { $avg: '$masteryScore' },
                    },
                },
            ]),
        ]);

        const totalConcepts = strengthAgg[0]?.totalConcepts || 0;

        if (totalConcepts === 0) {
            return res.status(200).json({
                success: true,
                totalConcepts: 0,
                knowledgeStrength: 0,
                heatmapData: [],
                forecastData: [],
                meta: {
                    reviewedToday: 0,
                    dueToday: 0,
                    consistencyScore: 0,
                    streakDays: 0,
                    peakReviewDay: null,
                },
            });
        }

        const heatmapMap = new Map();
        [...reviewLogHeatmapAgg, ...legacyHeatmapAgg].forEach((row) => {
            const existing = heatmapMap.get(row._id) || 0;
            heatmapMap.set(row._id, existing + Number(row.cardsReviewed || 0));
        });

        const forecastMap = new Map(forecastAgg.map((row) => [row._id, row.cardsDue]));

        const heatmapData = heatmapDayKeys.map((key, index) => {
            const cards = heatmapMap.get(key) || 0;

            return {
                id: index,
                date: key,
                dateKey: key,
                cards,
                level: toHeatLevel(cards),
                isToday: key === todayKey,
            };
        });

        const forecastData = forecastDayKeys.map((key) => {
            return {
                date: key,
                dateKey: key,
                cards: forecastMap.get(key) || 0,
            };
        });

        const reviewedToday = heatmapMap.get(todayKey) || 0;
        const dueToday = forecastMap.get(todayKey) || 0;
        const activeReviewDays = heatmapData.filter((cell) => cell.cards > 0).length;
        const consistencyScore = Number(((activeReviewDays / 90) * 100).toFixed(1));

        let streakDays = 0;
        for (let i = heatmapDayKeys.length - 1; i >= 0; i -= 1) {
            const key = heatmapDayKeys[i];
            if ((heatmapMap.get(key) || 0) > 0) {
                streakDays += 1;
            } else {
                break;
            }
        }

        const peakCell = heatmapData.reduce(
            (peak, cell) => (cell.cards > peak.cards ? cell : peak),
            { cards: 0, date: null }
        );

        return res.status(200).json({
            success: true,
            totalConcepts,
            knowledgeStrength: Number((strengthAgg[0]?.knowledgeStrength || 0).toFixed(1)),
            heatmapData,
            forecastData,
            meta: {
                reviewedToday,
                dueToday,
                consistencyScore,
                streakDays,
                timeZone,
                peakReviewDay: peakCell.cards > 0
                    ? {
                        date: peakCell.date,
                        cards: peakCell.cards,
                    }
                    : null,
            },
        });
    } catch (error) {
        next(error);
    }
};
