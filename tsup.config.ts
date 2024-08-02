import { defineConfig } from "tsup";
import { ScssModulesPlugin } from "esbuild-scss-modules-plugin";

export default defineConfig({
  esbuildPlugins: [ScssModulesPlugin()],
  banner: {
    js: `"use client";`,
  },
  entry: {
    index: "./src/index.ts",
  },
  dts: true,
  format: ["cjs", "esm"],
  sourcemap: false,
  minify: false,
  treeshake: true,
  splitting: true,
  injectStyle: true,
  bundle: true,
});