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

		// /api/room/<code> opens a WebSocket to that match's room.
		const room = url.pathname.match(/^\/api\/room\/([^/]+)$/);
		if (room) {
			const code = room[1]!;
			if (!ROOM_CODE.test(code)) return new Response('Invalid room code', { status: 400 });
			// Browsers always send Origin on WebSockets; refuse pages from other sites.
			const origin = request.headers.get('Origin');
			if (origin && new URL(origin).host !== url.host && !isLocal(origin)) {
				return new Response('Forbidden', { status: 403 });
			}
			return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
		}

		if (url.pathname.startsWith('/api/')) {
			return new Response('Not found', { status: 404 });
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;
