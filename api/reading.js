module.exports = async (req, res) => {
    // 1. CORS Setup (Allows your website to talk to the server)
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

    // 2. Check API Key
    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "Configuration Error: GROQ_API_KEY is missing in Vercel Settings." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, spread, cards, deckTheme } = req.body;

        // 3. Direct Fetch to Groq (No Library Needed)
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
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
            })
        });

        // Check if Groq itself had an error
        if (!response.ok) {
            const errorData = await response.text();
            console.error("Groq API Error:", errorData);
            return res.status(500).json({ error: `Groq API Failed: ${response.statusText}` });
        }

        const data = await response.json();
        const reading = data.choices[0]?.message?.content || "The spirits are silent.";

        return res.status(200).json({ reading });

    } catch (error) {
        console.error("Server Crash:", error);
        return res.status(500).json({ error: `Server Crash: ${error.message}` });
    }
};
