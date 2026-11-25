import type { Game, Result, Seat } from './index';

/** Squares are numbered 0 to 63, left to right and top to bottom. */
export type ReversiMove = number;
export type ReversiCell = Seat | null;

export interface ReversiState {
	readonly board: readonly ReversiCell[];
	/** Whose turn it is, or null once neither player can move. */
	readonly turn: Seat | null;
}

const SIZE = 8;
const DIRECTIONS = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1]
] as const;

const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/**
 * The opposing stones that would flip if `seat` played on `move`.
 * An empty list means the move is not legal.
 */
export function flips(board: readonly ReversiCell[], seat: Seat, move: ReversiMove): number[] {
	if (!Number.isInteger(move) || move < 0 || move >= SIZE * SIZE || board[move] !== null) return [];

	const flipped: number[] = [];
	const row = Math.floor(move / SIZE);
	const col = move % SIZE;

	for (const [dr, dc] of DIRECTIONS) {
		const line: number[] = [];
		let r = row + dr;
		let c = col + dc;
		let closed = false;
		while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
			const cell = board[r * SIZE + c];
			if (cell === seat) {
				closed = true;
				break;
			}
			if (cell !== other(seat)) break;
			line.push(r * SIZE + c);
			r += dr;
			c += dc;
		}
		// A line only counts if one of the player's own stones closes it.
		if (closed) flipped.push(...line);
	}
	return flipped;
}

function movesFor(board: readonly ReversiCell[], seat: Seat): ReversiMove[] {
	const moves: ReversiMove[] = [];
	for (let i = 0; i < SIZE * SIZE; i++) {
		if (flips(board, seat, i).length > 0) moves.push(i);
	}
	return moves;
}

/** Stones on the board for seat 0 and seat 1. */
export function count(board: readonly ReversiCell[]): [number, number] {
	let a = 0;
	let b = 0;
	for (const cell of board) {
		if (cell === 0) a++;
		else if (cell === 1) b++;
	}
	return [a, b];
}

export const reversi: Game<ReversiState, ReversiMove> = {
	id: 'reversi',

	setup() {
		const board: ReversiCell[] = Array(SIZE * SIZE).fill(null);
		board[27] = 1;
		board[28] = 0;
		board[35] = 0;
		board[36] = 1;
		return { board, turn: 0 };
	},

	turn(state) {
		return state.turn;
	},

	legalMoves(state, seat) {
		return state.turn === seat ? movesFor(state.board, seat) : [];
	},

	applyMove(state, seat, move) {
		if (state.turn !== seat) throw new Error('It is not this player’s turn.');
		const flipped = flips(state.board, seat, move);
		if (flipped.length === 0) throw new Error(`Square ${move} is not a legal move.`);

		const board = state.board.slice();
		board[move] = seat;
		for (const i of flipped) board[i] = seat;

		// A player with no legal move passes automatically; with none for either, the game ends.
		const next = other(seat);
		const turn = movesFor(board, next).length > 0 ? next : movesFor(board, seat).length > 0 ? seat : null;
		return { board, turn };
	},

	result(state): Result | null {
		if (state.turn !== null) return null;
		const [a, b] = count(state.board);
		if (a === b) return { kind: 'draw' };
		return { kind: 'win', winner: a > b ? 0 : 1 };
	}
};
