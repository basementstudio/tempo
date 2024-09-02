import { defineConfig } from "tsup";
import path from "path";
import fsPromises from "fs/promises";
import postcss from "postcss";
import postcssModules from "postcss-modules";
import { MOUNT_EVENT_KEY } from "./src/constants";
import { generateScopedName } from "hash-css-selector";

const injectStyle = (css: string) => {
  return `      
    window.addEventListener('${MOUNT_EVENT_KEY}', ({detail: { root }}) => {
      const style = document.createElement('style');
      style.textContent = ${css};
      root.shadowRoot.appendChild(style);
    })
  `;
}

export default defineConfig({
  esbuildOptions(opts) {
    opts.logLevel = "debug";
    opts.outbase = "src";
  },
  banner: {
    js: `"use client";`,
  },
  outDir: "dist",
  entry: ["./src/index.tsx", "./src/debug.ts", "./src/react/index.tsx"],
  tsconfig: "./tsconfig.json",
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: true,
  injectStyle: (css) => injectStyle(css),
  bundle: true,
  esbuildPlugins: [
    {
      name: "css-module",
      setup(build): void {
        build.onResolve(
          { filter: /\.module\.css$/, namespace: "file" },
          (args) => {
            return {
              path: `${args.path}#css-module`,
              namespace: "css-module",
              pluginData: {
                pathDir: path.join(args.resolveDir, args.path),
              },
            };
          },
        );
        build.onLoad(
          { filter: /#css-module$/, namespace: "css-module" },
          async (args) => {
            const { pluginData } = args as {
              pluginData: { pathDir: string };
            };

            const source = await fsPromises.readFile(
              pluginData.pathDir,
              "utf8",
            );

            let cssModule: any = {};
            const result = await postcss([
              postcssModules({
                generateScopedName: function (name, filename) {
                  const newSelector = generateScopedName(name, filename);
                  cssModule[name] = newSelector;

                  return newSelector;
                },
                getJSON: () => { },
                scopeBehaviour: "local",
              }),
            ]).process(source, { from: pluginData.pathDir });

            return {
              pluginData: { css: result.css },
              contents: `import "${pluginData.pathDir}"; export default ${JSON.stringify(cssModule)}`,
            };
          },
        );

        build.onResolve(
          { filter: /\.module\.css$/, namespace: "css-module" },
          (args) => ({
            path: path.join(args.resolveDir, args.path, "#css-module-data"),
            namespace: "css-module",
            pluginData: args.pluginData as { css: string },
          }),
        );

        build.onLoad(
          { filter: /#css-module-data$/, namespace: "css-module" },
          (args) => {
            const cssContent = (args.pluginData as { css: string }).css;
            const css = JSON.stringify(cssContent)

            return {
              contents: injectStyle(css),
              loader: "js",
            };
          },
        );
      },
    },
  ],
});
