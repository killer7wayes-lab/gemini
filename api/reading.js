module.exports = async (req, res) => {
    // 1. CORS Setup
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
        return res.status(500).json({ error: "Configuration Error: GROQ_API_KEY is missing." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, spread, cards, deckTheme } = req.body;

        // Safe checks
        const safeTheme = deckTheme || "Mystic";
        const safeCards = (cards && cards.length > 0) ? cards.join(', ') : "The Fool";
        const safeQuestion = question || "General guidance";

        // 3. Direct Fetch to Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // UPDATED MODEL ID (The fix)
                model: "llama-3.3-70b-versatile", 
                messages: [
                    {
                        role: "system",
                        content: `You are a mystical Tarot Reader. Theme: ${safeTheme}. 
                        Spread: ${spread}. Cards: ${safeCards}. Question: "${safeQuestion}".
                        Provide a deep, empathetic reading. Use HTML tags like <p>, <strong>, <em>. 
                        Keep it under 200 words.`
                    },
                    { 
                        role: "user", 
                        content: "Read my cards." 
                    }
                ]
            })
        });

        // 4. Handle Errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                // Show the specific error from Groq so we know if the model changes again
                return res.status(500).json({ error: `Groq Error: ${errorJson.error.message}` });
            } catch (e) {
                return res.status(500).json({ error: `Groq Failed: ${errorText}` });
            }
        }

        const data = await response.json();
        const reading = data.choices[0]?.message?.content || "The spirits are silent.";

        return res.status(200).json({ reading });

    } catch (error) {
        console.error("Server Crash:", error);
        return res.status(500).json({ error: `Server Crash: ${error.message}` });
    }
};
