let pyodide = null;

// Initialize pyodide when the page loads
window.addEventListener('load', async () => {
    try {
        console.log('Initializing Python environment...');
        pyodide = await loadPyodide({
            packages: ['sympy'],
            stdout: (msg) => console.log(`Pyodide: ${msg}`),
        });
        console.log('Ready!');
    } catch (error) {
        console.error(`Failed to initialize: ${error.message}`);
    }
});

// Add this new function before evaluateCalculator()
function handleKeyPress(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey)) {
        event.preventDefault();  // Prevent default newline
        evaluateCalculator();
    }
    if(event.key === 's' && event.ctrlKey){
        event.preventDefault();  // Prevent browser save dialog
        saveInput();
    }
}

function pushResult(resultText, copyText = null) {
    const resultDiv = document.createElement('div');
    
    // First render with KaTeX to get the HTML structure
    katex.render(resultText, resultDiv, {
        displayMode: true,
        throwOnError: false,
        fleqn: true,
    });
    
    if (copyText) {
        const katexSpan = resultDiv.querySelector('.katex-html');
        katexSpan.classList.add('output-copyable');

        katexSpan.setAttribute('data-math-output', copyText);

        katexSpan.addEventListener('click', async function(e) {
            e.stopPropagation(); // Prevent event bubbling
            
            try {
                await navigator.clipboard.writeText(copyText);

                // Visual feedback
                const originalBg = katexSpan.style.backgroundColor;
                katexSpan.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
                setTimeout(() => {
                    katexSpan.style.backgroundColor = originalBg;
                }, 200);
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        });
    }
    output.appendChild(resultDiv);
}

// Function to evaluate input
async function evaluateCalculator() {
    const input = document.getElementById('calculator-input').value;
    const output = document.getElementById('output');

    output.innerHTML = '';
    try {
        if (!pyodide) {
            throw new Error('Python environment not initialized');
        }
        results = await pyodide.runPythonAsync(input);
        pushResult(results.results);
    } catch (error) {
        output.innerHTML = `Error: ${error.message}`;
    }
}