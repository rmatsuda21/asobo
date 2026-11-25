interface Env {
	ASSETS: Fetcher;
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/health') {
			return Response.json({ ok: true });
		}

		// Game rooms (one Durable Object per match) are added here in a later phase.
		if (url.pathname.startsWith('/api/')) {
			return new Response('Not found', { status: 404 });
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;
