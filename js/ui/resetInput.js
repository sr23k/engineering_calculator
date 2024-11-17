function resetInput() {
            
    tabStates = {
        1: { input: defaultContent, output: '' },
        2: { input: '', output: '' },
        nextTabId: 3,
        activeTab: 1
    };
    
    // Clear existing tabs except the new tab button
    const tabContainer = document.querySelector('.tab-container');
    const newTabButton = document.querySelector('.new-tab');
    while (tabContainer.firstChild) {
        if (tabContainer.firstChild === newTabButton) break;
        tabContainer.removeChild(tabContainer.firstChild);
    }
    
    // Create default tabs
    const tab1 = document.createElement('div');
    tab1.className = 'tab active';
    tab1.dataset.tab = '1';
    tab1.innerHTML = 'Tab 1 <span class="tab-close">×</span>';
    
    const tab2 = document.createElement('div');
    tab2.className = 'tab';
    tab2.dataset.tab = '2';
    tab2.innerHTML = 'Tab 2 <span class="tab-close">×</span>';
    
    tabContainer.insertBefore(tab2, newTabButton);
    tabContainer.insertBefore(tab1, tab2);

    // Reset current tab's input
    switchTab(1);
    document.getElementById('calculator-input').value = defaultContent;
    
}