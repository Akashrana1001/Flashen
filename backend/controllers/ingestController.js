import pdfParse from 'pdf-parse';
import Groq from 'groq-sdk';
import { Deck, Card } from '../models/index.js';

import dotenv from 'dotenv';
dotenv.config();

// Setup Groq API Client
// Ensure GROQ_API_KEY is available in your .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'mock_key' });
const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

/**
 * Handle POST /api/ingest
 * Requires a multipart/form-data payload with a 'file' containing the PDF.
 */
export const ingestPDF = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No PDF file uploaded" });
        }

        // 1. Extract text from PDF
        const pdfData = await pdfParse(req.file.buffer);
        const rawText = pdfData.text;

        // 2. Chunk text (Naive slice for example, ideally an NLP-based chunks generator)
        // Limiting to 6000 chars for Llama 3 prompt sanity in this example
        const chunk = rawText.slice(0, 6000);

        // 3. Send to AI (Groq)
        const prompt = `You are an expert teacher. Extract up to 10 high-fidelity flashcards from this text. 
Output ONLY a JSON array of objects with keys 'front', 'back', and 'category'. Do not include conversational text.
Allowed categories: "Definition", "Concept", "Worked Example".

Text: ${chunk}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: prompt }
            ],
            model: groqModel,
            temperature: 0.1, // Low temp for strictly structured output
            max_tokens: 1500,
        });

        const aiResponse = completion.choices[0].message.content;

        // Parse JSON
        let flashcards = [];
        try {
            // Find where [ starts to avoid Markdown ```json ... ``` blocks
            const jsonStart = aiResponse.indexOf('[');
            const jsonEnd = aiResponse.lastIndexOf(']') + 1;
            const jsonStr = aiResponse.substring(jsonStart, jsonEnd);
            flashcards = JSON.parse(jsonStr);
        } catch (parseError) {
            return res.status(500).json({ success: false, message: "AI response parsing failed.", details: aiResponse });
        }

        // 4. Save resulting JSON to MongoDB
        // Assuming we have a logged-in user in req.user (e.g. from JWT middleware)
        const userId = req.user ? req.user._id : "mockOwnerId123";

        // Create the Deck
        const deck = new Deck({
            title: req.file.originalname.replace('.pdf', ''),
            ownerId: userId,
            sourcePdf: req.file.originalname,
        });
        const savedDeck = await deck.save();

        // Map out Cards
        const cardDocs = flashcards.map(fc => ({
            deckId: savedDeck._id,
            ownerId: userId,
            front: fc.front,
            back: fc.back,
            category: fc.category || 'Concept'
        }));

        await Card.insertMany(cardDocs);

        res.status(201).json({
            success: true,
            message: "PDF ingested and deck created",
            deck: savedDeck,
            cardsCount: cardDocs.length,
            cards: cardDocs
        });

    } catch (error) {
        next(error); // Pass to centralized error handler
    }
};