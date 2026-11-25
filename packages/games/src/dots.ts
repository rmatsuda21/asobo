import type { Game, Result, Seat } from './index';

/** The board is a square of dots; boxes are the spaces between them. */
export const DOTS_SIZE = 6;
export const DOTS_BOXES = DOTS_SIZE - 1;

/** Lines that run left to right come first, then lines that run top to bottom. */
const HORIZONTAL = DOTS_SIZE * DOTS_BOXES;
export const DOTS_LINES = HORIZONTAL * 2;

/**
 * A move is the number of the line to draw, 0 to 59.
 * Horizontal line (row r, column c) is r * 5 + c, for r 0-5 and c 0-4.
 * Vertical line (row r, column c) is 30 + r * 6 + c, for r 0-4 and c 0-5.
 */
export type DotsMove = number;

export interface DotsState {
	/** Whether each line has been drawn. */
	readonly lines: readonly boolean[];
	/** Who claimed each box, left to right and top to bottom. */
	readonly boxes: readonly (Seat | null)[];
	/** Whose turn it is, or null once every line is drawn. */
	readonly turn: Seat | null;
}

/** Where a line sits: its direction and the row and column of its top-left dot. */
export function linePosition(line: number): { horizontal: boolean; row: number; column: number } {
	if (line < HORIZONTAL) {
		return { horizontal: true, row: Math.floor(line / DOTS_BOXES), column: line % DOTS_BOXES };
	}
	const i = line - HORIZONTAL;
	return { horizontal: false, row: Math.floor(i / DOTS_SIZE), column: i % DOTS_SIZE };
}

/** The four lines around a box: top, bottom, left, right. */
export function boxSides(box: number): [number, number, number, number] {
	const row = Math.floor(box / DOTS_BOXES);
	const column = box % DOTS_BOXES;
	return [
		row * DOTS_BOXES + column,
		(row + 1) * DOTS_BOXES + column,
		HORIZONTAL + row * DOTS_SIZE + column,
		HORIZONTAL + row * DOTS_SIZE + column + 1
	];
}

/** The one or two boxes a line is a side of. */
function boxesBeside(line: number): number[] {
	const { horizontal, row, column } = linePosition(line);
	const boxes: number[] = [];
	if (horizontal) {
		if (row > 0) boxes.push((row - 1) * DOTS_BOXES + column);
		if (row < DOTS_BOXES) boxes.push(row * DOTS_BOXES + column);
	} else {
		if (column > 0) boxes.push(row * DOTS_BOXES + column - 1);
		if (column < DOTS_BOXES) boxes.push(row * DOTS_BOXES + column);
	}
	return boxes;
}

/** Boxes claimed by seat 0 and seat 1. */
export function boxCount(boxes: readonly (Seat | null)[]): [number, number] {
	let a = 0;
	let b = 0;
	for (const owner of boxes) {
		if (owner === 0) a++;
		else if (owner === 1) b++;
	}
	return [a, b];
}

export const dots: Game<DotsState, DotsMove> = {
	id: 'dots',

	setup() {
		return {
			lines: Array(DOTS_LINES).fill(false),
			boxes: Array(DOTS_BOXES * DOTS_BOXES).fill(null),
			turn: 0
		};
	},

	turn(state) {
		return state.turn;
	},

	legalMoves(state, seat) {
		if (state.turn !== seat) return [];
		const moves: DotsMove[] = [];
		state.lines.forEach((drawn, line) => {
			if (!drawn) moves.push(line);
		});
		return moves;
	},

	applyMove(state, seat, move) {
		if (state.turn !== seat) throw new Error('It is not this player’s turn.');
		if (!Number.isInteger(move) || move < 0 || move >= DOTS_LINES || state.lines[move]) {
			throw new Error(`Line ${move} is not a legal move.`);
		}

		const lines = state.lines.slice();
		lines[move] = true;

		const boxes = state.boxes.slice();
		let claimed = false;
		for (const box of boxesBeside(move)) {
			if (boxSides(box).every((side) => lines[side])) {
				boxes[box] = seat;
				claimed = true;
			}
		}

		// Closing a box earns another turn. The game ends when no lines are left.
		const over = lines.every(Boolean);
		return { lines, boxes, turn: over ? null : claimed ? seat : seat === 0 ? 1 : 0 };
	},

	result(state): Result | null {
		if (state.turn !== null) return null;
		const [a, b] = boxCount(state.boxes);
		if (a === b) return { kind: 'draw' };
		return { kind: 'win', winner: a > b ? 0 : 1 };
	}
};
