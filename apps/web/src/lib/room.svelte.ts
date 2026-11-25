import type { ReversiState, Seat } from '@asobo/games';
import type { ClientMessage, RoomSnapshot } from '@asobo/server/protocol';
import { moveBetween, type LastMove } from './reversi-ui.ts';

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

export type MoveListener = (move: LastMove, after: ReversiState, by: Seat) => void;

/** A live connection to one match. It reconnects by itself until `close()` is called. */
export class RoomConnection {
	status = $state<'connecting' | 'open' | 'reconnecting'>('connecting');
	/** Null until the room has answered. */
	snapshot = $state.raw<RoomSnapshot | null>(null);
	/** The move that led to the current board, for animating it. */
	last = $state.raw<LastMove | null>(null);

	#url: string;
	#id = playerId();
	#socket: WebSocket | null = null;
	#attempts = 0;
	#retry: ReturnType<typeof setTimeout> | undefined;
	#closed = false;
	#onmove: MoveListener;

	constructor(code: string, onmove: MoveListener) {
		const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
		this.#url = `${scheme}://${location.host}/api/room/${code}`;
		this.#onmove = onmove;
		this.#connect();
		// Phones drop sockets when the screen sleeps; come back as soon as the page is visible again.
		document.addEventListener('visibilitychange', this.#wake);
		window.addEventListener('online', this.#wake);
	}

	move(square: number) {
		this.#send({ type: 'move', move: square });
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
			this.#attempts = 0;
			this.status = 'open';
			this.#send({ type: 'hello', playerId: this.#id });
		});

		socket.addEventListener('message', (event) => {
			let message: RoomSnapshot;
			try {
				message = JSON.parse(String(event.data));
			} catch {
				return;
			}
			if (message?.type === 'state') this.#apply(message);
		});

		socket.addEventListener('close', () => {
			if (this.#closed || this.#socket !== socket) return;
			this.status = 'reconnecting';
			const wait = Math.min(500 * 2 ** this.#attempts++, 8000);
			this.#retry = setTimeout(() => this.#connect(), wait);
		});
	}

	#apply(next: RoomSnapshot) {
		const previous = this.snapshot;
		this.snapshot = next;

		// Animate only a move that happened while we were watching: the same game, and a different board.
		const changed =
			previous !== null &&
			previous.round === next.round &&
			next.last !== null &&
			previous.state.board.some((cell, i) => cell !== next.state.board[i]);
		if (changed) {
			const move = moveBetween(previous.state.board, next.state.board, next.last!.square);
			this.last = move;
			this.#onmove(move, next.state, next.last!.seat);
		} else if (previous === null || previous.round !== next.round) {
			this.last = null;
		}
	}
}
