const fs = require('fs');
const path = require('path');

const indexHTMLPath = path.join('.', 'index.html');
const date = new Date().toISOString().slice(0, 10);

let indexHTML = fs.readFileSync(indexHTMLPath, 'utf8');

// Replace the version info
indexHTML = indexHTML.replace(
  /<div id="version-info">.*<\/div>/,
  `<div id="version-info">Version: ${process.env.VERSION} | Last Updated: ${date}</div>`
);

// Replace the download link
indexHTML = indexHTML.replace(
  /<a href="engineering_calculator_version\.html" download>/,
  `<a href="engineering_calculator_v${process.env.VERSION}.html" download>`
);

fs.writeFileSync(indexHTMLPath, indexHTML);