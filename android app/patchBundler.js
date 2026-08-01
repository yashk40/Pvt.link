const fs = require('fs');
const filepath = 'node_modules/metro/src/Bundler.js';
let content = fs.readFileSync(filepath, 'utf8');

const target = `.catch((error) => {
        console.error("Failed to construct transformer: ", error);
        config.reporter.update({
          type: "transformer_load_failed",
          error,
        });
      });`;

const replacement = `.catch((error) => {
        console.error("METRO_TRANSFORMER_FATAL_ERROR:", error);
        process.exit(1);
      });`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Patched Bundler.js successfully to crash on transformer failure.");
} else {
    // Let's print clean check
    console.log("Target block not found, might already be patched or format differs.");
}
