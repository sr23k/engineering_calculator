const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier');

function inlineJavaScript(htmlFilePath, version) {
    // Read the HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Match <script src="path"></script> tags
    const scriptTagRegex = /<script\s+src="(.+?)"\s*>\s*<\/script>/g;

    // Replace each <script src="..."></script> with the inline content
    htmlContent = htmlContent.replace(scriptTagRegex, (match, srcPath) => {
        const jsFilePath = path.resolve(path.dirname(htmlFilePath), srcPath);

        if (fs.existsSync(jsFilePath)) {
            const jsContent = fs.readFileSync(jsFilePath, 'utf-8');
            return `<script>\n${jsContent}\n</script>`;
        } else {
            console.warn(`Warning: JavaScript file '${srcPath}' not found.`);
            return match; // Return the original tag if the file is not found
        }
    });

    // Minify the resulting HTML content
    const minifiedHtmlContent = minify(htmlContent, {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true
    });

    // Define the output file name using the version if provided
    const versionSuffix = version ? `_${version}` : '';
    const outputFilePath = htmlFilePath.replace('index.html', `engineering_calculator_v${versionSuffix}.html`);
    fs.writeFileSync(outputFilePath, minifiedHtmlContent);
    console.log(`Minified inlined HTML saved to ${outputFilePath}`);
}

// Accept the HTML file path and version as command-line arguments
const htmlFilePath = process.argv[2];
const version = process.argv[3];  // Version passed from GitHub Action
if (!htmlFilePath) {
    console.error('Please provide the HTML file path as an argument.');
    process.exit(1);
}

inlineJavaScript(htmlFilePath, version);