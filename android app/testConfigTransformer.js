const path = require('path');
const config = require('./metro.config.js');
const transformerPath = path.resolve(__dirname, 'node_modules/metro/src/DeltaBundler/Transformer.js');
const Transformer = require(transformerPath).default;

async function run() {
    try {
        console.log("Metro configuration loaded successfully.");
        const transformer = new Transformer(config, {
            getOrComputeSha1: (f) => 'test-sha-nativewind',
        });
        console.log("Compiled transformer with custom config successfully!");
    } catch (err) {
        console.error("TRANSFORMER BUILD ERROR ON CUSTOM CONFIG:", err);
    }
}
run();
