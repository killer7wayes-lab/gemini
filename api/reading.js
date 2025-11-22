// This runs on the Vercel server, keeping your key safe.
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { question, spread, cards, deckTheme } = req.body;

    // Construct the prompt for the AI
    const systemPrompt = `You are a mystical, intuitive Tarot Reader. 
    The user is using a "${deckTheme}" themed deck.
    They asked: "${question}".
    Spread Type: ${spread}.
    
    The cards drawn are: ${cards.join(', ')}.
    
    Provide a reading based on these cards. Be empathetic, mystical, and concise. 
    Format the response with HTML tags (like <p>, <strong>) for readability.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: "Read my cards." }
            ],
            model: 'llama3-8b-8192', // Fast and free model on Groq
        });

        const reading = chatCompletion.choices[0]?.message?.content || "The spirits are silent.";
        res.status(200).json({ reading });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error consulting the spirits.' });
    }
}