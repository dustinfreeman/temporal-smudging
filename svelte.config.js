import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    // https://svelte.dev/docs/kit/adapter-static#Usage
    adapter: adapter(),
    paths: {
      // https://www.okupter.com/blog/deploy-sveltekit-website-to-github-pages
      base: process.env.NODE_ENV === "production" ? "/sveltekit2gh-pages" : "",
    },
  },
};

export default config;
