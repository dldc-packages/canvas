import { denoPlugins } from "@luca/esbuild-deno-loader";
import * as esbuild from "esbuild";
import { resolve } from "jsr:@std/path@0.213";

const ctx = await esbuild.context({
  entryPoints: ["example/main.ts"],
  bundle: true,
  plugins: [...denoPlugins({
    configPath: resolve("deno.json"),
  })],
  outdir: "example/public",
});

await ctx.watch();

const { host, port } = await ctx.serve({
  servedir: "example/public",
});

console.log(`Serving on http://${host}:${port}`);
