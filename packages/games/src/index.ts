/**
 * The contract every Asobo game implements.
 *
 * A game is a set of pure functions over serialisable state, so the same
 * module runs in the browser (to draw and to preview moves) and in the room
 * server (to referee). Nothing here may touch the DOM, the network or a clock.
 */
export type Seat = 0 | 1;

export type Result = { kind: 'win'; winner: Seat } | { kind: 'draw' };

export interface Game<State, Move> {
	readonly id: string;
	/** State at the start of a match. Seat 0 moves first unless the game says otherwise. */
	setup(): State;
	/** Whose turn it is, or null once the match is over. */
	turn(state: State): Seat | null;
	/** Every move the given seat may play now. Empty when it is not their turn. */
	legalMoves(state: State, seat: Seat): Move[];
	/** The state after a move. Throws if the move is not legal for that seat. */
	applyMove(state: State, seat: Seat, move: Move): State;
	/** The outcome, or null while the match is still in progress. */
	result(state: State): Result | null;
}

export * from './reversi';
export * from './four';

import { four } from './four';
import { reversi } from './reversi';

/** Every game, by id. The room server referees any of these without knowing its rules. */
export const games = { reversi, four } as const;
export type GameId = keyof typeof games;

export function isGameId(id: string): id is GameId {
	return Object.hasOwn(games, id);
}
