import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
 
export default [{
    input: "src/index.ts",
    treeshake: "smallest",
    external: ["react"],
    output: [ 
         { 
            file: "dist/index.cjs.js", 
            format: "cjs", 
            exports: "auto", 
            sourcemap: false, 
            plugins: [
                terser({
                ecma: 2020,
                mangle: { toplevel: true },
                compress: {
                    module: true,
                    toplevel: true,
                    unsafe_arrows: true,
                    drop_console: true,  
                    passes: 2,
                },
                output: { quote_style: 1 },
                }),
            ] 
        },
        { 
            file: "dist/index.esm.js", 
            format: "esm", 
            sourcemap: false,
            plugins: [
                terser({
                ecma: 2020,
                mangle: { toplevel: true },
                compress: {
                    module: true,
                    toplevel: true,
                    unsafe_arrows: true,
                    drop_console: true,
                    passes: 2,
                },
                output: { quote_style: 1 }
                })
            ] 
        },
    ],
    plugins: [
        del({ targets: "dist/*" }),
        typescript({ compilerOptions: {lib: ["dom", "es2018"], target: "es2018" }, rootDir:"src", tsconfig: "./tsconfig.json", incremental: false }),
    ],
}, {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: "es5" }],
    plugins: [dts(), del({ hook: "buildEnd", targets: "./dist/types" })],
}];