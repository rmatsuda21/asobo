import type { Seat } from '@asobo/games';

/** Room codes are six characters from an alphabet with no look-alikes (no 0/o, 1/l/i). */
export const ROOM_CODE = /^[a-hjkmnp-z2-9]{6}$/;

/** A random id each browser makes for itself, so it can reclaim its seat after reconnecting. */
export const PLAYER_ID = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * Bumped whenever the messages below change shape. An app saved for offline use
 * can be older than the server; the room turns such a client away so it updates.
 */
export const PROTOCOL_VERSION = 2;

export type ClientMessage =
	| { type: 'hello'; playerId: string; v: number }
	| { type: 'move'; move: unknown }
	| { type: 'rematch' };

/** Everything a client needs to draw the match. `State` and `Move` depend on the game. */
export interface RoomSnapshot<State = unknown, Move = unknown> {
	type: 'state';
	state: State;
	/** The seat this connection plays, or null if both seats were taken (watching only). */
	seat: Seat | null;
	/** Whether each seat has been claimed by a player. */
	joined: [boolean, boolean];
	/** Whether each seat's player is connected right now. */
	present: [boolean, boolean];
	/** The move that produced this state, so the other player can animate it. */
	last: { move: Move; seat: Seat } | null;
	/** Counts games played in this room; it goes up on a rematch. */
	round: number;
}

export type ServerMessage<State = unknown, Move = unknown> =
	| RoomSnapshot<State, Move>
	| { type: 'outdated' };
