export type Locale = 'en' | 'ja';

const STORAGE_KEY = 'asobo:locale';

const messages = {
	en: {
		tagline: 'Two players. One link.',
		intro: 'Pick a game, send the link, and play together from anywhere.',
		games: 'Games',
		comingSoon: 'Coming soon',
		moreOnTheWay: 'More games are on the way.',
		switchLanguage: '日本語',
		switchLanguageLabel: '日本語に切り替える',
		reversi: 'Reversi',
		reversiBlurb: 'Trap their stones between yours and flip the board.'
	},
	ja: {
		tagline: 'ふたりで、あそぼ。',
		intro: 'ゲームをえらんで、リンクを送るだけ。どこからでも一緒に遊べます。',
		games: 'ゲーム',
		comingSoon: 'もうすぐ',
		moreOnTheWay: 'ゲームはこれから増えていきます。',
		switchLanguage: 'English',
		switchLanguageLabel: 'Switch to English',
		reversi: 'リバーシ',
		reversiBlurb: '相手の石をはさんで、ひっくり返そう。'
	}
} satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof (typeof messages)['en'];

function initialLocale(): Locale {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'en' || saved === 'ja') return saved;
	} catch {
		// Storage can be unavailable (private mode); fall through to the browser language.
	}
	return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

let locale = $state<Locale>(initialLocale());

export const i18n = {
	get locale() {
		return locale;
	},
	set locale(next: Locale) {
		locale = next;
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// Not persisted; the choice still applies for this visit.
		}
	},
	get t() {
		return messages[locale];
	},
	toggle() {
		this.locale = locale === 'en' ? 'ja' : 'en';
	}
};
