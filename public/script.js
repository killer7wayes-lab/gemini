// 1. The Full 78 Card Deck
const fullDeckData = [
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

let currentStep = 1;
let shuffledDeck = [];
let state = {
    deckTheme: 'Classic',
    spreadName: '',
    cardsNeeded: 0,
    cardsDrawn: [],
    question: ''
};

// Navigation
function goToStep(stepNum) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNum}`).classList.add('active');
    currentStep = stepNum;
    
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.classList.toggle('hidden', currentStep === 1);

    const deckIndicator = document.getElementById('deck-indicator');
    if (deckIndicator && currentStep === 1) deckIndicator.classList.add('hidden');
}

function goBack() {
    if (currentStep > 1) {
        if (currentStep === 4) resetPullingStage(); // Auto-reset if they leave step 4
        goToStep(currentStep - 1);
    }
}

// --- NEW SHUFFLE / RESET FUNCTION ---
function resetPullingStage() {
    state.cardsDrawn = [];
    
    // Reset UI
    const container = document.getElementById('drawn-cards-container');
    container.innerHTML = '';
    
    // Show Deck again
    document.getElementById('deck-pile').style.display = 'block';
    
    // Hide Reveal Button
    document.getElementById('read-btn').classList.add('hidden');
    
    // Reset Counter
    document.getElementById('cards-left').innerText = state.cardsNeeded;
    
    // Reshuffle the internal array immediately
    startBreathingExercise(); 
}

// Step 1: Theme
function selectDeck(theme) {
    state.deckTheme = theme;
    document.body.className = theme.toLowerCase() + '-theme';
    const tText = document.getElementById('current-theme');
    if(tText) tText.innerText = theme;
    const ind = document.getElementById('deck-indicator');
    if(ind) ind.classList.remove('hidden');
    goToStep(2);
}

// --- STEP 2: SPREAD (FIXED LAYOUTS) ---
function selectSpread(name, count) {
    state.spreadName = name;
    state.cardsNeeded = count;
    
    document.getElementById('cards-left').innerText = count;
    
    // Set Layout Class for Grid
    const grid = document.getElementById('drawn-cards-container');
    grid.className = 'drawn-grid'; // Reset class
    
    if (count === 1) grid.classList.add('layout-1');
    else if (count === 3) grid.classList.add('layout-3');
    else if (count === 7) grid.classList.add('layout-horseshoe'); // <--- NEW!
    else if (count === 9) grid.classList.add('layout-9');
    else if (name.includes('Cross')) grid.classList.add('layout-cross');
    else grid.classList.add('layout-default'); 

    goToStep(3);
    startBreathingExercise();
}

// Step 3: Breathing & Shuffling
function startBreathingExercise() {
    shuffledDeck = [...fullDeckData];
    // Fisher-Yates
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
}

function startPulling() {
    const qInput = document.getElementById('user-question');
    let qValue = qInput ? qInput.value.trim() : "";
    if (!qValue) qValue = "General Guidance";
    state.question = qValue;
    goToStep(4);
}

// Step 4: Draw Card
   function drawCard() {
    if (state.cardsDrawn.length >= state.cardsNeeded) return;

    const cardName = shuffledDeck.pop(); 
    const isReversed = Math.random() < 0.4;
    state.cardsDrawn.push({ name: cardName, isReversed: isReversed });

    const container = document.getElementById('drawn-cards-container');
    const cardDiv = document.createElement('div');
    cardDiv.className = 'tarot-card-display';
    
function drawCard() {
    if (state.cardsDrawn.length >= state.cardsNeeded) return;

    const cardName = shuffledDeck.pop(); 
    const isReversed = Math.random() < 0.4; // 40% chance
    state.cardsDrawn.push({ name: cardName, isReversed: isReversed });

    const container = document.getElementById('drawn-cards-container');
    const cardDiv = document.createElement('div');
    cardDiv.className = 'tarot-card-display';
    
    // 1. Add Position Class (Critical for Horseshoe/Cross layouts)
    const positionNumber = state.cardsDrawn.length;
    cardDiv.classList.add(`pos-${positionNumber}`);

    // 2. Special check for Celtic Cross Center (Card 2 needs special layering)
    if (state.spreadName.includes('Cross') && positionNumber === 2) {
        cardDiv.classList.add('cross-center-2');
    }

    // 3. THE FIX: Create the Inner Box structure
    // We do NOT rotate the outer 'cardDiv'. We rotate this inner div.
    cardDiv.innerHTML = `
        <div class="card-inner ${isReversed ? 'is-flipped' : ''}">
            <div class="card-name">${cardName}</div>
            ${isReversed ? '<div class="rev-icon" style="font-size:0.8rem; margin-top:5px;">↻</div>' : ''}
        </div>
    `;
    
    container.appendChild(cardDiv);

    // Update Counter
    const remaining = state.cardsNeeded - state.cardsDrawn.length;
    document.getElementById('cards-left').innerText = remaining;

    // Check if finished
    if (remaining === 0) {
        document.getElementById('deck-pile').style.display = 'none';
        const btn = document.getElementById('read-btn');
        btn.classList.remove('hidden');
        btn.style.animation = "fadeIn 1s";
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
                cards: state.cardsDrawn, 
                deckTheme: state.deckTheme
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Connection error");
        }
        
        const data = await response.json();
        loading.classList.add('hidden');
        result.innerHTML = data.reading; 

    } catch (e) {
        loading.classList.add('hidden');
        errorBox.classList.remove('hidden');
        errorBox.innerText = "The connection to the Oracle was interrupted.";
    }
}

function copyReading() {
    const text = document.getElementById('ai-response').innerText;
    navigator.clipboard.writeText(text).then(() => alert("Saved."));
}
