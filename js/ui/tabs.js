function switchTab(tabNumber) {
    // Save current tab state
    const currentInput = document.getElementById('calculator-input').value;
    const currentOutput = document.getElementById('output').innerHTML;
    tabStates[tabStates.activeTab] = { input: currentInput, output: currentOutput };

    // Switch to new tab
    tabStates.activeTab = tabNumber;
    document.getElementById('calculator-input').value = tabStates[tabNumber].input;
    document.getElementById('output').innerHTML = tabStates[tabNumber].output;

    // Update tab UI
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabNumber.toString()) {
            tab.classList.add('active');
        }
    });
}

function closeTab(tabNumber) {
    if (Object.keys(tabStates).length <= 3) return; // Don't close last tab (accounting for nextTabId and activeTab)

    if (tabStates.activeTab === tabNumber) {
        // Find the highest tab number that isn't being closed
        const availableTabs = Object.keys(tabStates)
            .filter(key => key !== 'nextTabId' && key !== 'activeTab' && key !== tabNumber.toString())
            .map(Number);
        const newActiveTab = Math.max(...availableTabs);
        switchTab(newActiveTab);
    }

    delete tabStates[tabNumber];
    document.querySelector(`[data-tab="${tabNumber}"]`).remove();
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {            
    // Add event listeners for tabs
    document.querySelector('.tab-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
            closeTab(parseInt(e.target.parentNode.dataset.tab));
        } else if (e.target.classList.contains('tab')) {
            switchTab(parseInt(e.target.dataset.tab));
        } else if (e.target.classList.contains('new-tab')) {
            createNewTab();
        }
    });
});

// Update the createNewTab function
function createNewTab() {
    const nextId = tabStates.nextTabId;  // Use nextTabId from tabStates
    tabStates[nextId] = { input: '', output: '' };
    
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.dataset.tab = nextId;
    newTab.innerHTML = `Tab ${nextId} <span class="tab-close">×</span>`;
    
    const newTabButton = document.querySelector('.new-tab');
    newTabButton.parentNode.insertBefore(newTab, newTabButton);
    
    switchTab(nextId);
    tabStates.nextTabId++;  // Increment nextTabId in tabStates
}

function loadTabsFromJSON(json){
    const parsedTabs = JSON.parse(json);
    tabStates = {
        ...parsedTabs,
        nextTabId: parsedTabs.nextTabId || 3,
        activeTab: parsedTabs.activeTab || 1
    };
    
    // Clear existing tabs except the new tab button
    const tabContainer = document.querySelector('.tab-container');
    const newTabButton = document.querySelector('.new-tab');
    while (tabContainer.firstChild) {
        if (tabContainer.firstChild === newTabButton) break;
        tabContainer.removeChild(tabContainer.firstChild);
    }
    
    // Create tab elements for each saved tab
    Object.keys(tabStates).forEach(tabId => {
        if (tabId !== 'nextTabId' && tabId !== 'activeTab') {
            const newTab = document.createElement('div');
            newTab.className = 'tab';
            if (parseInt(tabId) === tabStates.activeTab) {
                newTab.className += ' active';
            }
            newTab.dataset.tab = tabId;
            newTab.innerHTML = `Tab ${tabId} <span class="tab-close">×</span>`;
            tabContainer.insertBefore(newTab, newTabButton);
        }
    });
    
    // Set the content of the active tab
    document.getElementById('calculator-input').value = tabStates[tabStates.activeTab].input;
    document.getElementById('output').innerHTML = tabStates[tabStates.activeTab].output;
    
    // Reattach copy listeners
    attachCopyListeners();
}