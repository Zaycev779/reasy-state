import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from 'rollup-plugin-dts';

export default [{
    input: "src/index.ts",
     output: [ 
         { file: "dist/index.cjs.js", format: "cjs", exports: "auto", sourcemap: true },
          { file: "dist/index.esm.js", format: "es", sourcemap: true },
  ],
    plugins: [
        del({ targets: "dist/*" }),
        typescript({ compilerOptions: {lib: ["es5", "es6", "dom"], target: "es5" }, tsconfig: "./tsconfig.json", incremental: false }),
    ],
}, {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: "esm" }],
    external: [/\.css$/],
    plugins: [dts()],
}];