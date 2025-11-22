const Groq = require('groq-sdk');

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    // 1. Handle CORS (allows your frontend to talk to backend)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Check for API Key
    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "Server Error: GROQ_API_KEY is missing in Vercel Settings." });
    }

    // 3. Logic
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, spread, cards, deckTheme } = req.body;

        const systemPrompt = `You are a mystical Tarot Reader. Theme: ${deckTheme}.
        User Question: "${question}". Spread: ${spread}. Cards: ${cards.join(', ')}.
        Give a reading. Use HTML tags like <h3>, <p>, <b>. Keep it under 200 words.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Interpret my cards." }
            ],
            model: 'llama3-8b-8192',
        });

        const reading = chatCompletion.choices[0]?.message?.content || "The mists obscure the future.";
        res.status(200).json({ reading });

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: error.message || 'Error consulting the spirits.' });
    }
};
