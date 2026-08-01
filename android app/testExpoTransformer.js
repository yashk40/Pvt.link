const { getDefaultConfig } = require('expo/node_modules/@expo/metro-config');
const path = require('path');
const transformerPath = path.resolve(__dirname, 'node_modules/metro/src/DeltaBundler/Transformer.js');
const Transformer = require(transformerPath).default;

async function run() {
    try {
        const config = getDefaultConfig(__dirname);
        console.log("Expo Metro config resolved successfully.");
        const transformer = new Transformer(config, {
            getOrComputeSha1: (f) => 'test-sha1',
        });
        console.log("Compiled expo transformer successfully!");
    } catch (err) {
        console.error("TRANSFORMER BUILD ERROR:", err);
    }
}
run();
