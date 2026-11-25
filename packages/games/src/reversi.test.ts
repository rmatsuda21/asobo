import { describe, expect, it } from 'vitest';
import { count, flips, reversi, type ReversiCell, type ReversiState } from './reversi';
import type { Seat } from './index';

/** Builds a board from eight strings: x = seat 0, o = seat 1, . = empty. */
function board(rows: string[]): ReversiCell[] {
	return [...rows.join('')].map((c) => (c === 'x' ? 0 : c === 'o' ? 1 : null));
}

/** Counts every sequence of moves of the given length, the standard rules check. */
function perft(state: ReversiState, depth: number): number {
	if (depth === 0 || state.turn === null) return 1;
	const seat = state.turn;
	return reversi
		.legalMoves(state, seat)
		.reduce((n, move) => n + perft(reversi.applyMove(state, seat, move), depth - 1), 0);
}

describe('reversi', () => {
	it('starts with four stones and seat 0 to move', () => {
		const state = reversi.setup();
		expect(count(state.board)).toEqual([2, 2]);
		expect(state.turn).toBe(0);
		expect(reversi.result(state)).toBeNull();
	});

	it('offers the four standard opening moves', () => {
		const state = reversi.setup();
		expect(reversi.legalMoves(state, 0)).toEqual([19, 26, 37, 44]);
		expect(reversi.legalMoves(state, 1)).toEqual([]);
	});

	it('flips the stones a move traps and hands over the turn', () => {
		const next = reversi.applyMove(reversi.setup(), 0, 19);
		expect(next.board[19]).toBe(0);
		expect(next.board[27]).toBe(0);
		expect(count(next.board)).toEqual([4, 1]);
		expect(next.turn).toBe(1);
	});

	it('does not change the state it was given', () => {
		const state = reversi.setup();
		reversi.applyMove(state, 0, 19);
		expect(count(state.board)).toEqual([2, 2]);
	});

	it('rejects illegal moves and moves out of turn', () => {
		const state = reversi.setup();
		expect(() => reversi.applyMove(state, 0, 0)).toThrow();
		expect(() => reversi.applyMove(state, 0, 27)).toThrow();
		expect(() => reversi.applyMove(state, 0, 64)).toThrow();
		expect(() => reversi.applyMove(state, 1, 20)).toThrow();
	});

	it('flips in several directions at once and never past a gap or the edge', () => {
		const b = board([
			'x.x.....',
			'.oo.....',
			'xo.ox...',
			'.oo.....',
			'x.o.....',
			'..x.....',
			'........',
			'........'
		]);
		// Playing the centre (18) closes lines up-left, up, left, right, down-left and down.
		expect(flips(b, 0, 18).sort((p, q) => p - q)).toEqual([9, 10, 17, 19, 25, 26, 34]);
		// A line that runs off the board without one of your own stones flips nothing.
		expect(flips(board(['.oo.....', ...Array(7).fill('........')]), 0, 3)).toEqual([]);
	});

	it('matches the known move counts for the first six turns', () => {
		const start = reversi.setup();
		expect([1, 2, 3, 4, 5, 6].map((d) => perft(start, d))).toEqual([4, 12, 56, 244, 1396, 8200]);
	});

	it('keeps the turn with a player whose opponent is stuck', () => {
		const b = board([
			'.ox.....',
			'........',
			'........',
			'........',
			'........',
			'........',
			'........',
			'xo......'
		]);
		// x takes the top-left corner. o's last stone cannot trap anything, so o passes
		// and the turn stays with x, who can still play square 58.
		const next = reversi.applyMove({ board: b, turn: 0 }, 0, 0);
		expect(next.turn).toBe(0);
		expect(reversi.legalMoves(next, 1)).toEqual([]);
		expect(reversi.legalMoves(next, 0)).toEqual([58]);
	});

	it('ends when neither player can move and reports the winner', () => {
		const b = board(['.ox.....', ...Array(7).fill('........')]);
		const done = reversi.applyMove({ board: b, turn: 0 }, 0, 0);
		expect(done.turn).toBeNull();
		expect(reversi.result(done)).toEqual({ kind: 'win', winner: 0 });
	});

	it('reports a draw on equal counts', () => {
		const b: ReversiCell[] = Array(64)
			.fill(null)
			.map((_, i) => (i < 32 ? 0 : 1) as Seat);
		expect(reversi.result({ board: b, turn: null })).toEqual({ kind: 'draw' });
	});

	it('can always be played to the end by taking the first legal move', () => {
		let state = reversi.setup();
		let moves = 0;
		while (state.turn !== null) {
			const seat = state.turn;
			state = reversi.applyMove(state, seat, reversi.legalMoves(state, seat)[0]!);
			moves++;
		}
		const [a, b] = count(state.board);
		expect(moves).toBeLessThanOrEqual(60);
		expect(a + b).toBe(4 + moves);
		expect(reversi.result(state)).not.toBeNull();
	});
});
