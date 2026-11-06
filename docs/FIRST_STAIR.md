# Archive Experiment 003: The First Stair

**Status:** The illustrated four-act journey is 2D and independently playable. A separate optional native-WebGL first-person 3D staircase annex is now prototyped; **neither experience supports WebXR yet**. This is an original surreal episode inside Elsewhere Engine, accessible from the Crossroads without changing existing episode canon or save data.

## Premise

A misfiled room in the Archive of Impossibilities obeys three local rules, each individually intuitive and mutually incompatible:

1. **Structure** (inspired by M. C. Escher's spatial paradoxes): an ascent returns to its own landing. Witness the loop, then shift perspective to find a sideways threshold.
2. **Dream** (inspired by Salvador Dalí's surrealism and experiments with symbolic time): a shadow needs a witness; a seed needs softened time. Observe and anchor the change.
3. **Perspective** (inspired by Pablo Picasso's Cubist investigation of multiple simultaneous viewpoints): a portrait has a front, profile and interior. None can replace the others.
4. **Synthesis:** bind structure, time and perspective, then preserve the room or open the frame.

This is **not** a reproduction of any existing painting, its specific composition or a claim about physical impossibility. The interactive illusions use original SVG and narrative mechanics. In-world phenomena are fiction, not scientific claims.

## Implementation contract

- Path: `impossible.html`; static HTML, CSS, SVG and native JavaScript modules.
- Pure state machine: `src/impossible-story.mjs`; browser controller: `src/impossible-app.mjs`.
- Independent save: `elsewhere-engine.first-stair.v1`, sanitized on load. Only its own reset button writes this key.
- Four complete playable stages with distinct actions, clear gating, two persistent endings and a local journal.
- Offline-first with no external library, service, account, telemetry or licensed art.
- Accessible semantic action buttons, keyboard focus, text-based clues, screen-reader status and reduced-motion styling.
- CI: `npm run check` and `npm test`. Also test manually on desktop, mobile and Quest browser before declaring this production-ready.

## Walkable 3D annex (experimental)

- Path: `stairwalk.html`; separate CSS, app controller and pure movement/portal engine.
- Real navigable WebGL geometry: corridor, twelve graduated steps, portal threshold and side passage. The paradox uses a deterministic camera-position transform at the far doorway: no violations of physical geometry.
- Controls: W/S, A/D, Q/E or arrow keys, pointer drag and visible press-or-tap buttons. No pointer lock, external libraries or network dependency.
- Portal is traversable before side door appears; after witnessing a loop, a side exit unlocks.
- Separate checkpoint `elsewhere-engine.stairwalk.v1`, independent of the four-act gallery and other games. Reload restores loop count and unlocked exit at starting landing; it does not save continuous camera coordinates.
- Testable pure motion, boundary and reset logic. The rendered WebGL output still needs manual acceptance on desktop/mobile/Quest Browser.
- WebGL-unavailable devices receive a link back to the illustrated game; the 3D view itself has no full nonvisual equivalent.

## Subsequent rungs

1. Improve room visuals and add accessible direction/perspective cues, sound optional.
2. Expand the experimental walkable stair annex into an interconnected 3D journey with a more seamless masked portal, perspective cues and independently tested collisions. The first annex currently uses a direct reposition at a threshold.
3. Add first-person and Quest 3 WebXR controls with hand-tracked fallback and safe locomotion.
4. Add comfort settings: snap turning, seated mode, stationary mode, teleportation and no forced camera movement.
5. Author a deeper narrative bridge to the Archive with an opt-in canon contract. No other repository's saves or secrets are read.

## Acceptance

One coherent route through each law, no soft locks, reload persistence, independent save resets, both outcomes, no dependency on a network, browser test on target devices and green CI.
