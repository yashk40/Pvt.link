const fs = require('fs');
const content = fs.readFileSync('node_modules/metro/src/Bundler.js', 'utf8').replace(/\r/g, '');
const constructorMatch = content.match(/constructor\s*\([^)]*\)\s*\{[\s\S]*?\}\n\s*(async|getWatcher|end)/s);
if (constructorMatch) {
    fs.writeFileSync('constructor.txt', constructorMatch[0]);
} else {
    // Let's just output the class template
    const idx = content.indexOf('class Bundler');
    if (idx !== -1) {
        fs.writeFileSync('constructor.txt', content.substring(idx, idx + 2000));
    } else {
        fs.writeFileSync('constructor.txt', "Not found class Bundler");
    }
}
