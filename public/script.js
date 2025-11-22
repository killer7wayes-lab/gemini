// Simple tarot deck array (simplified for code length)
const tarotDeck = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", 
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", 
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", 
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", 
    "Judgement", "The World",
    "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands", "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands", "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
    "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups", "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups", "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
    "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords", "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords", "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
    "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles", "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

let state = {
    deckTheme: '',
    spreadName: '',
    cardsNeeded: 0,
    cardsDrawn: [],
    question: ''
};

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

function selectDeck(theme) {
    state.deckTheme = theme;
    document.body.className = theme.toLowerCase() + '-theme';
    document.getElementById('current-theme').innerText = theme;
    document.getElementById('deck-indicator').classList.remove('hidden');
    showStep('step-2');
}

function selectSpread(name, count) {
    state.spreadName = name;
    state.cardsNeeded = count;
    document.getElementById('cards-left').innerText = count;
    showStep('step-3');
}

function startPulling() {
    const question = document.getElementById('user-question').value;
    if (!question.trim()) {
        alert("Please focus your mind and type a question.");
        return;
    }
    state.question = question;
    showStep('step-4');
}

function drawCard() {
    if (state.cardsDrawn.length >= state.cardsNeeded) return;

    // Random Selection
    const randomIndex = Math.floor(Math.random() * tarotDeck.length);
    const cardName = tarotDeck[randomIndex];
    
    // Add to state
    state.cardsDrawn.push(cardName);
    
    // Update UI
    const container = document.getElementById('drawn-cards-container');
    const cardDiv = document.createElement('div');
    cardDiv.className = 'tarot-card';
    cardDiv.innerText = cardName; // In a real app, use <img src="..."> based on card name
    container.appendChild(cardDiv);

    const remaining = state.cardsNeeded - state.cardsDrawn.length;
    document.getElementById('cards-left').innerText = remaining;

    if (remaining === 0) {
        document.getElementById('deck-pile').classList.add('hidden');
        document.getElementById('read-btn').classList.remove('hidden');
        document.getElementById('pull-instruction').innerText = "The cards are laid.";
    }
}

async function getAIReading() {
    showStep('step-5');
    const loading = document.getElementById('loading');
    const result = document.getElementById('ai-response');
    
    loading.classList.remove('hidden');
    result.innerHTML = "";

    try {
        const response = await fetch('/api/reading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: state.question,
                spread: state.spreadName,
                cards: state.cardsDrawn,
                deckTheme: state.deckTheme
            })
        });

        const data = await response.json();
        loading.classList.add('hidden');
        
        if (data.reading) {
            result.innerHTML = data.reading; // AI returns HTML formatted text
        } else {
            result.innerText = "The connection was interrupted.";
        }
    } catch (e) {
        loading.classList.add('hidden');
        result.innerText = "Error connecting to the Oracle (Server Error).";
    }
}