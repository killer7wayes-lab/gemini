// Data
const tarotDeck = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World", "Ace of Wands", "Three of Swords", "Ten of Cups", "Queen of Pentacles"]; // Added a few for testing, keep your full list

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
    if (currentStep === 1) {
        backBtn.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden');
    }
}

function goBack() {
    if (currentStep > 1) {
        // Reset data if going back from certain steps?
        if (currentStep === 4) {
            // If going back from pulling cards, clear them so they can re-pull
            state.cardsDrawn = [];
            document.getElementById('drawn-cards-container').innerHTML = '';
            document.getElementById('deck-pile').classList.remove('hidden');
            document.getElementById('read-btn').classList.add('hidden');
        }
        goToStep(currentStep - 1);
    }
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
    text.innerText = "Inhale...";
    
    // Simple text toggle to match CSS animation
    const interval = setInterval(() => {
        if (currentStep !== 3) {
            clearInterval(interval);
            return;
        }
        text.innerText = text.innerText === "Inhale..." ? "Exhale..." : "Inhale...";
    }, 4000); // Matches half of the 8s CSS animation
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
    document.getElementById('cards-left').innerText = remaining;

    if (remaining === 0) {
        document.getElementById('deck-pile').classList.add('hidden');
        document.getElementById('read-btn').classList.remove('hidden');
        document.getElementById('pull-instruction').innerText = "The reading is ready.";
    }
}

// Step 5: API Call
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
