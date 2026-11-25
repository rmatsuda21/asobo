import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		// Online play talks to the Worker; run `pnpm preview` alongside `pnpm dev`.
		proxy: { '/api': { target: 'http://localhost:8787', ws: true } }
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// The app is a client-only SPA: every route falls back to index.html,
			// which the Cloudflare Worker in apps/server serves for unknown paths.
			adapter: adapter({ fallback: 'index.html' })
		})
	]
});
