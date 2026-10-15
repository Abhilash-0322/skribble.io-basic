/**
 * Vercel server service entry (CommonJS). Built output lives in dist/.
 * Do not point entrypoint at src/*.ts — the platform bundle breaks ESM imports.
 */
const mod = require("./dist/index.js");
module.exports = mod.default ?? mod;
