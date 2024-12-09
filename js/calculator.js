let pyodideWorker = null;

// Initialize pyodide when the page loads
window.addEventListener('load', async () => {
    try {
        const initMessage = document.getElementById('initMessage');
        initMessage.classList.add('show');
        initMessage.textContent = 'Initializing Python environment...';

        console.log('Initializing Python environment...');
        pyodideWorker = new Worker('./deps/pyodide/webworker.js');
        pyodideWorker.postMessage({ python: "" });
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Initialization timeout'));
            }, 30000);

            pyodideWorker.onmessage = (event) => {
                if (event.data.type === 'status' && event.data.status === 'initialized') {
                    clearTimeout(timeoutId);
                    resolve();
                }else{
                    reject(new Error('Initialization failed'));
                }
            };
        });
        
        pyodideWorker.ready = true;
        console.log('Ready!');
        
        // Fade out the initialization message
        initMessage.textContent = 'Ready!';
        setTimeout(() => {
            initMessage.style.display = 'none';
        }, 1000); // Hide after fade animation completes
    } catch (error) {
        console.error(`Failed to initialize: ${error.message}`);
        const initMessage = document.getElementById('initMessage');
        initMessage.textContent = 'Failed to initialize Python environment';
        initMessage.style.color = '#d32f2f';
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
        if (!pyodideWorker.ready) {
            throw new Error('Python environment not initialized');
        }
        pyodideWorker.onmessage = (event) => {
            switch(event.data.type) {
                case 'result':
                    if(event.data.result){
                        console.log(event.data.result);
                        pyodideWorker.postMessage({ python: `print(${event.data.result})` });
                    }
                    break;
                case 'output':
                    pushResult(event.data.result);
                    break;
                }
            };
        pyodideWorker.postMessage({ python: "clear()" });
        for (let line of input.split('\n')){
            pyodideWorker.postMessage({ python: line });
        }
    } catch (error) {
        output.innerHTML = `Error: ${error.message}`;
    }
}