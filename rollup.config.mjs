import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from 'rollup-plugin-dts';
// import pkg from "./package.json" assert { type: "json" };
// import babel from 'rollup-plugin-babel';
// import babelrc from 'babelrc-rollup';

export default [{
    input: "src/index.ts",
    //  output: {
    //      dir: 'dist',
    //      format: 'cjs'
    //  },
     output: [
         { file: "dist/index.cjs.js", format: "cjs", exports: "auto", sourcemap: true },
          { file: "dist/index.esm.js", format: "es", sourcemap: true },
  ],
    plugins: [
        del({ targets: "dist/*" }),
        typescript({ compilerOptions: {lib: ["es5", "es6", "dom"], target: "es5" }, tsconfig: "./tsconfig.json" }),
    ],
}, {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: "esm" }],
    external: [/\.css$/],
    plugins: [dts()],
},];