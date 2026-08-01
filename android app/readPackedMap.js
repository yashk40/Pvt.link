const fs = require('fs');
const content = fs.readFileSync('node_modules/expo/node_modules/@expo/metro-config/build/serializer/packedMap.js', 'utf8').replace(/\r/g, '');
const lines = content.split('\n');
const result = [];
for (let i = 150; i < 190 && i < lines.length; i++) {
    result.push(`${i + 1}: ${lines[i]}`);
}
fs.writeFileSync('packedMap.txt', result.join('\n'));
console.log("Wrote packedMap.txt successfully.");
