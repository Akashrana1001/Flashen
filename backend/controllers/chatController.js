import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const chatModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are Flashcard Engine Assistant.
- Answer clearly and briefly.
- Prefer study guidance, memory techniques, and app usage help.
- If unsure, say what you are uncertain about.
- Never claim to perform actions you did not perform.`;

export const askChatbot = async (req, res, next) => {
    try {
        const rawMessage = req.body?.message;
        const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];

        const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        if (message.length > 1200) {
            return res.status(400).json({ success: false, message: 'Message is too long.' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ success: false, message: 'Assistant is temporarily unavailable.' });
        }

        const history = rawHistory
            .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
            .map((item) => ({
                role: item.role,
                content: item.content.trim().slice(0, 1200),
            }))
            .filter((item) => item.content.length > 0)
            .slice(-10);

        const completion = await groq.chat.completions.create({
            model: chatModel,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history,
                { role: 'user', content: message },
            ],
            temperature: 0.35,
            max_tokens: 500,
        });

        const reply = completion?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
            return res.status(502).json({ success: false, message: 'Assistant returned an empty response.' });
        }

        return res.status(200).json({ success: true, reply });
    } catch (error) {
        next(error);
    }
};
