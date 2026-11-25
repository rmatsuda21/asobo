import { DurableObject } from 'cloudflare:workers';
import { reversi, type ReversiState, type Seat } from '@asobo/games';
import { PLAYER_ID, PROTOCOL_VERSION, type ClientMessage, type RoomSnapshot } from './protocol';

/** A room with no activity for this long is deleted. */
const IDLE_MS = 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 256;

interface Stored {
	state: ReversiState;
	/** The player id that owns each seat. Ids never leave the server. */
	seats: [string | null, string | null];
	last: RoomSnapshot['last'];
	round: number;
}

/** Kept on each socket so it survives the object going to sleep between messages. */
interface Attachment {
	playerId: string;
}

/**
 * One match. The room owns the game state and is the referee: a move only
 * counts if the shared rules accept it for the seat that sent it.
 */
export class Room extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected a WebSocket', { status: 426 });
		}
		const { 0: client, 1: server } = new WebSocketPair();
		// The hibernation API lets the object sleep while sockets stay open, so an idle room costs nothing.
		this.ctx.acceptWebSocket(server);
		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
		if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_LENGTH) return;
		let message: ClientMessage;
		try {
			message = JSON.parse(raw);
		} catch {
			return;
		}
		if (typeof message !== 'object' || message === null) return;

		const room = await this.load();

		if (message.type === 'hello') {
			if (message.v !== PROTOCOL_VERSION) {
				ws.send(JSON.stringify({ type: 'outdated' }));
				ws.close(4000, 'Client is out of date');
				return;
			}
			if (typeof message.playerId !== 'string' || !PLAYER_ID.test(message.playerId)) {
				ws.close(1008, 'Invalid player id');
				return;
			}
			ws.serializeAttachment({ playerId: message.playerId } satisfies Attachment);
			if (!room.seats.includes(message.playerId)) {
				const free = room.seats.indexOf(null);
				if (free !== -1) room.seats[free] = message.playerId;
			}
		} else {
			const seat = this.seatOf(ws, room);
			if (seat === null) return;

			if (message.type === 'move') {
				try {
					room.state = reversi.applyMove(room.state, seat, message.move);
				} catch {
					// Not legal, or not their turn. Send the true state back so the client corrects itself.
					this.send(ws, room);
					return;
				}
				room.last = { square: message.move, seat };
			} else if (message.type === 'rematch') {
				if (room.state.turn !== null) return;
				// Swap seats so the other player moves first this time.
				room.seats = [room.seats[1], room.seats[0]];
				room.state = reversi.setup();
				room.last = null;
				room.round++;
			} else {
				return;
			}
		}

		await this.ctx.storage.put('room', room);
		await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
		this.broadcast(room);
	}

	async webSocketClose(ws: WebSocket) {
		try {
			ws.close();
		} catch {
			// Already closed.
		}
		this.broadcast(await this.load(), ws);
	}

	async webSocketError(ws: WebSocket) {
		await this.webSocketClose(ws);
	}

	/** Runs after a day without activity. */
	async alarm() {
		for (const ws of this.ctx.getWebSockets()) ws.close(1001, 'Room expired');
		await this.ctx.storage.deleteAll();
	}

	private async load(): Promise<Stored> {
		return (
			(await this.ctx.storage.get<Stored>('room')) ?? {
				state: reversi.setup(),
				seats: [null, null],
				last: null,
				round: 0
			}
		);
	}

	private seatOf(ws: WebSocket, room: Stored): Seat | null {
		const attachment = ws.deserializeAttachment() as Attachment | null;
		if (!attachment) return null;
		const seat = room.seats.indexOf(attachment.playerId);
		return seat === 0 || seat === 1 ? seat : null;
	}

	private send(ws: WebSocket, room: Stored, present = this.present(room)) {
		const snapshot: RoomSnapshot = {
			type: 'state',
			state: room.state,
			seat: this.seatOf(ws, room),
			joined: [room.seats[0] !== null, room.seats[1] !== null],
			present,
			last: room.last,
			round: room.round
		};
		try {
			ws.send(JSON.stringify(snapshot));
		} catch {
			// The socket closed between the check and the send.
		}
	}

	private present(room: Stored, leaving?: WebSocket): [boolean, boolean] {
		const present: [boolean, boolean] = [false, false];
		for (const ws of this.ctx.getWebSockets()) {
			if (ws === leaving) continue;
			const seat = this.seatOf(ws, room);
			if (seat !== null) present[seat] = true;
		}
		return present;
	}

	private broadcast(room: Stored, leaving?: WebSocket) {
		const present = this.present(room, leaving);
		for (const ws of this.ctx.getWebSockets()) {
			if (ws !== leaving) this.send(ws, room, present);
		}
	}
}
