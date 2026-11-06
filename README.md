# Elsewhere Engine

> **The universe broke into stories. The stories forgot they were one.**

An original interconnected science-fantasy universe from **Φ369 Labs**, beginning with a dependency-free, browser-playable mystery: **An Unscheduled Arrival**.

In the Department of Everything, the paperwork says you do not exist. Investigate the reception hall, inspect the pneumatic-tube archive, follow a forbidden elevator, and decide what to do with a report that should never have reached you.

## Play

Open `index.html` in a modern browser or host these static files on GitHub Pages. No install, accounts, external assets, API calls, telemetry, or build step are needed. Keyboard, mouse, touch, and screen-reader controls are available. For maximum compatibility, serve the folder locally via `python -m http.server 8000` and visit `http://localhost:8000`.

- Select any labeled location in the scene, or press **1–5** to inspect the five interactable objects.
- Read the case report and collect **three evidence items** to unlock Elevator 13.
- Make one of two choices; the ending and journal persist locally in the same browser.
- Use **Journal** to review findings or **New Arrival** to reset this game's save only.
- Reduced-motion system preferences are respected. The interface needs no sound.

## Play: Larry, Tweedsie & Mavis — The Walbash Avenue Job

Open **[The Walbash Avenue Job](./trinity.html)** for a second, independent offline-playable story. Talk with the three contractors, investigate the dimensional wall at StarChucks (108 Walbash Avenue), follow the work-order sequence, and decide whether to seal the breach or preserve a monitored doorway. Your case file persists in **its own** browser save key; Episode 001 progress stays untouched. No external assets or network calls are required.

- Inspect the site (1), send Tweedsie to scout (2), let Larry brace the split (3), and ask Mavis to stabilize it at a real cost (4).
- Talk to Larry, Tweedsie or Mavis at any point for original character dialogue.
- Choose one of two distinct endings; use **New Work Order** to restart only this episode.
- See [The Unlicensed Trinity's character and story bible](docs/TRINITY.md). The possible TweedleVerse connection is a *proposal*, not an installed integration.

## Play: The First Stair — Archive Experiment 003

Open **[The First Stair](./impossible.html)** to explore an original four-room surreal gallery within the Archive of Impossibilities. Climb a looping staircase and change viewpoints, awaken a symbolic dream garden, reconcile three fractured portrait angles, then choose between two endings. This is a fully playable **2D browser episode**, not a 3D/VR build yet. Its journal and local save (`elsewhere-engine.first-stair.v1`) are independent of the other two games. No assets, calls or accounts are required. See [design and upgrade plan](docs/FIRST_STAIR.md).

## GitHub Pages publishing

The main game and the companion episode are static pages. **Passing the `Checks` workflow does not publish the site.** A separate `Publish Elsewhere Engine to GitHub Pages` workflow deploys the static files from `main` after the repository owner selects **Settings → Pages → Build and deployment → Source: GitHub Actions** (one-time setup).

After the publish workflow succeeds, the expected paths are:

- Main investigation: https://michaelwave369.github.io/ElsewhereEngine/
- The Walbash Avenue Job: https://michaelwave369.github.io/ElsewhereEngine/trinity.html
- The First Stair: https://michaelwave369.github.io/ElsewhereEngine/impossible.html

Treat these as **expected paths, not a live-site verification** until GitHub Pages shows a successful deployment and the URLs open. For 404s, check the Pages setting and the `Publish Elsewhere Engine` workflow, not merely green unit tests. The static artifact includes the root HTML, all stylesheets, and JavaScript modules, with no build dependencies or backend.

## Design boundaries

- **This is a first playable vertical slice**, not a production-ready engine or a completed twelve-realm campaign.
- The **Department of Everything**, the Crossroads, its artifacts, and the realm taxonomy are original fiction. Their deeper truths remain deliberately uncertain.
- **Connections to other Φ369 Labs projects are optional and versioned.** Race to Oblivion, its named locations, and its spoiler-sensitive late reveals remain owned by that game's canon. No imported saves, shared runtime state, or claimed implemented integration.
- Genre inspirations describe *experiences*, not licensed characters, places, dialog, costumes, sprites, or lore.
- Saves remain local to the browser under `elsewhere-engine.arrival.v1`; there is no cross-game synchronization.

## Repository

- `index.html`, `styles.css`, `src/app.mjs`: the browser experience.
- `src/engine.mjs`: pure, tested state and branching logic.
- `docs/CANON.md`: public, spoiler-safe worldbuilding rules.
- `docs/REALMS.md`: twelve provisional realms and their gameplay identities.
- `docs/ROADMAP.md`: staged plan and acceptance criteria.
- `docs/INTEGRATION_CONTRACT.md`: optional, non-breaking game links.
- `tests/engine.test.mjs`, `tests/trinity.test.mjs`: Node built-in test runner.
- `trinity.html`, `trinity.css`, `src/trinity-app.mjs`, `src/trinity-story.mjs`: independent playable maintenance episode.
- `docs/TRINITY.md`: crew, character constraints, magic consequences and crossover boundaries.
- `impossible.html`, `impossible.css`, `src/impossible-app.mjs`, `src/impossible-story.mjs`: original surreal gallery game.
- `docs/FIRST_STAIR.md`, `tests/impossible.test.mjs`: gallery design, roadmap and state tests.

Run automated checks with Node.js 20 or later:

```sh
npm test
npm run check
```

Everything is **MIT licensed**; see `LICENSE`.

*Φ369 Labs · People Above Profit · Ledger Above Ego.*
