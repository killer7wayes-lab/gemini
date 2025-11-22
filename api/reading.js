module.exports = async (req, res) => {
    // 1. Standard Setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "Configuration Error: GROQ_API_KEY is missing." });
    }

    try {
        const { question, spread, cards, deckTheme } = req.body;

        // Format cards for the AI (e.g., "The Fool (Reversed)")
        const formattedCards = cards.map(c => `${c.name} ${c.isReversed ? '(Reversed)' : '(Upright)'}`).join(', ');

        // 2. The "Pro" Prompt
        const systemPrompt = `
        You are an intuitive, mystical Tarot Reader. 
        Theme: ${deckTheme}.
        User's Question: "${question || "General guidance"}".
        Spread Type: ${spread}.
        
        Cards Drawn: ${formattedCards}.

        INSTRUCTIONS:
        1. If a card is "(Reversed)", interpret its blocked energy or internal struggle.
        2. Connect the cards together into a story, don't just list them.
        3. Theme Adjustments:
           - If 'Anime': Use metaphors about heroes, training arcs, and destiny. Be energetic.
           - If 'Goth': Be poetic, darker, focus on shadows and deep emotions.
           - If 'Classic': Be wise, traditional, and calm.
        4. Format: Use <h3> for headings, <p> for paragraphs, and <b> for key terms.
        5. Structure: 
           - Start with the "Vibe" (Overall energy).
           - Interpret the cards.
           - End with "Actionable Advice".
        `;

        // 3. Call Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Reveal the truth." }
                ]
            })
        });

        if (!response.ok) {
            throw new Error((await response.text()));
        }

        const data = await response.json();
        return res.status(200).json({ reading: data.choices[0].message.content });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "The spirits are overwhelmed. Please try again." });
    }
};
