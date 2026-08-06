// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
    site: "https://darlng.com",
    integrations: [sitemap(), preact(), mdx()],
    vite: {
        plugins: [tailwindcss()],
    },
    build: {
        inlineStylesheets: 'never',
    },
});
