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
		reversiBlurb: 'Trap their stones between yours and flip the board.',
		play: 'Play',
		allGames: 'All games',
		cocoa: 'Cocoa',
		cream: 'Cream',
		turnOf: '{name}’s turn',
		passed: '{name} has no moves, so {other} goes again.',
		wins: '{name} wins!',
		draw: 'It’s a draw!',
		passAndPlay: 'Pass the phone to take turns.',
		newGame: 'New game',
		confirmNewGame: 'Tap again to restart',
		playAgain: 'Play again',
		empty: 'empty',
		canPlayHere: 'you can play here',
		board: 'Game board',
		four: 'Four in a Row',
		fourBlurb: 'Drop your pieces and be first to line up four.',
		column: 'Column {n}',
		dots: 'Dots and Boxes',
		dotsBlurb: 'Draw lines. Close a box to claim it and go again.',
		line: 'Line {n}',
		flick: 'Mochi Flick',
		flickBlurb: 'Flick your mochi to knock theirs off the tray.',
		flickHint: 'Pull back on one of your mochi and let go.',
		takesRound: 'takes the round!',
		roundDraw: 'Nobody takes the round.',
		goesAgain: '{name} claimed a box and goes again!',
		youGoAgain: 'You claimed a box. Go again!',
		friendGoesAgain: 'Your friend claimed a box and goes again.',
		noSuchGame: 'That game doesn’t exist.',
		soundEffects: 'Sound effects',
		playOnline: 'Play online with a friend',
		onlineGame: 'Online game',
		inviteTitle: 'Send this link to a friend',
		inviteBody: 'The game starts when they open it.',
		shareLink: 'Share link',
		copyLink: 'Copy link',
		copied: 'Copied!',
		youAre: 'You are {name}',
		you: 'You',
		friend: 'Friend',
		yourTurn: 'Your turn',
		friendsTurn: 'Your friend’s turn',
		youPassed: 'You have no moves, so your friend goes again.',
		friendPassed: 'Your friend has no moves, so you go again.',
		youWin: 'You win!',
		youLose: 'Your friend wins!',
		friendAway: 'Your friend is away. Waiting for them to come back…',
		connecting: 'Connecting…',
		reconnecting: 'Can’t reach the game. Trying again…',
		watching: 'This game already has two players, so you are watching.',
		rematch: 'Rematch',
		offline: 'You’re offline. Online games need a connection.',
		outdated: 'This game needs the newest version of Asobo.',
		updateReady: 'A new version is ready.',
		reload: 'Reload'
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
		reversiBlurb: '相手の石をはさんで、ひっくり返そう。',
		play: 'あそぶ',
		allGames: 'ゲーム一覧',
		cocoa: 'ココア',
		cream: 'クリーム',
		turnOf: '{name}の番',
		passed: '{name}は置ける場所がないので、もう一度{other}の番。',
		wins: '{name}の勝ち！',
		draw: '引き分け！',
		passAndPlay: 'スマホを交代で持って遊ぼう。',
		newGame: 'はじめから',
		confirmNewGame: 'もう一度タップでリセット',
		playAgain: 'もう一回',
		empty: '空き',
		canPlayHere: 'ここに置けます',
		board: 'ゲーム盤',
		four: '四目ならべ',
		fourBlurb: '石を落として、先に4つ並べよう。',
		column: '{n}列目',
		dots: 'ドット＆ボックス',
		dotsBlurb: '線を引いて、ボックスを閉じたらゲット。もう一度引けます。',
		line: '線{n}',
		flick: 'もちはじき',
		flickBlurb: 'もちをはじいて、相手のもちをお皿から落とそう。',
		flickHint: '自分のもちを引っぱって、はなそう。',
		takesRound: 'がラウンドをゲット！',
		roundDraw: 'このラウンドは引き分け。',
		goesAgain: '{name}がボックスをゲット！もう一度。',
		youGoAgain: 'ボックスをゲット！もう一度あなたの番。',
		friendGoesAgain: '友だちがボックスをゲット。もう一度友だちの番。',
		noSuchGame: 'そのゲームは見つかりません。',
		soundEffects: '効果音',
		playOnline: '友だちとオンラインで遊ぶ',
		onlineGame: 'オンライン対戦',
		inviteTitle: 'このリンクを友だちに送ろう',
		inviteBody: '友だちが開いたらスタート。',
		shareLink: 'リンクを共有',
		copyLink: 'リンクをコピー',
		copied: 'コピーしました！',
		youAre: 'あなたは{name}',
		you: 'あなた',
		friend: '友だち',
		yourTurn: 'あなたの番',
		friendsTurn: '友だちの番',
		youPassed: '置ける場所がないので、もう一度友だちの番。',
		friendPassed: '友だちは置ける場所がないので、もう一度あなたの番。',
		youWin: 'あなたの勝ち！',
		youLose: '友だちの勝ち！',
		friendAway: '友だちが離れています。戻ってくるのを待っています…',
		connecting: '接続中…',
		reconnecting: '接続できません。再接続中…',
		watching: 'この対戦はすでに2人います。観戦中です。',
		rematch: 'もう一回',
		offline: 'オフラインです。オンライン対戦には接続が必要です。',
		outdated: 'この対戦には最新版のAsoboが必要です。',
		updateReady: '新しいバージョンがあります。',
		reload: '更新する'
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

/** Fills {placeholders} in a message. */
export function fill(message: string, values: Record<string, string>): string {
	return message.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}
