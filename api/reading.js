const Groq = require('groq-sdk');

module.exports = async (req, res) => {
    // 1. Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Debugging: Check if API Key exists (Does not crash the app, just logs it)
    if (!process.env.GROQ_API_KEY) {
        console.error("CRITICAL ERROR: GROQ_API_KEY is missing in Vercel Environment Variables.");
        return res.status(500).json({ error: "Server Configuration Error: API Key Missing" });
    }

    try {
        // 3. Initialize Groq HERE (Inside the function, so it doesn't crash on startup)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const { question, spread, cards, deckTheme } = req.body;

        // Create the prompt
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a mystical Tarot Reader. Theme: ${deckTheme || 'Classic'}.
                    Spread: ${spread}. Cards: ${cards ? cards.join(', ') : 'None'}.
                    Question: "${question}".
                    Provide a mystical, empathetic reading in HTML format (use <p>, <strong>, <br>). 
                    Keep it under 150 words.`
                },
                { role: "user", content: "Read my fortune." }
            ],
            model: "llama3-8b-8192"
        });

        const reading = completion.choices[0]?.message?.content || "The spirits are silent.";
        
        // Send JSON success
        return res.status(200).json({ reading });

    } catch (error) {
        console.error("Groq API Error:", error);
        // Send JSON error
        return res.status(500).json({ error: "The Oracle is currently unreachable. Please try again." });
    }
};
