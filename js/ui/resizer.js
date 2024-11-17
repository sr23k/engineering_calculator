let startX, startWidthPercent, resizerWidthPercent;
const minWidthPercent = 20;
const maxWidthPercent = 80;

function startDrag(e) {
    e.preventDefault();  // Prevent text selection while dragging
    startX = e.clientX;
    const editorContainer = document.querySelector('.editor-container');
    const containerWidth = document.querySelector('.container').offsetWidth;
    const outputContainer = document.querySelector('.output-container');
    const resizer = document.getElementById('resizer');
    resizerWidthPercent = (resizer.scrollWidth / containerWidth) * 100;
    startWidthPercent = (editorContainer.offsetWidth / containerWidth) * 100 - 1.2;
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
}

function doDrag(e) {
    const container = document.querySelector('.container');
    const editorContainer = document.querySelector('.editor-container');
    const outputContainer = document.querySelector('.output-container');
    
    const containerWidth = container.offsetWidth;
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    let newWidthPercent = Math.min(maxWidthPercent, Math.max(minWidthPercent, startWidthPercent + deltaPercent));
    
    editorContainer.style.flex = `0 0 ${newWidthPercent - resizerWidthPercent/2}%`;
    outputContainer.style.flex = `0 0 ${100 - newWidthPercent - resizerWidthPercent/2 - 2.9}%`;  // Subtract resizer width percentage
}

function stopDrag() {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
}