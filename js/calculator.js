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
function evaluateCalculator() {
    const input = document.getElementById('calculator-input').value;
    const output = document.getElementById('output');
    const lines = input.split('\n');
    let results = [];

    const eqnAssign = /^[^=]*=[^=]*==[^=]*$/;
    const standAloneEqn = /^[^\=]*==[^=]*$/;
    output.innerHTML = '';

    // Reset parser (but keep constants) and equations
    parser.clear();
    Object.entries(engineeringConstants).forEach(([name, value]) => {
        parser.set(name, value);
    });
    Object.keys(equations).forEach(key => delete equations[key]);
    
    try {
        for (let line of lines) {
            line = line.trim();
            if(!line){
                const commentDiv = document.createElement('br');
                output.appendChild(commentDiv);
                continue;
            }
            if (line.startsWith('//')) {
                // Create a text node for comments
                const commentDiv = document.createElement('div');
                commentDiv.textContent = line;
                output.appendChild(commentDiv);
                continue;
            }

            try {
                if (line.includes('solve(')) {
                    // Handle solve function...
                    const match = line.match(/solve\(([^)]+)\)/)[1].split(/\s*,\s*/);
                    if (match) {
                        const equationName = match[0].trim();
                        const variable = match[1].trim();
                        let solution;
                        if(match.length > 2){
                            const initialValue = match[2].trim();
                            [result1, result2, result3, result4, result5] = solveEquation(equationName, variable, initialValue);
                            pushResult(result1);
                            pushResult(result2, result5);
                            pushResult(result3, result4.toString());
                        } else {
                            [result1, result2, result3, result4, result5] = solveEquation(equationName, variable);
                            pushResult(result1);
                            pushResult(result2, result5);
                            pushResult(result3, result4.toString());
                        }
                        parser.set(variable, result4);
                    }
                } else if (eqnAssign.test(line)) {
                    // Store equation for later use
                    const parts = line.split('=');
                    const name = parts[0].trim();
                    const equation = line.substring(line.indexOf('=') + 1).trim().split('//')[0].trim();
                    equations[name] = equation;
                    pushResult(`\\text{${name}} \\colonequals \\mathrm{${math.parse(equation).toTex()}}`, equation);
                } else if (standAloneEqn.test(line)){
                    variable = findFreeVariable(line);
                    const equationName = "dummy";
                    solution = solveEquation(equationName, variable);
                    pushResult(`\\text{${line}} = ${math.parse(solution.toString()).toTex()}`);
                    parser.set(variable, solution);
                } else if (line.includes('=')) {
                    // Handle assignment
                    const parts = line.split('=');
                    const name = parts[0].trim();
                    const expr = parts[1].split('//')[0].trim(); // Remove comments
                    const result = parser.evaluate(expr);
                    parser.set(name, result);
                    pushResult(`\\text{${name}} \\colonequals ${math.parse(expr.toString()).toTex()} \\to ${math.parse(result.toString()).toTex()}`);
                } else if(line.includes('to')){
                    // Handle unit conversion
                    const parts = line.split('to');
                    const value = parts[0].trim();
                    const unit = parts[1].trim();
                    const result = parser.evaluate(line);
                    pushResult(`\\text{${value}} \\to \\mathrm{${unit}} = ${math.parse(result.toString()).toTex()}`, result.toString())
                } else{
                    // Direct evaluation
                    const result = parser.evaluate(line);
                    pushResult(`\\text{${line}} \\to ${math.parse(result.toString()).toTex()}`, result.toString())
                }

                // Create a new div for each result and render with KaTeX

            } catch (error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error';
                errorDiv.textContent = `Error in line "${line}": ${error.message}`;
                output.appendChild(errorDiv);
            }
        }
    } catch (error) {
        output.innerHTML = `Error: ${error.message}`;
    }
}