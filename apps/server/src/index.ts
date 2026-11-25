import { isGameId } from '@asobo/games';
import { ROOM_CODE } from './protocol';
import type { Room } from './room';

export { Room } from './room';
export type { ClientMessage, RoomSnapshot, ServerMessage } from './protocol';

interface Env {
	ASSETS: Fetcher;
	ROOMS: DurableObjectNamespace<Room>;
}

/** The dev server runs on another port and proxies here, so local origins are allowed. */
function isLocal(origin: string): boolean {
	const { hostname } = new URL(origin);
	return hostname === 'localhost' || hostname === '127.0.0.1';
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/health') {
			return Response.json({ ok: true });
		}

		// /api/room/<game>/<code> opens a WebSocket to that match's room.
		const room = url.pathname.match(/^\/api\/room\/([^/]+)\/([^/]+)$/);
		if (room) {
			const [, game, code] = room as unknown as [string, string, string];
			if (!isGameId(game)) return new Response('Unknown game', { status: 404 });
			if (!ROOM_CODE.test(code)) return new Response('Invalid room code', { status: 400 });
			// Browsers always send Origin on WebSockets; refuse pages from other sites.
			const origin = request.headers.get('Origin');
			if (origin && new URL(origin).host !== url.host && !isLocal(origin)) {
				return new Response('Forbidden', { status: 403 });
			}
			// The same code under two games is two different rooms.
			return env.ROOMS.get(env.ROOMS.idFromName(`${game}:${code}`)).fetch(request);
		}

		// Apps saved before rooms were per-game still connect to /api/room/<code>.
		// Tell them to update instead of leaving them retrying forever.
		if (/^\/api\/room\/[^/]+$/.test(url.pathname) && request.headers.get('Upgrade') === 'websocket') {
			const { 0: client, 1: server } = new WebSocketPair();
			server.accept();
			server.send(JSON.stringify({ type: 'outdated' }));
			server.close(4000, 'Client is out of date');
			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname.startsWith('/api/')) {
			return new Response('Not found', { status: 404 });
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;
