# VPS Name Tools

Shared codebase for free VPS Creator Tools that generate names. The first and only tool built so far is the
**Video Game Name Generator** (VPS Utility Network › Creator Tools).

- Spec: `docs/superpowers/specs/2026-10-08-video-game-name-generator-design.md`
- Plan: `docs/superpowers/plans/2026-10-08-video-game-name-generator.md`

## Structure
- `packages/core`: generic engine code (seeded random, text, steering, Avoid rules, safety, phonetics, selection)
- `packages/data`: shared content (concepts, lexicon, tones, phonetic profiles, cultural packs) and its validator
- `packages/game-titles`: the game-title generator (genres, styles, templates, generate, Similar)
- `packages/site-kit`: VPS Creator visual system, network shell, storage, shortlist, analytics client
- `apps/video-game-name-generator`: the Astro site deployed to Cloudflare Pages

## Commands
Node 22.16 (`.node-version`), npm.
- `npm ci` · `npm run typecheck` · `npm test`

## Status
| Area | State |
|---|---|
| Workspace and CI | Implemented, tested |
| Engine, content, UI, analytics, deployment | Planned |
