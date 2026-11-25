import type { Game, Result, Seat } from './index';

/** A move is the column a piece is dropped into, 0 to 6 from the left. */
export type FourMove = number;
export type FourCell = Seat | null;

export interface FourState {
	/** 42 cells, left to right and top to bottom: row 0 is the top of the board. */
	readonly board: readonly FourCell[];
	/** Whose turn it is, or null once someone has won or the board is full. */
	readonly turn: Seat | null;
}

export const FOUR_COLUMNS = 7;
export const FOUR_ROWS = 6;

const LINES = [
	[0, 1],
	[1, 0],
	[1, 1],
	[1, -1]
] as const;

/** The row a piece dropped into this column would land on, or null if the column is full. */
export function landingRow(board: readonly FourCell[], column: number): number | null {
	if (!Number.isInteger(column) || column < 0 || column >= FOUR_COLUMNS) return null;
	for (let row = FOUR_ROWS - 1; row >= 0; row--) {
		if (board[row * FOUR_COLUMNS + column] === null) return row;
	}
	return null;
}

/** The four cells of a winning line, or null if nobody has four in a row. */
export function winningLine(board: readonly FourCell[]): number[] | null {
	for (let row = 0; row < FOUR_ROWS; row++) {
		for (let col = 0; col < FOUR_COLUMNS; col++) {
			const owner = board[row * FOUR_COLUMNS + col];
			if (owner === null || owner === undefined) continue;
			for (const [dr, dc] of LINES) {
				const endRow = row + dr * 3;
				const endCol = col + dc * 3;
				if (endRow >= FOUR_ROWS || endCol < 0 || endCol >= FOUR_COLUMNS) continue;
				const line = [0, 1, 2, 3].map((i) => (row + dr * i) * FOUR_COLUMNS + col + dc * i);
				if (line.every((i) => board[i] === owner)) return line;
			}
		}
	}
	return null;
}

export const four: Game<FourState, FourMove> = {
	id: 'four',

	setup() {
		return { board: Array(FOUR_COLUMNS * FOUR_ROWS).fill(null), turn: 0 };
	},

	turn(state) {
		return state.turn;
	},

	legalMoves(state, seat) {
		if (state.turn !== seat) return [];
		const moves: FourMove[] = [];
		for (let col = 0; col < FOUR_COLUMNS; col++) {
			if (state.board[col] === null) moves.push(col);
		}
		return moves;
	},

	applyMove(state, seat, move) {
		if (state.turn !== seat) throw new Error('It is not this player’s turn.');
		const row = landingRow(state.board, move);
		if (row === null) throw new Error(`Column ${move} is not a legal move.`);

		const board = state.board.slice();
		board[row * FOUR_COLUMNS + move] = seat;

		const over = winningLine(board) !== null || board.every((cell) => cell !== null);
		return { board, turn: over ? null : seat === 0 ? 1 : 0 };
	},

	result(state): Result | null {
		if (state.turn !== null) return null;
		const line = winningLine(state.board);
		if (!line) return { kind: 'draw' };
		return { kind: 'win', winner: state.board[line[0]!] as Seat };
	}
};
