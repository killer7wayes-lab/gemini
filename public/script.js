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

        // CHECK: Is the response actually JSON?
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // If it's not JSON, it's likely that "A server error..." HTML page
            const text = await response.text();
            console.error("Server returned non-JSON:", text);
            throw new Error("Server Error (Vercel crashed). Check logs.");
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
