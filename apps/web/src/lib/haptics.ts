/** A tiny vibration when you place a piece. Android only; iPhones don't allow it from a web page. */
export function buzz() {
	try {
		navigator.vibrate?.(12);
	} catch {
		// Vibration is a nicety; ignore browsers that refuse it.
	}
}
