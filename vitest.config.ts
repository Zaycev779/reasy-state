import { resolve } from "path";
// eslint-disable-next-line import/extensions
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: [
            { find: /^reasy-state$/, replacement: resolve("./src/index.ts") },
            { find: /^reasy-state(.*)$/, replacement: resolve("./src/$1.ts") },
        ],
    },
    test: {
        name: "reasy state",
        globals: true,
        environment: "jsdom",
        dir: "tests",
        reporters: "basic",
    },
});
