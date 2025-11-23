module.exports = async (req, res) => {
    // 1. CORS & Setup
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "Server Error: API Key missing." });
    }

    try {
        const { question, spread, cards, deckTheme } = req.body;

        // --- 2. DEFINE SPREAD POSITIONS ---
        // This tells the AI what each card slot actually means
        const spreadMeanings = {
            "1 Card Pull": ["The Insight"],
            "3 Card Spread": ["The Past", "The Present", "The Future"],
            "Mind Body Spirit": ["Mind (Mental State)", "Body (Physical Reality)", "Spirit (Inner Self)"],
            "Career & Wealth": ["Current Situation", "Challenges", "Outcome"],
            "Love & Connection": ["You", "Them", "The Dynamic"],
            "Horseshoe Spread": ["1. The Past", "2. The Present", "3. Hidden Influences", "4. Obstacles", "5. External Influences", "6. Action to Take", "7. The Outcome"],
            "9 Card Destiny Grid": ["Past Mind", "Past Body", "Past Spirit", "Present Mind", "Present Body", "Present Spirit", "Future Mind", "Future Body", "Future Spirit"],
            "Celtic Cross": ["1. The Heart of the Matter", "2. The Challenge (Crosses You)", "3. The Root (Unconscious)", "4. The Past", "5. The Crown (Conscious Goal)", "6. The Future", "7. Self Perception", "8. Environment", "9. Hopes & Fears", "10. The Outcome"]
        };

        // Get meanings for the selected spread (or default to numbered list)
        const positions = spreadMeanings[spread] || [];

        // Format the list of cards for the AI
        // Example: "1. The Past: The Fool (Reversed)"
        const formattedCards = cards.map((c, i) => {
            const positionName = positions[i] || `Card ${i + 1}`;
            const status = c.isReversed ? "REVERSED (Blocked Energy/Internal)" : "UPRIGHT";
            return `- **${positionName}**: ${c.name} *${status}*`;
        }).join('\n');


        // --- 3. DEFINE PERSONAS (THE VIBE) ---
        let systemPersona = "";

        if (deckTheme === "Anime") {
            systemPersona = `You are a spirited "Fate Weaver" from an anime world. 
            Your tone is energetic, empowering, and slightly dramatic (like a Shonen mentor or Magical Girl guide).
            Use metaphors about "training arcs," "unlocking potential," "bonds," and "destiny."
            If a card is negative, frame it as a "challenge to overcome" to level up.`;
        } 
        else if (deckTheme === "Goth") {
            systemPersona = `You are the "Oracle of the Void." 
            Your tone is dark, poetic, mysterious, and brutally honest. 
            Focus on "shadow work," the subconscious, and the uncomfortable truths. 
            Use words like "abyss," "echoes," "silence," and "midnight." Do not sugarcoat, but be deep.`;
        } 
        else { // Classic
            systemPersona = `You are a wise, ancient Tarot Reader. 
            Your tone is soothing, mystical, empathetic, and grounded. 
            You speak with the wisdom of the ages. Focus on clarity, balance, and spiritual growth.`;
        }


        // --- 4. THE FINAL PROMPT ---
        const finalPrompt = `
        ${systemPersona}

        **CONTEXT:**
        User Question: "${question || "General Guidance"}"
        Spread Type: "${spread}"
        
        **THE CARDS DRAWN:**
        ${formattedCards}

        **INSTRUCTIONS:**
        1. Provide a cohesive reading connecting these cards. Do not just list them one by one—weave a story.
        2. **Crucial:** Pay attention to the "Position" of the card (e.g., if The Tower is in "Past", the disaster already happened).
        3. **Crucial:** If a card is REVERSED, interpret it as internal struggle, delayed energy, or a warning.
        4. Format the output using HTML tags for beauty:
           - Use <h3> for section titles (e.g., <h3>The Vibe</h3>).
           - Use <strong> for card names.
           - Use <p> for paragraphs.
           - Keep the total reading under 250 words. Concise but powerful.
        
        Structure your response like this:
        <h3>The Energy</h3>
        <p>...summary of the situation...</p>
        <h3>The Cards</h3>
        <p>...interpretation of the specific cards in their positions...</p>
        <h3>The Guidance</h3>
        <p>...final advice based on the persona...</p>
        `;

        // --- 5. CALL GROQ API ---
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // The smart model
                messages: [
                    { role: "system", content: finalPrompt },
                    { role: "user", content: "Read my fate." }
                ],
                temperature: 0.7, // A bit creative, but not chaotic
                max_tokens: 600
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();
        const reading = data.choices[0]?.message?.content || "The spirits are silent.";

        return res.status(200).json({ reading });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "The connection to the ether was severed." });
    }
};
