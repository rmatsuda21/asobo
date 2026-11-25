/**
 * Sound effects, synthesized with Web Audio so there are no audio files to load.
 * Every sound is a short sine "boop" with a quick fade, which keeps them soft.
 */
const STORAGE_KEY = 'asobo:sound';

// A pentatonic scale: any run of these notes sounds pleasant together.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

function initialEnabled(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) !== 'off';
	} catch {
		return true;
	}
}

let enabled = $state(initialEnabled());
let context: AudioContext | null = null;
let master: GainNode | null = null;

/** Browsers only allow audio to start from a tap, so this is called from tap handlers. */
function audio(): { ctx: AudioContext; out: GainNode } | null {
	if (!enabled) return null;
	try {
		if (!context) {
			context = new AudioContext();
			master = context.createGain();
			master.gain.value = 0.6;
			master.connect(context.destination);
		}
		if (context.state === 'suspended') void context.resume();
		return { ctx: context, out: master! };
	} catch {
		return null;
	}
}

interface Boop {
	/** Starting pitch in hertz. */
	from: number;
	/** Pitch to slide to; leave out for a steady note. */
	to?: number;
	/** Seconds from now. */
	at?: number;
	length: number;
	volume: number;
}

function boop({ from, to, at = 0, length, volume }: Boop) {
	const a = audio();
	if (!a) return;
	const start = a.ctx.currentTime + at;
	const osc = a.ctx.createOscillator();
	const gain = a.ctx.createGain();
	osc.type = 'sine';
	osc.frequency.setValueAtTime(from, start);
	if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
	osc.connect(gain).connect(a.out);
	osc.start(start);
	osc.stop(start + length + 0.03);
}

export const sound = {
	get enabled() {
		return enabled;
	},
	toggle() {
		enabled = !enabled;
		try {
			localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
		} catch {
			// Not persisted; the choice still applies for this visit.
		}
		// A little confirmation when sound comes back on.
		if (enabled) boop({ from: 880, to: 1320, length: 0.12, volume: 0.25 });
	},
	/** Two mochi bump: a soft thud that is louder and higher the harder they hit. */
	bump(at = 0, force = 1) {
		const strength = Math.min(force, 6);
		boop({
			from: 420 + strength * 45,
			to: 240,
			at,
			length: 0.09,
			volume: Math.min(0.5, 0.14 + strength * 0.06)
		});
	},
	/** A mochi slides off the edge: a falling whistle. */
	fall(at = 0) {
		boop({ from: 760, to: 170, at, length: 0.34, volume: 0.3 });
	},
	/** A line is drawn: a short, light tick. */
	tick() {
		boop({ from: 940, to: 700, length: 0.07, volume: 0.3 });
	},
	/** Something good happened, like claiming a box: two quick rising notes. */
	chime(at = 0) {
		boop({ from: 783.99, at, length: 0.1, volume: 0.3 });
		boop({ from: 1046.5, at: at + 0.09, length: 0.16, volume: 0.3 });
	},
	/** A stone lands: a soft "pon" that drops in pitch. */
	place(at = 0) {
		boop({ from: 720, to: 300, at, length: 0.13, volume: 0.5 });
	},
	/** One rising note per ring of flipped stones, timed to each ring's hop. */
	flips(delays: number[]) {
		delays.forEach((ms, i) => {
			const note = SCALE[Math.min(i + 2, SCALE.length - 1)]!;
			boop({ from: note, to: note * 1.12, at: ms / 1000, length: 0.11, volume: 0.28 });
		});
	},
	/** A player has to pass: two notes stepping down. */
	pass(at = 0) {
		boop({ from: 587.33, at, length: 0.14, volume: 0.3 });
		boop({ from: 440, at: at + 0.15, length: 0.2, volume: 0.3 });
	},
	/** The game is over: a short rising arpeggio. */
	finish(at = 0) {
		[523.25, 659.25, 783.99, 1046.5].forEach((note, i) => {
			boop({ from: note, at: at + i * 0.11, length: i === 3 ? 0.4 : 0.14, volume: 0.32 });
		});
	}
};
