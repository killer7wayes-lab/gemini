// 1. The Full 78 Card Deck
const fullDeckData = [
    // Major Arcana
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
    // Wands
    "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands", "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands", "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
    // Cups
    "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups", "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups", "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
    // Swords
    "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords", "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords", "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
    // Pentacles
    "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles", "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

let currentStep = 1;
let shuffledDeck = []; // We will shuffle the deck here
let state = {
    deckTheme: 'Classic',
    spreadName: '',
    cardsNeeded: 0,
    cardsDrawn: [], // Stores objects: { name: "The Fool", isReversed: false }
    question: ''
};

// Navigation
function goToStep(stepNum) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNum}`).classList.add('active');
    currentStep = stepNum;
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.classList.toggle('hidden', currentStep === 1);
}

function goBack() {
    if (currentStep > 1) {
        if (currentStep === 4) resetPullingStage();
        goToStep(currentStep - 1);
    }
}

function resetPullingStage() {
    state.cardsDrawn = [];
    document.getElementById('drawn-cards-container').innerHTML = '';
    document.getElementById('deck-pile').classList.remove('hidden');
    document.getElementById('read-btn').classList.add('hidden');
    document.getElementById('pull-instruction').innerText = "Tap the deck";
    document.getElementById('cards-left').innerText = state.cardsNeeded;
}

// Step 1: Theme
function selectDeck(theme) {
    state.deckTheme = theme;
    document.body.className = theme.toLowerCase() + '-theme';
    document.getElementById('current-theme').innerText = theme;
    document.getElementById('deck-indicator').classList.remove('hidden');
    goToStep(2);
}

// Step 2: Spread
function selectSpread(name, count) {
    state.spreadName = name;
    state.cardsNeeded = count;
    document.getElementById('cards-left').innerText = count;
    goToStep(3);
    startBreathingExercise();
}

// Step 3: Breathing
function startBreathingExercise() {
    const text = document.getElementById('breath-text');
    if (!text) return;
    text.innerText = "Inhale...";
    
    // Shuffle the deck while user breathes (Fisher-Yates Algorithm)
    shuffledDeck = [...fullDeckData];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }

    const interval = setInterval(() => {
        if (currentStep !== 3) { clearInterval(interval); return; }
        text.innerText = text.innerText === "Inhale..." ? "Exhale..." : "Inhale...";
    }, 4000);
}

function startPulling() {
    const q = document.getElementById('user-question').value;
    if (!q.trim()) { alert("Please focus your mind and type a question."); return; }
    state.question = q;
    goToStep(4);
}

// Step 4: Pulling (With Reversals)
function drawCard() {
    if (state.cardsDrawn.length >= state.cardsNeeded) return;

    // Take the top card from our shuffled deck
    const cardName = shuffledDeck.pop(); 
    
    // 40% chance of being reversed
    const isReversed = Math.random() < 0.4;

    state.cardsDrawn.push({ name: cardName, isReversed: isReversed });

    // UI Creation
    const container = document.getElementById('drawn-cards-container');
    const cardDiv = document.createElement('div');
    cardDiv.className = 'tarot-card-display';
    
    // Add visual reversal
    if (isReversed) {
        cardDiv.classList.add('reversed');
        cardDiv.title = "Reversed";
    }

    cardDiv.innerHTML = `
        <div class="card-content">
            <div class="top-symbol">✨</div>
            <div class="card-name">${cardName}</div>
            <div class="bottom-symbol">✨</div>
        </div>
    `;
    
    container.appendChild(cardDiv);

    const remaining = state.cardsNeeded - state.cardsDrawn.length;
    document.getElementById('cards-left').innerText = remaining;

    if (remaining === 0) {
        document.getElementById('deck-pile').classList.add('hidden');
        document.getElementById('read-btn').classList.remove('hidden');
        document.getElementById('pull-instruction').innerText = "The path is laid out.";
    }
}

// Step 5: API
async function getAIReading() {
    goToStep(5);
    const loading = document.getElementById('loading');
    const result = document.getElementById('ai-response');
    const errorBox = document.getElementById('error-box');
    
    loading.classList.remove('hidden');
    result.innerHTML = "";
    errorBox.classList.add('hidden');

    try {
        const response = await fetch('/api/reading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: state.question,
                spread: state.spreadName,
                cards: state.cardsDrawn, // Sending objects now
                deckTheme: state.deckTheme
            })
        });

        if (!response.ok) throw new Error("Connection error.");
        
        const data = await response.json();
        loading.classList.add('hidden');
        result.innerHTML = data.reading; 

    } catch (e) {
        loading.classList.add('hidden');
        errorBox.classList.remove('hidden');
        errorBox.innerText = "The Oracle is meditating. Please try again in a moment.";
    }
}

// Copy Feature
function copyReading() {
    const text = document.getElementById('ai-response').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Reading copied to clipboard!");
    });
}
