/** Whether the device currently has a connection, kept up to date for the UI. */
let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => (online = true));
	window.addEventListener('offline', () => (online = false));
}

export const network = {
	get online() {
		return online;
	}
};
