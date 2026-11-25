import type { GameId } from '@asobo/games';
import {
	PROTOCOL_VERSION,
	type ClientMessage,
	type RoomSnapshot,
	type ServerMessage
} from '@asobo/server/protocol';

const PLAYER_KEY = 'asobo:player';
/** No look-alike characters, so a code is easy to read out loud. */
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomString(alphabet: string, length: number): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

/** A new room code. Whoever has the link can join, so it has to be hard to guess. */
export function newRoomCode(): string {
	return randomString(CODE_ALPHABET, 6);
}

/**
 * This browser's id. The room uses it to give a returning player their seat
 * back; it is random, says nothing about the person, and is never shown to the opponent.
 */
function playerId(): string {
	const fresh = () =>
		randomString('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 24);
	try {
		let id = localStorage.getItem(PLAYER_KEY);
		if (!id) {
			id = fresh();
			localStorage.setItem(PLAYER_KEY, id);
		}
		return id;
	} catch {
		return fresh();
	}
}

/** Called when a move arrives while this device is watching, with the state it replaced. */
export type MoveListener<State, Move> = (before: State, now: RoomSnapshot<State, Move>) => void;

/** A live connection to one match of any game. It reconnects by itself until `close()` is called. */
export class RoomConnection<State, Move> {
	/** 'outdated' means the server refused this copy of the app; it stays closed until a reload. */
	status = $state<'connecting' | 'open' | 'reconnecting' | 'outdated'>('connecting');
	/** Null until the room has answered. */
	snapshot = $state.raw<RoomSnapshot<State, Move> | null>(null);

	#url: string;
	#id = playerId();
	#socket: WebSocket | null = null;
	#attempts = 0;
	#retry: ReturnType<typeof setTimeout> | undefined;
	#closed = false;
	#onmove: MoveListener<State, Move>;

	constructor(game: GameId, code: string, onmove: MoveListener<State, Move>) {
		const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
		this.#url = `${scheme}://${location.host}/api/room/${game}/${code}`;
		this.#onmove = onmove;
		this.#connect();
		// Phones drop sockets when the screen sleeps; come back as soon as the page is visible again.
		document.addEventListener('visibilitychange', this.#wake);
		window.addEventListener('online', this.#wake);
	}

	move(move: Move) {
		this.#send({ type: 'move', move });
	}

	rematch() {
		this.#send({ type: 'rematch' });
	}

	close() {
		this.#closed = true;
		clearTimeout(this.#retry);
		document.removeEventListener('visibilitychange', this.#wake);
		window.removeEventListener('online', this.#wake);
		this.#socket?.close();
	}

	#send(message: ClientMessage) {
		if (this.#socket?.readyState === WebSocket.OPEN) this.#socket.send(JSON.stringify(message));
	}

	#wake = () => {
		if (document.visibilityState !== 'visible' || this.#closed) return;
		const state = this.#socket?.readyState;
		if (state !== WebSocket.OPEN && state !== WebSocket.CONNECTING) {
			clearTimeout(this.#retry);
			this.#connect();
		}
	};

	#connect() {
		const socket = new WebSocket(this.#url);
		this.#socket = socket;

		socket.addEventListener('open', () => {
			if (this.#closed) return;
			this.#attempts = 0;
			this.status = 'open';
			this.#send({ type: 'hello', playerId: this.#id, v: PROTOCOL_VERSION });
		});

		socket.addEventListener('message', (event) => {
			let message: ServerMessage<State, Move>;
			try {
				message = JSON.parse(String(event.data));
			} catch {
				return;
			}
			if (message?.type === 'state') this.#apply(message);
			else if (message?.type === 'outdated') {
				this.status = 'outdated';
				this.close();
				// Fetch the new version in the background so the reload prompt appears.
				void navigator.serviceWorker
					?.getRegistration()
					.then((registration) => registration?.update())
					.catch(() => {});
			}
		});

		socket.addEventListener('close', () => {
			if (this.#closed || this.#socket !== socket) return;
			this.status = 'reconnecting';
			const wait = Math.min(500 * 2 ** this.#attempts++, 8000);
			this.#retry = setTimeout(() => this.#connect(), wait);
		});
	}

	#apply(next: RoomSnapshot<State, Move>) {
		const previous = this.snapshot;
		this.snapshot = next;
		// Report only a move that happened while we were watching: the same game, and a changed state.
		if (
			previous !== null &&
			previous.round === next.round &&
			next.last !== null &&
			JSON.stringify(previous.state) !== JSON.stringify(next.state)
		) {
			this.#onmove(previous.state, next);
		}
	}
}
