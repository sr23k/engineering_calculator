function saveToFile() {
    tabStates[tabStates.activeTab].input = document.getElementById('calculator-input').value;
    tabStates[tabStates.activeTab].output = document.getElementById('output').innerHTML;
    const content = JSON.stringify(tabStates);
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = '';  // Empty string triggers "Save As" dialog
    a.click();
}

function loadFromFile() {
    // Create file input element if it doesn't exist
    let fileInput = document.getElementById('fileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.accept = '.txt';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    loadTabsFromJSON(e.target.result);
                };
                reader.readAsText(file);
            }
        });
    }
    
    fileInput.click();
}

// Update saveInput function
function saveInput() {
    const input = document.getElementById('calculator-input').value;
    // Must save for all tabs instead of just activeTab
    tabStates[tabStates.activeTab].input = input;  // Use activeTab from tabStates
    tabStates[tabStates.activeTab].output = document.getElementById('output').innerHTML;
    localStorage.setItem('calculatorTabs', JSON.stringify(tabStates));
    
    const saveMessage = document.getElementById('saveMessage');
    saveMessage.classList.add('show');
    setTimeout(() => {
        saveMessage.classList.remove('show');
    }, 1000);
}

function attachCopyListeners() {
    const copyableElements = document.querySelectorAll('.output-copyable');
    copyableElements.forEach(element => {

        element.addEventListener('click', async function(e) {
            e.stopPropagation();
            try {
                // Get the text content from the previous sibling (where math.js output is stored)
                const mathOutput = element.getAttribute('data-math-output');
                if (mathOutput) {
                    await navigator.clipboard.writeText(mathOutput);

                    // Visual feedback
                    const originalBg = element.style.backgroundColor;
                    element.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
                    setTimeout(() => {
                        element.style.backgroundColor = originalBg;
                    }, 200);
                }
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        });
    });
}