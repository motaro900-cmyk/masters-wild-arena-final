const fs = require('fs');
const html = fs.readFileSync('dist/stats.html', 'utf8');

// The bundle analyzer embedded data is usually stored as a compressed/JSON structure.
// Let's search for the script block containing the module data.
// In newer versions of vite-bundle-analyzer, it might store the data in a variable like chartData or as a gzipped/base64 string in window.chartData or similar.
// Let's log all variable names and their values/lengths.
const scriptMatches = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/g);
console.log(`Found ${scriptMatches ? scriptMatches.length : 0} script tags.`);

if (scriptMatches) {
  scriptMatches.forEach((script, idx) => {
    console.log(`--- Script #${idx} (length: ${script.length}) ---`);
    const line = script.slice(0, 1000);
    console.log(line);
    // Find variables defined like "const x = ..."
    const vars = script.match(/(?:const|let|var)\s+(\w+)\s*=/g);
    if (vars) {
      console.log('Variables declared:', vars.slice(0, 20).join(', '));
    }
  });
}
