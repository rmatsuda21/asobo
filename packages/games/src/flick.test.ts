import { describe, expect, it } from 'vitest';
import { FLICK, flick, simulate, type FlickPiece, type FlickState } from './flick';
import type { Seat } from './index';

const piece = (id: number, seat: Seat, x: number, y: number, out = false): FlickPiece => ({
	id,
	seat,
	x,
	y,
	out
});

const stateWith = (pieces: FlickPiece[], turn: Seat = 0, wins: [number, number] = [0, 0]) =>
	({ pieces, turn, wins, round: 0 }) satisfies FlickState;

describe('mochi flick', () => {
	it('starts with four mochi each, mirrored, all on the tray and not touching', () => {
		const state = flick.setup();
		expect(state.pieces).toHaveLength(8);
		expect(state.pieces.filter((p) => p.seat === 0)).toHaveLength(4);
		for (const p of state.pieces) {
			expect(p.out).toBe(false);
			expect(Math.hypot(p.x, p.y)).toBeLessThan(FLICK.tray - FLICK.radius);
			const twin = state.pieces.find((q) => q.seat !== p.seat && q.x === -p.x && q.y === -p.y);
			expect(twin).toBeDefined();
		}
		for (const a of state.pieces) {
			for (const b of state.pieces) {
				if (a.id < b.id) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(FLICK.radius * 2);
			}
		}
		expect(state.turn).toBe(0);
	});

	it('lists one flickable entry per mochi of the player to move', () => {
		const state = flick.setup();
		expect(flick.legalMoves(state, 0).map((m) => m.piece)).toEqual([0, 1, 2, 3]);
		expect(flick.legalMoves(state, 1)).toEqual([]);
	});

	it('slides a flicked mochi in a straight line until friction stops it', () => {
		const { frames, pieces, events } = simulate([piece(0, 0, 0, 0)], { piece: 0, dx: 2, dy: 0 });
		expect(events).toEqual([]);
		expect(pieces[0]!.y).toBe(0);
		// With friction f, a speed v travels about v / (1 - f) in total.
		expect(pieces[0]!.x).toBeGreaterThan(55);
		expect(pieces[0]!.x).toBeLessThan(2 / (1 - FLICK.friction) + 1);
		expect(frames.length).toBeGreaterThan(30);
		expect(frames.length).toBeLessThanOrEqual(FLICK.maxSteps + 1);
	});

	it('gives exactly the same result every time', () => {
		const state = flick.setup();
		const move = { piece: 1, dx: -1.2345678, dy: -5.4321 };
		const a = simulate(state.pieces, move);
		const b = simulate(JSON.parse(JSON.stringify(state.pieces)), JSON.parse(JSON.stringify(move)));
		expect(b).toEqual(a);
		expect(flick.applyMove(state, 0, move)).toEqual(flick.applyMove(state, 0, move));
	});

	it('passes speed on in a head-on collision', () => {
		const { pieces, events } = simulate([piece(0, 0, -40, 0), piece(1, 1, 0, 0)], {
			piece: 0,
			dx: 4,
			dy: 0
		});
		expect(events[0]).toMatchObject({ kind: 'hit', a: 0, b: 1 });
		// The target is knocked forward and ends up well ahead of the shooter.
		expect(pieces[1]!.x).toBeGreaterThan(30);
		expect(pieces[0]!.x).toBeLessThan(pieces[1]!.x - FLICK.radius * 2 + 0.01);
		expect(pieces[1]!.y).toBe(0);
	});

	it('never leaves two mochi overlapping', () => {
		let state = flick.setup();
		const flicks = [
			{ piece: 0, dx: 1, dy: -6 },
			{ piece: 4, dx: -1, dy: 6 },
			{ piece: 1, dx: -2, dy: -5 },
			{ piece: 5, dx: 2, dy: 5 }
		];
		for (const move of flicks) {
			if (state.turn === null) break;
			const mine = flick.legalMoves(state, state.turn).map((m) => m.piece);
			if (!mine.includes(move.piece)) continue;
			state = flick.applyMove(state, state.turn, move);
			const on = state.pieces.filter((p) => !p.out);
			for (const a of on) {
				for (const b of on) {
					if (a.id < b.id) {
						expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(FLICK.radius * 2 - 0.01);
					}
				}
			}
		}
	});

	it('tips a mochi off when its centre crosses the edge', () => {
		const { pieces, events } = simulate([piece(0, 0, 80, 0)], { piece: 0, dx: 6, dy: 0 });
		expect(pieces[0]!.out).toBe(true);
		expect(events).toEqual([{ step: expect.any(Number), kind: 'fall', piece: 0 }]);
	});

	it('caps a flick at the maximum speed and ignores one that is too soft', () => {
		const hard = simulate([piece(0, 0, -90, 0)], { piece: 0, dx: 500, dy: 0 });
		const max = simulate([piece(0, 0, -90, 0)], { piece: 0, dx: FLICK.maxSpeed, dy: 0 });
		expect(hard.pieces).toEqual(max.pieces);
		expect(() => flick.applyMove(flick.setup(), 0, { piece: 0, dx: 0.1, dy: 0 })).toThrow();
	});

	it('rejects flicking the wrong mochi, out of turn, or with bad input', () => {
		const state = flick.setup();
		const good = { dx: 0, dy: -3 };
		expect(() => flick.applyMove(state, 0, { piece: 4, ...good })).toThrow();
		expect(() => flick.applyMove(state, 0, { piece: 99, ...good })).toThrow();
		expect(() => flick.applyMove(state, 1, { piece: 4, ...good })).toThrow();
		expect(() => flick.applyMove(state, 0, { piece: 0, dx: NaN, dy: 1 })).toThrow();
		expect(() => flick.applyMove(state, 0, { piece: 0, dx: Infinity, dy: 1 })).toThrow();
		expect(() => flick.applyMove(state, 0, { piece: 0, dx: '3' as unknown as number, dy: 1 })).toThrow();
		expect(() => flick.applyMove(state, 0, null as unknown as { piece: 0; dx: 1; dy: 1 })).toThrow();
		const gone = stateWith([piece(0, 0, 0, 0, true), piece(1, 0, 20, 0), piece(2, 1, 0, 50)]);
		expect(() => flick.applyMove(gone, 0, { piece: 0, ...good })).toThrow();
	});

	it('hands over the turn while both players still have mochi', () => {
		const next = flick.applyMove(flick.setup(), 0, { piece: 0, dx: 0, dy: -1 });
		expect(next.turn).toBe(1);
		expect(next.round).toBe(0);
		expect(next.wins).toEqual([0, 0]);
	});

	it('awards the round and resets the tray when one player has none left', () => {
		// Seat 1's last mochi sits near the edge, right in front of seat 0's.
		const state = stateWith([piece(0, 0, 40, 0), piece(1, 1, 80, 0)]);
		const next = flick.applyMove(state, 0, { piece: 0, dx: 6, dy: 0 });
		expect(next.wins).toEqual([1, 0]);
		expect(next.round).toBe(1);
		expect(next.pieces).toEqual(flick.setup().pieces);
		// The player who did not just flick starts the new round.
		expect(next.turn).toBe(1);
		expect(flick.result(next)).toBeNull();
	});

	it('gives the round to the other player if you flick your own last mochi off', () => {
		const state = stateWith([piece(0, 0, 80, 0), piece(1, 1, -50, 0)]);
		const next = flick.applyMove(state, 0, { piece: 0, dx: 6, dy: 0 });
		expect(next.wins).toEqual([0, 1]);
	});

	it('gives nobody the round if both players run out on the same flick', () => {
		// A glancing hit near the edge can send both mochi over. Try a range of
		// offsets and use the first one where that happens.
		let both: FlickState | null = null;
		for (let offset = -20; offset <= 20 && !both; offset++) {
			const state = stateWith([piece(0, 0, 66, offset), piece(1, 1, 90, 0)]);
			const { pieces } = simulate(state.pieces, { piece: 0, dx: 6.5, dy: 0 });
			if (pieces.every((p) => p.out)) both = state;
		}
		expect(both).not.toBeNull();
		const next = flick.applyMove(both!, 0, { piece: 0, dx: 6.5, dy: 0 });
		expect(next.pieces.every((p) => !p.out)).toBe(true);
		expect(next.wins).toEqual([0, 0]);
		expect(next.round).toBe(1);
	});

	it('ends the match at two rounds and leaves the tray as it finished', () => {
		const state = stateWith([piece(0, 0, 40, 0), piece(1, 1, 80, 0)], 0, [1, 1]);
		const done = flick.applyMove(state, 0, { piece: 0, dx: 6, dy: 0 });
		expect(done.turn).toBeNull();
		expect(done.wins).toEqual([2, 1]);
		expect(done.pieces.find((p) => p.id === 1)!.out).toBe(true);
		expect(flick.result(done)).toEqual({ kind: 'win', winner: 0 });
		expect(flick.legalMoves(done, 0)).toEqual([]);
	});
});
