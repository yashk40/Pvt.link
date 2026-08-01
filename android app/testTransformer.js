const path = require('path');
const { loadConfig } = require('metro-config');
const transformerPath = path.resolve(__dirname, 'node_modules/metro/src/DeltaBundler/Transformer.js');
const Transformer = require(transformerPath).default;

async function run() {
    try {
        const config = await loadConfig();
        console.log("Metro config loaded successfully.");
        const transformer = new Transformer(config, {
            getOrComputeSha1: (f) => 'test-sha1',
        });
        console.log("Compiled transformer successfully!");
    } catch (err) {
        console.error("TRANSFORMER BUILD ERROR:", err);
    }
}
run();
