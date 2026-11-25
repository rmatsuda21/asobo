# Asobo あそぼ

Two-player games to play together over a link. Pick a game, send the link, and play from anywhere.

Asobo is a mobile-first web app. It has Reversi and Four in a Row so far; more will follow.

## How it works

- **App:** a SvelteKit single-page app in English and Japanese. It installs to the home screen and opens offline: a service worker saves the app's code up front and each font piece the first time it is used. Pass-and-play works without a connection; online play needs one.
- **Server:** one Cloudflare Worker serves the app. Each online match runs in its own room (a Durable Object), which relays moves between the two players over WebSockets and checks every move against the rules.
- **Games:** every game is a set of pure functions (`setup`, `legalMoves`, `applyMove`, `result`), so the same code draws the board in the browser and referees on the server.

## Adding a game

1. **Rules:** add a file to `packages/games/src` that implements the `Game` contract, with tests, and list it in `games` in `packages/games/src/index.ts`. The room server can referee it straight away.
2. **Board:** add a board component to `apps/web/src/lib` that takes `TableProps`, and a small file in `apps/web/src/lib/games` describing the game to the app (its board, its sounds, and how to check a saved state).
3. **Listing:** add it to `apps/web/src/lib/games/registry.ts`, give it a picture in `GameThumb.svelte`, and add its name and blurb to `i18n.svelte.ts`.

The local and online screens, rooms, reconnecting, rematches and the home screen need no changes.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | The SvelteKit app |
| `apps/server` | The Cloudflare Worker |
| `packages/games` | Game rules shared by the app and the server |
| `brand` | Source files for the logo and app icon |

## Development

Requires Node 24 and pnpm (`corepack enable pnpm`).

```bash
pnpm install
pnpm dev        # app with hot reload at http://localhost:5173
pnpm preview    # the Worker at http://localhost:8787; run it alongside `pnpm dev` for online play
pnpm check      # type-check everything
pnpm test       # run the tests
```

To run the built app through the Worker, as it runs in production, build it first and open the Worker's address:

```bash
pnpm build
pnpm preview
```

## Deploying

The app deploys to Cloudflare Workers. Sign in once, then deploy:

```bash
pnpm --filter @asobo/server exec wrangler login
pnpm run deploy
```

Use `pnpm run deploy`, not `pnpm deploy`: the short form is a different, built-in pnpm command.
