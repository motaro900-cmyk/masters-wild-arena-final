const fs = require('fs');
const html = fs.readFileSync('dist/dist/stats.html', 'utf8');

const scripts = html.match(/<script>([\s\S]*?)<\/script>/);
const jsCode = scripts[1];

const vm = require('vm');
const context = {};
vm.createContext(context);
vm.runInContext(jsCode, context);

const modules = context.analyzeModule;

const leafModules = [];
const packageSizes = {};

function traverse(node, currentPkg = null) {
  // Determine if this is a package folder in node_modules
  let pkg = currentPkg;
  if (node.label && node.label !== 'node_modules' && !currentPkg) {
    // If we are under node_modules, the next label is the package name
    pkg = node.label;
  }
  
  if (node.groups && node.groups.length > 0) {
    node.groups.forEach(g => traverse(g, pkg));
  } else if (node.filename) {
    leafModules.push({
      filename: node.filename,
      label: node.label,
      size: node.parsedSize || 0,
      gzip: node.gzipSize || 0,
      pkg: pkg || 'src'
    });
    
    if (pkg) {
      packageSizes[pkg] = (packageSizes[pkg] || 0) + (node.parsedSize || 0);
    }
  }
}

modules.forEach(asset => {
  if (asset.source && Array.isArray(asset.source)) {
    asset.source.forEach(s => traverse(s));
  }
});

console.log(`Total leaf modules found: ${leafModules.length}`);

// Sort leaf modules by parsedSize
const sortedLeaves = [...leafModules].sort((a, b) => b.size - a.size);
console.log('\n--- TOP 10 INDIVIDUAL MODULE FILES ---');
sortedLeaves.slice(0, 10).forEach(m => {
  console.log(`${m.filename}: ${(m.size / 1024).toFixed(2)} kB (gzip: ${(m.gzip / 1024).toFixed(2)} kB)`);
});

// Sort packages by size
const sortedPkgs = Object.entries(packageSizes).sort((a, b) => b[1] - a[1]);
console.log('\n--- TOP 10 NPM PACKAGES OR SOURCE DIRECTORIES ---');
sortedPkgs.slice(0, 10).forEach(([name, size]) => {
  console.log(`${name}: ${(size / 1024).toFixed(2)} kB`);
});
