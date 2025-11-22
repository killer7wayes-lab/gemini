// Data for the cards
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

let currentStep = 1;
let state = {
    deckTheme: 'Classic',
    spreadName: '',
    cardsNeeded: 0,
    cardsDrawn: [],
    question: ''
};

// Navigation Logic
function goToStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    // Show target step
    document.getElementById(`step-${stepNum}`).classList.add('active');
    
    currentStep = stepNum;
    
    // Handle Back Button Visibility
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        if (currentStep === 1) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }
    }
}

function goBack() {
    if (currentStep > 1) {
        if (currentStep === 4) {
            // Reset cards if going back from pulling stage
            state.cardsDrawn = [];
            document.getElementById('drawn-cards-container').innerHTML = '';
            document.getElementById('deck-pile').classList.remove('hidden');
            document.getElementById('read-btn').classList.add('hidden');
        }
        goToStep(currentStep - 1);
    }
}

// Step 1: Theme Selection (This is what was broken)
function selectDeck(theme) {
    state.deckTheme = theme;
    
    // Update CSS classes for theme colors
    document.body.className = theme.toLowerCase() + '-theme';
    
    // Update Header Text
    const themeIndicator = document.getElementById('current-theme');
    if(themeIndicator) themeIndicator.innerText = theme;
    
    const deckIndicator = document.getElementById('deck-indicator');
    if(deckIndicator) deckIndicator.classList.remove('hidden');
    
    // Move to next step
    goToStep(2);
}

// Step 2: Spread Selection
function selectSpread(name, count) {
    state.spreadName = name;
    state.cardsNeeded = count;
    
    const cardsLeft = document.getElementById('cards-left');
    if(cardsLeft) cardsLeft.innerText = count;
    
    goToStep(3);
    startBreathingExercise();
}

// Step 3: Breathing
function startBreathingExercise() {
    const text = document.getElementById('breath-text');
    if(!text) return;
    
    text.innerText = "Inhale...";
    
    // Simple text toggle
    const interval = setInterval(() => {
        if (currentStep !== 3) {
            clearInterval(interval);
            return;
        }
        text.innerText = text.innerText === "Inhale..." ? "Exhale..." : "Inhale...";
    }, 4000); 
}

function startPulling() {
    const q = document.getElementById('user-question').value;
    if (!q.trim()) {
        alert("Please type a question to focus your energy.");
        return;
    }
    state.question = q;
    goToStep(4);
}

// Step 4: Pulling Cards
function drawCard() {
    if (state.cardsDrawn.length >= state.cardsNeeded) return;

    const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
    state.cardsDrawn.push(randomCard);

    // UI Update
    const container = document.getElementById('drawn-cards-container');
    const div = document.createElement('div');
    div.className = 'mini-card';
    div.innerText = randomCard;
    container.appendChild(div);

    const remaining = state.cardsNeeded - state.cardsDrawn.length;
    const cardsLeft = document.getElementById('cards-left');
    if(cardsLeft) cardsLeft.innerText = remaining;

    if (remaining === 0) {
        document.getElementById('deck-pile').classList.add('hidden');
        document.getElementById('read-btn').classList.remove('hidden');
        const instruction = document.getElementById('pull-instruction');
        if(instruction) instruction.innerText = "The reading is ready.";
    }
}

// Step 5: API Call (The FIXED version)
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

        // Safety check: Did the server return HTML instead of JSON?
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server connection failed. Please check Vercel logs.");
        }

        const data = await response.json();
        loading.classList.add('hidden');
        
        if (!response.ok) {
            throw new Error(data.error || "Unknown error");
        }

        result.innerHTML = data.reading; 

    } catch (e) {
        loading.classList.add('hidden');
        errorBox.classList.remove('hidden');
        errorBox.innerText = `Error: ${e.message}`;
    }
}
