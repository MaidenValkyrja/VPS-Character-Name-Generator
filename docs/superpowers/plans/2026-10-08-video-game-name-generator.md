# Video Game Name Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the VPS Video Game Name Generator: one fast, private, browser-only Cloudflare Pages utility that generates varied game titles steered by genre, mythology/culture, tone, naming style and the user's own themes, with Generate Similar, a local shortlist and VPS Creator Tools branding.

**Architecture:** An npm-workspaces "VPS Name Tools" codebase. Pure TypeScript engine packages (`core`, `data`, `game-titles`) generate titles procedurally in the browser from tagged word banks, 35 title templates, concept steering and phonetic profiles. A `site-kit` package holds the VPS Creator visual system, network shell, storage and analytics client. One Astro static app renders the single generator page; one tiny Pages Function counts allowlisted analytics events.

**Tech Stack:** Node 22.16.0, npm workspaces, TypeScript 5.9 (strict), Astro ^7.3.5 (static), `tsx --test` (Node test runner), fast-check, zod (scripts only), puppeteer-core + @axe-core/puppeteer, Cloudflare Pages + Wrangler 4, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-08-video-game-name-generator-design.md` (Revision 2). Read it before starting any task; this plan argues from it.

## Global Constraints

Every task implicitly includes these. Values are copied from the spec.

- Runtime: Node `22.16.0` (`.node-version`); npm workspaces; TypeScript strict; Astro static output with `trailingSlash: 'always'`; no server adapter.
- Generation runs entirely in the browser. No AI or network calls at runtime. Engine modules are pure functions and never touch the DOM.
- No accounts, no cookies. User text reaches the DOM only through `textContent`, never `innerHTML`.
- Defaults: genre `fantasy`, myth `none`, tone `auto`, tone2 `none`, style `auto`, length `any`, creativity `balanced`, count `10`.
- Input caps: themes 500 chars, include 40, avoid 500; at most 20 theme phrases and 50 avoid rules.
- Catalogues: 31 genres, None + 30 cultural styles, 19 tones, 13 naming styles (+ Auto), 35 templates, 16 phonetic profiles. A cultural pack may be held back only individually, and the release report must name it and the reason.
- Batch rules: any template family ≤ 30% of a batch (minimum 1); adjective + noun ≤ 20% (minimum 1); a lexicon word at most twice per batch; a head word once; each classic frame at most once and all classic frames ≤ 20% (minimum 1); one theme phrase ≤ 30% of titles unless it is the only phrase; at most 2 symbolic cultural terms per batch.
- Creativity: temperature 0.7 / 1.0 / 1.5; literal theme use 0.6 / 0.4 / 0.25; wildcard 0 / 0.06 / 0.18; invented-word cap 0.10 / 0.20 / 0.35 (Focused / Balanced / Wild).
- Safety is contextual: never ban bare numbers ("Station 88", "Sector 14" are allowed); block `1488`, `14/88` forms, 14 and 88 in one title, and the extremist phrase list, on engine output only.
- Check links: Google, Steam, itch.io only. Domain lookup is Phase 2.
- Disclaimer, verbatim: "Generated names are brainstorming suggestions. Check trademarks, existing game titles, domains, and storefronts before commercial use. This tool does not check availability and cannot tell you a name is free to use."
- Never write "available", "trademark safe" or "AI-powered" in UI copy.
- Tier B cultural styles are labelled "-inspired". Mythology never inserts deity or sacred names.
- Output text is ASCII (diacritics folded).
- Ads: `ads.enabled = false`. Rails only at ≥ 1280 px (160 px) and ≥ 1600 px (300 px); one below-content slot after the shortlist; never between controls and results, inside results or Similar groups, inside the shortlist, or as pop-ups. No rails on mobile. No ad code.
- Analytics: enums only (`genre`, `myth`, `device`, `link`); never themes, Include, Avoid, titles or shortlist contents. Events stay off (`analytics.events = false`) until the Analytics Engine binding is verified.
- Storage keys: `vps-name-tools.video-game-names.v1.shortlist` (max 500 items) and `vps-name-tools.video-game-names.v1.settings`.
- No service-business platform links, names or upgrade copy anywhere in this codebase.
- Budgets: generator JS + data ≤ 120 KB gzipped; 20 titles < 30 ms at 4× CPU throttle; Lighthouse mobile performance ≥ 95, accessibility 100, SEO 100 before launch.
- The repository is public: never commit secrets. Deploy credentials live in GitHub Actions secrets.
- Commit messages end with the attribution trailer lines supplied by the session harness, and nothing else names a model: no model names in code, docs, commit subjects or commit bodies.
- Branch: work on the designated feature branch. `main` is created by the user (see "Actions only you can take").

---

## Plan at a Glance

| Milestone | Tasks | What it delivers | Your headings |
|---|---|---|---|
| M0 Foundation | 1 | Workspace, tooling, CI, README, validation log | Launch (repo) |
| M1 Engine core | 2–8 | Seeded random, text utilities, Avoid rules, contextual safety, theme steering, phonetic engine, diverse selection | Generator engine |
| M2 Data framework | 9 | Shared content types, builders, steering index, data validator | Generator engine (data packs) |
| M3 Game-title engine | 10–18 | Settings, 35 templates, vocabulary, styles, genre framework, context, fill/render, constraints/scoring, `generate()`, notes, `generateSimilar()`, property tests, quality harness | Generator engine (procedural architecture, title structures, Similar engine) |
| M4 Content | 19–25 | Concepts and aliases, 19 tones, 16 phonetic profiles, core lexicon, 31 genres, None + 30 cultural packs, known titles, release validation, quality tuning, golden snapshots | Generator engine (data packs, theme steering, phonetic generation); QA (cultural-pack checks) |
| M5 Visual system + network shell | 26–30 | VPS site capture, network config, storage and shortlist store, VPS Creator tokens/CSS, layout shell (header, footer, rails, slot, other tools) | VPS visual system; VPS Utility Network integration |
| M6 Generator UI | 31–38 | Astro app, form, results, Similar, Check links, shortlist, content and privacy, SEO meta, responsive pass | UI |
| M7 Analytics | 39 | Event schema, beacon client, Pages Function, CSP | VPS Utility Network integration |
| M8 QA | 40–43 | Browser e2e + axe + ad-layout rules, combination/collision/cultural sweeps, performance budgets, human and cultural review records | QA |
| M9 Launch | 44–45 | Deploy workflow, Cloudflare Pages project, release gate, indexing switch | Launch |

**Dependencies.** M1 → M2 → M3 → M4. M5 can start after M1. M6 needs M3 (engine API) and M5. Real-content quality work (Task 25) needs M4. Task 26 (VPS site capture) is blocked until valkyrjapublishingstudios.com is reachable from the build environment; until then Task 29 ships provisional token values and Task 26 swaps them later.

### Actions only you can take

| When | Action |
|---|---|
| Before Task 26 | Allow `valkyrjapublishingstudios.com` in this environment's network settings (Network access → Allowed domains), or provide screenshots plus the site's colours and fonts. Approve the token sheet Task 26 produces. |
| Any time | Rename the repository to `VPS-Name-Tools` (GitHub → Settings → General); decide whether it stays public/personal or moves to the Valkyrja-Publishing-Studios organisation. Create `main` from the approved branch and make it the default branch. |
| Before Task 44 | In Cloudflare: create the Pages project `vps-video-game-name-generator` (or let the workflow create it), add GitHub secrets `CLOUDFLARE_API_TOKEN` (Account › Cloudflare Pages › Edit) and `CLOUDFLARE_ACCOUNT_ID`, switch on Web Analytics for the project, and tell me whether Workers Analytics Engine is available on your plan. |
| Before Task 45 | Choose the domain; rate the human-review sheet (Task 43); confirm cultural pack status; approve launch. After launch: add the site to Search Console. |
| Optional | Arrange external readers for Tier B cultural packs. |

---

## File Structure

```
.
├── .github/workflows/validate.yml            CI on every branch and PR (Task 1, extended through Task 42)
├── .github/workflows/deploy.yml              Production deploy on main (Task 44)
├── .node-version                             22.16.0
├── package.json                              Workspaces root, scripts
├── tsconfig.json                             Strict TS for packages, scripts and app scripts
├── README.md                                 Purpose, structure, commands, status table, deploy/rollback
├── THIRD_PARTY_NOTICES.md                    Fonts, word-list sources and licences
├── docs/
│   ├── VALIDATION.md                         Checks actually performed (dates, results)
│   ├── QA-CHECKLIST.md                       Manual screen-reader, browser and content checks (Task 43)
│   ├── brand/VPS-CREATOR-VISUAL-SYSTEM.md    Token sheet from the VPS site capture (Task 26)
│   ├── brand/capture/styles.json             Extracted computed styles (Task 26; screenshots git-ignored)
│   └── content/CULTURAL-PACK-STATUS.md       Generated pack status (Task 24)
│       content/COLLISION-REVIEW.md           Near-collision sample for review (Task 41)
│       content/review/human-review-*.csv     Rating sheets (Task 43)
├── scripts/
│   ├── validate-data.ts                      Data + game-data validation (Tasks 9, 12)
│   ├── build-safety.ts                       Generates the invented-word profanity list (Task 9)
│   ├── quality.ts                            Quality metrics on real data (Tasks 18, 25)
│   ├── sample-profiles.ts                    Prints sample invented words per profile (Task 20)
│   ├── pack-status.ts                        Writes CULTURAL-PACK-STATUS.md (Task 24)
│   ├── golden-update.ts                      Rewrites golden snapshots on purpose (Task 25)
│   ├── capture-vps-site.mjs                  VPS site screenshots + computed styles (Task 26)
│   ├── og-image.mjs                          Renders the Open Graph image from the tokens (Task 37)
│   ├── sweep.ts                              Combination + cultural sweeps (Task 41)
│   ├── collisions.ts                         100k-title collision sweep (Task 41)
│   ├── check-budget.mjs                      Gzipped JS budget (Task 42)
│   ├── lighthouse.mjs                        Lighthouse thresholds (Task 42)
│   └── review-sheet.ts                       Human-review CSV and scorer (Task 43)
├── packages/
│   ├── core/            @vps-name-tools/core (generic engine code)
│   │   ├── src/rng.ts, weighted.ts, text.ts, lemma.ts, avoid.ts, safety.ts,
│   │   │   steering.ts, phonetics.ts, select.ts, index.ts
│   │   └── test/*.test.ts
│   ├── data/            @vps-name-tools/data (shared content)
│   │   ├── src/ids.ts, types.ts, build.ts, concepts.ts, aliases.ts, aliases/*.ts,
│   │   │   lexicon/*.ts, tones.ts, profiles/*.ts, myths/*.ts (+ helpers.ts), coded-imagery.ts,
│   │   │   safety.ts, safety-generated.ts, steering-index.ts, validate.ts, index.ts
│   │   │   (core.ts and myths/loaders.ts only if Task 42 needs lazy packs)
│   │   └── test/*.test.ts, test/fixtures/mini-bundle.ts
│   ├── game-titles/     @vps-name-tools/game-titles (this tool's domain)
│   │   ├── src/ids.ts, settings.ts, types.ts, pattern.ts, templates.ts, vocab.ts,
│   │   │   styles.ts, genres/*.ts (+ helpers.ts), guards.ts, known-titles.ts,
│   │   │   known-titles-data.ts, game.ts, validate-game.ts, context.ts, fill.ts, render.ts,
│   │   │   constraints.ts, score.ts, notes.ts, generate.ts, similar.ts, quality.ts, index.ts
│   │   └── test/*.test.ts, test/fixtures/mini-game.ts, test/golden/*
│   └── site-kit/        @vps-name-tools/site-kit (VPS Creator visual system + shell)
│       ├── src/network.ts, storage.ts, shortlist.ts, analytics.ts, contrast.ts, index.ts
│       ├── src/styles/tokens.css, base.css, components.css, layout.css
│       ├── src/components/CreatorLayout.astro, NetworkHeader.astro, CreatorFooter.astro,
│       │   VpsMark.astro, AdRail.astro, AdSlot.astro, OtherTools.astro
│       └── test/*.test.ts, test/fixture/ (tiny Astro site for shell tests)
└── apps/video-game-name-generator/
    ├── package.json, astro.config.mjs, tsconfig.json, wrangler.toml
    ├── public/_headers, favicon.svg, og.png
    ├── functions/api/e.ts                     Analytics event endpoint (Task 39)
    ├── src/pages/index.astro, 404.astro, robots.txt.ts, sitemap.xml.ts
    ├── src/components/GeneratorForm.astro, ResultsPanel.astro, ShortlistPanel.astro,
    │   InfoSections.astro, ResultTemplates.astro
    ├── src/content.ts, form-options.ts, shortlist-items.ts, analytics-events.ts
    ├── src/scripts/main.ts, form.ts, keys.ts, results.ts, similar-ui.ts, check-links.ts,
    │   clipboard.ts, announce.ts, recent.ts, shortlist-ui.ts, download.ts
    ├── src/styles/app.css
    └── test/*.test.ts, test/browser/helpers.mjs, test/browser/*.browser.mjs, test/browser/screenshot.mjs
```

**Responsibilities and boundaries**

- `core` knows nothing about games, genres or myths. It exposes generic building blocks with no content.
- `data` holds content shared by any future VPS name tool (concepts, lexicon, tones, profiles, cultural packs) and validates it. It imports only `core`.
- `game-titles` is the only package that knows about game genres, title templates, styles and the known-title guard. It imports `core` and `data`.
- `site-kit` knows nothing about name generation. It holds the visual system, network shell, storage, shortlist store and analytics client.
- The app wires everything into one page and owns tool-specific UI scripts, copy and the analytics event schema.

## Conventions for Executors

- **TDD.** Every code task: write the failing test, run it, implement, run it, commit. Run the package's tests with `npx tsx --test packages/<pkg>/test/<file>.test.ts`; the full suite with `npm test`.
- **Imports.** Inside a package use extensionless relative imports (`./rng`). Across packages use the package name (`@vps-name-tools/core`).
- **Content tasks (19–24)** follow the same cycle with the data validator and content tests as the failing checks. AI may help draft entries; every entry is reviewed by the implementer before commit (no franchise terms, no sacred names in Tier B packs, ASCII spelling, sensible concepts).
- **Honesty.** `docs/VALIDATION.md` records only checks actually run, with date, environment and result. The README status table separates implemented, tested and planned.
- **Commit messages** use the imperative mood and end with the harness attribution trailer.

---

## M0 — Foundation

### Task 1: Workspace foundation

**Files:**
- Create: `package.json`, `.node-version`, `.gitignore`, `tsconfig.json`, `README.md`, `THIRD_PARTY_NOTICES.md`, `docs/VALIDATION.md`, `.github/workflows/validate.yml`
- Create: `packages/core/package.json`, `packages/core/src/index.ts`, `packages/data/package.json`, `packages/data/src/index.ts`, `packages/game-titles/package.json`, `packages/game-titles/src/index.ts`, `packages/site-kit/package.json`, `packages/site-kit/src/index.ts`
- Test: `packages/core/test/workspace.test.ts`

**Interfaces:**
- Produces: workspace packages `@vps-name-tools/core`, `@vps-name-tools/data`, `@vps-name-tools/game-titles`, `@vps-name-tools/site-kit`, each resolving `"."` to `./src/index.ts`; root scripts `typecheck`, `test`.

- [ ] **Step 1: Create the root files**

`.node-version`:
```
22.16.0
```

`package.json`:
```json
{
  "name": "vps-name-tools",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*", "apps/*"],
  "engines": { "node": ">=22.16.0" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "test": "tsx --test \"packages/*/test/**/*.test.ts\""
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["packages/*/src/**/*.ts", "packages/*/test/**/*.ts", "scripts/**/*.ts"]
}
```

`.gitignore`:
```
node_modules/
dist/
dist-*/
.astro/
.wrangler/
*.log
docs/brand/capture/*.png
lighthouse*.json
```

- [ ] **Step 2: Create the four package skeletons**

`packages/core/package.json` (repeat for `data`, `game-titles`, `site-kit` with their names):
```json
{
  "name": "@vps-name-tools/core",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

`packages/core/src/index.ts` (and the same line with each package's name in the other three):
```ts
export const PACKAGE = '@vps-name-tools/core';
```

- [ ] **Step 3: Install dev dependencies**

Run: `npm install -D typescript@^5.9.0 tsx@^4.20.0 @types/node@^22 fast-check zod@^4.0.0`
Expected: `package-lock.json` created; `node_modules/@vps-name-tools/*` symlinks exist.

- [ ] **Step 4: Write the failing workspace test**

`packages/core/test/workspace.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

const PACKAGES = ['@vps-name-tools/core', '@vps-name-tools/data', '@vps-name-tools/game-titles', '@vps-name-tools/site-kit'];

test('every workspace package resolves and exports PACKAGE', async () => {
  for (const name of PACKAGES) {
    const mod = (await import(name)) as { PACKAGE?: string };
    assert.equal(mod.PACKAGE, name);
  }
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS (1 test). If a package fails to resolve, re-run `npm install` so the workspace symlinks exist.

- [ ] **Step 6: Add CI, README, notices and the validation log**

`.github/workflows/validate.yml`:
```yaml
name: Validate
on: [push, pull_request]
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

`README.md`:
```markdown
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
```

`THIRD_PARTY_NOTICES.md`:
```markdown
# Third-party notices

Entries are added when third-party data, fonts or code ship in the product.
```

`docs/VALIDATION.md`:
```markdown
# Validation log

Only checks actually performed, with date, environment and result. Planned checks live in the plan, not here.

| Date | Check | Environment | Result |
|---|---|---|---|
```

- [ ] **Step 7: Type-check and commit**

Run: `npm run typecheck && npm test`
Expected: no type errors; 1 test passes.

```bash
git add -A
git commit -m "Set up VPS Name Tools workspace, CI and docs"
```

---

## M1 — Engine Core (`@vps-name-tools/core`)

### Task 2: Seeded random numbers and weighted choice

**Files:**
- Create: `packages/core/src/rng.ts`, `packages/core/src/weighted.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/rng.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = () => number` (values in [0, 1))
  - `createRng(seed: string): Rng`, `randomSeed(): string`, `hash32(text: string): string`
  - `interface Weighted<T> { readonly item: T; readonly weight: number }`
  - `pickWeighted<T>(rng: Rng, items: readonly Weighted<T>[]): T | undefined`
  - `temper<T>(items: readonly Weighted<T>[], temperature: number): Weighted<T>[]`
  - `shuffle<T>(rng: Rng, items: readonly T[]): T[]`, `chance(rng: Rng, p: number): boolean`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/rng.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hash32, pickWeighted, temper, shuffle, chance } from '../src/index';

test('the same seed gives the same sequence', () => {
  const a = createRng('abc');
  const b = createRng('abc');
  assert.deepEqual(Array.from({ length: 8 }, () => a()), Array.from({ length: 8 }, () => b()));
});

test('different seeds give different sequences', () => {
  assert.notDeepEqual(
    Array.from({ length: 4 }, createRng('abc')),
    Array.from({ length: 4 }, createRng('abd')),
  );
});

test('values stay in [0, 1)', () => {
  const r = createRng('range');
  for (let i = 0; i < 20000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, String(v));
  }
});

test('pickWeighted is roughly proportional to weight', () => {
  const r = createRng('weights');
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 20000; i++) {
    const k = pickWeighted(r, [{ item: 'a' as const, weight: 1 }, { item: 'b' as const, weight: 3 }]);
    counts[k!]++;
  }
  const ratio = counts.b / counts.a;
  assert.ok(ratio > 2.7 && ratio < 3.3, String(ratio));
});

test('pickWeighted ignores zero weights and returns undefined when nothing is positive', () => {
  const r = createRng('zero');
  for (let i = 0; i < 200; i++) assert.equal(pickWeighted(r, [{ item: 'x', weight: 0 }, { item: 'y', weight: 2 }]), 'y');
  assert.equal(pickWeighted(r, [{ item: 'x', weight: 0 }]), undefined);
  assert.equal(pickWeighted(r, []), undefined);
});

test('temper sharpens below 1 and flattens above 1', () => {
  const items = [{ item: 'a', weight: 1 }, { item: 'b', weight: 4 }];
  const sharp = temper(items, 0.5);
  assert.equal(sharp[1].weight / sharp[0].weight, 16);
  const flat = temper(items, 2);
  assert.equal(flat[1].weight / flat[0].weight, 2);
});

test('shuffle returns a deterministic permutation', () => {
  const xs = [1, 2, 3, 4, 5, 6];
  const s1 = shuffle(createRng('s'), xs);
  const s2 = shuffle(createRng('s'), xs);
  assert.deepEqual(s1, s2);
  assert.deepEqual([...s1].sort(), xs);
  assert.deepEqual(xs, [1, 2, 3, 4, 5, 6]);
});

test('chance respects 0 and 1', () => {
  const r = createRng('c');
  assert.equal(chance(r, 0), false);
  assert.equal(chance(r, 1), true);
});

test('hash32 is stable 8-character hex', () => {
  assert.equal(hash32('ashen oath'), hash32('ashen oath'));
  assert.match(hash32('x'), /^[0-9a-f]{8}$/);
  assert.notEqual(hash32('a'), hash32('b'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/rng.test.ts`
Expected: FAIL (`createRng` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/rng.ts`:
```ts
export type Rng = () => number;

/** cyrb128: hashes a string into four 32-bit seeds. */
function seedParts(text: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** sfc32 seeded from a string. Same seed, same sequence. */
export function createRng(seed: string): Rng {
  let [a, b, c, d] = seedParts(seed);
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function randomSeed(): string {
  const words = new Uint32Array(2);
  globalThis.crypto.getRandomValues(words);
  return words[0].toString(36) + words[1].toString(36);
}

/** FNV-1a 32-bit, as 8 hex characters. */
export function hash32(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
```

`packages/core/src/weighted.ts`:
```ts
import type { Rng } from './rng';

export interface Weighted<T> {
  readonly item: T;
  readonly weight: number;
}

export function pickWeighted<T>(rng: Rng, items: readonly Weighted<T>[]): T | undefined {
  let total = 0;
  for (const w of items) if (w.weight > 0) total += w.weight;
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const w of items) {
    if (w.weight <= 0) continue;
    r -= w.weight;
    if (r < 0) return w.item;
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].weight > 0) return items[i].item;
  return undefined;
}

/** Raise weights to 1/temperature: < 1 sharpens favourites, > 1 flattens. */
export function temper<T>(items: readonly Weighted<T>[], temperature: number): Weighted<T>[] {
  const p = 1 / temperature;
  return items.map(w => ({ item: w.item, weight: w.weight > 0 ? Math.pow(w.weight, p) : 0 }));
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function chance(rng: Rng, p: number): boolean {
  if (p <= 0) return false;
  if (p >= 1) return true;
  return rng() < p;
}
```

`packages/core/src/index.ts`:
```ts
export const PACKAGE = '@vps-name-tools/core';
export * from './rng';
export * from './weighted';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/rng.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add seeded random numbers and weighted choice"
```

---

### Task 3: Text utilities and light lemmatiser

**Files:**
- Create: `packages/core/src/text.ts`, `packages/core/src/lemma.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/text.test.ts`

**Interfaces:**
- Produces:
  - `asciiFold(s: string): string`, `isAscii(s: string): boolean`
  - `normalize(s: string): string` (ASCII, lowercase, only `a-z 0-9 ' -` and single spaces)
  - `sanitizeInput(s: string, max: number): string`
  - `capitalizeFirst(token: string): string`, `titleCase(input: string): string`
  - `wordCount(title: string): number`, `contentWords(title: string): string[]`
  - `syllableCount(word: string): number`, `titleSyllables(title: string): number`
  - `indefiniteArticle(word: string): 'a' | 'an'`, `pluralize(word: string): string`
  - `SMALL_WORDS: ReadonlySet<string>`
  - `lemmaCandidates(word: string): string[]`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/text.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  asciiFold, isAscii, normalize, sanitizeInput, titleCase, wordCount, contentWords,
  syllableCount, indefiniteArticle, pluralize, lemmaCandidates,
} from '../src/index';

test('asciiFold removes diacritics and folds special letters', () => {
  assert.equal(asciiFold('Hrímþursar'), 'Hrimthursar');
  assert.equal(asciiFold('Ægir Óðinn'), 'Aegir Odinn');
  assert.equal(asciiFold('Straße'), 'Strasse');
  assert.equal(isAscii(asciiFold('Mjǫllnir')), true);
});

test('normalize lowercases, folds and strips punctuation', () => {
  assert.equal(normalize('  Aeternum: The Ashen Crown! '), 'aeternum the ashen crown');
  assert.equal(normalize('Ysolde’s Lantern'), "ysolde's lantern");
  assert.equal(normalize('Wolf-Winter'), 'wolf-winter');
  assert.equal(normalize('Pip & Puddle'), 'pip puddle');
});

test('sanitizeInput removes control characters and caps length', () => {
  assert.equal(sanitizeInput('a\u0000b\nc', 10), 'a b c');
  assert.equal(sanitizeInput('abcdef', 3), 'abc');
});

test('titleCase keeps small words lowercase except first, last and after a colon', () => {
  assert.equal(titleCase('where the ravens sleep'), 'Where the Ravens Sleep');
  assert.equal(titleCase('aeternum: the ashen crown'), 'Aeternum: The Ashen Crown');
  assert.equal(titleCase('bury the crown'), 'Bury the Crown');
  assert.equal(titleCase('stone, salt and song'), 'Stone, Salt and Song');
  assert.equal(titleCase("ysolde's lantern"), "Ysolde's Lantern");
  assert.equal(titleCase('wolf-winter'), 'Wolf-Winter');
  assert.equal(titleCase('NEON grid'), 'NEON Grid');
  assert.equal(titleCase('what dreams are made of'), 'What Dreams Are Made Of');
});

test('wordCount ignores symbols and treats hyphenated words as one', () => {
  assert.equal(wordCount('Pip & Puddle'), 2);
  assert.equal(wordCount('Wolf-Winter'), 1);
  assert.equal(wordCount('Aeternum: Ashen Crown'), 3);
  assert.deepEqual(contentWords('The Hymn of Ravens'), ['hymn', 'ravens']);
});

test('syllableCount heuristic', () => {
  assert.equal(syllableCount('oath'), 1);
  assert.equal(syllableCount('stone'), 1);
  assert.equal(syllableCount('raven'), 2);
  assert.equal(syllableCount('bramble'), 2);
  assert.equal(syllableCount('aeternum'), 3);
  assert.equal(syllableCount('cyberpunk'), 3);
});

test('indefiniteArticle', () => {
  assert.equal(indefiniteArticle('oath'), 'an');
  assert.equal(indefiniteArticle('grim'), 'a');
  assert.equal(indefiniteArticle('unicorn'), 'a');
  assert.equal(indefiniteArticle('hour'), 'an');
});

test('pluralize regular words, last word of a phrase only', () => {
  assert.equal(pluralize('Raven'), 'Ravens');
  assert.equal(pluralize('Story'), 'Stories');
  assert.equal(pluralize('Torch'), 'Torches');
  assert.equal(pluralize('Blood Oath'), 'Blood Oaths');
});

test('lemmaCandidates covers plurals, -ing, -ed and irregular forms', () => {
  assert.ok(lemmaCandidates('ravens').includes('raven'));
  assert.ok(lemmaCandidates('stories').includes('story'));
  assert.ok(lemmaCandidates('frozen').includes('freeze'));
  assert.ok(lemmaCandidates('burning').includes('burn'));
  assert.ok(lemmaCandidates('wolves').includes('wolf'));
  assert.ok(!lemmaCandidates('glass').includes('glas'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/text.test.ts`
Expected: FAIL (`asciiFold` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/text.ts`:
```ts
const FOLD: Readonly<Record<string, string>> = {
  'æ': 'ae', 'Æ': 'Ae', 'œ': 'oe', 'Œ': 'Oe', 'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th',
  'ø': 'o', 'Ø': 'O', 'ß': 'ss', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ı': 'i',
};

export function asciiFold(s: string): string {
  return s
    .replace(/[æÆœŒðÐþÞøØßłŁđĐı]/g, ch => FOLD[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

export function isAscii(s: string): boolean {
  return /^[\x20-\x7e]*$/.test(s);
}

export function normalize(s: string): string {
  return asciiFold(s)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeInput(s: string, max: number): string {
  return s.replace(/[\u0000-\u001f\u007f]+/g, ' ').slice(0, max);
}

export const SMALL_WORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with',
]);

export function capitalizeFirst(token: string): string {
  const i = token.search(/[A-Za-z]/);
  return i < 0 ? token : token.slice(0, i) + token.charAt(i).toUpperCase() + token.slice(i + 1);
}

export function titleCase(input: string): string {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  let clauseStart = true;
  return tokens
    .map((tok, i) => {
      const isLast = i === tokens.length - 1;
      const bare = tok.toLowerCase().replace(/[^a-z']/g, '');
      const out = !clauseStart && !isLast && SMALL_WORDS.has(bare)
        ? tok.toLowerCase()
        : tok.split('-').map(capitalizeFirst).join('-');
      clauseStart = tok.endsWith(':');
      return out;
    })
    .join(' ');
}

export function wordCount(title: string): number {
  return title.trim().split(/\s+/).filter(t => /[A-Za-z0-9]/.test(t)).length;
}

/** Normalised words without small words, split on spaces and hyphens. */
export function contentWords(title: string): string[] {
  return normalize(title).split(/[\s-]+/).filter(w => w && !SMALL_WORDS.has(w));
}

export function syllableCount(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 0);
}

export function titleSyllables(title: string): number {
  return normalize(title).split(/[\s-]+/).filter(Boolean).reduce((n, w) => n + syllableCount(w), 0);
}

export function indefiniteArticle(word: string): 'a' | 'an' {
  const w = word.trim().toLowerCase();
  if (/^(hour|honest|honou?r|heir)/.test(w)) return 'an';
  if (/^(uni|use|usu|eu|one|once)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

export function pluralize(phrase: string): string {
  const parts = phrase.split(' ');
  const last = parts.pop() ?? '';
  let plural: string;
  if (/[^aeiou]y$/i.test(last)) plural = last.slice(0, -1) + (last.endsWith('Y') ? 'IES' : 'ies');
  else if (/(s|x|z|ch|sh)$/i.test(last)) plural = last + 'es';
  else plural = last + 's';
  return [...parts, plural].join(' ');
}
```

`packages/core/src/lemma.ts`:
```ts
const IRREGULAR: Readonly<Record<string, string>> = {
  frozen: 'freeze', forgotten: 'forget', broken: 'break', fallen: 'fall', sworn: 'swear', woven: 'weave',
  stolen: 'steal', risen: 'rise', drawn: 'draw', slain: 'slay', bound: 'bind', lost: 'lose', sung: 'sing',
  hidden: 'hide', written: 'write', eaten: 'eat', burnt: 'burn', dying: 'die', lying: 'lie',
  wolves: 'wolf', knives: 'knife', lives: 'life', thieves: 'thief', leaves: 'leaf', children: 'child',
  men: 'man', women: 'woman', mice: 'mouse', geese: 'goose', teeth: 'tooth', feet: 'foot',
};

/** The word itself plus plausible base forms. Matching tries every candidate. */
export function lemmaCandidates(word: string): string[] {
  const w = word.toLowerCase();
  const out = new Set<string>([w]);
  const irregular = IRREGULAR[w];
  if (irregular) out.add(irregular);
  if (w.endsWith('ies') && w.length > 4) out.add(w.slice(0, -3) + 'y');
  if (w.endsWith('es') && w.length > 3) out.add(w.slice(0, -2));
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) out.add(w.slice(0, -1));
  if (w.endsWith('ing') && w.length > 5) {
    out.add(w.slice(0, -3));
    out.add(w.slice(0, -3) + 'e');
  }
  if (w.endsWith('ed') && w.length > 4) {
    out.add(w.slice(0, -2));
    out.add(w.slice(0, -1));
  }
  if (w.endsWith('en') && w.length > 4) out.add(w.slice(0, -2));
  return [...out];
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './text';
export * from './lemma';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/text.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add text utilities and light lemmatiser"
```

---

### Task 4: Avoid rules

**Files:**
- Create: `packages/core/src/avoid.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/avoid.test.ts`

**Interfaces:**
- Consumes: `normalize`, `sanitizeInput`, `lemmaCandidates` (Task 3).
- Produces:
  - `type AvoidKind = 'word' | 'phrase' | 'prefix' | 'suffix' | 'contains'`
  - `interface AvoidRule { readonly kind: AvoidKind; readonly value: string }`
  - `parseAvoid(text: string): AvoidRule[]` (max 50 rules)
  - `violatesAvoid(title: string, morphemes: readonly string[], rules: readonly AvoidRule[]): AvoidRule | undefined`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/avoid.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAvoid, violatesAvoid } from '../src/index';

test('parseAvoid understands words, phrases, prefixes, suffixes and contains', () => {
  assert.deepEqual(parseAvoid('frost, "blood oath", grim*, *heim, *shadow*, -born, legend, dark souls'), [
    { kind: 'word', value: 'frost' },
    { kind: 'phrase', value: 'blood oath' },
    { kind: 'prefix', value: 'grim' },
    { kind: 'suffix', value: 'heim' },
    { kind: 'contains', value: 'shadow' },
    { kind: 'suffix', value: 'born' },
    { kind: 'word', value: 'legend' },
    { kind: 'phrase', value: 'dark souls' },
  ]);
});

test('parseAvoid drops empties and caps at 50 rules', () => {
  assert.deepEqual(parseAvoid(' , ,'), []);
  const many = Array.from({ length: 80 }, (_, i) => `w${i}`).join(',');
  assert.equal(parseAvoid(many).length, 50);
});

test('word rules match whole words, plurals and possessives', () => {
  const rules = parseAvoid('shadow, ysolde');
  assert.ok(violatesAvoid('Shadows of Ash', [], rules));
  assert.ok(violatesAvoid("Ysolde's Lantern", [], rules));
  assert.equal(violatesAvoid('Moonshadow', [], parseAvoid('shadow')), undefined);
});

test('word rules also check engine morphemes of compounds', () => {
  const rules = parseAvoid('frost');
  assert.ok(violatesAvoid('Frostbound Oath', ['Frost', 'bound', 'Oath'], rules));
  assert.equal(violatesAvoid('Frostbound Oath', ['Frostbound', 'Oath'], rules), undefined);
});

test('prefix, suffix, contains and phrase rules', () => {
  assert.ok(violatesAvoid('Grimhold', [], parseAvoid('grim*')));
  assert.ok(violatesAvoid('Ravenheim', [], parseAvoid('*heim')));
  assert.ok(violatesAvoid('Moonshadow', [], parseAvoid('*shadow*')));
  assert.ok(violatesAvoid('The Blood Oath: Ash', [], parseAvoid('"blood oath"')));
  assert.equal(violatesAvoid('Blood of the Oath', [], parseAvoid('"blood oath"')), undefined);
});

test('no rules never violates', () => {
  assert.equal(violatesAvoid('Anything', ['Anything'], []), undefined);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/avoid.test.ts`
Expected: FAIL (`parseAvoid` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/avoid.ts`:
```ts
import { normalize, sanitizeInput } from './text';
import { lemmaCandidates } from './lemma';

export type AvoidKind = 'word' | 'phrase' | 'prefix' | 'suffix' | 'contains';

export interface AvoidRule {
  readonly kind: AvoidKind;
  readonly value: string;
}

export const MAX_AVOID_RULES = 50;

export function parseAvoid(text: string): AvoidRule[] {
  const rules: AvoidRule[] = [];
  for (const raw of sanitizeInput(text, 500).split(/[,;\n]+/)) {
    const item = raw.trim();
    if (!item) continue;
    const quoted = item.length > 2 && /^["'].*["']$/.test(item);
    const core = quoted ? item.slice(1, -1) : item;
    const starts = /^[*-]/.test(core);
    const ends = /[*-]$/.test(core);
    const value = normalize(core.replace(/^[*-]+|[*-]+$/g, ''));
    if (!value) continue;
    let kind: AvoidKind;
    if (quoted || value.includes(' ')) kind = 'phrase';
    else if (starts && ends) kind = 'contains';
    else if (ends) kind = 'prefix';
    else if (starts) kind = 'suffix';
    else kind = 'word';
    rules.push({ kind, value });
    if (rules.length >= MAX_AVOID_RULES) break;
  }
  return rules;
}

export function violatesAvoid(title: string, morphemes: readonly string[], rules: readonly AvoidRule[]): AvoidRule | undefined {
  if (rules.length === 0) return undefined;
  const norm = normalize(title);
  const tokens = new Set<string>();
  for (const t of norm.split(/[\s-]+/)) if (t) tokens.add(t);
  for (const m of morphemes) {
    const n = normalize(m);
    if (n) tokens.add(n);
  }
  const spaced = ` ${norm.replace(/-/g, ' ')} `;
  for (const rule of rules) {
    switch (rule.kind) {
      case 'phrase':
        if (spaced.includes(` ${rule.value} `)) return rule;
        break;
      case 'word':
        for (const t of tokens) {
          const bare = t.replace(/'s$/, '');
          if (bare === rule.value || lemmaCandidates(bare).includes(rule.value)) return rule;
        }
        break;
      case 'prefix':
        for (const t of tokens) if (t.startsWith(rule.value)) return rule;
        break;
      case 'suffix':
        for (const t of tokens) if (t.endsWith(rule.value)) return rule;
        break;
      case 'contains':
        for (const t of tokens) if (t.includes(rule.value)) return rule;
        break;
    }
  }
  return undefined;
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './avoid';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/avoid.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add Avoid rule parsing and matching"
```

---

### Task 5: Contextual safety filter

**Files:**
- Create: `packages/core/src/safety.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/safety.test.ts`

**Interfaces:**
- Consumes: `normalize` (Task 3).
- Produces:
  - `interface SafetyLists { readonly phrases: readonly string[]; readonly coinedSubstrings: readonly string[] }`
  - `unsafeGenerated(title: string, inventedWords: readonly string[], lists: SafetyLists): 'code' | 'code-pair' | 'phrase' | 'invented' | undefined`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/safety.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unsafeGenerated, type SafetyLists } from '../src/index';

const LISTS: SafetyLists = { phrases: ['blood and soil', 'fourth reich'], coinedSubstrings: ['bok'] };

test('ordinary numbers are allowed', () => {
  assert.equal(unsafeGenerated('Station 88', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Sector 14', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Signal-14', [], LISTS), undefined);
});

test('explicit codes and the 14 + 88 pairing are blocked', () => {
  assert.equal(unsafeGenerated('Unit 1488', [], LISTS), 'code');
  assert.equal(unsafeGenerated('Sector 14/88', [], LISTS), 'code');
  assert.equal(unsafeGenerated('Station 14: Gate 88', [], LISTS), 'code-pair');
});

test('phrases match on word boundaries', () => {
  assert.equal(unsafeGenerated('Blood and Soil', [], LISTS), 'phrase');
  assert.equal(unsafeGenerated('The Fourth Reich Rising', [], LISTS), 'phrase');
  assert.equal(unsafeGenerated('Black Sun Rising', [], LISTS), undefined);
  assert.equal(unsafeGenerated('Blood and Soiled Linen', [], LISTS), undefined);
});

test('substring checks apply to invented words only', () => {
  assert.equal(unsafeGenerated('Bokarra', ['Bokarra'], LISTS), 'invented');
  assert.equal(unsafeGenerated('Bokarra Station', [], LISTS), undefined);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/safety.test.ts`
Expected: FAIL (`unsafeGenerated` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/safety.ts`:
```ts
import { normalize } from './text';

export interface SafetyLists {
  /** Unambiguous extremist phrases (normalised), matched on word boundaries in engine output. */
  readonly phrases: readonly string[];
  /** Profanity and slur fragments, matched inside invented words only (no false positives on real words). */
  readonly coinedSubstrings: readonly string[];
}

const CODE_PATTERNS: readonly RegExp[] = [/\b1488\b/, /\b14\s*[\/\\–-]\s*88\b/, /\b88\s*[\/\\–-]\s*14\b/];

/** Checks engine-generated material. Ordinary numbers are allowed; only explicit codes and phrases are blocked. */
export function unsafeGenerated(
  title: string,
  inventedWords: readonly string[],
  lists: SafetyLists,
): 'code' | 'code-pair' | 'phrase' | 'invented' | undefined {
  for (const re of CODE_PATTERNS) if (re.test(title)) return 'code';
  const numbers = title.match(/\b\d+\b/g) ?? [];
  if (numbers.includes('14') && numbers.includes('88')) return 'code-pair';
  const spaced = ` ${normalize(title).replace(/-/g, ' ')} `;
  for (const phrase of lists.phrases) if (spaced.includes(` ${phrase} `)) return 'phrase';
  for (const word of inventedWords) {
    const letters = normalize(word).replace(/[^a-z]/g, '');
    for (const fragment of lists.coinedSubstrings) if (letters.includes(fragment)) return 'invented';
  }
  return undefined;
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './safety';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/safety.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add contextual safety filter that allows ordinary numbers"
```

---

### Task 6: Theme steering parser

**Files:**
- Create: `packages/core/src/steering.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/steering.test.ts`

**Interfaces:**
- Consumes: `normalize`, `sanitizeInput`, `titleCase`, `lemmaCandidates` (Task 3).
- Produces:
  - `type ConceptId = string`
  - `interface SteeringIndex { readonly aliases: ReadonlyMap<string, readonly ConceptId[]>; readonly lexicon: ReadonlyMap<string, readonly string[]>; readonly concepts: ReadonlySet<ConceptId>; conceptsOfEntry(id: string): readonly ConceptId[]; posOfEntry(id: string): readonly string[] }`
  - `type PhraseRole = 'noun' | 'adj' | 'gerund' | 'name'`
  - `interface ThemePhrase { readonly raw: string; readonly display: string; readonly norm: string; readonly role: PhraseRole; readonly concepts: readonly ConceptId[]; readonly entryIds: readonly string[] }`
  - `interface ThemeProfile { readonly phrases: readonly ThemePhrase[]; readonly conceptBoosts: ReadonlyMap<ConceptId, number>; readonly entryBoosts: ReadonlyMap<string, number> }`
  - `STEER` constants; `splitPhrases(text: string): string[]`; `parseThemes(text: string, index: SteeringIndex): ThemeProfile`; `phraseRole(tokens: readonly string[], entryIds: readonly string[], index: SteeringIndex): PhraseRole`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/steering.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseThemes, splitPhrases, STEER, type SteeringIndex } from '../src/index';

const entries: Record<string, { concepts: string[]; pos: string[] }> = {
  raven: { concepts: ['raven', 'omen'], pos: ['noun'] },
  oath: { concepts: ['oath', 'vow'], pos: ['noun'] },
  blood: { concepts: ['blood', 'kin'], pos: ['noun'] },
  pale: { concepts: ['cold', 'silence'], pos: ['adj'] },
};

const index: SteeringIndex = {
  aliases: new Map([
    ['northern lights', ['aurora', 'sky', 'cold']],
    ['frozen', ['cold', 'ice']],
    ['kingdom', ['realm', 'crown']],
  ]),
  lexicon: new Map([['raven', ['raven']], ['ravens', ['raven']], ['oath', ['oath']], ['blood', ['blood']], ['pale', ['pale']]]),
  concepts: new Set(['aurora', 'sky', 'cold', 'ice', 'realm', 'crown', 'raven', 'omen', 'oath', 'vow', 'blood', 'kin', 'silence', 'winter']),
  conceptsOfEntry: id => entries[id]?.concepts ?? [],
  posOfEntry: id => entries[id]?.pos ?? [],
};

test('splitPhrases splits on commas, semicolons and newlines and caps the count', () => {
  assert.deepEqual(splitPhrases('a, b; c\nd'), ['a', 'b', 'c', 'd']);
  assert.equal(splitPhrases(Array.from({ length: 40 }, (_, i) => `p${i}`).join(',')).length, STEER.maxPhrases);
});

test('phrases keep a display form', () => {
  const p = parseThemes('frozen kingdom, ravens, northern lights', index);
  assert.deepEqual(p.phrases.map(x => x.display), ['Frozen Kingdom', 'Ravens', 'Northern Lights']);
});

test('alias phrases boost their concepts at alias strength', () => {
  const p = parseThemes('northern lights', index);
  assert.equal(p.conceptBoosts.get('aurora'), STEER.aliasConcept);
  assert.deepEqual([...p.phrases[0].concepts].sort(), ['aurora', 'cold', 'sky']);
});

test('a direct concept id boosts at full strength', () => {
  const p = parseThemes('winter', index);
  assert.equal(p.conceptBoosts.get('winter'), STEER.directConcept);
});

test('a lexicon word, even plural, boosts its entry and concepts', () => {
  const p = parseThemes('ravens', index);
  assert.equal(p.entryBoosts.get('raven'), STEER.namedEntry);
  assert.ok((p.conceptBoosts.get('omen') ?? 1) >= STEER.namedEntryConcept);
  assert.equal(p.phrases[0].role, 'noun');
});

test('multi-word phrases are matched whole and by token', () => {
  const p = parseThemes('blood oath, frozen kingdom', index);
  assert.ok(p.entryBoosts.has('blood') && p.entryBoosts.has('oath'));
  assert.ok(p.conceptBoosts.has('ice') && p.conceptBoosts.has('crown'));
  assert.equal(p.phrases[0].role, 'noun');
});

test('unknown words become name-role phrases with no concepts', () => {
  const p = parseThemes('Aeternum', index);
  assert.equal(p.phrases[0].role, 'name');
  assert.deepEqual(p.phrases[0].concepts, []);
});

test('adjective entries and -ing words get adjective roles', () => {
  assert.equal(parseThemes('pale', index).phrases[0].role, 'adj');
  assert.equal(parseThemes('burning', index).phrases[0].role, 'gerund');
});

test('empty input gives an empty profile', () => {
  const p = parseThemes('  ', index);
  assert.equal(p.phrases.length, 0);
  assert.equal(p.conceptBoosts.size, 0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/steering.test.ts`
Expected: FAIL (`parseThemes` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/steering.ts`:
```ts
import { normalize, sanitizeInput, titleCase } from './text';
import { lemmaCandidates } from './lemma';

export type ConceptId = string;

export interface SteeringIndex {
  /** Normalised phrase → concepts. */
  readonly aliases: ReadonlyMap<string, readonly ConceptId[]>;
  /** Normalised word or form → entry ids. */
  readonly lexicon: ReadonlyMap<string, readonly string[]>;
  readonly concepts: ReadonlySet<ConceptId>;
  conceptsOfEntry(id: string): readonly ConceptId[];
  posOfEntry(id: string): readonly string[];
}

export type PhraseRole = 'noun' | 'adj' | 'gerund' | 'name';

export interface ThemePhrase {
  readonly raw: string;
  readonly display: string;
  readonly norm: string;
  readonly role: PhraseRole;
  readonly concepts: readonly ConceptId[];
  readonly entryIds: readonly string[];
}

export interface ThemeProfile {
  readonly phrases: readonly ThemePhrase[];
  readonly conceptBoosts: ReadonlyMap<ConceptId, number>;
  readonly entryBoosts: ReadonlyMap<string, number>;
}

export const STEER = {
  directConcept: 3.0,
  aliasConcept: 1.8,
  namedEntry: 4.0,
  namedEntryConcept: 1.5,
  maxPhrases: 20,
  maxPhraseChars: 60,
  maxInputChars: 500,
} as const;

const STOP = new Set([
  'the', 'of', 'and', 'a', 'an', 'with', 'my', 'in', 'on', 'to', 'for', 'at', 'by', 'from', 'or', 'is', 'are',
  'some', 'very', 'lots', 'about', 'into', 'like', 'vibe', 'vibes', 'theme', 'themes', 'game',
]);

export function splitPhrases(text: string): string[] {
  return sanitizeInput(text, STEER.maxInputChars)
    .split(/[,;\n]+/)
    .map(s => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, STEER.maxPhrases)
    .map(s => s.slice(0, STEER.maxPhraseChars));
}

export function phraseRole(tokens: readonly string[], entryIds: readonly string[], index: SteeringIndex): PhraseRole {
  if (tokens.length > 1) return 'noun';
  const pos = entryIds.flatMap(id => index.posOfEntry(id));
  if (pos.includes('noun')) return 'noun';
  if (pos.includes('adj')) return 'adj';
  const word = tokens[0] ?? '';
  if (/ing$/.test(word) && word.length > 4) return 'gerund';
  if (/(ed|en)$/.test(word) && word.length > 4) return 'adj';
  return 'name';
}

export function parseThemes(text: string, index: SteeringIndex): ThemeProfile {
  const conceptBoosts = new Map<ConceptId, number>();
  const entryBoosts = new Map<string, number>();
  const bump = (map: Map<string, number>, key: string, value: number) => map.set(key, Math.max(map.get(key) ?? 1, value));
  const phrases: ThemePhrase[] = [];

  for (const raw of splitPhrases(text)) {
    const norm = normalize(raw);
    if (!norm) continue;
    const concepts = new Set<ConceptId>();
    const entryIds = new Set<string>();

    const lookup = (key: string) => {
      const candidates = key.includes(' ') ? [key] : lemmaCandidates(key);
      for (const cand of candidates) {
        for (const c of index.aliases.get(cand) ?? []) {
          concepts.add(c);
          bump(conceptBoosts, c, STEER.aliasConcept);
        }
        if (index.concepts.has(cand)) {
          concepts.add(cand);
          bump(conceptBoosts, cand, STEER.directConcept);
        }
        for (const id of index.lexicon.get(cand) ?? []) {
          entryIds.add(id);
          bump(entryBoosts, id, STEER.namedEntry);
          for (const c of index.conceptsOfEntry(id)) {
            concepts.add(c);
            bump(conceptBoosts, c, STEER.namedEntryConcept);
          }
        }
      }
    };

    lookup(norm);
    const tokens = norm.split(' ').filter(t => t && !STOP.has(t));
    if (tokens.length > 1) {
      for (let i = 0; i < tokens.length - 1; i++) lookup(`${tokens[i]} ${tokens[i + 1]}`);
      for (const t of tokens) lookup(t);
    }

    phrases.push({
      raw,
      display: titleCase(raw),
      norm,
      role: phraseRole(tokens.length ? tokens : [norm], [...entryIds], index),
      concepts: [...concepts],
      entryIds: [...entryIds],
    });
  }
  return { phrases, conceptBoosts, entryBoosts };
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './steering';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/steering.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add theme steering parser"
```

---

### Task 7: Phonetic engine for invented words

**Files:**
- Create: `packages/core/src/phonetics.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/phonetics.test.ts`

**Interfaces:**
- Consumes: `Rng`, `pickWeighted` (Task 2), `capitalizeFirst` (Task 3).
- Produces:
  - `interface PhoneticProfile { readonly id: string; readonly label: string; readonly onsets: readonly (readonly [string, number])[]; readonly nuclei: readonly (readonly [string, number])[]; readonly codas: readonly (readonly [string, number])[]; readonly shapes: readonly (readonly ['CV' | 'CVC' | 'V' | 'VC', number])[]; readonly syllables: readonly (readonly [number, number])[]; readonly endings?: readonly (readonly [string, number])[]; readonly endingChance?: number; readonly forbid: readonly string[]; readonly rewrite?: readonly (readonly [string, string])[]; readonly letters: readonly [number, number]; readonly vowelRatio?: readonly [number, number]; readonly maxConsonantRun?: number; readonly allowedClusters?: readonly string[] }`
  - `interface CoinedWord { readonly text: string; readonly syllables: readonly string[]; readonly ending?: string; readonly profile: string }`
  - `coinWord(rng, profile, opts?: { minLetters?: number; maxLetters?: number; attempts?: number; reject?: (word: string) => boolean }): CoinedWord | undefined`
  - `readable(word: string, profile: PhoneticProfile, letters?: readonly [number, number]): boolean`
  - `generateSyllable(rng, profile): string`
  - `mutateWord(rng, profile, source: CoinedWord, opts?: { reject?: (word: string) => boolean }): CoinedWord | undefined`

- [ ] **Step 1: Write the failing tests**

`packages/core/test/phonetics.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, coinWord, readable, mutateWord, type PhoneticProfile } from '../src/index';

const P: PhoneticProfile = {
  id: 'test',
  label: 'Test',
  onsets: [['b', 1], ['k', 1], ['st', 0.6], ['v', 1], ['', 0.3]],
  nuclei: [['a', 1], ['e', 1], ['o', 1]],
  codas: [['', 2], ['n', 1], ['r', 1], ['ld', 0.4]],
  shapes: [['CV', 3], ['CVC', 2], ['V', 0.5]],
  syllables: [[2, 3], [3, 1]],
  endings: [['ara', 1]],
  endingChance: 0.2,
  forbid: ['q(?!u)', 'vv'],
  letters: [3, 10],
};

test('the same seed gives the same invented words', () => {
  const a = Array.from({ length: 5 }, ((r) => () => coinWord(r, P)?.text)(createRng('same')));
  const b = Array.from({ length: 5 }, ((r) => () => coinWord(r, P)?.text)(createRng('same')));
  assert.deepEqual(a, b);
});

test('invented words are capitalised and readable', () => {
  const r = createRng('readable');
  for (let i = 0; i < 1000; i++) {
    const w = coinWord(r, P);
    assert.ok(w, 'expected a word');
    assert.match(w.text, /^[A-Z][a-z]+$/);
    assert.ok(readable(w.text, P), w.text);
    assert.ok(w.syllables.length >= 2);
  }
});

test('readable rejects triple letters, long consonant runs, bad vowel ratio and forbidden patterns', () => {
  assert.equal(readable('Baaab', P), false);
  assert.equal(readable('Kstrnba', P), false);
  assert.equal(readable('Aeaeae', P), false);
  assert.equal(readable('Qoda', P), false);
  assert.equal(readable('Vavvo', P), false);
  assert.equal(readable('Bakor', P), true);
});

test('reject callback is honoured', () => {
  const r = createRng('reject');
  for (let i = 0; i < 300; i++) {
    const w = coinWord(r, P, { reject: x => x.toLowerCase().includes('b') });
    if (w) assert.ok(!w.text.toLowerCase().includes('b'), w.text);
  }
});

test('impossible length limits return undefined', () => {
  assert.equal(coinWord(createRng('x'), P, { minLetters: 40, maxLetters: 50 }), undefined);
});

test('mutateWord keeps at least one original syllable', () => {
  const r = createRng('mutate');
  const source = coinWord(r, P)!;
  for (let i = 0; i < 50; i++) {
    const m = mutateWord(r, P, source);
    if (!m) continue;
    assert.notEqual(m.text, source.text);
    assert.ok(m.syllables.some(s => source.syllables.includes(s)), `${source.text} → ${m.text}`);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/phonetics.test.ts`
Expected: FAIL (`coinWord` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/phonetics.ts`:
```ts
import type { Rng } from './rng';
import { pickWeighted } from './weighted';
import { capitalizeFirst } from './text';

type W<T> = readonly (readonly [T, number])[];

export interface PhoneticProfile {
  readonly id: string;
  readonly label: string;
  readonly onsets: W<string>;
  readonly nuclei: W<string>;
  readonly codas: W<string>;
  readonly shapes: W<'CV' | 'CVC' | 'V' | 'VC'>;
  readonly syllables: W<number>;
  readonly endings?: W<string>;
  readonly endingChance?: number;
  /** Regex sources tested against the lowercase word. */
  readonly forbid: readonly string[];
  /** [regex source, replacement] applied to the lowercase word. */
  readonly rewrite?: readonly (readonly [string, string])[];
  readonly letters: readonly [number, number];
  readonly vowelRatio?: readonly [number, number];
  readonly maxConsonantRun?: number;
  readonly allowedClusters?: readonly string[];
}

export interface CoinedWord {
  readonly text: string;
  readonly syllables: readonly string[];
  readonly ending?: string;
  readonly profile: string;
}

const pick = <T>(rng: Rng, list: W<T>): T | undefined => pickWeighted(rng, list.map(([item, weight]) => ({ item, weight })));

export function generateSyllable(rng: Rng, profile: PhoneticProfile): string {
  const shape = pick(rng, profile.shapes) ?? 'CV';
  const onset = shape.startsWith('C') ? pick(rng, profile.onsets) ?? '' : '';
  const nucleus = pick(rng, profile.nuclei) ?? 'a';
  const coda = shape.endsWith('C') ? pick(rng, profile.codas) ?? '' : '';
  return onset + nucleus + coda;
}

function join(stem: string, ending: string): string {
  const vowel = /[aeiouy]/;
  const last = stem.slice(-1);
  const first = ending.charAt(0);
  if (vowel.test(last) && vowel.test(first)) return stem.slice(0, -1) + ending;
  if (last === first) return stem + ending.slice(1);
  return stem + ending;
}

function finish(profile: PhoneticProfile, raw: string): string {
  let w = raw.toLowerCase();
  for (const [from, to] of profile.rewrite ?? []) w = w.replace(new RegExp(from, 'g'), to);
  return capitalizeFirst(w);
}

export function readable(word: string, profile: PhoneticProfile, letters: readonly [number, number] = profile.letters): boolean {
  const w = word.toLowerCase();
  const plain = w.replace(/[^a-z]/g, '');
  if (plain.length < letters[0] || plain.length > letters[1]) return false;
  if (/(.)\1\1/.test(plain)) return false;
  const vowels = (plain.match(/[aeiouy]/g) ?? []).length;
  const [minRatio, maxRatio] = profile.vowelRatio ?? [0.28, 0.62];
  const ratio = vowels / plain.length;
  if (ratio < minRatio || ratio > maxRatio) return false;
  const maxRun = profile.maxConsonantRun ?? 3;
  for (const run of plain.match(/[^aeiouy]+/g) ?? []) {
    if (run.length > maxRun && !(profile.allowedClusters ?? []).includes(run)) return false;
  }
  for (const source of profile.forbid) if (new RegExp(source).test(w)) return false;
  if ((w.match(/'/g) ?? []).length > 1) return false;
  return true;
}

export function coinWord(
  rng: Rng,
  profile: PhoneticProfile,
  opts: { minLetters?: number; maxLetters?: number; attempts?: number; reject?: (word: string) => boolean } = {},
): CoinedWord | undefined {
  const letters: readonly [number, number] = [opts.minLetters ?? profile.letters[0], opts.maxLetters ?? profile.letters[1]];
  const attempts = opts.attempts ?? 40;
  for (let i = 0; i < attempts; i++) {
    const count = pick(rng, profile.syllables) ?? 2;
    const syllables = Array.from({ length: count }, () => generateSyllable(rng, profile));
    let stem = syllables.join('');
    let ending: string | undefined;
    if (profile.endings?.length && rng() < (profile.endingChance ?? 0)) {
      ending = pick(rng, profile.endings);
      if (ending) stem = join(stem, ending);
    }
    const text = finish(profile, stem);
    if (!readable(text, profile, letters)) continue;
    if (opts.reject?.(text)) continue;
    return { text, syllables, ending, profile: profile.id };
  }
  return undefined;
}

export function mutateWord(
  rng: Rng,
  profile: PhoneticProfile,
  source: CoinedWord,
  opts: { reject?: (word: string) => boolean } = {},
): CoinedWord | undefined {
  for (let i = 0; i < 30; i++) {
    const syllables = [...source.syllables];
    let ending = source.ending;
    if (ending && rng() < 0.3) {
      ending = profile.endings?.length ? pick(rng, profile.endings) : undefined;
    } else {
      const at = Math.floor(rng() * syllables.length);
      syllables[at] = generateSyllable(rng, profile);
    }
    if (!syllables.some(s => source.syllables.includes(s))) continue;
    let stem = syllables.join('');
    if (ending) stem = join(stem, ending);
    const text = finish(profile, stem);
    if (text === source.text || !readable(text, profile) || opts.reject?.(text)) continue;
    return { text, syllables, ending, profile: profile.id };
  }
  return undefined;
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './phonetics';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/phonetics.test.ts`
Expected: PASS (6 tests). If "invented words are capitalised and readable" fails because `coinWord` returns `undefined` too often, raise `attempts` in the test call rather than loosening `readable`.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add phonetic engine for invented words"
```

---

### Task 8: Diverse batch selection

**Files:**
- Create: `packages/core/src/select.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/select.test.ts`

**Interfaces:**
- Produces:
  - `interface Candidate { readonly key: string; readonly score: number; readonly family: string; readonly features: ReadonlySet<string>; readonly capKeys: readonly string[] }`
  - `interface SelectOptions { readonly count: number; readonly familyCap: (family: string) => number; readonly capLimit: (capKey: string) => number; readonly diversity: number }`
  - `selectDiverse<C extends Candidate>(candidates: readonly C[], opts: SelectOptions): C[]`
  - `jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number`

Selection is greedy: each pick maximises `score − diversity × (highest feature overlap with picks so far)` among candidates that respect family caps and cap keys. If the caps leave too few candidates, a second pass ignores family caps and a third ignores cap keys, so a batch is filled whenever enough candidates exist.

- [ ] **Step 1: Write the failing tests**

`packages/core/test/select.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDiverse, jaccard, type Candidate } from '../src/index';

const cand = (key: string, score: number, family = 'f', features: string[] = [key], capKeys: string[] = []): Candidate =>
  ({ key, score, family, features: new Set(features), capKeys });

const open = { familyCap: () => Infinity, capLimit: () => Infinity, diversity: 0 };

test('picks the highest scores without caps', () => {
  const out = selectDiverse([cand('a', 1), cand('b', 3), cand('c', 2)], { ...open, count: 2 });
  assert.deepEqual(out.map(c => c.key), ['b', 'c']);
});

test('removes duplicate keys', () => {
  const out = selectDiverse([cand('a', 2), cand('a', 1), cand('b', 1)], { ...open, count: 3 });
  assert.deepEqual(out.map(c => c.key), ['a', 'b']);
});

test('respects family caps when possible', () => {
  const xs = [cand('a', 5, 'x'), cand('b', 4, 'x'), cand('c', 1, 'y')];
  const out = selectDiverse(xs, { ...open, count: 2, familyCap: f => (f === 'x' ? 1 : 5) });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('respects cap keys when possible', () => {
  const xs = [cand('a', 5, 'f', ['a'], ['word:ash']), cand('b', 4, 'f', ['b'], ['word:ash']), cand('c', 1)];
  const out = selectDiverse(xs, { ...open, count: 2, capLimit: k => (k === 'word:ash' ? 1 : Infinity) });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('relaxes caps to fill the batch', () => {
  const xs = [cand('a', 3, 'x'), cand('b', 2, 'x'), cand('c', 1, 'x')];
  const out = selectDiverse(xs, { ...open, count: 3, familyCap: () => 1 });
  assert.equal(out.length, 3);
});

test('diversity prefers dissimilar candidates', () => {
  const xs = [cand('a', 1.0, 'f', ['ash', 'oath']), cand('b', 0.95, 'f', ['ash', 'oath']), cand('c', 0.9, 'f', ['frost', 'crown'])];
  const out = selectDiverse(xs, { ...open, count: 2, diversity: 0.5 });
  assert.deepEqual(out.map(c => c.key), ['a', 'c']);
});

test('jaccard', () => {
  assert.equal(jaccard(new Set(['a', 'b']), new Set(['b', 'c'])), 1 / 3);
  assert.equal(jaccard(new Set(), new Set()), 0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/core/test/select.test.ts`
Expected: FAIL (`selectDiverse` is not exported).

- [ ] **Step 3: Implement**

`packages/core/src/select.ts`:
```ts
export interface Candidate {
  readonly key: string;
  readonly score: number;
  readonly family: string;
  readonly features: ReadonlySet<string>;
  readonly capKeys: readonly string[];
}

export interface SelectOptions {
  readonly count: number;
  readonly familyCap: (family: string) => number;
  readonly capLimit: (capKey: string) => number;
  readonly diversity: number;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared);
}

export function selectDiverse<C extends Candidate>(candidates: readonly C[], opts: SelectOptions): C[] {
  const byKey = new Map<string, C>();
  for (const c of candidates) {
    const prev = byKey.get(c.key);
    if (!prev || c.score > prev.score) byKey.set(c.key, c);
  }
  const pool = [...byKey.values()].sort((a, b) => b.score - a.score);
  const picked: C[] = [];
  const pickedKeys = new Set<string>();
  const familyCount = new Map<string, number>();
  const capCount = new Map<string, number>();

  const passes = [
    { families: true, caps: true },
    { families: false, caps: true },
    { families: false, caps: false },
  ];
  for (const pass of passes) {
    while (picked.length < opts.count) {
      let best: C | undefined;
      let bestValue = -Infinity;
      for (const c of pool) {
        if (pickedKeys.has(c.key)) continue;
        if (pass.families && (familyCount.get(c.family) ?? 0) >= opts.familyCap(c.family)) continue;
        if (pass.caps && c.capKeys.some(k => (capCount.get(k) ?? 0) >= opts.capLimit(k))) continue;
        let overlap = 0;
        for (const p of picked) overlap = Math.max(overlap, jaccard(c.features, p.features));
        const value = c.score - opts.diversity * overlap;
        if (value > bestValue) {
          bestValue = value;
          best = c;
        }
      }
      if (!best) break;
      picked.push(best);
      pickedKeys.add(best.key);
      familyCount.set(best.family, (familyCount.get(best.family) ?? 0) + 1);
      for (const k of best.capKeys) capCount.set(k, (capCount.get(k) ?? 0) + 1);
    }
    if (picked.length >= opts.count) break;
  }
  return picked;
}
```

Append to `packages/core/src/index.ts`:
```ts
export * from './select';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/core/test/select.test.ts && npm run typecheck`
Expected: PASS (7 tests); no type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "Add diverse batch selection with caps and relaxation"
```

---

## M2 — Shared Data Framework (`@vps-name-tools/data`)

### Task 9: Data types, concept registry, builders, steering index and validator

**Files:**
- Modify: `packages/data/package.json` (add `"./ids": "./src/ids.ts"` to `exports`), `packages/data/src/index.ts`, root `package.json` (scripts)
- Create: `packages/data/src/ids.ts`, `types.ts`, `build.ts`, `concepts.ts`, `aliases.ts`, `lexicon/index.ts`, `tones.ts`, `profiles/index.ts`, `profiles/neutral.ts`, `myths/index.ts`, `myths/none.ts`, `safety.ts`, `safety-generated.ts`, `steering-index.ts`, `validate.ts`
- Create: `scripts/build-safety.ts`, `scripts/validate-data.ts`
- Test: `packages/data/test/fixtures/mini-bundle.ts`, `packages/data/test/validate.test.ts`, `packages/data/test/steering-index.test.ts`

**Interfaces:**
- Consumes: `PhoneticProfile`, `SafetyLists`, `SteeringIndex`, `normalize`, `isAscii` from `@vps-name-tools/core`.
- Produces:
  - `TONE_IDS`, `MYTH_IDS`, `MYTH_GROUPS`, `PROFILE_IDS`, `POS_VALUES`, `REGISTERS` and types `ToneId`, `MythId`, `MythGroup`, `ProfileId`, `Pos`, `Register`
  - `LexEntry`, `LexForms`, `SymbolicEntry`, `Concept`, `ToneDef`, `MythPack`, `MythReview`, `DataBundle`, `Issue`
  - builders `noun`, `adj`, `verb`, `abstract`, `place`, `morpheme`, `symbolic`, `concept`
  - `CONCEPTS`, `ALIASES`, `LEXICON`, `TONES`, `PROFILES`, `MYTHS`, `SAFETY`, `DATA: DataBundle`
  - `buildSteeringIndex(bundle: DataBundle, extra?: readonly LexEntry[]): SteeringIndex`
  - `validateData(bundle: DataBundle, opts?: { release?: boolean; bannedTerms?: readonly string[] }): Issue[]`, `containsTerm(normText: string, term: string): boolean`, `RELEASE_TARGETS`

- [ ] **Step 1: Ids and types**

`packages/data/src/ids.ts`:
```ts
export const TONE_IDS = [
  'epic', 'dark', 'grim', 'mystical', 'heroic', 'whimsical', 'cozy', 'romantic', 'melancholic', 'brutal',
  'mysterious', 'ancient', 'elegant', 'weird', 'surreal', 'cinematic', 'minimalist', 'retro', 'playful',
] as const;
export type ToneId = (typeof TONE_IDS)[number];

export const MYTH_IDS = [
  'none', 'original', 'norse', 'icelandic', 'germanic', 'anglo-saxon', 'celtic', 'arthurian', 'greek', 'roman',
  'egyptian', 'mesopotamian', 'persian', 'arabian', 'slavic', 'finnish', 'japanese', 'chinese', 'korean', 'indian',
  'mesoamerican', 'aztec', 'maya', 'andean', 'polynesian', 'african', 'biblical', 'gnostic', 'alchemical',
  'cosmic', 'fairy-tale',
] as const;
export type MythId = (typeof MYTH_IDS)[number];

export const MYTH_GROUPS = [
  'Neutral', 'Norse & Germanic', 'Celtic & Arthurian', 'Classical', 'Ancient Near East & Egypt', 'Slavic & Finnic',
  'East Asian', 'South Asian', 'Americas', 'Oceania', 'Africa', 'Religious & Esoteric', 'Literary & Folklore',
] as const;
export type MythGroup = (typeof MYTH_GROUPS)[number];

export const PROFILE_IDS = [
  'neutral', 'norse', 'germanic', 'old-english', 'celtic', 'elven', 'slavic', 'finnic', 'latin', 'hellenic',
  'ancient', 'cosmic', 'scifi', 'cyberpunk', 'soft', 'japanese',
] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export const POS_VALUES = ['noun', 'adj', 'verb', 'abstract', 'place', 'morpheme'] as const;
export type Pos = (typeof POS_VALUES)[number];

export const REGISTERS = ['plain', 'archaic', 'lofty', 'technical', 'whimsical'] as const;
export type Register = (typeof REGISTERS)[number];
```

`packages/data/src/types.ts`:
```ts
import type { ConceptId, PhoneticProfile, SafetyLists } from '@vps-name-tools/core';
import type { MythGroup, MythId, Pos, ProfileId, Register, ToneId } from './ids';

export interface LexForms {
  readonly plural?: string;
  readonly adj?: string;
  readonly gerund?: string;
  readonly past?: string;
}

export interface LexEntry {
  readonly id: string;
  readonly text: string;
  readonly pos: readonly Pos[];
  readonly forms?: LexForms;
  readonly concepts: readonly ConceptId[];
  /** Near-synonym group used by Generate Similar (ash, ember, cinder share "fire-residue"). */
  readonly family?: string;
  /** Tone affinity from −1 (wrong for this tone) to +1 (made for it). */
  readonly tones?: Partial<Record<ToneId, number>>;
  readonly register: Register;
  /** 0 = fresh, 1 = worn-out cliché. */
  readonly cliche?: number;
  readonly compound?: 'head' | 'tail' | 'both';
  /** Can end a place name (Raven + moor). */
  readonly placeTail?: boolean;
  /** Mass noun (iron, frost): never offered to plural slots. */
  readonly mass?: boolean;
}

export interface SymbolicEntry extends LexEntry {
  /** Where the term comes from and why it is not sacred. Required. */
  readonly sourceNote: string;
}

export interface Concept {
  readonly id: ConceptId;
  readonly label: string;
  readonly related: readonly ConceptId[];
}

export interface ToneDef {
  readonly id: ToneId;
  readonly label: string;
  /** Word used in identity notes: "Grim Norse dark-fantasy title…". */
  readonly noteWord: string;
  readonly conceptBoosts: Readonly<Record<string, number>>;
  /** Multipliers keyed by template family. */
  readonly familyWeights: Readonly<Record<string, number>>;
  readonly alliterationBonus?: number;
  /** Sound bias: profile for invented words when the cultural option is None (Cozy → soft). */
  readonly soundProfile?: ProfileId;
  /** Sound bias: upper length for invented words (Minimalist → 8). */
  readonly maxCoinedLetters?: number;
}

export interface MythReview {
  /** 'held' removes the pack from the selector at launch; notes must give the reason. */
  readonly status: 'draft' | 'reviewed' | 'externally-reviewed' | 'held';
  readonly reviewer?: string;
  readonly date?: string;
  readonly notes: string;
}

export interface MythPack {
  readonly id: MythId;
  readonly label: string;
  readonly group: MythGroup;
  readonly tier: 'A' | 'B' | 'none';
  /** Used in notes: "Norse", "Japanese-inspired". Empty for None. */
  readonly noteLabel: string;
  readonly profile: ProfileId;
  /** Multiplies how often invented words appear (1 = normal; Tier B packs use low values). */
  readonly coinedRate: number;
  readonly blend?: readonly { readonly id: MythId; readonly weight: number }[];
  readonly conceptBoosts: Readonly<Record<string, number>>;
  readonly imagery: readonly LexEntry[];
  readonly symbolic: readonly SymbolicEntry[];
  /** Template-family multipliers (kenning, triad, couplet…). */
  readonly rhythm: Readonly<Record<string, number>>;
  /** Names this pack must never produce (deities, sacred terms, franchise names). */
  readonly denylist: readonly string[];
  readonly review: MythReview;
}

export interface DataBundle {
  readonly concepts: readonly Concept[];
  readonly aliases: Readonly<Record<string, readonly ConceptId[]>>;
  readonly lexicon: readonly LexEntry[];
  readonly tones: readonly ToneDef[];
  readonly profiles: readonly PhoneticProfile[];
  readonly myths: readonly MythPack[];
  readonly safety: SafetyLists;
}

export interface Issue {
  readonly level: 'error' | 'warning';
  readonly where: string;
  readonly message: string;
}
```

- [ ] **Step 2: Builders**

`packages/data/src/build.ts`:
```ts
import type { ConceptId } from '@vps-name-tools/core';
import type { Pos } from './ids';
import type { Concept, LexEntry, SymbolicEntry } from './types';

type EntryOptions = Omit<Partial<LexEntry>, 'id' | 'text' | 'concepts' | 'pos'> & { readonly also?: readonly Pos[] };

function make(pos: Pos, id: string, text: string, concepts: readonly ConceptId[], o: EntryOptions = {}): LexEntry {
  const { also = [], ...rest } = o;
  return { register: 'plain', ...rest, id, text, concepts, pos: [pos, ...also] };
}

export const noun = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('noun', id, text, concepts, o);
export const adj = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('adj', id, text, concepts, o);
export const verb = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('verb', id, text, concepts, o);
export const abstract = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('abstract', id, text, concepts, o);
export const place = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('place', id, text, concepts, o);
export const morpheme = (id: string, text: string, concepts: readonly ConceptId[], o?: EntryOptions) => make('morpheme', id, text, concepts, o);
export const symbolic = (base: LexEntry, sourceNote: string): SymbolicEntry => ({ ...base, sourceNote });
export const concept = (id: ConceptId, related: readonly ConceptId[] = [], label = id.replace(/-/g, ' ')): Concept => ({ id, label, related });
```

- [ ] **Step 3: The concept registry**

Every concept id referenced by tones (Task 20), genres (Task 22), cultural packs (Tasks 23–24) and title vocabulary (Task 11) is listed here, so references never dangle. Task 19 extends the registry to at least 250 concepts.

`packages/data/src/concepts.ts`:
```ts
import { concept as c } from './build';
import type { Concept } from './types';

export const CONCEPTS: readonly Concept[] = [
  // nature and elements
  c('fire', ['warmth', 'light', 'ruin', 'forge']), c('ice', ['cold', 'winter', 'snow']), c('cold', ['ice', 'winter', 'snow', 'silence']),
  c('winter', ['cold', 'snow', 'ice', 'hunger']), c('summer', ['sun', 'warmth', 'harvest']), c('spring', ['bloom', 'seed', 'rain']),
  c('autumn', ['harvest', 'sorrow', 'mist']), c('storm', ['wind', 'rain', 'rage', 'sea']), c('rain', ['storm', 'sorrow', 'river']),
  c('snow', ['winter', 'cold', 'silence']), c('wind', ['storm', 'sky', 'voyage']), c('mist', ['secret', 'swamp', 'lake']),
  c('sea', ['tide', 'voyage', 'island', 'deep']), c('tide', ['sea', 'cycle', 'moon']), c('river', ['lake', 'journey', 'cycle']),
  c('lake', ['river', 'mist', 'secret']), c('island', ['sea', 'voyage', 'exploration']), c('mountain', ['stone', 'sky', 'journey']),
  c('forest', ['tree', 'wild', 'moss', 'wolf']), c('swamp', ['mist', 'rot', 'fungus']), c('desert', ['sand', 'sun', 'dust']),
  c('sand', ['desert', 'time', 'dust']), c('stone', ['earth', 'mountain', 'ancient']), c('earth', ['stone', 'seed', 'harvest']),
  c('tree', ['forest', 'seed', 'age']), c('moss', ['forest', 'stone', 'comfort']), c('bloom', ['garden', 'spring', 'love']),
  c('garden', ['bloom', 'home', 'harvest']), c('harvest', ['seed', 'autumn', 'food']), c('seed', ['harvest', 'spring', 'earth']),
  c('berry', ['food', 'forest', 'garden']), c('wild', ['forest', 'beast', 'hunt']), c('fungus', ['rot', 'swamp', 'transformation']),
  // creatures
  c('beast', ['wild', 'hunt', 'rage']), c('wolf', ['forest', 'hunt', 'hunger']), c('raven', ['omen', 'night', 'death']),
  c('bird', ['sky', 'wind', 'hope']), c('serpent', ['deep', 'curse', 'wisdom']), c('dragon', ['fire', 'gold', 'legend']),
  c('fox', ['forest', 'secret', 'magic']), c('horse', ['frontier', 'journey', 'wind']), c('creature', ['wild', 'bond', 'wonder']),
  c('bone', ['death', 'grave', 'hunger']),
  // sky and space
  c('light', ['sun', 'dawn', 'hope']), c('darkness', ['night', 'void', 'dread']), c('night', ['darkness', 'moon', 'dread']),
  c('dawn', ['light', 'hope', 'sun']), c('dusk', ['night', 'sorrow', 'sun']), c('sun', ['light', 'dawn', 'gold']),
  c('moon', ['night', 'tide', 'dream']), c('star', ['sky', 'light', 'cosmos']), c('sky', ['star', 'wind', 'light']),
  c('aurora', ['sky', 'light', 'cold']), c('void', ['darkness', 'cosmos', 'absence']), c('cosmos', ['star', 'void', 'space']),
  c('space', ['cosmos', 'planet', 'orbit']), c('planet', ['space', 'orbit', 'colony']), c('orbit', ['space', 'planet', 'station']),
  // home and people
  c('home', ['warmth', 'comfort', 'village']), c('warmth', ['home', 'fire', 'comfort']), c('comfort', ['home', 'warmth', 'food']),
  c('food', ['comfort', 'harvest', 'tavern']), c('friendship', ['bond', 'kin', 'joy']), c('bond', ['friendship', 'oath', 'creature']),
  c('kin', ['blood', 'friendship', 'home']), c('love', ['bloom', 'friendship', 'sorrow']), c('community', ['village', 'friendship', 'city']),
  c('village', ['home', 'community', 'harvest']), c('city', ['district', 'community', 'empire']), c('settlement', ['frontier', 'village', 'building']),
  c('harbor', ['sea', 'trade', 'city']), c('bridge', ['river', 'path', 'building']), c('district', ['city', 'crime', 'neon']),
  c('house', ['home', 'door', 'haunting']), c('room', ['house', 'door', 'isolation']), c('door', ['room', 'secret', 'house']),
  c('tavern', ['food', 'journey', 'guild']), c('guild', ['craft', 'trade', 'tavern']), c('collecting', ['creature', 'wonder', 'bond']),
  c('egg', ['nest', 'creature', 'spring']), c('nest', ['egg', 'home', 'bird']),
  // realm and conflict
  c('realm', ['crown', 'empire', 'legend']), c('crown', ['realm', 'throne', 'gold']), c('throne', ['crown', 'empire', 'dynasty']),
  c('empire', ['throne', 'legion', 'war']), c('dynasty', ['throne', 'kin', 'history']), c('legion', ['empire', 'war', 'banner']),
  c('banner', ['war', 'hero', 'legion']), c('command', ['war', 'order', 'empire']), c('conquest', ['war', 'empire', 'siege']),
  c('war', ['battle', 'blade', 'iron']), c('battle', ['war', 'blade', 'siege']), c('siege', ['war', 'battle', 'ruin']),
  c('blade', ['battle', 'iron', 'hero']), c('iron', ['forge', 'war', 'blade']), c('gold', ['crown', 'trade', 'dragon']),
  c('hero', ['legend', 'blade', 'hope']), c('hunt', ['beast', 'wild', 'wolf']), c('rebellion', ['chaos', 'hope', 'war']),
  c('frontier', ['outlaw', 'journey', 'wild']), c('outlaw', ['frontier', 'crime', 'bounty']), c('bounty', ['outlaw', 'gold', 'hunt']),
  c('canyon', ['desert', 'frontier', 'stone']), c('law', ['order', 'crime', 'case']), c('crime', ['law', 'case', 'secret']),
  c('case', ['crime', 'clue', 'mystery']),
  // craft and technology
  c('craft', ['forge', 'guild', 'work']), c('forge', ['fire', 'iron', 'craft']), c('building', ['settlement', 'craft', 'city']),
  c('trade', ['gold', 'harbor', 'guild']), c('work', ['craft', 'routine', 'shop']), c('shop', ['trade', 'work', 'village']),
  c('career', ['work', 'routine', 'city']), c('routine', ['work', 'loop', 'time']), c('machine', ['gear', 'engine', 'technology']),
  c('gear', ['machine', 'steam', 'craft']), c('steam', ['engine', 'gear', 'machine']), c('engine', ['machine', 'steam', 'ship']),
  c('aether', ['sky', 'magic', 'steam']), c('technology', ['machine', 'network', 'signal']), c('signal', ['network', 'static', 'station']),
  c('network', ['signal', 'code', 'technology']), c('code', ['network', 'glitch', 'secret']), c('glitch', ['code', 'static', 'chaos']),
  c('neon', ['city', 'chrome', 'night']), c('chrome', ['neon', 'machine', 'corporation']), c('corporation', ['chrome', 'city', 'order']),
  c('station', ['orbit', 'signal', 'isolation']), c('colony', ['planet', 'settlement', 'frontier']), c('ship', ['voyage', 'sea', 'engine']),
  c('propaganda', ['war', 'order', 'signal']), c('smoke', ['fire', 'city', 'secret']),
  // journeys
  c('journey', ['path', 'voyage', 'map']), c('map', ['journey', 'exploration', 'secret']), c('exploration', ['map', 'journey', 'wonder']),
  c('voyage', ['sea', 'journey', 'ship']), c('path', ['journey', 'map', 'bridge']), c('descent', ['depth', 'deep', 'abyss']),
  c('depth', ['descent', 'deep', 'abyss']), c('spiral', ['loop', 'descent', 'chaos']), c('loop', ['routine', 'spiral', 'time']),
  c('deck', ['chance', 'play', 'fate']), c('chance', ['fate', 'deck', 'play']),
  // myth and meaning
  c('gods', ['faith', 'spirit', 'ancient']), c('faith', ['gods', 'hope', 'prophecy']), c('spirit', ['gods', 'afterlife', 'magic']),
  c('oath', ['vow', 'blood', 'kin']), c('vow', ['oath', 'love', 'faith']), c('fate', ['prophecy', 'omen', 'chance']),
  c('omen', ['fate', 'raven', 'prophecy']), c('prophecy', ['fate', 'omen', 'faith']), c('rune', ['magic', 'ancient', 'stone']),
  c('magic', ['rune', 'spirit', 'curse']), c('curse', ['magic', 'ruin', 'blood']), c('relic', ['ancient', 'faith', 'legend']),
  c('ancient', ['age', 'relic', 'history']), c('legend', ['saga', 'hero', 'ancient']), c('saga', ['legend', 'hero', 'history']),
  c('afterlife', ['death', 'spirit', 'grave']), c('wisdom', ['knowledge', 'age', 'serpent']), c('knowledge', ['wisdom', 'secret', 'esoteric']),
  c('esoteric', ['knowledge', 'occult', 'secret']), c('occult', ['esoteric', 'magic', 'curse']), c('alchemy', ['transformation', 'gold', 'occult']),
  c('transformation', ['alchemy', 'chaos', 'fungus']), c('order', ['law', 'command', 'cycle']), c('chaos', ['order', 'glitch', 'rebellion']),
  c('cycle', ['time', 'tide', 'order']), c('age', ['ancient', 'time', 'history']), c('time', ['age', 'cycle', 'loop']),
  c('history', ['age', 'dynasty', 'legend']),
  // mind and mood
  c('memory', ['dream', 'sorrow', 'history']), c('dream', ['sleep', 'memory', 'moon']), c('sleep', ['dream', 'night', 'death']),
  c('dread', ['fear', 'darkness', 'haunting']), c('fear', ['dread', 'darkness', 'night']), c('haunting', ['dread', 'house', 'memory']),
  c('death', ['grave', 'afterlife', 'ruin']), c('grave', ['death', 'bone', 'afterlife']), c('ruin', ['death', 'ancient', 'aftermath']),
  c('rot', ['ruin', 'fungus', 'swamp']), c('blood', ['kin', 'oath', 'war']), c('gore', ['blood', 'bone', 'death']),
  c('hunger', ['survival', 'winter', 'wolf']), c('survival', ['hunger', 'shelter', 'wild']), c('shelter', ['survival', 'home', 'storm']),
  c('silence', ['absence', 'snow', 'isolation']), c('sorrow', ['memory', 'rain', 'dusk']), c('hope', ['dawn', 'light', 'hero']),
  c('rage', ['war', 'beast', 'fire']), c('joy', ['play', 'friendship', 'light']), c('play', ['joy', 'whimsy', 'chance']),
  c('whimsy', ['play', 'wonder', 'creature']), c('wonder', ['whimsy', 'exploration', 'star']), c('secret', ['mystery', 'door', 'clue']),
  c('mystery', ['secret', 'clue', 'case']), c('clue', ['mystery', 'case', 'secret']), c('absence', ['silence', 'void', 'isolation']),
  c('isolation', ['absence', 'station', 'silence']), c('guilt', ['memory', 'sorrow', 'secret']), c('static', ['signal', 'glitch', 'dread']),
  c('mirror', ['secret', 'dream', 'transformation']), c('abyss', ['deep', 'void', 'descent']), c('deep', ['abyss', 'sea', 'descent']),
  c('aftermath', ['ruin', 'wasteland', 'survival']), c('wasteland', ['aftermath', 'dust', 'rust']), c('rust', ['wasteland', 'iron', 'machine']),
  c('dust', ['desert', 'wasteland', 'time']), c('radiation', ['wasteland', 'aftermath', 'signal']), c('scavenging', ['wasteland', 'survival', 'rust']),
  c('puzzle', ['pattern', 'key', 'mystery']), c('pattern', ['puzzle', 'shape', 'cycle']), c('shape', ['pattern', 'puzzle', 'prism']),
  c('key', ['lock', 'door', 'puzzle']), c('lock', ['key', 'door', 'secret']), c('prism', ['light', 'shape', 'pattern']),
  c('knot', ['puzzle', 'bond', 'path']),
];
```

- [ ] **Step 4: Content entry points, safety lists and the neutral profile and pack**

`packages/data/src/aliases.ts`:
```ts
import type { ConceptId } from '@vps-name-tools/core';
/** Normalised phrase → concepts. Filled in Task 19. */
export const ALIASES: Readonly<Record<string, readonly ConceptId[]>> = {};
```

`packages/data/src/lexicon/index.ts`:
```ts
import type { LexEntry } from '../types';
/** Core lexicon. Category files are added in Task 21. */
export const LEXICON: readonly LexEntry[] = [];
```

`packages/data/src/tones.ts`:
```ts
import type { ToneDef } from './types';
/** All 19 tones are written in Task 20. */
export const TONES: readonly ToneDef[] = [];
```

`packages/data/src/profiles/neutral.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';

export const NEUTRAL: PhoneticProfile = {
  id: 'neutral',
  label: 'neutral mythic',
  onsets: [['b', 1], ['d', 1], ['f', 0.6], ['g', 0.8], ['h', 0.6], ['k', 1], ['l', 1], ['m', 1], ['n', 1], ['r', 1], ['s', 1],
    ['t', 1], ['v', 0.8], ['th', 0.5], ['br', 0.5], ['dr', 0.5], ['kr', 0.4], ['st', 0.5], ['tr', 0.5], ['', 0.6]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 1], ['u', 0.5], ['ae', 0.15], ['ai', 0.2]],
  codas: [['', 3], ['n', 1], ['r', 1], ['l', 0.8], ['s', 0.5], ['th', 0.3], ['nd', 0.3], ['rn', 0.3]],
  shapes: [['CV', 3], ['CVC', 2], ['V', 0.4], ['VC', 0.3]],
  syllables: [[2, 3], [3, 1.5], [1, 0.2]],
  endings: [['ara', 0.5], ['en', 0.6], ['is', 0.5], ['or', 0.6], ['eth', 0.3], ['ia', 0.5], ['um', 0.4]],
  endingChance: 0.3,
  forbid: ['q(?!u)', 'vv', 'uu', 'ii', '^ng', "'"],
  letters: [4, 10],
};
```

`packages/data/src/profiles/index.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
import { NEUTRAL } from './neutral';
/** The other 15 profiles are added in Task 20. */
export const PROFILES: readonly PhoneticProfile[] = [NEUTRAL];
```

`packages/data/src/myths/none.ts`:
```ts
import type { MythPack } from '../types';

export const NONE: MythPack = {
  id: 'none', label: 'None / Neutral', group: 'Neutral', tier: 'none', noteLabel: '', profile: 'neutral', coinedRate: 1,
  conceptBoosts: {}, imagery: [], symbolic: [], rhythm: {}, denylist: [],
  review: { status: 'reviewed', notes: 'No cultural content.' },
};
```

`packages/data/src/myths/index.ts`:
```ts
import type { MythPack } from '../types';
import { NONE } from './none';
/** Packs are added in Tasks 23 and 24, in MYTH_IDS order. */
export const MYTHS: readonly MythPack[] = [NONE];
```

`scripts/build-safety.ts` (generates the fragment list that rejects invented words only):
```ts
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function load(): { words: string[]; source: string } {
  try {
    const m = require('naughty-words') as { en?: unknown };
    if (Array.isArray(m.en)) return { words: m.en as string[], source: 'naughty-words (List of Dirty, Naughty, Obscene and Otherwise Bad Words), CC-BY-4.0' };
  } catch { /* try the next package */ }
  try {
    const m = require('badwords-list') as { array?: unknown };
    if (Array.isArray(m.array)) return { words: m.array as string[], source: 'badwords-list' };
  } catch { /* nothing installed */ }
  throw new Error('Install a word list first: npm install -D naughty-words');
}

const { words, source } = load();
const clean = [...new Set(words.map(w => w.toLowerCase().trim()))].filter(w => /^[a-z]+$/.test(w));
const keep = clean.filter(w => w.length >= 4 && w.length <= 12).sort();
const short = clean.filter(w => w.length === 3).sort();
writeFileSync(
  'packages/data/src/safety-generated.ts',
  `// Generated by scripts/build-safety.ts from ${source}. Do not edit by hand.\n` +
    `// Used only to reject invented words that contain one of these fragments.\n` +
    `export const COINED_SUBSTRINGS: readonly string[] = ${JSON.stringify(keep)};\n`,
);
console.log(`Wrote ${keep.length} fragments from ${source}.`);
console.log(`Review these 3-letter entries; copy only slurs into EXTRA_SHORT_FRAGMENTS in safety.ts: ${short.join(', ')}`);
```

Run: `npm install -D naughty-words` (if that package is unavailable: `npm install -D badwords-list`), then `npx tsx scripts/build-safety.ts`.
Expected: `packages/data/src/safety-generated.ts` written; the console lists 3-letter entries for review. Add the package, version and licence to `THIRD_PARTY_NOTICES.md`.

`packages/data/src/safety.ts`:
```ts
import type { SafetyLists } from '@vps-name-tools/core';
import { COINED_SUBSTRINGS } from './safety-generated';

/** Unambiguous extremist phrases and codes (ADL Hate Symbols Database). Engine output only; ordinary numbers stay allowed. */
export const EXTREMIST_PHRASES: readonly string[] = [
  'blood and soil', 'fourteen words', 'sieg heil', 'heil hitler', 'fourth reich', 'third reich', 'white power',
  'white pride', 'sonnenrad', 'wolfsangel', 'totenkopf', 'day of the rope', 'racial holy war', 'rahowa', 'zyklon',
  'aryan nation', 'aryan nations', 'hitler', 'nazi', 'swastika',
];

/** 3-letter slurs copied from the build-safety review list (step above). Keep this list short and reviewed. */
export const EXTRA_SHORT_FRAGMENTS: readonly string[] = [];

/** Extremist fragments an invented word must never contain ("Nazimund"). Invented words only. */
export const EXTREMIST_FRAGMENTS: readonly string[] = ['nazi', 'hitler', 'heil', 'reich', 'sieg', 'aryan', 'kkk', 'zyklon', 'rahowa'];

export const SAFETY: SafetyLists = {
  phrases: EXTREMIST_PHRASES,
  coinedSubstrings: [...COINED_SUBSTRINGS, ...EXTRA_SHORT_FRAGMENTS, ...EXTREMIST_FRAGMENTS],
};
```

- [ ] **Step 5: Steering index and validator**

`packages/data/src/steering-index.ts`:
```ts
import { normalize, type SteeringIndex } from '@vps-name-tools/core';
import type { DataBundle, LexEntry } from './types';

export function buildSteeringIndex(bundle: DataBundle, extra: readonly LexEntry[] = []): SteeringIndex {
  const aliases = new Map<string, readonly string[]>();
  for (const [k, v] of Object.entries(bundle.aliases)) aliases.set(normalize(k), v);
  const all = [...bundle.lexicon, ...bundle.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...extra];
  const byId = new Map(all.map(e => [e.id, e] as const));
  const lexicon = new Map<string, string[]>();
  const add = (text: string, id: string) => {
    const key = normalize(text);
    if (!key) return;
    const ids = lexicon.get(key) ?? [];
    if (!ids.includes(id)) ids.push(id);
    lexicon.set(key, ids);
  };
  for (const e of all) {
    add(e.text, e.id);
    for (const form of Object.values(e.forms ?? {})) if (form) add(form, e.id);
  }
  return {
    aliases,
    lexicon,
    concepts: new Set(bundle.concepts.map(c => c.id)),
    conceptsOfEntry: id => byId.get(id)?.concepts ?? [],
    posOfEntry: id => byId.get(id)?.pos ?? [],
  };
}
```

`packages/data/src/validate.ts`:
```ts
import { isAscii, normalize } from '@vps-name-tools/core';
import { MYTH_IDS, PROFILE_IDS, TONE_IDS } from './ids';
import type { DataBundle, Issue, LexEntry } from './types';

export const RELEASE_TARGETS = { concepts: 250, aliases: 1000, lexicon: 1200, imageryPerPack: 40 } as const;

/** Word-boundary match, plus substring match for terms of 5+ letters ("Freyjasgard"). The engine adds a prefix check for invented words (Task 14). */
export function containsTerm(normText: string, term: string): boolean {
  const t = normalize(term);
  if (!t) return false;
  if (` ${normText.replace(/['-]/g, ' ')} `.includes(` ${t} `)) return true;
  const letters = t.replace(/[^a-z]/g, '');
  return letters.length >= 5 && normText.replace(/[^a-z]/g, '').includes(letters);
}

export function validateData(b: DataBundle, o: { release?: boolean; bannedTerms?: readonly string[] } = {}): Issue[] {
  const issues: Issue[] = [];
  const error = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const target = (where: string, message: string) => issues.push({ level: o.release ? 'error' : 'warning', where, message });

  const conceptIds = new Set<string>();
  for (const c of b.concepts) {
    if (conceptIds.has(c.id)) error(`concept:${c.id}`, 'duplicate concept id');
    if (!/^[a-z][a-z0-9-]*$/.test(c.id)) error(`concept:${c.id}`, 'concept ids are lowercase kebab-case');
    conceptIds.add(c.id);
  }
  for (const c of b.concepts) for (const r of c.related) if (!conceptIds.has(r)) error(`concept:${c.id}`, `related concept "${r}" does not exist`);
  for (const [key, cs] of Object.entries(b.aliases)) {
    if (key !== normalize(key)) error(`alias:${key}`, 'alias keys must be normalised (lowercase ASCII)');
    for (const c of cs) if (!conceptIds.has(c)) error(`alias:${key}`, `unknown concept "${c}"`);
  }

  const ids = new Set<string>();
  const checkEntry = (e: LexEntry, where: string) => {
    if (ids.has(e.id)) error(where, `duplicate entry id "${e.id}"`);
    ids.add(e.id);
    if (!isAscii(e.text)) error(where, `"${e.text}" must be ASCII`);
    for (const f of Object.values(e.forms ?? {})) if (f && !isAscii(f)) error(where, `form "${f}" must be ASCII`);
    if (e.concepts.length === 0) error(where, 'an entry needs at least one concept');
    for (const c of e.concepts) if (!conceptIds.has(c)) error(where, `unknown concept "${c}"`);
    for (const t of Object.keys(e.tones ?? {})) if (!(TONE_IDS as readonly string[]).includes(t)) error(where, `unknown tone "${t}"`);
    if (e.cliche !== undefined && (e.cliche < 0 || e.cliche > 1)) error(where, 'cliche must be between 0 and 1');
    const n = normalize(e.text);
    for (const term of o.bannedTerms ?? []) if (containsTerm(n, term)) error(where, `"${e.text}" contains banned term "${term}"`);
    for (const p of b.safety.phrases) if (containsTerm(n, p)) error(where, `"${e.text}" matches a safety phrase`);
  };
  for (const e of b.lexicon) checkEntry(e, `lexicon:${e.id}`);

  for (const t of b.tones) for (const c of Object.keys(t.conceptBoosts)) if (!conceptIds.has(c)) error(`tone:${t.id}`, `unknown concept "${c}"`);

  const profileIds = new Set(b.profiles.map(p => p.id));
  if (!profileIds.has('neutral')) error('profiles', 'the neutral profile is required');
  for (const p of b.profiles) if (!(PROFILE_IDS as readonly string[]).includes(p.id)) error(`profile:${p.id}`, 'unknown profile id');

  const mythIds = new Set<string>(b.myths.map(m => m.id));
  if (!mythIds.has('none')) error('myths', 'the none pack is required');
  for (const m of b.myths) {
    const where = `myth:${m.id}`;
    if (!profileIds.has(m.profile)) target(where, `profile "${m.profile}" is not defined yet`);
    for (const x of m.blend ?? []) if (!mythIds.has(x.id)) target(where, `blend references missing pack "${x.id}"`);
    for (const c of Object.keys(m.conceptBoosts)) if (!conceptIds.has(c)) error(where, `unknown concept "${c}"`);
    for (const e of [...m.imagery, ...m.symbolic]) {
      if (!e.id.startsWith(`${m.id}.`)) error(where, `entry id "${e.id}" must start with "${m.id}."`);
      checkEntry(e, `${where}:${e.id}`);
    }
    for (const e of m.symbolic) if (!e.sourceNote.trim()) error(where, `symbolic term "${e.text}" needs a source note`);
    for (const e of [...m.imagery, ...m.symbolic]) {
      const n = normalize(e.text);
      for (const d of m.denylist) if (containsTerm(n, d)) error(where, `"${e.text}" contains denylisted "${d}"`);
    }
    if (m.tier === 'B' && m.denylist.length === 0) error(where, 'Tier B packs need a denylist');
    if (m.tier === 'B' && !m.noteLabel.includes('inspired')) error(where, 'Tier B note labels say "-inspired"');
    if (m.review.status === 'held' && !m.review.notes.trim()) error(where, 'a held pack must give the reason in review.notes');
    if (m.id !== 'none' && !m.blend && m.imagery.length < RELEASE_TARGETS.imageryPerPack) {
      target(where, `imagery has ${m.imagery.length} entries; target ${RELEASE_TARGETS.imageryPerPack}`);
    }
    if (m.id !== 'none' && m.review.status === 'draft') target(where, 'review status is still draft');
  }

  if (b.concepts.length < RELEASE_TARGETS.concepts) target('concepts', `${b.concepts.length} concepts; target ${RELEASE_TARGETS.concepts}`);
  if (Object.keys(b.aliases).length < RELEASE_TARGETS.aliases) target('aliases', `${Object.keys(b.aliases).length} aliases; target ${RELEASE_TARGETS.aliases}`);
  if (b.lexicon.length < RELEASE_TARGETS.lexicon) target('lexicon', `${b.lexicon.length} entries; target ${RELEASE_TARGETS.lexicon}`);
  if (b.tones.length !== TONE_IDS.length) target('tones', `${b.tones.length} of ${TONE_IDS.length} tones defined`);
  if (b.profiles.length !== PROFILE_IDS.length) target('profiles', `${b.profiles.length} of ${PROFILE_IDS.length} profiles defined`);
  for (const id of MYTH_IDS) if (!mythIds.has(id)) target('myths', `pack "${id}" is missing`);
  return issues;
}
```

`packages/data/src/index.ts`:
```ts
import { ALIASES } from './aliases';
import { CONCEPTS } from './concepts';
import { LEXICON } from './lexicon/index';
import { MYTHS } from './myths/index';
import { PROFILES } from './profiles/index';
import { SAFETY } from './safety';
import { TONES } from './tones';
import type { DataBundle } from './types';

export const PACKAGE = '@vps-name-tools/data';
export * from './ids';
export * from './types';
export * from './build';
export * from './steering-index';
export * from './validate';
export { ALIASES, CONCEPTS, LEXICON, MYTHS, PROFILES, SAFETY, TONES };

export const DATA: DataBundle = {
  concepts: CONCEPTS, aliases: ALIASES, lexicon: LEXICON, tones: TONES, profiles: PROFILES, myths: MYTHS, safety: SAFETY,
};
```

`scripts/validate-data.ts`:
```ts
import { DATA, validateData, type Issue } from '@vps-name-tools/data';

const release = process.argv.includes('--release');
const issues: Issue[] = [...validateData(DATA, { release })];
for (const i of issues) console.log(`${i.level.toUpperCase().padEnd(7)} ${i.where}: ${i.message}`);
const errors = issues.filter(i => i.level === 'error').length;
console.log(`\n${errors} error(s), ${issues.length - errors} warning(s)${release ? ' (release mode)' : ''}`);
process.exit(errors > 0 ? 1 : 0);
```

Root `package.json` scripts, add:
```json
"validate:data": "tsx scripts/validate-data.ts",
"build:safety": "tsx scripts/build-safety.ts"
```

- [ ] **Step 6: Write the mini test bundle**

`packages/data/test/fixtures/mini-bundle.ts` (shared by data and game-titles tests; small but complete):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
import { NEUTRAL } from '../../src/profiles/neutral';
import { NONE } from '../../src/myths/none';
import { abstract, adj, concept as c, morpheme, noun, place, symbolic, verb } from '../../src/build';
import type { DataBundle, MythPack, ToneDef } from '../../src/types';

export const MINI_CONCEPTS = [
  c('fire', ['warmth', 'light']), c('warmth', ['home', 'fire']), c('light', ['sky', 'star']), c('ruin', ['death', 'silence']),
  c('death', ['ruin', 'night']), c('cold', ['winter', 'ice']), c('winter', ['cold', 'hunger']), c('ice', ['cold']),
  c('oath', ['vow', 'kin']), c('vow', ['oath']), c('kin', ['blood', 'oath']), c('blood', ['kin', 'war']), c('war', ['iron', 'blood']),
  c('raven', ['omen', 'night']), c('omen', ['raven', 'gods']), c('night', ['dread', 'raven']), c('crown', ['realm']),
  c('realm', ['crown']), c('gods', ['silence', 'sky']), c('silence', ['memory']), c('sky', ['star', 'light']),
  c('aurora', ['sky', 'cold', 'light']), c('star', ['sky', 'night']), c('home', ['warmth', 'garden']), c('garden', ['bloom', 'home']),
  c('bloom', ['garden']), c('friendship', ['home']), c('sea', ['island']), c('island', ['sea']), c('iron', ['war']),
  c('memory', ['silence']), c('forest', ['wolf']), c('wolf', ['hunger', 'forest']), c('hunger', ['wolf']),
  c('signal', ['dread']), c('dread', ['night']),
];

const g = { grim: 0.6, dark: 0.4, cozy: -0.8 } as const;

export const MINI_LEXICON = [
  noun('ash', 'Ash', ['fire', 'ruin', 'death'], { forms: { plural: 'Ashes', adj: 'Ashen' }, family: 'fire-residue', compound: 'head', tones: g }),
  noun('ember', 'Ember', ['fire', 'warmth'], { forms: { plural: 'Embers' }, family: 'fire-residue', compound: 'head', tones: { cozy: 0.3 } }),
  noun('cinder', 'Cinder', ['fire', 'ruin'], { forms: { plural: 'Cinders' }, family: 'fire-residue' }),
  noun('oath', 'Oath', ['oath', 'vow', 'blood'], { forms: { plural: 'Oaths' }, family: 'promise', tones: { grim: 0.4, epic: 0.5 } }),
  noun('vow', 'Vow', ['oath', 'vow'], { forms: { plural: 'Vows' }, family: 'promise' }),
  noun('covenant', 'Covenant', ['oath', 'gods'], { forms: { plural: 'Covenants' }, family: 'promise', register: 'lofty' }),
  noun('pact', 'Pact', ['oath', 'blood'], { forms: { plural: 'Pacts' }, family: 'promise' }),
  noun('raven', 'Raven', ['raven', 'omen', 'night'], { forms: { plural: 'Ravens' }, compound: 'head' }),
  noun('crown', 'Crown', ['crown', 'realm'], { forms: { plural: 'Crowns' }, compound: 'both' }),
  noun('kingdom', 'Kingdom', ['realm', 'crown'], { forms: { plural: 'Kingdoms' } }),
  noun('frost', 'Frost', ['cold', 'winter', 'ice'], { forms: { adj: 'Frozen' }, compound: 'head', tones: { grim: 0.4 } , mass: true }),
  noun('winter', 'Winter', ['cold', 'winter'], { forms: { plural: 'Winters' } }),
  noun('rime', 'Rime', ['cold', 'ice'], { register: 'archaic', compound: 'head' }),
  noun('blood', 'Blood', ['blood', 'kin', 'war'], { compound: 'head', tones: { dark: 0.6, cozy: -1 } , mass: true }),
  noun('god', 'God', ['gods'], { forms: { plural: 'Gods' } }),
  noun('aurora', 'Aurora', ['aurora', 'sky', 'light'], { forms: { plural: 'Auroras' } }),
  noun('sky', 'Sky', ['sky', 'light'], { forms: { plural: 'Skies' } }),
  noun('star', 'Star', ['star', 'sky', 'light'], { forms: { plural: 'Stars' }, compound: 'head' }),
  noun('iron', 'Iron', ['iron', 'war'], { compound: 'head' , mass: true }),
  noun('wolf', 'Wolf', ['wolf', 'forest', 'hunger'], { forms: { plural: 'Wolves' }, compound: 'head' }),
  noun('hearth', 'Hearth', ['home', 'warmth'], { forms: { plural: 'Hearths' }, compound: 'head', tones: { cozy: 0.9 } }),
  noun('garden', 'Garden', ['garden', 'bloom', 'home'], { forms: { plural: 'Gardens' } }),
  noun('lantern', 'Lantern', ['light', 'home', 'warmth'], { forms: { plural: 'Lanterns' }, tones: { cozy: 0.7 } }),
  noun('meadow', 'Meadow', ['garden', 'bloom'], { forms: { plural: 'Meadows' } }),
  noun('bloom', 'Bloom', ['bloom', 'garden'], { forms: { plural: 'Blooms' } }),
  noun('friend', 'Friend', ['friendship'], { forms: { plural: 'Friends' } }),
  noun('isle', 'Isle', ['island', 'sea'], { forms: { plural: 'Isles' } }),
  noun('tide', 'Tide', ['sea'], { forms: { plural: 'Tides' } }),
  noun('signal', 'Signal', ['signal', 'dread'], { forms: { plural: 'Signals' }, register: 'technical' }),
  noun('night', 'Night', ['night', 'dread'], { forms: { plural: 'Nights' } }),
  noun('memory', 'Memory', ['memory', 'silence'], { forms: { plural: 'Memories' } }),
  noun('hunger', 'Hunger', ['hunger', 'wolf'], { mass: true }),
  adj('pale', 'Pale', ['cold', 'death', 'silence']),
  adj('hollow', 'Hollow', ['ruin', 'silence']),
  adj('silent', 'Silent', ['silence']),
  adj('broken', 'Broken', ['ruin', 'oath']),
  adj('forgotten', 'Forgotten', ['memory', 'gods', 'silence']),
  adj('warm', 'Warm', ['warmth', 'home'], { tones: { cozy: 0.8 } }),
  adj('little', 'Little', ['home', 'friendship'], { register: 'whimsical' }),
  verb('bury', 'Bury', ['death', 'ruin']),
  verb('outlast', 'Outlast', ['winter', 'hunger']),
  verb('kindle', 'Kindle', ['fire', 'warmth']),
  verb('answer', 'Answer', ['signal']),
  abstract('unsworn', 'Unsworn', ['oath']),
  abstract('exile', 'Exile', ['ruin', 'silence']),
  abstract('remnant', 'Remnant', ['ruin', 'memory']),
  place('falls', 'Falls', ['realm']), place('reach', 'Reach', ['realm']), place('cove', 'Cove', ['sea', 'home']),
  place('vale', 'Vale', ['realm', 'forest']), place('station', 'Station', ['signal']),
  morpheme('bound', 'bound', ['oath'], { compound: 'tail' }), morpheme('fall', 'fall', ['ruin'], { compound: 'tail' }),
  morpheme('forge', 'forge', ['fire', 'iron'], { compound: 'tail' }), morpheme('hold', 'hold', ['realm'], { compound: 'tail', placeTail: true }),
  morpheme('moor', 'moor', ['forest'], { placeTail: true }), morpheme('wick', 'wick', ['home'], { placeTail: true }),
  morpheme('mere', 'mere', ['sea'], { placeTail: true }), morpheme('light', 'light', ['light'], { compound: 'tail' }),
  morpheme('song', 'song', ['memory'], { compound: 'tail' }),
];

export const MINI_TONES: readonly ToneDef[] = [
  { id: 'grim', label: 'Grim', noteWord: 'grim', conceptBoosts: { ruin: 1.4, death: 1.3, hunger: 1.3 }, familyWeights: { single: 1.3, compound: 1.2 } },
  { id: 'cozy', label: 'Cozy', noteWord: 'cozy', conceptBoosts: { home: 1.6, warmth: 1.5, friendship: 1.4, bloom: 1.3 }, familyWeights: { possessive: 1.5, place: 1.6, duo: 1.3 }, alliterationBonus: 1 },
  { id: 'epic', label: 'Epic', noteWord: 'epic', conceptBoosts: { crown: 1.4, realm: 1.4, gods: 1.3 }, familyWeights: { 'of-phrase': 1.4, subtitle: 1.3 } },
];

export const MINI_NORSE_PROFILE: PhoneticProfile = {
  id: 'norse', label: 'Norse',
  onsets: [['b', 1], ['d', 1], ['f', 0.8], ['g', 1], ['h', 0.8], ['k', 1], ['r', 1], ['s', 1], ['t', 1], ['v', 1], ['sk', 0.6], ['st', 0.6], ['br', 0.5], ['gr', 0.6], ['hr', 0.4], ['th', 0.5]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 1], ['u', 0.6], ['y', 0.3], ['ei', 0.3], ['au', 0.2]],
  codas: [['', 1.5], ['r', 1], ['n', 1], ['l', 0.8], ['k', 0.8], ['g', 0.6], ['d', 0.6], ['rn', 0.4], ['ld', 0.4], ['nd', 0.4]],
  shapes: [['CVC', 5], ['CV', 3]],
  syllables: [[2, 7], [3, 2.5], [1, 0.5]],
  endings: [['gard', 0.6], ['vald', 0.6], ['mark', 0.5], ['fell', 0.5], ['vik', 0.5], ['holt', 0.5], ['run', 0.4]],
  endingChance: 0.35,
  forbid: ['q(?!u)', 'yy', 'uu', '^ng', "'", 'heim$'],
  letters: [4, 10],
};

export const MINI_SOFT_PROFILE: PhoneticProfile = {
  id: 'soft', label: 'soft and whimsical',
  onsets: [['b', 1], ['p', 1], ['m', 1], ['l', 1], ['n', 0.8], ['w', 0.6], ['f', 0.6], ['t', 0.6], ['bl', 0.4], ['pl', 0.4], ['fl', 0.4], ['sn', 0.3]],
  nuclei: [['a', 1], ['e', 0.8], ['i', 0.8], ['o', 1], ['u', 0.6], ['oo', 0.3], ['ee', 0.2]],
  codas: [['', 3], ['n', 0.8], ['m', 0.5], ['l', 0.6], ['p', 0.4]],
  shapes: [['CV', 5], ['CVC', 3]],
  syllables: [[2, 6], [3, 3.5]],
  endings: [['le', 1], ['ling', 0.8], ['kin', 0.7], ['wick', 0.5], ['bloom', 0.5], ['puff', 0.4]],
  endingChance: 0.45,
  forbid: ['q(?!u)', "'", 'ooo'],
  letters: [4, 11],
};

const NORSE: MythPack = {
  id: 'norse', label: 'Norse', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Norse', profile: 'norse', coinedRate: 1,
  conceptBoosts: { cold: 2, winter: 2, oath: 2, raven: 2, wolf: 1.8, iron: 1.5, gods: 1.4 },
  imagery: [
    noun('norse.longhall', 'Longhall', ['home', 'realm'], { register: 'archaic' }),
    noun('norse.skald', 'Skald', ['memory', 'oath'], { forms: { plural: 'Skalds' } }),
    noun('norse.rune', 'Rune', ['omen', 'gods'], { forms: { plural: 'Runes' }, compound: 'head' }),
  ],
  symbolic: [symbolic(adj('norse.wyrd', 'Wyrd', ['omen', 'gods'], { register: 'archaic' }), 'Old English wyrd / Old Norse urdr, fate; long established in English.')],
  rhythm: { kenning: 12, compound: 1.5, saga: 6 },
  denylist: ['odin', 'thor', 'loki', 'freya'],
  review: { status: 'reviewed', notes: 'Test fixture.' },
};

export const MINI: DataBundle = {
  concepts: MINI_CONCEPTS,
  aliases: { 'northern lights': ['aurora', 'sky', 'cold'], frozen: ['cold', 'ice'], kingdom: ['realm', 'crown'], cozy: ['home', 'warmth'] },
  lexicon: MINI_LEXICON,
  tones: MINI_TONES,
  profiles: [NEUTRAL, MINI_NORSE_PROFILE, MINI_SOFT_PROFILE],
  myths: [NONE, NORSE],
  safety: { phrases: ['blood and soil'], coinedSubstrings: ['bok'] },
};
```

- [ ] **Step 7: Write the failing tests**

`packages/data/test/validate.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData, noun, DATA, type DataBundle, type MythPack } from '../src/index';
import { MINI } from './fixtures/mini-bundle';

const errors = (b: DataBundle, release = false, bannedTerms: string[] = []) =>
  validateData(b, { release, bannedTerms }).filter(i => i.level === 'error').map(i => i.message);
const withPack = (patch: Partial<MythPack>): DataBundle => ({ ...MINI, myths: MINI.myths.map(m => (m.id === 'norse' ? { ...m, ...patch } : m)) });

test('the mini bundle has no errors', () => {
  assert.deepEqual(errors(MINI), []);
});

test('the real bundle has no errors in development mode', () => {
  assert.deepEqual(errors(DATA), []);
});

test('unknown concepts are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('xylo', 'Xylo', ['nope'])] };
  assert.ok(errors(bad).some(m => m.includes('unknown concept "nope"')));
});

test('duplicate entry ids are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('ash', 'Ash Two', ['fire'])] };
  assert.ok(errors(bad).some(m => m.includes('duplicate entry id "ash"')));
});

test('non-ASCII text is an error', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('aegir', 'Ægir', ['fire'])] };
  assert.ok(errors(bad).some(m => m.includes('must be ASCII')));
});

test('Tier B packs need a denylist and an -inspired label', () => {
  const msgs = errors(withPack({ tier: 'B', denylist: [], noteLabel: 'Norse' }));
  assert.ok(msgs.some(m => m.includes('need a denylist')));
  assert.ok(msgs.some(m => m.includes('-inspired')));
});

test('symbolic terms need a source note', () => {
  const pack = MINI.myths.find(m => m.id === 'norse')!;
  assert.ok(errors(withPack({ symbolic: [{ ...pack.symbolic[0], sourceNote: ' ' }] })).some(m => m.includes('needs a source note')));
});

test('denylisted names may not appear in pack vocabulary', () => {
  const pack = MINI.myths.find(m => m.id === 'norse')!;
  const imagery = [...pack.imagery, noun('norse.odinshall', "Odin's Hall", ['home'])];
  assert.ok(errors(withPack({ imagery })).some(m => m.includes('denylisted "odin"')));
});

test('banned franchise terms are errors', () => {
  const bad = { ...MINI, lexicon: [...MINI.lexicon, noun('hyrule', 'Hyrule Field', ['realm'])] };
  assert.ok(errors(bad, false, ['hyrule']).some(m => m.includes('banned term "hyrule"')));
});

test('release mode turns content targets into errors', () => {
  assert.ok(errors(MINI, true).some(m => m.includes('target')));
});
```

`packages/data/test/steering-index.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSteeringIndex } from '../src/index';
import { MINI } from './fixtures/mini-bundle';

test('the index maps text and word forms to entry ids', () => {
  const idx = buildSteeringIndex(MINI);
  assert.deepEqual(idx.lexicon.get('ravens'), ['raven']);
  assert.deepEqual(idx.lexicon.get('ashen'), ['ash']);
  assert.deepEqual(idx.lexicon.get('rune'), ['norse.rune']);
  assert.deepEqual(idx.conceptsOfEntry('norse.rune'), ['omen', 'gods']);
  assert.deepEqual(idx.posOfEntry('pale'), ['adj']);
  assert.ok(idx.concepts.has('aurora'));
  assert.deepEqual(idx.aliases.get('northern lights'), ['aurora', 'sky', 'cold']);
});

test('extra entries are indexed too', () => {
  const idx = buildSteeringIndex(MINI, [{ id: 'genre.cozy.teacup', text: 'Teacup', pos: ['noun'], concepts: ['home'], register: 'whimsical' }]);
  assert.deepEqual(idx.lexicon.get('teacup'), ['genre.cozy.teacup']);
});
```

- [ ] **Step 8: Run to verify failure, then pass**

Run: `npx tsx --test packages/data/test/*.test.ts`
Expected first run (before Steps 1–6 are saved): FAIL on missing exports. After saving: PASS (12 tests).

Run: `npm run validate:data`
Expected: `0 error(s)` and warnings for unmet content targets (they become errors with `--release`).

- [ ] **Step 9: Add validation to CI and commit**

Append to `.github/workflows/validate.yml` steps:
```yaml
      - run: npm run validate:data
```

```bash
git add -A
git commit -m "Add shared data framework, concept registry and validator"
```

---

## M3 — Game-Title Engine (`@vps-name-tools/game-titles`)

### Task 10: Ids, settings and engine types

**Files:**
- Modify: `packages/game-titles/package.json` (`exports`: `"."` → `./src/index.ts`, `"./ids"` → `./src/ids.ts`), `packages/game-titles/src/index.ts`
- Create: `packages/game-titles/src/ids.ts`, `settings.ts`, `types.ts`
- Test: `packages/game-titles/test/settings.test.ts`

**Interfaces:**
- Consumes: `sanitizeInput` (core); `TONE_IDS`, `MYTH_IDS`, `ToneId`, `MythId`, `LexEntry`, `ProfileId`, `Register`, `DataBundle` (data).
- Produces:
  - `GENRE_IDS`, `GENRE_GROUPS`, `STYLE_IDS`, `TEMPLATE_FAMILIES`, `SLOT_TYPES`, `LENGTH_OPTIONS`, `CREATIVITY_LEVELS`, `RESULT_COUNTS` and their types `GenreId`, `GenreGroup`, `StyleId`, `TemplateFamily`, `SlotType`, `LengthOption`, `Creativity`, `ResultCount`
  - `Settings`, `DEFAULT_SETTINGS`, `INPUT_LIMITS`, `CreativityParams`, `CREATIVITY`, `normalizeSettings(input?: Partial<Record<keyof Settings, unknown>>): Settings`
  - Types `SlotToken`, `LiteralToken`, `PatternToken`, `Template`, `LengthBias`, `VocabItem`, `GenreGuard`, `GenrePreset`, `StyleDef`, `Vocab`, `GameData`, `SimilarStrategy`, `RecipePart`, `Recipe`, `TitleMeta`, `TitleResult`, `NoticeCode`, `Notice`, `GenerateResult`, `GenerateOptions`, `SimilarOptions`

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/settings.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, DEFAULT_SETTINGS, CREATIVITY } from '../src/index';

test('defaults match the spec', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    genre: 'fantasy', myth: 'none', tone: 'auto', tone2: 'none', style: 'auto', length: 'any',
    creativity: 'balanced', count: 10, themes: '', include: '', avoid: '',
  });
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
});

test('unknown values fall back to defaults', () => {
  const s = normalizeSettings({ genre: 'space-western', myth: 'atlantis', tone: 'sad', style: 'loud', length: 'huge', creativity: 'max' });
  assert.equal(s.genre, 'fantasy');
  assert.equal(s.myth, 'none');
  assert.equal(s.tone, 'auto');
  assert.equal(s.style, 'auto');
  assert.equal(s.length, 'any');
  assert.equal(s.creativity, 'balanced');
});

test('count accepts 5, 10 and 20 as numbers or strings', () => {
  assert.equal(normalizeSettings({ count: '20' }).count, 20);
  assert.equal(normalizeSettings({ count: 5 }).count, 5);
  assert.equal(normalizeSettings({ count: '7' }).count, 10);
});

test('a second tone equal to the first is dropped', () => {
  assert.equal(normalizeSettings({ tone: 'grim', tone2: 'grim' }).tone2, 'none');
  assert.equal(normalizeSettings({ tone: 'grim', tone2: 'mystical' }).tone2, 'mystical');
});

test('text fields are sanitised and capped', () => {
  const s = normalizeSettings({ themes: 'a\u0000b'.padEnd(700, 'x'), include: 'y'.repeat(60), avoid: 3 });
  assert.equal(s.themes.length, 500);
  assert.ok(!s.themes.includes('\u0000'));
  assert.equal(s.include.length, 40);
  assert.equal(s.avoid, '');
});

test('creativity parameters match the spec', () => {
  assert.deepEqual(
    [CREATIVITY.focused.temperature, CREATIVITY.balanced.temperature, CREATIVITY.wild.temperature],
    [0.7, 1.0, 1.5],
  );
  assert.deepEqual([CREATIVITY.focused.literalRate, CREATIVITY.balanced.literalRate, CREATIVITY.wild.literalRate], [0.6, 0.4, 0.25]);
  assert.deepEqual([CREATIVITY.focused.wildcardRate, CREATIVITY.balanced.wildcardRate, CREATIVITY.wild.wildcardRate], [0, 0.06, 0.18]);
  assert.deepEqual([CREATIVITY.focused.coinedCap, CREATIVITY.balanced.coinedCap, CREATIVITY.wild.coinedCap], [0.1, 0.2, 0.35]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/settings.test.ts`
Expected: FAIL (`normalizeSettings` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/ids.ts`:
```ts
export const GENRE_IDS = [
  'fantasy', 'dark-fantasy', 'high-fantasy', 'rpg', 'action-rpg', 'crpg', 'mmo',
  'horror', 'psychological-horror', 'cosmic-horror',
  'sci-fi', 'cyberpunk', 'space-opera', 'post-apocalyptic', 'steampunk', 'dieselpunk',
  'adventure', 'survival', 'roguelike', 'sandbox',
  'cozy', 'farming', 'creature-collector',
  'strategy', 'city-builder', 'simulation',
  'puzzle', 'mystery', 'noir',
  'western', 'historical',
] as const;
export type GenreId = (typeof GENRE_IDS)[number];

export const GENRE_GROUPS = [
  'Fantasy & RPG', 'Horror', 'Sci-Fi & Punk', 'Adventure & Survival', 'Cozy & Life', 'Strategy & Simulation',
  'Mystery & Puzzle', 'Setting',
] as const;
export type GenreGroup = (typeof GENRE_GROUPS)[number];

export const STYLE_IDS = [
  'short-punchy', 'epic-fantasy', 'poetic', 'brandable', 'evocative', 'compound', 'invented', 'ancient', 'modern',
  'cryptic', 'descriptive', 'subtitle', 'franchise',
] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const TEMPLATE_FAMILIES = [
  'single', 'compound', 'coined', 'adj-noun', 'pair', 'the-noun', 'number', 'duo', 'of-phrase', 'prepositional',
  'sentence', 'imperative', 'frame', 'possessive', 'subtitle', 'suffix', 'descriptive', 'code', 'place', 'the-name',
  'kenning', 'triad', 'couplet', 'saga', 'epithet', 'alliterative',
] as const;
export type TemplateFamily = (typeof TEMPLATE_FAMILIES)[number];

export const SLOT_TYPES = [
  'noun', 'nounPl', 'adj', 'verb', 'abstract', 'name', 'place', 'compound', 'coined', 'number', 'ordinal', 'digits',
  'frame', 'frameSuffix', 'genreSuffix', 'prep', 'predicate', 'subtitle', 'epithet', 'placeWord',
] as const;
export type SlotType = (typeof SLOT_TYPES)[number];

export const LENGTH_OPTIONS = ['any', 'one', 'short', 'medium', 'long'] as const;
export type LengthOption = (typeof LENGTH_OPTIONS)[number];

export const CREATIVITY_LEVELS = ['focused', 'balanced', 'wild'] as const;
export type Creativity = (typeof CREATIVITY_LEVELS)[number];

export const RESULT_COUNTS = [5, 10, 20] as const;
export type ResultCount = (typeof RESULT_COUNTS)[number];
```

`packages/game-titles/src/settings.ts`:
```ts
import { sanitizeInput } from '@vps-name-tools/core';
import { MYTH_IDS, TONE_IDS, type MythId, type ToneId } from '@vps-name-tools/data';
import {
  CREATIVITY_LEVELS, GENRE_IDS, LENGTH_OPTIONS, RESULT_COUNTS, STYLE_IDS,
  type Creativity, type GenreId, type LengthOption, type ResultCount, type StyleId,
} from './ids';

export interface Settings {
  readonly genre: GenreId;
  readonly myth: MythId;
  readonly tone: ToneId | 'auto';
  readonly tone2: ToneId | 'none';
  readonly style: StyleId | 'auto';
  readonly length: LengthOption;
  readonly creativity: Creativity;
  readonly count: ResultCount;
  readonly themes: string;
  readonly include: string;
  readonly avoid: string;
}

export const DEFAULT_SETTINGS: Settings = {
  genre: 'fantasy', myth: 'none', tone: 'auto', tone2: 'none', style: 'auto', length: 'any',
  creativity: 'balanced', count: 10, themes: '', include: '', avoid: '',
};

export const INPUT_LIMITS = { themes: 500, include: 40, avoid: 500 } as const;

export interface CreativityParams {
  readonly temperature: number;
  readonly literalRate: number;
  readonly wildcardRate: number;
  readonly coinedCap: number;
  /** Weight for words that match none of the boosted concepts. */
  readonly baseline: number;
  readonly rareTemplateBoost: number;
  /** Weight of two random Tier A packs blended into "Original Mythic". */
  readonly crossMyth: number;
}

export const CREATIVITY: Readonly<Record<Creativity, CreativityParams>> = {
  focused: { temperature: 0.7, literalRate: 0.6, wildcardRate: 0, coinedCap: 0.1, baseline: 0.03, rareTemplateBoost: 0.5, crossMyth: 0 },
  balanced: { temperature: 1.0, literalRate: 0.4, wildcardRate: 0.06, coinedCap: 0.2, baseline: 0.08, rareTemplateBoost: 1, crossMyth: 0 },
  wild: { temperature: 1.5, literalRate: 0.25, wildcardRate: 0.18, coinedCap: 0.35, baseline: 0.25, rareTemplateBoost: 2.5, crossMyth: 0.15 },
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function normalizeSettings(input?: Partial<Record<keyof Settings, unknown>>): Settings {
  const i = input ?? {};
  const text = (v: unknown, max: number) => (typeof v === 'string' ? sanitizeInput(v, max) : '');
  const tone = pick<ToneId | 'auto'>(i.tone, ['auto', ...TONE_IDS], 'auto');
  let tone2 = pick<ToneId | 'none'>(i.tone2, ['none', ...TONE_IDS], 'none');
  if (tone2 === tone) tone2 = 'none';
  const n = typeof i.count === 'string' ? Number(i.count) : i.count;
  const count = (RESULT_COUNTS as readonly unknown[]).includes(n) ? (n as ResultCount) : DEFAULT_SETTINGS.count;
  return {
    genre: pick(i.genre, GENRE_IDS, 'fantasy'),
    myth: pick(i.myth, MYTH_IDS, 'none'),
    tone,
    tone2,
    style: pick<StyleId | 'auto'>(i.style, ['auto', ...STYLE_IDS], 'auto'),
    length: pick(i.length, LENGTH_OPTIONS, 'any'),
    creativity: pick(i.creativity, CREATIVITY_LEVELS, 'balanced'),
    count,
    themes: text(i.themes, INPUT_LIMITS.themes),
    include: text(i.include, INPUT_LIMITS.include),
    avoid: text(i.avoid, INPUT_LIMITS.avoid),
  };
}
```

`packages/game-titles/src/types.ts`:
```ts
import type { DataBundle, LexEntry, MythId, ProfileId, Register, ToneId } from '@vps-name-tools/data';
import type { GenreGroup, GenreId, SlotType, StyleId, TemplateFamily } from './ids';
import type { Settings } from './settings';

export interface SlotToken {
  readonly kind: 'slot';
  readonly types: readonly SlotType[];
  readonly optional: boolean;
  /** The head slot: where the Include word may go. */
  readonly lock: boolean;
  readonly index: number;
}
export interface LiteralToken {
  readonly kind: 'literal';
  readonly text: string;
}
export type PatternToken = SlotToken | LiteralToken;

export interface Template {
  readonly id: string;
  readonly family: TemplateFamily;
  readonly variants: readonly (readonly PatternToken[])[];
  readonly words: readonly [number, number];
  readonly base: number;
  readonly rare?: boolean;
  readonly alliterate?: boolean;
}

export interface LengthBias {
  readonly one: number;
  readonly short: number;
  readonly medium: number;
  readonly long: number;
}

export interface VocabItem {
  readonly text: string;
  readonly concepts?: readonly string[];
  readonly cliche?: number;
  readonly genres?: readonly GenreId[];
  readonly tones?: Partial<Record<ToneId, number>>;
}

export interface GenreGuard {
  readonly blockPhrases?: readonly string[];
  /** Engine-built words may not end with these ("mon", "craft"). */
  readonly blockSuffixes?: readonly string[];
}

export interface GenrePreset {
  readonly id: GenreId;
  readonly label: string;
  readonly group: GenreGroup;
  readonly parent?: GenreId;
  /** Used in notes: "dark-fantasy". */
  readonly noteLabel: string;
  readonly conceptBoosts: Readonly<Record<string, number>>;
  readonly suppress?: readonly string[];
  readonly familyWeights: Partial<Record<TemplateFamily, number>>;
  readonly defaultTones: readonly ToneId[];
  readonly lengthBias: LengthBias;
  readonly frameWords?: readonly string[];
  readonly suffixWords?: readonly VocabItem[];
  readonly entries?: readonly LexEntry[];
  /** Phonetic profile when the cultural option is None. */
  readonly profile: ProfileId;
  readonly guard?: GenreGuard;
}

export interface StyleDef {
  readonly id: StyleId;
  readonly label: string;
  readonly familyWeights: Partial<Record<TemplateFamily, number>>;
  /** Multiplier for families the style does not list. */
  readonly otherFamilies: number;
  readonly maxWords?: number;
  readonly maxChars?: number;
  /** Chance that a name slot becomes an invented word. */
  readonly coinedRate: number;
  readonly register?: Partial<Record<Register, number>>;
  readonly brandLetters?: readonly [number, number];
}

export interface Vocab {
  readonly frames: readonly VocabItem[];
  readonly frameSuffixes: readonly VocabItem[];
  readonly franchiseSuffixes: readonly VocabItem[];
  readonly numbers: readonly VocabItem[];
  readonly ordinals: readonly VocabItem[];
  readonly digits: readonly VocabItem[];
  readonly preps: readonly VocabItem[];
  readonly predicates: readonly VocabItem[];
  readonly epithets: readonly VocabItem[];
  readonly subtitlePatterns: readonly string[];
}

export interface GameData {
  readonly genres: readonly GenrePreset[];
  readonly styles: readonly StyleDef[];
  readonly templates: readonly Template[];
  readonly vocab: Vocab;
  /** Normalised famous game titles: exact matches are never produced. */
  readonly knownTitles: ReadonlySet<string>;
  readonly franchiseTerms: readonly string[];
}

export type SimilarStrategy = 'modifier' | 'head' | 'structure' | 'mutate';

interface PartBase {
  readonly index: number;
  readonly slot: SlotType;
}
export type RecipePart =
  | { readonly kind: 'literal'; readonly text: string }
  | (PartBase & { readonly kind: 'lex'; readonly entryId: string; readonly text: string })
  | (PartBase & { readonly kind: 'vocab'; readonly text: string; readonly cliche: number })
  | (PartBase & { readonly kind: 'user'; readonly phrase: string; readonly text: string })
  | (PartBase & { readonly kind: 'include'; readonly text: string })
  | (PartBase & { readonly kind: 'coined'; readonly profile: string; readonly syllables: readonly string[]; readonly ending?: string; readonly text: string })
  | (PartBase & { readonly kind: 'compound'; readonly headId: string; readonly tailId: string; readonly morphemes: readonly [string, string]; readonly text: string })
  | (PartBase & { readonly kind: 'group'; readonly parts: readonly RecipePart[]; readonly text: string });

export interface Recipe {
  readonly templateId: string;
  readonly variant: number;
  readonly family: TemplateFamily;
  readonly parts: readonly RecipePart[];
  /** Slot index of the head (lock) slot, or -1. */
  readonly headSlot: number;
  readonly anchor?: string;
  readonly seed: string;
  readonly strategy?: SimilarStrategy;
}

export interface TitleMeta {
  readonly genre: GenreId;
  readonly myth: MythId;
  readonly style: StyleId | 'auto';
  readonly tones: readonly ToneId[];
  readonly concepts: readonly string[];
  readonly note: string;
  readonly genreLabel: string;
  readonly mythLabel: string;
  readonly styleLabel: string;
}

export interface TitleResult {
  readonly id: string;
  readonly title: string;
  readonly meta: TitleMeta;
  readonly recipe: Recipe;
  readonly settings: Settings;
}

export type NoticeCode = 'include-conflicts-avoid' | 'pool-limited' | 'include-unusable' | 'shortfall';
export interface Notice {
  readonly code: NoticeCode;
  readonly message: string;
}

export interface GenerateResult {
  readonly titles: readonly TitleResult[];
  readonly notices: readonly Notice[];
  readonly seed: string;
}

export interface GenerateOptions {
  readonly seed?: string;
  /** Normalised titles not to repeat (recently shown). */
  readonly exclude?: ReadonlySet<string>;
  readonly data?: DataBundle;
  readonly game?: GameData;
}

export interface SimilarOptions extends GenerateOptions {
  readonly count?: number;
}
```

`packages/game-titles/src/index.ts`:
```ts
export const PACKAGE = '@vps-name-tools/game-titles';
export * from './ids';
export * from './settings';
export * from './types';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/settings.test.ts && npm run typecheck`
Expected: PASS (6 tests); no type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add game-title ids, settings and engine types"
```

---

### Task 11: Pattern parser, the 35 templates and title vocabulary

**Files:**
- Create: `packages/game-titles/src/pattern.ts`, `templates.ts`, `vocab.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/templates.test.ts`

**Interfaces:**
- Consumes: types from Task 10.
- Produces: `parsePattern(src: string): PatternToken[]`, `TEMPLATES: readonly Template[]` (T01–T35), `VOCAB: Vocab`.

Pattern syntax: `{noun}` is a slot; `{adj?}` is optional; `{noun!}` is the head (lock) slot that may hold the Include word; `{name|noun!}` lists alternative slot types; anything else is literal text.

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/templates.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAscii } from '@vps-name-tools/core';
import { parsePattern, TEMPLATES, VOCAB, SLOT_TYPES, TEMPLATE_FAMILIES } from '../src/index';

test('parsePattern reads slots, options, locks and literals', () => {
  assert.deepEqual(parsePattern('The {adj?} {noun!}'), [
    { kind: 'literal', text: 'The ' },
    { kind: 'slot', types: ['adj'], optional: true, lock: false, index: 0 },
    { kind: 'literal', text: ' ' },
    { kind: 'slot', types: ['noun'], optional: false, lock: true, index: 1 },
  ]);
  assert.deepEqual(parsePattern('{name|noun!}')[0], { kind: 'slot', types: ['name', 'noun'], optional: false, lock: true, index: 0 });
});

test('parsePattern rejects unknown slot types', () => {
  assert.throws(() => parsePattern('{banana}'), /Unknown slot type "banana"/);
});

test('there are 35 templates, T01 to T35, with valid families', () => {
  assert.equal(TEMPLATES.length, 35);
  assert.deepEqual(TEMPLATES.map(t => t.id), Array.from({ length: 35 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`));
  for (const t of TEMPLATES) assert.ok((TEMPLATE_FAMILIES as readonly string[]).includes(t.family), t.id);
});

test('every variant except the compound template has exactly one head slot', () => {
  for (const t of TEMPLATES) {
    for (const v of t.variants) {
      const locks = v.filter(x => x.kind === 'slot' && x.lock).length;
      assert.equal(locks, t.id === 'T03' ? 0 : 1, `${t.id}: ${locks} head slots`);
    }
  }
});

test('rare myth-rhythm templates are flagged rare', () => {
  for (const id of ['T30', 'T31', 'T32', 'T33', 'T34', 'T35']) assert.equal(TEMPLATES.find(t => t.id === id)?.rare, true, id);
});

test('vocabulary is ASCII, cliché scores are in range and subtitle patterns parse without head slots', () => {
  const lists = [VOCAB.frames, VOCAB.frameSuffixes, VOCAB.franchiseSuffixes, VOCAB.numbers, VOCAB.ordinals, VOCAB.digits, VOCAB.preps, VOCAB.predicates, VOCAB.epithets];
  for (const list of lists) for (const v of list) {
    assert.ok(isAscii(v.text), v.text);
    assert.ok((v.cliche ?? 0) >= 0 && (v.cliche ?? 0) <= 1, v.text);
  }
  for (const p of VOCAB.subtitlePatterns) {
    const tokens = parsePattern(p);
    assert.ok(tokens.every(t => t.kind === 'literal' || (!t.lock && t.types.every(x => (SLOT_TYPES as readonly string[]).includes(x)))), p);
  }
});

test('classic frames are present with reduced weight, not banned', () => {
  for (const f of ['Echoes', 'Shadow', 'Chronicles', 'Rise']) assert.ok((VOCAB.frames.find(v => v.text === f)?.cliche ?? 0) >= 0.5, f);
  for (const f of ['Legends', 'Saga']) assert.ok(VOCAB.frameSuffixes.some(v => v.text === f), f);
});

test('ordinary numbers including 14 and 88 are available as digits', () => {
  assert.ok(VOCAB.digits.some(d => d.text === '14'));
  assert.ok(VOCAB.digits.some(d => d.text === '88'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/templates.test.ts`
Expected: FAIL (`parsePattern` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/pattern.ts`:
```ts
import { SLOT_TYPES, type SlotType } from './ids';
import type { PatternToken } from './types';

export function parsePattern(src: string): PatternToken[] {
  const out: PatternToken[] = [];
  const re = /\{([a-zA-Z|]+)(\?)?(!)?\}|([^{]+)/g;
  let index = 0;
  for (const m of src.matchAll(re)) {
    if (m[4] !== undefined) {
      out.push({ kind: 'literal', text: m[4] });
      continue;
    }
    const types = m[1].split('|');
    for (const t of types) if (!(SLOT_TYPES as readonly string[]).includes(t)) throw new Error(`Unknown slot type "${t}" in "${src}"`);
    out.push({ kind: 'slot', types: types as SlotType[], optional: m[2] === '?', lock: m[3] === '!', index: index++ });
  }
  return out;
}
```

`packages/game-titles/src/templates.ts`:
```ts
import { parsePattern } from './pattern';
import type { TemplateFamily } from './ids';
import type { Template } from './types';

function tpl(
  id: string,
  family: TemplateFamily,
  patterns: readonly string[],
  words: readonly [number, number],
  base: number,
  extra: { rare?: boolean; alliterate?: boolean } = {},
): Template {
  return { id, family, variants: patterns.map(parsePattern), words, base, ...extra };
}

/** The 35 title structures. Spec Appendix A. */
export const TEMPLATES: readonly Template[] = [
  tpl('T01', 'single', ['{noun!}'], [1, 1], 1),
  tpl('T02', 'single', ['{abstract!}'], [1, 1], 0.7),
  tpl('T03', 'compound', ['{compound}'], [1, 1], 1),
  tpl('T04', 'coined', ['{coined!}'], [1, 1], 0.8),
  tpl('T05', 'adj-noun', ['{adj} {noun!}'], [2, 2], 1),
  tpl('T06', 'pair', ['{noun} {noun!}'], [2, 2], 0.9),
  tpl('T07', 'the-noun', ['The {adj?} {noun!}'], [2, 3], 0.8),
  tpl('T08', 'number', ['{number} {nounPl!}', '{ordinal} {noun!}'], [2, 2], 0.6),
  tpl('T09', 'pair', ['{name!} {placeWord}'], [2, 2], 0.6),
  tpl('T10', 'duo', ['{noun} & {noun!}', '{noun} and {noun!}'], [3, 3], 0.6),
  tpl('T11', 'of-phrase', ['{noun} of {noun!}'], [3, 3], 1),
  tpl('T12', 'of-phrase', ['The {noun} of {nounPl!}'], [4, 4], 0.7),
  tpl('T13', 'of-phrase', ['{noun} of the {adj?} {noun!}'], [3, 5], 0.8),
  tpl('T14', 'prepositional', ['{prep} the {adj?} {noun!}', '{prep} {name!}', '{noun} {prep} the {nounPl!}'], [2, 5], 0.7),
  tpl('T15', 'prepositional', ['Where the {nounPl!} {predicate}'], [4, 7], 0.4),
  tpl('T16', 'sentence', ['The {nounPl!} {predicate}', '{nounPl!} {predicate}'], [2, 6], 0.5),
  tpl('T17', 'imperative', ['{verb} the {adj?} {noun!}'], [3, 4], 0.6),
  tpl('T18', 'imperative', ["Don't {verb} the {noun!}", 'Do Not {verb} the {noun!}', 'Never {verb} the {noun!}'], [4, 5], 0.4),
  tpl('T19', 'frame', ['{frame} of {name|noun!}'], [3, 3], 0.5),
  tpl('T20', 'frame', ['{name!} {frameSuffix}'], [2, 2], 0.4),
  tpl('T21', 'possessive', ["{name!}'s {noun}"], [2, 2], 0.4),
  tpl('T22', 'subtitle', ['{name!}: {subtitle}'], [2, 6], 0.8),
  tpl('T23', 'subtitle', ['{place!}: {abstract}'], [2, 2], 0.4),
  tpl('T24', 'subtitle', ['{adj} {noun!}: {subtitle}'], [3, 7], 0.5),
  tpl('T25', 'suffix', ['{name|place!} {genreSuffix}'], [2, 2], 0.4),
  tpl('T26', 'descriptive', ['{adj|noun} {noun!} {genreSuffix}'], [3, 3], 0.2),
  tpl('T27', 'code', ['{noun!}-{digits}', '{noun!} {digits}'], [1, 2], 0.3),
  tpl('T28', 'place', ['{noun!} {placeWord}'], [2, 2], 0.4),
  tpl('T29', 'the-name', ['The {name|place!} {noun}'], [3, 3], 0.4),
  tpl('T30', 'kenning', ['{noun}-{noun!}'], [1, 1], 0.05, { rare: true }),
  tpl('T31', 'triad', ['{noun}, {noun} and {noun!}'], [4, 4], 0.05, { rare: true }),
  tpl('T32', 'couplet', ['{adj} {noun}, {adj} {noun!}'], [4, 4], 0.05, { rare: true }),
  tpl('T33', 'saga', ['The Saga of {name!}', "{name!}'s Saga"], [2, 4], 0.05, { rare: true }),
  tpl('T34', 'epithet', ['{name!} the {epithet}'], [3, 3], 0.1, { rare: true }),
  tpl('T35', 'alliterative', ['{noun} and {noun!}'], [3, 3], 0.1, { rare: true, alliterate: true }),
];
```

`packages/game-titles/src/vocab.ts`:
```ts
import type { Vocab } from './types';

/** Small, curated title vocabulary. Classic frames stay available with a cliché weight (Revision 2, decision 16). */
export const VOCAB: Vocab = {
  frames: [
    { text: 'Echoes', cliche: 0.8 }, { text: 'Shadow', cliche: 0.8 },
    { text: 'Chronicles', cliche: 0.7, genres: ['rpg', 'high-fantasy', 'fantasy'] }, { text: 'Rise', cliche: 0.7 },
    { text: 'Fall', cliche: 0.7 }, { text: 'Legend', cliche: 0.7 }, { text: 'Tales', cliche: 0.5, genres: ['cozy', 'crpg', 'adventure'] },
    { text: 'Song', cliche: 0.3, concepts: ['legend'] }, { text: 'Ballad', cliche: 0.3 }, { text: 'Book', cliche: 0.3, concepts: ['knowledge'] },
    { text: 'Hymn', cliche: 0.2, concepts: ['faith'] }, { text: 'Requiem', cliche: 0.4, concepts: ['death'] },
    { text: 'Lament', cliche: 0.2, concepts: ['sorrow'] }, { text: 'Children', cliche: 0.3, concepts: ['kin'] },
    { text: 'Heirs', cliche: 0.4, concepts: ['kin', 'crown'] }, { text: 'Keepers', cliche: 0.3 }, { text: 'Gates', cliche: 0.4 },
    { text: 'Dawn', cliche: 0.5, concepts: ['dawn'] }, { text: 'Twilight', cliche: 0.6, concepts: ['dusk'] },
    { text: 'Age', cliche: 0.5, concepts: ['age'] }, { text: 'Wrath', cliche: 0.5, concepts: ['rage'] },
    { text: 'Memory', cliche: 0.2, concepts: ['memory'] }, { text: 'Rites', cliche: 0.2, concepts: ['faith'] },
    { text: 'Vigil', cliche: 0.2, concepts: ['night', 'hope'] },
  ],
  frameSuffixes: [
    { text: 'Saga', cliche: 0.6 }, { text: 'Chronicles', cliche: 0.7 }, { text: 'Legends', cliche: 0.7 }, { text: 'Tales', cliche: 0.5 },
    { text: 'Cycle', cliche: 0.2 }, { text: 'Codex', cliche: 0.2 }, { text: 'Annals', cliche: 0.1 }, { text: 'Accord', cliche: 0.1 },
  ],
  franchiseSuffixes: [
    { text: 'Origins', cliche: 0.5 }, { text: 'Tactics', cliche: 0.2 }, { text: 'Legends', cliche: 0.7 }, { text: 'Online', cliche: 0.3 },
    { text: 'Arena', cliche: 0.4 }, { text: 'Rising', cliche: 0.6 }, { text: 'Reborn', cliche: 0.5 }, { text: 'Unbound', cliche: 0.4 },
    { text: 'Frontiers', cliche: 0.3 }, { text: 'Zero', cliche: 0.3 }, { text: 'Protocol', cliche: 0.2 },
    { text: 'Blaster', cliche: 0.3, tones: { retro: 1 } }, { text: 'Mania', cliche: 0.4, tones: { retro: 0.8 } },
    { text: 'Turbo', cliche: 0.3, tones: { retro: 1 } }, { text: 'Deluxe', cliche: 0.3, tones: { retro: 0.6 } },
  ],
  numbers: ['Two', 'Three', 'Seven', 'Nine', 'Ten', 'Twelve', 'Thirteen', 'Forty', 'Hundred', 'Thousand'].map(text => ({ text })),
  ordinals: ['First', 'Second', 'Third', 'Seventh', 'Ninth', 'Thirteenth', 'Last', 'Final', 'Hundredth'].map(text => ({ text })),
  digits: ['0', '1', '7', '9', '13', '14', '23', '47', '88', '99', '101', '108', '404', '512'].map(text => ({ text })),
  preps: ['Beneath', 'Beyond', 'After', 'Before', 'Under', 'Within', 'Below', 'Against', 'Across', 'Behind', 'Between', 'Past', 'Toward', 'Over', 'in', 'among']
    .map(text => ({ text })),
  predicates: [
    { text: 'Remember', concepts: ['memory'] }, { text: 'Never Sleep', concepts: ['dread', 'night'] },
    { text: 'Keep No Oaths', concepts: ['oath', 'ruin'] }, { text: 'Do Not Rest', concepts: ['death', 'dread'] },
    { text: 'Still Burn', concepts: ['fire'] }, { text: 'Came Down', concepts: ['absence', 'mountain'] },
    { text: 'Wait Below', concepts: ['deep', 'dread'] }, { text: 'Will Not Wake', concepts: ['sleep', 'death'] },
    { text: 'Sing at Dusk', concepts: ['dusk', 'legend'] }, { text: 'Know Your Name', concepts: ['secret', 'dread'] },
    { text: 'Forgot Us', concepts: ['gods', 'absence'] }, { text: 'Dream of Iron', concepts: ['dream', 'iron'] },
    { text: 'Walk Again', concepts: ['death', 'hope'] }, { text: 'Answer Back', concepts: ['signal', 'dread'] },
    { text: 'Grow Quiet', concepts: ['silence'] }, { text: 'Bloom at Midnight', concepts: ['bloom', 'night'], tones: { cozy: 0.5, whimsical: 0.6 } },
    { text: 'Keep the Light', concepts: ['light', 'hope'] }, { text: 'Come Home', concepts: ['home', 'journey'], tones: { cozy: 0.8 } },
    { text: 'Watch Over Us', concepts: ['gods', 'hope'] }, { text: 'Hum Softly', concepts: ['home', 'joy'], tones: { cozy: 0.7 } },
    { text: 'Have Teeth', concepts: ['beast', 'dread'], tones: { weird: 0.8 } }, { text: 'Count the Days', concepts: ['time', 'survival'] },
    { text: 'Hold the Line', concepts: ['war', 'hope'], cliche: 0.4 }, { text: 'Drift Apart', concepts: ['void', 'sorrow'] },
  ],
  epithets: [
    'Unbound', 'Pale', 'Drowned', 'Patient', 'Hollow', 'Unsworn', 'Last', 'Silent', 'Undying', 'Wanderer', 'Merciful', 'Lost',
    'Unseen', 'Restless', 'Bright', 'Grey', 'Crowned', 'Broken', 'Exile', 'Elder', 'Kind', 'Small', 'Brave',
  ].map(text => ({ text })).concat([{ text: 'Nameless', cliche: 0.4 }]),
  subtitlePatterns: [
    '{adj} {noun}', '{noun} of {noun}', 'The {adj} {noun}', '{abstract}', '{prep} the {noun}', 'The {noun} of {nounPl}',
  ],
};
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './pattern';
export * from './templates';
export * from './vocab';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/templates.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add pattern parser, 35 title templates and title vocabulary"
```

---

### Task 12: Naming styles, guards, known titles, genre framework and game-data validation

**Files:**
- Create: `packages/game-titles/src/styles.ts`, `guards.ts`, `known-titles.ts`, `genres/fantasy.ts`, `genres/index.ts`, `game.ts`, `validate-game.ts`
- Modify: `packages/game-titles/src/index.ts`, `scripts/validate-data.ts`
- Create test fixture: `packages/game-titles/test/fixtures/mini-game.ts`
- Test: `packages/game-titles/test/game-data.test.ts`

**Interfaces:**
- Consumes: `DATA`, `Issue`, `PROFILE_IDS`, `TONE_IDS`, `containsTerm` (data); `isAscii`, `normalize` (core); Tasks 10–11.
- Produces: `STYLES: readonly StyleDef[]`, `FRANCHISE_TERMS: readonly string[]`, `KNOWN_TITLES: ReadonlySet<string>`, `GENRES: readonly GenrePreset[]`, `GAME: GameData`, `validateGameData(game: GameData, data: DataBundle, opts?: { release?: boolean }): Issue[]`; test fixture `MINI_GAME`.

- [ ] **Step 1: Styles**

`packages/game-titles/src/styles.ts`:
```ts
import type { StyleDef } from './types';

/** Naming styles (spec §7). "Auto" is the absence of a style. */
export const STYLES: readonly StyleDef[] = [
  { id: 'short-punchy', label: 'Short & Punchy', familyWeights: { single: 2, compound: 2.5, coined: 1, 'adj-noun': 1.5, pair: 1.5, 'the-noun': 1, number: 1, code: 1, kenning: 1 }, otherFamilies: 0.1, maxWords: 2, maxChars: 14, coinedRate: 0.15 },
  { id: 'epic-fantasy', label: 'Epic Fantasy', familyWeights: { 'of-phrase': 3, frame: 2, subtitle: 2, saga: 1.5, epithet: 1.5, 'the-noun': 1.2, possessive: 1 }, otherFamilies: 0.2, coinedRate: 0.15, register: { lofty: 1.6, archaic: 1.3, technical: 0.3 } },
  { id: 'poetic', label: 'Poetic', familyWeights: { prepositional: 3, sentence: 2.5, duo: 1.5, triad: 1.2, couplet: 1.2, 'of-phrase': 1.2, alliterative: 1.2 }, otherFamilies: 0.2, coinedRate: 0.05, register: { lofty: 1.3, technical: 0.4 } },
  { id: 'brandable', label: 'Brandable', familyWeights: { coined: 4, compound: 3, single: 1, pair: 0.3 }, otherFamilies: 0.05, maxWords: 2, coinedRate: 0.6, brandLetters: [5, 9] },
  { id: 'evocative', label: 'Evocative', familyWeights: { pair: 2.5, duo: 2, 'adj-noun': 1.2, 'of-phrase': 1.2, sentence: 1 }, otherFamilies: 0.3, coinedRate: 0.05 },
  { id: 'compound', label: 'Compound Word', familyWeights: { compound: 5, kenning: 1.5, place: 1 }, otherFamilies: 0.15, maxWords: 2, coinedRate: 0 },
  { id: 'invented', label: 'Invented Word', familyWeights: { coined: 6, suffix: 0.5 }, otherFamilies: 0.02, maxWords: 2, coinedRate: 1 },
  { id: 'ancient', label: 'Ancient / Mythic', familyWeights: { 'of-phrase': 2.5, saga: 2, epithet: 2, frame: 1.5, kenning: 1.5, 'the-noun': 1 }, otherFamilies: 0.25, coinedRate: 0.25, register: { archaic: 2, lofty: 1.4, technical: 0.2, plain: 0.7 } },
  { id: 'modern', label: 'Modern', familyWeights: { 'adj-noun': 1.5, pair: 2, number: 2, code: 1.5, single: 1.5, sentence: 1 }, otherFamilies: 0.25, coinedRate: 0.05, register: { archaic: 0.3, lofty: 0.6, plain: 1.5, technical: 1.2 } },
  { id: 'cryptic', label: 'Cryptic', familyWeights: { single: 3, number: 2, code: 2, imperative: 1, 'the-noun': 1 }, otherFamilies: 0.15, maxWords: 3, coinedRate: 0.1, register: { plain: 1.2 } },
  { id: 'descriptive', label: 'Descriptive', familyWeights: { descriptive: 5, place: 1.5, suffix: 1.5 }, otherFamilies: 0.15, coinedRate: 0 },
  { id: 'subtitle', label: 'Subtitle-heavy', familyWeights: { subtitle: 8 }, otherFamilies: 0.02, coinedRate: 0.25 },
  { id: 'franchise', label: 'Franchise-style', familyWeights: { suffix: 4, subtitle: 3, frame: 1 }, otherFamilies: 0.1, coinedRate: 0.3 },
];
```

- [ ] **Step 2: Guards and known titles**

`packages/game-titles/src/guards.ts`:
```ts
/** Franchise names and setting terms that engine output must never contain (all contexts). Normalised. */
export const FRANCHISE_TERMS: readonly string[] = [
  'pokemon', 'pocket monsters', 'digimon', 'zelda', 'hyrule', 'skyrim', 'tamriel', 'warcraft', 'azeroth', 'starcraft',
  'diablo', 'elden ring', 'dark souls', 'bloodborne', 'sekiro', 'final fantasy', 'kingdom hearts', 'mass effect',
  'dragon age', 'witcher', 'fallout', 'bioshock', 'minecraft', 'terraria', 'stardew', 'animal crossing', 'metroid',
  'castlevania', 'hollow knight', 'baldurs gate', "baldur's gate", 'forgotten realms', 'dungeons and dragons',
  'beholder', 'mind flayer', 'middle-earth', 'middle earth', 'mordor', 'gondor', 'rohan', 'rivendell', 'lothlorien',
  'hobbit', 'sauron', 'gandalf', 'mithril', 'warhammer', 'sigmar', 'arrakis', 'sardaukar', 'jedi', 'sith', 'wookiee',
  'klingon', 'neuromancer', 'night city', 'harvest moon', 'story of seasons', 'red dead', 'frostpunk',
  'monster rancher', 'assassins creed', 'god of war', 'okami', 'wukong',
];
```

`packages/game-titles/src/known-titles.ts`:
```ts
import { normalize } from '@vps-name-tools/core';

/**
 * Famous game titles. An exact (normalised) match is never produced. Task 22 grows this list to 1,500+
 * from public best-seller and notable-game lists; titles are facts, not creative content.
 */
const TITLES: readonly string[] = [
  'Dark Souls', 'Elden Ring', 'Hollow Knight', 'Hades', 'Hades II', 'Celeste', 'Stardew Valley', 'Minecraft', 'Terraria',
  'Fallout', 'Skyrim', 'Frostpunk', 'Bloodborne', 'Sekiro', 'Halo', 'Doom', 'Quake', 'Portal', 'Braid', 'Limbo', 'Inside',
  'Journey', 'Okami', 'Undertale', 'Cuphead', 'Dead Cells', 'Slay the Spire', 'Balatro', 'Spiritfarer', 'Outer Wilds',
  'Disco Elysium', 'Subnautica', 'Valheim', 'RimWorld', 'Factorio', 'Cities: Skylines', 'Civilization', 'Starfield',
  'Mass Effect', 'Dragon Age', 'The Witcher', 'Cyberpunk 2077', 'Death Stranding', 'Ghost of Tsushima', 'God of War',
  'Horizon Zero Dawn', 'The Last of Us', 'Red Dead Redemption', 'Animal Crossing', 'Final Fantasy', 'Kingdom Hearts',
  'Dead Space', 'Silent Hill', 'Resident Evil', 'Alan Wake', 'Control', 'Returnal', 'Tunic', 'Gris',
  'Ori and the Blind Forest', 'Hyper Light Drifter', 'Darkest Dungeon', 'Into the Breach', 'Ashfall', 'Frostbound',
];

export const KNOWN_TITLES: ReadonlySet<string> = new Set(TITLES.map(normalize));
```

- [ ] **Step 3: Genre framework with the Fantasy preset**

`packages/game-titles/src/genres/fantasy.ts`:
```ts
import type { GenrePreset } from '../types';

export const FANTASY: GenrePreset = {
  id: 'fantasy', label: 'Fantasy', group: 'Fantasy & RPG', noteLabel: 'fantasy',
  conceptBoosts: { crown: 2, realm: 2, oath: 1.6, relic: 1.6, magic: 1.6, dragon: 1.5, blade: 1.5, ancient: 1.4, legend: 1.3, forest: 1.3 },
  familyWeights: { 'of-phrase': 1.5, 'the-noun': 1.2, subtitle: 1.3, compound: 1.2, frame: 1.2, epithet: 1.5 },
  defaultTones: ['epic', 'mystical'],
  lengthBias: { one: 0.5, short: 0.7, medium: 0.9, long: 0.5 },
  frameWords: ['Chronicles', 'Tales', 'Legend', 'Song'],
  suffixWords: [{ text: 'Saga', cliche: 0.6 }, { text: 'Legends', cliche: 0.7 }, { text: 'Chronicles', cliche: 0.7 }],
  profile: 'neutral',
};
```

`packages/game-titles/src/genres/index.ts`:
```ts
import { FANTASY } from './fantasy';
import type { GenrePreset } from '../types';

/** All 31 presets are added in Task 22, in GENRE_IDS order. */
export const GENRES: readonly GenrePreset[] = [FANTASY];
```

`packages/game-titles/src/game.ts`:
```ts
import { FRANCHISE_TERMS } from './guards';
import { GENRES } from './genres/index';
import { KNOWN_TITLES } from './known-titles';
import { STYLES } from './styles';
import { TEMPLATES } from './templates';
import { VOCAB } from './vocab';
import type { GameData } from './types';

export const GAME: GameData = {
  genres: GENRES, styles: STYLES, templates: TEMPLATES, vocab: VOCAB, knownTitles: KNOWN_TITLES, franchiseTerms: FRANCHISE_TERMS,
};
```

`packages/game-titles/src/validate-game.ts`:
```ts
import { isAscii, normalize } from '@vps-name-tools/core';
import { PROFILE_IDS, TONE_IDS, type DataBundle, type Issue } from '@vps-name-tools/data';
import { GENRE_IDS, STYLE_IDS, TEMPLATE_FAMILIES } from './ids';
import type { GameData, VocabItem } from './types';

export const KNOWN_TITLES_TARGET = 1500;

export function validateGameData(game: GameData, data: DataBundle, opts: { release?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const error = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const target = (where: string, message: string) => issues.push({ level: opts.release ? 'error' : 'warning', where, message });
  const concepts = new Set(data.concepts.map(c => c.id));
  const families = TEMPLATE_FAMILIES as readonly string[];

  const ids = new Set<string>();
  for (const g of game.genres) {
    const where = `genre:${g.id}`;
    if (ids.has(g.id)) error(where, 'duplicate genre');
    ids.add(g.id);
    if (g.parent && !game.genres.some(x => x.id === g.parent)) error(where, `parent "${g.parent}" is missing`);
    for (const c of [...Object.keys(g.conceptBoosts), ...(g.suppress ?? [])]) if (!concepts.has(c)) error(where, `unknown concept "${c}"`);
    if (g.defaultTones.length === 0) error(where, 'needs at least one default tone');
    for (const t of g.defaultTones) if (!(TONE_IDS as readonly string[]).includes(t)) error(where, `unknown tone "${t}"`);
    for (const f of Object.keys(g.familyWeights)) if (!families.includes(f)) error(where, `unknown family "${f}"`);
    if (!(PROFILE_IDS as readonly string[]).includes(g.profile)) error(where, `unknown profile "${g.profile}"`);
    for (const fw of g.frameWords ?? []) if (!game.vocab.frames.some(v => v.text === fw)) error(where, `frame word "${fw}" is not in the vocabulary`);
    for (const e of g.entries ?? []) {
      if (!e.id.startsWith(`genre.${g.id}.`)) error(where, `entry id "${e.id}" must start with "genre.${g.id}."`);
      for (const c of e.concepts) if (!concepts.has(c)) error(where, `entry "${e.id}" has unknown concept "${c}"`);
    }
  }
  for (const id of GENRE_IDS) if (!ids.has(id)) target('genres', `genre "${id}" is missing`);

  if (game.styles.length !== STYLE_IDS.length) error('styles', `expected ${STYLE_IDS.length} styles`);
  for (const s of game.styles) for (const f of Object.keys(s.familyWeights)) if (!families.includes(f)) error(`style:${s.id}`, `unknown family "${f}"`);
  if (game.templates.length !== 35) error('templates', 'expected 35 templates');
  for (const t of data.tones) for (const f of Object.keys(t.familyWeights)) if (!families.includes(f)) error(`tone:${t.id}`, `unknown family "${f}"`);
  for (const m of data.myths) for (const f of Object.keys(m.rhythm)) if (!families.includes(f)) error(`myth:${m.id}`, `unknown rhythm family "${f}"`);

  const v = game.vocab;
  const items: VocabItem[] = [...v.frames, ...v.frameSuffixes, ...v.franchiseSuffixes, ...v.numbers, ...v.ordinals, ...v.digits, ...v.preps, ...v.predicates, ...v.epithets];
  for (const item of items) {
    if (!isAscii(item.text)) error(`vocab:${item.text}`, 'must be ASCII');
    for (const c of item.concepts ?? []) if (!concepts.has(c)) error(`vocab:${item.text}`, `unknown concept "${c}"`);
  }
  for (const t of game.knownTitles) if (t !== normalize(t) || !t) error(`known:${t}`, 'known titles must be normalised and non-empty');
  if (game.knownTitles.size < KNOWN_TITLES_TARGET) target('knownTitles', `${game.knownTitles.size} known titles; target ${KNOWN_TITLES_TARGET}`);
  return issues;
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './styles';
export * from './guards';
export * from './known-titles';
export * from './genres/index';
export * from './game';
export * from './validate-game';
```

Update `scripts/validate-data.ts` to validate game data and franchise terms in the lexicon:
```ts
import { DATA, validateData, type Issue } from '@vps-name-tools/data';
import { FRANCHISE_TERMS, GAME, validateGameData } from '@vps-name-tools/game-titles';

const release = process.argv.includes('--release');
const issues: Issue[] = [
  ...validateData(DATA, { release, bannedTerms: FRANCHISE_TERMS }),
  ...validateGameData(GAME, DATA, { release }),
];
for (const i of issues) console.log(`${i.level.toUpperCase().padEnd(7)} ${i.where}: ${i.message}`);
const errors = issues.filter(i => i.level === 'error').length;
console.log(`\n${errors} error(s), ${issues.length - errors} warning(s)${release ? ' (release mode)' : ''}`);
process.exit(errors > 0 ? 1 : 0);
```

- [ ] **Step 4: Mini game fixture**

`packages/game-titles/test/fixtures/mini-game.ts`:
```ts
import { FRANCHISE_TERMS, STYLES, TEMPLATES, VOCAB, type GameData, type GenrePreset } from '../../src/index';

export const MINI_GENRES: readonly GenrePreset[] = [
  {
    id: 'fantasy', label: 'Fantasy', group: 'Fantasy & RPG', noteLabel: 'fantasy',
    conceptBoosts: { crown: 2, realm: 2, oath: 1.6, star: 1.4, gods: 1.4 },
    familyWeights: { 'of-phrase': 1.4, subtitle: 1.2 }, defaultTones: ['epic'],
    lengthBias: { one: 0.5, short: 0.6, medium: 0.8, long: 0.5 },
    frameWords: ['Chronicles', 'Tales'], suffixWords: [{ text: 'Saga', cliche: 0.6 }, { text: 'Legends', cliche: 0.7 }], profile: 'neutral',
  },
  {
    id: 'dark-fantasy', label: 'Dark Fantasy', group: 'Fantasy & RPG', parent: 'fantasy', noteLabel: 'dark-fantasy',
    conceptBoosts: { ruin: 2.2, blood: 2, death: 1.8, fire: 1.5 },
    familyWeights: { pair: 1.3, compound: 1.3 }, defaultTones: ['grim'],
    lengthBias: { one: 0.7, short: 0.8, medium: 0.6, long: 0.3 }, profile: 'neutral',
  },
  {
    id: 'cozy', label: 'Cozy', group: 'Cozy & Life', noteLabel: 'cozy',
    conceptBoosts: { home: 2.4, warmth: 2.2, garden: 2, bloom: 1.8, friendship: 2, island: 1.4 },
    suppress: ['death', 'war', 'blood', 'dread'],
    familyWeights: { place: 2, possessive: 1.6, duo: 1.4, descriptive: 1.2 }, defaultTones: ['cozy'],
    lengthBias: { one: 0.5, short: 0.8, medium: 0.7, long: 0.2 },
    suffixWords: [{ text: 'Days' }, { text: 'Friends' }], profile: 'soft', guard: { blockSuffixes: ['mon'] },
  },
];

export const MINI_GAME: GameData = {
  genres: MINI_GENRES, styles: STYLES, templates: TEMPLATES, vocab: VOCAB,
  knownTitles: new Set(['ashfall', 'frostbound', 'dark souls']), franchiseTerms: FRANCHISE_TERMS,
};
```

- [ ] **Step 5: Write the failing tests**

`packages/game-titles/test/game-data.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '@vps-name-tools/data';
import { GAME, STYLES, STYLE_IDS, KNOWN_TITLES, FRANCHISE_TERMS, validateGameData } from '../src/index';

test('there are 13 styles in spec order', () => {
  assert.deepEqual(STYLES.map(s => s.id), [...STYLE_IDS]);
});

test('the real game data has no errors against the real concept registry', () => {
  assert.deepEqual(validateGameData(GAME, DATA).filter(i => i.level === 'error'), []);
});

test('known titles are normalised', () => {
  assert.ok(KNOWN_TITLES.has('dark souls'));
  assert.ok(KNOWN_TITLES.has('cities skylines'));
});

test('franchise terms are lowercase', () => {
  for (const t of FRANCHISE_TERMS) assert.equal(t, t.toLowerCase());
});

test('unknown genre concepts are errors', () => {
  const bad = { ...GAME, genres: [{ ...GAME.genres[0], conceptBoosts: { nonsense: 2 } }] };
  assert.ok(validateGameData(bad, DATA).some(i => i.level === 'error' && i.message.includes('unknown concept "nonsense"')));
});
```

- [ ] **Step 6: Run to verify failure, then pass**

Run: `npx tsx --test packages/game-titles/test/game-data.test.ts`
Expected before the files exist: FAIL on missing exports. After: PASS (5 tests).

Run: `npm run validate:data`
Expected: `0 error(s)`; warnings list the missing genres, packs and content targets.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add naming styles, guards, known titles, genre framework and game-data validation"
```

---

### Task 13: Generation context

**Files:**
- Create: `packages/game-titles/src/context.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/context.test.ts`

**Interfaces:**
- Consumes: core (`parseThemes`, `parseAvoid`, `violatesAvoid`, `temper`, `normalize`, `sanitizeInput`, `titleCase`, `pluralize`, `lemmaCandidates`, types), data (`buildSteeringIndex`, types), Tasks 10–12.
- Produces:
  - `type LexSlot = 'noun' | 'nounPl' | 'adj' | 'verb' | 'abstract' | 'placeWord' | 'compoundHead' | 'compoundTail' | 'placeTail'`
  - `type VocabSlot = 'frame' | 'frameSuffix' | 'genreSuffix' | 'number' | 'ordinal' | 'digits' | 'prep' | 'predicate' | 'epithet'`
  - `type Source = 'core' | 'genre' | 'myth' | 'symbolic'`
  - `interface Choice { entry: LexEntry; text: string; source: Source }`, `interface VocabChoice { text: string; concepts: readonly string[]; cliche: number }`, `interface IncludeSpec { text: string; norm: string; role: PhraseRole; entry?: LexEntry }`
  - `interface Context` (fields listed in the code below)
  - `buildContext(settings: Settings, data: DataBundle, game: GameData, rng?: Rng): Context`
  - `slotForRole(types: readonly SlotType[], role: PhraseRole): SlotType | undefined`
  - `lengthWeight(t: Template, length: LengthOption, bias: LengthBias): number`
  - `steeringIndexFor(data: DataBundle, game: GameData): SteeringIndex`

Weighting follows spec §9.4. Concept boosts multiply genre (parent at half strength) → cultural pack (and its blend) → tones (second tone at half strength) → the user's themes last, so the user's identity wins. Words that match no boosted concept get the creativity `baseline` weight. Suppressed concepts (Cozy suppresses violence) drop to zero unless the user typed them.

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/context.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import { buildContext, normalizeSettings, type Context, type Settings } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}): Context =>
  buildContext(normalizeSettings({ ...patch }), MINI, MINI_GAME, createRng('ctx'));

test('genre, myth and user boosts combine and the user word dominates', () => {
  const c = ctx({ genre: 'dark-fantasy', myth: 'norse', themes: 'lantern' });
  assert.ok((c.boost.get('ruin') ?? 1) > 1);
  assert.ok((c.boost.get('cold') ?? 1) > 1);
  const nouns = c.pools.get('noun')!;
  const lantern = nouns.find(w => w.item.entry.id === 'lantern')!;
  const tide = nouns.find(w => w.item.entry.id === 'tide')!;
  assert.ok(lantern.weight > tide.weight * 5, `${lantern.weight} vs ${tide.weight}`);
});

test('Cozy suppresses violent concepts unless the user asks for them', () => {
  assert.ok(!ctx({ genre: 'cozy' }).pools.get('noun')!.some(w => w.item.entry.id === 'blood'));
  assert.ok(ctx({ genre: 'cozy', themes: 'blood' }).pools.get('noun')!.some(w => w.item.entry.id === 'blood'));
});

test('Avoid words are removed from word pools', () => {
  const c = ctx({ avoid: 'frost' });
  assert.ok(!c.pools.get('noun')!.some(w => w.item.text === 'Frost'));
  assert.ok(!(c.pools.get('compoundHead') ?? []).some(w => w.item.text === 'Frost'));
});

test('an Include word that is also avoided blocks generation with a notice', () => {
  const c = ctx({ include: 'Ash', avoid: 'ash' });
  assert.equal(c.blocked, true);
  assert.equal(c.notices[0]?.code, 'include-conflicts-avoid');
});

test('one-word length keeps only one-word templates', () => {
  const c = ctx({ length: 'one' });
  assert.ok(c.templates.length > 0);
  assert.ok(c.templates.every(t => t.item.words[1] === 1));
});

test('the phonetic profile follows the cultural pack, or the genre when None', () => {
  assert.equal(ctx({ genre: 'cozy' }).profile.id, 'soft');
  assert.equal(ctx({ myth: 'norse' }).profile.id, 'norse');
  assert.equal(ctx({}).profile.id, 'neutral');
});

test('templates without a head slot for the Include word are dropped', () => {
  const c = ctx({ include: 'Aeternum' });
  assert.ok(!c.templates.some(t => t.item.id === 'T03'));
  assert.ok(c.templates.some(t => t.item.id === 'T22'));
});

test('mass nouns stay out of plural slots', () => {
  assert.ok(!ctx({}).pools.get('nounPl')!.some(w => w.item.entry.id === 'iron'));
});

test('a tone can set the sound profile when the cultural option is None', () => {
  const tones = MINI.tones.map(t => (t.id === 'cozy' ? { ...t, soundProfile: 'soft' as const, maxCoinedLetters: 8 } : t));
  const c = buildContext(normalizeSettings({ genre: 'fantasy', tone: 'cozy' }), { ...MINI, tones }, MINI_GAME, createRng('ctx'));
  assert.equal(c.profile.id, 'soft');
  assert.deepEqual(c.coinedLetters, [3, 8]);
});

test('Norse rhythm lifts kennings', () => {
  const kenning = (c: Context) => c.templates.find(t => t.item.id === 'T30')?.weight ?? 0;
  assert.ok(kenning(ctx({ myth: 'norse' })) > kenning(ctx({})) * 5);
});

test('typed words lift the cliché penalty for matching frames', () => {
  const frame = (c: Context) => c.vocab.get('frame')!.find(w => w.item.text === 'Echoes')!;
  assert.ok(frame(ctx({ themes: 'echoes' })).weight > frame(ctx({})).weight);
  assert.equal(frame(ctx({ themes: 'echoes' })).item.cliche, 0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/context.test.ts`
Expected: FAIL (`buildContext` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/context.ts`:
```ts
import {
  lemmaCandidates, normalize, parseAvoid, parseThemes, pluralize, sanitizeInput, temper, titleCase, violatesAvoid,
  type AvoidRule, type PhoneticProfile, type PhraseRole, type Rng, type SteeringIndex, type ThemeProfile, type Weighted,
} from '@vps-name-tools/core';
import { buildSteeringIndex, type DataBundle, type LexEntry, type MythPack, type ToneDef } from '@vps-name-tools/data';
import { CREATIVITY, type CreativityParams, type Settings } from './settings';
import type { LengthOption, SlotType } from './ids';
import type { GameData, GenrePreset, LengthBias, Notice, StyleDef, Template, VocabItem } from './types';

export type LexSlot = 'noun' | 'nounPl' | 'adj' | 'verb' | 'abstract' | 'placeWord' | 'compoundHead' | 'compoundTail' | 'placeTail';
export type VocabSlot = 'frame' | 'frameSuffix' | 'genreSuffix' | 'number' | 'ordinal' | 'digits' | 'prep' | 'predicate' | 'epithet';
export type Source = 'core' | 'genre' | 'myth' | 'symbolic';

export interface Choice { readonly entry: LexEntry; readonly text: string; readonly source: Source }
export interface VocabChoice { readonly text: string; readonly concepts: readonly string[]; readonly cliche: number }
export interface IncludeSpec { readonly text: string; readonly norm: string; readonly role: PhraseRole; readonly entry?: LexEntry }

export interface Context {
  readonly settings: Settings;
  readonly params: CreativityParams;
  readonly genre: GenrePreset;
  readonly genreChain: readonly { readonly preset: GenrePreset; readonly weight: number }[];
  readonly myth: MythPack;
  readonly mythChain: readonly { readonly pack: MythPack; readonly weight: number }[];
  readonly style?: StyleDef;
  readonly tones: readonly { readonly def: ToneDef; readonly weight: number }[];
  readonly theme: ThemeProfile;
  readonly include?: IncludeSpec;
  readonly avoid: readonly AvoidRule[];
  readonly boost: ReadonlyMap<string, number>;
  readonly userConcepts: ReadonlySet<string>;
  readonly related: ReadonlyMap<string, readonly string[]>;
  readonly pools: ReadonlyMap<LexSlot, readonly Weighted<Choice>[]>;
  readonly flatPools: ReadonlyMap<LexSlot, readonly Choice[]>;
  readonly vocab: ReadonlyMap<VocabSlot, readonly Weighted<VocabChoice>[]>;
  readonly templates: readonly Weighted<Template>[];
  readonly familiesAvailable: number;
  readonly anchors: readonly Weighted<string>[];
  readonly profile: PhoneticProfile;
  /** Letter range for invented words: the style's brand range, else the primary tone's cap. */
  readonly coinedLetters?: readonly [number, number];
  /** Chance that a name slot becomes an invented word. */
  readonly coinedRate: number;
  /** Largest share of a batch that may be invented words. */
  readonly coinedCap: number;
  readonly liftedCliches: ReadonlySet<string>;
  readonly alliterationBonus: number;
  readonly maxBoost: number;
  readonly entryById: ReadonlyMap<string, LexEntry>;
  readonly symbolicIds: ReadonlySet<string>;
  readonly data: DataBundle;
  readonly game: GameData;
  readonly notices: readonly Notice[];
  readonly blocked: boolean;
  entryRelevance(entry: LexEntry): number;
  conceptLabel(id: string): string;
}

const SOURCE_BONUS: Readonly<Record<Source, number>> = { core: 1, genre: 2, myth: 2.5, symbolic: 0.6 };

const ROLE_SLOTS: Readonly<Record<PhraseRole, readonly SlotType[]>> = {
  name: ['name', 'place', 'coined', 'noun'],
  noun: ['noun', 'nounPl', 'name'],
  adj: ['adj', 'abstract'],
  gerund: ['adj'],
};

export function slotForRole(types: readonly SlotType[], role: PhraseRole): SlotType | undefined {
  return ROLE_SLOTS[role].find(t => types.includes(t));
}

const indexCache = new WeakMap<DataBundle, WeakMap<GameData, SteeringIndex>>();
export function steeringIndexFor(data: DataBundle, game: GameData): SteeringIndex {
  let byGame = indexCache.get(data);
  if (!byGame) {
    byGame = new WeakMap();
    indexCache.set(data, byGame);
  }
  let index = byGame.get(game);
  if (!index) {
    index = buildSteeringIndex(data, game.genres.flatMap(g => g.entries ?? []));
    byGame.set(game, index);
  }
  return index;
}

function classOf(t: Template): keyof LengthBias {
  const [lo, hi] = t.words;
  if (hi === 1) return 'one';
  if (t.family === 'subtitle' || lo >= 4) return 'long';
  if (hi <= 2) return 'short';
  return 'medium';
}

export function lengthWeight(t: Template, length: LengthOption, bias: LengthBias): number {
  const [lo, hi] = t.words;
  switch (length) {
    case 'one': return hi === 1 ? 1 : 0;
    case 'short': return lo <= 2 && t.family !== 'subtitle' ? 1 : 0;
    case 'medium': return hi >= 2 && lo <= 4 && t.family !== 'subtitle' ? 1 : 0;
    case 'long': return hi >= 4 || t.family === 'subtitle' ? 1 : 0;
    case 'any': return 0.5 + bias[classOf(t)];
  }
}

const usable = (m: MythPack | undefined): m is MythPack => !!m && m.review.status !== 'held';

function chainGenres(all: readonly GenrePreset[], genre: GenrePreset) {
  const chain = [{ preset: genre, weight: 1 }];
  let current = genre;
  let weight = 1;
  while (current.parent && chain.length < 4) {
    const parent = all.find(g => g.id === current.parent);
    if (!parent || chain.some(c => c.preset.id === parent.id)) break;
    weight /= 2;
    chain.push({ preset: parent, weight });
    current = parent;
  }
  return chain;
}

function chainMyths(all: readonly MythPack[], myth: MythPack, crossMyth: number, rng?: Rng) {
  const chain = [{ pack: myth, weight: 1 }];
  for (const b of myth.blend ?? []) {
    const pack = all.find(m => m.id === b.id);
    if (usable(pack)) chain.push({ pack, weight: b.weight });
  }
  if (myth.id === 'original' && crossMyth > 0 && rng) {
    const tierA = all.filter(m => m.tier === 'A' && usable(m));
    for (let i = 0; i < 2 && tierA.length > 0; i++) chain.push({ pack: tierA.splice(Math.floor(rng() * tierA.length), 1)[0], weight: crossMyth });
  }
  return chain;
}

function resolveTones(s: Settings, genre: GenrePreset, all: readonly ToneDef[]) {
  const find = (id: string | undefined) => (id ? all.find(t => t.id === id) : undefined);
  const primary = find(s.tone === 'auto' ? genre.defaultTones[0] : s.tone);
  const secondary = find(s.tone2 !== 'none' ? s.tone2 : s.tone === 'auto' ? genre.defaultTones[1] : undefined);
  const out: { def: ToneDef; weight: number }[] = [];
  if (primary) out.push({ def: primary, weight: 1 });
  if (secondary && secondary.id !== primary?.id) out.push({ def: secondary, weight: 0.5 });
  return out;
}

function resolveInclude(raw: string, index: SteeringIndex, entryById: ReadonlyMap<string, LexEntry>): IncludeSpec | undefined {
  const text = sanitizeInput(raw, 40).trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  const norm = normalize(text);
  const id = index.lexicon.get(norm)?.[0];
  const entry = id ? entryById.get(id) : undefined;
  const single = !text.includes(' ');
  const role: PhraseRole = single && entry?.pos.includes('noun') ? 'noun' : single && entry?.pos.includes('adj') ? 'adj' : 'name';
  return { text: text === text.toLowerCase() ? titleCase(text) : text, norm, role, entry };
}

export function buildContext(settings: Settings, data: DataBundle, game: GameData, rng?: Rng): Context {
  const notices: Notice[] = [];
  const params = CREATIVITY[settings.creativity];
  const genre = game.genres.find(g => g.id === settings.genre) ?? game.genres[0];
  const genreChain = chainGenres(game.genres, genre);
  const none = data.myths.find(m => m.id === 'none');
  if (!none) throw new Error('The "none" cultural pack is required');
  const chosen = data.myths.find(m => m.id === settings.myth);
  const myth = usable(chosen) ? chosen : none;
  const mythChain = chainMyths(data.myths, myth, params.crossMyth, rng);
  const style = settings.style === 'auto' ? undefined : game.styles.find(s => s.id === settings.style);
  const tones = resolveTones(settings, genre, data.tones);
  const index = steeringIndexFor(data, game);
  const theme = parseThemes(settings.themes, index);
  const avoid = parseAvoid(settings.avoid);

  const sources: { entry: LexEntry; source: Source; weight: number }[] = [
    ...data.lexicon.map(entry => ({ entry, source: 'core' as const, weight: 1 })),
    ...genreChain.flatMap(({ preset, weight }) => (preset.entries ?? []).map(entry => ({ entry, source: 'genre' as const, weight }))),
    ...mythChain.flatMap(({ pack, weight }) => [
      ...pack.imagery.map(entry => ({ entry, source: 'myth' as const, weight })),
      ...pack.symbolic.map(entry => ({ entry, source: 'symbolic' as const, weight })),
    ]),
  ];
  const entryById = new Map<string, LexEntry>();
  for (const e of [...data.lexicon, ...data.myths.flatMap(m => [...m.imagery, ...m.symbolic]), ...game.genres.flatMap(g => g.entries ?? [])]) entryById.set(e.id, e);
  const symbolicIds = new Set(mythChain.flatMap(({ pack }) => pack.symbolic.map(e => e.id)));

  const include = resolveInclude(settings.include, index, entryById);
  let blocked = false;
  if (include && violatesAvoid(include.text, [include.text], avoid)) {
    blocked = true;
    notices.push({ code: 'include-conflicts-avoid', message: 'Your Include word is also on your Avoid list. Remove it from one of them to generate titles.' });
  }
  if (include && settings.length === 'one' && include.text.includes(' ')) {
    notices.push({ code: 'include-unusable', message: 'A multi-word Include word cannot fit one-word titles. Try Any or Short length.' });
  }

  const boost = new Map<string, number>();
  const mul = (c: string, v: number, w: number) => boost.set(c, (boost.get(c) ?? 1) * (1 + (v - 1) * w));
  for (const { preset, weight } of genreChain) for (const [c, v] of Object.entries(preset.conceptBoosts)) mul(c, v, weight);
  for (const { pack, weight } of mythChain) for (const [c, v] of Object.entries(pack.conceptBoosts)) mul(c, v, weight);
  for (const { def, weight } of tones) for (const [c, v] of Object.entries(def.conceptBoosts)) mul(c, v, weight);
  for (const [c, v] of theme.conceptBoosts) mul(c, v, 1);
  const userConcepts = new Set(theme.conceptBoosts.keys());
  const suppressed = new Set(genreChain.flatMap(g => g.preset.suppress ?? []).filter(c => !userConcepts.has(c)));
  for (const c of suppressed) boost.set(c, 0);
  const maxBoost = Math.max(2, ...boost.values());

  const liftedCliches = new Set<string>();
  for (const w of normalize(`${settings.themes} ${settings.include}`).split(/[\s-]+/)) {
    if (!w) continue;
    for (const form of [w, `${w}s`, ...lemmaCandidates(w)]) liftedCliches.add(form);
  }

  const namedFamilies = new Set<string>();
  for (const id of theme.entryBoosts.keys()) {
    const family = entryById.get(id)?.family;
    if (family) namedFamilies.add(family);
  }

  const entryRelevance = (e: LexEntry): number => {
    const named = theme.entryBoosts.has(e.id);
    let max = 0;
    for (const c of e.concepts) {
      if (suppressed.has(c) && !named) return 0;
      max = Math.max(max, boost.get(c) ?? 1);
    }
    if (named) return Math.max(max, 1);
    return max > 1 ? max : params.baseline;
  };

  const entryWeight = (e: LexEntry, source: Source): number => {
    const relevance = entryRelevance(e);
    if (relevance === 0) return 0;
    let w = relevance * SOURCE_BONUS[source];
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (e.tones?.[def.id] ?? 0) * 0.8 * weight);
    w *= style?.register?.[e.register] ?? 1;
    const named = theme.entryBoosts.get(e.id);
    if (named) w *= named;
    else if (e.family && namedFamilies.has(e.family)) w *= 1.5;
    const cliche = liftedCliches.has(normalize(e.text)) ? 0 : e.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };

  const pools = new Map<LexSlot, Weighted<Choice>[]>();
  const flatPools = new Map<LexSlot, Choice[]>();
  let nounsSeen = 0;
  let nounsAvoided = 0;
  const push = (slot: LexSlot, choice: Choice, weight: number) => {
    if (slot === 'noun') nounsSeen++;
    if (violatesAvoid(choice.text, [choice.text], avoid)) {
      if (slot === 'noun') nounsAvoided++;
      return;
    }
    if (!pools.has(slot)) {
      pools.set(slot, []);
      flatPools.set(slot, []);
    }
    pools.get(slot)!.push({ item: choice, weight });
    flatPools.get(slot)!.push(choice);
  };
  for (const { entry: e, source, weight: chainWeight } of sources) {
    const w = entryWeight(e, source) * chainWeight;
    if (w <= 0) continue;
    const make = (text: string): Choice => ({ entry: e, text, source });
    if (e.pos.includes('noun')) {
      push('noun', make(e.text), w);
      if (!e.mass) push('nounPl', make(e.forms?.plural ?? pluralize(e.text)), w);
      if (e.forms?.adj) push('adj', make(e.forms.adj), w);
    }
    if (e.pos.includes('adj')) push('adj', make(e.text), w);
    if (e.pos.includes('verb')) push('verb', make(e.text), w);
    if (e.pos.includes('abstract')) push('abstract', make(e.text), w);
    if (e.pos.includes('place')) push('placeWord', make(e.text), w);
    if (e.compound === 'head' || e.compound === 'both') push('compoundHead', make(e.text), w);
    if (e.compound === 'tail' || e.compound === 'both') push('compoundTail', make(e.text.toLowerCase()), w);
    if (e.placeTail) push('placeTail', make(e.text.toLowerCase()), w);
  }
  for (const [slot, list] of pools) pools.set(slot, temper(list, params.temperature));
  if (nounsSeen > 0 && nounsAvoided / nounsSeen > 0.5) notices.push({ code: 'pool-limited', message: 'Some options are limited by your Avoid list.' });

  const genreIds = new Set<string>(genreChain.map(g => g.preset.id));
  const frameWords = new Set(genreChain.flatMap(g => g.preset.frameWords ?? []));
  const vocabWeight = (v: VocabItem, slot: VocabSlot): number => {
    let w = 1;
    if (v.genres?.some(id => genreIds.has(id))) w *= 3;
    if (slot === 'frame' && frameWords.has(v.text)) w *= 3;
    if (v.concepts?.length) {
      let r = 0;
      for (const c of v.concepts) {
        const b = boost.get(c) ?? 1;
        if (b === 0) return 0;
        r = Math.max(r, b);
      }
      w *= r > 1 ? r : 0.6;
    }
    for (const { def, weight } of tones) w *= Math.max(0.1, 1 + (v.tones?.[def.id] ?? 0) * 0.8 * weight);
    const cliche = liftedCliches.has(normalize(v.text)) ? 0 : v.cliche ?? 0;
    return w * (1 - 0.6 * cliche);
  };
  const vocabPool = (items: readonly VocabItem[], slot: VocabSlot): Weighted<VocabChoice>[] =>
    temper(
      items
        .filter(v => !violatesAvoid(v.text, [v.text], avoid))
        .map(v => ({
          item: { text: v.text, concepts: v.concepts ?? [], cliche: liftedCliches.has(normalize(v.text)) ? 0 : v.cliche ?? 0 },
          weight: vocabWeight(v, slot),
        })),
      params.temperature,
    );
  const V = game.vocab;
  const genreSuffixes = genreChain.flatMap(g => g.preset.suffixWords ?? []);
  const wantsFranchise = style?.id === 'franchise' || tones.some(t => t.def.id === 'retro') || genreSuffixes.length === 0;
  const vocab = new Map<VocabSlot, Weighted<VocabChoice>[]>([
    ['frame', vocabPool(V.frames, 'frame')],
    ['frameSuffix', vocabPool(V.frameSuffixes, 'frameSuffix')],
    ['genreSuffix', vocabPool(wantsFranchise ? [...genreSuffixes, ...V.franchiseSuffixes] : genreSuffixes, 'genreSuffix')],
    ['number', vocabPool(V.numbers, 'number')],
    ['ordinal', vocabPool(V.ordinals, 'ordinal')],
    ['digits', vocabPool(V.digits, 'digits')],
    ['prep', vocabPool(V.preps, 'prep')],
    ['predicate', vocabPool(V.predicates, 'predicate')],
    ['epithet', vocabPool(V.epithets, 'epithet')],
  ]);

  const templateWeight = (t: Template): number => {
    if (style?.maxWords !== undefined && t.words[0] > style.maxWords) return 0;
    if (include && !t.variants.some(v => v.some(tok => tok.kind === 'slot' && tok.lock && slotForRole(tok.types, include.role)))) return 0;
    let w = t.base;
    for (const { preset, weight } of genreChain) w *= 1 + ((preset.familyWeights[t.family] ?? 1) - 1) * weight;
    if (style) w *= style.familyWeights[t.family] ?? style.otherFamilies;
    for (const { pack, weight } of mythChain) w *= 1 + ((pack.rhythm[t.family] ?? 1) - 1) * weight;
    for (const { def, weight } of tones) w *= 1 + ((def.familyWeights[t.family] ?? 1) - 1) * weight;
    if (t.rare) w *= params.rareTemplateBoost;
    return w * lengthWeight(t, settings.length, genre.lengthBias);
  };
  const templates = game.templates.map(t => ({ item: t, weight: templateWeight(t) })).filter(x => x.weight > 0);
  const familiesAvailable = new Set(templates.map(x => x.item.family)).size;

  const anchors = [...boost.entries()].filter(([, b]) => b > 1).map(([c, b]) => ({ item: c, weight: b * (userConcepts.has(c) ? 2 : 1) }));
  // Sound bias: a tone may choose the profile only when neither the cultural style nor the genre does.
  const profileId = myth.id !== 'none' ? myth.profile : genre.profile !== 'neutral' ? genre.profile : tones[0]?.def.soundProfile ?? 'neutral';
  const toneMax = tones[0]?.def.maxCoinedLetters;
  const coinedLetters: readonly [number, number] | undefined = style?.brandLetters ?? (toneMax ? [3, toneMax] : undefined);
  const profile = data.profiles.find(p => p.id === profileId) ?? data.profiles.find(p => p.id === 'neutral');
  if (!profile) throw new Error('The neutral phonetic profile is required');
  const coinedRate = Math.min(1, (style?.coinedRate ?? 0.2) * myth.coinedRate);
  const coinedCap = style?.id === 'invented' ? 1 : Math.min(1, Math.max(params.coinedCap, style?.coinedRate ?? 0) * myth.coinedRate);
  const alliterationBonus = tones.reduce((n, t) => n + (t.def.alliterationBonus ?? 0) * t.weight, 0);
  const related = new Map(data.concepts.map(c => [c.id, c.related] as const));
  const labels = new Map(data.concepts.map(c => [c.id, c.label] as const));

  return {
    settings, params, genre, genreChain, myth, mythChain, style, tones, theme, include, avoid, boost, userConcepts, related,
    pools, flatPools, vocab, templates, familiesAvailable, anchors, profile, coinedLetters, coinedRate, coinedCap, liftedCliches,
    alliterationBonus, maxBoost, entryById, symbolicIds, data, game, notices, blocked, entryRelevance,
    conceptLabel: id => labels.get(id) ?? id,
  };
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './context';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/context.test.ts && npm run typecheck`
Expected: PASS (11 tests); no type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add generation context with weighted pools and steering"
```

---

### Task 14: Filling templates and rendering titles

**Files:**
- Create: `packages/game-titles/src/render.ts`, `packages/game-titles/src/fill.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/fill.test.ts`

**Interfaces:**
- Consumes: Task 13 (`Context`, `Choice`, `slotForRole`, slot types), core (`coinWord`, `pickWeighted`, `shuffle`, `normalize`, `pluralize`, `titleCase`, `capitalizeFirst`, `unsafeGenerated`), data (`containsTerm`).
- Produces:
  - `renderRaw(parts): string`, `renderTitle(parts): string`, `joinCompound(head: string, tail: string): string`, `flattenParts(parts): RecipePart[]`, `morphemesOf(parts): string[]`, `engineWords(parts): string[]`
  - `interface FillOptions { anchor?: string; literal?: ThemePhrase; preset?: ReadonlyMap<number, RecipePart>; bias?: ReadonlySet<string>; headFilter?: (c: Choice) => boolean; seed?: string }`
  - `fillTemplate(ctx: Context, rng: Rng, template: Template, variant: number, opts?: FillOptions): Recipe | undefined`
  - `pickChoice(ctx, rng, slot: LexSlot, o: SlotFill): Choice | undefined`
  - `isBlockedEngineWord(ctx: Context, word: string, coined?: boolean): boolean` (invented words also fail when they start with a denylisted name of 4+ letters, so "Odinvald" is rejected while the compound "Thornfall" is not)

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/fill.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, normalizeSettings, fillTemplate, renderTitle, joinCompound, morphemesOf, TEMPLATES,
  type RecipePart, type Settings,
} from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}) => buildContext(normalizeSettings(patch), MINI, MINI_GAME, createRng('fill'));
const T = (id: string) => TEMPLATES.find(t => t.id === id)!;

test('renderTitle collapses spaces and title-cases', () => {
  const parts: RecipePart[] = [{ kind: 'literal', text: 'The ' }, { kind: 'literal', text: ' ' }, { kind: 'lex', index: 1, slot: 'noun', entryId: 'crown', text: 'Crown' }];
  assert.equal(renderTitle(parts), 'The Crown');
});

test('joinCompound joins, avoids tripled letters and hyphenates hard seams', () => {
  assert.equal(joinCompound('Frost', 'bound'), 'Frostbound');
  assert.equal(joinCompound('Storm', 'break'), 'Stormbreak');
  assert.equal(joinCompound('Hall', 'light'), 'Hall-Light');
});

test('the Include word goes into the head slot', () => {
  const c = ctx({ include: 'Aeternum' });
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`inc${i}`), T('T11'), 0);
    assert.ok(r);
    assert.match(renderTitle(r.parts), /of Aeternum$/);
  }
});

test('a theme phrase can be placed literally', () => {
  const c = ctx({ themes: 'raven' });
  const r = fillTemplate(c, createRng('lit'), T('T05'), 0, { literal: c.theme.phrases[0] });
  assert.ok(r);
  assert.ok(r.parts.some(p => p.kind === 'user' && p.text === 'Raven'));
});

test('a required slot with an empty pool fails cleanly', () => {
  const c = ctx({ avoid: '*a*, *e*, *i*, *o*, *u*' });
  assert.equal(fillTemplate(c, createRng('empty'), T('T05'), 0), undefined);
});

test('compound parts expose their morphemes', () => {
  const c = ctx({ genre: 'dark-fantasy' });
  const r = fillTemplate(c, createRng('cmp'), T('T03'), 0);
  assert.ok(r);
  const part = r.parts.find(p => p.kind === 'compound');
  assert.ok(part && part.kind === 'compound');
  assert.deepEqual(morphemesOf(r.parts), [...part.morphemes]);
});

test('alliterative templates alliterate', () => {
  const c = ctx({ myth: 'norse' });
  for (let i = 0; i < 20; i++) {
    const r = fillTemplate(c, createRng(`all${i}`), T('T35'), 0);
    if (!r) continue;
    const words = r.parts.filter(p => p.kind !== 'literal').map(p => p.text.toLowerCase());
    assert.equal(words[0][0], words[1][0], words.join(' & '));
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/fill.test.ts`
Expected: FAIL (`fillTemplate` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/render.ts`:
```ts
import { capitalizeFirst, titleCase } from '@vps-name-tools/core';
import type { RecipePart } from './types';

export function renderRaw(parts: readonly RecipePart[]): string {
  return parts.map(p => p.text).join('').replace(/\s+/g, ' ').replace(/\s+([,:])/g, '$1').trim();
}

export function renderTitle(parts: readonly RecipePart[]): string {
  return titleCase(renderRaw(parts));
}

/** Joins two morphemes; hyphenates when letters would triple or the seam is hard to read. */
export function joinCompound(head: string, tail: string): string {
  const h = head.replace(/\s+/g, '');
  const t = tail.toLowerCase().replace(/\s+/g, '');
  if (!t) return h;
  const end = h.slice(-2).toLowerCase();
  const tripled = end === t[0] + t[0] || (end[1] === t[0] && t[1] === t[0]);
  const hardSeam = /[^aeiouy]{5,}/.test(h.slice(-3).toLowerCase() + t.slice(0, 3));
  return tripled || hardSeam ? `${h}-${capitalizeFirst(t)}` : h + t;
}

export function flattenParts(parts: readonly RecipePart[]): RecipePart[] {
  return parts.flatMap(p => (p.kind === 'group' ? flattenParts(p.parts) : [p]));
}

/** Words and word parts for Avoid matching (compounds contribute both halves). */
export function morphemesOf(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => (p.kind === 'literal' ? [] : p.kind === 'compound' ? [...p.morphemes] : [p.text]));
}

/** Words the engine built itself (invented words and compounds), for substring safety checks. */
export function engineWords(parts: readonly RecipePart[]): string[] {
  return flattenParts(parts).flatMap(p => (p.kind === 'coined' || p.kind === 'compound' ? [p.text] : []));
}
```

`packages/game-titles/src/fill.ts`:
```ts
import { coinWord, normalize, pickWeighted, pluralize, shuffle, unsafeGenerated, type Rng, type ThemePhrase } from '@vps-name-tools/core';
import { containsTerm } from '@vps-name-tools/data';
import { slotForRole, type Choice, type Context, type LexSlot, type VocabSlot } from './context';
import { parsePattern } from './pattern';
import { joinCompound, renderRaw } from './render';
import type { SlotType } from './ids';
import type { PatternToken, Recipe, RecipePart, SlotToken, Template } from './types';

export interface FillOptions {
  readonly anchor?: string;
  readonly literal?: ThemePhrase;
  readonly preset?: ReadonlyMap<number, RecipePart>;
  readonly bias?: ReadonlySet<string>;
  readonly headFilter?: (c: Choice) => boolean;
  readonly seed?: string;
}

export interface SlotFill {
  readonly anchor?: string;
  readonly bias?: ReadonlySet<string>;
  readonly used: Set<string>;
  readonly letter?: string;
  readonly filter?: (c: Choice) => boolean;
}

const LEX_SLOTS = new Set<SlotType>(['noun', 'nounPl', 'adj', 'verb', 'abstract', 'placeWord']);
const subtitleCache = new WeakMap<readonly string[], readonly (readonly PatternToken[])[]>();

export function isBlockedEngineWord(ctx: Context, word: string, coined = false): boolean {
  const n = normalize(word);
  if (unsafeGenerated(word, [word], ctx.data.safety)) return true;
  if (ctx.game.knownTitles.has(n)) return true;
  const letters = n.replace(/[^a-z]/g, '');
  for (const { pack } of ctx.mythChain) {
    for (const d of pack.denylist) {
      if (containsTerm(n, d)) return true;
      const name = normalize(d).replace(/[^a-z]/g, '');
      if (coined && name.length >= 4 && letters.startsWith(name)) return true;
    }
  }
  for (const t of ctx.game.franchiseTerms) if (containsTerm(n, t)) return true;
  for (const { preset } of ctx.genreChain) for (const s of preset.guard?.blockSuffixes ?? []) if (n.endsWith(s)) return true;
  return false;
}

export function pickChoice(ctx: Context, rng: Rng, slot: LexSlot, o: SlotFill): Choice | undefined {
  const ok = (c: Choice) =>
    !o.used.has(c.entry.id) && !o.used.has(normalize(c.text)) &&
    (!o.letter || c.text.toLowerCase().startsWith(o.letter)) && (!o.filter || o.filter(c));
  if (!o.filter && rng() < ctx.params.wildcardRate) {
    const flat = (ctx.flatPools.get(slot) ?? []).filter(ok);
    if (flat.length > 0) return flat[Math.floor(rng() * flat.length)];
  }
  const related = o.anchor ? new Set(ctx.related.get(o.anchor) ?? []) : undefined;
  const weighted: { item: Choice; weight: number }[] = [];
  for (const w of ctx.pools.get(slot) ?? []) {
    const c = w.item;
    if (!ok(c)) continue;
    let k = w.weight;
    if (o.anchor) {
      if (c.entry.concepts.includes(o.anchor)) k *= 2;
      else if (related && c.entry.concepts.some(x => related.has(x))) k *= 1.4;
    }
    if (o.bias && c.entry.concepts.some(x => o.bias!.has(x))) k *= 2.5;
    weighted.push({ item: c, weight: k });
  }
  return pickWeighted(rng, weighted);
}

function pickVocab(ctx: Context, rng: Rng, slot: VocabSlot, o: SlotFill) {
  const weighted = (ctx.vocab.get(slot) ?? [])
    .filter(w => !o.used.has(normalize(w.item.text)))
    .map(w => ({ item: w.item, weight: o.anchor && w.item.concepts.includes(o.anchor) ? w.weight * 2 : w.weight }));
  return pickWeighted(rng, weighted);
}

function markUsed(used: Set<string>, p: RecipePart): void {
  switch (p.kind) {
    case 'literal':
      return;
    case 'lex':
      used.add(p.entryId);
      used.add(normalize(p.text));
      return;
    case 'compound':
      used.add(p.headId);
      used.add(p.tailId);
      used.add(normalize(p.text));
      return;
    case 'group':
      for (const q of p.parts) markUsed(used, q);
      return;
    default:
      used.add(normalize(p.text));
  }
}

function coinedPart(ctx: Context, rng: Rng, index: number, slot: SlotType): RecipePart | undefined {
  const letters = ctx.coinedLetters;
  const w = coinWord(rng, ctx.profile, {
    reject: word => isBlockedEngineWord(ctx, word, true),
    ...(letters ? { minLetters: letters[0], maxLetters: letters[1] } : {}),
  });
  return w && { kind: 'coined', index, slot, profile: w.profile, syllables: w.syllables, ending: w.ending, text: w.text };
}

function compoundPart(ctx: Context, rng: Rng, index: number, slot: SlotType, tailSlot: 'compoundTail' | 'placeTail', o: SlotFill): RecipePart | undefined {
  for (let attempt = 0; attempt < 6; attempt++) {
    const head = pickChoice(ctx, rng, 'compoundHead', o);
    if (!head) return undefined;
    const tail = pickChoice(ctx, rng, tailSlot, { ...o, used: new Set([...o.used, head.entry.id]) });
    if (!tail) return undefined;
    const text = joinCompound(head.text, tail.text);
    if (isBlockedEngineWord(ctx, text)) continue;
    return { kind: 'compound', index, slot, headId: head.entry.id, tailId: tail.entry.id, morphemes: [head.text, tail.text], text };
  }
  return undefined;
}

function coinedPlacePart(ctx: Context, rng: Rng, index: number, o: SlotFill): RecipePart | undefined {
  const root = coinWord(rng, ctx.profile, { minLetters: 3, maxLetters: 6, reject: w => isBlockedEngineWord(ctx, w, true) });
  const tail = root && pickChoice(ctx, rng, 'placeTail', o);
  if (!root || !tail) return undefined;
  const text = joinCompound(root.text, tail.text);
  if (isBlockedEngineWord(ctx, text)) return undefined;
  return { kind: 'coined', index, slot: 'place', profile: root.profile, syllables: root.syllables, ending: tail.text, text };
}

function subtitlePart(ctx: Context, rng: Rng, index: number, o: SlotFill): RecipePart | undefined {
  const patterns = ctx.game.vocab.subtitlePatterns;
  let parsed = subtitleCache.get(patterns);
  if (!parsed) {
    parsed = patterns.map(parsePattern);
    subtitleCache.set(patterns, parsed);
  }
  const tokens = parsed[Math.floor(rng() * parsed.length)];
  const parts: RecipePart[] = [];
  for (const tok of tokens) {
    if (tok.kind === 'literal') {
      parts.push({ kind: 'literal', text: tok.text });
      continue;
    }
    if (tok.optional && rng() < 0.45) continue;
    const p = fillSlot(ctx, rng, tok, o, -1);
    if (!p) {
      if (tok.optional) continue;
      return undefined;
    }
    parts.push(p);
    markUsed(o.used, p);
  }
  return { kind: 'group', index, slot: 'subtitle', parts, text: renderRaw(parts) };
}

function fillType(ctx: Context, rng: Rng, type: SlotType, index: number, o: SlotFill): RecipePart | undefined {
  if (LEX_SLOTS.has(type)) {
    const c = pickChoice(ctx, rng, type as LexSlot, o);
    return c && { kind: 'lex', index, slot: type, entryId: c.entry.id, text: c.text };
  }
  switch (type) {
    case 'compound':
      return compoundPart(ctx, rng, index, 'compound', 'compoundTail', o);
    case 'coined':
      return coinedPart(ctx, rng, index, 'coined');
    case 'name': {
      if (rng() < ctx.coinedRate) {
        const c = coinedPart(ctx, rng, index, 'name');
        if (c) return c;
      }
      const first = rng() < 0.5 ? 'placeTail' : 'compoundTail';
      const second = first === 'placeTail' ? 'compoundTail' : 'placeTail';
      return compoundPart(ctx, rng, index, 'name', first, o) ?? compoundPart(ctx, rng, index, 'name', second, o);
    }
    case 'place':
      return compoundPart(ctx, rng, index, 'place', 'placeTail', o) ?? (ctx.coinedRate > 0 ? coinedPlacePart(ctx, rng, index, o) : undefined);
    case 'subtitle':
      return subtitlePart(ctx, rng, index, o);
    default: {
      const v = pickVocab(ctx, rng, type as VocabSlot, o);
      return v && { kind: 'vocab', index, slot: type, text: v.text, cliche: v.cliche };
    }
  }
}

function fillSlot(ctx: Context, rng: Rng, tok: SlotToken, o: SlotFill, index = tok.index): RecipePart | undefined {
  for (const type of shuffle(rng, tok.types)) {
    const p = fillType(ctx, rng, type, index, o);
    if (p) return p;
  }
  return undefined;
}

function includePart(ctx: Context, index: number, slot: SlotType): RecipePart {
  const inc = ctx.include!;
  const text = slot === 'nounPl' && inc.entry ? inc.entry.forms?.plural ?? pluralize(inc.entry.text) : inc.text;
  return { kind: 'include', index, slot, text };
}

function userPart(ctx: Context, phrase: ThemePhrase, index: number, slot: SlotType): RecipePart {
  const entry = phrase.entryIds.length === 1 && !phrase.norm.includes(' ') ? ctx.entryById.get(phrase.entryIds[0]) : undefined;
  let text = phrase.display;
  if (entry) {
    if (slot === 'nounPl') text = entry.forms?.plural ?? pluralize(entry.text);
    else if (slot === 'noun' || slot === 'name') text = entry.text;
    else if (slot === 'adj') text = entry.pos.includes('adj') ? entry.text : entry.forms?.adj ?? entry.text;
  } else if (slot === 'nounPl' && !/s$/i.test(text)) {
    text = pluralize(text);
  }
  return { kind: 'user', index, slot, phrase: phrase.norm, text };
}

export function fillTemplate(ctx: Context, rng: Rng, template: Template, variant: number, opts: FillOptions = {}): Recipe | undefined {
  const tokens = template.variants[variant];
  if (!tokens) return undefined;
  const slots = tokens.filter((t): t is SlotToken => t.kind === 'slot');
  const headSlot = slots.find(s => s.lock)?.index ?? -1;
  const presetParts = [...(opts.preset?.values() ?? [])];

  let includeAt = -1;
  let includeType: SlotType | undefined;
  if (ctx.include && !presetParts.some(p => p.kind === 'include')) {
    for (const s of slots) {
      if (!s.lock || opts.preset?.has(s.index)) continue;
      const t = slotForRole(s.types, ctx.include.role);
      if (t) {
        includeAt = s.index;
        includeType = t;
        break;
      }
    }
    if (includeAt < 0) return undefined;
  }

  let literalAt = -1;
  let literalType: SlotType | undefined;
  if (opts.literal) {
    const literal = opts.literal;
    const options = slots
      .filter(s => s.index !== includeAt && !opts.preset?.has(s.index))
      .flatMap(s => {
        const t = slotForRole(s.types, literal.role);
        return t ? [{ s, t }] : [];
      });
    const locked = ctx.include ? [] : options.filter(x => x.s.lock);
    const from = locked.length > 0 ? locked : options;
    const choice = from[Math.floor(rng() * from.length)];
    if (choice) {
      literalAt = choice.s.index;
      literalType = choice.t;
    }
  }

  const used = new Set<string>();
  for (const p of presetParts) markUsed(used, p);
  const parts: RecipePart[] = [];
  let letter: string | undefined;
  for (const tok of tokens) {
    if (tok.kind === 'literal') {
      parts.push({ kind: 'literal', text: tok.text });
      continue;
    }
    const preset = opts.preset?.get(tok.index);
    let part: RecipePart | undefined = preset;
    if (!part && tok.index === includeAt && includeType) part = includePart(ctx, tok.index, includeType);
    if (!part && tok.index === literalAt && literalType && opts.literal) part = userPart(ctx, opts.literal, tok.index, literalType);
    if (!part) {
      if (tok.optional && rng() < 0.45) continue;
      part = fillSlot(ctx, rng, tok, {
        anchor: opts.anchor,
        bias: opts.bias,
        used,
        letter: template.alliterate ? letter : undefined,
        filter: tok.index === headSlot ? opts.headFilter : undefined,
      });
      if (!part) {
        if (tok.optional) continue;
        return undefined;
      }
    }
    if (!preset) markUsed(used, part);
    parts.push(part);
    if (template.alliterate && !letter) letter = part.text.charAt(0).toLowerCase();
  }
  return { templateId: template.id, variant, family: template.family, parts, headSlot, anchor: opts.anchor, seed: opts.seed ?? '' };
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './render';
export * from './fill';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/fill.test.ts && npm run typecheck`
Expected: PASS (7 tests); no type errors.

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add template filling, compounding and rendering"
```

---

### Task 15: Candidate constraints and scoring

**Files:**
- Create: `packages/game-titles/src/constraints.ts`, `packages/game-titles/src/score.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/constraints.test.ts`

**Interfaces:**
- Consumes: Tasks 13–14; core (`wordCount`, `contentWords`, `normalize`, `lemmaCandidates`, `violatesAvoid`, `unsafeGenerated`); data (`containsTerm`).
- Produces:
  - `type LengthClass = 'one' | 'short' | 'medium' | 'long'`, `MAX_TITLE_CHARS = 48`
  - `lengthClassOf(title: string): LengthClass`, `lengthMatches(title: string, length: LengthOption): boolean`, `hasRepeatedRoot(title: string): boolean`
  - `checkCandidate(ctx: Context, title: string, recipe: Recipe): string | undefined` (rejection reason)
  - `SCORE` weights, `scoreCandidate(ctx: Context, title: string, recipe: Recipe, rng: Rng): number`

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/constraints.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '@vps-name-tools/core';
import {
  buildContext, normalizeSettings, checkCandidate, lengthMatches, lengthClassOf, hasRepeatedRoot, scoreCandidate,
  type Recipe, type RecipePart, type Settings,
} from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const ctx = (patch: Partial<Settings> = {}) => buildContext(normalizeSettings(patch), MINI, MINI_GAME, createRng('c'));
const lex = (index: number, entryId: string, text: string): RecipePart => ({ kind: 'lex', index, slot: 'noun', entryId, text });
const recipe = (...parts: RecipePart[]): Recipe => ({ templateId: 'T06', variant: 0, family: 'pair', parts, headSlot: 1, seed: '' });

test('length options', () => {
  assert.equal(lengthMatches('Pyre', 'one'), true);
  assert.equal(lengthMatches('Ashen Oath', 'short'), true);
  assert.equal(lengthMatches('Crown of Ash', 'medium'), true);
  assert.equal(lengthMatches('Aeternum: Ashen Crown', 'long'), true);
  assert.equal(lengthMatches('Aeternum: Ashen Crown', 'medium'), false);
  assert.equal(lengthMatches('x'.repeat(49), 'any'), false);
  assert.equal(lengthClassOf('Where the Ravens Keep Their Oaths'), 'long');
});

test('repeated roots are detected', () => {
  assert.equal(hasRepeatedRoot('Ash of Ashes'), true);
  assert.equal(hasRepeatedRoot('Ashen Ash'), true);
  assert.equal(hasRepeatedRoot('Raven Ravens'), true);
  assert.equal(hasRepeatedRoot('Sea Season'), false);
  assert.equal(hasRepeatedRoot('Crown of Ash'), false);
});

test('Avoid, Include, known titles, franchise terms and genre guards reject candidates', () => {
  const r = recipe(lex(0, 'ash', 'Ash'), { kind: 'literal', text: ' ' }, lex(1, 'oath', 'Oath'));
  assert.equal(checkCandidate(ctx({ avoid: 'oath' }), 'Ash Oath', r), 'avoid');
  assert.equal(checkCandidate(ctx({ include: 'Aeternum' }), 'Ash Oath', r), 'include');
  assert.equal(checkCandidate(ctx(), 'Ash Oath', r), undefined);

  const known: RecipePart = { kind: 'compound', index: 0, slot: 'compound', headId: 'frost', tailId: 'bound', morphemes: ['Frost', 'bound'], text: 'Frostbound' };
  assert.equal(checkCandidate(ctx(), 'Frostbound', recipe(known)), 'known-title');

  const franchise: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'neutral', syllables: ['hy', 'rule'], text: 'Hyrule' };
  assert.equal(checkCandidate(ctx(), 'Hyrule Falls', recipe(franchise, { kind: 'literal', text: ' ' }, lex(1, 'falls', 'Falls'))), 'franchise');

  const mon: RecipePart = { kind: 'coined', index: 0, slot: 'coined', profile: 'soft', syllables: ['pip', 'mon'], text: 'Pipmon' };
  assert.equal(checkCandidate(ctx({ genre: 'cozy' }), 'Pipmon', recipe(mon)), 'genre-guard');
});

test('denylisted cultural names are rejected in engine output but a user may type them', () => {
  const odin: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'norse', syllables: ['o', 'din'], text: 'Odin' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Odin', recipe(odin)), 'denylist');
  const typed: RecipePart = { kind: 'include', index: 0, slot: 'name', text: 'Odin' };
  assert.equal(checkCandidate(ctx({ myth: 'norse', include: 'Odin' }), 'Odin', recipe(typed)), undefined);
  const prefixed: RecipePart = { kind: 'coined', index: 0, slot: 'name', profile: 'norse', syllables: ['o', 'din', 'vald'], text: 'Odinvald' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Odinvald', recipe(prefixed)), 'denylist');
  const compound: RecipePart = { kind: 'compound', index: 0, slot: 'compound', headId: 'thorn', tailId: 'fall', morphemes: ['Thorn', 'fall'], text: 'Thornfall' };
  assert.equal(checkCandidate(ctx({ myth: 'norse' }), 'Thornfall', recipe(compound)), undefined);
});

test('ordinary numbers pass and explicit codes fail', () => {
  const sector = recipe(lex(0, 'signal', 'Signal'), { kind: 'literal', text: '-' }, { kind: 'vocab', index: 1, slot: 'digits', text: '88', cliche: 0 });
  assert.equal(checkCandidate(ctx(), 'Signal-88', sector), undefined);
  const code = recipe(lex(0, 'signal', 'Signal'), { kind: 'literal', text: ' ' }, { kind: 'vocab', index: 1, slot: 'digits', text: '1488', cliche: 0 });
  assert.equal(checkCandidate(ctx(), 'Signal 1488', code), 'safety');
});

test('scoring prefers titles that reflect the user themes', () => {
  const c = ctx({ genre: 'cozy', themes: 'lantern' });
  const zero = () => 0;
  const related = scoreCandidate(c, 'Lantern', recipe(lex(0, 'lantern', 'Lantern')), zero);
  const unrelated = scoreCandidate(c, 'Tide', recipe(lex(0, 'tide', 'Tide')), zero);
  assert.ok(related > unrelated, `${related} vs ${unrelated}`);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/constraints.test.ts`
Expected: FAIL (`checkCandidate` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/constraints.ts`:
```ts
import { contentWords, lemmaCandidates, normalize, unsafeGenerated, violatesAvoid, wordCount } from '@vps-name-tools/core';
import { containsTerm } from '@vps-name-tools/data';
import type { Context } from './context';
import { isBlockedEngineWord } from './fill';
import type { LengthOption } from './ids';
import { engineWords, flattenParts, morphemesOf } from './render';
import type { Recipe } from './types';

export type LengthClass = 'one' | 'short' | 'medium' | 'long';
export const MAX_TITLE_CHARS = 48;

export function lengthClassOf(title: string): LengthClass {
  const words = wordCount(title);
  const chars = title.length;
  const colon = title.includes(':');
  if (words === 1) return 'one';
  if (!colon && words <= 2 && chars <= 16) return 'short';
  if (colon || words >= 5 || chars > 28) return 'long';
  return 'medium';
}

export function lengthMatches(title: string, length: LengthOption): boolean {
  const words = wordCount(title);
  const chars = title.length;
  const colon = title.includes(':');
  switch (length) {
    case 'any': return chars <= MAX_TITLE_CHARS;
    case 'one': return words === 1 && chars <= 16;
    case 'short': return words <= 2 && chars <= 16 && !colon;
    case 'medium': return words >= 2 && words <= 4 && chars <= 28 && !colon;
    case 'long': return (colon || words >= 4) && chars <= MAX_TITLE_CHARS;
  }
}

export function hasRepeatedRoot(title: string): boolean {
  const words = contentWords(title).map(w => w.replace(/'s$/, ''));
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      if (a === b) return true;
      if (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
      const la = lemmaCandidates(a);
      if (lemmaCandidates(b).some(x => x.length >= 3 && la.includes(x))) return true;
    }
  }
  return false;
}

/** Returns a rejection reason, or undefined when the candidate is acceptable. */
export function checkCandidate(ctx: Context, title: string, recipe: Recipe): string | undefined {
  if (!title || title.length > MAX_TITLE_CHARS) return 'too-long';
  if (!lengthMatches(title, ctx.settings.length)) return 'length';
  if (ctx.style?.maxWords !== undefined && wordCount(title) > ctx.style.maxWords) return 'style-words';
  if (ctx.style?.maxChars !== undefined && title.length > ctx.style.maxChars) return 'style-chars';
  const key = normalize(title);
  if (ctx.include && !key.includes(ctx.include.norm)) return 'include';
  if (violatesAvoid(title, morphemesOf(recipe.parts), ctx.avoid)) return 'avoid';
  const built = engineWords(recipe.parts);
  if (unsafeGenerated(title, built, ctx.data.safety)) return 'safety';
  if (ctx.game.knownTitles.has(key) || ctx.game.knownTitles.has(normalize(title.split(':')[0]))) return 'known-title';
  const engineText = normalize(
    flattenParts(recipe.parts).filter(p => p.kind !== 'user' && p.kind !== 'include').map(p => p.text).join(' '),
  );
  for (const t of ctx.game.franchiseTerms) if (containsTerm(engineText, t)) return 'franchise';
  for (const { pack } of ctx.mythChain) for (const d of pack.denylist) if (containsTerm(engineText, d)) return 'denylist';
  for (const p of flattenParts(recipe.parts)) if (p.kind === 'coined' && isBlockedEngineWord(ctx, p.text, true)) return 'denylist';
  for (const { preset } of ctx.genreChain) {
    for (const p of preset.guard?.blockPhrases ?? []) if (containsTerm(engineText, p)) return 'genre-guard';
    for (const s of preset.guard?.blockSuffixes ?? []) if (built.some(w => normalize(w).endsWith(s))) return 'genre-guard';
  }
  if (hasRepeatedRoot(title)) return 'repeat';
  return undefined;
}
```

`packages/game-titles/src/score.ts`:
```ts
import { contentWords, normalize, type Rng } from '@vps-name-tools/core';
import type { Context } from './context';
import { lengthClassOf } from './constraints';
import { flattenParts } from './render';
import type { Recipe } from './types';

/** Tunable in Task 25 against the quality metrics. */
export const SCORE = { fit: 1.0, user: 0.6, readability: 0.5, lengthBias: 0.4, alliteration: 0.25, cliche: 0.6, noise: 0.15 } as const;

export function scoreCandidate(ctx: Context, title: string, recipe: Recipe, rng: Rng): number {
  const logMax = Math.log1p(ctx.maxBoost);
  const relevance = (id: string) => {
    const e = ctx.entryById.get(id);
    return e ? Math.log1p(ctx.entryRelevance(e)) / logMax : 0.5;
  };
  let fit = 0;
  let n = 0;
  let cliche = 0;
  let userHit = false;
  for (const p of flattenParts(recipe.parts)) {
    switch (p.kind) {
      case 'lex': {
        fit += relevance(p.entryId);
        n++;
        const e = ctx.entryById.get(p.entryId);
        if (e?.concepts.some(c => ctx.userConcepts.has(c))) userHit = true;
        if (e && !ctx.liftedCliches.has(normalize(e.text))) cliche += e.cliche ?? 0;
        break;
      }
      case 'compound': fit += (relevance(p.headId) + relevance(p.tailId)) / 2; n++; break;
      case 'user': fit += 1; n++; userHit = true; break;
      case 'include': fit += 1; n++; break;
      case 'coined': fit += 0.5; n++; break;
      case 'vocab': fit += 0.4; n++; cliche += p.cliche; break;
      default: break;
    }
  }
  const chars = title.length;
  const longWords = title.split(/\s+/).filter(w => w.replace(/[^A-Za-z]/g, '').length > 12).length;
  const readability = 1 - Math.min(1, Math.max(0, (chars - 22) / 30)) - 0.3 * longWords;
  const lengthBias = ctx.settings.length === 'any' ? ctx.genre.lengthBias[lengthClassOf(title)] : 0.5;
  const words = contentWords(title);
  const alliterates = words.length >= 2 && words[0][0] === words[1][0];
  return (
    SCORE.fit * (n ? fit / n : 0) +
    (userHit ? SCORE.user : 0) +
    SCORE.readability * readability +
    SCORE.lengthBias * lengthBias +
    (alliterates ? SCORE.alliteration * ctx.alliterationBonus : 0) -
    SCORE.cliche * cliche +
    SCORE.noise * ctx.params.temperature * rng()
  );
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './constraints';
export * from './score';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/constraints.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add candidate constraints and scoring"
```

---

### Task 16: `generate()` and identity notes

**Files:**
- Create: `packages/game-titles/src/notes.ts`, `packages/game-titles/src/generate.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/notes.test.ts`, `packages/game-titles/test/generate.test.ts`

**Interfaces:**
- Consumes: Tasks 13–15; core (`createRng`, `randomSeed`, `hash32`, `selectDiverse`, `pickWeighted`, `contentWords`, `normalize`, `indefiniteArticle`).
- Produces:
  - `interface NoteInput { tone: string; myth?: string; genre: string; concepts: readonly string[]; inventedProfile?: string; variant: number }`, `MAX_NOTE_CHARS = 100`, `buildNote(input: NoteInput): string`
  - `interface TitleCandidate extends Candidate { title: string; recipe: Recipe }`
  - `titleKey(title: string): string`, `selectionOptions(ctx: Context, count: number): SelectOptions`, `toCandidate(ctx, title, recipe, score, extraCaps?): TitleCandidate`, `recipeConcepts(ctx, recipe): string[]`, `toResult(ctx, candidate): TitleResult`
  - `generate(input: Partial<Settings>, opts?: GenerateOptions): GenerateResult`

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/notes.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNote, MAX_NOTE_CHARS } from '../src/index';

test('the standard note reads naturally', () => {
  assert.equal(
    buildNote({ tone: 'grim', myth: 'Norse', genre: 'dark-fantasy', concepts: ['oath', 'winter', 'ruin'], variant: 0 }),
    'Grim Norse dark-fantasy title evoking oath, winter and ruin.',
  );
});

test('the alternate phrasing uses an article', () => {
  assert.equal(
    buildNote({ tone: 'epic', genre: 'fantasy', concepts: ['crown', 'oath'], variant: 1 }),
    'An epic fantasy name built around crown and oath.',
  );
});

test('invented words get an honest note', () => {
  assert.equal(
    buildNote({ tone: 'grim', genre: 'survival', concepts: [], inventedProfile: 'Norse', variant: 0 }),
    'Invented word with a Norse-inspired sound; suits a grim survival game.',
  );
});

test('notes never exceed the limit', () => {
  const long = ['transformation', 'esoteric knowledge', 'astronomical cycles', 'forgotten dynasties'];
  const note = buildNote({ tone: 'melancholic', myth: 'Indian mythology-inspired', genre: 'psychological-horror', concepts: long, variant: 0 });
  assert.ok(note.length <= MAX_NOTE_CHARS, note);
});
```

`packages/game-titles/test/generate.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, titleKey, type Settings } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const run = (patch: Partial<Settings> = {}, seed = 'seed', exclude?: Set<string>) =>
  generate(patch, { seed, data: MINI, game: MINI_GAME, exclude });

test('returns the requested number of titles for the defaults', () => {
  assert.equal(run().titles.length, 10);
  assert.equal(run({ count: 20 }).titles.length, 20);
});

test('is deterministic for a seed', () => {
  assert.deepEqual(run({}, 'x').titles.map(t => t.title), run({}, 'x').titles.map(t => t.title));
  assert.notDeepEqual(run({}, 'x').titles.map(t => t.title), run({}, 'y').titles.map(t => t.title));
});

test('every title contains the Include word', () => {
  const r = run({ include: 'Aeternum' });
  assert.ok(r.titles.length >= 5);
  for (const t of r.titles) assert.match(t.title, /Aeternum/);
});

test('Avoid words never appear', () => {
  for (const seed of ['a', 'b', 'c']) {
    for (const t of run({ avoid: 'oath, *frost*' }, seed).titles) {
      assert.doesNotMatch(t.title, /\boaths?\b/i, t.title);
      assert.doesNotMatch(t.title, /frost/i, t.title);
    }
  }
});

test('no template family exceeds 30% of a batch of ten', () => {
  for (const seed of ['a', 'b', 'c']) {
    const counts = new Map<string, number>();
    for (const t of run({}, seed).titles) counts.set(t.recipe.family, (counts.get(t.recipe.family) ?? 0) + 1);
    assert.ok(Math.max(...counts.values()) <= 3, JSON.stringify([...counts]));
  }
});

test('titles are unique and excluded titles are not repeated', () => {
  const first = run({}, 'u');
  const keys = first.titles.map(t => titleKey(t.title));
  assert.equal(new Set(keys).size, keys.length);
  const second = run({}, 'u', new Set(keys));
  for (const t of second.titles) assert.ok(!keys.includes(titleKey(t.title)), t.title);
});

test('an Include word on the Avoid list gives no titles and a notice', () => {
  const r = run({ include: 'Ash', avoid: 'ash' });
  assert.equal(r.titles.length, 0);
  assert.equal(r.notices[0]?.code, 'include-conflicts-avoid');
});

test('notes are short and name the cultural style', () => {
  const r = run({ genre: 'dark-fantasy', myth: 'norse' });
  for (const t of r.titles) assert.ok(t.meta.note.length <= 100, t.meta.note);
  assert.ok(r.titles.some(t => t.meta.note.includes('Norse')));
});

test('known titles are never produced', () => {
  for (const seed of ['k1', 'k2', 'k3', 'k4', 'k5']) {
    for (const t of run({ length: 'one', style: 'compound', genre: 'dark-fantasy' }, seed).titles) {
      assert.ok(!['ashfall', 'frostbound'].includes(titleKey(t.title)), t.title);
    }
  }
});

test('themes steer without appearing in every title', () => {
  const r = run({ themes: 'lantern, aurora' });
  const literal = r.titles.filter(t => t.recipe.parts.some(p => p.kind === 'user')).length;
  assert.ok(literal >= 1 && literal <= 7, String(literal));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/notes.test.ts packages/game-titles/test/generate.test.ts`
Expected: FAIL (`buildNote` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/notes.ts`:
```ts
import { indefiniteArticle } from '@vps-name-tools/core';

export interface NoteInput {
  readonly tone: string;
  readonly myth?: string;
  readonly genre: string;
  readonly concepts: readonly string[];
  readonly inventedProfile?: string;
  readonly variant: number;
}

export const MAX_NOTE_CHARS = 100;

const list = (xs: readonly string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildNote(i: NoteInput): string {
  const tone = i.tone || 'evocative';
  if (i.inventedProfile) {
    const full = `Invented word with ${indefiniteArticle(i.inventedProfile)} ${i.inventedProfile}-inspired sound; suits ${indefiniteArticle(tone)} ${tone} ${i.genre} game.`;
    return full.length <= MAX_NOTE_CHARS ? full : `Invented word; suits ${indefiniteArticle(tone)} ${tone} ${i.genre} game.`;
  }
  const attempts: string[] = [];
  for (const myth of i.myth ? [i.myth, undefined] : [undefined]) {
    const subject = [tone, myth, i.genre].filter(Boolean).join(' ');
    for (let k = Math.min(3, i.concepts.length); k >= 0; k--) {
      const concepts = i.concepts.slice(0, k);
      if (k === 0) attempts.push(`${cap(subject)} title.`);
      else if (i.variant % 2 === 0) attempts.push(`${cap(subject)} title evoking ${list(concepts)}.`);
      else attempts.push(`${cap(indefiniteArticle(tone))} ${subject} name built around ${list(concepts)}.`);
    }
  }
  return attempts.find(a => a.length <= MAX_NOTE_CHARS) ?? attempts[attempts.length - 1].slice(0, MAX_NOTE_CHARS);
}
```

`packages/game-titles/src/generate.ts`:
```ts
import {
  contentWords, createRng, hash32, normalize, pickWeighted, randomSeed, selectDiverse,
  type Candidate, type Rng, type SelectOptions, type ThemePhrase,
} from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { checkCandidate } from './constraints';
import { buildContext, type Context } from './context';
import { fillTemplate } from './fill';
import { GAME } from './game';
import { buildNote } from './notes';
import { flattenParts, renderTitle } from './render';
import { scoreCandidate } from './score';
import { normalizeSettings, type Settings } from './settings';
import type { GenerateOptions, GenerateResult, Recipe, TitleResult } from './types';

export interface TitleCandidate extends Candidate {
  readonly title: string;
  readonly recipe: Recipe;
}

export const titleKey = (title: string): string => normalize(title);
const CLASSIC = 0.5;

export function selectionOptions(ctx: Context, count: number): SelectOptions {
  const atLeastOne = (x: number) => Math.max(1, Math.floor(x));
  const phrases = ctx.theme.phrases.length;
  return {
    count,
    diversity: 0.6,
    familyCap: f => (ctx.familiesAvailable < 4 ? count : f === 'adj-noun' ? atLeastOne(count * 0.2) : atLeastOne(count * 0.3)),
    capLimit: k => {
      if (k.startsWith('word:')) return 2;
      if (k.startsWith('head:')) return 1;
      if (k.startsWith('cliche:')) return 1;
      if (k === 'cliche-any') return atLeastOne(count * 0.2);
      if (k.startsWith('phrase:')) return phrases > 1 ? atLeastOne(count * 0.3) : count;
      if (k === 'coined') return Math.max(1, Math.ceil(count * ctx.coinedCap));
      if (k === 'symbolic') return 2;
      return Infinity;
    },
  };
}

export function toCandidate(ctx: Context, title: string, recipe: Recipe, score: number, extraCaps: readonly string[] = []): TitleCandidate {
  const words = contentWords(title);
  const includeWords = new Set(ctx.include ? contentWords(ctx.include.text) : []);
  const caps = new Set<string>(extraCaps);
  for (const w of words) if (!includeWords.has(w)) caps.add(`word:${w}`);
  const head = recipe.parts.find(p => p.kind !== 'literal' && p.index === recipe.headSlot);
  if (head && head.kind !== 'include') caps.add(`head:${normalize(head.text)}`);
  for (const p of flattenParts(recipe.parts)) {
    if (p.kind === 'vocab' && p.cliche >= CLASSIC) {
      caps.add(`cliche:${normalize(p.text)}`);
      caps.add('cliche-any');
    }
    if (p.kind === 'lex') {
      const e = ctx.entryById.get(p.entryId);
      if (e && (e.cliche ?? 0) >= CLASSIC && !ctx.liftedCliches.has(normalize(e.text))) caps.add('cliche-any');
      if (ctx.symbolicIds.has(p.entryId)) caps.add('symbolic');
    }
    if (p.kind === 'user') caps.add(`phrase:${p.phrase}`);
    if (p.kind === 'coined') caps.add('coined');
  }
  return {
    key: titleKey(title), title, recipe, score, family: recipe.family,
    features: new Set([...words, `tpl:${recipe.templateId}`]), capKeys: [...caps],
  };
}

export function recipeConcepts(ctx: Context, recipe: Recipe): string[] {
  const out: string[] = [];
  for (const p of flattenParts(recipe.parts)) {
    if (p.kind === 'lex') out.push(...(ctx.entryById.get(p.entryId)?.concepts ?? []));
    else if (p.kind === 'compound') out.push(...(ctx.entryById.get(p.headId)?.concepts ?? []), ...(ctx.entryById.get(p.tailId)?.concepts ?? []));
    else if (p.kind === 'user') out.push(...(ctx.theme.phrases.find(ph => ph.norm === p.phrase)?.concepts ?? []));
  }
  if (recipe.anchor) out.push(recipe.anchor);
  return [...new Set(out)];
}

function topConcepts(ctx: Context, recipe: Recipe, n: number): string[] {
  return recipeConcepts(ctx, recipe)
    .map(c => ({ c, s: (ctx.boost.get(c) ?? 1) * (ctx.userConcepts.has(c) ? 2 : 1) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(x => x.c);
}

export function toResult(ctx: Context, c: TitleCandidate): TitleResult {
  const concepts = topConcepts(ctx, c.recipe, 3);
  const invented = c.recipe.family === 'coined' && c.recipe.parts.some(p => p.kind === 'coined');
  const s = ctx.settings;
  const note = buildNote({
    tone: ctx.tones[0]?.def.noteWord ?? '',
    myth: ctx.myth.id === 'none' ? undefined : ctx.myth.noteLabel,
    genre: ctx.genre.noteLabel,
    concepts: concepts.map(id => ctx.conceptLabel(id)),
    inventedProfile: invented ? ctx.profile.label : undefined,
    variant: c.title.length,
  });
  return {
    id: `t_${hash32(`${c.key}|${s.genre}|${s.myth}`)}`,
    title: c.title,
    meta: {
      genre: s.genre, myth: ctx.myth.id, style: s.style, tones: ctx.tones.map(t => t.def.id), concepts, note,
      genreLabel: ctx.genre.label, mythLabel: ctx.myth.label, styleLabel: ctx.style?.label ?? 'Auto',
    },
    recipe: c.recipe,
    settings: s,
  };
}

function leastUsed(rng: Rng, phrases: readonly ThemePhrase[], use: ReadonlyMap<string, number>): ThemePhrase {
  const min = Math.min(...phrases.map(p => use.get(p.norm) ?? 0));
  const options = phrases.filter(p => (use.get(p.norm) ?? 0) === min);
  return options[Math.floor(rng() * options.length)];
}

function buildCandidate(ctx: Context, rng: Rng, phraseUse: Map<string, number>, seed: string): TitleCandidate | undefined {
  const template = pickWeighted(rng, ctx.templates);
  if (!template) return undefined;
  const variant = Math.floor(rng() * template.variants.length);
  const literal = ctx.theme.phrases.length > 0 && rng() < ctx.params.literalRate ? leastUsed(rng, ctx.theme.phrases, phraseUse) : undefined;
  const anchor = literal?.concepts.length ? literal.concepts[Math.floor(rng() * literal.concepts.length)] : pickWeighted(rng, ctx.anchors);
  const recipe = fillTemplate(ctx, rng, template, variant, { anchor, literal, seed });
  if (!recipe) return undefined;
  const title = renderTitle(recipe.parts);
  if (checkCandidate(ctx, title, recipe)) return undefined;
  for (const p of recipe.parts) if (p.kind === 'user') phraseUse.set(p.phrase, (phraseUse.get(p.phrase) ?? 0) + 1);
  return toCandidate(ctx, title, recipe, scoreCandidate(ctx, title, recipe, rng));
}

export function generate(input: Partial<Settings>, opts: GenerateOptions = {}): GenerateResult {
  const settings = normalizeSettings(input);
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(seed);
  const ctx = buildContext(settings, data, game, rng);
  if (ctx.blocked) return { titles: [], notices: ctx.notices, seed };

  const target = settings.count * 6;
  const candidates: TitleCandidate[] = [];
  const seen = new Set<string>();
  const phraseUse = new Map<string, number>();
  for (let attempt = 0; attempt < target * 5 && candidates.length < target; attempt++) {
    const c = buildCandidate(ctx, rng, phraseUse, `${seed}:${attempt}`);
    if (!c || seen.has(c.key) || opts.exclude?.has(c.key)) continue;
    seen.add(c.key);
    candidates.push(c);
  }
  const picked = selectDiverse(candidates, selectionOptions(ctx, settings.count));
  const notices = [...ctx.notices];
  if (picked.length < settings.count) {
    notices.push({ code: 'shortfall', message: `Only ${picked.length} titles fit these settings. Try another length or style, or fewer Avoid words.` });
  }
  return { titles: picked.map(c => toResult(ctx, c)), notices, seed };
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './notes';
export * from './generate';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/notes.test.ts packages/game-titles/test/generate.test.ts && npm run typecheck`
Expected: PASS (14 tests). If "no template family exceeds 30%" fails, check that `familiesAvailable` counts only templates with weight > 0 and that the batch had enough candidates (raise the attempt multiplier from 5 to 8 before loosening caps).

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add generate() with diverse selection and identity notes"
```

---

### Task 17: Generate Similar

**Files:**
- Create: `packages/game-titles/src/similar.ts`
- Modify: `packages/game-titles/src/index.ts`
- Test: `packages/game-titles/test/similar.test.ts`

**Interfaces:**
- Consumes: Tasks 13–16; core (`mutateWord`, `createRng`, `randomSeed`, `pickWeighted`, `selectDiverse`, `wordCount`, `titleSyllables`, `pluralize`).
- Produces: `RELATED_FAMILIES`, `generateSimilar(source: TitleResult, opts?: SimilarOptions): GenerateResult` (default 6 titles).

Four strategies (spec §11.3), each tagged on the recipe as `strategy`:
- **modifier**: same template and variant; keep the head part; refill the rest, biased toward the source's concepts.
- **head**: same template; keep every non-head part; replace the head with a family sibling (or a concept-sharing word).
- **structure**: a template from a related family; move the head into its head slot; bias the rest toward the source's concepts.
- **mutate** (invented-word sources): change one syllable or the ending of the invented word.

A rhythm bonus favours matching word count, syllables and length (± 20%). Selection allows at most ⌊count / 3⌋ titles per strategy when three strategies produced candidates, so results feel deliberately related rather than re-rolled. The source's own settings snapshot drives everything, so Similar still works after the user changes the form.

- [ ] **Step 1: Write the failing tests**

`packages/game-titles/test/similar.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, generateSimilar, titleKey, type RecipePart, type Settings, type TitleResult } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const opts = { data: MINI, game: MINI_GAME };
const run = (patch: Partial<Settings>, seed: string) => generate(patch, { ...opts, seed });
const sourceOf = (titles: readonly TitleResult[]) =>
  titles.find(t => ['adj-noun', 'pair', 'of-phrase', 'the-noun'].includes(t.recipe.family)) ?? titles[0];
const headText = (t: TitleResult) => t.recipe.parts.find(p => p.kind !== 'literal' && p.index === t.recipe.headSlot)?.text ?? '';

test('returns related titles and never repeats the source', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's1' });
  assert.ok(r.titles.length >= 4, String(r.titles.length));
  for (const t of r.titles) assert.notEqual(titleKey(t.title), titleKey(src.title));
});

test('at least one result keeps the head word and at least two families appear', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's2' });
  const head = headText(src).toLowerCase();
  assert.ok(r.titles.some(t => t.title.toLowerCase().includes(head)), `${head} in ${r.titles.map(t => t.title)}`);
  assert.ok(new Set(r.titles.map(t => t.recipe.family)).size >= 2);
});

test('several strategies are represented', () => {
  const src = sourceOf(run({ genre: 'dark-fantasy', count: 20 }, 'sim').titles);
  const r = generateSimilar(src, { ...opts, seed: 's3' });
  assert.ok(new Set(r.titles.map(t => t.recipe.strategy)).size >= 2);
});

test('the Include word is kept', () => {
  const src = run({ include: 'Aeternum' }, 'inc').titles[0];
  for (const t of generateSimilar(src, { ...opts, seed: 's4' }).titles) assert.match(t.title, /Aeternum/);
});

test('is deterministic for a seed', () => {
  const src = sourceOf(run({}, 'det').titles);
  assert.deepEqual(
    generateSimilar(src, { ...opts, seed: 'same' }).titles.map(t => t.title),
    generateSimilar(src, { ...opts, seed: 'same' }).titles.map(t => t.title),
  );
});

test('invented-word sources mutate while keeping a syllable', () => {
  const src = run({ style: 'invented', length: 'one', myth: 'norse' }, 'inv').titles.find(t => t.recipe.parts.some(p => p.kind === 'coined'))!;
  const syllables = (src.recipe.parts.find(p => p.kind === 'coined') as Extract<RecipePart, { kind: 'coined' }>).syllables;
  const r = generateSimilar(src, { ...opts, seed: 's5' });
  assert.ok(r.titles.some(t => t.recipe.parts.some(p => p.kind === 'coined' && p.syllables.some(s => syllables.includes(s)))));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/similar.test.ts`
Expected: FAIL (`generateSimilar` is not exported).

- [ ] **Step 3: Implement**

`packages/game-titles/src/similar.ts`:
```ts
import { createRng, mutateWord, pickWeighted, pluralize, randomSeed, selectDiverse, titleSyllables, wordCount, type Rng } from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { checkCandidate } from './constraints';
import { buildContext, type Choice, type Context } from './context';
import { fillTemplate } from './fill';
import { GAME } from './game';
import { recipeConcepts, selectionOptions, titleKey, toCandidate, toResult, type TitleCandidate } from './generate';
import type { TemplateFamily } from './ids';
import { renderTitle } from './render';
import { scoreCandidate } from './score';
import { normalizeSettings } from './settings';
import type { GenerateResult, Recipe, RecipePart, SimilarOptions, SimilarStrategy, SlotToken, Template, TitleResult } from './types';

export const RELATED_FAMILIES: Partial<Record<TemplateFamily, readonly TemplateFamily[]>> = {
  'adj-noun': ['of-phrase', 'the-noun', 'pair', 'subtitle'],
  pair: ['of-phrase', 'adj-noun', 'the-noun'],
  'of-phrase': ['adj-noun', 'the-noun', 'pair'],
  'the-noun': ['adj-noun', 'of-phrase'],
  compound: ['adj-noun', 'pair', 'kenning'],
  subtitle: ['pair', 'of-phrase', 'adj-noun'],
  frame: ['of-phrase', 'saga', 'suffix'],
  single: ['adj-noun', 'the-noun', 'compound'],
  number: ['adj-noun', 'the-noun'],
  prepositional: ['of-phrase', 'the-noun'],
  sentence: ['prepositional', 'imperative'],
  imperative: ['sentence', 'the-noun'],
  possessive: ['the-name', 'pair'],
  suffix: ['subtitle', 'frame'],
  place: ['pair', 'possessive'],
  'the-name': ['possessive', 'pair'],
  duo: ['pair', 'triad'],
  kenning: ['compound', 'pair'],
  code: ['number', 'single'],
};
const DEFAULT_RELATED: readonly TemplateFamily[] = ['adj-noun', 'of-phrase', 'the-noun'];

type Head = Exclude<RecipePart, { kind: 'literal' }>;

function convertHead(ctx: Context, head: Head, lock: SlotToken): RecipePart | undefined {
  const index = lock.index;
  if (head.kind === 'lex') {
    const e = ctx.entryById.get(head.entryId);
    if (!e) return undefined;
    if (lock.types.includes('noun') && e.pos.includes('noun')) return { kind: 'lex', index, slot: 'noun', entryId: e.id, text: e.text };
    if (lock.types.includes('nounPl') && e.pos.includes('noun')) return { kind: 'lex', index, slot: 'nounPl', entryId: e.id, text: e.forms?.plural ?? pluralize(e.text) };
    if (lock.types.includes('adj') && e.pos.includes('adj')) return { kind: 'lex', index, slot: 'adj', entryId: e.id, text: e.text };
    return undefined;
  }
  if (head.kind === 'include' || head.kind === 'user' || head.kind === 'coined' || head.kind === 'compound') {
    const t = (['name', 'noun', 'place', 'coined'] as const).find(x => lock.types.includes(x));
    return t ? { ...head, index, slot: t } : undefined;
  }
  return undefined;
}

function runStrategy(
  ctx: Context, rng: Rng, strategy: SimilarStrategy, source: Recipe, template: Template | undefined, head: Head | undefined, bias: ReadonlySet<string>,
): Recipe | undefined {
  switch (strategy) {
    case 'modifier': {
      if (!template || !head) return runStrategy(ctx, rng, 'structure', source, template, head, bias);
      return fillTemplate(ctx, rng, template, source.variant, { preset: new Map([[head.index, head]]), bias, anchor: source.anchor });
    }
    case 'head': {
      if (!template || !head || head.kind !== 'lex') return runStrategy(ctx, rng, 'modifier', source, template, head, bias);
      const keep = new Map<number, RecipePart>();
      for (const p of source.parts) if (p.kind !== 'literal' && p.index !== head.index) keep.set(p.index, p);
      const original = ctx.entryById.get(head.entryId);
      const sibling = (c: Choice) => c.entry.id !== head.entryId && (original?.family ? c.entry.family === original.family : c.entry.concepts.some(x => original?.concepts.includes(x)));
      const sharesConcept = (c: Choice) => c.entry.id !== head.entryId && c.entry.concepts.some(x => bias.has(x));
      return fillTemplate(ctx, rng, template, source.variant, { preset: keep, bias, headFilter: sibling, anchor: source.anchor })
        ?? fillTemplate(ctx, rng, template, source.variant, { preset: keep, bias, headFilter: sharesConcept, anchor: source.anchor });
    }
    case 'structure': {
      const families = (template && RELATED_FAMILIES[template.family]) ?? DEFAULT_RELATED;
      const chosen = pickWeighted(rng, ctx.templates.filter(w => families.includes(w.item.family)));
      if (!chosen) return undefined;
      const variant = Math.floor(rng() * chosen.variants.length);
      const lock = chosen.variants[variant].find((x): x is SlotToken => x.kind === 'slot' && x.lock);
      const moved = head && lock ? convertHead(ctx, head, lock) : undefined;
      return fillTemplate(ctx, rng, chosen, variant, { preset: moved && lock ? new Map([[lock.index, moved]]) : undefined, bias, anchor: source.anchor });
    }
    case 'mutate': {
      if (!head || head.kind !== 'coined') return undefined;
      const m = mutateWord(rng, ctx.profile, { text: head.text, syllables: head.syllables, ending: head.ending, profile: head.profile });
      if (!m) return undefined;
      const parts = source.parts.map(p => (p === head ? { ...head, syllables: m.syllables, ending: m.ending, text: m.text } : p));
      return { ...source, parts };
    }
  }
}

function rhythmBonus(origin: { words: number; chars: number; syllables: number }, title: string): number {
  const chars = title.length;
  const outside = chars < origin.chars * 0.8 || chars > origin.chars * 1.2;
  return -0.15 * Math.abs(titleSyllables(title) - origin.syllables) - 0.3 * Math.abs(wordCount(title) - origin.words) - (outside ? 0.4 : 0);
}

export function generateSimilar(source: TitleResult, opts: SimilarOptions = {}): GenerateResult {
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const count = opts.count ?? 6;
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(`${seed}:similar`);
  const ctx = buildContext(normalizeSettings(source.settings), data, game, rng);
  if (ctx.blocked) return { titles: [], notices: ctx.notices, seed };

  const template = game.templates.find(t => t.id === source.recipe.templateId);
  const head = source.recipe.parts.find((p): p is Head => p.kind !== 'literal' && p.index === source.recipe.headSlot);
  const bias = new Set(recipeConcepts(ctx, source.recipe));
  const origin = { words: wordCount(source.title), chars: source.title.length, syllables: titleSyllables(source.title) };
  const exclude = new Set([titleKey(source.title), ...(opts.exclude ?? [])]);
  const coinedSource = head?.kind === 'coined';
  const strategies: SimilarStrategy[] = coinedSource ? ['mutate', 'mutate', 'structure'] : ['modifier', 'head', 'structure'];

  const candidates: TitleCandidate[] = [];
  const seen = new Set<string>();
  const target = count * 8;
  for (let i = 0; i < target * 5 && candidates.length < target; i++) {
    const strategy = strategies[i % strategies.length];
    const recipe = runStrategy(ctx, rng, strategy, source.recipe, template, head, bias);
    if (!recipe) continue;
    const title = renderTitle(recipe.parts);
    const key = titleKey(title);
    if (exclude.has(key) || seen.has(key) || checkCandidate(ctx, title, recipe)) continue;
    seen.add(key);
    const tagged: Recipe = { ...recipe, strategy };
    candidates.push(toCandidate(ctx, title, tagged, scoreCandidate(ctx, title, tagged, rng) + rhythmBonus(origin, title), [`strategy:${strategy}`]));
  }

  const strategiesUsed = new Set(candidates.map(c => c.recipe.strategy)).size;
  const base = selectionOptions(ctx, count);
  const picked = selectDiverse(candidates, {
    ...base,
    capLimit: k => (k.startsWith('strategy:') ? (strategiesUsed >= 3 ? Math.max(1, Math.floor(count / 3)) : count) : base.capLimit(k)),
  });
  const notices = [...ctx.notices];
  if (picked.length < count) notices.push({ code: 'shortfall', message: `Only ${picked.length} close variations fit these settings.` });
  return { titles: picked.map(c => toResult(ctx, c)), notices, seed };
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './similar';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/similar.test.ts && npm run typecheck`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/game-titles
git commit -m "Add Generate Similar with four strategies and rhythm matching"
```

---

### Task 18: Property tests and the quality harness

**Files:**
- Create: `packages/game-titles/src/quality.ts`, `scripts/quality.ts`
- Modify: `packages/game-titles/src/index.ts`, root `package.json` (script `quality`)
- Test: `packages/game-titles/test/property.test.ts`, `packages/game-titles/test/quality.test.ts`

**Interfaces:**
- Consumes: everything above; `fast-check`.
- Produces: `QualityPreset`, `QualityReport`, `QUALITY_THRESHOLDS`, `QUALITY_PRESETS`, `measureQuality(preset, opts?): QualityReport`, `checkQuality(report, creativity): string[]`.

- [ ] **Step 1: Write the property test**

`packages/game-titles/test/property.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { isAscii, normalize, parseAvoid, violatesAvoid } from '@vps-name-tools/core';
import { CREATIVITY_LEVELS, LENGTH_OPTIONS, STYLE_IDS, generate, lengthMatches, morphemesOf, titleKey, type Settings } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

const settingsArb = fc.record({
  genre: fc.constantFrom('fantasy', 'dark-fantasy', 'cozy'),
  myth: fc.constantFrom('none', 'norse'),
  tone: fc.constantFrom('auto', 'grim', 'cozy', 'epic'),
  tone2: fc.constantFrom('none', 'grim', 'cozy'),
  style: fc.constantFrom('auto', ...STYLE_IDS),
  length: fc.constantFrom(...LENGTH_OPTIONS),
  creativity: fc.constantFrom(...CREATIVITY_LEVELS),
  count: fc.constantFrom(5, 10),
  themes: fc.constantFrom('', 'lantern, aurora', 'blood oath, frozen kingdom', 'Aeternum'),
  include: fc.constantFrom('', 'Aeternum', 'Raven'),
  avoid: fc.constantFrom('', 'oath', '*frost*, pale'),
}) as fc.Arbitrary<Settings>;

test('generation invariants hold for random settings and seeds', () => {
  fc.assert(
    fc.property(settingsArb, fc.string({ minLength: 1, maxLength: 8 }), (s, seed) => {
      const r = generate(s, { seed, data: MINI, game: MINI_GAME });
      if (r.notices.some(n => n.code === 'include-conflicts-avoid')) return r.titles.length === 0;
      const keys = r.titles.map(t => titleKey(t.title));
      assert.equal(new Set(keys).size, keys.length);
      assert.ok(r.titles.length === s.count || r.notices.some(n => n.code === 'shortfall'));
      const rules = parseAvoid(s.avoid);
      for (const t of r.titles) {
        if (s.include) assert.ok(titleKey(t.title).includes(normalize(s.include)), t.title);
        assert.equal(violatesAvoid(t.title, morphemesOf(t.recipe.parts), rules), undefined, t.title);
        assert.ok(lengthMatches(t.title, s.length), `${t.title} vs ${s.length}`);
        assert.ok(isAscii(t.title), t.title);
      }
      const again = generate(s, { seed, data: MINI, game: MINI_GAME });
      assert.deepEqual(again.titles.map(t => t.title), r.titles.map(t => t.title));
      return true;
    }),
    { numRuns: 150 },
  );
});
```

- [ ] **Step 2: Run it**

Run: `npx tsx --test packages/game-titles/test/property.test.ts`
Expected: PASS. A failure prints the shrunk counter-example settings and seed; fix the engine bug it reveals (never weaken an assertion).

- [ ] **Step 3: Write the failing quality test**

`packages/game-titles/test/quality.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureQuality, checkQuality } from '../src/index';
import { MINI } from '../../data/test/fixtures/mini-bundle';
import { MINI_GAME } from './fixtures/mini-game';

test('measureQuality reports ratios for a preset', () => {
  const r = measureQuality({ name: 'mini', settings: { genre: 'dark-fantasy', myth: 'norse', themes: 'lantern, aurora' } }, { batches: 10, data: MINI, game: MINI_GAME });
  assert.equal(r.titles, 200);
  for (const v of [r.maxFamilyShare, r.topWordShare, r.clicheShare, r.literalRate, r.phraseCoverage]) assert.ok(v >= 0 && v <= 1, String(v));
  assert.ok(r.msPer20 > 0);
});

test('checkQuality lists threshold failures', () => {
  const failures = checkQuality(
    { preset: 'x', titles: 100, maxFamilyShare: 0.5, topWordShare: 0.01, topWord: 'ash', clicheShare: 0.1, literalRate: 0.9, phraseCoverage: 1, avgChars: 12, msPer20: 5, hasThemes: true },
    'balanced',
  );
  assert.ok(failures.some(f => f.includes('family')));
  assert.ok(failures.some(f => f.includes('literal')));
});
```

- [ ] **Step 4: Implement**

`packages/game-titles/src/quality.ts`:
```ts
import { contentWords, normalize, splitPhrases, createRng } from '@vps-name-tools/core';
import { DATA, type DataBundle } from '@vps-name-tools/data';
import { buildContext } from './context';
import { GAME } from './game';
import { generate, recipeConcepts } from './generate';
import type { Creativity } from './ids';
import { flattenParts } from './render';
import { normalizeSettings, type Settings } from './settings';
import type { GameData } from './types';

export interface QualityPreset { readonly name: string; readonly settings: Partial<Settings> }
export interface QualityReport {
  readonly preset: string; readonly titles: number; readonly maxFamilyShare: number; readonly topWordShare: number;
  readonly topWord: string; readonly clicheShare: number; readonly literalRate: number; readonly phraseCoverage: number;
  readonly avgChars: number; readonly msPer20: number; readonly hasThemes: boolean;
}

export const QUALITY_THRESHOLDS = {
  maxFamilyShare: 0.3,
  topWordShare: 0.04,
  clicheShare: 0.2,
  phraseCoverage: 1,
  literalBand: { focused: [0.45, 0.75], balanced: [0.3, 0.5], wild: [0.15, 0.4] } as Readonly<Record<Creativity, readonly [number, number]>>,
} as const;

export const QUALITY_PRESETS: readonly QualityPreset[] = [
  { name: 'Norse dark fantasy (spec example 1)', settings: { genre: 'dark-fantasy', myth: 'norse', tone: 'grim', tone2: 'mystical', themes: 'frozen kingdom, ravens, forgotten gods, blood oath, northern lights' } },
  { name: 'Cozy creature collector (spec example 2)', settings: { genre: 'creature-collector', myth: 'fairy-tale', tone: 'cozy', tone2: 'playful', themes: 'cute creatures, islands, collecting, friendship, cozy exploration' } },
  { name: 'Analog horror (spec example 3)', settings: { genre: 'psychological-horror', tone: 'mysterious', tone2: 'melancholic', creativity: 'focused', themes: 'abandoned radio tower, analog horror, snowstorm, missing hikers' } },
  { name: 'Fantasy defaults', settings: {} },
  { name: 'Cyberpunk, Japanese-inspired', settings: { genre: 'cyberpunk', myth: 'japanese' } },
  { name: 'Space opera, Greek, epic', settings: { genre: 'space-opera', myth: 'greek', tone: 'epic' } },
  { name: 'Cosmic horror, Lovecraftian, wild', settings: { genre: 'cosmic-horror', myth: 'cosmic', creativity: 'wild' } },
  { name: 'Farming, Celtic-inspired, cozy', settings: { genre: 'farming', myth: 'celtic', tone: 'cozy' } },
  { name: 'Strategy, Roman', settings: { genre: 'strategy', myth: 'roman' } },
  { name: 'Western, grim', settings: { genre: 'western', tone: 'grim' } },
  { name: 'Roguelike, alchemical', settings: { genre: 'roguelike', myth: 'alchemical', themes: 'transmutation, mercury, endless descent' } },
  { name: 'Mystery, fairy tale', settings: { genre: 'mystery', myth: 'fairy-tale', tone: 'mysterious' } },
];

export function measureQuality(preset: QualityPreset, opts: { batches?: number; data?: DataBundle; game?: GameData } = {}): QualityReport {
  const data = opts.data ?? DATA;
  const game = opts.game ?? GAME;
  const batches = opts.batches ?? 50;
  const settings = normalizeSettings({ ...preset.settings, count: 20 });
  const ctx = buildContext(settings, data, game, createRng('quality'));
  const themeWords = new Set(contentWords(`${settings.themes} ${settings.include}`));
  const phrases = ctx.theme.phrases;
  const hasThemes = splitPhrases(settings.themes).length > 0;

  let titles = 0;
  let maxFamilyShare = 0;
  let cliches = 0;
  let literal = 0;
  let covered = 0;
  let chars = 0;
  let ms = 0;
  const wordCounts = new Map<string, number>();
  for (let b = 0; b < batches; b++) {
    const start = performance.now();
    const r = generate(settings, { seed: `${preset.name}:${b}`, data, game });
    ms += performance.now() - start;
    const families = new Map<string, number>();
    const reflected = new Set<string>();
    for (const t of r.titles) {
      titles++;
      chars += t.title.length;
      families.set(t.recipe.family, (families.get(t.recipe.family) ?? 0) + 1);
      for (const w of new Set(contentWords(t.title))) if (!themeWords.has(w)) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
      const parts = flattenParts(t.recipe.parts);
      if (parts.some(p => (p.kind === 'vocab' && p.cliche >= 0.5) || (p.kind === 'lex' && (ctx.entryById.get(p.entryId)?.cliche ?? 0) >= 0.5))) cliches++;
      if (parts.some(p => p.kind === 'user')) literal++;
      const concepts = new Set(recipeConcepts(ctx, t.recipe));
      for (const ph of phrases) {
        if (parts.some(p => p.kind === 'user' && p.phrase === ph.norm) || ph.concepts.some(c => concepts.has(c))) reflected.add(ph.norm);
      }
    }
    if (r.titles.length > 0) maxFamilyShare = Math.max(maxFamilyShare, Math.max(...families.values()) / r.titles.length);
    if (phrases.every(ph => reflected.has(ph.norm))) covered++;
  }
  const [topWord, topCount] = [...wordCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  return {
    preset: preset.name, titles, maxFamilyShare, topWordShare: titles ? topCount / titles : 0, topWord: normalize(topWord),
    clicheShare: titles ? cliches / titles : 0, literalRate: titles ? literal / titles : 0,
    phraseCoverage: batches ? covered / batches : 0, avgChars: titles ? chars / titles : 0, msPer20: ms / batches, hasThemes,
  };
}

export function checkQuality(r: QualityReport, creativity: Creativity): string[] {
  const t = QUALITY_THRESHOLDS;
  const failures: string[] = [];
  if (r.maxFamilyShare > t.maxFamilyShare) failures.push(`largest family share ${r.maxFamilyShare.toFixed(2)} > ${t.maxFamilyShare}`);
  if (r.topWordShare > t.topWordShare) failures.push(`word "${r.topWord}" in ${(r.topWordShare * 100).toFixed(1)}% of titles > ${t.topWordShare * 100}%`);
  if (r.clicheShare > t.clicheShare) failures.push(`classic frames in ${(r.clicheShare * 100).toFixed(1)}% of titles > ${t.clicheShare * 100}%`);
  if (r.hasThemes) {
    const [lo, hi] = t.literalBand[creativity];
    if (r.literalRate < lo || r.literalRate > hi) failures.push(`literal theme use ${r.literalRate.toFixed(2)} outside ${lo}–${hi}`);
    if (r.phraseCoverage < t.phraseCoverage) failures.push(`phrase coverage ${r.phraseCoverage.toFixed(2)} < ${t.phraseCoverage}`);
  }
  return failures;
}
```

Append to `packages/game-titles/src/index.ts`:
```ts
export * from './quality';
```

`scripts/quality.ts`:
```ts
import { DATA } from '@vps-name-tools/data';
import { GAME, QUALITY_PRESETS, checkQuality, measureQuality, normalizeSettings } from '@vps-name-tools/game-titles';

const check = process.argv.includes('--check');
let failed = 0;
for (const preset of QUALITY_PRESETS) {
  const s = normalizeSettings(preset.settings);
  if (!GAME.genres.some(g => g.id === s.genre) || !DATA.myths.some(m => m.id === s.myth)) {
    console.log(`SKIP  ${preset.name} (genre or cultural pack not authored yet)`);
    continue;
  }
  const r = measureQuality(preset);
  const failures = checkQuality(r, s.creativity);
  console.log(`${failures.length ? 'FAIL' : 'OK  '}  ${preset.name}: family ${r.maxFamilyShare.toFixed(2)}, top word "${r.topWord}" ${(r.topWordShare * 100).toFixed(1)}%, frames ${(r.clicheShare * 100).toFixed(1)}%, literal ${r.literalRate.toFixed(2)}, coverage ${r.phraseCoverage.toFixed(2)}, ${r.msPer20.toFixed(1)} ms/20`);
  for (const f of failures) console.log(`        - ${f}`);
  if (failures.length) failed++;
}
process.exit(check && failed > 0 ? 1 : 0);
```

Root `package.json` scripts, add:
```json
"quality": "tsx scripts/quality.ts"
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/quality.test.ts && npm test && npm run quality`
Expected: tests PASS; `npm run quality` prints SKIP for presets whose genre or pack is not authored yet and exits 0 (no `--check`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add property tests and the quality harness"
```

---

## M4 — Content

Content tasks follow the same test-first cycle. The failing checks are content tests plus `npm run validate:data`. AI may draft word lists; the implementer reviews every entry before committing it (no franchise terms, no deity or sacred names in Tier B packs, ASCII spelling, sensible concepts, no extremist-coded imagery). Record each content review in `docs/VALIDATION.md` (date, what was reviewed, by whom).

**Authoring rules shared by Tasks 19–24**

- Entry ids are lowercase kebab-case and unique across the core lexicon, packs (`<pack>.<id>`) and genres (`genre.<genre>.<id>`).
- Text is Title Case ASCII (`Rime`, `Longhall`); compound tails and place tails are lowercase (`bound`, `moor`).
- Each entry gets 2–5 concepts, most specific first. Use `family` for near-synonyms (`fire-residue`: Ash, Ember, Cinder, Soot).
- Store forms rather than guessing: irregular or tricky plurals in `forms.plural` (Wolf → Wolves, Glass → Glass is `mass: true`), adjective forms in `forms.adj` (Frost → Frozen, Ash → Ashen).
- Mark mass nouns (`Iron`, `Frost`, `Smoke`) with `mass: true`.
- Tone affinities only where they matter (−1…+1). `cliche` 0.3–0.9 on worn words (Shadow 0.8, Soul 0.7, Eternal 0.6, Legend 0.7, Echo 0.7, Quest 0.6, Doom 0.5).
- Register: `archaic` (Wyrd, Thane), `lofty` (Covenant, Aeon), `technical` (Protocol, Vector), `whimsical` (Puddle, Button), else `plain`.

### Task 19: Concept registry to release size and the alias dictionary

**Files:**
- Modify: `packages/data/src/concepts.ts` (append the concepts below), `packages/data/src/aliases.ts` (becomes an aggregator)
- Create: `packages/data/src/aliases/nature.ts`, `creatures.ts`, `sky.ts`, `home.ts`, `realm.ts`, `craft.ts`, `journey.ts`, `myth.ts`, `mind.ts`, `genre-talk.ts`
- Test: `packages/data/test/content-steering.test.ts`

**Interfaces:**
- Consumes: `concept` builder, `CONCEPTS`, `ALIASES`, `DATA`, `buildSteeringIndex` (Task 9); `parseThemes` (Task 6).
- Produces: `CONCEPTS` with ≥ 250 ids; `ALIASES` with ≥ 1,000 keys. Later tasks may reference every concept added here.

- [ ] **Step 1: Write the failing test**

`packages/data/test/content-steering.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, parseThemes } from '@vps-name-tools/core';
import { ALIASES, CONCEPTS, DATA, buildSteeringIndex } from '../src/index';

const index = buildSteeringIndex(DATA);
const conceptsOf = (phrase: string) => parseThemes(phrase, index).phrases[0]?.concepts ?? [];
const expectConcepts = (phrase: string, expected: readonly string[]) => {
  const got = conceptsOf(phrase);
  for (const c of expected) assert.ok(got.includes(c), `"${phrase}" should steer to ${c}; got ${got.join(', ')}`);
};

test('the concept registry meets the release target', () => {
  assert.ok(CONCEPTS.length >= 250, String(CONCEPTS.length));
});

test('the alias dictionary meets the release target and is well formed', () => {
  const keys = Object.keys(ALIASES);
  assert.ok(keys.length >= 1000, String(keys.length));
  for (const k of keys) {
    assert.equal(k, normalize(k), k);
    const cs = ALIASES[k];
    assert.ok(cs.length >= 1 && cs.length <= 6, `${k}: ${cs.length} concepts`);
    assert.equal(new Set(cs).size, cs.length, `${k} repeats a concept`);
  }
});

test('every concept is reachable from at least two alias keys', () => {
  const reach = new Map<string, number>();
  for (const cs of Object.values(ALIASES)) for (const c of cs) reach.set(c, (reach.get(c) ?? 0) + 1);
  const missing = CONCEPTS.filter(c => (reach.get(c.id) ?? 0) < 2).map(c => c.id);
  assert.deepEqual(missing, []);
});

test('the worked examples in spec Appendix C steer as described', () => {
  expectConcepts('northern lights', ['aurora', 'sky', 'light', 'north']);
  expectConcepts('frozen kingdom', ['cold', 'winter', 'ice', 'realm', 'crown']);
  expectConcepts('forgotten gods', ['gods', 'forgotten', 'silence', 'ruin']);
  expectConcepts('blood oath', ['blood', 'oath', 'vow', 'kin']);
  expectConcepts('analog horror', ['signal', 'static', 'tape', 'broadcast', 'dread']);
  expectConcepts('abandoned radio tower', ['signal', 'tower', 'isolation', 'broadcast']);
  expectConcepts('snowstorm', ['snow', 'storm', 'cold']);
  expectConcepts('missing hikers', ['absence', 'journey', 'mountain']);
  expectConcepts('cute creatures', ['creature', 'whimsy']);
  expectConcepts('cozy exploration', ['comfort', 'home', 'exploration']);
});

test('common genre talk is understood', () => {
  expectConcepts('soulslike', ['death', 'ruin']);
  expectConcepts('cottagecore', ['cottage', 'garden', 'comfort']);
  expectConcepts('pirates', ['sea', 'ship', 'outlaw']);
  expectConcepts('time travel', ['time', 'journey']);
  expectConcepts('eldritch', ['abyss', 'dread']);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/data/test/content-steering.test.ts`
Expected: FAIL (217 concepts; 0 aliases).

- [ ] **Step 3: Append concepts**

Append inside the `CONCEPTS` array in `packages/data/src/concepts.ts`:
```ts
  // added in Task 19
  c('north', ['cold', 'winter', 'aurora']), c('wing', ['bird', 'sky', 'raven']), c('feather', ['bird', 'wing', 'light']),
  c('tape', ['memory', 'static', 'broadcast']), c('broadcast', ['signal', 'static', 'network']), c('frequency', ['signal', 'broadcast', 'static']),
  c('tower', ['stone', 'isolation', 'signal']), c('castle', ['realm', 'stone', 'siege']), c('tomb', ['grave', 'ancient', 'death']),
  c('thorn', ['curse', 'garden', 'blood']), c('pyre', ['fire', 'death', 'grave']), c('glass', ['mirror', 'light', 'prism']),
  c('silver', ['moon', 'light', 'elegance']), c('gem', ['gold', 'stone', 'light']), c('elegance', ['silver', 'glass', 'love']),
  c('song', ['legend', 'memory', 'joy']), c('letter', ['secret', 'love', 'memory']), c('ink', ['knowledge', 'letter', 'secret']),
  c('book', ['knowledge', 'ink', 'legend']), c('mask', ['secret', 'play', 'mirror']), c('eye', ['omen', 'mirror', 'dread']),
  c('heart', ['love', 'blood', 'hope']), c('eclipse', ['sun', 'moon', 'omen']), c('comet', ['star', 'omen', 'sky']),
  c('nebula', ['cosmos', 'star', 'space']), c('fleet', ['ship', 'war', 'space']), c('clockwork', ['gear', 'machine', 'time']),
  c('airship', ['sky', 'steam', 'voyage']), c('industry', ['machine', 'smoke', 'work']), c('jungle', ['forest', 'wild', 'heat']),
  c('heat', ['sun', 'fire', 'desert']), c('reef', ['sea', 'island', 'creature']), c('volcano', ['fire', 'mountain', 'earth']),
  c('glacier', ['ice', 'mountain', 'cold']), c('flood', ['rain', 'river', 'ruin']), c('plague', ['rot', 'death', 'hunger']),
  c('witch', ['magic', 'curse', 'forest']), c('knight', ['hero', 'oath', 'blade']), c('trickster', ['chance', 'secret', 'play']),
  c('guardian', ['hero', 'shelter', 'oath']), c('wanderer', ['journey', 'path', 'isolation']), c('exile', ['absence', 'journey', 'sorrow']),
  c('crossroads', ['path', 'fate', 'chance']), c('threshold', ['door', 'path', 'secret']), c('veil', ['secret', 'mist', 'spirit']),
  c('feast', ['food', 'joy', 'community']), c('ghost', ['spirit', 'haunting', 'memory']), c('shadow', ['darkness', 'secret', 'fear']),
  c('forgotten', ['memory', 'absence', 'ruin']), c('lightning', ['storm', 'sky', 'rage']), c('salt', ['sea', 'survival', 'ruin']),
  c('cave', ['deep', 'stone', 'shelter']), c('underworld', ['afterlife', 'deep', 'death']), c('labyrinth', ['puzzle', 'path', 'secret']),
  c('season', ['cycle', 'harvest', 'time']), c('cottage', ['home', 'forest', 'comfort']),
```
That brings the registry to 273 concepts.

- [ ] **Step 4: Write the alias files**

`packages/data/src/aliases.ts` becomes:
```ts
import type { ConceptId } from '@vps-name-tools/core';
import { CRAFT } from './aliases/craft';
import { CREATURES } from './aliases/creatures';
import { GENRE_TALK } from './aliases/genre-talk';
import { HOME } from './aliases/home';
import { JOURNEY } from './aliases/journey';
import { MIND } from './aliases/mind';
import { MYTH } from './aliases/myth';
import { NATURE } from './aliases/nature';
import { REALM } from './aliases/realm';
import { SKY } from './aliases/sky';

type AliasMap = Readonly<Record<string, readonly ConceptId[]>>;
const parts: readonly AliasMap[] = [NATURE, CREATURES, SKY, HOME, REALM, CRAFT, JOURNEY, MYTH, MIND, GENRE_TALK];

/** Normalised phrase → concepts. A key may appear in one file only (the content test checks the count). */
export const ALIASES: AliasMap = Object.assign({}, ...parts);
```

Each file exports one `Readonly<Record<string, readonly ConceptId[]>>`. Seed every file with the entries below (they are required by the tests or by the spec's worked examples), then author the rest to reach at least 1,000 keys in total:

`packages/data/src/aliases/sky.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const SKY: Readonly<Record<string, readonly ConceptId[]>> = {
  'northern lights': ['aurora', 'sky', 'light', 'north', 'cold'],
  'aurora borealis': ['aurora', 'sky', 'north', 'light'],
  'polar lights': ['aurora', 'north', 'cold'],
  'night sky': ['night', 'star', 'sky'],
  'starlight': ['star', 'light', 'night'],
  'starfall': ['star', 'comet', 'omen'],
  'shooting star': ['comet', 'star', 'hope'],
  'black hole': ['void', 'cosmos', 'abyss'],
  'deep space': ['space', 'void', 'isolation'],
  'solar flare': ['sun', 'fire', 'signal'],
  'full moon': ['moon', 'night', 'omen'],
  'blood moon': ['moon', 'blood', 'omen'],
  'twilight': ['dusk', 'night', 'sorrow'],
  'sunrise': ['dawn', 'sun', 'hope'],
  'sunset': ['dusk', 'sun', 'sorrow'],
  'thunderstorm': ['storm', 'lightning', 'rain'],
  'celestial': ['star', 'sky', 'gods'],
  'astral': ['star', 'spirit', 'cosmos'],
};
```

`packages/data/src/aliases/nature.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const NATURE: Readonly<Record<string, readonly ConceptId[]>> = {
  frozen: ['cold', 'ice', 'winter'],
  icy: ['ice', 'cold'],
  glacial: ['glacier', 'ice', 'cold'],
  snowstorm: ['snow', 'storm', 'cold', 'winter'],
  blizzard: ['snow', 'storm', 'cold'],
  whiteout: ['snow', 'storm', 'absence'],
  tundra: ['cold', 'north', 'wild'],
  'frozen wasteland': ['ice', 'wasteland', 'cold'],
  wildfire: ['fire', 'ruin', 'wild'],
  embers: ['fire', 'warmth', 'ruin'],
  ocean: ['sea', 'deep', 'voyage'],
  'deep sea': ['deep', 'sea', 'abyss'],
  coral: ['reef', 'sea', 'creature'],
  rainforest: ['jungle', 'rain', 'wild'],
  woodland: ['forest', 'tree', 'wild'],
  'dark forest': ['forest', 'darkness', 'dread'],
  mushrooms: ['fungus', 'forest', 'transformation'],
  bog: ['swamp', 'mist', 'rot'],
  marsh: ['swamp', 'mist', 'river'],
  dunes: ['desert', 'sand', 'heat'],
  canyonlands: ['canyon', 'desert', 'frontier'],
  pines: ['forest', 'tree', 'cold'],
  orchard: ['garden', 'harvest', 'tree'],
  flowers: ['bloom', 'garden', 'spring'],
  petals: ['bloom', 'spring', 'love'],
};
```

`packages/data/src/aliases/realm.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const REALM: Readonly<Record<string, readonly ConceptId[]>> = {
  'frozen kingdom': ['cold', 'winter', 'ice', 'realm', 'crown'],
  kingdom: ['realm', 'crown', 'throne'],
  kingdoms: ['realm', 'crown', 'war'],
  'fallen kingdom': ['realm', 'ruin', 'history'],
  'lost kingdom': ['realm', 'forgotten', 'ruin'],
  monarchy: ['crown', 'throne', 'dynasty'],
  royalty: ['crown', 'throne', 'elegance'],
  'blood oath': ['blood', 'oath', 'vow', 'kin'],
  'oath breaker': ['oath', 'ruin', 'exile'],
  knights: ['knight', 'oath', 'blade'],
  'holy war': ['war', 'faith', 'siege'],
  mercenaries: ['war', 'gold', 'outlaw'],
  rebels: ['rebellion', 'hope', 'chaos'],
  revolution: ['rebellion', 'chaos', 'order'],
  vikings: ['sea', 'ship', 'war', 'north'],
  pirates: ['sea', 'ship', 'outlaw', 'gold'],
  heist: ['crime', 'gold', 'secret'],
  'wild west': ['frontier', 'outlaw', 'desert'],
  cowboys: ['frontier', 'horse', 'outlaw'],
  gunslinger: ['outlaw', 'frontier', 'bounty'],
};
```

`packages/data/src/aliases/myth.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const MYTH: Readonly<Record<string, readonly ConceptId[]>> = {
  'forgotten gods': ['gods', 'forgotten', 'silence', 'ruin'],
  'old gods': ['gods', 'ancient', 'forgotten'],
  'dead gods': ['gods', 'death', 'ruin'],
  pantheon: ['gods', 'legend', 'faith'],
  eldritch: ['abyss', 'dread', 'cosmos', 'ancient'],
  lovecraftian: ['abyss', 'dread', 'deep', 'cosmos'],
  'cosmic horror': ['cosmos', 'dread', 'void', 'abyss'],
  necromancy: ['death', 'magic', 'grave'],
  necromancer: ['death', 'magic', 'grave'],
  undead: ['death', 'grave', 'haunting'],
  vampires: ['blood', 'night', 'curse'],
  werewolves: ['wolf', 'moon', 'curse', 'transformation'],
  witches: ['witch', 'magic', 'forest'],
  witchy: ['witch', 'magic', 'moon'],
  spells: ['magic', 'rune', 'curse'],
  prophecies: ['prophecy', 'fate', 'omen'],
  'chosen one': ['prophecy', 'hero', 'fate'],
  afterlife: ['afterlife', 'spirit', 'death'],
  ghosts: ['ghost', 'haunting', 'spirit'],
  'fairy tale': ['wonder', 'forest', 'curse'],
};
```

`packages/data/src/aliases/mind.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const MIND: Readonly<Record<string, readonly ConceptId[]>> = {
  missing: ['absence', 'mystery', 'dread'],
  'missing hikers': ['absence', 'journey', 'mountain', 'dread'],
  abandoned: ['absence', 'isolation', 'ruin'],
  lonely: ['isolation', 'sorrow', 'silence'],
  loneliness: ['isolation', 'sorrow', 'absence'],
  creepy: ['dread', 'haunting', 'fear'],
  eerie: ['dread', 'silence', 'haunting'],
  unsettling: ['dread', 'fear', 'mystery'],
  liminal: ['threshold', 'absence', 'dream'],
  nostalgia: ['memory', 'sorrow', 'home'],
  grief: ['sorrow', 'memory', 'absence'],
  madness: ['chaos', 'dread', 'mirror'],
  paranoia: ['fear', 'secret', 'dread'],
  hopeful: ['hope', 'light', 'dawn'],
  cute: ['whimsy', 'creature', 'joy'],
  'cute creatures': ['creature', 'whimsy', 'joy'],
  wholesome: ['comfort', 'friendship', 'joy'],
  cozy: ['comfort', 'home', 'warmth'],
  'cozy exploration': ['comfort', 'home', 'exploration', 'wonder'],
  'found family': ['kin', 'friendship', 'home'],
};
```

`packages/data/src/aliases/craft.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const CRAFT: Readonly<Record<string, readonly ConceptId[]>> = {
  'analog horror': ['signal', 'static', 'tape', 'broadcast', 'dread'],
  'radio tower': ['tower', 'signal', 'broadcast', 'isolation'],
  'abandoned radio tower': ['signal', 'tower', 'isolation', 'broadcast', 'absence'],
  radio: ['signal', 'broadcast', 'frequency'],
  vhs: ['tape', 'static', 'memory'],
  cassette: ['tape', 'memory', 'static'],
  'found footage': ['tape', 'dread', 'absence'],
  robots: ['machine', 'technology', 'code'],
  androids: ['machine', 'mirror', 'technology'],
  ai: ['code', 'machine', 'network'],
  hackers: ['code', 'network', 'crime'],
  megacorp: ['corporation', 'chrome', 'order'],
  mechs: ['machine', 'war', 'iron'],
  spaceships: ['ship', 'space', 'voyage'],
  'space station': ['station', 'orbit', 'isolation'],
  'time travel': ['time', 'journey', 'loop'],
  'time loop': ['loop', 'time', 'routine'],
  airships: ['airship', 'sky', 'steam'],
  clockwork: ['clockwork', 'gear', 'machine'],
  factories: ['industry', 'smoke', 'machine'],
};
```

`packages/data/src/aliases/journey.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const JOURNEY: Readonly<Record<string, readonly ConceptId[]>> = {
  exploration: ['exploration', 'map', 'wonder'],
  explorer: ['exploration', 'journey', 'map'],
  expedition: ['exploration', 'journey', 'voyage'],
  hikers: ['journey', 'mountain', 'path'],
  hiking: ['journey', 'mountain', 'path'],
  'road trip': ['journey', 'path', 'friendship'],
  pilgrimage: ['journey', 'faith', 'path'],
  quest: ['journey', 'hero', 'legend'],
  wandering: ['wanderer', 'journey', 'path'],
  sailing: ['voyage', 'sea', 'wind'],
  'island hopping': ['island', 'voyage', 'sea'],
  islands: ['island', 'sea', 'exploration'],
  dungeon: ['depth', 'descent', 'secret'],
  dungeons: ['depth', 'descent', 'secret'],
  'endless descent': ['descent', 'depth', 'abyss'],
  roguelike: ['descent', 'loop', 'chance'],
  roguelite: ['descent', 'loop', 'chance'],
  metroidvania: ['exploration', 'map', 'secret'],
  'open world': ['exploration', 'map', 'wild'],
  survival: ['survival', 'hunger', 'shelter'],
};
```

`packages/data/src/aliases/home.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const HOME: Readonly<Record<string, readonly ConceptId[]>> = {
  cottagecore: ['cottage', 'garden', 'comfort', 'bloom'],
  farming: ['harvest', 'seed', 'garden'],
  farm: ['harvest', 'village', 'seed'],
  'small town': ['village', 'community', 'home'],
  village: ['village', 'community', 'home'],
  tea: ['comfort', 'warmth', 'home'],
  baking: ['food', 'warmth', 'home'],
  cooking: ['food', 'comfort', 'craft'],
  'potion shop': ['shop', 'magic', 'craft'],
  bakery: ['food', 'shop', 'warmth'],
  'cozy cafe': ['food', 'comfort', 'community'],
  friendship: ['friendship', 'bond', 'joy'],
  friends: ['friendship', 'joy', 'bond'],
  pets: ['creature', 'bond', 'comfort'],
  collecting: ['collecting', 'creature', 'wonder'],
  'creature collecting': ['collecting', 'creature', 'bond'],
  nests: ['nest', 'home', 'bird'],
  festival: ['feast', 'joy', 'community'],
  lanterns: ['light', 'warmth', 'home'],
  hearth: ['home', 'warmth', 'fire'],
};
```

`packages/data/src/aliases/creatures.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const CREATURES: Readonly<Record<string, readonly ConceptId[]>> = {
  dragons: ['dragon', 'fire', 'legend'],
  wyverns: ['dragon', 'sky', 'beast'],
  monsters: ['beast', 'dread', 'creature'],
  kaiju: ['beast', 'ruin', 'sea'],
  wolves: ['wolf', 'hunt', 'wild'],
  'wolf pack': ['wolf', 'kin', 'hunt'],
  crows: ['raven', 'omen', 'bird'],
  owls: ['bird', 'night', 'wisdom'],
  snakes: ['serpent', 'curse', 'secret'],
  serpents: ['serpent', 'deep', 'curse'],
  'sea monsters': ['beast', 'deep', 'sea'],
  insects: ['creature', 'swamp', 'chaos'],
  slimes: ['creature', 'whimsy', 'transformation'],
  'tiny creatures': ['creature', 'whimsy', 'home'],
  familiars: ['creature', 'bond', 'magic'],
  spirits: ['spirit', 'ghost', 'magic'],
  zombies: ['death', 'rot', 'plague'],
  beasts: ['beast', 'wild', 'hunt'],
  horses: ['horse', 'journey', 'frontier'],
  foxes: ['fox', 'forest', 'trickster'],
};
```
`packages/data/src/aliases/genre-talk.ts` (seed):
```ts
import type { ConceptId } from '@vps-name-tools/core';
export const GENRE_TALK: Readonly<Record<string, readonly ConceptId[]>> = {
  soulslike: ['death', 'ruin', 'curse', 'hunger'],
  grimdark: ['war', 'ruin', 'blood', 'darkness'],
  'dark fantasy': ['darkness', 'curse', 'ruin'],
  'high fantasy': ['legend', 'magic', 'realm'],
  'sword and sorcery': ['blade', 'magic', 'hero'],
  cyberpunk: ['neon', 'chrome', 'code', 'city'],
  solarpunk: ['sun', 'garden', 'hope', 'technology'],
  steampunk: ['steam', 'gear', 'airship'],
  dieselpunk: ['industry', 'iron', 'propaganda'],
  'post apocalyptic': ['aftermath', 'wasteland', 'survival'],
  'post apocalypse': ['aftermath', 'wasteland', 'ruin'],
  apocalypse: ['aftermath', 'ruin', 'death'],
  noir: ['crime', 'rain', 'smoke', 'case'],
  detective: ['case', 'clue', 'mystery'],
  'space opera': ['empire', 'fleet', 'star'],
  'space western': ['frontier', 'space', 'outlaw'],
  'weird west': ['frontier', 'curse', 'dust'],
  deckbuilder: ['deck', 'chance', 'play'],
  'tower defense': ['tower', 'siege', 'command'],
  'city builder': ['city', 'building', 'community'],
};
```

Authoring the remaining keys (to ≥ 1,000): for every concept, add 3–6 keys users might type (synonyms, plurals that are not lexicon words, adjectives, two-word phrases, genre jargon), keeping each key in the file whose area it belongs to. Use `npx tsx -e "import('@vps-name-tools/data').then(d=>console.log(Object.keys(d.ALIASES).length))"` to watch the count.

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test packages/data/test/content-steering.test.ts && npm run validate:data`
Expected: PASS (5 tests); validator 0 errors (the concepts and aliases warnings are gone).

- [ ] **Step 6: Commit**

```bash
git add packages/data
git commit -m "Extend the concept registry and add the alias dictionary"
```

---

### Task 20: The 19 tones and 16 phonetic profiles

**Files:**
- Modify: `packages/data/src/tones.ts`, `packages/data/src/profiles/index.ts`
- Create: `packages/data/src/profiles/norse.ts`, `germanic.ts`, `old-english.ts`, `celtic.ts`, `elven.ts`, `slavic.ts`, `finnic.ts`, `latin.ts`, `hellenic.ts`, `ancient.ts`, `cosmic.ts`, `scifi.ts`, `cyberpunk.ts`, `soft.ts`, `japanese.ts`
- Create: `scripts/sample-profiles.ts`; root `package.json` script `"sample:profiles": "tsx scripts/sample-profiles.ts"`
- Test: `packages/data/test/tones-profiles.test.ts`

**Interfaces:**
- Consumes: `ToneDef` (Task 9, including `soundProfile` and `maxCoinedLetters`), `PhoneticProfile`, `coinWord`, `readable`, `createRng` (Task 7).
- Produces: `TONES` (19, `TONE_IDS` order), `PROFILES` (16, `PROFILE_IDS` order).

- [ ] **Step 1: Write the failing test**

`packages/data/test/tones-profiles.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coinWord, createRng, readable } from '@vps-name-tools/core';
import { PROFILES, PROFILE_IDS, TONES, TONE_IDS } from '../src/index';

test('19 tones in id order with lowercase note words', () => {
  assert.deepEqual(TONES.map(t => t.id), [...TONE_IDS]);
  for (const t of TONES) assert.equal(t.noteWord, t.noteWord.toLowerCase(), t.id);
});

test('16 profiles in id order', () => {
  assert.deepEqual(PROFILES.map(p => p.id), [...PROFILE_IDS]);
});

for (const profile of PROFILES) {
  test(`profile ${profile.id} produces readable words reliably`, () => {
    const rng = createRng(`profile:${profile.id}`);
    let made = 0;
    for (let i = 0; i < 500; i++) {
      const w = coinWord(rng, profile);
      if (!w) continue;
      made++;
      assert.ok(readable(w.text, profile), `${profile.id}: ${w.text}`);
      if (profile.id !== 'cosmic') assert.ok(!w.text.includes("'"), `${profile.id}: ${w.text}`);
    }
    assert.ok(made >= 475, `${profile.id}: only ${made}/500`);
  });

  test(`profile ${profile.id} can make brandable 5–9 letter words`, () => {
    const rng = createRng(`brand:${profile.id}`);
    let made = 0;
    for (let i = 0; i < 200; i++) if (coinWord(rng, profile, { minLetters: 5, maxLetters: 9 })) made++;
    assert.ok(made >= 180, `${profile.id}: only ${made}/200`);
  });
}

test('profiles sound different from each other', () => {
  const sample = (id: string) => {
    const p = PROFILES.find(x => x.id === id)!;
    const rng = createRng(`distinct:${id}`);
    return new Set(Array.from({ length: 300 }, () => coinWord(rng, p)?.text.toLowerCase()).filter(Boolean));
  };
  const norse = sample('norse');
  const soft = sample('soft');
  const overlap = [...norse].filter(w => soft.has(w)).length;
  assert.ok(overlap / norse.size < 0.02, `overlap ${overlap}`);
});

test('Japanese-inspired words follow mora shapes', () => {
  const p = PROFILES.find(x => x.id === 'japanese')!;
  const rng = createRng('mora');
  const mora = /^(?:(?:sh|ch|ts|[kgsztdnhbpmyrwfj])?[aeiou]|n(?![aeiou]))+$/;
  for (let i = 0; i < 500; i++) {
    const w = coinWord(rng, p);
    if (w) assert.match(w.text.toLowerCase(), mora, w.text);
  }
});

test('Norse words never end in the -heim cliché and Germanic words never contain coded fragments', () => {
  const norse = PROFILES.find(x => x.id === 'norse')!;
  const germanic = PROFILES.find(x => x.id === 'germanic')!;
  const r = createRng('coded');
  for (let i = 0; i < 1000; i++) {
    const a = coinWord(r, norse);
    if (a) assert.doesNotMatch(a.text.toLowerCase(), /heim$/);
    const b = coinWord(r, germanic);
    if (b) assert.doesNotMatch(b.text.toLowerCase(), /reich|volk|heil|sieg/);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/data/test/tones-profiles.test.ts`
Expected: FAIL (0 tones, 1 profile).

- [ ] **Step 3: Write the tones**

`packages/data/src/tones.ts`:
```ts
import type { ToneDef } from './types';

/** Spec §6. Concept boosts above 1 favour, below 1 disfavour; family weights shift structures. */
export const TONES: readonly ToneDef[] = [
  { id: 'epic', label: 'Epic', noteWord: 'epic',
    conceptBoosts: { legend: 1.5, age: 1.4, crown: 1.4, realm: 1.3, war: 1.3, hero: 1.3 },
    familyWeights: { 'of-phrase': 1.4, subtitle: 1.3, frame: 1.3, saga: 1.3 } },
  { id: 'dark', label: 'Dark', noteWord: 'dark',
    conceptBoosts: { darkness: 1.5, night: 1.5, ruin: 1.5, blood: 1.4, rot: 1.4, curse: 1.3, death: 1.3, joy: 0.5 },
    familyWeights: { pair: 1.3, single: 1.2, prepositional: 1.3 } },
  { id: 'grim', label: 'Grim', noteWord: 'grim',
    conceptBoosts: { hunger: 1.5, ruin: 1.4, iron: 1.4, grave: 1.4, cold: 1.4, death: 1.3, survival: 1.2, whimsy: 0.4 },
    familyWeights: { single: 1.3, compound: 1.3, number: 1.3 }, maxCoinedLetters: 8 },
  { id: 'mystical', label: 'Mystical', noteWord: 'mystical',
    conceptBoosts: { rune: 1.5, veil: 1.5, star: 1.4, moon: 1.4, dream: 1.4, magic: 1.4, spirit: 1.3 },
    familyWeights: { 'of-phrase': 1.3, prepositional: 1.3 }, soundProfile: 'elven' },
  { id: 'heroic', label: 'Heroic', noteWord: 'heroic',
    conceptBoosts: { hero: 1.5, dawn: 1.5, banner: 1.5, oath: 1.4, blade: 1.4, hope: 1.4 },
    familyWeights: { imperative: 1.4, frame: 1.2, subtitle: 1.3 } },
  { id: 'whimsical', label: 'Whimsical', noteWord: 'whimsical',
    conceptBoosts: { whimsy: 1.6, berry: 1.4, play: 1.4, creature: 1.3, wonder: 1.3, gore: 0.2, war: 0.5 },
    familyWeights: { possessive: 1.4, duo: 1.4 }, alliterationBonus: 1, soundProfile: 'soft' },
  { id: 'cozy', label: 'Cozy', noteWord: 'cozy',
    conceptBoosts: { home: 1.6, warmth: 1.6, comfort: 1.6, cottage: 1.4, moss: 1.3, garden: 1.3, food: 1.3, gore: 0.1, war: 0.3, death: 0.3 },
    familyWeights: { place: 1.5, possessive: 1.4 }, alliterationBonus: 0.5, soundProfile: 'soft' },
  { id: 'romantic', label: 'Romantic', noteWord: 'romantic',
    conceptBoosts: { love: 1.6, heart: 1.5, vow: 1.5, letter: 1.4, moon: 1.3, bloom: 1.3, gore: 0.3 },
    familyWeights: { duo: 1.4, prepositional: 1.2, possessive: 1.3 }, soundProfile: 'soft' },
  { id: 'melancholic', label: 'Melancholic', noteWord: 'melancholic',
    conceptBoosts: { sorrow: 1.6, absence: 1.5, rain: 1.4, silence: 1.4, memory: 1.4, forgotten: 1.3, dusk: 1.3 },
    familyWeights: { sentence: 1.4, prepositional: 1.3, single: 1.2 } },
  { id: 'brutal', label: 'Brutal', noteWord: 'brutal',
    conceptBoosts: { rage: 1.6, bone: 1.5, siege: 1.4, beast: 1.4, war: 1.4, blood: 1.3, gore: 1.2, whimsy: 0.3 },
    familyWeights: { single: 1.3, compound: 1.3, imperative: 1.3 }, maxCoinedLetters: 7 },
  { id: 'mysterious', label: 'Mysterious', noteWord: 'mysterious',
    conceptBoosts: { secret: 1.6, mystery: 1.5, mist: 1.4, door: 1.4, absence: 1.3, clue: 1.3, mask: 1.2 },
    familyWeights: { 'the-noun': 1.3, prepositional: 1.2, imperative: 1.3 } },
  { id: 'ancient', label: 'Ancient', noteWord: 'ancient',
    conceptBoosts: { ancient: 1.6, age: 1.5, relic: 1.5, tomb: 1.4, history: 1.3, ruin: 1.2 },
    familyWeights: { 'of-phrase': 1.3, saga: 1.5, epithet: 1.5 }, soundProfile: 'ancient' },
  { id: 'elegant', label: 'Elegant', noteWord: 'elegant',
    conceptBoosts: { elegance: 1.6, silver: 1.5, glass: 1.5, light: 1.2, bloom: 1.2, moon: 1.2, gore: 0.3 },
    familyWeights: { 'the-noun': 1.3, duo: 1.3, prepositional: 1.2 }, soundProfile: 'elven' },
  { id: 'weird', label: 'Weird', noteWord: 'weird',
    conceptBoosts: { fungus: 1.6, eye: 1.5, transformation: 1.4, chaos: 1.3, mirror: 1.2, knot: 1.2 },
    familyWeights: { sentence: 1.4, compound: 1.2, coined: 1.3 } },
  { id: 'surreal', label: 'Surreal', noteWord: 'surreal',
    conceptBoosts: { dream: 1.6, time: 1.4, door: 1.4, mirror: 1.4, transformation: 1.3, sky: 1.2 },
    familyWeights: { sentence: 1.4, prepositional: 1.3 } },
  { id: 'cinematic', label: 'Cinematic', noteWord: 'cinematic',
    conceptBoosts: { dawn: 1.3, signal: 1.2, war: 1.2, hero: 1.2, code: 1.2, aftermath: 1.2 },
    familyWeights: { subtitle: 1.5, number: 1.4, code: 1.3 } },
  { id: 'minimalist', label: 'Minimalist', noteWord: 'minimalist',
    conceptBoosts: { silence: 1.2, shape: 1.2, light: 1.1 },
    familyWeights: { single: 1.8, coined: 1.4, subtitle: 0.4, frame: 0.4, sentence: 0.5, triad: 0.3 }, maxCoinedLetters: 8 },
  { id: 'retro', label: 'Retro', noteWord: 'retro',
    conceptBoosts: { play: 1.3, machine: 1.2, hero: 1.2, technology: 1.1 },
    familyWeights: { suffix: 2, 'adj-noun': 1.2 } },
  { id: 'playful', label: 'Playful', noteWord: 'playful',
    conceptBoosts: { play: 1.6, joy: 1.5, friendship: 1.3, creature: 1.3, whimsy: 1.3, gore: 0.2 },
    familyWeights: { duo: 1.4, compound: 1.2, possessive: 1.3 }, alliterationBonus: 1, soundProfile: 'soft' },
];
```

- [ ] **Step 4: Write the 15 profiles**

Each file exports one constant named after the profile in capitals. Spellings stay ASCII. These are inspiration systems, not real languages.

`packages/data/src/profiles/norse.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const NORSE: PhoneticProfile = {
  id: 'norse', label: 'Norse',
  onsets: [['b', 1], ['d', 1], ['f', 0.8], ['g', 1], ['h', 0.8], ['k', 1], ['l', 0.8], ['m', 0.6], ['n', 0.6], ['r', 1], ['s', 1], ['t', 1], ['v', 1],
    ['sk', 0.6], ['st', 0.6], ['sv', 0.3], ['br', 0.5], ['dr', 0.4], ['fr', 0.4], ['gr', 0.6], ['kr', 0.4], ['tr', 0.4], ['th', 0.5], ['hv', 0.2]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 1], ['u', 0.6], ['y', 0.3], ['au', 0.2], ['ei', 0.3]],
  codas: [['', 1.5], ['r', 1], ['n', 1], ['l', 0.8], ['m', 0.4], ['k', 0.8], ['g', 0.6], ['d', 0.6], ['t', 0.5], ['rn', 0.4], ['rd', 0.3], ['ld', 0.4], ['nd', 0.4], ['rk', 0.3], ['st', 0.3]],
  shapes: [['CVC', 5], ['CV', 3], ['VC', 0.4]],
  syllables: [[2, 7], [3, 2.5], [1, 0.5]],
  endings: [['gard', 0.6], ['vald', 0.6], ['mark', 0.5], ['fell', 0.5], ['vik', 0.5], ['dal', 0.5], ['holt', 0.5], ['run', 0.4], ['ir', 0.4]],
  endingChance: 0.35,
  forbid: ['q', 'c', 'yy', 'uu', '^ng', "'", 'heim$'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/germanic.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const GERMANIC: PhoneticProfile = {
  id: 'germanic', label: 'Germanic',
  onsets: [['b', 1], ['d', 1], ['f', 0.7], ['g', 0.9], ['h', 0.8], ['k', 0.8], ['l', 0.8], ['m', 0.7], ['n', 0.6], ['r', 0.9], ['s', 0.8], ['t', 0.9], ['w', 0.8],
    ['br', 0.4], ['dr', 0.3], ['fr', 0.4], ['gr', 0.4], ['kr', 0.3], ['st', 0.4], ['sw', 0.3], ['gl', 0.2]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 0.9], ['u', 0.6], ['au', 0.2], ['ei', 0.3], ['ie', 0.2]],
  codas: [['', 1.5], ['r', 1], ['n', 1], ['l', 0.8], ['m', 0.4], ['k', 0.5], ['d', 0.5], ['t', 0.5], ['rn', 0.3], ['ld', 0.4], ['nd', 0.4], ['rt', 0.3], ['lf', 0.2], ['rk', 0.2]],
  shapes: [['CVC', 5], ['CV', 3], ['VC', 0.3]],
  syllables: [[2, 7], [3, 2], [1, 0.5]],
  endings: [['mund', 0.6], ['wald', 0.6], ['burg', 0.5], ['hild', 0.5], ['ric', 0.5], ['helm', 0.4], ['brand', 0.3], ['wulf', 0.3]],
  endingChance: 0.4,
  forbid: ['q', 'c(?!k)', 'yy', 'uu', "'", 'reich', 'volk', 'heil', 'sieg'],
  letters: [4, 11],
};
```

`packages/data/src/profiles/old-english.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const OLD_ENGLISH: PhoneticProfile = {
  id: 'old-english', label: 'Old English',
  onsets: [['b', 1], ['d', 1], ['f', 0.8], ['g', 0.8], ['h', 0.7], ['l', 0.9], ['m', 0.8], ['n', 0.6], ['r', 0.8], ['s', 0.9], ['t', 0.8], ['w', 1], ['th', 0.7],
    ['br', 0.4], ['gr', 0.3], ['hr', 0.2], ['wr', 0.3], ['sw', 0.3], ['st', 0.4], ['sc', 0.2]],
  nuclei: [['a', 1.1], ['e', 1], ['i', 0.7], ['o', 0.8], ['u', 0.5], ['ae', 0.3], ['ea', 0.3], ['eo', 0.2]],
  codas: [['', 1.5], ['r', 0.9], ['n', 0.9], ['l', 0.8], ['m', 0.4], ['d', 0.6], ['t', 0.4], ['th', 0.4], ['st', 0.3], ['ld', 0.4], ['rd', 0.3], ['nd', 0.4], ['ng', 0.2]],
  shapes: [['CVC', 4], ['CV', 3], ['VC', 0.3]],
  syllables: [[2, 7], [3, 2], [1, 0.5]],
  endings: [['ric', 0.5], ['wine', 0.4], ['stan', 0.5], ['ford', 0.4], ['mere', 0.4], ['wulf', 0.4], ['ham', 0.3], ['here', 0.3], ['gar', 0.4], ['helm', 0.3]],
  endingChance: 0.4,
  forbid: ['q', 'c[eiy]', 'x', 'z', "'", 'yy'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/celtic.ts` (restrained: English-readable, no imitation Gaelic spelling):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const CELTIC: PhoneticProfile = {
  id: 'celtic', label: 'Celtic-inspired',
  onsets: [['b', 1], ['c', 0.7], ['d', 1], ['g', 0.7], ['k', 0.4], ['l', 1], ['m', 1], ['n', 0.8], ['r', 0.9], ['s', 0.7], ['t', 0.8], ['f', 0.5],
    ['br', 0.4], ['gl', 0.3], ['gw', 0.3], ['dr', 0.3], ['tr', 0.3], ['cr', 0.3]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.8], ['o', 0.9], ['u', 0.5], ['ai', 0.3], ['ei', 0.2], ['y', 0.3]],
  codas: [['', 2], ['n', 1], ['r', 0.9], ['l', 0.8], ['m', 0.4], ['th', 0.3], ['ch', 0.2], ['d', 0.4], ['nn', 0.2]],
  shapes: [['CV', 4], ['CVC', 4], ['V', 0.3]],
  syllables: [[2, 7], [3, 2], [1, 0.4]],
  endings: [['wyn', 0.5], ['ach', 0.4], ['mor', 0.5], ['dun', 0.4], ['an', 0.5], ['en', 0.4], ['ell', 0.3], ['wen', 0.4]],
  endingChance: 0.35,
  forbid: ['q', 'x', 'z', 'c[eiy]', 'bh', 'mh', 'dh', 'gh', 'ao', "'", 'yy'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/elven.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const ELVEN: PhoneticProfile = {
  id: 'elven', label: 'high-fantasy',
  onsets: [['l', 1.2], ['m', 0.8], ['n', 0.8], ['r', 0.7], ['s', 0.8], ['t', 0.6], ['th', 0.8], ['v', 0.8], ['f', 0.5], ['h', 0.3], ['gl', 0.3], ['', 0.8]],
  nuclei: [['a', 1.2], ['e', 1.2], ['i', 1], ['o', 0.6], ['u', 0.3], ['ae', 0.4], ['ai', 0.3], ['ia', 0.3]],
  codas: [['', 3], ['l', 0.8], ['n', 0.8], ['r', 0.6], ['s', 0.4], ['th', 0.4]],
  shapes: [['CV', 4], ['CVC', 2], ['V', 0.6]],
  syllables: [[2, 5], [3, 4], [4, 0.6]],
  endings: [['iel', 0.5], ['ael', 0.4], ['wen', 0.4], ['ion', 0.4], ['eth', 0.4], ['ara', 0.4], ['ith', 0.4], ['indel', 0.2]],
  endingChance: 0.4,
  forbid: ['q', 'x', 'z', 'k', 'uu', 'ii', "'", 'aea', 'iei'],
  letters: [4, 11],
};
```

`packages/data/src/profiles/slavic.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const SLAVIC: PhoneticProfile = {
  id: 'slavic', label: 'Slavic-inspired',
  onsets: [['b', 1], ['d', 1], ['g', 0.7], ['k', 0.9], ['l', 0.9], ['m', 0.9], ['n', 0.8], ['r', 0.9], ['s', 0.9], ['t', 0.8], ['v', 1], ['z', 0.5],
    ['br', 0.3], ['dr', 0.3], ['gr', 0.3], ['kr', 0.3], ['pr', 0.3], ['sl', 0.4], ['sv', 0.4], ['st', 0.3], ['zh', 0.2], ['sh', 0.3], ['ch', 0.3]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 0.9], ['o', 1.1], ['u', 0.6], ['y', 0.2]],
  codas: [['', 2], ['n', 0.6], ['r', 0.6], ['l', 0.5], ['v', 0.6], ['st', 0.3], ['k', 0.4], ['d', 0.3], ['sk', 0.2]],
  shapes: [['CV', 4], ['CVC', 4]],
  syllables: [[2, 6], [3, 3], [1, 0.3]],
  endings: [['grad', 0.5], ['ov', 0.6], ['ica', 0.5], ['mir', 0.6], ['ina', 0.4], ['ets', 0.3], ['ava', 0.4], ['slav', 0.2]],
  endingChance: 0.4,
  forbid: ['q', 'x', 'w', 'c(?!h)', 'yy', "'", 'shch'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/finnic.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const FINNIC: PhoneticProfile = {
  id: 'finnic', label: 'Finnish-inspired',
  onsets: [['h', 0.8], ['j', 0.6], ['k', 1], ['l', 0.9], ['m', 0.8], ['n', 0.7], ['p', 0.8], ['r', 0.7], ['s', 0.9], ['t', 1], ['v', 0.9], ['', 0.6]],
  nuclei: [['a', 1.3], ['e', 0.9], ['i', 1], ['o', 0.7], ['u', 0.8], ['aa', 0.3], ['ii', 0.2], ['uu', 0.2], ['ee', 0.2], ['ai', 0.3], ['ei', 0.2], ['uo', 0.2], ['ie', 0.2]],
  codas: [['', 3], ['n', 0.8], ['s', 0.5], ['l', 0.4], ['t', 0.3], ['k', 0.3], ['p', 0.2], ['r', 0.3]],
  shapes: [['CV', 4], ['CVC', 2], ['V', 0.4]],
  syllables: [[2, 5], [3, 4], [4, 0.6]],
  endings: [['la', 0.6], ['va', 0.4], ['ri', 0.4], ['nen', 0.3], ['io', 0.3]],
  endingChance: 0.25,
  forbid: ['q', 'x', 'z', 'c', 'w', 'b', 'f', 'g', 'd', "'", 'yy'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/latin.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const LATIN: PhoneticProfile = {
  id: 'latin', label: 'Latin',
  onsets: [['c', 1], ['t', 0.9], ['v', 0.9], ['m', 0.8], ['n', 0.7], ['l', 0.8], ['r', 0.6], ['s', 0.8], ['f', 0.5], ['p', 0.6], ['d', 0.6], ['g', 0.4],
    ['qu', 0.3], ['pr', 0.3], ['tr', 0.3], ['cl', 0.2], ['', 0.5]],
  nuclei: [['a', 1.2], ['e', 1], ['i', 1], ['o', 0.8], ['u', 0.8], ['ae', 0.2], ['au', 0.15]],
  codas: [['', 3], ['s', 0.6], ['x', 0.2], ['m', 0.3], ['n', 0.4], ['r', 0.4], ['l', 0.3], ['ns', 0.1]],
  shapes: [['CV', 5], ['CVC', 2.5], ['V', 0.4]],
  syllables: [[2, 4], [3, 5], [4, 1]],
  endings: [['us', 0.6], ['um', 0.6], ['ia', 0.5], ['is', 0.5], ['ex', 0.3], ['or', 0.4], ['ium', 0.3], ['ae', 0.2]],
  endingChance: 0.5,
  forbid: ['k', 'w', 'y', 'z', 'j', "'", 'uu', 'ii', 'q(?!u)'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/hellenic.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const HELLENIC: PhoneticProfile = {
  id: 'hellenic', label: 'Hellenic',
  onsets: [['k', 0.9], ['t', 0.8], ['p', 0.8], ['d', 0.7], ['l', 0.8], ['m', 0.8], ['n', 0.7], ['r', 0.6], ['s', 0.8], ['th', 0.7], ['ph', 0.5], ['ch', 0.3],
    ['kr', 0.3], ['tr', 0.3], ['pr', 0.3], ['st', 0.3], ['dr', 0.2], ['', 0.6]],
  nuclei: [['a', 1.1], ['e', 1], ['i', 0.9], ['o', 1.1], ['y', 0.2], ['eu', 0.2], ['ai', 0.2], ['ei', 0.2], ['ou', 0.1]],
  codas: [['', 2], ['s', 0.6], ['n', 0.6], ['r', 0.4], ['l', 0.3], ['x', 0.1]],
  shapes: [['CV', 5], ['CVC', 2.5], ['V', 0.5]],
  syllables: [[2, 4], [3, 5], [4, 1]],
  endings: [['os', 0.7], ['ia', 0.5], ['is', 0.5], ['eon', 0.4], ['ion', 0.4], ['ene', 0.3], ['ara', 0.2]],
  endingChance: 0.5,
  forbid: ['q', 'w', 'j', 'c(?!h)', "'", 'uu', 'yy'],
  letters: [4, 11],
};
```

`packages/data/src/profiles/ancient.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const ANCIENT: PhoneticProfile = {
  id: 'ancient', label: 'ancient',
  onsets: [['s', 0.9], ['m', 0.8], ['n', 0.8], ['k', 0.8], ['t', 0.8], ['r', 0.6], ['b', 0.6], ['d', 0.6], ['sh', 0.5], ['kh', 0.3], ['z', 0.3], ['h', 0.4], ['', 0.6]],
  nuclei: [['a', 1.4], ['e', 0.8], ['i', 0.8], ['u', 0.8], ['o', 0.5]],
  codas: [['', 2], ['r', 0.6], ['n', 0.6], ['t', 0.4], ['sh', 0.2], ['m', 0.4], ['k', 0.3], ['l', 0.3]],
  shapes: [['CV', 4], ['CVC', 3], ['V', 0.5], ['VC', 0.3]],
  syllables: [[2, 5], [3, 4], [1, 0.3]],
  endings: [['ar', 0.5], ['eth', 0.4], ['um', 0.4], ['ash', 0.3], ['ek', 0.3], ['on', 0.3], ['ir', 0.3]],
  endingChance: 0.35,
  forbid: ['q', 'x', 'c', 'w', "'", 'uu', 'ii'],
  letters: [4, 10],
};
```

`packages/data/src/profiles/cosmic.ts` (the only profile that allows one apostrophe):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const COSMIC: PhoneticProfile = {
  id: 'cosmic', label: 'cosmic',
  onsets: [['y', 0.6], ['n', 0.8], ['z', 0.5], ['x', 0.3], ['th', 0.8], ['sh', 0.6], ['r', 0.8], ['l', 0.8], ['k', 0.8], ['v', 0.6], ['kh', 0.4], ['ny', 0.3], ['', 0.6]],
  nuclei: [['a', 1], ['o', 1], ['u', 1], ['y', 0.4], ['aa', 0.2], ['ae', 0.3], ['oo', 0.2]],
  codas: [['', 1.5], ['th', 0.6], ['n', 0.7], ['r', 0.6], ['l', 0.5], ['k', 0.5], ['x', 0.3], ['sh', 0.3]],
  shapes: [['CVC', 4], ['CV', 3], ['VC', 0.5]],
  syllables: [[2, 6], [3, 3], [1, 0.5]],
  endings: [["'ath", 0.4], ["'yr", 0.3], ['oth', 0.5], ['ul', 0.4], ['aal', 0.3], ['ex', 0.2], ["'ul", 0.2]],
  endingChance: 0.4,
  forbid: ['q(?!u)', 'ii', 'cth', 'thulh', 'shogg', 'nyarl', 'yog', 'azat', 'dagon'],
  letters: [4, 11],
};
```

`packages/data/src/profiles/scifi.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const SCIFI: PhoneticProfile = {
  id: 'scifi', label: 'sci-fi',
  onsets: [['k', 1], ['t', 0.8], ['v', 0.9], ['r', 0.6], ['n', 0.7], ['s', 0.8], ['z', 0.4], ['x', 0.2], ['d', 0.6], ['l', 0.7], ['m', 0.6],
    ['kr', 0.3], ['tr', 0.3], ['st', 0.3], ['', 0.4]],
  nuclei: [['a', 1.1], ['e', 1], ['i', 0.9], ['o', 1], ['u', 0.5], ['y', 0.2]],
  codas: [['', 1.5], ['n', 0.8], ['r', 0.8], ['x', 0.4], ['s', 0.5], ['k', 0.5], ['t', 0.4], ['l', 0.4]],
  shapes: [['CVC', 4], ['CV', 4], ['V', 0.3]],
  syllables: [[2, 6], [3, 3], [1, 0.4]],
  endings: [['ion', 0.4], ['ex', 0.3], ['is', 0.3], ['ar', 0.4], ['on', 0.5], ['ara', 0.3], ['ix', 0.2], ['us', 0.2]],
  endingChance: 0.35,
  forbid: ['q(?!u)', 'c', 'w', "'", 'uu', 'ii', 'yy'],
  letters: [4, 9],
};
```

`packages/data/src/profiles/cyberpunk.ts` (spec Appendix B):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const CYBERPUNK: PhoneticProfile = {
  id: 'cyberpunk', label: 'cyberpunk',
  onsets: [['k', 1], ['z', 0.7], ['x', 0.5], ['v', 0.9], ['n', 0.7], ['r', 0.7], ['d', 0.6], ['s', 0.8], ['t', 0.8], ['kr', 0.4], ['tr', 0.4]],
  nuclei: [['a', 1], ['e', 1], ['i', 1], ['o', 0.9], ['y', 0.5]],
  codas: [['', 0.8], ['x', 0.8], ['k', 0.8], ['n', 0.9], ['r', 0.8], ['s', 0.6], ['z', 0.4], ['t', 0.6]],
  shapes: [['CVC', 5], ['CV', 3]],
  syllables: [[2, 7.5], [1, 1.5], [3, 1]],
  endings: [['ex', 0.5], ['ix', 0.4], ['on', 0.5], ['yn', 0.4], ['ra', 0.4], ['tek', 0.15], ['core', 0.1], ['net', 0.1]],
  endingChance: 0.35,
  forbid: ['q', 'c', 'w', "'", 'uu', 'ii', 'yy', 'zz', 'xx'],
  letters: [3, 9],
};
```

`packages/data/src/profiles/soft.ts` (spec Appendix B; same values as the test fixture plus the remaining onsets and endings):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const SOFT: PhoneticProfile = {
  id: 'soft', label: 'soft and whimsical',
  onsets: [['b', 1], ['p', 1], ['m', 1], ['l', 1], ['n', 0.8], ['w', 0.6], ['f', 0.6], ['h', 0.5], ['t', 0.6], ['d', 0.5], ['s', 0.5],
    ['bl', 0.4], ['pl', 0.4], ['fl', 0.4], ['sn', 0.3], ['tw', 0.3]],
  nuclei: [['a', 1], ['e', 0.8], ['i', 0.8], ['o', 1], ['u', 0.6], ['oo', 0.3], ['ee', 0.2], ['ie', 0.2]],
  codas: [['', 3], ['n', 0.8], ['m', 0.5], ['l', 0.6], ['p', 0.4], ['s', 0.3]],
  shapes: [['CV', 5], ['CVC', 3]],
  syllables: [[2, 6], [3, 3.5], [1, 0.5]],
  endings: [['le', 1], ['ling', 0.8], ['kin', 0.7], ['wick', 0.5], ['bloom', 0.5], ['puff', 0.4], ['let', 0.4], ['o', 0.3], ['y', 0.3]],
  endingChance: 0.45,
  forbid: ['q', 'x', 'z', "'", 'ooo', 'eee', 'mon$'],
  letters: [4, 11],
};
```

`packages/data/src/profiles/japanese.ts` (mora-based, used rarely; forbidden sequences enforce valid mora instead of rewrites):
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
export const JAPANESE: PhoneticProfile = {
  id: 'japanese', label: 'Japanese-inspired',
  onsets: [['k', 1], ['s', 0.8], ['t', 0.8], ['n', 0.8], ['h', 0.6], ['m', 0.8], ['y', 0.5], ['r', 0.9], ['w', 0.3], ['g', 0.4], ['z', 0.3], ['d', 0.3],
    ['b', 0.3], ['p', 0.1], ['sh', 0.4], ['ch', 0.3], ['ts', 0.2], ['f', 0.1], ['j', 0.2], ['', 0.6]],
  nuclei: [['a', 1.2], ['i', 1], ['u', 0.8], ['e', 0.8], ['o', 1]],
  codas: [['', 6], ['n', 1]],
  shapes: [['CV', 6], ['V', 0.8], ['CVC', 0.6]],
  syllables: [[2, 3], [3, 4], [4, 1.5]],
  forbid: ['si', 'ti', 'tu', '(?<![sc])hu', 'zi', 'di', 'du', 'wi', 'we', 'wu', 'yi', 'ye', 'ts[aeio]', 'f[aeio]', "'", 'q', 'l', 'v', 'x', 'c(?!h)'],
  letters: [3, 9],
  /** Mora-based words are vowel-rich, so this profile widens the default 0.28–0.62 band. */
  vowelRatio: [0.35, 0.67],
  maxConsonantRun: 2,
};
```

`packages/data/src/profiles/index.ts`:
```ts
import type { PhoneticProfile } from '@vps-name-tools/core';
import { ANCIENT } from './ancient';
import { CELTIC } from './celtic';
import { COSMIC } from './cosmic';
import { CYBERPUNK } from './cyberpunk';
import { ELVEN } from './elven';
import { FINNIC } from './finnic';
import { GERMANIC } from './germanic';
import { HELLENIC } from './hellenic';
import { JAPANESE } from './japanese';
import { LATIN } from './latin';
import { NEUTRAL } from './neutral';
import { NORSE } from './norse';
import { OLD_ENGLISH } from './old-english';
import { SCIFI } from './scifi';
import { SLAVIC } from './slavic';
import { SOFT } from './soft';

/** PROFILE_IDS order. */
export const PROFILES: readonly PhoneticProfile[] = [
  NEUTRAL, NORSE, GERMANIC, OLD_ENGLISH, CELTIC, ELVEN, SLAVIC, FINNIC, LATIN, HELLENIC, ANCIENT, COSMIC, SCIFI, CYBERPUNK, SOFT, JAPANESE,
];
```

`scripts/sample-profiles.ts` (for the listening review in Step 6):
```ts
import { coinWord, createRng } from '@vps-name-tools/core';
import { PROFILES } from '@vps-name-tools/data';

for (const p of PROFILES) {
  const rng = createRng(`sample:${p.id}`);
  const words = Array.from({ length: 24 }, () => coinWord(rng, p)?.text ?? '—');
  console.log(`${p.id.padEnd(12)} ${words.join(' · ')}`);
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test packages/data/test/tones-profiles.test.ts && npm run validate:data && npx tsx --test packages/game-titles/test/game-data.test.ts`
Expected: PASS; the validator shows no tone or profile warnings; the game-data test confirms every tone family key is a real template family. If a profile misses the 475/500 bar, loosen the narrowest constraint (usually `letters` or an over-broad `forbid`), never `readable` itself.

- [ ] **Step 6: Listen to the profiles and record the review**

Run: `npm run sample:profiles`
Read each line aloud. Each profile should sound distinct and pronounceable; nothing should read as a real word in a living language that would embarrass (Japanese-inspired especially), and nothing should echo a franchise name. Adjust weights or `forbid` and re-run until satisfied. Add a row to `docs/VALIDATION.md`: date, "Phonetic profile listening review", result and any changes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the 19 tones and 16 phonetic profiles"
```

---

### Task 21: Core lexicon

**Files:**
- Create: `packages/data/src/lexicon/nature.ts`, `creatures.ts`, `sky.ts`, `home.ts`, `realm.ts`, `craft-tech.ts`, `journey.ts`, `myth.ts`, `mind.ts`, `adjectives.ts`, `verbs.ts`, `abstracts.ts`, `places.ts`, `morphemes.ts`
- Modify: `packages/data/src/lexicon/index.ts`
- Create: `packages/data/src/coded-imagery.ts` (authoring-time list), export it from `packages/data/src/index.ts`
- Test: `packages/data/test/lexicon.test.ts`

**Interfaces:**
- Consumes: builders (Task 9), concepts (Tasks 9 and 19).
- Produces: `LEXICON` with ≥ 1,200 entries; `CODED_IMAGERY: readonly string[]` (used by Tasks 23–24 tests).

- [ ] **Step 1: Write the failing test**

`packages/data/test/lexicon.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, parseThemes } from '@vps-name-tools/core';
import { CODED_IMAGERY, CONCEPTS, DATA, LEXICON, buildSteeringIndex, containsTerm, type LexEntry } from '../src/index';

const count = (f: (e: LexEntry) => boolean) => LEXICON.filter(f).length;

test('size and part-of-speech minimums (spec §9.3)', () => {
  assert.ok(LEXICON.length >= 1200, `entries ${LEXICON.length}`);
  const mins: [string, (e: LexEntry) => boolean, number][] = [
    ['nouns', e => e.pos.includes('noun'), 650],
    ['adjectives', e => e.pos.includes('adj'), 220],
    ['verbs', e => e.pos.includes('verb'), 100],
    ['abstracts', e => e.pos.includes('abstract'), 60],
    ['place words', e => e.pos.includes('place'), 40],
    ['compound heads', e => e.compound === 'head' || e.compound === 'both', 120],
    ['compound tails', e => e.compound === 'tail' || e.compound === 'both', 80],
    ['place tails', e => e.placeTail === true, 60],
  ];
  for (const [name, f, min] of mins) assert.ok(count(f) >= min, `${name}: ${count(f)} < ${min}`);
});

test('every concept is carried by at least three core entries', () => {
  const per = new Map<string, number>();
  for (const e of LEXICON) for (const c of e.concepts) per.set(c, (per.get(c) ?? 0) + 1);
  const thin = CONCEPTS.filter(c => (per.get(c.id) ?? 0) < 3).map(c => c.id);
  assert.deepEqual(thin, []);
});

test('entries carry 1–5 concepts and most carry at least two', () => {
  for (const e of LEXICON) assert.ok(e.concepts.length >= 1 && e.concepts.length <= 5, e.id);
  assert.ok(count(e => e.concepts.length >= 2) / LEXICON.length >= 0.8);
});

test('tricky plurals are stored, not guessed', () => {
  const tricky = /(?:[^aeiou]y|s|x|z|ch|sh|f|fe|o|man)$/i;
  for (const e of LEXICON) {
    if (!e.pos.includes('noun') || e.mass || e.text.includes(' ')) continue;
    if (tricky.test(e.text)) assert.ok(e.forms?.plural, `${e.id} needs forms.plural or mass: true`);
  }
});

test('worn words carry cliché scores', () => {
  for (const id of ['shadow', 'soul', 'eternal', 'legend', 'echo', 'quest', 'dark']) {
    const e = LEXICON.find(x => x.id === id);
    assert.ok(e, `missing ${id}`);
    assert.ok((e.cliche ?? 0) >= 0.5, `${id} cliche ${e.cliche}`);
  }
});

test('retro arcade adjectives exist for the Retro tone', () => {
  for (const id of ['super', 'mega', 'turbo', 'hyper']) {
    const e = LEXICON.find(x => x.id === id);
    assert.ok(e?.pos.includes('adj') && (e.tones?.retro ?? 0) >= 0.8, id);
  }
});

test('no extremist-coded imagery in the core lexicon', () => {
  for (const e of LEXICON) for (const t of CODED_IMAGERY) assert.ok(!containsTerm(normalize(e.text), t), `${e.text} ~ ${t}`);
});

test('lexicon words steer through parseThemes', () => {
  const p = parseThemes('ravens, frozen', buildSteeringIndex(DATA)).phrases;
  assert.ok(p[0].entryIds.includes('raven'));
  assert.ok(p[0].concepts.includes('omen'));
  assert.ok(p[1].concepts.includes('cold'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/data/test/lexicon.test.ts`
Expected: FAIL (empty lexicon; `CODED_IMAGERY` missing).

- [ ] **Step 3: The coded-imagery list**

`packages/data/src/coded-imagery.ts`:
```ts
/**
 * Authoring-time list: imagery co-opted by hate movements (ADL Hate Symbols Database). Content tests keep these
 * out of the core lexicon and the Norse, Icelandic, Germanic and Anglo-Saxon packs. Not a runtime filter: ordinary
 * imagery such as "Black Sun" (an eclipse image) stays allowed elsewhere (spec §5.1).
 */
export const CODED_IMAGERY: readonly string[] = [
  'valknut', 'othala', 'odal', 'algiz', 'life rune', 'sowilo', 'sig rune', 'wolfsangel', 'sonnenrad', 'totenkopf',
  'blood and honour', 'blood and honor', 'vinland', 'wotansvolk', 'thule', 'hyperborea', 'irminsul', 'fatherland',
  'vaterland', 'volk', 'reich', 'lebensraum', 'fourteen', 'eighty-eight',
];
```

Add `export { CODED_IMAGERY } from './coded-imagery';` to `packages/data/src/index.ts`.

- [ ] **Step 4: Author the category files**

Each file exports a `readonly LexEntry[]` built with the Task 9 builders, named after the file in capitals (`NATURE`, `CREATURES`, …, `MORPHEMES`). Start each file with the seed entries below, then author the rest to the minimums (draft with AI from the concept list, review every line).

`packages/data/src/lexicon/nature.ts` (seed):
```ts
import { noun } from '../build';
import type { LexEntry } from '../types';

export const NATURE: readonly LexEntry[] = [
  noun('ash', 'Ash', ['fire', 'ruin', 'death'], { forms: { plural: 'Ashes', adj: 'Ashen' }, family: 'fire-residue', compound: 'head', tones: { grim: 0.6, dark: 0.4, cozy: -0.8 } }),
  noun('ember', 'Ember', ['fire', 'warmth', 'hope'], { forms: { plural: 'Embers' }, family: 'fire-residue', compound: 'head', tones: { cozy: 0.3 } }),
  noun('cinder', 'Cinder', ['fire', 'ruin'], { forms: { plural: 'Cinders' }, family: 'fire-residue', compound: 'head' }),
  noun('soot', 'Soot', ['fire', 'smoke', 'industry'], { family: 'fire-residue', mass: true }),
  noun('frost', 'Frost', ['cold', 'winter', 'ice'], { forms: { adj: 'Frozen' }, compound: 'head', mass: true, tones: { grim: 0.4 } }),
  noun('rime', 'Rime', ['cold', 'ice', 'winter'], { register: 'archaic', compound: 'head', mass: true }),
  noun('snow', 'Snow', ['snow', 'winter', 'silence'], { compound: 'head', mass: true }),
  noun('storm', 'Storm', ['storm', 'wind', 'rage'], { forms: { plural: 'Storms' }, compound: 'head' }),
  noun('tide', 'Tide', ['tide', 'sea', 'cycle'], { forms: { plural: 'Tides' }, compound: 'head' }),
  noun('thorn', 'Thorn', ['thorn', 'curse', 'garden'], { forms: { plural: 'Thorns' }, compound: 'head' }),
  noun('moss', 'Moss', ['moss', 'forest', 'comfort'], { compound: 'head', mass: true, tones: { cozy: 0.7 } }),
  noun('salt', 'Salt', ['salt', 'sea', 'survival'], { compound: 'head', mass: true }),
];
```

`packages/data/src/lexicon/creatures.ts` (seed):
```ts
import { noun } from '../build';
import type { LexEntry } from '../types';

export const CREATURES: readonly LexEntry[] = [
  noun('raven', 'Raven', ['raven', 'omen', 'night', 'wing'], { forms: { plural: 'Ravens' }, family: 'corvid', compound: 'head' }),
  noun('crow', 'Crow', ['raven', 'omen', 'bird'], { forms: { plural: 'Crows' }, family: 'corvid', compound: 'head' }),
  noun('wolf', 'Wolf', ['wolf', 'hunt', 'wild'], { forms: { plural: 'Wolves' }, compound: 'head' }),
  noun('serpent', 'Serpent', ['serpent', 'deep', 'curse'], { forms: { plural: 'Serpents' }, family: 'serpent' }),
  noun('wyrm', 'Wyrm', ['dragon', 'serpent', 'legend'], { forms: { plural: 'Wyrms' }, family: 'serpent', register: 'archaic', compound: 'head' }),
  noun('fox', 'Fox', ['fox', 'trickster', 'forest'], { forms: { plural: 'Foxes' }, compound: 'head' }),
  noun('moth', 'Moth', ['creature', 'night', 'light'], { forms: { plural: 'Moths' }, compound: 'head' }),
  noun('critter', 'Critter', ['creature', 'whimsy', 'play'], { forms: { plural: 'Critters' }, register: 'whimsical', tones: { cozy: 0.6, playful: 0.8, grim: -0.8 } }),
];
```

`packages/data/src/lexicon/mind.ts` (seed, with the cliché words the test requires):
```ts
import { noun } from '../build';
import type { LexEntry } from '../types';

export const MIND: readonly LexEntry[] = [
  noun('shadow', 'Shadow', ['shadow', 'darkness', 'secret'], { forms: { plural: 'Shadows' }, cliche: 0.8 }),
  noun('soul', 'Soul', ['spirit', 'afterlife', 'memory'], { forms: { plural: 'Souls' }, cliche: 0.7 }),
  noun('echo', 'Echo', ['memory', 'absence', 'silence'], { forms: { plural: 'Echoes' }, cliche: 0.7 }),
  noun('legend', 'Legend', ['legend', 'hero', 'saga'], { forms: { plural: 'Legends' }, cliche: 0.7 }),
  noun('quest', 'Quest', ['journey', 'hero', 'legend'], { forms: { plural: 'Quests' }, cliche: 0.6 }),
  noun('memory', 'Memory', ['memory', 'sorrow', 'history'], { forms: { plural: 'Memories' } }),
  noun('static', 'Static', ['static', 'signal', 'dread'], { mass: true, register: 'technical' }),
];
```

`packages/data/src/lexicon/adjectives.ts` (seed):
```ts
import { adj } from '../build';
import type { LexEntry } from '../types';

export const ADJECTIVES: readonly LexEntry[] = [
  adj('dark', 'Dark', ['darkness', 'night', 'dread'], { cliche: 0.6 }),
  adj('eternal', 'Eternal', ['time', 'ancient', 'faith'], { register: 'lofty', cliche: 0.6 }),
  adj('pale', 'Pale', ['cold', 'death', 'silence']),
  adj('hollow', 'Hollow', ['ruin', 'absence', 'silence']),
  adj('forgotten', 'Forgotten', ['forgotten', 'memory', 'ruin']),
  adj('sunken', 'Sunken', ['deep', 'sea', 'ruin']),
  adj('super', 'Super', ['play', 'hero'], { cliche: 0.3, tones: { retro: 1, playful: 0.4, grim: -0.8, ancient: -1 } }),
  adj('mega', 'Mega', ['play', 'machine'], { cliche: 0.3, tones: { retro: 1, playful: 0.3, ancient: -1 } }),
  adj('turbo', 'Turbo', ['machine', 'play'], { cliche: 0.3, tones: { retro: 1, ancient: -1 } }),
  adj('hyper', 'Hyper', ['technology', 'play'], { cliche: 0.3, tones: { retro: 0.9, ancient: -1 } }),
];
```

`packages/data/src/lexicon/morphemes.ts` (seed):
```ts
import { morpheme } from '../build';
import type { LexEntry } from '../types';

export const MORPHEMES: readonly LexEntry[] = [
  morpheme('bound', 'bound', ['oath', 'curse'], { compound: 'tail' }),
  morpheme('born', 'born', ['kin', 'fate'], { compound: 'tail' }),
  morpheme('fall', 'fall', ['ruin', 'descent'], { compound: 'tail' }),
  morpheme('forge', 'forge', ['forge', 'fire', 'craft'], { compound: 'tail' }),
  morpheme('march', 'march', ['war', 'journey'], { compound: 'tail' }),
  morpheme('hold', 'hold', ['realm', 'castle'], { compound: 'tail', placeTail: true }),
  morpheme('moor', 'moor', ['wild', 'mist'], { placeTail: true }),
  morpheme('mere', 'mere', ['lake', 'sea'], { placeTail: true }),
  morpheme('wick', 'wick', ['village', 'home'], { placeTail: true }),
  morpheme('reach', 'reach', ['realm', 'frontier'], { compound: 'tail', placeTail: true }),
];
```

The other files (`sky.ts`, `home.ts`, `realm.ts`, `craft-tech.ts`, `journey.ts`, `myth.ts`, `verbs.ts`, `abstracts.ts`, `places.ts`) follow the same shape. Aim for these rough sizes so every concept gets coverage: nature 150, creatures 90, sky 80, home 110, realm 120, craft-tech 120, journey 70, myth 110, mind 90, adjectives 230, verbs 110, abstracts 70, places 50, morphemes 160 (compound tails and place tails).

`packages/data/src/lexicon/index.ts`:
```ts
import { ABSTRACTS } from './abstracts';
import { ADJECTIVES } from './adjectives';
import { CRAFT_TECH } from './craft-tech';
import { CREATURES } from './creatures';
import { HOME } from './home';
import { JOURNEY } from './journey';
import { MIND } from './mind';
import { MORPHEMES } from './morphemes';
import { MYTH } from './myth';
import { NATURE } from './nature';
import { PLACES } from './places';
import { REALM } from './realm';
import { SKY } from './sky';
import { VERBS } from './verbs';
import type { LexEntry } from '../types';

export const LEXICON: readonly LexEntry[] = [
  ...NATURE, ...CREATURES, ...SKY, ...HOME, ...REALM, ...CRAFT_TECH, ...JOURNEY, ...MYTH, ...MIND,
  ...ADJECTIVES, ...VERBS, ...ABSTRACTS, ...PLACES, ...MORPHEMES,
];
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test packages/data/test/lexicon.test.ts && npm run validate:data && npm test`
Expected: PASS; validator 0 errors and no lexicon warning; the engine tests still pass (they use the mini fixtures).

- [ ] **Step 6: Review and commit**

Skim every file once more for franchise terms, slurs, coded imagery and real-person names. Add a `docs/VALIDATION.md` row ("Core lexicon review", count, date). Add the word-list provenance (AI-drafted, hand-reviewed; no third-party list copied) to `THIRD_PARTY_NOTICES.md`.

```bash
git add -A
git commit -m "Add the core lexicon"
```

---

### Task 22: The 31 genre presets and the known-title list

**Files:**
- Create: `packages/game-titles/src/genres/<id>.ts` for the 30 genres after Fantasy (one file each, file name = genre id), `packages/game-titles/src/genres/helpers.ts`
- Modify: `packages/game-titles/src/genres/fantasy.ts` (add entries), `packages/game-titles/src/genres/index.ts`, `packages/game-titles/src/known-titles.ts`
- Create: `packages/game-titles/src/known-titles-data.ts`
- Test: `packages/game-titles/test/genres.test.ts`

**Interfaces:**
- Consumes: `GenrePreset`, `GENRE_IDS`, builders from `@vps-name-tools/data`.
- Produces: `GENRES` (31, `GENRE_IDS` order); `KNOWN_TITLES` (≥ 1,500); `genreEntry(genre, id, text, concepts, o?)` helper.

- [ ] **Step 1: Write the failing test**

`packages/game-titles/test/genres.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '@vps-name-tools/data';
import { GAME, GENRES, GENRE_IDS, KNOWN_TITLES, generate, validateGameData } from '../src/index';

test('31 genres in id order, each with enough steering data', () => {
  assert.deepEqual(GENRES.map(g => g.id), [...GENRE_IDS]);
  for (const g of GENRES) {
    assert.ok(Object.keys(g.conceptBoosts).length >= 12, `${g.id}: ${Object.keys(g.conceptBoosts).length} boosts`);
    assert.ok((g.entries ?? []).length >= 10, `${g.id}: ${(g.entries ?? []).length} entries`);
    assert.ok(g.defaultTones.length === 2, g.id);
  }
});

test('genre data validates against the real registry', () => {
  assert.deepEqual(validateGameData(GAME, DATA).filter(i => i.level === 'error'), []);
});

test('known-title list meets the release target', () => {
  assert.ok(KNOWN_TITLES.size >= 1500, String(KNOWN_TITLES.size));
});

test('guard rails from spec §4.2 are present', () => {
  const g = (id: string) => GENRES.find(x => x.id === id)!;
  assert.ok(g('creature-collector').guard?.blockSuffixes?.includes('mon'));
  assert.ok(g('creature-collector').guard?.blockPhrases?.includes('pocket monster'));
  assert.ok(g('sandbox').guard?.blockSuffixes?.includes('craft'));
  assert.ok(g('post-apocalyptic').guard?.blockPhrases?.includes('fallout'));
  assert.ok(g('crpg').guard?.blockPhrases?.includes('forgotten realms'));
  assert.ok((g('western').guard?.blockPhrases ?? []).length >= 8);
});

test('every genre generates a full batch on defaults', () => {
  for (const id of GENRE_IDS) {
    const r = generate({ genre: id }, { seed: `genre:${id}` });
    assert.equal(r.titles.length, 10, `${id}: ${r.notices.map(n => n.message).join(' ')}`);
  }
});

test('Cozy never produces violent vocabulary unless asked', () => {
  for (let i = 0; i < 10; i++) {
    for (const t of generate({ genre: 'cozy', count: 20 }, { seed: `cozy:${i}` }).titles) {
      assert.doesNotMatch(t.title, /\b(blood|gore|corpse|war|slaughter|kill)/i, t.title);
    }
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/genres.test.ts`
Expected: FAIL (1 genre).

- [ ] **Step 3: Helper and length biases**

`packages/game-titles/src/genres/helpers.ts`:
```ts
import { adj, noun, place, type LexEntry } from '@vps-name-tools/data';
import type { GenreId } from '../ids';
import type { LengthBias } from '../types';

type Options = Parameters<typeof noun>[3];

/** Genre-specific entry with the required `genre.<id>.` prefix. */
export const genreEntry = (genre: GenreId, id: string, text: string, concepts: readonly string[], o?: Options): LexEntry =>
  noun(`genre.${genre}.${id}`, text, concepts, o);
export const genreAdj = (genre: GenreId, id: string, text: string, concepts: readonly string[], o?: Options): LexEntry =>
  adj(`genre.${genre}.${id}`, text, concepts, o);
export const genrePlace = (genre: GenreId, id: string, text: string, concepts: readonly string[], o?: Options): LexEntry =>
  place(`genre.${genre}.${id}`, text, concepts, o);

/** Spec §4.2 "Length" column. */
export const LENGTH: Readonly<Record<'short' | 'shortMedium' | 'medium' | 'mediumLong', LengthBias>> = {
  short: { one: 0.8, short: 1, medium: 0.5, long: 0.2 },
  shortMedium: { one: 0.6, short: 0.9, medium: 0.8, long: 0.3 },
  medium: { one: 0.4, short: 0.6, medium: 1, long: 0.5 },
  mediumLong: { one: 0.3, short: 0.4, medium: 0.9, long: 0.8 },
};
```

- [ ] **Step 4: Write the 31 presets**

Every preset follows spec §4.2 (vocabulary, favoured structures, default tones, length). Below are all 31 objects; each lives in its own file as `export const <CAMEL_ID>: GenrePreset = {...}` with imports `import type { GenrePreset } from '../types';` and `import { genreEntry as e, genreAdj as a, genrePlace as p, LENGTH } from './helpers';`. Entry lists show the seed words; extend each list to 15–30 entries during authoring (the test requires at least 10).

Replace `packages/game-titles/src/genres/fantasy.ts`:
```ts
import type { GenrePreset } from '../types';
import { genreEntry as e, genrePlace as p, LENGTH } from './helpers';

export const FANTASY: GenrePreset = {
  id: 'fantasy', label: 'Fantasy', group: 'Fantasy & RPG', noteLabel: 'fantasy',
  conceptBoosts: { crown: 2, realm: 2, oath: 1.6, relic: 1.6, magic: 1.6, dragon: 1.5, blade: 1.5, ancient: 1.4, legend: 1.3, forest: 1.3,
    castle: 1.4, tower: 1.3, knight: 1.3, rune: 1.3 },
  familyWeights: { 'of-phrase': 1.5, 'the-noun': 1.2, subtitle: 1.3, compound: 1.2, frame: 1.2, epithet: 1.5 },
  defaultTones: ['epic', 'mystical'],
  lengthBias: LENGTH.medium,
  frameWords: ['Chronicles', 'Tales', 'Legend', 'Song'],
  suffixWords: [{ text: 'Saga', cliche: 0.6 }, { text: 'Legends', cliche: 0.7 }, { text: 'Chronicles', cliche: 0.7 }],
  entries: [
    e('fantasy', 'spire', 'Spire', ['tower', 'magic', 'realm'], { forms: { plural: 'Spires' }, compound: 'head' }),
    e('fantasy', 'spell', 'Spell', ['magic', 'rune', 'curse'], { forms: { plural: 'Spells' } }),
    e('fantasy', 'grimoire', 'Grimoire', ['magic', 'book', 'secret'], { forms: { plural: 'Grimoires' }, register: 'lofty' }),
    e('fantasy', 'vale', 'Vale', ['forest', 'realm', 'river'], { forms: { plural: 'Vales' } }),
    e('fantasy', 'keep', 'Keep', ['castle', 'realm', 'siege'], { forms: { plural: 'Keeps' } }),
    e('fantasy', 'sigil', 'Sigil', ['rune', 'magic', 'banner'], { forms: { plural: 'Sigils' } }),
    e('fantasy', 'warden', 'Warden', ['guardian', 'forest', 'oath'], { forms: { plural: 'Wardens' } }),
    e('fantasy', 'crownland', 'Crownland', ['crown', 'realm'], { forms: { plural: 'Crownlands' } }),
    e('fantasy', 'relic', 'Relic', ['relic', 'ancient', 'faith'], { forms: { plural: 'Relics' } }),
    e('fantasy', 'oathsworn', 'Oathsworn', ['oath', 'knight']),
    p('fantasy', 'marches', 'Marches', ['realm', 'frontier']),
  ],
  profile: 'neutral',
};
```

`dark-fantasy.ts`:
```ts
export const DARK_FANTASY: GenrePreset = {
  id: 'dark-fantasy', label: 'Dark Fantasy', group: 'Fantasy & RPG', parent: 'fantasy', noteLabel: 'dark-fantasy',
  conceptBoosts: { ruin: 2.2, blood: 2, death: 1.8, curse: 1.8, rot: 1.6, grave: 1.6, thorn: 1.5, pyre: 1.5, fire: 1.3, darkness: 1.5,
    plague: 1.3, hunger: 1.3, oath: 1.3, bone: 1.3 },
  familyWeights: { pair: 1.4, compound: 1.4, prepositional: 1.3, single: 1.2 },
  defaultTones: ['dark', 'grim'],
  lengthBias: LENGTH.shortMedium,
  frameWords: ['Requiem', 'Lament', 'Rites'],
  entries: [
    e('dark-fantasy', 'pyre', 'Pyre', ['pyre', 'fire', 'death'], { forms: { plural: 'Pyres' }, compound: 'head' }),
    e('dark-fantasy', 'blight', 'Blight', ['rot', 'plague', 'curse'], { mass: true, compound: 'head' }),
    e('dark-fantasy', 'ossuary', 'Ossuary', ['bone', 'grave', 'death'], { forms: { plural: 'Ossuaries' } }),
    e('dark-fantasy', 'gallows', 'Gallows', ['death', 'law', 'dread'], { mass: true }),
    e('dark-fantasy', 'carrion', 'Carrion', ['death', 'hunger', 'raven'], { mass: true }),
    e('dark-fantasy', 'hex', 'Hex', ['curse', 'witch', 'magic'], { forms: { plural: 'Hexes' }, compound: 'head' }),
    e('dark-fantasy', 'relicblade', 'Relicblade', ['blade', 'relic', 'curse'], { forms: { plural: 'Relicblades' } }),
    e('dark-fantasy', 'mire', 'Mire', ['swamp', 'rot'], { forms: { plural: 'Mires' }, compound: 'head' }),
    e('dark-fantasy', 'penance', 'Penance', ['guilt', 'faith', 'sorrow'], { mass: true }),
    e('dark-fantasy', 'cathedral', 'Cathedral', ['faith', 'ruin', 'stone'], { forms: { plural: 'Cathedrals' } }),
  ],
  profile: 'neutral',
};
```

`high-fantasy.ts`:
```ts
export const HIGH_FANTASY: GenrePreset = {
  id: 'high-fantasy', label: 'High Fantasy', group: 'Fantasy & RPG', parent: 'fantasy', noteLabel: 'high-fantasy',
  conceptBoosts: { star: 2, light: 1.8, song: 1.8, age: 1.6, silver: 1.6, dawn: 1.5, magic: 1.5, legend: 1.5, tower: 1.3, elegance: 1.4,
    realm: 1.4, ancient: 1.3, gods: 1.2 },
  familyWeights: { 'of-phrase': 1.6, frame: 1.4, saga: 1.5, subtitle: 1.3 },
  defaultTones: ['epic', 'elegant'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Song', 'Age', 'Dawn', 'Heirs'],
  entries: [
    e('high-fantasy', 'starsong', 'Starsong', ['star', 'song', 'legend']),
    e('high-fantasy', 'elder', 'Elder', ['ancient', 'wisdom', 'age'], { forms: { plural: 'Elders' } }),
    e('high-fantasy', 'silverwood', 'Silverwood', ['silver', 'forest', 'magic']),
    e('high-fantasy', 'lightbearer', 'Lightbearer', ['light', 'hero', 'hope'], { forms: { plural: 'Lightbearers' } }),
    e('high-fantasy', 'everdawn', 'Everdawn', ['dawn', 'hope', 'time']),
    e('high-fantasy', 'loom', 'Loom', ['fate', 'craft', 'time'], { forms: { plural: 'Looms' } }),
    e('high-fantasy', 'harp', 'Harp', ['song', 'elegance'], { forms: { plural: 'Harps' } }),
    e('high-fantasy', 'starwell', 'Starwell', ['star', 'magic', 'light']),
    e('high-fantasy', 'highking', 'High King', ['crown', 'realm', 'legend'], { forms: { plural: 'High Kings' } }),
    e('high-fantasy', 'sunspire', 'Sunspire', ['sun', 'tower', 'light']),
  ],
  profile: 'elven',
};
```

`rpg.ts`:
```ts
export const RPG: GenrePreset = {
  id: 'rpg', label: 'RPG', group: 'Fantasy & RPG', noteLabel: 'RPG',
  conceptBoosts: { journey: 2, fate: 1.8, realm: 1.6, age: 1.5, guild: 1.5, relic: 1.5, legend: 1.5, hero: 1.5, map: 1.3, tavern: 1.2,
    prophecy: 1.4, kin: 1.2, crossroads: 1.3 },
  familyWeights: { frame: 1.5, subtitle: 1.5, 'of-phrase': 1.4 },
  defaultTones: ['epic', 'heroic'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Chronicles', 'Tales', 'Age', 'Heirs'],
  suffixWords: [{ text: 'Chronicles', cliche: 0.7 }, { text: 'Saga', cliche: 0.6 }, { text: 'Odyssey', cliche: 0.4 }],
  entries: [
    e('rpg', 'chronicle', 'Chronicle', ['history', 'legend', 'book'], { forms: { plural: 'Chronicles' }, cliche: 0.5 }),
    e('rpg', 'wayfarer', 'Wayfarer', ['wanderer', 'journey'], { forms: { plural: 'Wayfarers' } }),
    e('rpg', 'pilgrim', 'Pilgrim', ['journey', 'faith', 'wanderer'], { forms: { plural: 'Pilgrims' } }),
    e('rpg', 'heir', 'Heir', ['kin', 'crown', 'fate'], { forms: { plural: 'Heirs' } }),
    e('rpg', 'covenant', 'Covenant', ['oath', 'faith', 'bond'], { forms: { plural: 'Covenants' }, register: 'lofty' }),
    e('rpg', 'companion', 'Companion', ['friendship', 'bond', 'journey'], { forms: { plural: 'Companions' } }),
    e('rpg', 'waystone', 'Waystone', ['path', 'stone', 'journey'], { forms: { plural: 'Waystones' } }),
    e('rpg', 'tome', 'Tome', ['book', 'knowledge', 'magic'], { forms: { plural: 'Tomes' } }),
    e('rpg', 'banneret', 'Banneret', ['banner', 'knight'], { forms: { plural: 'Bannerets' }, register: 'archaic' }),
    e('rpg', 'odyssey', 'Odyssey', ['journey', 'voyage', 'legend'], { forms: { plural: 'Odysseys' }, cliche: 0.4 }),
  ],
  profile: 'neutral',
};
```

`action-rpg.ts`:
```ts
export const ACTION_RPG: GenrePreset = {
  id: 'action-rpg', label: 'Action RPG', group: 'Fantasy & RPG', parent: 'rpg', noteLabel: 'action-RPG',
  conceptBoosts: { blade: 2, hunt: 1.8, rage: 1.8, siege: 1.6, iron: 1.6, beast: 1.5, war: 1.5, battle: 1.5, blood: 1.3, hero: 1.3,
    lightning: 1.2, bone: 1.2 },
  familyWeights: { compound: 1.5, imperative: 1.5, pair: 1.3, single: 1.2 },
  defaultTones: ['brutal', 'cinematic'],
  lengthBias: LENGTH.shortMedium,
  entries: [
    e('action-rpg', 'fang', 'Fang', ['beast', 'hunt', 'bone'], { forms: { plural: 'Fangs' }, compound: 'head' }),
    e('action-rpg', 'fury', 'Fury', ['rage', 'war'], { forms: { plural: 'Furies' }, compound: 'head' }),
    e('action-rpg', 'strike', 'Strike', ['battle', 'blade'], { forms: { plural: 'Strikes' } }),
    e('action-rpg', 'hunter', 'Hunter', ['hunt', 'beast'], { forms: { plural: 'Hunters' } }),
    e('action-rpg', 'slayer', 'Slayer', ['hunt', 'hero', 'death'], { forms: { plural: 'Slayers' }, cliche: 0.4 }),
    e('action-rpg', 'gauntlet', 'Gauntlet', ['battle', 'iron'], { forms: { plural: 'Gauntlets' } }),
    e('action-rpg', 'warcry', 'Warcry', ['war', 'rage'], { forms: { plural: 'Warcries' } }),
    e('action-rpg', 'cleaver', 'Cleaver', ['blade', 'iron'], { forms: { plural: 'Cleavers' } }),
    e('action-rpg', 'arena', 'Arena', ['battle', 'stone'], { forms: { plural: 'Arenas' } }),
    e('action-rpg', 'bloodhunt', 'Bloodhunt', ['hunt', 'blood']),
  ],
  profile: 'neutral',
};
```

`crpg.ts`:
```ts
export const CRPG: GenrePreset = {
  id: 'crpg', label: 'Tabletop-inspired / CRPG', group: 'Fantasy & RPG', parent: 'rpg', noteLabel: 'tabletop-style RPG',
  conceptBoosts: { book: 1.8, tavern: 1.8, knowledge: 1.5, castle: 1.4, tomb: 1.5, guild: 1.6, chance: 1.5, journey: 1.4, map: 1.4,
    friendship: 1.3, secret: 1.3, magic: 1.3 },
  familyWeights: { 'of-phrase': 1.4, possessive: 1.5, subtitle: 1.4, frame: 1.3 },
  defaultTones: ['heroic', 'whimsical'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Tales', 'Book', 'Keepers'],
  entries: [
    e('crpg', 'tome', 'Tome', ['book', 'magic'], { forms: { plural: 'Tomes' } }),
    e('crpg', 'codex', 'Codex', ['book', 'knowledge'], { forms: { plural: 'Codices' } }),
    e('crpg', 'campaign', 'Campaign', ['journey', 'war'], { forms: { plural: 'Campaigns' } }),
    e('crpg', 'keep', 'Keep', ['castle', 'siege'], { forms: { plural: 'Keeps' } }),
    e('crpg', 'crypt', 'Crypt', ['tomb', 'grave', 'secret'], { forms: { plural: 'Crypts' } }),
    e('crpg', 'ledger', 'Ledger', ['book', 'trade', 'secret'], { forms: { plural: 'Ledgers' } }),
    e('crpg', 'party', 'Party', ['friendship', 'journey'], { forms: { plural: 'Parties' } }),
    e('crpg', 'dice', 'Dice', ['chance', 'play'], { mass: true }),
    e('crpg', 'inn', 'Inn', ['tavern', 'home', 'journey'], { forms: { plural: 'Inns' } }),
    e('crpg', 'adventurer', 'Adventurer', ['journey', 'hero'], { forms: { plural: 'Adventurers' } }),
  ],
  profile: 'neutral',
  guard: { blockPhrases: ['dungeons and dragons', 'dungeons & dragons', 'forgotten realms', "baldur's gate", 'baldurs gate', 'beholder', 'mind flayer', 'underdark', 'neverwinter', 'waterdeep'] },
};
```

`mmo.ts`:
```ts
export const MMO: GenrePreset = {
  id: 'mmo', label: 'MMO', group: 'Fantasy & RPG', noteLabel: 'MMO',
  conceptBoosts: { realm: 2, age: 1.6, guild: 1.8, frontier: 1.5, community: 1.4, legend: 1.4, war: 1.3, exploration: 1.4, empire: 1.3,
    crown: 1.3, map: 1.2, history: 1.2 },
  familyWeights: { suffix: 2, 'of-phrase': 1.4, subtitle: 1.3 },
  defaultTones: ['epic', 'heroic'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Age', 'Legend'],
  suffixWords: [{ text: 'Online', cliche: 0.4 }, { text: 'Realms', cliche: 0.4 }, { text: 'Worlds', cliche: 0.3 }, { text: 'Frontiers', cliche: 0.3 }],
  entries: [
    e('mmo', 'world', 'World', ['realm', 'exploration'], { forms: { plural: 'Worlds' } }),
    e('mmo', 'shard', 'Shard', ['realm', 'gem'], { forms: { plural: 'Shards' } }),
    e('mmo', 'guildhall', 'Guildhall', ['guild', 'community'], { forms: { plural: 'Guildhalls' } }),
    e('mmo', 'expanse', 'Expanse', ['frontier', 'exploration'], { forms: { plural: 'Expanses' } }),
    e('mmo', 'dominion', 'Dominion', ['empire', 'realm'], { forms: { plural: 'Dominions' } }),
    e('mmo', 'continent', 'Continent', ['realm', 'map'], { forms: { plural: 'Continents' } }),
    e('mmo', 'raid', 'Raid', ['war', 'guild'], { forms: { plural: 'Raids' } }),
    e('mmo', 'faction', 'Faction', ['war', 'guild', 'banner'], { forms: { plural: 'Factions' } }),
    e('mmo', 'commonwealth', 'Commonwealth', ['community', 'realm'], { forms: { plural: 'Commonwealths' } }),
    e('mmo', 'outpost', 'Outpost', ['frontier', 'settlement'], { forms: { plural: 'Outposts' } }),
  ],
  profile: 'neutral',
};
```

`horror.ts`:
```ts
export const HORROR: GenrePreset = {
  id: 'horror', label: 'Horror', group: 'Horror', noteLabel: 'horror',
  conceptBoosts: { dread: 2.2, fear: 1.8, haunting: 1.8, rot: 1.5, night: 1.6, house: 1.6, door: 1.5, bone: 1.4, ghost: 1.5, secret: 1.3,
    darkness: 1.4, absence: 1.3, eye: 1.2 },
  familyWeights: { single: 1.5, 'the-noun': 1.4, imperative: 1.5, sentence: 1.4 },
  defaultTones: ['dark', 'mysterious'],
  lengthBias: LENGTH.short,
  entries: [
    e('horror', 'whisper', 'Whisper', ['secret', 'dread', 'ghost'], { forms: { plural: 'Whispers' } }),
    e('horror', 'cellar', 'Cellar', ['house', 'deep', 'dread'], { forms: { plural: 'Cellars' } }),
    e('horror', 'attic', 'Attic', ['house', 'memory', 'dread'], { forms: { plural: 'Attics' } }),
    e('horror', 'hollow', 'Hollow', ['absence', 'forest', 'dread'], { forms: { plural: 'Hollows' } }),
    e('horror', 'visitor', 'Visitor', ['door', 'dread', 'secret'], { forms: { plural: 'Visitors' } }),
    e('horror', 'knock', 'Knock', ['door', 'dread'], { forms: { plural: 'Knocks' } }),
    e('horror', 'vigil', 'Vigil', ['night', 'fear'], { forms: { plural: 'Vigils' } }),
    e('horror', 'lullaby', 'Lullaby', ['sleep', 'dread', 'song'], { forms: { plural: 'Lullabies' } }),
    e('horror', 'effigy', 'Effigy', ['curse', 'dread', 'mask'], { forms: { plural: 'Effigies' } }),
    e('horror', 'threshold', 'Threshold', ['threshold', 'door', 'dread'], { forms: { plural: 'Thresholds' } }),
  ],
  profile: 'neutral',
};
```

`psychological-horror.ts`:
```ts
export const PSYCHOLOGICAL_HORROR: GenrePreset = {
  id: 'psychological-horror', label: 'Psychological Horror', group: 'Horror', parent: 'horror', noteLabel: 'psychological-horror',
  conceptBoosts: { memory: 2, mirror: 1.8, absence: 1.8, guilt: 1.8, static: 1.6, loop: 1.6, room: 1.5, silence: 1.5, dream: 1.4, isolation: 1.4,
    tape: 1.3, sleep: 1.2 },
  familyWeights: { sentence: 1.6, imperative: 1.5, single: 1.3, possessive: 1.3 },
  defaultTones: ['melancholic', 'surreal'],
  lengthBias: LENGTH.shortMedium,
  entries: [
    e('psychological-horror', 'quiet', 'Quiet', ['silence', 'absence'], { mass: true }),
    e('psychological-horror', 'reflection', 'Reflection', ['mirror', 'memory'], { forms: { plural: 'Reflections' } }),
    e('psychological-horror', 'hallway', 'Hallway', ['room', 'house', 'loop'], { forms: { plural: 'Hallways' } }),
    e('psychological-horror', 'tape', 'Tape', ['tape', 'memory', 'static'], { forms: { plural: 'Tapes' } }),
    e('psychological-horror', 'session', 'Session', ['memory', 'secret'], { forms: { plural: 'Sessions' } }),
    e('psychological-horror', 'stranger', 'Stranger', ['mirror', 'dread'], { forms: { plural: 'Strangers' } }),
    e('psychological-horror', 'relapse', 'Relapse', ['loop', 'guilt'], { forms: { plural: 'Relapses' } }),
    e('psychological-horror', 'waiting-room', 'Waiting Room', ['room', 'absence', 'time'], { forms: { plural: 'Waiting Rooms' } }),
    e('psychological-horror', 'confession', 'Confession', ['guilt', 'secret'], { forms: { plural: 'Confessions' } }),
    e('psychological-horror', 'insomnia', 'Insomnia', ['sleep', 'dread'], { mass: true }),
  ],
  profile: 'neutral',
};
```

`cosmic-horror.ts`:
```ts
export const COSMIC_HORROR: GenrePreset = {
  id: 'cosmic-horror', label: 'Cosmic Horror', group: 'Horror', parent: 'horror', noteLabel: 'cosmic-horror',
  conceptBoosts: { abyss: 2.2, deep: 2, void: 1.8, star: 1.6, tide: 1.6, signal: 1.5, dream: 1.5, ancient: 1.5, cosmos: 1.6, sea: 1.3,
    chaos: 1.3, eye: 1.3, tower: 1.2 },
  familyWeights: { prepositional: 1.8, 'of-phrase': 1.4, coined: 1.3, 'the-noun': 1.2 },
  defaultTones: ['weird', 'ancient'],
  lengthBias: LENGTH.medium,
  entries: [
    e('cosmic-horror', 'aeon', 'Aeon', ['time', 'ancient', 'cosmos'], { forms: { plural: 'Aeons' }, register: 'lofty' }),
    e('cosmic-horror', 'leviathan', 'Leviathan', ['deep', 'beast', 'sea'], { forms: { plural: 'Leviathans' }, cliche: 0.4 }),
    e('cosmic-horror', 'lighthouse', 'Lighthouse', ['tower', 'sea', 'isolation'], { forms: { plural: 'Lighthouses' } }),
    e('cosmic-horror', 'trench', 'Trench', ['deep', 'abyss'], { forms: { plural: 'Trenches' } }),
    e('cosmic-horror', 'observatory', 'Observatory', ['star', 'tower', 'knowledge'], { forms: { plural: 'Observatories' } }),
    e('cosmic-horror', 'sunken-city', 'Sunken City', ['deep', 'city', 'ruin'], { forms: { plural: 'Sunken Cities' } }),
    e('cosmic-horror', 'cult', 'Cult', ['occult', 'secret', 'faith'], { forms: { plural: 'Cults' } }),
    e('cosmic-horror', 'transmission', 'Transmission', ['signal', 'broadcast', 'dread'], { forms: { plural: 'Transmissions' } }),
    e('cosmic-horror', 'tentacle', 'Tentacle', ['deep', 'beast'], { forms: { plural: 'Tentacles' }, cliche: 0.6 }),
    e('cosmic-horror', 'starless', 'Starless', ['void', 'darkness']),
  ],
  profile: 'cosmic',
};
```
`sci-fi.ts`:
```ts
export const SCI_FI: GenrePreset = {
  id: 'sci-fi', label: 'Sci-Fi', group: 'Sci-Fi & Punk', noteLabel: 'sci-fi',
  conceptBoosts: { orbit: 2, signal: 1.8, station: 1.8, colony: 1.6, space: 1.6, technology: 1.5, planet: 1.5, code: 1.3, star: 1.3,
    isolation: 1.2, frontier: 1.2, machine: 1.3 },
  familyWeights: { code: 1.8, single: 1.4, pair: 1.3, subtitle: 1.3, number: 1.3 },
  defaultTones: ['cinematic', 'minimalist'],
  lengthBias: LENGTH.short,
  entries: [
    e('sci-fi', 'vector', 'Vector', ['space', 'path', 'technology'], { forms: { plural: 'Vectors' }, register: 'technical' }),
    e('sci-fi', 'protocol', 'Protocol', ['code', 'order'], { forms: { plural: 'Protocols' }, register: 'technical', cliche: 0.4 }),
    e('sci-fi', 'drift', 'Drift', ['space', 'isolation', 'voyage'], { forms: { plural: 'Drifts' } }),
    e('sci-fi', 'core', 'Core', ['machine', 'planet'], { forms: { plural: 'Cores' } }),
    e('sci-fi', 'array', 'Array', ['signal', 'technology'], { forms: { plural: 'Arrays' }, register: 'technical' }),
    e('sci-fi', 'relay', 'Relay', ['signal', 'station'], { forms: { plural: 'Relays' } }),
    e('sci-fi', 'horizon', 'Horizon', ['frontier', 'sky'], { forms: { plural: 'Horizons' }, cliche: 0.4 }),
    e('sci-fi', 'lander', 'Lander', ['planet', 'ship'], { forms: { plural: 'Landers' } }),
    e('sci-fi', 'cryo', 'Cryo', ['cold', 'sleep', 'technology'], { mass: true }),
    e('sci-fi', 'singularity', 'Singularity', ['void', 'technology'], { forms: { plural: 'Singularities' }, cliche: 0.4 }),
  ],
  profile: 'scifi',
};
```

`cyberpunk.ts`:
```ts
export const CYBERPUNK: GenrePreset = {
  id: 'cyberpunk', label: 'Cyberpunk', group: 'Sci-Fi & Punk', parent: 'sci-fi', noteLabel: 'cyberpunk',
  conceptBoosts: { neon: 2.2, chrome: 2, glitch: 1.8, code: 1.8, network: 1.6, corporation: 1.6, city: 1.6, rain: 1.4, crime: 1.4, ghost: 1.3,
    district: 1.4, mask: 1.2 },
  suppress: ['horse', 'cottage', 'harvest'],
  familyWeights: { code: 1.8, compound: 1.5, coined: 1.4, pair: 1.3 },
  defaultTones: ['dark', 'cinematic'],
  lengthBias: LENGTH.short,
  entries: [
    e('cyberpunk', 'grid', 'Grid', ['network', 'city'], { forms: { plural: 'Grids' }, compound: 'head' }),
    e('cyberpunk', 'wire', 'Wire', ['network', 'technology'], { forms: { plural: 'Wires' }, compound: 'head' }),
    e('cyberpunk', 'syndicate', 'Syndicate', ['crime', 'corporation'], { forms: { plural: 'Syndicates' } }),
    e('cyberpunk', 'implant', 'Implant', ['chrome', 'technology'], { forms: { plural: 'Implants' } }),
    e('cyberpunk', 'runner', 'Runner', ['crime', 'city'], { forms: { plural: 'Runners' } }),
    e('cyberpunk', 'proxy', 'Proxy', ['network', 'mask'], { forms: { plural: 'Proxies' } }),
    e('cyberpunk', 'daemon', 'Daemon', ['code', 'ghost'], { forms: { plural: 'Daemons' } }),
    e('cyberpunk', 'megablock', 'Megablock', ['city', 'district'], { forms: { plural: 'Megablocks' } }),
    e('cyberpunk', 'blackout', 'Blackout', ['darkness', 'network'], { forms: { plural: 'Blackouts' } }),
    e('cyberpunk', 'overclock', 'Overclock', ['machine', 'rage'], { forms: { plural: 'Overclocks' } }),
  ],
  profile: 'cyberpunk',
};
```

`space-opera.ts`:
```ts
export const SPACE_OPERA: GenrePreset = {
  id: 'space-opera', label: 'Space Opera', group: 'Sci-Fi & Punk', parent: 'sci-fi', noteLabel: 'space-opera',
  conceptBoosts: { empire: 2, star: 2, fleet: 1.8, throne: 1.6, nebula: 1.6, dynasty: 1.6, frontier: 1.4, war: 1.4, legion: 1.3, crown: 1.3,
    rebellion: 1.4, cosmos: 1.3 },
  familyWeights: { 'of-phrase': 1.6, subtitle: 1.5, frame: 1.4 },
  defaultTones: ['epic', 'cinematic'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Heirs', 'Children', 'Age', 'Fall'],
  entries: [
    e('space-opera', 'armada', 'Armada', ['fleet', 'war'], { forms: { plural: 'Armadas' } }),
    e('space-opera', 'sovereign', 'Sovereign', ['throne', 'crown', 'empire'], { forms: { plural: 'Sovereigns' } }),
    e('space-opera', 'starfall', 'Starfall', ['star', 'war', 'omen'], { forms: { plural: 'Starfalls' } }),
    e('space-opera', 'regency', 'Regency', ['throne', 'dynasty'], { forms: { plural: 'Regencies' } }),
    e('space-opera', 'flagship', 'Flagship', ['fleet', 'command'], { forms: { plural: 'Flagships' } }),
    e('space-opera', 'hegemony', 'Hegemony', ['empire', 'order'], { forms: { plural: 'Hegemonies' }, register: 'lofty' }),
    e('space-opera', 'exodus', 'Exodus', ['journey', 'exile', 'fleet'], { forms: { plural: 'Exoduses' } }),
    e('space-opera', 'sector', 'Sector', ['space', 'frontier'], { forms: { plural: 'Sectors' } }),
    e('space-opera', 'ascendancy', 'Ascendancy', ['empire', 'dynasty'], { forms: { plural: 'Ascendancies' } }),
    e('space-opera', 'voidborn', 'Voidborn', ['void', 'kin']),
  ],
  profile: 'scifi',
};
```
`post-apocalyptic.ts`:
```ts
export const POST_APOCALYPTIC: GenrePreset = {
  id: 'post-apocalyptic', label: 'Post-Apocalyptic', group: 'Sci-Fi & Punk', noteLabel: 'post-apocalyptic',
  conceptBoosts: { aftermath: 2.2, wasteland: 2, rust: 1.8, dust: 1.8, ruin: 1.6, scavenging: 1.6, radiation: 1.4, survival: 1.5, hunger: 1.3,
    silence: 1.2, shelter: 1.3, hope: 1.2 },
  familyWeights: { prepositional: 1.6, single: 1.4, number: 1.4 },
  defaultTones: ['grim', 'melancholic'],
  lengthBias: LENGTH.short,
  entries: [
    e('post-apocalyptic', 'scrap', 'Scrap', ['scavenging', 'rust'], { mass: true, compound: 'head' }),
    e('post-apocalyptic', 'remnant', 'Remnant', ['aftermath', 'ruin'], { forms: { plural: 'Remnants' } }),
    e('post-apocalyptic', 'bunker', 'Bunker', ['shelter', 'survival'], { forms: { plural: 'Bunkers' } }),
    e('post-apocalyptic', 'dustbowl', 'Dustbowl', ['dust', 'wasteland']),
    e('post-apocalyptic', 'convoy', 'Convoy', ['journey', 'survival'], { forms: { plural: 'Convoys' } }),
    e('post-apocalyptic', 'scavenger', 'Scavenger', ['scavenging', 'survival'], { forms: { plural: 'Scavengers' } }),
    e('post-apocalyptic', 'geiger', 'Geiger', ['radiation', 'signal']),
    e('post-apocalyptic', 'salvage', 'Salvage', ['scavenging', 'rust'], { mass: true }),
    e('post-apocalyptic', 'afterlight', 'Afterlight', ['aftermath', 'light', 'hope']),
    e('post-apocalyptic', 'ruinland', 'Ruinland', ['ruin', 'wasteland'], { forms: { plural: 'Ruinlands' } }),
  ],
  profile: 'neutral',
  guard: { blockPhrases: ['fallout', 'vault-tec', 'wasteland 3', 'mad max'] },
};
```

`steampunk.ts`:
```ts
export const STEAMPUNK: GenrePreset = {
  id: 'steampunk', label: 'Steampunk', group: 'Sci-Fi & Punk', noteLabel: 'steampunk',
  conceptBoosts: { steam: 2, gear: 2, clockwork: 1.8, aether: 1.8, airship: 1.8, industry: 1.4, machine: 1.5, craft: 1.4, elegance: 1.3,
    gold: 1.2, sky: 1.3, city: 1.2 },
  familyWeights: { 'of-phrase': 1.4, possessive: 1.5, compound: 1.3, duo: 1.4 },
  defaultTones: ['whimsical', 'elegant'],
  lengthBias: LENGTH.medium,
  entries: [
    e('steampunk', 'brass', 'Brass', ['gear', 'craft', 'gold'], { mass: true, compound: 'head' }),
    e('steampunk', 'cog', 'Cog', ['gear', 'machine'], { forms: { plural: 'Cogs' }, compound: 'head' }),
    e('steampunk', 'foundry', 'Foundry', ['forge', 'industry'], { forms: { plural: 'Foundries' } }),
    e('steampunk', 'gaslight', 'Gaslight', ['light', 'city', 'smoke'], { forms: { plural: 'Gaslights' } }),
    e('steampunk', 'dirigible', 'Dirigible', ['airship', 'sky'], { forms: { plural: 'Dirigibles' } }),
    e('steampunk', 'automaton', 'Automaton', ['clockwork', 'machine'], { forms: { plural: 'Automatons' } }),
    e('steampunk', 'boiler', 'Boiler', ['steam', 'engine'], { forms: { plural: 'Boilers' } }),
    e('steampunk', 'chronometer', 'Chronometer', ['clockwork', 'time'], { forms: { plural: 'Chronometers' } }),
    e('steampunk', 'inventor', 'Inventor', ['craft', 'machine'], { forms: { plural: 'Inventors' } }),
    e('steampunk', 'gearwork', 'Gearwork', ['gear', 'clockwork'], { mass: true }),
  ],
  profile: 'neutral',
};
```

`dieselpunk.ts`:
```ts
export const DIESELPUNK: GenrePreset = {
  id: 'dieselpunk', label: 'Dieselpunk', group: 'Sci-Fi & Punk', noteLabel: 'dieselpunk',
  conceptBoosts: { industry: 2, iron: 1.8, smoke: 1.8, propaganda: 1.6, engine: 1.6, war: 1.4, broadcast: 1.5, machine: 1.4, city: 1.3,
    rust: 1.2, signal: 1.2, order: 1.2 },
  familyWeights: { pair: 1.4, code: 1.4, number: 1.4, subtitle: 1.3 },
  defaultTones: ['grim', 'retro'],
  lengthBias: LENGTH.shortMedium,
  entries: [
    e('dieselpunk', 'diesel', 'Diesel', ['engine', 'industry'], { mass: true, compound: 'head' }),
    e('dieselpunk', 'smog', 'Smog', ['smoke', 'city'], { mass: true, compound: 'head' }),
    e('dieselpunk', 'rivet', 'Rivet', ['iron', 'industry'], { forms: { plural: 'Rivets' } }),
    e('dieselpunk', 'factory', 'Factory', ['industry', 'work'], { forms: { plural: 'Factories' } }),
    e('dieselpunk', 'radio', 'Radio', ['broadcast', 'signal'], { forms: { plural: 'Radios' } }),
    e('dieselpunk', 'zeppelin', 'Zeppelin', ['airship', 'war'], { forms: { plural: 'Zeppelins' } }),
    e('dieselpunk', 'ironclad', 'Ironclad', ['iron', 'war', 'ship'], { forms: { plural: 'Ironclads' } }),
    e('dieselpunk', 'newsreel', 'Newsreel', ['propaganda', 'broadcast'], { forms: { plural: 'Newsreels' } }),
    e('dieselpunk', 'searchlight', 'Searchlight', ['light', 'war'], { forms: { plural: 'Searchlights' } }),
    e('dieselpunk', 'assembly-line', 'Assembly Line', ['industry', 'routine'], { forms: { plural: 'Assembly Lines' } }),
  ],
  profile: 'neutral',
};
```

`adventure.ts`:
```ts
export const ADVENTURE: GenrePreset = {
  id: 'adventure', label: 'Adventure', group: 'Adventure & Survival', noteLabel: 'adventure',
  conceptBoosts: { journey: 2, map: 1.8, exploration: 1.8, island: 1.5, wind: 1.4, secret: 1.4, voyage: 1.5, wonder: 1.4, ancient: 1.2,
    path: 1.3, jungle: 1.2, relic: 1.3 },
  familyWeights: { 'of-phrase': 1.4, prepositional: 1.4, possessive: 1.4 },
  defaultTones: ['heroic', 'mysterious'],
  lengthBias: LENGTH.medium,
  frameWords: ['Tales', 'Keepers', 'Gates'],
  entries: [
    e('adventure', 'compass', 'Compass', ['map', 'journey'], { forms: { plural: 'Compasses' } }),
    e('adventure', 'expedition', 'Expedition', ['exploration', 'journey'], { forms: { plural: 'Expeditions' } }),
    e('adventure', 'horizon', 'Horizon', ['journey', 'sky'], { forms: { plural: 'Horizons' }, cliche: 0.4 }),
    e('adventure', 'cartographer', 'Cartographer', ['map', 'exploration'], { forms: { plural: 'Cartographers' } }),
    e('adventure', 'atlas', 'Atlas', ['map', 'knowledge'], { forms: { plural: 'Atlases' } }),
    e('adventure', 'lost-city', 'Lost City', ['ruin', 'secret', 'city'], { forms: { plural: 'Lost Cities' }, cliche: 0.5 }),
    e('adventure', 'trail', 'Trail', ['path', 'journey'], { forms: { plural: 'Trails' } }),
    e('adventure', 'spyglass', 'Spyglass', ['voyage', 'exploration'], { forms: { plural: 'Spyglasses' } }),
    e('adventure', 'treasure', 'Treasure', ['gold', 'secret'], { forms: { plural: 'Treasures' } }),
    e('adventure', 'waypoint', 'Waypoint', ['path', 'map'], { forms: { plural: 'Waypoints' } }),
  ],
  profile: 'neutral',
};
```

`survival.ts`:
```ts
export const SURVIVAL: GenrePreset = {
  id: 'survival', label: 'Survival', group: 'Adventure & Survival', noteLabel: 'survival',
  conceptBoosts: { survival: 2.2, winter: 1.8, hunger: 1.8, shelter: 1.8, fire: 1.5, wild: 1.6, salt: 1.4, storm: 1.5, cold: 1.5, hunt: 1.3,
    isolation: 1.3, island: 1.2 },
  familyWeights: { imperative: 1.6, number: 1.5, pair: 1.3, single: 1.4 },
  defaultTones: ['grim', 'brutal'],
  lengthBias: LENGTH.short,
  entries: [
    e('survival', 'campfire', 'Campfire', ['fire', 'shelter', 'warmth'], { forms: { plural: 'Campfires' } }),
    e('survival', 'thaw', 'Thaw', ['spring', 'hope', 'cold'], { forms: { plural: 'Thaws' } }),
    e('survival', 'ration', 'Ration', ['hunger', 'survival'], { forms: { plural: 'Rations' } }),
    e('survival', 'driftwood', 'Driftwood', ['sea', 'survival'], { mass: true }),
    e('survival', 'lean-to', 'Lean-To', ['shelter', 'wild'], { forms: { plural: 'Lean-Tos' } }),
    e('survival', 'flint', 'Flint', ['fire', 'stone', 'survival'], { mass: true, compound: 'head' }),
    e('survival', 'whiteout', 'Whiteout', ['snow', 'storm'], { forms: { plural: 'Whiteouts' } }),
    e('survival', 'castaway', 'Castaway', ['island', 'isolation'], { forms: { plural: 'Castaways' } }),
    e('survival', 'last-light', 'Last Light', ['light', 'hope', 'dusk'], { cliche: 0.4 }),
    e('survival', 'long-dark', 'Long Dark', ['winter', 'night', 'survival'], { mass: true, cliche: 0.4 }),
  ],
  profile: 'neutral',
};
```
("The Long Dark" must be in the known-title list (Step 5) so it is never produced verbatim.)

`roguelike.ts`:
```ts
export const ROGUELIKE: GenrePreset = {
  id: 'roguelike', label: 'Roguelike / Roguelite', group: 'Adventure & Survival', noteLabel: 'roguelike',
  conceptBoosts: { depth: 2, loop: 2, descent: 1.8, spiral: 1.6, deck: 1.6, fate: 1.5, chance: 1.6, tomb: 1.3, abyss: 1.3, death: 1.3,
    labyrinth: 1.4, cycle: 1.3 },
  familyWeights: { compound: 1.5, single: 1.4, prepositional: 1.4, number: 1.4 },
  defaultTones: ['grim', 'playful'],
  lengthBias: LENGTH.short,
  entries: [
    e('roguelike', 'run', 'Run', ['loop', 'chance'], { forms: { plural: 'Runs' } }),
    e('roguelike', 'crypt', 'Crypt', ['tomb', 'depth'], { forms: { plural: 'Crypts' }, compound: 'head' }),
    e('roguelike', 'floor', 'Floor', ['depth', 'descent'], { forms: { plural: 'Floors' } }),
    e('roguelike', 'relic', 'Relic', ['relic', 'chance'], { forms: { plural: 'Relics' } }),
    e('roguelike', 'gambit', 'Gambit', ['chance', 'deck'], { forms: { plural: 'Gambits' } }),
    e('roguelike', 'undercroft', 'Undercroft', ['depth', 'tomb'], { forms: { plural: 'Undercrofts' } }),
    e('roguelike', 'reroll', 'Reroll', ['chance', 'loop'], { forms: { plural: 'Rerolls' } }),
    e('roguelike', 'wager', 'Wager', ['chance', 'fate'], { forms: { plural: 'Wagers' } }),
    e('roguelike', 'stairwell', 'Stairwell', ['descent', 'depth'], { forms: { plural: 'Stairwells' } }),
    e('roguelike', 'last-life', 'Last Life', ['death', 'chance'], { forms: { plural: 'Last Lives' } }),
  ],
  profile: 'neutral',
};
```
`sandbox.ts`:
```ts
export const SANDBOX: GenrePreset = {
  id: 'sandbox', label: 'Sandbox', group: 'Adventure & Survival', noteLabel: 'sandbox',
  conceptBoosts: { building: 2, craft: 1.8, frontier: 1.6, island: 1.5, earth: 1.5, forge: 1.4, exploration: 1.5, play: 1.4, stone: 1.3,
    wild: 1.2, settlement: 1.3, wonder: 1.2 },
  familyWeights: { compound: 1.6, single: 1.4, pair: 1.3 },
  defaultTones: ['playful', 'minimalist'],
  lengthBias: LENGTH.short,
  entries: [
    e('sandbox', 'block', 'Block', ['building', 'shape'], { forms: { plural: 'Blocks' }, compound: 'head' }),
    e('sandbox', 'ground', 'Ground', ['earth', 'building'], { forms: { plural: 'Grounds' } }),
    e('sandbox', 'world', 'World', ['exploration', 'earth'], { forms: { plural: 'Worlds' } }),
    e('sandbox', 'blueprint', 'Blueprint', ['building', 'craft'], { forms: { plural: 'Blueprints' } }),
    e('sandbox', 'quarry', 'Quarry', ['stone', 'work'], { forms: { plural: 'Quarries' } }),
    e('sandbox', 'workbench', 'Workbench', ['craft', 'work'], { forms: { plural: 'Workbenches' } }),
    e('sandbox', 'biome', 'Biome', ['wild', 'exploration'], { forms: { plural: 'Biomes' } }),
    e('sandbox', 'voxel', 'Voxel', ['shape', 'building'], { forms: { plural: 'Voxels' } }),
    e('sandbox', 'homestead', 'Homestead', ['settlement', 'home'], { forms: { plural: 'Homesteads' } }),
    e('sandbox', 'terrain', 'Terrain', ['earth', 'map'], { forms: { plural: 'Terrains' } }),
  ],
  profile: 'neutral',
  guard: { blockSuffixes: ['craft'], blockPhrases: ['minecraft', 'terraria'] },
};
```

`cozy.ts`:
```ts
export const COZY: GenrePreset = {
  id: 'cozy', label: 'Cozy', group: 'Cozy & Life', noteLabel: 'cozy',
  conceptBoosts: { home: 2.4, warmth: 2.2, comfort: 2.2, garden: 2, bloom: 1.8, cottage: 1.8, friendship: 2, food: 1.6, moss: 1.5,
    village: 1.5, feast: 1.3, season: 1.3 },
  suppress: ['death', 'war', 'blood', 'gore', 'dread', 'plague', 'battle', 'siege'],
  familyWeights: { place: 2, possessive: 1.6, duo: 1.5, pair: 1.3 },
  defaultTones: ['cozy', 'whimsical'],
  lengthBias: LENGTH.shortMedium,
  suffixWords: [{ text: 'Days' }, { text: 'Friends' }, { text: 'Corner' }],
  entries: [
    e('cozy', 'teacup', 'Teacup', ['comfort', 'food', 'home'], { forms: { plural: 'Teacups' }, register: 'whimsical' }),
    e('cozy', 'quilt', 'Quilt', ['comfort', 'craft', 'warmth'], { forms: { plural: 'Quilts' } }),
    e('cozy', 'honey', 'Honey', ['food', 'warmth', 'garden'], { mass: true, compound: 'head' }),
    e('cozy', 'lantern', 'Lantern', ['light', 'warmth', 'home'], { forms: { plural: 'Lanterns' }, compound: 'head' }),
    e('cozy', 'kettle', 'Kettle', ['food', 'home'], { forms: { plural: 'Kettles' } }),
    e('cozy', 'nook', 'Nook', ['home', 'comfort'], { forms: { plural: 'Nooks' } }),
    e('cozy', 'acorn', 'Acorn', ['seed', 'forest'], { forms: { plural: 'Acorns' }, compound: 'head' }),
    e('cozy', 'blanket', 'Blanket', ['comfort', 'warmth'], { forms: { plural: 'Blankets' } }),
    e('cozy', 'teatime', 'Teatime', ['food', 'community'], { mass: true }),
    e('cozy', 'windowsill', 'Windowsill', ['home', 'garden'], { forms: { plural: 'Windowsills' } }),
  ],
  profile: 'soft',
};
```

`farming.ts`:
```ts
export const FARMING: GenrePreset = {
  id: 'farming', label: 'Farming / Life Sim', group: 'Cozy & Life', parent: 'cozy', noteLabel: 'farming',
  conceptBoosts: { harvest: 2.4, seed: 2, garden: 1.8, season: 1.8, village: 1.6, earth: 1.4, spring: 1.4, summer: 1.3, autumn: 1.3, food: 1.4,
    community: 1.4, bloom: 1.3 },
  familyWeights: { place: 1.8, descriptive: 1.6, suffix: 1.4 },
  defaultTones: ['cozy', 'playful'],
  lengthBias: LENGTH.medium,
  suffixWords: [{ text: 'Farm' }, { text: 'Days' }, { text: 'Life' }, { text: 'Valley', cliche: 0.6 }, { text: 'Acres' }],
  entries: [
    e('farming', 'farm', 'Farm', ['harvest', 'village'], { forms: { plural: 'Farms' } }),
    e('farming', 'orchard', 'Orchard', ['garden', 'harvest', 'tree'], { forms: { plural: 'Orchards' } }),
    e('farming', 'barn', 'Barn', ['harvest', 'home'], { forms: { plural: 'Barns' } }),
    e('farming', 'meadow', 'Meadow', ['bloom', 'garden'], { forms: { plural: 'Meadows' } }),
    e('farming', 'furrow', 'Furrow', ['earth', 'seed'], { forms: { plural: 'Furrows' } }),
    e('farming', 'sprout', 'Sprout', ['seed', 'spring'], { forms: { plural: 'Sprouts' } }),
    e('farming', 'homestead', 'Homestead', ['home', 'settlement'], { forms: { plural: 'Homesteads' } }),
    e('farming', 'acre', 'Acre', ['earth', 'harvest'], { forms: { plural: 'Acres' } }),
    e('farming', 'pumpkin', 'Pumpkin', ['harvest', 'autumn'], { forms: { plural: 'Pumpkins' } }),
    e('farming', 'almanac', 'Almanac', ['season', 'book'], { forms: { plural: 'Almanacs' } }),
  ],
  profile: 'soft',
};
```

`creature-collector.ts`:
```ts
export const CREATURE_COLLECTOR: GenrePreset = {
  id: 'creature-collector', label: 'Creature Collector', group: 'Cozy & Life', noteLabel: 'creature-collector',
  conceptBoosts: { creature: 2.4, collecting: 2.2, bond: 2, egg: 1.6, nest: 1.6, island: 1.6, wild: 1.5, friendship: 1.8, wonder: 1.5,
    exploration: 1.4, whimsy: 1.4, reef: 1.2 },
  suppress: ['gore', 'plague', 'death'],
  familyWeights: { coined: 1.6, compound: 1.5, duo: 1.5, suffix: 1.3 },
  defaultTones: ['playful', 'whimsical'],
  lengthBias: LENGTH.short,
  suffixWords: [{ text: 'Keepers' }, { text: 'Tamers' }, { text: 'Pals' }, { text: 'Friends' }],
  entries: [
    e('creature-collector', 'critter', 'Critter', ['creature', 'whimsy'], { forms: { plural: 'Critters' }, compound: 'head' }),
    e('creature-collector', 'buddy', 'Buddy', ['friendship', 'bond'], { forms: { plural: 'Buddies' } }),
    e('creature-collector', 'tamer', 'Tamer', ['bond', 'creature'], { forms: { plural: 'Tamers' } }),
    e('creature-collector', 'hatchling', 'Hatchling', ['egg', 'creature'], { forms: { plural: 'Hatchlings' } }),
    e('creature-collector', 'sanctuary', 'Sanctuary', ['shelter', 'creature'], { forms: { plural: 'Sanctuaries' } }),
    e('creature-collector', 'tidepool', 'Tidepool', ['reef', 'sea', 'creature'], { forms: { plural: 'Tidepools' } }),
    e('creature-collector', 'menagerie', 'Menagerie', ['collecting', 'creature'], { forms: { plural: 'Menageries' } }),
    e('creature-collector', 'companion', 'Companion', ['bond', 'friendship'], { forms: { plural: 'Companions' } }),
    e('creature-collector', 'burrow', 'Burrow', ['nest', 'home'], { forms: { plural: 'Burrows' } }),
    e('creature-collector', 'field-guide', 'Field Guide', ['collecting', 'book'], { forms: { plural: 'Field Guides' } }),
  ],
  profile: 'soft',
  guard: { blockSuffixes: ['mon'], blockPhrases: ['pocket monster', 'pocket monsters', 'pokemon', 'digimon', 'gotta catch'] },
};
```

`strategy.ts`:
```ts
export const STRATEGY: GenrePreset = {
  id: 'strategy', label: 'Strategy', group: 'Strategy & Simulation', noteLabel: 'strategy',
  conceptBoosts: { empire: 2, command: 2, siege: 1.8, banner: 1.6, dynasty: 1.6, war: 1.6, conquest: 1.6, order: 1.3, legion: 1.4, map: 1.3,
    throne: 1.3, history: 1.2 },
  familyWeights: { 'of-phrase': 1.5, pair: 1.3, suffix: 1.5 },
  defaultTones: ['epic', 'cinematic'],
  lengthBias: LENGTH.medium,
  suffixWords: [{ text: 'Tactics', cliche: 0.3 }, { text: 'Command', cliche: 0.3 }, { text: 'Dominion', cliche: 0.3 }],
  entries: [
    e('strategy', 'dominion', 'Dominion', ['empire', 'order'], { forms: { plural: 'Dominions' } }),
    e('strategy', 'front', 'Front', ['war', 'command'], { forms: { plural: 'Fronts' } }),
    e('strategy', 'campaign', 'Campaign', ['war', 'conquest'], { forms: { plural: 'Campaigns' } }),
    e('strategy', 'warlord', 'Warlord', ['war', 'command'], { forms: { plural: 'Warlords' } }),
    e('strategy', 'stratagem', 'Stratagem', ['command', 'secret'], { forms: { plural: 'Stratagems' } }),
    e('strategy', 'province', 'Province', ['empire', 'map'], { forms: { plural: 'Provinces' } }),
    e('strategy', 'garrison', 'Garrison', ['siege', 'legion'], { forms: { plural: 'Garrisons' } }),
    e('strategy', 'treaty', 'Treaty', ['order', 'oath'], { forms: { plural: 'Treaties' } }),
    e('strategy', 'vanguard', 'Vanguard', ['war', 'banner'], { forms: { plural: 'Vanguards' } }),
    e('strategy', 'statecraft', 'Statecraft', ['order', 'command'], { mass: true }),
  ],
  profile: 'latin',
};
```
`city-builder.ts`:
```ts
export const CITY_BUILDER: GenrePreset = {
  id: 'city-builder', label: 'City Builder', group: 'Strategy & Simulation', noteLabel: 'city-builder',
  conceptBoosts: { city: 2.2, building: 2, harbor: 1.6, district: 1.6, settlement: 1.8, bridge: 1.5, river: 1.5, community: 1.6, trade: 1.4,
    order: 1.2, industry: 1.2, village: 1.2 },
  familyWeights: { place: 1.8, descriptive: 1.5, suffix: 1.4 },
  defaultTones: ['cozy', 'elegant'],
  lengthBias: LENGTH.shortMedium,
  suffixWords: [{ text: 'Founders' }, { text: 'Builders' }, { text: 'Colony' }],
  entries: [
    e('city-builder', 'founder', 'Founder', ['settlement', 'history'], { forms: { plural: 'Founders' } }),
    e('city-builder', 'boulevard', 'Boulevard', ['city', 'path'], { forms: { plural: 'Boulevards' } }),
    e('city-builder', 'canal', 'Canal', ['river', 'city'], { forms: { plural: 'Canals' } }),
    e('city-builder', 'skyline', 'Skyline', ['city', 'sky'], { forms: { plural: 'Skylines' } }),
    e('city-builder', 'plaza', 'Plaza', ['city', 'community'], { forms: { plural: 'Plazas' } }),
    e('city-builder', 'township', 'Township', ['settlement', 'village'], { forms: { plural: 'Townships' } }),
    e('city-builder', 'quay', 'Quay', ['harbor', 'trade'], { forms: { plural: 'Quays' } }),
    e('city-builder', 'borough', 'Borough', ['district', 'city'], { forms: { plural: 'Boroughs' } }),
    e('city-builder', 'aqueduct', 'Aqueduct', ['river', 'building'], { forms: { plural: 'Aqueducts' } }),
    e('city-builder', 'charter', 'Charter', ['order', 'settlement'], { forms: { plural: 'Charters' } }),
  ],
  profile: 'neutral',
};
```

`simulation.ts`:
```ts
export const SIMULATION: GenrePreset = {
  id: 'simulation', label: 'Simulation', group: 'Strategy & Simulation', noteLabel: 'simulation',
  conceptBoosts: { work: 2, shop: 1.8, career: 1.8, routine: 1.8, craft: 1.6, trade: 1.4, machine: 1.3, community: 1.3, city: 1.2, food: 1.2,
    building: 1.2, time: 1.2 },
  familyWeights: { descriptive: 1.8, suffix: 1.6, possessive: 1.4 },
  defaultTones: ['playful', 'minimalist'],
  lengthBias: LENGTH.medium,
  suffixWords: [{ text: 'Simulator', cliche: 0.5 }, { text: 'Manager', cliche: 0.3 }, { text: 'Tycoon', cliche: 0.5 }, { text: 'Shift' }],
  entries: [
    e('simulation', 'workshop', 'Workshop', ['craft', 'work'], { forms: { plural: 'Workshops' } }),
    e('simulation', 'shift', 'Shift', ['work', 'routine'], { forms: { plural: 'Shifts' } }),
    e('simulation', 'counter', 'Counter', ['shop', 'trade'], { forms: { plural: 'Counters' } }),
    e('simulation', 'clipboard', 'Clipboard', ['work', 'order'], { forms: { plural: 'Clipboards' } }),
    e('simulation', 'depot', 'Depot', ['trade', 'machine'], { forms: { plural: 'Depots' } }),
    e('simulation', 'diner', 'Diner', ['food', 'shop'], { forms: { plural: 'Diners' } }),
    e('simulation', 'garage', 'Garage', ['machine', 'craft'], { forms: { plural: 'Garages' } }),
    e('simulation', 'overtime', 'Overtime', ['work', 'time'], { mass: true }),
    e('simulation', 'storefront', 'Storefront', ['shop', 'city'], { forms: { plural: 'Storefronts' } }),
    e('simulation', 'payday', 'Payday', ['work', 'gold'], { forms: { plural: 'Paydays' } }),
  ],
  profile: 'neutral',
};
```

`puzzle.ts`:
```ts
export const PUZZLE: GenrePreset = {
  id: 'puzzle', label: 'Puzzle', group: 'Mystery & Puzzle', noteLabel: 'puzzle',
  conceptBoosts: { puzzle: 2.2, key: 1.8, light: 1.6, shape: 1.8, knot: 1.6, lock: 1.6, mirror: 1.6, prism: 1.6, pattern: 1.8, labyrinth: 1.4,
    glass: 1.3, silence: 1.1 },
  familyWeights: { single: 1.6, compound: 1.4, coined: 1.4, pair: 1.3 },
  defaultTones: ['minimalist', 'playful'],
  lengthBias: LENGTH.short,
  entries: [
    e('puzzle', 'tile', 'Tile', ['shape', 'pattern'], { forms: { plural: 'Tiles' } }),
    e('puzzle', 'cipher', 'Cipher', ['puzzle', 'secret', 'code'], { forms: { plural: 'Ciphers' } }),
    e('puzzle', 'lattice', 'Lattice', ['pattern', 'shape'], { forms: { plural: 'Lattices' } }),
    e('puzzle', 'facet', 'Facet', ['prism', 'gem'], { forms: { plural: 'Facets' } }),
    e('puzzle', 'tessellation', 'Tessellation', ['pattern', 'shape'], { forms: { plural: 'Tessellations' } }),
    e('puzzle', 'hinge', 'Hinge', ['door', 'key'], { forms: { plural: 'Hinges' } }),
    e('puzzle', 'riddle', 'Riddle', ['puzzle', 'secret'], { forms: { plural: 'Riddles' } }),
    e('puzzle', 'spectrum', 'Spectrum', ['light', 'prism'], { forms: { plural: 'Spectra' } }),
    e('puzzle', 'fold', 'Fold', ['shape', 'craft'], { forms: { plural: 'Folds' } }),
    e('puzzle', 'keystone', 'Keystone', ['key', 'building'], { forms: { plural: 'Keystones' } }),
  ],
  profile: 'neutral',
};
```
`mystery.ts`:
```ts
export const MYSTERY: GenrePreset = {
  id: 'mystery', label: 'Mystery', group: 'Mystery & Puzzle', noteLabel: 'mystery',
  conceptBoosts: { secret: 2, clue: 2, mystery: 2, letter: 1.6, mist: 1.5, absence: 1.4, lake: 1.3, house: 1.4, ink: 1.3, mask: 1.3,
    crime: 1.3, threshold: 1.2 },
  familyWeights: { 'of-phrase': 1.4, possessive: 1.4, 'the-name': 1.8, prepositional: 1.3 },
  defaultTones: ['mysterious', 'elegant'],
  lengthBias: LENGTH.medium,
  entries: [
    e('mystery', 'manor', 'Manor', ['house', 'secret'], { forms: { plural: 'Manors' } }),
    e('mystery', 'affair', 'Affair', ['mystery', 'crime'], { forms: { plural: 'Affairs' } }),
    e('mystery', 'cipher', 'Cipher', ['secret', 'clue'], { forms: { plural: 'Ciphers' } }),
    e('mystery', 'fog', 'Fog', ['mist', 'secret'], { mass: true, compound: 'head' }),
    e('mystery', 'disappearance', 'Disappearance', ['absence', 'mystery'], { forms: { plural: 'Disappearances' } }),
    e('mystery', 'locket', 'Locket', ['secret', 'love', 'memory'], { forms: { plural: 'Lockets' } }),
    e('mystery', 'inheritance', 'Inheritance', ['kin', 'secret'], { forms: { plural: 'Inheritances' } }),
    e('mystery', 'boathouse', 'Boathouse', ['lake', 'house'], { forms: { plural: 'Boathouses' } }),
    e('mystery', 'telegram', 'Telegram', ['letter', 'signal'], { forms: { plural: 'Telegrams' } }),
    e('mystery', 'alibi', 'Alibi', ['crime', 'secret'], { forms: { plural: 'Alibis' } }),
  ],
  profile: 'neutral',
};
```

`noir.ts`:
```ts
export const NOIR: GenrePreset = {
  id: 'noir', label: 'Detective / Noir', group: 'Mystery & Puzzle', noteLabel: 'noir',
  conceptBoosts: { case: 2.2, crime: 2, rain: 1.8, smoke: 1.8, city: 1.6, neon: 1.4, night: 1.6, law: 1.4, secret: 1.4, guilt: 1.3,
    district: 1.3, gold: 1.1 },
  familyWeights: { pair: 1.4, sentence: 1.4, prepositional: 1.5, 'the-name': 1.3 },
  defaultTones: ['dark', 'melancholic'],
  lengthBias: LENGTH.medium,
  entries: [
    e('noir', 'badge', 'Badge', ['law', 'case'], { forms: { plural: 'Badges' } }),
    e('noir', 'alley', 'Alley', ['city', 'night'], { forms: { plural: 'Alleys' } }),
    e('noir', 'gin', 'Gin', ['night', 'sorrow'], { mass: true }),
    e('noir', 'ledger', 'Ledger', ['crime', 'secret'], { forms: { plural: 'Ledgers' } }),
    e('noir', 'precinct', 'Precinct', ['law', 'district'], { forms: { plural: 'Precincts' } }),
    e('noir', 'fedora', 'Fedora', ['case', 'mask'], { forms: { plural: 'Fedoras' }, cliche: 0.6 }),
    e('noir', 'witness', 'Witness', ['case', 'secret'], { forms: { plural: 'Witnesses' } }),
    e('noir', 'midnight', 'Midnight', ['night', 'secret'], { forms: { plural: 'Midnights' }, cliche: 0.4 }),
    e('noir', 'informant', 'Informant', ['crime', 'secret'], { forms: { plural: 'Informants' } }),
    e('noir', 'neon-sign', 'Neon Sign', ['neon', 'city'], { forms: { plural: 'Neon Signs' } }),
  ],
  profile: 'neutral',
};
```

`western.ts`:
```ts
export const WESTERN: GenrePreset = {
  id: 'western', label: 'Western', group: 'Setting', noteLabel: 'western',
  conceptBoosts: { frontier: 2.2, dust: 2, outlaw: 2, gold: 1.6, bounty: 1.8, canyon: 1.6, desert: 1.5, horse: 1.5, law: 1.4, dusk: 1.4,
    settlement: 1.2, heat: 1.2 },
  familyWeights: { pair: 1.4, 'of-phrase': 1.3, prepositional: 1.4, number: 1.4 },
  defaultTones: ['grim', 'cinematic'],
  lengthBias: LENGTH.shortMedium,
  entries: [
    e('western', 'mesa', 'Mesa', ['canyon', 'desert'], { forms: { plural: 'Mesas' } }),
    e('western', 'sundown', 'Sundown', ['dusk', 'frontier'], { forms: { plural: 'Sundowns' } }),
    e('western', 'saloon', 'Saloon', ['tavern', 'frontier'], { forms: { plural: 'Saloons' } }),
    e('western', 'revolver', 'Revolver', ['outlaw', 'law'], { forms: { plural: 'Revolvers' } }),
    e('western', 'stagecoach', 'Stagecoach', ['journey', 'frontier'], { forms: { plural: 'Stagecoaches' } }),
    e('western', 'tumbleweed', 'Tumbleweed', ['dust', 'desert'], { forms: { plural: 'Tumbleweeds' } }),
    e('western', 'marshal', 'Marshal', ['law', 'frontier'], { forms: { plural: 'Marshals' } }),
    e('western', 'goldrush', 'Gold Rush', ['gold', 'frontier'], { forms: { plural: 'Gold Rushes' } }),
    e('western', 'wanted', 'Wanted', ['bounty', 'outlaw'], { mass: true }),
    e('western', 'railroad', 'Railroad', ['frontier', 'industry'], { forms: { plural: 'Railroads' } }),
  ],
  profile: 'neutral',
  guard: { blockPhrases: ['redskin', 'injun', 'squaw', 'savage', 'savages', 'tomahawk', 'war paint', 'warpaint', 'peace pipe', 'dreamcatcher', 'chief', 'tribe', 'scalp', 'red dead'] },
};
```

`historical.ts`:
```ts
export const HISTORICAL: GenrePreset = {
  id: 'historical', label: 'Historical', group: 'Setting', noteLabel: 'historical',
  conceptBoosts: { empire: 2, dynasty: 2, crown: 1.6, siege: 1.6, age: 1.6, banner: 1.5, legion: 1.5, river: 1.3, history: 1.8, war: 1.3,
    throne: 1.3, castle: 1.3 },
  familyWeights: { 'of-phrase': 1.6, subtitle: 1.5, number: 1.4 },
  defaultTones: ['epic', 'ancient'],
  lengthBias: LENGTH.mediumLong,
  frameWords: ['Age', 'Heirs', 'Fall', 'Rise'],
  entries: [
    e('historical', 'chronicle', 'Chronicle', ['history', 'book'], { forms: { plural: 'Chronicles' }, cliche: 0.5 }),
    e('historical', 'dynasty', 'Dynasty', ['dynasty', 'throne'], { forms: { plural: 'Dynasties' } }),
    e('historical', 'campaign', 'Campaign', ['war', 'history'], { forms: { plural: 'Campaigns' } }),
    e('historical', 'succession', 'Succession', ['throne', 'kin'], { forms: { plural: 'Successions' } }),
    e('historical', 'regent', 'Regent', ['throne', 'order'], { forms: { plural: 'Regents' } }),
    e('historical', 'citadel', 'Citadel', ['castle', 'siege'], { forms: { plural: 'Citadels' } }),
    e('historical', 'annals', 'Annals', ['history', 'book'], { mass: true }),
    e('historical', 'frontier-wall', 'Frontier Wall', ['frontier', 'empire'], { forms: { plural: 'Frontier Walls' } }),
    e('historical', 'heirloom', 'Heirloom', ['kin', 'relic'], { forms: { plural: 'Heirlooms' } }),
    e('historical', 'mandate', 'Mandate', ['order', 'throne'], { forms: { plural: 'Mandates' } }),
  ],
  profile: 'latin',
};
```
`packages/game-titles/src/genres/index.ts`:
```ts
import { ACTION_RPG } from './action-rpg';
import { ADVENTURE } from './adventure';
import { CITY_BUILDER } from './city-builder';
import { COSMIC_HORROR } from './cosmic-horror';
import { COZY } from './cozy';
import { CREATURE_COLLECTOR } from './creature-collector';
import { CRPG } from './crpg';
import { CYBERPUNK } from './cyberpunk';
import { DARK_FANTASY } from './dark-fantasy';
import { DIESELPUNK } from './dieselpunk';
import { FANTASY } from './fantasy';
import { FARMING } from './farming';
import { HIGH_FANTASY } from './high-fantasy';
import { HISTORICAL } from './historical';
import { HORROR } from './horror';
import { MMO } from './mmo';
import { MYSTERY } from './mystery';
import { NOIR } from './noir';
import { POST_APOCALYPTIC } from './post-apocalyptic';
import { PSYCHOLOGICAL_HORROR } from './psychological-horror';
import { PUZZLE } from './puzzle';
import { ROGUELIKE } from './roguelike';
import { RPG } from './rpg';
import { SANDBOX } from './sandbox';
import { SCI_FI } from './sci-fi';
import { SIMULATION } from './simulation';
import { SPACE_OPERA } from './space-opera';
import { STEAMPUNK } from './steampunk';
import { STRATEGY } from './strategy';
import { SURVIVAL } from './survival';
import { WESTERN } from './western';
import type { GenrePreset } from '../types';

/** GENRE_IDS order. Adding a genre = adding a file and one line here (spec §4.1). */
export const GENRES: readonly GenrePreset[] = [
  FANTASY, DARK_FANTASY, HIGH_FANTASY, RPG, ACTION_RPG, CRPG, MMO,
  HORROR, PSYCHOLOGICAL_HORROR, COSMIC_HORROR,
  SCI_FI, CYBERPUNK, SPACE_OPERA, POST_APOCALYPTIC, STEAMPUNK, DIESELPUNK,
  ADVENTURE, SURVIVAL, ROGUELIKE, SANDBOX,
  COZY, FARMING, CREATURE_COLLECTOR,
  STRATEGY, CITY_BUILDER, SIMULATION,
  PUZZLE, MYSTERY, NOIR,
  WESTERN, HISTORICAL,
];
```

- [ ] **Step 5: The known-title list**

Create `packages/game-titles/src/known-titles-data.ts` exporting `KNOWN_TITLE_LIST: readonly string[]`: at least 1,500 famous game titles (exact titles as published, one string each), compiled from public lists such as Wikipedia's "List of best-selling video games", the Game Awards and BAFTA Games winners and nominees, Steam's all-time top sellers and top-rated lists, and itch.io's most popular. Include famous one-word film titles that a generator could plausibly produce exactly (Frozen, Tangled, Brave, Moana, Encanto, Coco, Inside Out, Up). These are facts, not creative content; note the sources in `THIRD_PARTY_NOTICES.md`.

Change `packages/game-titles/src/known-titles.ts` to:
```ts
import { normalize } from '@vps-name-tools/core';
import { KNOWN_TITLE_LIST } from './known-titles-data';

/** Famous game (and a few film) titles. An exact normalised match is never produced (spec §8, §18 item 8). */
export const KNOWN_TITLES: ReadonlySet<string> = new Set(KNOWN_TITLE_LIST.map(normalize).filter(Boolean));
```
Move the seed titles from Task 12 into the new list.

- [ ] **Step 6: Run to verify pass**

Run: `npx tsx --test packages/game-titles/test/genres.test.ts && npm run validate:data && npm test`
Expected: PASS. If a genre returns fewer than 10 titles on defaults, look at its family weights and concept boosts (they may concentrate on one family), not at the selection caps.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the 31 genre presets and the known-title guard list"
```

---

### Task 23: None, Original and the Tier A cultural packs

**Files:**
- Create: `packages/data/src/myths/original.ts`, `norse.ts`, `icelandic.ts`, `germanic.ts`, `anglo-saxon.ts`, `arthurian.ts`, `greek.ts`, `roman.ts`, `egyptian.ts`, `mesopotamian.ts`, `gnostic.ts`, `cosmic.ts`, `fairy-tale.ts`, `alchemical.ts`, `packages/data/src/myths/helpers.ts`
- Modify: `packages/data/src/myths/index.ts`
- Test: `packages/data/test/packs.test.ts` (shared with Task 24)

**Interfaces:**
- Consumes: `MythPack`, builders, `CODED_IMAGERY`, `containsTerm`.
- Produces: 14 packs; `packImagery(pack, entries)` helper; `MYTHS` in `MYTH_IDS` order (Tier B packs arrive in Task 24, so `MYTHS` keeps the ids it has, in order).

Rules for every pack: no deity names (the denylist lists them and the validator keeps them out of the data; the engine keeps them out of output); imagery is common English nouns and adjectives; symbolic terms are rare, non-sacred, each with a `sourceNote`; `review.status` starts as `'draft'` and becomes `'reviewed'` only after the review in Step 5.

- [ ] **Step 1: Write the failing test**

`packages/data/test/packs.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '@vps-name-tools/core';
import { CODED_IMAGERY, MYTHS, MYTH_IDS, containsTerm, type MythPack } from '../src/index';

const TIER_A = ['norse', 'icelandic', 'germanic', 'anglo-saxon', 'arthurian', 'greek', 'roman', 'egyptian', 'mesopotamian', 'gnostic', 'cosmic', 'fairy-tale', 'alchemical'];
const TIER_B = ['celtic', 'persian', 'arabian', 'slavic', 'finnish', 'japanese', 'chinese', 'korean', 'indian', 'mesoamerican', 'aztec', 'maya', 'andean', 'polynesian', 'african', 'biblical'];
const pack = (id: string): MythPack | undefined => MYTHS.find(m => m.id === id);
const authored = () => MYTHS.filter(m => m.id !== 'none');

test('packs appear in MYTH_IDS order', () => {
  const order = MYTHS.map(m => MYTH_IDS.indexOf(m.id));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('Tier A packs exist with tier A', () => {
  for (const id of TIER_A) assert.equal(pack(id)?.tier, 'A', id);
});

test('imagery meets 40 entries per pack (blends excepted) and symbolic terms stay few', () => {
  for (const m of authored()) {
    if (!m.blend) assert.ok(m.imagery.length >= 40, `${m.id}: ${m.imagery.length}`);
    assert.ok(m.symbolic.length <= 20, m.id);
  }
});

test('denylists are non-empty and absent from pack vocabulary', () => {
  for (const m of authored()) {
    if (m.id !== 'original') assert.ok(m.denylist.length > 0, m.id);
    for (const e of [...m.imagery, ...m.symbolic]) for (const d of m.denylist) assert.ok(!containsTerm(normalize(e.text), d), `${m.id}: ${e.text} ~ ${d}`);
  }
});

test('Norse-family packs carry no extremist-coded imagery', () => {
  for (const id of ['norse', 'icelandic', 'germanic', 'anglo-saxon']) {
    const m = pack(id);
    if (!m) continue;
    for (const e of [...m.imagery, ...m.symbolic]) for (const t of CODED_IMAGERY) assert.ok(!containsTerm(normalize(e.text), t), `${id}: ${e.text} ~ ${t}`);
  }
});

test('Tier B packs: -inspired labels, restrained invented words, imagery-led', () => {
  for (const id of TIER_B) {
    const m = pack(id);
    if (!m) continue;
    assert.equal(m.tier, 'B', id);
    assert.match(m.noteLabel, /inspired/, id);
    assert.ok(m.coinedRate <= 0.5, `${id}: coinedRate ${m.coinedRate}`);
    assert.ok(m.symbolic.length <= 8, `${id}: ${m.symbolic.length} symbolic terms`);
  }
});

test('held packs give a reason', () => {
  for (const m of MYTHS) if (m.review.status === 'held') assert.ok(m.review.notes.length > 20, m.id);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/data/test/packs.test.ts`
Expected: FAIL (Tier A packs missing).

- [ ] **Step 3: Helper**

`packages/data/src/myths/helpers.ts`:
```ts
import { adj, noun, symbolic as sym } from '../build';
import type { MythId } from '../ids';
import type { LexEntry, SymbolicEntry } from '../types';

type Options = Parameters<typeof noun>[3];
/** Pack imagery noun with the required "<pack>." id prefix. */
export const imageryNoun = (pack: MythId, id: string, text: string, concepts: readonly string[], o?: Options): LexEntry =>
  noun(`${pack}.${id}`, text, concepts, o);
export const imageryAdj = (pack: MythId, id: string, text: string, concepts: readonly string[], o?: Options): LexEntry =>
  adj(`${pack}.${id}`, text, concepts, o);
export const symbolicNoun = (pack: MythId, id: string, text: string, concepts: readonly string[], sourceNote: string, o?: Options): SymbolicEntry =>
  sym(noun(`${pack}.${id}`, text, concepts, o), sourceNote);
```

- [ ] **Step 4: Write the packs**

Each file exports one `MythPack`. Imagery lists below are seeds; extend each to 40–80 entries from the spec §5.2 row. Every file imports `import type { MythPack } from '../types';` and `import { imageryNoun as n, imageryAdj as a, symbolicNoun as s } from './helpers';`.

`original.ts`:
```ts
export const ORIGINAL: MythPack = {
  id: 'original', label: 'Original Mythic / Mixed', group: 'Neutral', tier: 'none', noteLabel: 'original mythic', profile: 'neutral', coinedRate: 1,
  conceptBoosts: { relic: 1.6, oath: 1.5, star: 1.4, tide: 1.4, crown: 1.4, legend: 1.4, ancient: 1.4, fire: 1.2 },
  imagery: [
    n('original', 'hollow-crown', 'Hollow Crown', ['crown', 'ruin'], { forms: { plural: 'Hollow Crowns' } }),
    n('original', 'ember', 'Ember', ['fire', 'hope'], { forms: { plural: 'Embers' } }),
    n('original', 'starwell', 'Starwell', ['star', 'magic']),
    n('original', 'tidestone', 'Tidestone', ['tide', 'stone', 'relic']),
    n('original', 'oathstone', 'Oathstone', ['oath', 'stone']),
    n('original', 'first-flame', 'First Flame', ['fire', 'ancient']),
  ],
  symbolic: [],
  rhythm: { epithet: 1.5, saga: 1.3 },
  denylist: [],
  review: { status: 'draft', notes: 'Generic mythic bank; no cultural source.' },
};
```

`norse.ts`:
```ts
export const NORSE: MythPack = {
  id: 'norse', label: 'Norse', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Norse', profile: 'norse', coinedRate: 1,
  conceptBoosts: { cold: 2, winter: 2, oath: 2, raven: 2, wolf: 1.8, iron: 1.6, storm: 1.5, saga: 1.6, rune: 1.6, fate: 1.5, sea: 1.3, ship: 1.3 },
  imagery: [
    n('norse', 'longhall', 'Longhall', ['home', 'kin', 'feast'], { register: 'archaic', forms: { plural: 'Longhalls' } }),
    n('norse', 'skald', 'Skald', ['song', 'saga'], { forms: { plural: 'Skalds' } }),
    n('norse', 'rune', 'Rune', ['rune', 'fate'], { forms: { plural: 'Runes' }, compound: 'head' }),
    n('norse', 'longship', 'Longship', ['ship', 'sea', 'voyage'], { forms: { plural: 'Longships' } }),
    n('norse', 'fjord', 'Fjord', ['sea', 'mountain', 'cold'], { forms: { plural: 'Fjords' } }),
    n('norse', 'jarl', 'Jarl', ['crown', 'kin'], { forms: { plural: 'Jarls' }, register: 'archaic' }),
    n('norse', 'shieldwall', 'Shieldwall', ['war', 'kin'], { forms: { plural: 'Shieldwalls' } }),
    n('norse', 'mead', 'Mead', ['feast', 'kin'], { mass: true }),
  ],
  symbolic: [
    s('norse', 'wyrd', 'Wyrd', ['fate', 'omen'], 'Old English wyrd / Old Norse urdr, "fate"; long established in English literature.', { register: 'archaic' }),
    s('norse', 'saga', 'Saga', ['saga', 'legend'], 'Old Norse prose narrative genre; an everyday English word.'),
  ],
  rhythm: { kenning: 12, compound: 1.5, saga: 4, epithet: 2, alliterative: 3 },
  denylist: ['odin', 'thor', 'loki', 'freya', 'freyja', 'frigg', 'baldr', 'balder', 'tyr', 'heimdall', 'njord', 'freyr', 'hel', 'fenrir', 'jormungandr',
    'valhalla', 'asgard', 'midgard', 'yggdrasil', 'ragnarok', 'mjolnir', 'bifrost', 'valkyrie', 'asatru', 'god of war', 'vinland'],
  review: { status: 'draft', notes: '' },
};
```

`icelandic.ts`:
```ts
export const ICELANDIC: MythPack = {
  id: 'icelandic', label: 'Icelandic / Old Norse-inspired', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Icelandic saga-inspired', profile: 'norse', coinedRate: 1,
  conceptBoosts: { glacier: 2, volcano: 2, saga: 2, cold: 1.8, ice: 1.6, outlaw: 1.6, night: 1.4, sea: 1.4, law: 1.3 },
  imagery: [
    n('icelandic', 'lava-field', 'Lava Field', ['volcano', 'earth'], { forms: { plural: 'Lava Fields' } }),
    n('icelandic', 'ashplain', 'Ash Plain', ['volcano', 'wasteland'], { forms: { plural: 'Ash Plains' } }),
    n('icelandic', 'assembly', 'Assembly', ['law', 'community'], { forms: { plural: 'Assemblies' } }),
    n('icelandic', 'turf-house', 'Turf House', ['home', 'shelter'], { forms: { plural: 'Turf Houses' } }),
    n('icelandic', 'long-night', 'Long Night', ['night', 'winter'], { forms: { plural: 'Long Nights' } }),
    n('icelandic', 'geyser', 'Geyser', ['heat', 'earth'], { forms: { plural: 'Geysers' } }),
  ],
  symbolic: [],
  rhythm: { saga: 10, single: 1.4, pair: 1.2, epithet: 3 },
  denylist: ['odin', 'thor', 'loki', 'freya', 'frigg', 'baldr', 'tyr', 'heimdall', 'valhalla', 'asgard', 'yggdrasil', 'ragnarok', 'mjolnir', 'vinland', 'bjork'],
  review: { status: 'draft', notes: '' },
};
```

`germanic.ts`:
```ts
export const GERMANIC: MythPack = {
  id: 'germanic', label: 'Germanic', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Germanic', profile: 'germanic', coinedRate: 1,
  conceptBoosts: { forest: 2, iron: 1.6, hunt: 1.6, witch: 1.5, castle: 1.5, stone: 1.3, dragon: 1.3, wild: 1.3 },
  imagery: [
    n('germanic', 'oak', 'Oak', ['tree', 'forest', 'ancient'], { forms: { plural: 'Oaks' }, compound: 'head' }),
    n('germanic', 'march', 'March', ['frontier', 'realm'], { forms: { plural: 'Marches' } }),
    n('germanic', 'lindworm', 'Lindworm', ['dragon', 'serpent'], { forms: { plural: 'Lindworms' } }),
    n('germanic', 'mine', 'Mine', ['depth', 'iron'], { forms: { plural: 'Mines' } }),
    n('germanic', 'deepwood', 'Deepwood', ['forest', 'darkness'], { forms: { plural: 'Deepwoods' } }),
    n('germanic', 'wild-hunt', 'Wild Hunt', ['hunt', 'spirit', 'night'], { mass: true, cliche: 0.4 }),
  ],
  symbolic: [],
  rhythm: { pair: 1.3, 'of-phrase': 1.3, compound: 1.3, kenning: 3 },
  denylist: ['wotan', 'woden', 'donar', 'thunar', 'frija', 'tiw', 'ziu', 'nerthus', 'irminsul', 'reich', 'fuhrer', 'fatherland', 'vaterland', 'volk',
    'lebensraum', 'blut', 'ehre', 'thule', 'heimat', 'wehrwolf'],
  review: { status: 'draft', notes: '' },
};
```
`anglo-saxon.ts`:
```ts
export const ANGLO_SAXON: MythPack = {
  id: 'anglo-saxon', label: 'Anglo-Saxon', group: 'Norse & Germanic', tier: 'A', noteLabel: 'Anglo-Saxon', profile: 'old-english', coinedRate: 1,
  conceptBoosts: { fate: 1.8, oath: 1.6, gold: 1.5, grave: 1.4, swamp: 1.4, legend: 1.4, kin: 1.4, home: 1.3, war: 1.2 },
  imagery: [
    n('anglo-saxon', 'mead-hall', 'Mead-Hall', ['home', 'feast', 'kin'], { forms: { plural: 'Mead-Halls' } }),
    n('anglo-saxon', 'barrow', 'Barrow', ['grave', 'ancient'], { forms: { plural: 'Barrows' } }),
    n('anglo-saxon', 'fen', 'Fen', ['swamp', 'mist'], { forms: { plural: 'Fens' }, compound: 'head' }),
    n('anglo-saxon', 'hoard', 'Hoard', ['gold', 'dragon'], { forms: { plural: 'Hoards' } }),
    n('anglo-saxon', 'helm', 'Helm', ['war', 'guardian'], { forms: { plural: 'Helms' } }),
    n('anglo-saxon', 'thane', 'Thane', ['oath', 'kin'], { forms: { plural: 'Thanes' }, register: 'archaic' }),
    n('anglo-saxon', 'moot', 'Moot', ['law', 'community'], { forms: { plural: 'Moots' }, register: 'archaic' }),
  ],
  symbolic: [s('anglo-saxon', 'wyrd', 'Wyrd', ['fate', 'omen'], 'Old English wyrd, "fate"; in The Wanderer and Beowulf.', { register: 'archaic' })],
  rhythm: { kenning: 10, alliterative: 12, compound: 1.3 },
  denylist: ['woden', 'thunor', 'tiw', 'frige', 'eostre', 'beowulf', 'grendel', 'anglo saxon', 'odal', 'wolfsangel'],
  review: { status: 'draft', notes: '' },
};
```

`arthurian.ts`:
```ts
export const ARTHURIAN: MythPack = {
  id: 'arthurian', label: 'Arthurian', group: 'Celtic & Arthurian', tier: 'A', noteLabel: 'Arthurian', profile: 'old-english', coinedRate: 1,
  conceptBoosts: { knight: 2, oath: 1.8, lake: 1.6, relic: 1.6, castle: 1.5, wasteland: 1.4, island: 1.3, faith: 1.3, journey: 1.3 },
  imagery: [
    n('arthurian', 'grail', 'Grail', ['relic', 'faith', 'journey'], { forms: { plural: 'Grails' } }),
    n('arthurian', 'chapel', 'Chapel', ['faith', 'stone'], { forms: { plural: 'Chapels' } }),
    n('arthurian', 'court', 'Court', ['crown', 'community'], { forms: { plural: 'Courts' } }),
    n('arthurian', 'lake-maiden', 'Lake Maiden', ['lake', 'magic'], { forms: { plural: 'Lake Maidens' } }),
    n('arthurian', 'lay', 'Lay', ['song', 'legend'], { forms: { plural: 'Lays' }, register: 'archaic' }),
    n('arthurian', 'pennon', 'Pennon', ['banner', 'knight'], { forms: { plural: 'Pennons' } }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 1.5, duo: 1.4, epithet: 3, saga: 2 },
  denylist: ['excalibur', 'round table', 'holy grail', 'monty python', 'camelot'],
  review: { status: 'draft', notes: '' },
};
```
`greek.ts`:
```ts
export const GREEK: MythPack = {
  id: 'greek', label: 'Greek', group: 'Classical', tier: 'A', noteLabel: 'Greek', profile: 'hellenic', coinedRate: 1,
  conceptBoosts: { fate: 1.8, labyrinth: 1.8, prophecy: 1.6, hero: 1.5, legend: 1.4, sea: 1.4, aether: 1.4, song: 1.3, stone: 1.3 },
  imagery: [
    n('greek', 'laurel', 'Laurel', ['hero', 'bloom'], { forms: { plural: 'Laurels' } }),
    n('greek', 'oracle', 'Oracle', ['prophecy', 'fate'], { forms: { plural: 'Oracles' } }),
    n('greek', 'marble', 'Marble', ['stone', 'elegance'], { mass: true, compound: 'head' }),
    n('greek', 'olive', 'Olive', ['tree', 'harvest'], { forms: { plural: 'Olives' } }),
    n('greek', 'hymn', 'Hymn', ['song', 'faith'], { forms: { plural: 'Hymns' } }),
    n('greek', 'lyre', 'Lyre', ['song', 'elegance'], { forms: { plural: 'Lyres' } }),
    n('greek', 'ichor', 'Ichor', ['blood', 'gods'], { mass: true }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 1.5, epithet: 5, 'the-noun': 1.2 },
  denylist: ['zeus', 'hera', 'poseidon', 'hades', 'athena', 'apollo', 'artemis', 'ares', 'aphrodite', 'hermes', 'hephaestus', 'demeter', 'dionysus',
    'hestia', 'persephone', 'kronos', 'cronus', 'gaia', 'prometheus', 'olympus', 'kratos', 'eros', 'nike', 'titan quest'],
  review: { status: 'draft', notes: '' },
};
```

`roman.ts`:
```ts
export const ROMAN: MythPack = {
  id: 'roman', label: 'Roman', group: 'Classical', tier: 'A', noteLabel: 'Roman', profile: 'latin', coinedRate: 0.6,
  conceptBoosts: { legion: 2.2, empire: 2, war: 1.5, conquest: 1.4, order: 1.4, law: 1.4, banner: 1.4, city: 1.3, history: 1.2 },
  imagery: [
    n('roman', 'legion', 'Legion', ['legion', 'war'], { forms: { plural: 'Legions' } }),
    n('roman', 'eagle', 'Eagle', ['banner', 'bird', 'empire'], { forms: { plural: 'Eagles' } }),
    n('roman', 'forum', 'Forum', ['city', 'law'], { forms: { plural: 'Forums' } }),
    n('roman', 'aeternum', 'Aeternum', ['time', 'empire'], { register: 'lofty' }),
    n('roman', 'ignis', 'Ignis', ['fire'], { register: 'lofty' }),
    n('roman', 'umbra', 'Umbra', ['shadow', 'darkness'], { register: 'lofty' }),
    n('roman', 'lux-aeterna', 'Lux Aeterna', ['light', 'time'], { register: 'lofty' }),
  ],
  symbolic: [],
  rhythm: { single: 1.5, pair: 1.2, 'of-phrase': 1.2 },
  denylist: ['jupiter', 'juno', 'mars', 'venus', 'mercury', 'neptune', 'minerva', 'vulcan', 'ceres', 'diana', 'apollo', 'bacchus', 'pluto',
    'saturn', 'janus', 'vesta', 'duce', 'fasces', 'roman salute'],
  review: { status: 'draft', notes: 'Latin entries and two-word phrases are hand-checked; no machine-built Latin grammar.' },
};
```

`egyptian.ts`:
```ts
export const EGYPTIAN: MythPack = {
  id: 'egyptian', label: 'Egyptian', group: 'Ancient Near East & Egypt', tier: 'A', noteLabel: 'Egyptian', profile: 'ancient', coinedRate: 1,
  conceptBoosts: { desert: 2, sand: 2, tomb: 1.8, afterlife: 1.6, river: 1.5, sun: 1.5, ancient: 1.5, book: 1.3 },
  imagery: [
    n('egyptian', 'scarab', 'Scarab', ['sun', 'afterlife'], { forms: { plural: 'Scarabs' } }),
    n('egyptian', 'obelisk', 'Obelisk', ['stone', 'sun'], { forms: { plural: 'Obelisks' } }),
    n('egyptian', 'dune', 'Dune', ['desert', 'sand'], { forms: { plural: 'Dunes' } }),
    n('egyptian', 'reed', 'Reed', ['river', 'swamp'], { forms: { plural: 'Reeds' } }),
    n('egyptian', 'jackal', 'Jackal', ['afterlife', 'beast'], { forms: { plural: 'Jackals' } }),
    n('egyptian', 'papyrus', 'Papyrus', ['book', 'river'], { forms: { plural: 'Papyri' } }),
    n('egyptian', 'pharaoh', 'Pharaoh', ['throne', 'dynasty'], { forms: { plural: 'Pharaohs' }, cliche: 0.7 }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 2, frame: 1.5, 'the-noun': 1.2 },
  denylist: ['osiris', 'isis', 'horus', 'anubis', 'thoth', 'ptah', 'amun', 'amon', 'aten', 'bastet', 'sekhmet', 'hathor', 'maat', 'nephthys', 'sobek',
    'khnum', 'khonsu', 'apep', 'tutankhamun', 'cleopatra', 'ramses', 'curse of the pharaoh'],
  review: { status: 'draft', notes: '' },
};
```

`mesopotamian.ts`:
```ts
export const MESOPOTAMIAN: MythPack = {
  id: 'mesopotamian', label: 'Mesopotamian', group: 'Ancient Near East & Egypt', tier: 'A', noteLabel: 'Mesopotamian', profile: 'ancient', coinedRate: 1,
  conceptBoosts: { flood: 1.8, ancient: 1.6, star: 1.5, city: 1.4, history: 1.4, law: 1.3, earth: 1.2, stone: 1.2 },
  imagery: [
    n('mesopotamian', 'ziggurat', 'Ziggurat', ['tower', 'ancient'], { forms: { plural: 'Ziggurats' } }),
    n('mesopotamian', 'tablet', 'Clay Tablet', ['book', 'law', 'ancient'], { forms: { plural: 'Clay Tablets' } }),
    n('mesopotamian', 'city-wall', 'City Wall', ['city', 'siege'], { forms: { plural: 'City Walls' } }),
    n('mesopotamian', 'lion', 'Lion', ['beast', 'crown'], { forms: { plural: 'Lions' } }),
    n('mesopotamian', 'bull', 'Winged Bull', ['beast', 'guardian'], { forms: { plural: 'Winged Bulls' } }),
    n('mesopotamian', 'cuneiform', 'Cuneiform', ['book', 'ancient'], { mass: true }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 1.6, number: 2.5, saga: 1.5 },
  denylist: ['marduk', 'tiamat', 'ishtar', 'inanna', 'enlil', 'enki', 'anu', 'nanna', 'shamash', 'utu', 'ereshkigal', 'nergal', 'ninurta', 'ashur',
    'dumuzi', 'tammuz', 'gilgamesh', 'enkidu', 'pazuzu', 'lamassu'],
  review: { status: 'draft', notes: '' },
};
```

`gnostic.ts`:
```ts
export const GNOSTIC: MythPack = {
  id: 'gnostic', label: 'Gnostic / Esoteric', group: 'Religious & Esoteric', tier: 'A', noteLabel: 'Gnostic', profile: 'ancient', coinedRate: 1,
  conceptBoosts: { light: 1.8, veil: 1.8, esoteric: 1.8, mirror: 1.6, knowledge: 1.6, spirit: 1.4, darkness: 1.3, prism: 1.2 },
  imagery: [
    n('gnostic', 'aeon', 'Aeon', ['time', 'spirit'], { forms: { plural: 'Aeons' }, register: 'lofty' }),
    n('gnostic', 'archon', 'Archon', ['order', 'throne'], { forms: { plural: 'Archons' }, register: 'lofty' }),
    n('gnostic', 'demiurge', 'Demiurge', ['craft', 'gods'], { register: 'lofty' }),
    n('gnostic', 'spark', 'Spark', ['light', 'spirit'], { forms: { plural: 'Sparks' } }),
    n('gnostic', 'emanation', 'Emanation', ['light', 'spirit'], { forms: { plural: 'Emanations' } }),
    n('gnostic', 'fullness', 'Fullness', ['light', 'esoteric'], { mass: true }),
  ],
  symbolic: [],
  rhythm: { prepositional: 1.6, single: 1.3, 'the-noun': 1.3 },
  denylist: ['yaldabaoth', 'ialdabaoth', 'abraxas', 'barbelo', 'jesus', 'christ', 'sophia'],
  review: { status: 'draft', notes: '' },
};
```
`cosmic.ts`:
```ts
export const COSMIC: MythPack = {
  id: 'cosmic', label: 'Lovecraftian / Cosmic', group: 'Literary & Folklore', tier: 'A', noteLabel: 'cosmic', profile: 'cosmic', coinedRate: 1,
  conceptBoosts: { abyss: 2, deep: 2, star: 1.6, dream: 1.6, void: 1.6, sea: 1.5, dread: 1.5, tide: 1.4, ancient: 1.4, tower: 1.3 },
  imagery: [
    n('cosmic', 'sunken-city', 'Sunken City', ['deep', 'city', 'ruin'], { forms: { plural: 'Sunken Cities' } }),
    n('cosmic', 'lighthouse', 'Lighthouse', ['tower', 'sea', 'isolation'], { forms: { plural: 'Lighthouses' } }),
    a('cosmic', 'eldritch', 'Eldritch', ['dread', 'ancient'], { cliche: 0.5 }),
    n('cosmic', 'aeon', 'Aeon', ['time', 'cosmos'], { forms: { plural: 'Aeons' } }),
    n('cosmic', 'trench', 'Trench', ['deep', 'abyss'], { forms: { plural: 'Trenches' } }),
    a('cosmic', 'angled', 'Angled', ['shape', 'chaos']),
  ],
  symbolic: [],
  rhythm: { prepositional: 2, 'of-phrase': 1.4, coined: 1.2 },
  denylist: ['cthulhu', 'azathoth', 'nyarlathotep', 'yog-sothoth', 'shub-niggurath', 'dagon', 'hastur', "r'lyeh", 'rlyeh', 'innsmouth', 'arkham',
    'miskatonic', 'necronomicon', 'yuggoth', 'kadath', 'shoggoth', 'mi-go', 'lovecraft', 'deep ones'],
  review: { status: 'draft', notes: 'Mythos proper nouns stay out for originality; Lovecraft\'s racial themes are not reproduced.' },
};
```
`fairy-tale.ts`:
```ts
export const FAIRY_TALE: MythPack = {
  id: 'fairy-tale', label: 'Fairy Tale / Folklore', group: 'Literary & Folklore', tier: 'A', noteLabel: 'fairy-tale', profile: 'soft', coinedRate: 1,
  conceptBoosts: { forest: 1.8, cottage: 1.6, thorn: 1.5, wonder: 1.5, mirror: 1.4, witch: 1.4, wolf: 1.4, curse: 1.3, hope: 1.3, bird: 1.2 },
  imagery: [
    n('fairy-tale', 'spindle', 'Spindle', ['curse', 'craft'], { forms: { plural: 'Spindles' } }),
    n('fairy-tale', 'briar', 'Briar', ['thorn', 'forest'], { forms: { plural: 'Briars' }, compound: 'head' }),
    n('fairy-tale', 'wishing-well', 'Wishing Well', ['hope', 'secret'], { forms: { plural: 'Wishing Wells' } }),
    n('fairy-tale', 'apple', 'Apple', ['curse', 'food'], { forms: { plural: 'Apples' } }),
    n('fairy-tale', 'bramble', 'Bramble', ['thorn', 'forest'], { forms: { plural: 'Brambles' }, compound: 'head' }),
    n('fairy-tale', 'breadcrumb', 'Breadcrumb', ['path', 'food'], { forms: { plural: 'Breadcrumbs' } }),
    a('fairy-tale', 'little', 'Little', ['whimsy', 'home'], { register: 'whimsical' }),
  ],
  symbolic: [],
  rhythm: { duo: 1.6, 'the-noun': 1.3, possessive: 1.2 },
  denylist: ['snow white', 'cinderella', 'sleeping beauty', 'little mermaid', 'beauty and the beast', 'peter pan', 'pinocchio', 'tinker bell', 'aladdin', 'disney'],
  review: { status: 'draft', notes: '' },
};
```

`alchemical.ts`:
```ts
export const ALCHEMICAL: MythPack = {
  id: 'alchemical', label: 'Alchemical / Occult', group: 'Religious & Esoteric', tier: 'A', noteLabel: 'alchemical', profile: 'ancient', coinedRate: 1,
  conceptBoosts: { alchemy: 2.2, transformation: 1.8, occult: 1.6, esoteric: 1.5, gold: 1.5, salt: 1.4, fire: 1.4, book: 1.3 },
  imagery: [
    n('alchemical', 'crucible', 'Crucible', ['alchemy', 'fire'], { forms: { plural: 'Crucibles' } }),
    n('alchemical', 'quicksilver', 'Quicksilver', ['alchemy', 'transformation'], { mass: true }),
    n('alchemical', 'sulfur', 'Sulfur', ['alchemy', 'fire'], { mass: true }),
    n('alchemical', 'sigil', 'Sigil', ['occult', 'rune'], { forms: { plural: 'Sigils' } }),
    n('alchemical', 'retort', 'Retort', ['alchemy', 'glass'], { forms: { plural: 'Retorts' } }),
    n('alchemical', 'ouroboros', 'Ouroboros', ['cycle', 'serpent'], { forms: { plural: 'Ouroboroi' } }),
    n('alchemical', 'nigredo', 'Nigredo', ['transformation', 'darkness'], { register: 'lofty' }),
    n('alchemical', 'opus', 'Opus', ['craft', 'alchemy'], { forms: { plural: 'Opera' } }),
  ],
  symbolic: [],
  rhythm: { pair: 1.4, 'of-phrase': 1.3, 'the-noun': 1.2, single: 1.3 },
  denylist: ["philosopher's stone", 'philosophers stone', 'fullmetal', 'hermes trismegistus', 'baphomet'],
  review: { status: 'draft', notes: '' },
};
```
`packages/data/src/myths/index.ts`:
```ts
import { ALCHEMICAL } from './alchemical';
import { ANGLO_SAXON } from './anglo-saxon';
import { ARTHURIAN } from './arthurian';
import { COSMIC } from './cosmic';
import { EGYPTIAN } from './egyptian';
import { FAIRY_TALE } from './fairy-tale';
import { GERMANIC } from './germanic';
import { GNOSTIC } from './gnostic';
import { GREEK } from './greek';
import { ICELANDIC } from './icelandic';
import { MESOPOTAMIAN } from './mesopotamian';
import { NONE } from './none';
import { NORSE } from './norse';
import { ORIGINAL } from './original';
import { ROMAN } from './roman';
import type { MythPack } from '../types';

/** MYTH_IDS order. Tier B packs are inserted in Task 24. */
export const MYTHS: readonly MythPack[] = [
  NONE, ORIGINAL, NORSE, ICELANDIC, GERMANIC, ANGLO_SAXON, ARTHURIAN, GREEK, ROMAN, EGYPTIAN, MESOPOTAMIAN,
  GNOSTIC, ALCHEMICAL, COSMIC, FAIRY_TALE,
];
```
(`MYTH_IDS` lists gnostic before alchemical before cosmic before fairy-tale; the test checks the order.)

- [ ] **Step 5: Generate, read and review each pack**

Run: `npm test && npx tsx scripts/quality.ts`
Then for each Tier A pack run 200 titles across three genres and read them:
```bash
npx tsx -e "import('@vps-name-tools/game-titles').then(g=>{for(const genre of ['fantasy','survival','strategy'])for(let i=0;i<4;i++)console.log(g.generate({genre,myth:process.argv[1],count:20},{seed:genre+i}).titles.map(t=>t.title).join(' | '))})" norse
```
Look for deity names, clumsy Latin, coded imagery, mockery, and cliché floods. Fix data, re-run. When a pack reads well, set `review: { status: 'reviewed', reviewer: '<your name or "implementer">', date: '<YYYY-MM-DD>', notes: '<what was checked>' }` and add a `docs/VALIDATION.md` row per pack.

- [ ] **Step 6: Run to verify pass and commit**

Run: `npx tsx --test packages/data/test/packs.test.ts && npm run validate:data && npm test`
Expected: PASS (Tier B assertions skip packs that do not exist yet).

```bash
git add -A
git commit -m "Add Original and the Tier A cultural packs"
```

---

### Task 24: Tier B cultural packs and the pack status report

**Files:**
- Create: `packages/data/src/myths/celtic.ts`, `persian.ts`, `arabian.ts`, `slavic.ts`, `finnish.ts`, `japanese.ts`, `chinese.ts`, `korean.ts`, `indian.ts`, `mesoamerican.ts`, `aztec.ts`, `maya.ts`, `andean.ts`, `polynesian.ts`, `african.ts`, `biblical.ts`
- Modify: `packages/data/src/myths/index.ts`
- Create: `scripts/pack-status.ts`, `docs/content/CULTURAL-PACK-STATUS.md` (generated); root script `"pack-status": "tsx scripts/pack-status.ts"`
- Test: `packages/data/test/packs.test.ts` (from Task 23, now fully exercised), `packages/game-titles/test/cultural-output.test.ts`

**Interfaces:**
- Consumes: Task 23 helpers; `generate` (Task 16).
- Produces: all 30 packs; `CULTURAL-PACK-STATUS.md`.

Tier B rules (spec §5.1): imagery-led; no deity or sacred names; symbolic vocabulary limited to widely used, non-sacred folkloric terms (0–8, each with a source note); invented words rare (`coinedRate` ≤ 0.5) using Neutral or a restrained profile; labels say "-inspired"; no stereotypes, Orientalist or colonial framing, or mockery. If a pack cannot be completed responsibly, set `review.status: 'held'` with the reason in `notes`; only that pack is withheld from the selector and the release report names it (Revision 2, decision 1).

- [ ] **Step 1: Write the failing output test**

`packages/game-titles/test/cultural-output.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '@vps-name-tools/core';
import { DATA, MYTH_IDS, containsTerm } from '@vps-name-tools/data';
import { generate, flattenParts } from '../src/index';

test('every non-held cultural option generates and never emits its denylist', () => {
  for (const id of MYTH_IDS) {
    const pack = DATA.myths.find(m => m.id === id);
    assert.ok(pack, `pack ${id} missing`);
    if (pack.review.status === 'held') continue;
    for (const genre of ['fantasy', 'survival', 'cozy', 'sci-fi'] as const) {
      const r = generate({ genre, myth: id, count: 20 }, { seed: `${id}:${genre}` });
      assert.ok(r.titles.length >= 15, `${id}/${genre}: ${r.titles.length}`);
      for (const t of r.titles) {
        const engineText = normalize(flattenParts(t.recipe.parts).filter(p => p.kind !== 'user' && p.kind !== 'include').map(p => p.text).join(' '));
        for (const d of pack.denylist) assert.ok(!containsTerm(engineText, d), `${id}: "${t.title}" ~ ${d}`);
      }
    }
  }
});

test('Tier B notes say -inspired', () => {
  for (const pack of DATA.myths.filter(m => m.tier === 'B' && m.review.status !== 'held')) {
    const r = generate({ myth: pack.id }, { seed: `note:${pack.id}` });
    assert.ok(r.titles.some(t => t.meta.note.includes('inspired')), pack.id);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/game-titles/test/cultural-output.test.ts`
Expected: FAIL (`pack celtic missing`).

- [ ] **Step 3: Write the 16 Tier B packs**

Same file shape as Task 23. Imagery seeds come from spec §5.2; extend each to 40–80 entries of everyday nouns and adjectives (the Mesoamerican pack is a blend and may stay short).

`celtic.ts`:
```ts
export const CELTIC: MythPack = {
  id: 'celtic', label: 'Celtic-inspired', group: 'Celtic & Arthurian', tier: 'B', noteLabel: 'Celtic-inspired', profile: 'celtic', coinedRate: 0.4,
  conceptBoosts: { mist: 2, stone: 1.6, song: 1.5, sea: 1.4, forest: 1.4, spirit: 1.4, tide: 1.3, lake: 1.3 },
  imagery: [
    n('celtic', 'cairn', 'Cairn', ['stone', 'grave', 'path'], { forms: { plural: 'Cairns' } }),
    n('celtic', 'barrow', 'Barrow', ['grave', 'ancient'], { forms: { plural: 'Barrows' } }),
    n('celtic', 'hound', 'Hound', ['wolf', 'hunt', 'guardian'], { forms: { plural: 'Hounds' } }),
    n('celtic', 'cauldron', 'Cauldron', ['magic', 'food'], { forms: { plural: 'Cauldrons' } }),
    n('celtic', 'torc', 'Torc', ['gold', 'crown'], { forms: { plural: 'Torcs' } }),
    n('celtic', 'bard', 'Bard', ['song', 'legend'], { forms: { plural: 'Bards' } }),
    n('celtic', 'standing-stone', 'Standing Stone', ['stone', 'ancient'], { forms: { plural: 'Standing Stones' } }),
  ],
  symbolic: [],
  rhythm: { triad: 12, alliterative: 3, 'of-phrase': 1.2 },
  denylist: ['dagda', 'lugh', 'morrigan', 'brigid', 'danu', 'cernunnos', 'epona', 'nuada', 'manannan', 'ogma', 'belenus', 'taranis', 'arawn',
    'rhiannon', 'ceridwen', 'aengus', 'macha', 'badb', 'samhain', 'beltane', 'imbolc', 'lughnasadh', 'tuatha'],
  review: { status: 'draft', notes: '' },
};
```

`persian.ts`:
```ts
export const PERSIAN: MythPack = {
  id: 'persian', label: 'Persian-inspired', group: 'Ancient Near East & Egypt', tier: 'B', noteLabel: 'Persian-inspired', profile: 'neutral', coinedRate: 0.25,
  conceptBoosts: { garden: 2, bloom: 1.6, mirror: 1.6, song: 1.5, love: 1.4, light: 1.3, wisdom: 1.3 },
  imagery: [
    n('persian', 'rose', 'Rose', ['bloom', 'love'], { forms: { plural: 'Roses' } }),
    n('persian', 'nightingale', 'Nightingale', ['bird', 'song', 'night'], { forms: { plural: 'Nightingales' } }),
    n('persian', 'cypress', 'Cypress', ['tree', 'garden'], { forms: { plural: 'Cypresses' } }),
    n('persian', 'pomegranate', 'Pomegranate', ['food', 'garden'], { forms: { plural: 'Pomegranates' } }),
    n('persian', 'citadel', 'Citadel', ['castle', 'city'], { forms: { plural: 'Citadels' } }),
    n('persian', 'poet', 'Poet', ['song', 'love'], { forms: { plural: 'Poets' } }),
  ],
  symbolic: [],
  rhythm: { prepositional: 1.5, duo: 1.6, couplet: 3 },
  denylist: ['ahura mazda', 'mazda', 'ahriman', 'angra mainyu', 'mithra', 'anahita', 'zarathustra', 'zoroaster', 'avesta', 'amesha spenta', 'fravashi',
    'haoma', 'yazata', 'allah', 'muhammad', 'quran', 'koran', 'mecca', 'kaaba', 'jihad', 'mosque', 'imam', 'harem', 'prince of persia'],
  review: { status: 'draft', notes: '' },
};
```

`arabian.ts`:
```ts
export const ARABIAN: MythPack = {
  id: 'arabian', label: 'Arabian-inspired', group: 'Ancient Near East & Egypt', tier: 'B', noteLabel: 'Arabian-inspired', profile: 'neutral', coinedRate: 0.25,
  conceptBoosts: { desert: 2, star: 1.6, sand: 1.6, trade: 1.5, voyage: 1.4, heat: 1.4, wonder: 1.4, secret: 1.3 },
  imagery: [
    n('arabian', 'oasis', 'Oasis', ['desert', 'hope'], { forms: { plural: 'Oases' } }),
    n('arabian', 'caravan', 'Caravan', ['trade', 'journey'], { forms: { plural: 'Caravans' } }),
    n('arabian', 'star-chart', 'Star Chart', ['star', 'map'], { forms: { plural: 'Star Charts' } }),
    n('arabian', 'brass-lamp', 'Brass Lamp', ['light', 'secret'], { forms: { plural: 'Brass Lamps' } }),
    n('arabian', 'sandstorm', 'Sandstorm', ['sand', 'storm'], { forms: { plural: 'Sandstorms' } }),
    n('arabian', 'astrolabe', 'Astrolabe', ['star', 'knowledge'], { forms: { plural: 'Astrolabes' } }),
    n('arabian', 'mirage', 'Mirage', ['desert', 'dream'], { forms: { plural: 'Mirages' } }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 1.5, number: 1.5, 'the-noun': 1.3 },
  denylist: ['allah', 'muhammad', 'quran', 'koran', 'mecca', 'medina', 'kaaba', 'jihad', 'mosque', 'imam', 'ramadan', 'hajj', 'jinn', 'djinn', 'genie',
    'aladdin', 'agrabah', 'harem', 'belly dance', 'magic carpet', 'flying carpet', 'arabian nights'],
  review: { status: 'draft', notes: '' },
};
```

`slavic.ts`:
```ts
export const SLAVIC: MythPack = {
  id: 'slavic', label: 'Slavic-inspired', group: 'Slavic & Finnic', tier: 'B', noteLabel: 'Slavic-inspired', profile: 'slavic', coinedRate: 0.5,
  conceptBoosts: { crossroads: 1.8, forest: 1.6, winter: 1.6, swamp: 1.4, witch: 1.4, wolf: 1.4, tree: 1.4, fire: 1.3 },
  imagery: [
    n('slavic', 'birch', 'Birch', ['tree', 'forest', 'cold'], { forms: { plural: 'Birches' }, compound: 'head' }),
    n('slavic', 'steppe', 'Steppe', ['wild', 'frontier'], { forms: { plural: 'Steppes' } }),
    n('slavic', 'linden', 'Linden', ['tree', 'home'], { forms: { plural: 'Lindens' } }),
    n('slavic', 'firebird', 'Firebird', ['bird', 'fire', 'legend'], { forms: { plural: 'Firebirds' } }),
    n('slavic', 'hut', 'Hut', ['home', 'forest'], { forms: { plural: 'Huts' } }),
    n('slavic', 'kettle', 'Kettle', ['home', 'warmth'], { forms: { plural: 'Kettles' } }),
  ],
  symbolic: [
    s('slavic', 'domovoi', 'Domovoi', ['home', 'spirit'], 'East Slavic household spirit of folk tales; folkloric, not a deity; use rarely.', { forms: { plural: 'Domovoi' } }),
    s('slavic', 'rusalka', 'Rusalka', ['lake', 'spirit'], 'Water spirit of Slavic folklore and Dvorak\'s opera; folkloric, not a deity.', { forms: { plural: 'Rusalki' } }),
  ],
  rhythm: { pair: 1.4, duo: 1.3, place: 1.3 },
  denylist: ['perun', 'veles', 'mokosh', 'svarog', 'dazhbog', 'stribog', 'jarilo', 'yarilo', 'morana', 'marzanna', 'lada', 'chernobog', 'belobog',
    'triglav', 'svetovid', 'zhiva', 'baba yaga'],
  review: { status: 'draft', notes: '' },
};
```
`finnish.ts`:
```ts
export const FINNISH: MythPack = {
  id: 'finnish', label: 'Finnish-inspired', group: 'Slavic & Finnic', tier: 'B', noteLabel: 'Finnish-inspired', profile: 'finnic', coinedRate: 0.5,
  conceptBoosts: { lake: 2, aurora: 1.8, forest: 1.6, cold: 1.6, song: 1.6, forge: 1.5, winter: 1.4, beast: 1.2 },
  imagery: [
    n('finnish', 'spruce', 'Spruce', ['tree', 'forest', 'cold'], { forms: { plural: 'Spruces' } }),
    n('finnish', 'bear', 'Bear', ['beast', 'forest'], { forms: { plural: 'Bears' } }),
    n('finnish', 'fox-fire', 'Fox-Fire', ['aurora', 'fox', 'light']),
    n('finnish', 'kantele', 'Kantele', ['song', 'craft'], { forms: { plural: 'Kanteles' } }),
    n('finnish', 'sauna', 'Sauna', ['warmth', 'home'], { forms: { plural: 'Saunas' } }),
    n('finnish', 'ice-lake', 'Ice Lake', ['lake', 'ice'], { forms: { plural: 'Ice Lakes' } }),
  ],
  symbolic: [],
  rhythm: { alliterative: 10, couplet: 4, pair: 1.2 },
  denylist: ['ukko', 'akka', 'ilmatar', 'tapio', 'mielikki', 'ahti', 'tuoni', 'kalma', 'vainamoinen', 'ilmarinen', 'lemminkainen', 'louhi', 'sampo',
    'kalevala', 'pohjola', 'tuonela', 'noaidi', 'sieidi', 'joik', 'yoik'],
  review: { status: 'draft', notes: '' },
};
```

`japanese.ts`:
```ts
export const JAPANESE: MythPack = {
  id: 'japanese', label: 'Japanese-inspired', group: 'East Asian', tier: 'B', noteLabel: 'Japanese-inspired', profile: 'japanese', coinedRate: 0.2,
  conceptBoosts: { season: 1.8, bloom: 1.6, ink: 1.6, mountain: 1.5, moon: 1.5, tide: 1.4, fox: 1.4, silence: 1.3, rain: 1.3 },
  imagery: [
    n('japanese', 'paper-lantern', 'Paper Lantern', ['light', 'home'], { forms: { plural: 'Paper Lanterns' } }),
    n('japanese', 'blossom', 'Blossom', ['bloom', 'spring'], { forms: { plural: 'Blossoms' } }),
    n('japanese', 'crane', 'Crane', ['bird', 'hope'], { forms: { plural: 'Cranes' } }),
    n('japanese', 'mountain-pass', 'Mountain Pass', ['mountain', 'path'], { forms: { plural: 'Mountain Passes' } }),
    a('japanese', 'late', 'Late', ['season', 'time']),
    n('japanese', 'brushstroke', 'Brushstroke', ['ink', 'craft'], { forms: { plural: 'Brushstrokes' } }),
  ],
  symbolic: [],
  rhythm: { pair: 1.6, 'adj-noun': 1.4, single: 1.2, couplet: 2 },
  denylist: ['amaterasu', 'susanoo', 'tsukuyomi', 'izanagi', 'izanami', 'inari', 'hachiman', 'raijin', 'fujin', 'kami', 'ebisu', 'benzaiten',
    'bishamon', 'shinto', 'torii', 'kamikaze', 'banzai', 'harakiri', 'seppuku', 'rising sun', 'ninja', 'samurai', 'geisha', 'okami'],
  review: { status: 'draft', notes: 'Invented words are rare and labelled; spellings use the mora-based profile.' },
};
```
`chinese.ts`:
```ts
export const CHINESE: MythPack = {
  id: 'chinese', label: 'Chinese-inspired', group: 'East Asian', tier: 'B', noteLabel: 'Chinese-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { mountain: 1.8, river: 1.6, wisdom: 1.5, ink: 1.5, gem: 1.4, dragon: 1.4, bird: 1.3, dynasty: 1.3, beast: 1.3 },
  imagery: [
    n('chinese', 'jade', 'Jade', ['gem', 'stone'], { mass: true, compound: 'head' }),
    n('chinese', 'scroll', 'Scroll', ['book', 'ink'], { forms: { plural: 'Scrolls' } }),
    n('chinese', 'bamboo', 'Bamboo', ['tree', 'forest'], { mass: true }),
    n('chinese', 'phoenix', 'Phoenix', ['bird', 'fire', 'legend'], { forms: { plural: 'Phoenixes' } }),
    n('chinese', 'tiger', 'Tiger', ['beast', 'mountain'], { forms: { plural: 'Tigers' } }),
    n('chinese', 'crane', 'Crane', ['bird', 'wisdom'], { forms: { plural: 'Cranes' } }),
  ],
  symbolic: [],
  rhythm: { couplet: 12, pair: 1.4 },
  denylist: ['jade emperor', 'guanyin', 'guan yu', 'nezha', 'ne zha', 'monkey king', 'wukong', 'pangu', 'nuwa', 'fuxi', 'shennong', 'xi wangmu',
    'mazu', 'caishen', 'zhong kui', 'erlang', 'buddha', 'bodhisattva', 'confucius', 'ching chong', 'chinaman', 'oriental', 'yellow peril', 'fu manchu'],
  review: { status: 'draft', notes: 'No pseudo-Mandarin invented words: Neutral profile at a very low rate.' },
};
```

`korean.ts`:
```ts
export const KOREAN: MythPack = {
  id: 'korean', label: 'Korean-inspired', group: 'East Asian', tier: 'B', noteLabel: 'Korean-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { mountain: 1.6, bird: 1.4, tree: 1.4, tide: 1.4, moon: 1.4, fox: 1.3, ink: 1.3, beast: 1.2 },
  imagery: [
    n('korean', 'magpie', 'Magpie', ['bird', 'omen', 'joy'], { forms: { plural: 'Magpies' } }),
    n('korean', 'pine', 'Pine', ['tree', 'mountain'], { forms: { plural: 'Pines' } }),
    n('korean', 'tiger', 'Tiger', ['beast', 'mountain'], { forms: { plural: 'Tigers' } }),
    n('korean', 'persimmon', 'Persimmon', ['food', 'autumn'], { forms: { plural: 'Persimmons' } }),
    n('korean', 'tideflat', 'Tideflat', ['tide', 'sea'], { forms: { plural: 'Tideflats' } }),
    n('korean', 'moon-jar', 'Moon Jar', ['moon', 'craft'], { forms: { plural: 'Moon Jars' } }),
  ],
  symbolic: [],
  rhythm: { pair: 1.5, 'adj-noun': 1.3, couplet: 2 },
  denylist: ['hwanin', 'hwanung', 'dangun', 'sansin', 'mudang', 'samsin', 'jowangsin', 'cheonjiwang', 'gumiho', 'gook'],
  review: { status: 'draft', notes: 'No pseudo-Korean invented words: Neutral profile at a very low rate.' },
};
```

`indian.ts`:
```ts
export const INDIAN: MythPack = {
  id: 'indian', label: 'Indian mythology-inspired', group: 'South Asian', tier: 'B', noteLabel: 'Indian mythology-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { cycle: 1.8, river: 1.8, rain: 1.6, age: 1.6, bloom: 1.5, serpent: 1.4, sun: 1.3, wisdom: 1.3 },
  imagery: [
    n('indian', 'lotus', 'Lotus', ['bloom', 'lake'], { forms: { plural: 'Lotuses' } }),
    n('indian', 'monsoon', 'Monsoon', ['rain', 'storm', 'season'], { forms: { plural: 'Monsoons' } }),
    n('indian', 'peacock', 'Peacock', ['bird', 'elegance'], { forms: { plural: 'Peacocks' } }),
    n('indian', 'chariot', 'Chariot', ['war', 'journey'], { forms: { plural: 'Chariots' } }),
    n('indian', 'conch', 'Conch', ['sea', 'song'], { forms: { plural: 'Conches' } }),
    n('indian', 'banyan', 'Banyan', ['tree', 'ancient'], { forms: { plural: 'Banyans' } }),
    n('indian', 'elephant', 'Elephant', ['beast', 'wisdom'], { forms: { plural: 'Elephants' } }),
  ],
  symbolic: [],
  rhythm: { 'of-phrase': 1.4, frame: 1.5, 'the-noun': 1.2 },
  denylist: ['brahma', 'vishnu', 'shiva', 'krishna', 'rama', 'ganesha', 'ganesh', 'hanuman', 'lakshmi', 'saraswati', 'parvati', 'durga', 'kali',
    'indra', 'agni', 'surya', 'varuna', 'vayu', 'yama', 'kama', 'skanda', 'kartikeya', 'murugan', 'garuda', 'nandi', 'devi', 'deva', 'om', 'aum',
    'karma', 'dharma', 'moksha', 'nirvana', 'samsara', 'avatar', 'mandala', 'chakra', 'yoga', 'veda', 'vedas', 'upanishad', 'gita', 'mahabharata',
    'ramayana', 'ganga', 'ganges', 'buddha', 'bodhisattva', 'mahavira', 'waheguru', 'khalsa', 'swastika', 'exotic', 'snake charmer', 'thuggee'],
  review: { status: 'draft', notes: 'Highest care: imagery only, no deity names, sacred syllables or "exotic" framing.' },
};
```

`aztec.ts`:
```ts
export const AZTEC: MythPack = {
  id: 'aztec', label: 'Aztec-inspired', group: 'Americas', tier: 'B', noteLabel: 'Aztec-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { sun: 1.8, beast: 1.5, gem: 1.4, lake: 1.4, city: 1.4, bird: 1.4, bloom: 1.3, war: 1.2 },
  imagery: [
    n('aztec', 'obsidian', 'Obsidian', ['gem', 'stone', 'blade'], { mass: true, compound: 'head' }),
    n('aztec', 'eagle', 'Eagle', ['bird', 'sun'], { forms: { plural: 'Eagles' } }),
    n('aztec', 'jaguar', 'Jaguar', ['beast', 'night'], { forms: { plural: 'Jaguars' } }),
    n('aztec', 'lake-city', 'Lake City', ['lake', 'city'], { forms: { plural: 'Lake Cities' } }),
    n('aztec', 'causeway', 'Causeway', ['path', 'lake'], { forms: { plural: 'Causeways' } }),
    n('aztec', 'marigold', 'Marigold', ['bloom', 'memory'], { forms: { plural: 'Marigolds' } }),
  ],
  symbolic: [],
  rhythm: { number: 2.5, 'of-phrase': 1.3, pair: 1.2 },
  denylist: ['quetzalcoatl', 'huitzilopochtli', 'tezcatlipoca', 'tlaloc', 'xipe totec', 'mictlantecuhtli', 'coatlicue', 'chalchiuhtlicue',
    'xochiquetzal', 'tonatiuh', 'mixcoatl', 'xolotl', 'ometeotl', 'mictlan', 'tenochtitlan', 'aztlan', 'human sacrifice', 'blood sacrifice', 'savage'],
  review: { status: 'draft', notes: 'Sacrifice is not a default trope; no pseudo-Nahuatl.' },
};
```

`maya.ts`:
```ts
export const MAYA: MythPack = {
  id: 'maya', label: 'Maya-inspired', group: 'Americas', tier: 'B', noteLabel: 'Maya-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { jungle: 1.8, cycle: 1.8, star: 1.6, time: 1.5, cave: 1.5, book: 1.4, gem: 1.3 },
  imagery: [
    n('maya', 'cenote', 'Cenote', ['cave', 'lake', 'deep'], { forms: { plural: 'Cenotes' } }),
    n('maya', 'stela', 'Stela', ['stone', 'history'], { forms: { plural: 'Stelae' } }),
    n('maya', 'star-path', 'Star Path', ['star', 'path'], { forms: { plural: 'Star Paths' } }),
    n('maya', 'codex', 'Codex', ['book', 'knowledge'], { forms: { plural: 'Codices' } }),
    n('maya', 'maize', 'Maize', ['harvest', 'food'], { mass: true }),
    n('maya', 'bat', 'Bat', ['night', 'cave'], { forms: { plural: 'Bats' } }),
  ],
  symbolic: [],
  rhythm: { number: 2.5, 'of-phrase': 1.3, prepositional: 1.2 },
  denylist: ['kukulkan', 'itzamna', 'chaac', 'chac', 'ixchel', 'hunab ku', 'hunahpu', 'xbalanque', 'ah puch', 'kinich ahau', 'camazotz', 'xibalba',
    'popol vuh', 'mayan apocalypse', 'human sacrifice', 'blood sacrifice', 'savage'],
  review: { status: 'draft', notes: 'No pseudo-Mayan invented words.' },
};
```

`mesoamerican.ts` (a blend; spec §5.2):
```ts
export const MESOAMERICAN: MythPack = {
  id: 'mesoamerican', label: 'Mesoamerican-inspired', group: 'Americas', tier: 'B', noteLabel: 'Mesoamerican-inspired', profile: 'neutral', coinedRate: 0.15,
  blend: [{ id: 'aztec', weight: 1 }, { id: 'maya', weight: 1 }],
  conceptBoosts: { eclipse: 1.8, sun: 1.6, gem: 1.6, jungle: 1.6, serpent: 1.6, stone: 1.4, star: 1.4, cycle: 1.5 },
  imagery: [
    n('mesoamerican', 'feathered-serpent', 'Feathered Serpent', ['serpent', 'bird', 'sky'], { forms: { plural: 'Feathered Serpents' } }),
    n('mesoamerican', 'eclipse', 'Eclipse', ['eclipse', 'sun', 'omen'], { forms: { plural: 'Eclipses' } }),
  ],
  symbolic: [],
  rhythm: { number: 3, 'of-phrase': 1.3 },
  denylist: ['quetzalcoatl', 'kukulkan', 'tezcatlipoca', 'xibalba', 'human sacrifice', 'blood sacrifice', 'savage'],
  review: { status: 'draft', notes: 'Blend of the Aztec- and Maya-inspired packs; their denylists apply too.' },
};
```

`andean.ts`:
```ts
export const ANDEAN: MythPack = {
  id: 'andean', label: 'Andean-inspired', group: 'Americas', tier: 'B', noteLabel: 'Andean-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { mountain: 2, sun: 1.8, knot: 1.6, bird: 1.4, gold: 1.4, path: 1.4, sky: 1.3, mist: 1.3 },
  imagery: [
    n('andean', 'condor', 'Condor', ['bird', 'mountain', 'sky'], { forms: { plural: 'Condors' } }),
    n('andean', 'terrace', 'Terrace', ['mountain', 'harvest'], { forms: { plural: 'Terraces' } }),
    n('andean', 'knotted-cord', 'Knotted Cord', ['knot', 'knowledge'], { forms: { plural: 'Knotted Cords' } }),
    n('andean', 'highland-road', 'Highland Road', ['path', 'mountain'], { forms: { plural: 'Highland Roads' } }),
    n('andean', 'cloud-forest', 'Cloud Forest', ['forest', 'mist'], { forms: { plural: 'Cloud Forests' } }),
    n('andean', 'llama', 'Llama', ['beast', 'journey'], { forms: { plural: 'Llamas' } }),
  ],
  symbolic: [],
  rhythm: { pair: 1.4, 'of-phrase': 1.3 },
  denylist: ['inti', 'viracocha', 'pachamama', 'mama quilla', 'illapa', 'supay', 'pachacamac', 'apu', 'huaca', 'mama cocha', 'inca', 'incan',
    'quechua', 'aymara', 'el dorado'],
  review: { status: 'draft', notes: '' },
};
```

`polynesian.ts`:
```ts
export const POLYNESIAN: MythPack = {
  id: 'polynesian', label: 'Polynesian-inspired', group: 'Oceania', tier: 'B', noteLabel: 'Polynesian-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { sea: 2, voyage: 2, star: 1.8, island: 1.8, tide: 1.6, reef: 1.6, wind: 1.5, map: 1.3 },
  imagery: [
    n('polynesian', 'voyaging-canoe', 'Voyaging Canoe', ['ship', 'voyage'], { forms: { plural: 'Voyaging Canoes' } }),
    n('polynesian', 'star-path', 'Star Path', ['star', 'path', 'voyage'], { forms: { plural: 'Star Paths' } }),
    n('polynesian', 'reef', 'Reef', ['reef', 'sea'], { forms: { plural: 'Reefs' } }),
    n('polynesian', 'trade-wind', 'Trade Wind', ['wind', 'voyage'], { forms: { plural: 'Trade Winds' } }),
    n('polynesian', 'wayfinder', 'Wayfinder', ['map', 'voyage', 'star'], { forms: { plural: 'Wayfinders' } }),
    n('polynesian', 'lagoon', 'Lagoon', ['sea', 'island'], { forms: { plural: 'Lagoons' } }),
  ],
  symbolic: [],
  rhythm: { prepositional: 1.4, pair: 1.3, place: 1.3 },
  denylist: ['tangaroa', 'tane', 'rongo', 'maui', 'pele', 'hina', 'ranginui', 'papatuanuku', 'kane', 'kanaloa', 'lono', 'haumia', 'tawhirimatea',
    'whiro', 'moana', 'tiki', 'mana', 'tapu', 'kapu', 'haka', 'aloha', 'hula', 'luau', 'marae', 'hawaiki'],
  review: { status: 'draft', notes: '' },
};
```

`african.ts`:
```ts
export const AFRICAN: MythPack = {
  id: 'african', label: 'African folklore-inspired (pan-African)', group: 'Africa', tier: 'B', noteLabel: 'pan-African folklore-inspired', profile: 'neutral', coinedRate: 0.15,
  conceptBoosts: { trickster: 1.8, legend: 1.6, tree: 1.4, river: 1.4, song: 1.4, iron: 1.4, gold: 1.3, wind: 1.3, wild: 1.3 },
  imagery: [
    n('african', 'baobab', 'Baobab', ['tree', 'ancient'], { forms: { plural: 'Baobabs' } }),
    n('african', 'savanna', 'Savanna', ['wild', 'sun'], { forms: { plural: 'Savannas' } }),
    n('african', 'drum', 'Drum', ['song', 'community'], { forms: { plural: 'Drums' } }),
    n('african', 'spider', 'Spider', ['trickster', 'secret'], { forms: { plural: 'Spiders' } }),
    n('african', 'storyteller', 'Storyteller', ['legend', 'song'], { forms: { plural: 'Storytellers' } }),
    n('african', 'harmattan', 'Harmattan', ['wind', 'dust', 'season']),
  ],
  symbolic: [],
  rhythm: { frame: 2, 'of-phrase': 1.3, duo: 1.3 },
  denylist: ['anansi', 'ananse', 'nyame', 'olodumare', 'olorun', 'obatala', 'ogun', 'shango', 'sango', 'oshun', 'osun', 'yemoja', 'yemaya', 'eshu',
    'esu', 'elegba', 'orunmila', 'oya', 'orisha', 'orisa', 'ifa', 'vodun', 'voodoo', 'juju', 'mami wata', 'nzambi', 'mulungu', 'unkulunkulu', 'ngai',
    'mwari', 'leza', 'amma', 'nommo', 'dark continent', 'savage', 'tribal', 'witch doctor', 'mumbo jumbo', 'wakanda', 'zulu', 'maasai', 'yoruba', 'akan'],
  review: { status: 'draft', notes: 'Pan-African label until named traditions can be split out with consultation.' },
};
```

`biblical.ts`:
```ts
export const BIBLICAL: MythPack = {
  id: 'biblical', label: 'Biblical / Apocryphal-inspired', group: 'Religious & Esoteric', tier: 'B', noteLabel: 'Biblical-inspired', profile: 'neutral', coinedRate: 0.2,
  conceptBoosts: { exile: 1.8, faith: 1.6, prophecy: 1.6, flood: 1.6, salt: 1.5, garden: 1.4, desert: 1.4, book: 1.4, relic: 1.3 },
  imagery: [
    n('biblical', 'covenant', 'Covenant', ['oath', 'faith'], { forms: { plural: 'Covenants' }, register: 'lofty' }),
    n('biblical', 'wilderness', 'Wilderness', ['desert', 'exile'], { forms: { plural: 'Wildernesses' } }),
    n('biblical', 'seraph', 'Seraph', ['fire', 'spirit'], { forms: { plural: 'Seraphim' } }),
    n('biblical', 'psalm', 'Psalm', ['song', 'faith'], { forms: { plural: 'Psalms' } }),
    n('biblical', 'pillar-of-salt', 'Pillar of Salt', ['salt', 'ruin'], { forms: { plural: 'Pillars of Salt' } }),
    n('biblical', 'ark', 'Ark', ['flood', 'ship'], { forms: { plural: 'Arks' } }),
  ],
  symbolic: [],
  rhythm: { frame: 2, sentence: 2, 'of-phrase': 1.4 },
  denylist: ['yahweh', 'jehovah', 'elohim', 'adonai', 'el shaddai', 'jesus', 'christ', 'messiah', 'holy spirit', 'holy ghost', 'virgin mary', 'allah',
    'muhammad', 'michael', 'gabriel', 'raphael', 'satan', 'lucifer', 'beelzebub', 'antichrist', 'eucharist', 'crucifixion', 'trinity', 'vatican', 'pope'],
  review: { status: 'draft', notes: 'Living faiths: no divine names, no mockery.' },
};
```

Update `packages/data/src/myths/index.ts` to import all 31 packs and list them in `MYTH_IDS` order:
```ts
export const MYTHS: readonly MythPack[] = [
  NONE, ORIGINAL, NORSE, ICELANDIC, GERMANIC, ANGLO_SAXON, CELTIC, ARTHURIAN, GREEK, ROMAN, EGYPTIAN, MESOPOTAMIAN, PERSIAN, ARABIAN,
  SLAVIC, FINNISH, JAPANESE, CHINESE, KOREAN, INDIAN, MESOAMERICAN, AZTEC, MAYA, ANDEAN, POLYNESIAN, AFRICAN, BIBLICAL, GNOSTIC, ALCHEMICAL,
  COSMIC, FAIRY_TALE,
];
```

- [ ] **Step 4: Pack status report**

`scripts/pack-status.ts`:
```ts
import { writeFileSync } from 'node:fs';
import { DATA, MYTH_IDS } from '@vps-name-tools/data';

const rows = MYTH_IDS.map(id => {
  const m = DATA.myths.find(x => x.id === id);
  if (!m) return `| ${id} | — | missing | — | — | Not authored |`;
  const r = m.review;
  return `| ${m.label} | ${m.tier} | ${r.status} | ${r.reviewer ?? '—'} | ${r.date ?? '—'} | ${r.notes.replace(/\|/g, '/') || '—'} |`;
});
const held = DATA.myths.filter(m => m.review.status === 'held');
const doc = [
  '# Cultural pack status',
  '',
  'Generated by `npm run pack-status`. Do not edit by hand; edit each pack\'s `review` record.',
  '',
  '| Style | Tier | Status | Reviewer | Date | Notes |',
  '|---|---|---|---|---|---|',
  ...rows,
  '',
  held.length ? `**Held back at launch:** ${held.map(m => `${m.label} (${m.review.notes})`).join('; ')}` : '**Held back at launch:** none.',
  '',
].join('\n');
writeFileSync('docs/content/CULTURAL-PACK-STATUS.md', doc);
console.log(doc);
```

Run: `npm run pack-status`
Expected: the table lists all 31 options with their review status.

- [ ] **Step 5: Review each Tier B pack**

For each pack: generate 200 titles across four genres (same command as Task 23 Step 5), read them, and check the pack data against the Tier B rules. Then either set `status: 'reviewed'` (with reviewer, date and notes) or, if the pack cannot be completed responsibly, set `status: 'held'` with a specific reason. Re-run `npm run pack-status` and add a `docs/VALIDATION.md` row per pack. External readers remain recommended (spec §21); note in `notes` when an external review happens later (`status: 'externally-reviewed'`).

- [ ] **Step 6: Run to verify pass and commit**

Run: `npx tsx --test packages/data/test/packs.test.ts packages/game-titles/test/cultural-output.test.ts && npm run validate:data && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "Add the Tier B cultural packs and the pack status report"
```

---

### Task 25: Release validation, quality tuning and golden snapshots

**Files:**
- Create: `packages/game-titles/test/golden.test.ts`, `packages/game-titles/test/golden/presets.ts`, `packages/game-titles/test/golden/snapshots.json`, `scripts/golden-update.ts`
- Modify: `packages/game-titles/src/score.ts` and content files as tuning requires; `.github/workflows/validate.yml`; root `package.json` scripts (`"golden:update": "tsx scripts/golden-update.ts"`, `"validate:release": "tsx scripts/validate-data.ts --release"`)

**Interfaces:**
- Consumes: everything in M3 and M4.
- Produces: `GOLDEN_PRESETS: readonly { name: string; settings: Partial<Settings>; seed: string }[]` (20 pairs); CI gates `validate:release` and `quality --check`.

- [ ] **Step 1: Release validation**

Run: `npm run validate:release`
Expected: `0 error(s)`. Fix every content-target error (concepts, aliases, lexicon size, imagery per pack, draft packs). A pack still in `draft` is an error here: review it or hold it with a reason.

- [ ] **Step 2: Quality tuning on real data**

Run: `npm run quality -- --check`
Expected: every preset prints `OK`. When a preset fails, tune in this order and re-run after each change: (1) content (add vocabulary to thin concepts, add family ids, raise cliché scores on over-used words); (2) genre or pack family weights; (3) `SCORE` weights in `score.ts`. Never relax `QUALITY_THRESHOLDS`. Record the final numbers in `docs/VALIDATION.md`.

- [ ] **Step 3: Golden presets and the failing golden test**

`packages/game-titles/test/golden/presets.ts`:
```ts
import type { Settings } from '../../src/index';

export const GOLDEN_PRESETS: readonly { name: string; settings: Partial<Settings>; seed: string }[] = [
  { name: 'defaults', settings: {}, seed: 'g01' },
  { name: 'appendix C 1', settings: { genre: 'dark-fantasy', myth: 'norse', tone: 'grim', tone2: 'mystical', themes: 'frozen kingdom, ravens, forgotten gods, blood oath, northern lights' }, seed: 'g02' },
  { name: 'appendix C 2', settings: { genre: 'creature-collector', myth: 'fairy-tale', tone: 'cozy', tone2: 'playful', themes: 'cute creatures, islands, collecting, friendship, cozy exploration' }, seed: 'g03' },
  { name: 'appendix C 3', settings: { genre: 'psychological-horror', tone: 'mysterious', tone2: 'melancholic', creativity: 'focused', themes: 'abandoned radio tower, analog horror, snowstorm, missing hikers' }, seed: 'g04' },
  { name: 'include Aeternum', settings: { include: 'Aeternum' }, seed: 'g05' },
  { name: 'brandable fantasy', settings: { style: 'brandable' }, seed: 'g06' },
  { name: 'epic fantasy style', settings: { style: 'epic-fantasy' }, seed: 'g07' },
  { name: 'cyberpunk japanese', settings: { genre: 'cyberpunk', myth: 'japanese' }, seed: 'g08' },
  { name: 'space opera greek', settings: { genre: 'space-opera', myth: 'greek', tone: 'epic' }, seed: 'g09' },
  { name: 'cosmic wild', settings: { genre: 'cosmic-horror', myth: 'cosmic', creativity: 'wild' }, seed: 'g10' },
  { name: 'farming celtic', settings: { genre: 'farming', myth: 'celtic', tone: 'cozy' }, seed: 'g11' },
  { name: 'strategy roman', settings: { genre: 'strategy', myth: 'roman' }, seed: 'g12' },
  { name: 'western grim', settings: { genre: 'western', tone: 'grim' }, seed: 'g13' },
  { name: 'roguelike alchemical', settings: { genre: 'roguelike', myth: 'alchemical', themes: 'transmutation, mercury, endless descent' }, seed: 'g14' },
  { name: 'mystery fairy tale', settings: { genre: 'mystery', myth: 'fairy-tale', tone: 'mysterious' }, seed: 'g15' },
  { name: 'one word', settings: { length: 'one' }, seed: 'g16' },
  { name: 'long subtitle', settings: { length: 'long', style: 'subtitle' }, seed: 'g17' },
  { name: 'retro', settings: { genre: 'action-rpg', tone: 'retro', style: 'franchise' }, seed: 'g18' },
  { name: 'avoid list', settings: { genre: 'survival', avoid: 'winter, *frost*, "last light"' }, seed: 'g19' },
  { name: 'twenty results', settings: { genre: 'sci-fi', count: 20 }, seed: 'g20' },
];
```

`packages/game-titles/test/golden.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../src/index';
import { GOLDEN_PRESETS } from './golden/presets';

const snapshots = JSON.parse(readFileSync(new URL('./golden/snapshots.json', import.meta.url), 'utf8')) as Record<string, string[]>;

for (const p of GOLDEN_PRESETS) {
  test(`golden: ${p.name}`, () => {
    const titles = generate(p.settings, { seed: p.seed }).titles.map(t => t.title);
    assert.deepEqual(titles, snapshots[p.name], 'Output changed. If intended, run npm run golden:update and review the diff.');
  });
}
```

Create `packages/game-titles/test/golden/snapshots.json` containing `{}`.

Run: `npx tsx --test packages/game-titles/test/golden.test.ts`
Expected: FAIL (no snapshots).

- [ ] **Step 4: The update script**

`scripts/golden-update.ts`:
```ts
import { writeFileSync } from 'node:fs';
import { generate } from '@vps-name-tools/game-titles';
import { GOLDEN_PRESETS } from '../packages/game-titles/test/golden/presets';

const out: Record<string, string[]> = {};
for (const p of GOLDEN_PRESETS) out[p.name] = generate(p.settings, { seed: p.seed }).titles.map(t => t.title);
writeFileSync('packages/game-titles/test/golden/snapshots.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${GOLDEN_PRESETS.length} golden snapshots. Review the git diff before committing.`);
```

Run: `npm run golden:update && npx tsx --test packages/game-titles/test/golden.test.ts`
Expected: PASS (20 tests). Read the snapshot file: every batch should look like something you would show a game developer. If not, go back to Step 2.

- [ ] **Step 5: Gate CI**

Append to `.github/workflows/validate.yml` steps:
```yaml
      - run: npm run validate:release
      - run: npm run quality -- --check
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Pass release validation, tune quality and add golden snapshots"
```

---

## M5 — VPS Creator Visual System and Network Shell (`@vps-name-tools/site-kit`)

How the pieces relate (spec §22–23):

- **Source of the look:** the live Valkyrja Publishing Studios website, translated into an application layout. Task 26 captures it; until then Task 29 ships provisional values under the final token names, so swapping is a one-file change.
- **Reused from the Landscape Project Toolkit (structure only):** semantic token names (components never use raw colours), fluid type and spacing scales, the focus-ring method, self-hosted fonts, slim header/footer pattern, skip link, one network/family config file guarded by a test, the `_headers` security baseline, the triple `noindex` switch and the deploy workflow.
- **Different from the toolkit:** dark studio palette instead of cream/olive; no topographic motif, meridian dividers or project tray; one generator workspace; family line "A Free Creator Tool by VPS"; no platform funnel.

### Task 26: Capture the VPS website and write the token sheet

**Prerequisites:** Task 29 is done (it creates `tokens.css`), and `valkyrjapublishingstudios.com` is reachable from the build environment. **Blocked today:** the environment's network policy refuses the domain. If Step 1 fails, stop this task, tell the user what to allow (Network access → Allowed domains: `valkyrjapublishingstudios.com`) or ask for screenshots plus the site's colours and fonts, and continue with Task 27; come back when unblocked.

**Files:**
- Create: `scripts/capture-vps-site.mjs`, `docs/brand/VPS-CREATOR-VISUAL-SYSTEM.md`, `docs/brand/capture/styles.json` (screenshots `docs/brand/capture/*.png` stay local; `.gitignore` excludes them)
- Modify: `packages/site-kit/src/styles/tokens.css` (values only), root `package.json` (devDependency `puppeteer-core`, script `"capture:vps": "node scripts/capture-vps-site.mjs"`), possibly `@fontsource` font packages in `packages/site-kit/package.json`
- Test: `packages/site-kit/test/tokens.test.ts` (from Task 29; must stay green with the new values)

**Interfaces:**
- Consumes: token names from Task 29.
- Produces: approved token values; `styles.json` evidence.

- [ ] **Step 1: Check reachability**

Run: `curl -sS -o /dev/null -w "%{http_code}\n" https://valkyrjapublishingstudios.com/`
Expected: `200`. A `403` from the proxy (or a connection error) means the domain is still blocked: stop here as described above.

- [ ] **Step 2: Write the capture script**

`scripts/capture-vps-site.mjs`:
```js
// Captures the live VPS website so the creator tools can translate its identity (spec §22.2).
// Usage: npm run capture:vps [-- <extra page URL> ...]. Set CHROME_PATH if Chrome is not in a standard place.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const HOME = 'https://valkyrjapublishingstudios.com/';
const chrome = process.env.CHROME_PATH ?? ['/opt/pw-browsers/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) throw new Error('Chrome not found; set CHROME_PATH.');
const out = 'docs/brand/capture';
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });
const page = await browser.newPage();
await page.goto(HOME, { waitUntil: 'networkidle0', timeout: 60000 });
const inner = await page.$$eval('header a[href], nav a[href]', (as, home) =>
  [...new Set(as.map(a => a.href).filter(h => h.startsWith(home) && h !== home && !h.includes('#')))].slice(0, 2), HOME);
const pages = [HOME, ...(process.argv.slice(2).length ? process.argv.slice(2) : inner)];

const report = { capturedAt: new Date().toISOString(), pages: [] };
for (const url of pages) {
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    const slug = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
    await page.screenshot({ path: `${out}/${slug}-${width}.png`, fullPage: true });
    if (width !== 1440) continue;
    const styles = await page.evaluate(() => {
      const pick = (sel) => [...document.querySelectorAll(sel)].slice(0, 6).map(el => {
        const s = getComputedStyle(el);
        return { sel, text: (el.textContent ?? '').trim().slice(0, 40), color: s.color, background: s.backgroundColor, backgroundImage: s.backgroundImage,
          fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: s.letterSpacing, textTransform: s.textTransform,
          lineHeight: s.lineHeight, border: s.border, borderRadius: s.borderRadius, boxShadow: s.boxShadow, padding: s.padding };
      });
      return {
        body: pick('body'), header: pick('header, .site-header'), nav: pick('nav a'), h1: pick('h1'), h2: pick('h2'), h3: pick('h3'),
        paragraph: pick('main p, .entry-content p'), link: pick('main a'), button: pick('button, .wp-block-button__link, a.button, .elementor-button'),
        panel: pick('section, .wp-block-group, .wp-block-cover, .elementor-section'), footer: pick('footer'),
        fonts: [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style}`).filter((v, i, a) => a.indexOf(v) === i),
      };
    });
    report.pages.push({ url, styles });
  }
}
writeFileSync(`${out}/styles.json`, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
console.log(`Captured ${pages.length} pages to ${out}/`);
```

Run: `npm install -D puppeteer-core && npm run capture:vps`
Expected: `Captured 3 pages to docs/brand/capture/`; six PNGs and `styles.json`.

- [ ] **Step 3: Map the capture to creator tokens**

Write `docs/brand/VPS-CREATOR-VISUAL-SYSTEM.md` with these sections:
1. **Observed** (from `styles.json` and the screenshots): background colours and gradients, text colours, heading and body fonts (family, sizes, weights, letter-spacing, case), link and button language (shape, border, fill, glow, hover), panel borders, radii and shadows, header and navigation layout, section spacing and hierarchy.
2. **Translated** (a table: token name → captured source → new value → reason). Keep one primary accent; glow only on the primary button, focus ring and saved/active states. No runes, skulls, parchment or textured backgrounds.
3. **Fonts:** the families to self-host with `@fontsource` (licences recorded in `THIRD_PARTY_NOTICES.md`), with system fallbacks. If the site uses a font that cannot be self-hosted under an open licence, name the closest open alternative and say so.
4. **Contrast table:** every text/background pair (≥ 4.5:1) and UI boundary/focus pair (≥ 3:1), as computed by the Task 29 test.
5. **Not copied:** the WordPress page layout, hero sections, and any element that does not suit an application.

Update the values (only the values) in `packages/site-kit/src/styles/tokens.css`, removing the `PROVISIONAL` comment.

- [ ] **Step 4: Verify**

Run: `npx tsx --test packages/site-kit/test/tokens.test.ts && npm run build -w apps/video-game-name-generator`
Expected: PASS (contrast and token rules still hold); build succeeds. Take screenshots of the generator page at 1440 and 390 px (`node apps/video-game-name-generator/test/browser/screenshot.mjs`, created in Task 40, or manually) and put them next to the VPS captures for review.

- [ ] **Step 5: Approval and commit**

Ask the user to approve the token sheet and the side-by-side screenshots. Record the approval (date, any requested changes) in the token sheet and in `docs/VALIDATION.md`.

```bash
git add scripts/capture-vps-site.mjs docs/brand packages/site-kit package.json package-lock.json THIRD_PARTY_NOTICES.md docs/VALIDATION.md
git commit -m "Capture the VPS website and apply the approved creator tokens"
```

---

### Task 27: Network configuration and its guard test

**Files:**
- Create: `packages/site-kit/src/network.ts`
- Modify: `packages/site-kit/src/index.ts`
- Test: `packages/site-kit/test/network.test.ts`

**Interfaces:**
- Produces: `network`, `tool`, `otherCreatorTools: readonly CreatorToolLink[]`, `OTHER_TOOLS_EMPTY_LINE`, `ads`, `analytics`, `storageKeys`, types `CreatorToolLink`, `AdsConfig`, `AnalyticsConfig`.

- [ ] **Step 1: Write the failing test**

`packages/site-kit/test/network.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ads, analytics, network, otherCreatorTools, storageKeys, tool } from '../src/index';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const config = 'packages/site-kit/src/network.ts';
const walk = (dir: string): string[] => !existsSync(join(root, dir)) ? [] : readdirSync(join(root, dir)).flatMap(name => {
  const path = join(dir, name);
  if (['node_modules', 'dist', '.astro', 'test'].includes(name)) return [];
  return statSync(join(root, path)).isDirectory() ? walk(path) : [path];
});
const sources = [...walk('packages'), ...walk('apps')]
  .filter(f => /\.(astro|ts|mjs|css|html|md|txt|json|toml)$/.test(f) || f.endsWith('_headers'))
  .map(f => f.replaceAll('\\', '/'));
const read = (f: string) => readFileSync(join(root, f), 'utf8');

test('identity matches spec §23', () => {
  assert.equal(network.networkName, 'VPS Utility Network');
  assert.equal(network.section, 'Creator Tools');
  assert.equal(network.family, 'A Free Creator Tool by VPS');
  assert.equal(network.publisher, 'Valkyrja Publishing Studios');
  assert.equal(network.publisherUrl, 'https://valkyrjapublishingstudios.com/');
  assert.equal(tool.name, 'Video Game Name Generator');
});

test('ads are off and the layout widths match spec §23.4', () => {
  assert.equal(ads.enabled, false);
  assert.deepEqual([ads.railMinWidth, ads.railWidth, ads.wideRailMinWidth, ads.wideRailWidth], [1280, 160, 1600, 300]);
});

test('analytics events stay off until verified and storage keys match the spec', () => {
  assert.equal(analytics.events, false);
  assert.equal(analytics.endpoint, '/api/e');
  assert.equal(storageKeys.shortlist, 'vps-name-tools.video-game-names.v1.shortlist');
  assert.equal(storageKeys.settings, 'vps-name-tools.video-game-names.v1.settings');
});

test('the tool stays noindex until launch', () => {
  assert.equal(tool.indexing, false);
});

test('Other Free Creator Tools lists only released tools', () => {
  for (const t of otherCreatorTools) {
    assert.match(t.url, /^https:\/\//);
    assert.equal(t.released, true, t.name);
  }
});

test('network strings are not hard-coded outside the config', () => {
  const guarded = [network.family, network.networkName, network.publisherUrl, 'valkyrjapublishingstudios.com'];
  const offenders = sources.filter(f => f !== config && !f.startsWith('docs/') && guarded.some(s => read(f).includes(s)));
  assert.deepEqual(offenders, [], `move these strings into ${config}`);
});

test('no service-business platform names, links or upgrade copy anywhere', () => {
  const banned = /service[- ]business[- ]platform|business operator|explore the full vps platform|vps-service-business-platform|upgrade to/i;
  const offenders = sources.filter(f => banned.test(read(f)));
  assert.deepEqual(offenders, []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/site-kit/test/network.test.ts`
Expected: FAIL (`network` is not exported).

- [ ] **Step 3: Implement**

`packages/site-kit/src/network.ts`:
```ts
/**
 * Every VPS network, family and link string for the creator tools, in one place (spec §23.1).
 * packages/site-kit/test/network.test.ts fails if any of them is hard-coded elsewhere, and if any
 * service-business platform name, link or upgrade copy appears anywhere in this codebase (Revision 2, decision 8).
 */
export const network = {
  house: 'VPS',
  publisher: 'Valkyrja Publishing Studios',
  publisherUrl: 'https://valkyrjapublishingstudios.com/',
  networkName: 'VPS Utility Network',
  section: 'Creator Tools',
  family: 'A Free Creator Tool by VPS',
} as const;

export const tool = {
  id: 'video-game-names',
  name: 'Video Game Name Generator',
  tagline: 'Game titles that fit your genre, myth and vibe.',
  badges: ['Free', 'No sign-up', 'Runs in your browser'],
  /** Replace with the custom domain at launch (Task 45). Never includes query parameters. */
  canonicalUrl: 'https://vps-video-game-name-generator.pages.dev/',
  /** The staging switch: false keeps robots meta, X-Robots-Tag and robots.txt on noindex (Task 37 test keeps them in agreement). */
  indexing: false,
} as const;

export interface CreatorToolLink {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  /** Only released, public tools are listed (spec §23.2). */
  readonly released: true;
}

/** Other released VPS creator tools. Empty at launch unless one is public. */
export const otherCreatorTools: readonly CreatorToolLink[] = [];
export const OTHER_TOOLS_EMPTY_LINE = 'More free creator tools from VPS are on the way.';

export interface AdsConfig {
  readonly enabled: boolean;
  readonly railMinWidth: number;
  readonly railWidth: number;
  readonly wideRailMinWidth: number;
  readonly wideRailWidth: number;
  readonly slotLabel: string;
  readonly slotMinHeight: number;
}
/** Ad-ready layout with no ad code (Revision 2, decision 9). */
export const ads: AdsConfig = {
  enabled: false, railMinWidth: 1280, railWidth: 160, wideRailMinWidth: 1600, wideRailWidth: 300, slotLabel: 'Advertisement', slotMinHeight: 280,
};

export interface AnalyticsConfig {
  /** Cloudflare Web Analytics is switched on for the Pages project; Cloudflare injects its beacon. */
  readonly pageviews: boolean;
  /** Custom events via the /api/e Pages Function; stays false until the Analytics Engine binding is verified. */
  readonly events: boolean;
  readonly endpoint: string;
  /** 0–1. Lower it if the Workers free request quota gets close. */
  readonly sampleRate: number;
}
export const analytics: AnalyticsConfig = { pageviews: true, events: false, endpoint: '/api/e', sampleRate: 1 };

const prefix = `vps-name-tools.${tool.id}.v1`;
export const storageKeys = { shortlist: `${prefix}.shortlist`, settings: `${prefix}.settings` } as const;
```

`packages/site-kit/src/index.ts`:
```ts
export const PACKAGE = '@vps-name-tools/site-kit';
export * from './network';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/site-kit/test/network.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/site-kit
git commit -m "Add the creator-tools network config and its guard test"
```

---

### Task 28: Storage adapter and shortlist store

**Files:**
- Create: `packages/site-kit/src/storage.ts`, `packages/site-kit/src/shortlist.ts`
- Modify: `packages/site-kit/src/index.ts`
- Test: `packages/site-kit/test/storage.test.ts`, `packages/site-kit/test/shortlist.test.ts`

**Interfaces:**
- Produces:
  - `interface KeyValueStore { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void; keys(): string[] }`
  - `memoryStore(): KeyValueStore`; `safeLocalStorage(): { store: KeyValueStore; persistent: boolean }`
  - `type StorageNotice = 'unavailable' | 'corrupt-reset' | 'quota'`
  - `interface JsonStore<T> { read(): T; write(value: T): boolean; clear(): void; notice(): StorageNotice | undefined }`; `createJsonStore<T>(kv, key, isValid: (x: unknown) => x is T, fallback: T, now?: () => number): JsonStore<T>`
  - `interface ShortlistItem { id: string; title: string; savedAt: string; meta: Record<string, unknown>; recipe: unknown; settings: Record<string, unknown> }`
  - `EXPORT_FORMAT = 'vps-name-tools/shortlist'`, `EXPORT_VERSION = 1`, `MAX_SHORTLIST = 500`, `isShortlistItem(x: unknown): x is ShortlistItem`
  - `interface ImportReport { added: number; duplicates: number; invalid: number; full: number; error?: string }`
  - `interface Shortlist { items(): readonly ShortlistItem[]; has(id: string): boolean; add(item: Omit<ShortlistItem, 'savedAt'>): 'added' | 'exists' | 'full'; remove(id: string): boolean; toggle(item: Omit<ShortlistItem, 'savedAt'>): boolean; clear(): void; exportJson(): string; exportText(): string; importJson(text: string): ImportReport; reload(): void; notice(): StorageNotice | undefined }`
  - `createShortlist(opts: { kv: KeyValueStore; key: string; tool: string; validateItem?: (x: ShortlistItem) => boolean; now?: () => Date }): Shortlist`

Storage rules (spec §14): every access through try/catch; storage unavailable → memory with notice `unavailable`; corrupt JSON or wrong shape → raw value kept under `<key>.corrupt-<timestamp>`, start fresh, notice `corrupt-reset`; quota errors → keep in memory, notice `quota`; newest first; 500 items; import validates every item, skips duplicates and invalid ones, reports counts.

- [ ] **Step 1: Write the failing tests**

`packages/site-kit/test/storage.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJsonStore, memoryStore, type KeyValueStore } from '../src/index';

const isNums = (x: unknown): x is number[] => Array.isArray(x) && x.every(n => typeof n === 'number');

test('round-trips values', () => {
  const kv = memoryStore();
  const s = createJsonStore(kv, 'k', isNums, []);
  assert.equal(s.write([1, 2]), true);
  assert.deepEqual(createJsonStore(kv, 'k', isNums, []).read(), [1, 2]);
});

test('corrupt data is kept aside and the store starts fresh with a notice', () => {
  const kv = memoryStore();
  kv.set('k', '{not json');
  const s = createJsonStore(kv, 'k', isNums, [], () => 1234);
  assert.deepEqual(s.read(), []);
  assert.equal(s.notice(), 'corrupt-reset');
  assert.equal(kv.get('k.corrupt-1234'), '{not json');
  assert.equal(kv.get('k'), null);
});

test('wrong shapes are treated as corrupt', () => {
  const kv = memoryStore();
  kv.set('k', '{"a":1}');
  const s = createJsonStore(kv, 'k', isNums, [], () => 5);
  assert.deepEqual(s.read(), []);
  assert.equal(s.notice(), 'corrupt-reset');
});

test('quota errors keep the value in memory with a notice', () => {
  const inner = memoryStore();
  const full: KeyValueStore = { ...inner, set: () => { throw new DOMException('full', 'QuotaExceededError'); } };
  const s = createJsonStore(full, 'k', isNums, []);
  assert.equal(s.write([1]), false);
  assert.equal(s.notice(), 'quota');
  assert.deepEqual(s.read(), [1]);
});

test('a throwing store behaves like memory with an unavailable notice', () => {
  const broken: KeyValueStore = { get: () => { throw new Error('denied'); }, set: () => { throw new Error('denied'); }, remove: () => { throw new Error('denied'); }, keys: () => { throw new Error('denied'); } };
  const s = createJsonStore(broken, 'k', isNums, []);
  assert.deepEqual(s.read(), []);
  s.write([3]);
  assert.deepEqual(s.read(), [3]);
  assert.equal(s.notice(), 'unavailable');
});
```

`packages/site-kit/test/shortlist.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPORT_FORMAT, MAX_SHORTLIST, createShortlist, memoryStore } from '../src/index';

const item = (n: number) => ({ id: `t_${n}`, title: `Title ${n}`, meta: { genre: 'fantasy', myth: 'none' }, recipe: { templateId: 'T01' }, settings: { genre: 'fantasy' } });
let clock = 0;
const make = (kv = memoryStore()) => createShortlist({ kv, key: 'sl', tool: 'video-game-names', now: () => new Date(Date.UTC(2026, 9, 8, 0, 0, clock++)) });

test('add, has, newest first, remove and toggle', () => {
  const s = make();
  assert.equal(s.add(item(1)), 'added');
  assert.equal(s.add(item(2)), 'added');
  assert.equal(s.add(item(1)), 'exists');
  assert.deepEqual(s.items().map(i => i.id), ['t_2', 't_1']);
  assert.equal(s.toggle(item(2)), false);
  assert.equal(s.has('t_2'), false);
  assert.equal(s.toggle(item(2)), true);
  assert.equal(s.remove('t_1'), true);
  assert.equal(s.remove('t_1'), false);
});

test('persists across instances and reloads from storage', () => {
  const kv = memoryStore();
  const a = make(kv);
  a.add(item(1));
  const b = make(kv);
  assert.deepEqual(b.items().map(i => i.id), ['t_1']);
  a.add(item(2));
  b.reload();
  assert.equal(b.items().length, 2);
});

test('caps at 500 items', () => {
  const s = make();
  for (let i = 0; i < MAX_SHORTLIST; i++) assert.equal(s.add(item(i)), 'added');
  assert.equal(s.add(item(9999)), 'full');
});

test('text export is one title per line, JSON export uses the versioned envelope', () => {
  const s = make();
  s.add(item(1));
  s.add(item(2));
  assert.equal(s.exportText(), 'Title 2\nTitle 1\n');
  const data = JSON.parse(s.exportJson());
  assert.equal(data.format, EXPORT_FORMAT);
  assert.equal(data.version, 1);
  assert.equal(data.tool, 'video-game-names');
  assert.equal(data.items.length, 2);
  assert.match(data.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('import validates, skips duplicates and invalid items, and reports counts', () => {
  const source = make();
  source.add(item(1));
  source.add(item(2));
  const json = JSON.parse(source.exportJson());
  json.items.push({ id: 5, title: null }, { ...item(3), title: '' });
  const target = make();
  target.add(item(1));
  assert.deepEqual(target.importJson(JSON.stringify(json)), { added: 1, duplicates: 1, invalid: 2, full: 0 });
  assert.deepEqual(target.importJson('nope').error, 'This file is not a shortlist export.');
  assert.match(target.importJson(JSON.stringify({ ...json, format: 'other' })).error ?? '', /not a shortlist export/);
});

test('clear empties the list', () => {
  const s = make();
  s.add(item(1));
  s.clear();
  assert.equal(s.items().length, 0);
});

test('titles and ids are length-capped on import (no oversized records)', () => {
  const s = make();
  const r = s.importJson(JSON.stringify({ format: EXPORT_FORMAT, version: 1, tool: 'video-game-names', items: [{ ...item(1), title: 'x'.repeat(500), savedAt: new Date().toISOString() }] }));
  assert.equal(r.invalid, 1);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/site-kit/test/storage.test.ts packages/site-kit/test/shortlist.test.ts`
Expected: FAIL (`memoryStore` is not exported).

- [ ] **Step 3: Implement**

`packages/site-kit/src/storage.ts`:
```ts
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export type StorageNotice = 'unavailable' | 'corrupt-reset' | 'quota';

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    get: k => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: k => void m.delete(k),
    keys: () => [...m.keys()],
  };
}

/** localStorage when it works (it can throw in private modes or when blocked), else memory. */
export function safeLocalStorage(): { store: KeyValueStore; persistent: boolean } {
  try {
    const ls = globalThis.localStorage;
    const probe = '__vps_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return {
      persistent: true,
      store: {
        get: k => ls.getItem(k),
        set: (k, v) => ls.setItem(k, v),
        remove: k => ls.removeItem(k),
        keys: () => Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => k !== null),
      },
    };
  } catch {
    return { store: memoryStore(), persistent: false };
  }
}

export interface JsonStore<T> {
  read(): T;
  write(value: T): boolean;
  clear(): void;
  notice(): StorageNotice | undefined;
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);

export function createJsonStore<T>(kv: KeyValueStore, key: string, isValid: (x: unknown) => x is T, fallback: T, now: () => number = Date.now): JsonStore<T> {
  let memory: T | undefined;
  let notice: StorageNotice | undefined;
  let broken = false;
  const attempt = <R>(f: () => R, onError: (e: unknown) => R): R => {
    if (broken) return onError(new Error('unavailable'));
    try {
      return f();
    } catch (e) {
      return onError(e);
    }
  };
  const markBroken = () => {
    broken = true;
    notice = 'unavailable';
  };
  return {
    read() {
      if (memory !== undefined) return memory;
      const raw = attempt(() => kv.get(key), () => (markBroken(), null));
      if (raw === null) return (memory = fallback);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }
      if (isValid(parsed)) return (memory = parsed);
      attempt(() => {
        kv.set(`${key}.corrupt-${now()}`, raw);
        kv.remove(key);
      }, () => undefined);
      notice = 'corrupt-reset';
      return (memory = fallback);
    },
    write(value) {
      memory = value;
      return attempt(() => (kv.set(key, JSON.stringify(value)), true), e => {
        if (isQuota(e)) notice = 'quota';
        else markBroken();
        return false;
      });
    },
    clear() {
      memory = fallback;
      attempt(() => kv.remove(key), () => undefined);
    },
    notice: () => notice,
  };
}
```

`packages/site-kit/src/shortlist.ts`:
```ts
import { createJsonStore, type KeyValueStore, type StorageNotice } from './storage';

export interface ShortlistItem {
  readonly id: string;
  readonly title: string;
  readonly savedAt: string;
  readonly meta: Readonly<Record<string, unknown>>;
  readonly recipe: unknown;
  readonly settings: Readonly<Record<string, unknown>>;
}

export const EXPORT_FORMAT = 'vps-name-tools/shortlist';
export const EXPORT_VERSION = 1;
export const MAX_SHORTLIST = 500;
const MAX_ID = 64;
const MAX_TITLE = 120;

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function isShortlistItem(x: unknown): x is ShortlistItem {
  if (!isRecord(x)) return false;
  return typeof x.id === 'string' && x.id.length > 0 && x.id.length <= MAX_ID
    && typeof x.title === 'string' && x.title.trim().length > 0 && x.title.length <= MAX_TITLE
    && typeof x.savedAt === 'string' && !Number.isNaN(Date.parse(x.savedAt))
    && isRecord(x.meta) && isRecord(x.settings) && 'recipe' in x;
}

interface Envelope { readonly v: 1; readonly items: readonly ShortlistItem[] }
const isEnvelope = (x: unknown): x is Envelope => isRecord(x) && x.v === 1 && Array.isArray(x.items) && x.items.every(isShortlistItem);

export interface ImportReport { readonly added: number; readonly duplicates: number; readonly invalid: number; readonly full: number; readonly error?: string }

export interface Shortlist {
  items(): readonly ShortlistItem[];
  has(id: string): boolean;
  add(item: Omit<ShortlistItem, 'savedAt'>): 'added' | 'exists' | 'full';
  remove(id: string): boolean;
  /** Returns true when the item is saved after the call. */
  toggle(item: Omit<ShortlistItem, 'savedAt'>): boolean;
  clear(): void;
  exportJson(): string;
  exportText(): string;
  importJson(text: string): ImportReport;
  /** Re-reads storage (call on the window "storage" event for this key). */
  reload(): void;
  notice(): StorageNotice | undefined;
}

export function createShortlist(opts: {
  kv: KeyValueStore;
  key: string;
  tool: string;
  validateItem?: (x: ShortlistItem) => boolean;
  now?: () => Date;
}): Shortlist {
  const now = opts.now ?? (() => new Date());
  const valid = (x: unknown): x is ShortlistItem => isShortlistItem(x) && (opts.validateItem?.(x) ?? true);
  let store = createJsonStore<Envelope>(opts.kv, opts.key, isEnvelope, { v: 1, items: [] });
  const list = () => store.read().items;
  const save = (items: readonly ShortlistItem[]) => void store.write({ v: 1, items });
  const api: Shortlist = {
    items: list,
    has: id => list().some(i => i.id === id),
    add(item) {
      if (api.has(item.id)) return 'exists';
      if (list().length >= MAX_SHORTLIST) return 'full';
      save([{ ...item, savedAt: now().toISOString() }, ...list()]);
      return 'added';
    },
    remove(id) {
      const before = list();
      const after = before.filter(i => i.id !== id);
      if (after.length === before.length) return false;
      save(after);
      return true;
    },
    toggle(item) {
      if (api.has(item.id)) {
        api.remove(item.id);
        return false;
      }
      return api.add(item) === 'added';
    },
    clear: () => save([]),
    exportJson: () => `${JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, tool: opts.tool, exportedAt: now().toISOString(), items: list() }, null, 2)}\n`,
    exportText: () => list().map(i => `${i.title}\n`).join(''),
    importJson(text) {
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        return { added: 0, duplicates: 0, invalid: 0, full: 0, error: 'This file is not a shortlist export.' };
      }
      if (!isRecord(data) || data.format !== EXPORT_FORMAT || data.version !== EXPORT_VERSION || !Array.isArray(data.items)) {
        return { added: 0, duplicates: 0, invalid: 0, full: 0, error: 'This file is not a shortlist export.' };
      }
      let added = 0, duplicates = 0, invalid = 0, full = 0;
      const items = [...list()];
      const ids = new Set(items.map(i => i.id));
      for (const x of data.items) {
        if (!valid(x)) { invalid++; continue; }
        if (ids.has(x.id)) { duplicates++; continue; }
        if (items.length >= MAX_SHORTLIST) { full++; continue; }
        items.push(x);
        ids.add(x.id);
        added++;
      }
      items.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
      save(items);
      return { added, duplicates, invalid, full };
    },
    reload() {
      store = createJsonStore<Envelope>(opts.kv, opts.key, isEnvelope, { v: 1, items: [] });
    },
    notice: () => store.notice(),
  };
  return api;
}
```

Append to `packages/site-kit/src/index.ts`:
```ts
export * from './storage';
export * from './shortlist';
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/site-kit/test/storage.test.ts packages/site-kit/test/shortlist.test.ts && npm run typecheck`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/site-kit
git commit -m "Add the storage adapter and shortlist store"
```

---

### Task 29: VPS Creator tokens, base styles and components CSS

**Files:**
- Create: `packages/site-kit/src/styles/tokens.css`, `base.css`, `components.css`, `layout.css`, `packages/site-kit/src/contrast.ts`
- Modify: `packages/site-kit/package.json` (`exports` add `"./styles/*": "./src/styles/*"`, `"./components/*": "./src/components/*"`), `packages/site-kit/src/index.ts`
- Test: `packages/site-kit/test/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties (names below; every later stylesheet uses only these), classes `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.field`, `.field__label`, `.field__hint`, `.select`, `.input`, `.textarea`, `.segmented`, `.chip`, `.panel`, `.disclosure`, `.notice`, `.notice--warn`, `.visually-hidden`, `.skip-link`, layout classes `.page`, `.page__main`, `.ad-rail`, `.ad-slot`; `contrast(a: string, b: string): number`, `parseTokens(css: string, block?: 'root' | 'more-contrast'): Record<string, string>`.

- [ ] **Step 1: Write the failing test**

`packages/site-kit/test/tokens.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { contrast, parseTokens } from '../src/index';

const styles = new URL('../src/styles/', import.meta.url);
const css = (f: string) => readFileSync(new URL(f, styles), 'utf8');
const TEXT_PAIRS: [string, string][] = [
  ['--c-text', '--c-bg'], ['--c-text', '--c-surface'], ['--c-text', '--c-surface-2'], ['--c-text', '--c-surface-hover'],
  ['--c-text-muted', '--c-bg'], ['--c-text-muted', '--c-surface'], ['--c-text-muted', '--c-surface-2'],
  ['--c-text-faint', '--c-surface'], ['--c-text-faint', '--c-surface-2'],
  ['--c-accent-ink', '--c-accent'], ['--c-accent-ink', '--c-accent-strong'], ['--c-accent', '--c-bg'], ['--c-accent', '--c-surface'],
  ['--c-warm', '--c-surface'], ['--c-warm-ink', '--c-warm'], ['--c-danger', '--c-surface'], ['--c-success', '--c-surface'],
];
const UI_PAIRS: [string, string][] = [
  ['--c-border-control', '--c-bg'], ['--c-border-control', '--c-surface'], ['--c-border-control', '--c-surface-2'],
  ['--c-focus', '--c-bg'], ['--c-focus', '--c-surface'], ['--c-focus', '--c-surface-2'], ['--c-accent', '--c-surface-2'],
];

test('contrast() matches WCAG reference values', () => {
  assert.equal(Math.round(contrast('#000000', '#ffffff') * 10) / 10, 21);
  assert.equal(Math.round(contrast('#777777', '#ffffff') * 100) / 100, 4.48);
});

for (const block of ['root', 'more-contrast'] as const) {
  test(`text pairs reach 4.5:1 and UI pairs reach 3:1 (${block})`, () => {
    const t = { ...parseTokens(css('tokens.css'), 'root'), ...parseTokens(css('tokens.css'), block) };
    for (const [fg, bg] of TEXT_PAIRS) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`);
    for (const [fg, bg] of UI_PAIRS) assert.ok(contrast(t[fg], t[bg]) >= 3, `${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`);
  });
}

test('only tokens.css holds raw colours; no decorative images in the chrome', () => {
  for (const f of readdirSync(styles).filter(x => x.endsWith('.css') && x !== 'tokens.css')) {
    const code = css(f).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b|rgba?\(/i, `${f} uses a raw colour`);
    assert.doesNotMatch(code, /url\(/i, `${f} uses an image`);
  }
});

test('glow is reserved for the primary button, focus and saved/active states', () => {
  const code = css('components.css');
  const uses = code.match(/[^{}]+\{[^}]*var\(--glow-[a-z]+\)/g) ?? [];
  for (const rule of uses) assert.match(rule, /btn--primary|:focus-visible|\[aria-pressed="true"\]|\.is-active/, rule.trim().slice(0, 80));
});

test('reduced motion and forced colours are handled', () => {
  assert.match(css('tokens.css'), /prefers-reduced-motion: reduce/);
  assert.match(css('base.css'), /forced-colors: active/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/site-kit/test/tokens.test.ts`
Expected: FAIL (`contrast` is not exported).

- [ ] **Step 3: Contrast helper**

`packages/site-kit/src/contrast.ts`:
```ts
const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map(x => x + x).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Reads `--name: #hex;` declarations from the :root block or the prefers-contrast: more block of tokens.css. */
export function parseTokens(css: string, block: 'root' | 'more-contrast' = 'root'): Record<string, string> {
  const source = block === 'root'
    ? css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')))
    : (css.match(/@media \(prefers-contrast: more\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? '');
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)) out[m[1]] = m[2];
  return out;
}
```

Append to `packages/site-kit/src/index.ts`: `export * from './contrast';`

- [ ] **Step 4: Stylesheets**

`packages/site-kit/src/styles/tokens.css`:
```css
/* VPS Creator tokens. PROVISIONAL values until the VPS website capture (Task 26) replaces them.
   Components use these names only; raw colours live in this file. Dark studio theme (Revision 2, decision 7). */
:root {
  color-scheme: dark;
  --c-bg: #0b0d12;
  --c-bg-raised: #10131a;
  --c-surface: #151923;
  --c-surface-2: #1b2030;
  --c-surface-hover: #212839;
  --c-text: #e8ecf4;
  --c-text-muted: #a3adbf;
  --c-text-faint: #8b95a8;
  --c-border: #262d3d;
  --c-border-control: #66728c;
  --c-accent: #6cc4ff;
  --c-accent-strong: #9ad6ff;
  --c-accent-ink: #04121c;
  --c-warm: #e0b25b;
  --c-warm-ink: #1a1204;
  --c-focus: #9ad6ff;
  --c-danger: #ff8a8a;
  --c-success: #7ee2a8;
  --glow-accent: 0 0 0 1px rgb(108 196 255 / 0.55), 0 0 22px rgb(108 196 255 / 0.28);
  --glow-warm: 0 0 0 1px rgb(224 178 91 / 0.5), 0 0 18px rgb(224 178 91 / 0.22);
  --panel-gradient: linear-gradient(180deg, rgb(255 255 255 / 0.03), rgb(255 255 255 / 0) 45%);
  --page-gradient: radial-gradient(1100px 520px at 50% -12%, rgb(108 196 255 / 0.08), transparent 62%);
  --font-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-ui: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --tracking-display: 0.01em;
  --tracking-caps: 0.12em;
  --step--1: clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem);
  --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.06rem);
  --step-1: clamp(1.15rem, 1.08rem + 0.35vw, 1.3rem);
  --step-2: clamp(1.35rem, 1.22rem + 0.6vw, 1.6rem);
  --step-3: clamp(1.7rem, 1.45rem + 1.2vw, 2.3rem);
  --step-4: clamp(2.1rem, 1.7rem + 2vw, 3.1rem);
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --radius-s: 6px;
  --radius-m: 10px;
  --radius-l: 14px;
  --radius-pill: 999px;
  --content-max: 880px;
  --gutter: clamp(1rem, 4vw, 2rem);
  --target-min: 24px;
  --target-touch: 44px;
  --ad-rail: 160px;
  --ad-rail-wide: 300px;
  --ad-slot-min: 280px;
  --duration: 160ms;
}

@media (prefers-contrast: more) {
  :root {
    --c-text-muted: #c9d1de;
    --c-text-faint: #b7c0cf;
    --c-border: #7a86a0;
    --c-border-control: #9aa6bf;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration: 0ms; }
}
```

`packages/site-kit/src/styles/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--page-gradient), var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-ui);
  font-size: var(--step-0);
  line-height: 1.55;
  overflow-wrap: anywhere;
}
h1, h2, h3 { font-family: var(--font-display); letter-spacing: var(--tracking-display); line-height: 1.15; margin: 0 0 var(--space-3); }
h1 { font-size: var(--step-4); }
h2 { font-size: var(--step-3); }
h3 { font-size: var(--step-2); }
p { margin: 0 0 var(--space-4); }
a { color: var(--c-accent); text-underline-offset: 0.18em; }
a:hover { color: var(--c-accent-strong); }
:focus-visible { outline: 2px solid var(--c-focus); outline-offset: 2px; box-shadow: var(--glow-accent); }
.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.skip-link {
  position: absolute; left: var(--space-4); top: -100px; z-index: 10;
  background: var(--c-accent); color: var(--c-accent-ink); padding: var(--space-2) var(--space-4); border-radius: var(--radius-s);
}
.skip-link:focus { top: var(--space-4); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
@media (forced-colors: active) {
  :focus-visible { outline: 2px solid Highlight; box-shadow: none; }
  .btn, .chip, .panel, .input, .select, .textarea { border: 1px solid CanvasText; }
}
```

`packages/site-kit/src/styles/components.css`:
```css
/* Buttons: primary = accent fill + soft glow; secondary = outlined; ghost = text-like. */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: var(--target-touch); min-width: var(--target-min); padding: 0 var(--space-4);
  border-radius: var(--radius-m); border: 1px solid var(--c-border-control);
  background: var(--c-surface-2); color: var(--c-text); font: inherit; font-weight: 600; cursor: pointer;
  transition: background var(--duration), border-color var(--duration), box-shadow var(--duration);
}
.btn:hover { background: var(--c-surface-hover); }
.btn--primary { background: var(--c-accent); border-color: var(--c-accent); color: var(--c-accent-ink); }
.btn--primary:hover { background: var(--c-accent-strong); box-shadow: var(--glow-accent); }
.btn--secondary { background: transparent; }
.btn--ghost { background: transparent; border-color: transparent; color: var(--c-accent); padding-inline: var(--space-2); }
.btn--small { min-height: 36px; padding: 0 var(--space-3); font-size: var(--step--1); }
.btn[aria-pressed="true"] { border-color: var(--c-warm); color: var(--c-warm); box-shadow: var(--glow-warm); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Form fields */
.field { display: grid; gap: var(--space-1); }
.field__label { font-weight: 600; }
.field__hint { color: var(--c-text-muted); font-size: var(--step--1); }
.field__error { color: var(--c-danger); font-size: var(--step--1); }
.input, .select, .textarea {
  width: 100%; min-height: var(--target-touch); padding: var(--space-2) var(--space-3);
  border: 1px solid var(--c-border-control); border-radius: var(--radius-s);
  background: var(--c-surface-2); color: var(--c-text); font: inherit;
}
.textarea { min-height: 5.5rem; max-height: 9.5rem; resize: vertical; line-height: 1.45; }
.input[aria-invalid="true"], .textarea[aria-invalid="true"] { border-color: var(--c-danger); }

/* Segmented control: a radio group inside a fieldset */
.segmented { border: 0; padding: 0; margin: 0; min-width: 0; }
.segmented legend { font-weight: 600; margin-bottom: var(--space-1); padding: 0; }
.segmented__options { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.segmented label {
  display: inline-flex; align-items: center; min-height: 36px; min-width: var(--target-min); padding: 0 var(--space-3);
  border: 1px solid var(--c-border-control); border-radius: var(--radius-pill); cursor: pointer; color: var(--c-text-muted);
}
.segmented input { position: absolute; opacity: 0; pointer-events: none; }
.segmented input:checked + span { color: var(--c-text); font-weight: 600; }
.segmented label:has(input:checked) { border-color: var(--c-accent); background: var(--c-surface-hover); }
.segmented label:has(input:focus-visible) { outline: 2px solid var(--c-focus); outline-offset: 2px; }

/* Chips (text, never colour-only) */
.chip {
  display: inline-flex; align-items: center; padding: 0.1rem var(--space-2); border-radius: var(--radius-pill);
  border: 1px solid var(--c-border); color: var(--c-text-muted); font-size: var(--step--1);
}

/* Panels */
.panel {
  background: var(--panel-gradient), var(--c-surface); border: 1px solid var(--c-border);
  border-radius: var(--radius-l); padding: var(--space-5);
}

/* Disclosures */
.disclosure > summary { cursor: pointer; min-height: var(--target-min); color: var(--c-accent); font-weight: 600; list-style-position: inside; }
.disclosure > summary:focus-visible { outline-offset: 4px; }

/* Notices */
.notice { border-left: 3px solid var(--c-accent); background: var(--c-surface-2); padding: var(--space-3) var(--space-4); border-radius: var(--radius-s); }
.notice--warn { border-left-color: var(--c-warm); }
.notice--error { border-left-color: var(--c-danger); }
```

`packages/site-kit/src/styles/layout.css`:
```css
/* Page grid. With ads off no rails render and the column is centred; with ads on, symmetric rails keep it in place (spec §23.4). */
.page { display: grid; grid-template-columns: minmax(0, var(--content-max)); justify-content: center; column-gap: var(--space-6); padding-inline: var(--gutter); }
.page__main { min-width: 0; padding-block: var(--space-6) var(--space-8); }
.ad-rail { display: none; }
.ad-rail__inner { position: sticky; top: var(--space-6); min-height: 600px; }
@media (min-width: 1280px) {
  .page[data-ads="on"] { grid-template-columns: var(--ad-rail) minmax(0, var(--content-max)) var(--ad-rail); }
  .page[data-ads="on"] .ad-rail { display: block; }
}
@media (min-width: 1600px) {
  .page[data-ads="on"] { grid-template-columns: var(--ad-rail-wide) minmax(0, var(--content-max)) var(--ad-rail-wide); }
}
.ad-slot { margin-block: var(--space-6); min-height: var(--ad-slot-min); border: 1px dashed var(--c-border); border-radius: var(--radius-m); padding: var(--space-2); }
.ad-slot__label { color: var(--c-text-faint); font-size: var(--step--1); letter-spacing: var(--tracking-caps); text-transform: uppercase; }

/* Network header and footer */
.network-header { border-bottom: 1px solid var(--c-border); background: var(--c-bg-raised); }
.network-header__inner { max-width: calc(var(--content-max) + 2 * var(--gutter)); margin: 0 auto; padding: var(--space-3) var(--gutter); display: flex; align-items: center; gap: var(--space-3); }
.network-header__crumbs { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; color: var(--c-text-muted); font-size: var(--step--1); margin: 0; padding: 0; list-style: none; }
.network-header__crumbs li + li::before { content: "›"; margin-right: var(--space-2); color: var(--c-text-faint); }
.network-header__crumbs [aria-current="page"] { color: var(--c-text); font-weight: 600; }
.network-header__vps { margin-left: auto; font-size: var(--step--1); white-space: nowrap; }
@media (max-width: 599px) {
  .network-header__crumbs .crumb--network { display: none; }
  .network-header__crumbs .crumb--network + li::before { content: none; }
  .network-header__vps { display: none; }
}
.creator-footer { border-top: 1px solid var(--c-border); color: var(--c-text-muted); font-size: var(--step--1); }
.creator-footer__inner { max-width: calc(var(--content-max) + 2 * var(--gutter)); margin: 0 auto; padding: var(--space-5) var(--gutter); display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-5); }
.network-header a, .creator-footer a { display: inline-flex; align-items: center; min-height: var(--target-min); }
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test packages/site-kit/test/tokens.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/site-kit
git commit -m "Add provisional VPS Creator tokens, base, component and layout styles"
```

---

### Task 30: Network shell components (layout, header, footer, rails, slot, other tools)

**Files:**
- Create: `packages/site-kit/src/components/CreatorLayout.astro`, `NetworkHeader.astro`, `CreatorFooter.astro`, `VpsMark.astro`, `AdRail.astro`, `AdSlot.astro`, `OtherTools.astro`
- Create: `packages/site-kit/test/fixture/astro.config.mjs`, `packages/site-kit/test/fixture/src/pages/index.astro`, `packages/site-kit/test/fixture/src/pages/ads.astro`
- Modify: `packages/site-kit/package.json` (devDependencies `astro`, `linkedom`), root `package.json` test script (see Step 5)
- Test: `packages/site-kit/test/shell.test.ts`

**Interfaces:**
- Consumes: `network`, `tool`, `ads`, `otherCreatorTools`, `OTHER_TOOLS_EMPTY_LINE` (Task 27); CSS (Task 29).
- Produces (Astro props):
  - `CreatorLayout { title: string; description: string; canonical: string; indexing: boolean; adsEnabled?: boolean; ogImage?: string; structuredData?: Record<string, unknown> }` with slots `default` (main content), `head` (extra head tags), `after-main` (content sections below the ad slot)
  - `NetworkHeader {}`; `CreatorFooter {}`; `VpsMark { size?: number }`; `AdRail { side: 'left' | 'right' }`; `AdSlot { enabled: boolean }`; `OtherTools {}`

Rules: with ads off nothing ad-related renders; the slot sits after the shortlist (placed by the page through `<AdSlot>`); the main column never moves; rails are hidden below 1280 px; no ads on mobile except the below-content slot.

- [ ] **Step 1: Write the fixture site and the failing test**

`packages/site-kit/test/fixture/astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
export default defineConfig({ output: 'static', trailingSlash: 'always', outDir: './dist', logLevel: 'error' });
```

`packages/site-kit/test/fixture/src/pages/index.astro`:
```astro
---
import CreatorLayout from '../../../../src/components/CreatorLayout.astro';
import AdSlot from '../../../../src/components/AdSlot.astro';
import OtherTools from '../../../../src/components/OtherTools.astro';
---
<CreatorLayout title="Fixture" description="Fixture page" canonical="https://example.test/" indexing={false}>
  <h1>Fixture</h1>
  <section id="controls">controls</section>
  <section id="results">results</section>
  <section id="shortlist">shortlist</section>
  <AdSlot enabled={false} />
  <OtherTools slot="after-main" />
</CreatorLayout>
```

`packages/site-kit/test/fixture/src/pages/ads.astro`: the same page with `adsEnabled={true}` on the layout and `enabled={true}` on `AdSlot`, and `indexing={true}`.

`packages/site-kit/test/shell.test.ts`:
```ts
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { network, tool, OTHER_TOOLS_EMPTY_LINE } from '../src/index';

const fixture = fileURLToPath(new URL('./fixture/', import.meta.url));
const page = (path: string) => parseHTML(readFileSync(`${fixture}dist/${path}`, 'utf8')).document;

before(() => {
  execFileSync('npx', ['astro', 'build', '--root', fixture], { stdio: 'inherit' });
});

test('header shows the network breadcrumb, the VPS link and the family line in the footer', () => {
  const d = page('index.html');
  const crumbs = [...d.querySelectorAll('.network-header__crumbs li')].map(li => li.textContent?.trim());
  assert.deepEqual(crumbs, [network.networkName, network.section, tool.name]);
  assert.equal(d.querySelector('.network-header__crumbs [aria-current="page"]')?.textContent?.trim(), tool.name);
  assert.equal(d.querySelector('.network-header__vps')?.getAttribute('href'), network.publisherUrl);
  assert.match(d.querySelector('.creator-footer')?.textContent ?? '', new RegExp(network.family));
});

test('skip link, landmarks and noindex when indexing is off', () => {
  const d = page('index.html');
  assert.equal(d.querySelector('a.skip-link')?.getAttribute('href'), '#main');
  assert.ok(d.querySelector('header') && d.querySelector('main#main') && d.querySelector('footer'));
  assert.equal(d.querySelector('meta[name="robots"]')?.getAttribute('content'), 'noindex, nofollow');
  assert.equal(d.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://example.test/');
});

test('with ads off nothing ad-related renders', () => {
  const d = page('index.html');
  assert.equal(d.querySelector('.page')?.getAttribute('data-ads'), 'off');
  assert.equal(d.querySelectorAll('.ad-rail, .ad-slot, [data-ad]').length, 0);
});

test('with ads on: two rails outside main, one labelled slot after the shortlist', () => {
  const d = page('ads/index.html');
  assert.equal(d.querySelector('.page')?.getAttribute('data-ads'), 'on');
  const rails = [...d.querySelectorAll('.ad-rail')];
  assert.equal(rails.length, 2);
  for (const r of rails) assert.equal(r.closest('main'), null);
  const slots = [...d.querySelectorAll('.ad-slot')];
  assert.equal(slots.length, 1);
  assert.match(slots[0].textContent ?? '', /Advertisement/);
  const order = [...d.querySelectorAll('main#main > *')].map(el => el.id || el.className);
  assert.ok(order.indexOf('shortlist') < order.findIndex(x => String(x).includes('ad-slot')), order.join(','));
  assert.ok(order.indexOf('controls') < order.indexOf('results'));
  assert.equal(d.querySelector('meta[name="robots"]'), null);
});

test('Other Free Creator Tools shows the empty line and the VPS link when no tool is released', () => {
  const d = page('index.html');
  const block = d.querySelector('#other-tools');
  assert.match(block?.textContent ?? '', new RegExp(OTHER_TOOLS_EMPTY_LINE));
  assert.ok(block?.querySelector(`a[href="${network.publisherUrl}"]`));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm install -D -w packages/site-kit astro@^7.3.5 linkedom && npx tsx --test packages/site-kit/test/shell.test.ts`
Expected: FAIL (components missing; the build errors).

- [ ] **Step 3: Write the components**

`packages/site-kit/src/components/VpsMark.astro` (provisional monogram until the brand mark is supplied, spec §21 item 5):
```astro
---
interface Props { size?: number }
const { size = 28 } = Astro.props;
---
<svg class="vps-mark" width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="VPS" focusable="false">
  <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="currentColor" stroke-width="1.5" />
  <path d="M8 10 L12.5 22 L17 10 M19.5 22 V10 H23 a3 3 0 0 1 0 6 H19.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

`packages/site-kit/src/components/NetworkHeader.astro`:
```astro
---
import { network, tool } from '../network';
import VpsMark from './VpsMark.astro';
---
<header class="network-header">
  <div class="network-header__inner">
    <VpsMark />
    <nav aria-label="VPS Utility Network">
      <ol class="network-header__crumbs">
        <li class="crumb--network">{network.networkName}</li>
        <li>{network.section}</li>
        <li><span aria-current="page">{tool.name}</span></li>
      </ol>
    </nav>
    <a class="network-header__vps" href={network.publisherUrl} rel="noopener">{network.publisher} ↗</a>
  </div>
</header>
```

`packages/site-kit/src/components/CreatorFooter.astro`:
```astro
---
import { network } from '../network';
---
<footer class="creator-footer">
  <div class="creator-footer__inner">
    <span>{network.family} · <a href={network.publisherUrl} rel="noopener">{network.publisher}</a></span>
    <a href="#privacy">Privacy</a>
  </div>
</footer>
```

`packages/site-kit/src/components/AdRail.astro`:
```astro
---
import { ads } from '../network';
interface Props { side: 'left' | 'right' }
const { side } = Astro.props;
---
<aside class={`ad-rail ad-rail--${side}`} aria-label={ads.slotLabel} data-ad={`rail-${side}`}>
  <div class="ad-rail__inner"><span class="ad-slot__label">{ads.slotLabel}</span></div>
</aside>
```

`packages/site-kit/src/components/AdSlot.astro`:
```astro
---
import { ads } from '../network';
interface Props { enabled: boolean }
const { enabled } = Astro.props;
---
{enabled && (
  <aside class="ad-slot" aria-label={ads.slotLabel} data-ad="below-content">
    <span class="ad-slot__label">{ads.slotLabel}</span>
  </aside>
)}
```

`packages/site-kit/src/components/OtherTools.astro`:
```astro
---
import { network, otherCreatorTools, OTHER_TOOLS_EMPTY_LINE } from '../network';
---
<section id="other-tools" aria-labelledby="other-tools-heading">
  <h2 id="other-tools-heading">Other Free Creator Tools</h2>
  {otherCreatorTools.length > 0 ? (
    <ul class="other-tools">
      {otherCreatorTools.map(t => <li><a href={t.url} rel="noopener">{t.name}</a>: {t.description}</li>)}
    </ul>
  ) : (
    <p>{OTHER_TOOLS_EMPTY_LINE}</p>
  )}
  <p><a href={network.publisherUrl} rel="noopener">{network.publisher}</a></p>
</section>
```

`packages/site-kit/src/components/CreatorLayout.astro`:
```astro
---
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/layout.css';
import { ads } from '../network';
import AdRail from './AdRail.astro';
import CreatorFooter from './CreatorFooter.astro';
import NetworkHeader from './NetworkHeader.astro';

interface Props {
  title: string;
  description: string;
  canonical: string;
  indexing: boolean;
  adsEnabled?: boolean;
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}
const { title, description, canonical, indexing, adsEnabled = ads.enabled, ogImage, structuredData } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {!indexing && <meta name="robots" content="noindex, nofollow" />}
    <meta name="color-scheme" content="dark" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    {ogImage && <meta property="og:image" content={ogImage} />}
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    {structuredData && <script type="application/ld+json" set:html={JSON.stringify(structuredData)} />}
    <slot name="head" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to the generator</a>
    <NetworkHeader />
    <div class="page" data-ads={adsEnabled ? 'on' : 'off'}>
      {adsEnabled && <AdRail side="left" />}
      <main id="main" class="page__main" tabindex="-1">
        <slot />
        <slot name="after-main" />
      </main>
      {adsEnabled && <AdRail side="right" />}
    </div>
    <CreatorFooter />
  </body>
</html>
```
(`set:html` on the JSON-LD script is safe: the data is built at compile time from constants, never from user input.)

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test packages/site-kit/test/shell.test.ts`
Expected: PASS (5 tests). The fixture build takes a few seconds.

- [ ] **Step 5: Keep fixture builds out of the default fast suite where needed, then commit**

The root `npm test` glob already includes `packages/*/test/**/*.test.ts`, so `shell.test.ts` runs in CI (it needs no browser). Add `packages/site-kit/test/fixture/dist/` and `packages/site-kit/test/fixture/.astro/` to `.gitignore`.

```bash
git add -A
git commit -m "Add the creator network shell components with ad-ready layout"
```

---

## M6 — Generator UI (`apps/video-game-name-generator`)

UI rules for every task here (spec §11, §12, §16, §17): native controls; user text reaches the DOM only through `textContent`; every button names its title ("Copy Ashen Oath") through a visually hidden span so the visible label stays inside the accessible name; one polite live region for actions that do not move focus; nothing ad-related between controls and results, inside results, Similar groups or the shortlist; no sticky bars.

### Task 31: App scaffold, page skeleton, headers and the browser-test harness

**Files:**
- Create: `apps/video-game-name-generator/package.json`, `astro.config.mjs`, `tsconfig.json`
- Create: `apps/video-game-name-generator/public/_headers`, `public/favicon.svg`
- Create: `apps/video-game-name-generator/src/pages/index.astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts`
- Create: `apps/video-game-name-generator/src/content.ts`, `src/styles/app.css`
- Create: `apps/video-game-name-generator/test/browser/helpers.mjs`, `test/browser/shell.browser.mjs`
- Modify: root `package.json` (scripts, devDependency `puppeteer-core`), root `tsconfig.json` (`include`), `.gitignore`, `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: site-kit components and config (Tasks 27–30).
- Produces: `PAGE` (title, description, structured data) and `DISCLAIMER`, `PRIVACY` copy constants in `src/content.ts`; browser helpers `open(path, opts?)`, `skip`, `baseUrl()`; root scripts `build`, `check`, `test:browser`.

- [ ] **Step 1: Workspace wiring**

`apps/video-game-name-generator/package.json`:
```json
{
  "name": "@vps-name-tools/video-game-name-generator",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev --host 127.0.0.1",
    "build": "astro build",
    "check": "astro check",
    "preview": "astro preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vps-name-tools/core": "*",
    "@vps-name-tools/data": "*",
    "@vps-name-tools/game-titles": "*",
    "@vps-name-tools/site-kit": "*",
    "astro": "^7.3.5"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "typescript": "^5.9.0"
  }
}
```

`apps/video-game-name-generator/astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
export default defineConfig({ output: 'static', trailingSlash: 'always' });
```

`apps/video-game-name-generator/tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/strict" }
```

Root `package.json` scripts become:
```json
"typecheck": "tsc -p tsconfig.json",
"test": "tsx --test \"packages/*/test/**/*.test.ts\" \"apps/*/test/**/*.test.ts\"",
"build": "npm run build -w apps/video-game-name-generator",
"check": "npm run check -w apps/video-game-name-generator",
"test:browser": "node --test \"apps/video-game-name-generator/test/browser/*.browser.mjs\"",
"validate:data": "tsx scripts/validate-data.ts",
"validate:release": "tsx scripts/validate-data.ts --release",
"build:safety": "tsx scripts/build-safety.ts",
"quality": "tsx scripts/quality.ts",
"golden:update": "tsx scripts/golden-update.ts",
"pack-status": "tsx scripts/pack-status.ts",
"sample:profiles": "tsx scripts/sample-profiles.ts"
```
(Keep any script already added by earlier tasks.) Run `npm install -D puppeteer-core@^24`.

Root `tsconfig.json` `include` becomes:
```json
["packages/*/src/**/*.ts", "packages/*/test/**/*.ts", "scripts/**/*.ts", "apps/*/src/**/*.ts", "apps/*/test/**/*.ts", "apps/*/functions/**/*.ts"]
```

Append to `.gitignore`:
```
apps/*/dist/
packages/site-kit/test/fixture/dist/
packages/site-kit/test/fixture/.astro/
```

Append to `.github/workflows/validate.yml` steps (GitHub's Ubuntu runners ship Google Chrome at `/usr/bin/google-chrome`):
```yaml
      - run: npm run check
      - run: npm run build
      - run: npm run test:browser
        env:
          CI: 'true'
```

- [ ] **Step 2: Headers, robots, sitemap and favicon**

`apps/video-game-name-generator/public/_headers` (staging; the `X-Robots-Tag` line is one of the three `noindex` switches, Task 37 keeps them in agreement):
```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests
  X-Robots-Tag: noindex, nofollow
```

`apps/video-game-name-generator/src/pages/robots.txt.ts`:
```ts
import type { APIRoute } from 'astro';
import { tool } from '@vps-name-tools/site-kit';

export const robotsText = (indexing: boolean): string =>
  indexing ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', tool.canonicalUrl).href}\n` : 'User-agent: *\nDisallow: /\n';

export const GET: APIRoute = () => new Response(robotsText(tool.indexing), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

`apps/video-game-name-generator/src/pages/sitemap.xml.ts`:
```ts
import type { APIRoute } from 'astro';
import { tool } from '@vps-name-tools/site-kit';

export const GET: APIRoute = () => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${tool.canonicalUrl}</loc></url>\n</urlset>\n`,
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
```

`apps/video-game-name-generator/public/favicon.svg` (provisional, matches the VPS mark until the brand mark arrives):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0b0d12"/><path d="M8 10 L12.5 22 L17 10 M19.5 22 V10 H23 a3 3 0 0 1 0 6 H19.5" fill="none" stroke="#6cc4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

- [ ] **Step 3: Copy constants and the page skeleton**

`apps/video-game-name-generator/src/content.ts`:
```ts
import { network, tool } from '@vps-name-tools/site-kit';

export const DISCLAIMER =
  'Generated names are brainstorming suggestions. Check trademarks, existing game titles, domains, and storefronts before commercial use. This tool does not check availability and cannot tell you a name is free to use.';

export const PAGE = {
  title: `${tool.name}: Free Game Title Ideas | ${network.house}`,
  description: 'Generate original video game names from genre, mythology, tone and your own themes. Free, no sign-up, and it runs in your browser.',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: tool.canonicalUrl,
    description: 'A free game title generator that runs in your browser.',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: network.publisher, url: network.publisherUrl },
  },
} as const;
```

`apps/video-game-name-generator/src/pages/index.astro` (skeleton; later tasks fill the sections):
```astro
---
import CreatorLayout from '@vps-name-tools/site-kit/components/CreatorLayout.astro';
import AdSlot from '@vps-name-tools/site-kit/components/AdSlot.astro';
import OtherTools from '@vps-name-tools/site-kit/components/OtherTools.astro';
import { ads, tool } from '@vps-name-tools/site-kit';
import { DISCLAIMER, PAGE } from '../content';
import '../styles/app.css';
---
<CreatorLayout title={PAGE.title} description={PAGE.description} canonical={tool.canonicalUrl} indexing={tool.indexing} structuredData={PAGE.structuredData}>
  <section class="intro" aria-labelledby="page-title">
    <h1 id="page-title">{tool.name}</h1>
    <p class="intro__tagline">{tool.tagline}</p>
    <ul class="intro__badges">{tool.badges.map(b => <li class="chip">{b}</li>)}</ul>
  </section>
  <section id="controls" class="panel generator" aria-label="Generator settings"></section>
  <section id="results" class="results" aria-labelledby="results-heading">
    <p class="disclaimer" id="disclaimer">{DISCLAIMER}</p>
  </section>
  <section id="shortlist" class="shortlist-section"></section>
  <AdSlot enabled={ads.enabled} />
  <OtherTools slot="after-main" />
</CreatorLayout>
```

`apps/video-game-name-generator/src/pages/404.astro`:
```astro
---
import CreatorLayout from '@vps-name-tools/site-kit/components/CreatorLayout.astro';
import { tool } from '@vps-name-tools/site-kit';
import '../styles/app.css';
---
<CreatorLayout title={`Page not found | ${tool.name}`} description="This page does not exist." canonical={tool.canonicalUrl} indexing={false}>
  <h1>Page not found</h1>
  <p>This page does not exist. <a href="/">Go to the {tool.name}</a>.</p>
</CreatorLayout>
```

`apps/video-game-name-generator/src/styles/app.css` (all app components; tokens only, no raw colours):
```css
.intro { margin-bottom: var(--space-5); }
.intro__tagline { font-size: var(--step-1); color: var(--c-text-muted); margin-bottom: var(--space-3); }
.intro__badges { display: flex; flex-wrap: wrap; gap: var(--space-2); list-style: none; margin: 0; padding: 0; }

.generator { display: grid; gap: var(--space-5); }
.generator__grid { display: grid; gap: var(--space-4); grid-template-columns: minmax(0, 1fr); }
.field--wide { grid-column: 1 / -1; }
.field--tone2[hidden] { display: none; }
.textarea--themes { field-sizing: content; min-height: 4.5rem; max-height: calc(5 * 1.45em + 1rem); }
.link-button { background: none; border: 0; padding: 0; min-height: var(--target-min); color: var(--c-accent); font: inherit; font-size: var(--step--1); cursor: pointer; text-align: left; }
.fine-tune__summary { color: var(--c-text-muted); font-weight: 400; margin-left: var(--space-2); }
.fine-tune__body { display: grid; gap: var(--space-4); margin-top: var(--space-3); }
.generator__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.generator__actions .btn--primary { min-width: 12rem; }

.results { margin-top: var(--space-6); }
.results__empty p { color: var(--c-text-muted); margin-bottom: var(--space-2); }
.results__examples { display: flex; flex-wrap: wrap; gap: var(--space-2); list-style: none; margin: 0 0 var(--space-5); padding: 0; }
.chip--button { min-height: 36px; background: transparent; cursor: pointer; font: inherit; font-size: var(--step--1); }
.chip--button:hover { border-color: var(--c-accent); color: var(--c-text); }
.results__header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: var(--space-3); margin-bottom: var(--space-4); }
.results__header h2 { font-size: var(--step-2); margin: 0; }
.results__header h2:focus { outline: none; }
.results__header h2:focus-visible { outline: 2px solid var(--c-focus); }
.results__tools { display: flex; gap: var(--space-3); align-items: center; }
.results__jump { display: inline-flex; align-items: center; min-height: var(--target-min); }
.notices:empty { display: none; }
.notices { margin-bottom: var(--space-4); display: grid; gap: var(--space-2); }
.results__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-4); grid-template-columns: minmax(0, 1fr); }
.results__again { margin-top: var(--space-5); }
.disclaimer { margin-top: var(--space-5); color: var(--c-text-muted); font-size: var(--step--1); border-top: 1px solid var(--c-border); padding-top: var(--space-4); }

.result-card { background: var(--panel-gradient), var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-l); padding: var(--space-4); display: grid; gap: var(--space-2); align-content: start; }
.result-card__title { font-family: var(--font-display); font-size: var(--step-3); letter-spacing: var(--tracking-display); margin: 0; overflow-wrap: anywhere; }
.result-card__chips { display: flex; flex-wrap: wrap; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
.result-card__note { color: var(--c-text-muted); font-size: var(--step--1); margin: 0; }
.result-card__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); align-items: flex-start; }
.btn[aria-pressed="true"] .btn__icon::before { content: "♥"; }
.btn__icon::before { content: "♡"; }
.check > summary { list-style: none; }
.check > summary::-webkit-details-marker { display: none; }
.check__links { list-style: none; margin: var(--space-2) 0 0; padding: 0; display: grid; gap: var(--space-1); }
.check__links a { display: inline-flex; min-height: var(--target-min); align-items: center; }
.check__note { color: var(--c-text-faint); font-size: var(--step--1); margin: var(--space-1) 0 0; }

.similar { border-top: 1px solid var(--c-border); margin-top: var(--space-3); padding-top: var(--space-3); }
.similar__heading { font-size: var(--step-0); margin: 0 0 var(--space-2); color: var(--c-text-muted); }
.similar__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
.similar-item { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.similar-item__title { font-family: var(--font-display); font-size: var(--step-1); margin-right: auto; overflow-wrap: anywhere; }

.shortlist-section { margin-top: var(--space-7); }
.shortlist > summary { list-style: none; cursor: pointer; }
.shortlist > summary::-webkit-details-marker { display: none; }
.shortlist__heading { display: inline; font-size: var(--step-2); }
.shortlist__header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--space-3); margin: var(--space-3) 0; }
.shortlist__tools { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
.shortlist__note { color: var(--c-text-muted); font-size: var(--step--1); }
.shortlist__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
.shortlist-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-1) var(--space-3); align-items: center; padding: var(--space-3); border: 1px solid var(--c-border); border-radius: var(--radius-m); background: var(--c-surface); }
.shortlist-item__title { font-family: var(--font-display); font-size: var(--step-1); overflow-wrap: anywhere; }
.shortlist-item__meta { grid-column: 1; color: var(--c-text-muted); font-size: var(--step--1); }
.shortlist-item__actions { grid-column: 2; grid-row: 1 / span 2; display: flex; flex-wrap: wrap; gap: var(--space-1); justify-content: flex-end; }
.shortlist-item .similar { grid-column: 1 / -1; }
.menu > summary { list-style: none; }
.menu > summary::-webkit-details-marker { display: none; }
.menu__items { display: grid; gap: var(--space-1); margin-top: var(--space-2); }
.confirm { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; padding: var(--space-3); border: 1px solid var(--c-warm); border-radius: var(--radius-m); }
.confirm[hidden] { display: none; }

.info { margin-top: var(--space-7); display: grid; gap: var(--space-6); }
.info h2 { font-size: var(--step-2); }
.info ul { padding-left: 1.2em; }
#other-tools { margin-top: var(--space-7); }
```

- [ ] **Step 3b: Browser harness and the failing shell test**

`apps/video-game-name-generator/test/browser/helpers.mjs`:
```js
// Browser test harness. Run after `npm run build`: `npm run test:browser`.
// Serves dist/ like Cloudflare Pages (directory indexes, real 404 page, production headers from _headers),
// so every test runs under the real Content-Security-Policy. Set CHROME_PATH if Chrome is not found.
// Set BASE_URL to smoke-test a deployed site instead of the local build.
import { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
export const chrome = process.env.CHROME_PATH ?? ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
export const skip = !chrome && 'Chrome not found; set CHROME_PATH to run browser tests.';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.json': 'application/json' };
let server, browser, base, headers = {};

async function resolve(url) {
  let path = normalize(join(dist, decodeURIComponent(url.split('?')[0])));
  if (!path.startsWith(dist)) return null;
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    await stat(path);
    return path;
  } catch {
    return null;
  }
}

export function useBrowser() {
  before(async () => {
    if (skip) return;
    const args = process.env.CI ? ['--no-sandbox'] : [];
    if (process.env.BASE_URL) {
      base = process.env.BASE_URL.replace(/\/+$/, '');
      browser = await puppeteer.launch({ executablePath: chrome, headless: true, args });
      return;
    }
    assert.ok(existsSync(join(dist, 'index.html')), 'Build the site first: npm run build');
    headers = Object.fromEntries((await readFile(join(dist, '_headers'), 'utf8')).split(/\r?\n/).filter(l => /^\s+\S+:/.test(l))
      .map(l => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
    assert.match(headers['Content-Security-Policy'] ?? '', /script-src 'self'/);
    server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/api/e') { res.writeHead(204); res.end(); return; }
      const file = await resolve(req.url ?? '/');
      if (!file) { res.writeHead(404, { 'content-type': types['.html'], ...headers }); res.end(await readFile(join(dist, '404.html'))); return; }
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', ...headers });
      res.end(await readFile(file));
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args });
  });
  after(async () => {
    await browser?.close();
    server?.close();
  });
}

export const baseUrl = () => base;

/** Fresh profile per call. Records page errors, console errors and CSP violations in `errors`. */
export async function open(path = '/', { width = 1280, height = 900, reducedMotion = false, context } = {}) {
  const ctx = context ?? await browser.createBrowserContext();
  await ctx.overridePermissions(base, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.evaluateOnNewDocument(() => document.addEventListener('securitypolicyviolation', e => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`)));
  await page.setViewport({ width, height });
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  return { page, errors, context: ctx };
}

/** Clicks Generate and waits for a batch. */
export async function generate(page) {
  await page.click('#generate');
  await page.waitForFunction(() => document.querySelectorAll('#results-list > li').length > 0 && !document.querySelector('#results-body')?.hidden);
}

export const titles = page => page.$$eval('#results-list > li .result-card__title', els => els.map(e => e.textContent));
export const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
```

`apps/video-game-name-generator/test/browser/shell.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, noHorizontalScroll } from './helpers.mjs';

useBrowser();

test('the page loads cleanly under the real CSP', { skip }, async () => {
  const { page, errors } = await open('/');
  assert.equal(await page.$eval('h1', h => h.textContent), 'Video Game Name Generator');
  assert.equal(await page.title(), 'Video Game Name Generator: Free Game Title Ideas | VPS');
  assert.equal(await page.$eval('meta[name="robots"]', m => m.content), 'noindex, nofollow');
  assert.equal(await page.$$eval('script:not([src]):not([type="application/ld+json"])', s => s.length), 0, 'no inline executable scripts');
  assert.deepEqual(errors, []);
});

test('no horizontal scroll at 320 and 360 px', { skip }, async () => {
  for (const width of [320, 360]) {
    const { page } = await open('/', { width, height: 740 });
    assert.ok(await noHorizontalScroll(page), `width ${width}`);
  }
});

test('unknown paths get the 404 page', { skip }, async () => {
  const { page } = await open('/nope/');
  assert.equal(await page.$eval('h1', h => h.textContent), 'Page not found');
});

test('robots.txt disallows everything while indexing is off', { skip }, async () => {
  const { page } = await open('/robots.txt');
  assert.match(await page.evaluate(() => document.body.textContent), /Disallow: \//);
});
```

- [ ] **Step 4: Build and run**

Run: `npm install && npm run check && npm run build && npm run test:browser`
Expected: build succeeds; 4 browser tests pass (no errors, no CSP violations). If a CSP violation names an inline script, move that code into an imported module; never widen the CSP.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Scaffold the generator app with headers, robots, sitemap and browser tests"
```

---

### Task 32: Generator form

**Files:**
- Create: `apps/video-game-name-generator/src/form-options.ts`, `src/components/GeneratorForm.astro`, `src/scripts/form.ts`, `src/scripts/keys.ts`, `src/scripts/main.ts`
- Modify: `src/pages/index.astro` (replace the `#controls` placeholder with `<GeneratorForm />`; add `<script>import '../scripts/main';</script>` after the layout)
- Test: `apps/video-game-name-generator/test/form.test.ts`, `test/browser/form.browser.mjs`

**Interfaces:**
- Consumes: `GENRES`, `GENRE_GROUPS`, `STYLES`, `DEFAULT_SETTINGS`, `normalizeSettings`, `Settings`, `LENGTH_OPTIONS`, `CREATIVITY_LEVELS`, `RESULT_COUNTS` (game-titles); `DATA`, `MYTH_GROUPS` (data); `parseAvoid`, `violatesAvoid`, `createRng`, `randomSeed` (core); `createJsonStore`, `safeLocalStorage`, `storageKeys` (site-kit).
- Produces:
  - `form-options.ts`: `GENRE_OPTIONS: { group: string; options: { value: string; label: string }[] }[]`, `MYTH_OPTIONS` (same shape; held packs excluded), `TONE_OPTIONS`, `STYLE_OPTIONS`, `LENGTH_LABELS`, `CREATIVITY_LABELS`, `labelOf(kind, id): string`
  - `form.ts`: `settingsFromEntries(entries: Iterable<[string, unknown]>): Settings`, `readForm(form: HTMLFormElement): Settings`, `writeForm(form: HTMLFormElement, s: Settings): void`, `fineTuneSummary(s: Settings): string`, `interface FieldError { field: 'include' | 'avoid'; message: string }`, `formErrors(s: Settings): FieldError[]`, `surprise(seed: string, s: Settings, choices: { myths: readonly string[]; tones: readonly string[] }): Settings`, `optionValues(select: HTMLSelectElement, exclude?: readonly string[]): string[]`, `EXAMPLES: readonly { label: string; settings: Partial<Settings> }[]`
  - `keys.ts`: `submitOnCtrlEnter(textarea: HTMLTextAreaElement, form: HTMLFormElement): void`
  - `main.ts`: page bootstrap (later tasks extend it)

- [ ] **Step 1: Write the failing unit test**

`apps/video-game-name-generator/test/form.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, GENRE_IDS } from '@vps-name-tools/game-titles';
import { DATA } from '@vps-name-tools/data';
import { GENRE_OPTIONS, MYTH_OPTIONS, STYLE_OPTIONS, TONE_OPTIONS } from '../src/form-options';
import { EXAMPLES, fineTuneSummary, formErrors, settingsFromEntries, surprise } from '../src/scripts/form';

test('option lists cover the catalogues, grouped', () => {
  assert.equal(GENRE_OPTIONS.flatMap(g => g.options).length, GENRE_IDS.length);
  const myths = MYTH_OPTIONS.flatMap(g => g.options).map(o => o.value);
  const usable = DATA.myths.filter(m => m.review.status !== 'held').map(m => m.id);
  assert.deepEqual([...myths].sort(), [...usable].sort());
  assert.equal(MYTH_OPTIONS[0].options[0].value, 'none');
  assert.equal(TONE_OPTIONS[0].value, 'auto');
  assert.equal(TONE_OPTIONS.length, 20);
  assert.equal(STYLE_OPTIONS[0].value, 'auto');
  assert.equal(STYLE_OPTIONS.length, 14);
});

test('settingsFromEntries normalises form values', () => {
  const s = settingsFromEntries([['genre', 'horror'], ['count', '20'], ['themes', ' ravens '], ['bogus', 'x']]);
  assert.equal(s.genre, 'horror');
  assert.equal(s.count, 20);
  assert.equal(s.myth, DEFAULT_SETTINGS.myth);
});

test('the fine-tune summary names the current values', () => {
  assert.equal(fineTuneSummary(DEFAULT_SETTINGS), 'Any length · Balanced · 10 results');
  assert.equal(fineTuneSummary({ ...DEFAULT_SETTINGS, length: 'one', creativity: 'wild', count: 5, include: 'Aeternum', avoid: 'frost, ash' }),
    '1 word · Wild · 5 results · includes Aeternum · avoids 2');
});

test('an Include word that is also avoided is a field error on both fields', () => {
  const errors = formErrors({ ...DEFAULT_SETTINGS, include: 'Ash', avoid: 'ash*' });
  assert.deepEqual(errors.map(e => e.field), ['include', 'avoid']);
  assert.match(errors[0].message, /also on your Avoid list/);
  assert.deepEqual(formErrors({ ...DEFAULT_SETTINGS, include: 'Ash', avoid: 'frost' }), []);
});

test('surprise changes only genre, myth and tones, deterministically per seed', () => {
  const base = { ...DEFAULT_SETTINGS, themes: 'ravens', count: 20 as const };
  const choices = { myths: DATA.myths.filter(m => m.review.status !== 'held').map(m => m.id), tones: DATA.tones.map(t => t.id) };
  const a = surprise('s1', base, choices);
  assert.deepEqual(surprise('s1', base, choices), a);
  assert.equal(a.themes, 'ravens');
  assert.equal(a.count, 20);
  assert.ok(DATA.myths.find(m => m.id === a.myth)?.review.status !== 'held');
});

test('three example presets from spec §11.5', () => {
  assert.deepEqual(EXAMPLES.map(e => e.label), ['Norse survival', 'Cozy creature collector', 'Analog horror']);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/form.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement the option lists and form logic**

`apps/video-game-name-generator/src/form-options.ts`:
```ts
import { DATA, MYTH_GROUPS } from '@vps-name-tools/data';
import { CREATIVITY_LEVELS, GENRES, GENRE_GROUPS, LENGTH_OPTIONS, STYLES, type Creativity, type LengthOption } from '@vps-name-tools/game-titles';

export interface Option { readonly value: string; readonly label: string }
export interface OptionGroup { readonly group: string; readonly options: readonly Option[] }

export const GENRE_OPTIONS: readonly OptionGroup[] = GENRE_GROUPS.map(group => ({
  group,
  options: GENRES.filter(g => g.group === group).map(g => ({ value: g.id, label: g.label })),
})).filter(g => g.options.length > 0);

/** Held packs are withheld from the selector (Revision 2, decision 1). */
export const MYTH_OPTIONS: readonly OptionGroup[] = MYTH_GROUPS.map(group => ({
  group,
  options: DATA.myths.filter(m => m.group === group && m.review.status !== 'held').map(m => ({ value: m.id, label: m.label })),
})).filter(g => g.options.length > 0);

export const TONE_OPTIONS: readonly Option[] = [{ value: 'auto', label: 'Auto (genre default)' }, ...DATA.tones.map(t => ({ value: t.id, label: t.label }))];
export const TONE2_OPTIONS: readonly Option[] = [{ value: 'none', label: 'None' }, ...DATA.tones.map(t => ({ value: t.id, label: t.label }))];
export const STYLE_OPTIONS: readonly Option[] = [{ value: 'auto', label: 'Auto (mixed)' }, ...STYLES.map(s => ({ value: s.id, label: s.label }))];

export const LENGTH_LABELS: Readonly<Record<LengthOption, string>> = { any: 'Any', one: '1 word', short: 'Short', medium: 'Medium', long: 'Long' };
export const CREATIVITY_LABELS: Readonly<Record<Creativity, string>> = { focused: 'Focused', balanced: 'Balanced', wild: 'Wild' };
export const LENGTH_CHOICES = LENGTH_OPTIONS.map(v => ({ value: v, label: LENGTH_LABELS[v] }));
export const CREATIVITY_CHOICES = CREATIVITY_LEVELS.map(v => ({ value: v, label: CREATIVITY_LABELS[v] }));

export const toneLabel = (id: string) => DATA.tones.find(t => t.id === id)?.label ?? id;
```

`apps/video-game-name-generator/src/scripts/form.ts`:
```ts
import { createRng, parseAvoid, violatesAvoid } from '@vps-name-tools/core';
import { GENRE_IDS, normalizeSettings, type Settings } from '@vps-name-tools/game-titles';
import { CREATIVITY_LABELS, LENGTH_LABELS } from '../form-options';

export function settingsFromEntries(entries: Iterable<[string, unknown]>): Settings {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of entries) raw[k] = v;
  return normalizeSettings(raw);
}

export const readForm = (form: HTMLFormElement): Settings => settingsFromEntries(new FormData(form).entries());

export function writeForm(form: HTMLFormElement, s: Settings): void {
  for (const [name, value] of Object.entries(s)) {
    const el = form.elements.namedItem(name);
    if (el instanceof RadioNodeList) {
      for (const r of el) if (r instanceof HTMLInputElement) r.checked = r.value === String(value);
    } else if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = String(value);
    }
  }
}

export function fineTuneSummary(s: Settings): string {
  const parts = [s.length === 'any' ? 'Any length' : LENGTH_LABELS[s.length], CREATIVITY_LABELS[s.creativity], `${s.count} results`];
  if (s.include.trim()) parts.push(`includes ${s.include.trim()}`);
  const avoid = parseAvoid(s.avoid).length;
  if (avoid) parts.push(`avoids ${avoid}`);
  return parts.join(' · ');
}

export interface FieldError { readonly field: 'include' | 'avoid'; readonly message: string }

export function formErrors(s: Settings): FieldError[] {
  const include = s.include.trim();
  if (!include) return [];
  const rule = violatesAvoid(include, [include], parseAvoid(s.avoid));
  if (!rule) return [];
  return [
    { field: 'include', message: `"${include}" is also on your Avoid list. Remove it from one of them to generate titles.` },
    { field: 'avoid', message: `Your Avoid list blocks your Include word ("${rule.value}").` },
  ];
}

/** "Surprise me": random genre, cultural style and tone; everything else stays (spec §3 item 4). Choices come from the rendered selects. */
export function surprise(seed: string, s: Settings, choices: { myths: readonly string[]; tones: readonly string[] }): Settings {
  const rng = createRng(`surprise:${seed}`);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];
  return normalizeSettings({ ...s, genre: pick(GENRE_IDS), myth: pick(choices.myths), tone: pick(choices.tones), tone2: 'none' });
}

export const optionValues = (select: HTMLSelectElement, exclude: readonly string[] = []): string[] =>
  [...select.options].map(o => o.value).filter(v => !exclude.includes(v));

export const EXAMPLES: readonly { label: string; settings: Partial<Settings> }[] = [
  { label: 'Norse survival', settings: { genre: 'survival', myth: 'norse', tone: 'grim', themes: 'long winter, ravens, oath, northern lights' } },
  { label: 'Cozy creature collector', settings: { genre: 'creature-collector', myth: 'fairy-tale', tone: 'cozy', tone2: 'playful', themes: 'cute creatures, islands, collecting, friendship' } },
  { label: 'Analog horror', settings: { genre: 'psychological-horror', myth: 'none', tone: 'mysterious', tone2: 'melancholic', creativity: 'focused', themes: 'abandoned radio tower, analog horror, snowstorm, missing hikers' } },
];
```

`apps/video-game-name-generator/src/scripts/keys.ts`:
```ts
/** Ctrl/Cmd+Enter in the themes field submits the form (spec §16). No single-key shortcuts. */
export function submitOnCtrlEnter(textarea: HTMLTextAreaElement, form: HTMLFormElement): void {
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}
```

- [ ] **Step 4: The form component**

`apps/video-game-name-generator/src/components/GeneratorForm.astro`:
```astro
---
import { DEFAULT_SETTINGS, INPUT_LIMITS, RESULT_COUNTS } from '@vps-name-tools/game-titles';
import { CREATIVITY_CHOICES, GENRE_OPTIONS, LENGTH_CHOICES, MYTH_OPTIONS, STYLE_OPTIONS, TONE2_OPTIONS, TONE_OPTIONS } from '../form-options';
import { fineTuneSummary } from '../scripts/form';
const d = DEFAULT_SETTINGS;
---
<form id="generator" class="panel generator" aria-label="Generator settings" novalidate>
  <div class="generator__grid">
    <div class="field">
      <label class="field__label" for="f-genre">Genre</label>
      <select class="select" id="f-genre" name="genre">
        {GENRE_OPTIONS.map(g => <optgroup label={g.group}>{g.options.map(o => <option value={o.value} selected={o.value === d.genre}>{o.label}</option>)}</optgroup>)}
      </select>
    </div>
    <div class="field">
      <label class="field__label" for="f-myth">Mythology / Culture</label>
      <select class="select" id="f-myth" name="myth" aria-describedby="myth-hint">
        {MYTH_OPTIONS.map(g => <optgroup label={g.group}>{g.options.map(o => <option value={o.value} selected={o.value === d.myth}>{o.label}</option>)}</optgroup>)}
      </select>
      <span class="field__hint" id="myth-hint">Inspires imagery and sound. Never deity names.</span>
    </div>
    <div class="field">
      <label class="field__label" for="f-tone">Tone</label>
      <select class="select" id="f-tone" name="tone">
        {TONE_OPTIONS.map(o => <option value={o.value} selected={o.value === d.tone}>{o.label}</option>)}
      </select>
      <button type="button" class="link-button" id="add-tone2" aria-expanded="false" aria-controls="tone2-field">+ add a second tone</button>
    </div>
    <div class="field field--tone2" id="tone2-field" hidden>
      <label class="field__label" for="f-tone2">Second tone</label>
      <select class="select" id="f-tone2" name="tone2">
        {TONE2_OPTIONS.map(o => <option value={o.value} selected={o.value === d.tone2}>{o.label}</option>)}
      </select>
    </div>
    <div class="field">
      <label class="field__label" for="f-style">Naming style</label>
      <select class="select" id="f-style" name="style">
        {STYLE_OPTIONS.map(o => <option value={o.value} selected={o.value === d.style}>{o.label}</option>)}
      </select>
    </div>
    <div class="field field--wide">
      <label class="field__label" for="f-themes">Themes, words, lore or vibe</label>
      <textarea class="textarea textarea--themes" id="f-themes" name="themes" rows="3" maxlength={INPUT_LIMITS.themes}
        placeholder="frozen kingdom, ravens, blood oath…" aria-describedby="themes-hint"></textarea>
      <span class="field__hint" id="themes-hint">Separate ideas with commas. Your words steer the results without appearing in every title. Ctrl+Enter generates.</span>
    </div>
  </div>

  <details class="fine-tune disclosure" id="fine-tune">
    <summary><span>Fine-tune</span><span class="fine-tune__summary" id="fine-tune-summary">{fineTuneSummary(d)}</span></summary>
    <div class="fine-tune__body">
      <fieldset class="segmented">
        <legend>Length</legend>
        <div class="segmented__options">
          {LENGTH_CHOICES.map(o => <label><input type="radio" name="length" value={o.value} checked={o.value === d.length} /><span>{o.label}</span></label>)}
        </div>
      </fieldset>
      <fieldset class="segmented">
        <legend>Creativity</legend>
        <div class="segmented__options">
          {CREATIVITY_CHOICES.map(o => <label><input type="radio" name="creativity" value={o.value} checked={o.value === d.creativity} /><span>{o.label}</span></label>)}
        </div>
      </fieldset>
      <fieldset class="segmented">
        <legend>Results</legend>
        <div class="segmented__options">
          {RESULT_COUNTS.map(n => <label><input type="radio" name="count" value={String(n)} checked={n === d.count} /><span>{n}</span></label>)}
        </div>
      </fieldset>
      <details class="disclosure" id="more-options">
        <summary>More options: Include word · Avoid words</summary>
        <div class="fine-tune__body">
          <div class="field">
            <label class="field__label" for="f-include">Include this word</label>
            <input class="input" id="f-include" name="include" type="text" maxlength={INPUT_LIMITS.include} autocomplete="off" autocorrect="off"
              autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-describedby="include-hint include-error" />
            <span class="field__hint" id="include-hint">Every title will contain this word or name.</span>
            <p class="field__error" id="include-error" hidden></p>
          </div>
          <div class="field">
            <label class="field__label" for="f-avoid">Avoid these words</label>
            <input class="input" id="f-avoid" name="avoid" type="text" maxlength={INPUT_LIMITS.avoid} autocomplete="off" autocorrect="off"
              autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-describedby="avoid-hint avoid-error" />
            <span class="field__hint" id="avoid-hint">Comma-separated. <code>word</code> · <code>"exact phrase"</code> · <code>frost*</code> starts with · <code>*heim</code> ends with · <code>*grim*</code> contains.</span>
            <p class="field__error" id="avoid-error" hidden></p>
          </div>
        </div>
      </details>
    </div>
  </details>

  <div class="generator__actions">
    <button type="submit" class="btn btn--primary" id="generate">Generate titles</button>
    <button type="button" class="btn btn--ghost" id="surprise">Surprise me</button>
    <button type="button" class="btn btn--ghost" id="reset">Reset</button>
  </div>
</form>
```

Add to `src/styles/app.css` (fine-tune always open from 600 px, where `::details-content` is supported; the script opens it as a fallback):
```css
@media (min-width: 600px) {
  .fine-tune > summary { display: none; }
  .fine-tune::details-content { content-visibility: visible; }
  .generator__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .generator__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

- [ ] **Step 5: Bootstrap script**

`apps/video-game-name-generator/src/scripts/main.ts`:
```ts
import { normalizeSettings, DEFAULT_SETTINGS, type Settings } from '@vps-name-tools/game-titles';
import { createJsonStore, safeLocalStorage, storageKeys } from '@vps-name-tools/site-kit';
import { fineTuneSummary, formErrors, optionValues, readForm, surprise, writeForm, type FieldError } from './form';
import { submitOnCtrlEnter } from './keys';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('generator');
const fineTune = $<HTMLDetailsElement>('fine-tune');
const tone2Field = $<HTMLDivElement>('tone2-field');
const addTone2 = $<HTMLButtonElement>('add-tone2');
const { store: kv } = safeLocalStorage();
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const settingsStore = createJsonStore<Record<string, unknown>>(kv, storageKeys.settings, isObject, { ...DEFAULT_SETTINGS });

const desktop = window.matchMedia('(min-width: 600px)');
const syncDisclosures = () => { if (desktop.matches) fineTune.open = true; };
desktop.addEventListener('change', syncDisclosures);

function showTone2(show: boolean) {
  tone2Field.hidden = !show;
  addTone2.setAttribute('aria-expanded', String(show));
  addTone2.textContent = show ? '− remove the second tone' : '+ add a second tone';
  if (!show) (form.elements.namedItem('tone2') as HTMLSelectElement).value = 'none';
}

function showErrors(errors: readonly FieldError[]) {
  for (const field of ['include', 'avoid'] as const) {
    const input = form.elements.namedItem(field) as HTMLInputElement;
    const box = $<HTMLParagraphElement>(`${field}-error`);
    const e = errors.find(x => x.field === field);
    box.hidden = !e;
    box.textContent = e?.message ?? '';
    if (e) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
  if (errors.length) {
    fineTune.open = true;
    $<HTMLDetailsElement>('more-options').open = true;
  }
}

export function currentSettings(): Settings {
  return readForm(form);
}

function refresh() {
  const s = currentSettings();
  $('fine-tune-summary').textContent = fineTuneSummary(s);
  settingsStore.write({ ...s });
  return s;
}

export function applySettings(s: Settings) {
  writeForm(form, s);
  showTone2(s.tone2 !== 'none');
  refresh();
}

/** Called by later tasks; returns false when field errors block generation. */
export const handlers = { onGenerate: (_s: Settings) => {} };

form.addEventListener('submit', e => {
  e.preventDefault();
  const s = refresh();
  const errors = formErrors(s);
  showErrors(errors);
  if (errors.length) {
    (form.elements.namedItem('include') as HTMLInputElement).focus();
    return;
  }
  handlers.onGenerate(s);
});
form.addEventListener('change', () => { refresh(); showErrors([]); });
form.addEventListener('input', () => refresh());
addTone2.addEventListener('click', () => showTone2(tone2Field.hidden));
$('surprise').addEventListener('click', () => {
  const choices = { myths: optionValues($<HTMLSelectElement>('f-myth')), tones: optionValues($<HTMLSelectElement>('f-tone'), ['auto']) };
  applySettings(surprise(String(Date.now()), currentSettings(), choices));
  form.requestSubmit();
});
$('reset').addEventListener('click', () => {
  applySettings(DEFAULT_SETTINGS);
  showErrors([]);
});
submitOnCtrlEnter($<HTMLTextAreaElement>('f-themes'), form);

applySettings(normalizeSettings(settingsStore.read()));
syncDisclosures();
```

In `src/pages/index.astro` replace the `#controls` placeholder with `<GeneratorForm />` (import it) and add `<script>import '../scripts/main';</script>` at the end of the file.

- [ ] **Step 6: The failing browser test**

`apps/video-game-name-generator/test/browser/form.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip } from './helpers.mjs';

useBrowser();
const value = (page, sel) => page.$eval(sel, el => el.value);
const checked = (page, name) => page.$eval(`input[name="${name}"]:checked`, el => el.value);

test('defaults: Fantasy · None · Auto · Auto · Any · Balanced · 10', { skip }, async () => {
  const { page, errors } = await open('/');
  assert.deepEqual([await value(page, '#f-genre'), await value(page, '#f-myth'), await value(page, '#f-tone'), await value(page, '#f-style')],
    ['fantasy', 'none', 'auto', 'auto']);
  assert.deepEqual([await checked(page, 'length'), await checked(page, 'creativity'), await checked(page, 'count')], ['any', 'balanced', '10']);
  assert.ok(await page.$$eval('#f-genre optgroup', g => g.length) >= 8);
  assert.deepEqual(errors, []);
});

test('settings persist across reloads', { skip }, async () => {
  const { page } = await open('/');
  await page.select('#f-genre', 'cyberpunk');
  await page.click('label:has(input[name="creativity"][value="wild"])');
  await page.type('#f-themes', 'neon rain');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await value(page, '#f-genre'), 'cyberpunk');
  assert.equal(await checked(page, 'creativity'), 'wild');
  assert.equal(await value(page, '#f-themes'), 'neon rain');
});

test('second tone appears on request', { skip }, async () => {
  const { page } = await open('/');
  assert.equal(await page.$eval('#tone2-field', el => el.hidden), true);
  await page.click('#add-tone2');
  assert.equal(await page.$eval('#add-tone2', el => el.getAttribute('aria-expanded')), 'true');
  assert.equal(await page.$eval('#tone2-field', el => el.hidden), false);
});

test('Include on the Avoid list shows inline errors tied to the fields', { skip }, async () => {
  const { page } = await open('/');
  await page.type('#f-include', 'Ash');
  await page.type('#f-avoid', 'ash');
  await page.click('#generate');
  assert.equal(await page.$eval('#f-include', el => el.getAttribute('aria-invalid')), 'true');
  assert.match(await page.$eval('#include-error', el => el.textContent), /also on your Avoid list/);
  assert.equal(await page.$eval('#include-error', el => el.hidden), false);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'f-include');
});

test('on mobile Fine-tune is collapsed with a summary; on desktop it is open', { skip }, async () => {
  const mobile = await open('/', { width: 360, height: 740 });
  assert.equal(await mobile.page.$eval('#fine-tune', d => d.open), false);
  assert.equal(await mobile.page.$eval('#fine-tune-summary', el => el.textContent), 'Any length · Balanced · 10 results');
  const desktop = await open('/', { width: 1280 });
  assert.equal(await desktop.page.$eval('#fine-tune', d => d.open), true);
});

test('Reset restores defaults', { skip }, async () => {
  const { page } = await open('/');
  await page.select('#f-genre', 'western');
  await page.click('#reset');
  assert.equal(await value(page, '#f-genre'), 'fantasy');
});
```

- [ ] **Step 7: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/form.test.ts && npm run check && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add the generator form with saved settings and inline validation"
```

---

### Task 33: Results panel, Copy, Copy all and the empty state

**Files:**
- Create: `apps/video-game-name-generator/src/components/ResultsPanel.astro`, `src/components/ResultTemplates.astro`, `src/scripts/results.ts`, `src/scripts/clipboard.ts`, `src/scripts/announce.ts`, `src/scripts/recent.ts`
- Modify: `src/pages/index.astro` (replace the `#results` placeholder with `<ResultsPanel />`, add `<ResultTemplates />` inside the layout), `src/scripts/main.ts`
- Test: `apps/video-game-name-generator/test/results.test.ts`, `test/browser/results.browser.mjs`

**Interfaces:**
- Consumes: `generate`, `titleKey`, `GenerateResult`, `TitleResult` (game-titles); `toneLabel` (Task 32); form bootstrap `handlers`, `applySettings` (Task 32).
- Produces:
  - `recent.ts`: `class RecentTitles { constructor(max?: number); add(titles: Iterable<string>): void; set(): ReadonlySet<string> }` (max 500, memory only)
  - `results.ts`: `resultsHeading(batch: GenerateResult, tones: readonly string[]): string`, `chipLabels(r: TitleResult): string[]`, `interface CardHooks { onCopy(r: TitleResult): void; onSave(r: TitleResult, button: HTMLButtonElement): void; isSaved(id: string): boolean; onSimilar(r: TitleResult, card: HTMLElement, button: HTMLButtonElement): void; onCheck(r: TitleResult, link: 'google' | 'steam' | 'itch'): void }`, `renderCard(r: TitleResult, index: number, hooks: CardHooks, announce: (m: string) => void): HTMLLIElement`, `renderBatch(batch: GenerateResult, heading: string, hooks: CardHooks, announce: (m: string) => void): void`, `labelButton(button: HTMLElement, visible: string, hidden: string): void`, `copyWithFeedback(button: HTMLElement, text: string, title: string, announce: (m: string) => void): Promise<void>`, `syncSaveButtons(isSaved: (id: string) => boolean): void`
  - `clipboard.ts`: `copyText(text: string): Promise<boolean>`
  - `announce.ts`: `createAnnouncer(el: HTMLElement): (message: string) => void`

- [ ] **Step 1: Write the failing unit test**

`apps/video-game-name-generator/test/results.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '@vps-name-tools/game-titles';
import { RecentTitles } from '../src/scripts/recent';
import { chipLabels, resultsHeading } from '../src/scripts/results';

test('results heading reads like spec §12.1', () => {
  const batch = generate({ genre: 'dark-fantasy', myth: 'norse', tone: 'grim' }, { seed: 'h' });
  assert.equal(resultsHeading(batch, ['Grim']), '10 titles · Dark Fantasy · Norse · Grim');
  const plain = generate({}, { seed: 'h2', });
  assert.equal(resultsHeading(plain, ['Epic', 'Mystical']), '10 titles · Fantasy · Epic + Mystical');
});

test('chips show genre, chosen style and cultural style, never Auto or None', () => {
  const r = generate({ genre: 'horror', style: 'cryptic', myth: 'celtic' }, { seed: 'c' }).titles[0];
  assert.deepEqual(chipLabels(r), ['Horror', 'Cryptic', 'Celtic-inspired']);
  const d = generate({}, { seed: 'c2' }).titles[0];
  assert.deepEqual(chipLabels(d), ['Fantasy']);
});

test('recent titles keep the last 500 normalised titles', () => {
  const r = new RecentTitles(3);
  r.add(['A One', 'B Two', 'C Three', 'D Four']);
  assert.deepEqual([...r.set()], ['b two', 'c three', 'd four']);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/results.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement helpers**

`apps/video-game-name-generator/src/scripts/recent.ts`:
```ts
import { titleKey } from '@vps-name-tools/game-titles';

/** Recently shown titles, memory only (spec §14). Passed to the engine as `exclude`. */
export class RecentTitles {
  private readonly keys: string[] = [];
  constructor(private readonly max = 500) {}
  add(titles: Iterable<string>): void {
    for (const t of titles) this.keys.push(titleKey(t));
    if (this.keys.length > this.max) this.keys.splice(0, this.keys.length - this.max);
  }
  set(): ReadonlySet<string> {
    return new Set(this.keys);
  }
}
```

`apps/video-game-name-generator/src/scripts/clipboard.ts`:
```ts
/** Async Clipboard API inside the click handler (works on iOS Safari), with a selection fallback. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the fallback
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
```

`apps/video-game-name-generator/src/scripts/announce.ts`:
```ts
/** One polite live region for actions that do not move focus (spec §16). */
export function createAnnouncer(el: HTMLElement): (message: string) => void {
  let timer: number | undefined;
  return message => {
    el.textContent = '';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { el.textContent = message; }, 60);
  };
}
```

`apps/video-game-name-generator/src/scripts/results.ts`:
```ts
import type { GenerateResult, TitleResult } from '@vps-name-tools/game-titles';
import { checkLinks } from './check-links';
import { copyText } from './clipboard';

export function resultsHeading(batch: GenerateResult, tones: readonly string[]): string {
  const first = batch.titles[0];
  const parts = [`${batch.titles.length} titles`];
  if (first) {
    parts.push(first.meta.genreLabel);
    if (first.meta.myth !== 'none') parts.push(first.meta.mythLabel);
  }
  if (tones.length) parts.push(tones.join(' + '));
  return parts.join(' · ');
}

export function chipLabels(r: TitleResult): string[] {
  const chips = [r.meta.genreLabel];
  if (r.meta.style !== 'auto') chips.push(r.meta.styleLabel);
  if (r.meta.myth !== 'none') chips.push(r.meta.mythLabel);
  return chips;
}

export interface CardHooks {
  onCopy(r: TitleResult): void;
  onSave(r: TitleResult, button: HTMLButtonElement): void;
  isSaved(id: string): boolean;
  onSimilar(r: TitleResult, card: HTMLElement, button: HTMLButtonElement): void;
  onCheck(r: TitleResult, link: 'google' | 'steam' | 'itch'): void;
}

const tpl = (id: string) => (document.getElementById(id) as HTMLTemplateElement).content.firstElementChild!.cloneNode(true) as HTMLElement;

/** Sets "Label<hidden> rest</hidden>" so the accessible name starts with the visible label. */
export function labelButton(button: HTMLElement, visible: string, hidden: string): void {
  const label = button.querySelector('.btn__label') ?? button.appendChild(Object.assign(document.createElement('span'), { className: 'btn__label' }));
  label.textContent = visible;
  const vh = button.querySelector('.visually-hidden') ?? button.appendChild(Object.assign(document.createElement('span'), { className: 'visually-hidden' }));
  vh.textContent = hidden;
}

export async function copyWithFeedback(button: HTMLElement, text: string, title: string, announce: (m: string) => void) {
  const ok = await copyText(text);
  const label = button.querySelector('.btn__label');
  if (label) {
    label.textContent = ok ? 'Copied' : 'Copy failed';
    window.setTimeout(() => { label.textContent = 'Copy'; }, 2000);
  }
  announce(ok ? `Copied ${title}` : `Could not copy ${title}. Select the text and copy it instead.`);
}

export function renderCard(r: TitleResult, index: number, hooks: CardHooks, announce: (m: string) => void): HTMLLIElement {
  const card = tpl('tpl-result') as HTMLLIElement;
  card.dataset.id = r.id;
  card.querySelector('.result-card__title')!.textContent = r.title;
  const chips = card.querySelector('.result-card__chips')!;
  for (const c of chipLabels(r)) chips.append(Object.assign(document.createElement('li'), { className: 'chip', textContent: c }));
  card.querySelector('.result-card__note')!.textContent = r.meta.note;

  const copy = card.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
  labelButton(copy, 'Copy', ` ${r.title}`);
  copy.addEventListener('click', () => { hooks.onCopy(r); void copyWithFeedback(copy, r.title, r.title, announce); });

  const save = card.querySelector<HTMLButtonElement>('[data-action="save"]')!;
  labelButton(save, 'Save', ` ${r.title} to shortlist`);
  save.setAttribute('aria-pressed', String(hooks.isSaved(r.id)));
  save.addEventListener('click', () => hooks.onSave(r, save));

  const similar = card.querySelector<HTMLButtonElement>('[data-action="similar"]')!;
  labelButton(similar, 'Similar', ` titles to ${r.title}`);
  const region = card.querySelector<HTMLElement>('.similar')!;
  region.id = `similar-${index}`;
  similar.setAttribute('aria-controls', region.id);
  similar.addEventListener('click', () => hooks.onSimilar(r, card, similar));

  const check = card.querySelector<HTMLElement>('.check summary')!;
  labelButton(check, 'Check', ` ${r.title}`);
  const links = card.querySelector('.check__links')!;
  for (const l of checkLinks(r.title)) {
    const a = Object.assign(document.createElement('a'), { href: l.href, textContent: l.label, target: '_blank', rel: 'noopener noreferrer nofollow' });
    a.append(Object.assign(document.createElement('span'), { className: 'visually-hidden', textContent: ` search for ${r.title} (opens in a new tab)` }));
    a.addEventListener('click', () => hooks.onCheck(r, l.id));
    const li = document.createElement('li');
    li.append(a);
    links.append(li);
  }
  return card;
}

export function renderBatch(batch: GenerateResult, heading: string, hooks: CardHooks, announce: (m: string) => void): void {
  document.getElementById('results-empty')!.hidden = true;
  const body = document.getElementById('results-body')!;
  body.hidden = false;
  const notices = document.getElementById('notices')!;
  notices.replaceChildren(...batch.notices.map(n => Object.assign(document.createElement('p'), { className: 'notice notice--warn', textContent: n.message })));
  const list = document.getElementById('results-list')!;
  list.replaceChildren(...batch.titles.map((r, i) => renderCard(r, i, hooks, announce)));
  const h = document.getElementById('results-heading')!;
  h.textContent = batch.titles.length ? heading : 'No titles fit these settings';
  h.focus({ preventScroll: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  h.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
}

export function syncSaveButtons(isSaved: (id: string) => boolean): void {
  for (const b of document.querySelectorAll<HTMLButtonElement>('#results [data-action="save"]')) {
    const id = b.closest<HTMLElement>('[data-id]')?.dataset.id;
    if (id) b.setAttribute('aria-pressed', String(isSaved(id)));
  }
}
```

`results.ts` imports `checkLinks` from Task 35. Create a minimal `src/scripts/check-links.ts` now with the final implementation from Task 35, Step 3 (the module is tiny and has no other dependencies), and add its unit test in Task 35.

- [ ] **Step 4: Components**

`apps/video-game-name-generator/src/components/ResultsPanel.astro`:
```astro
---
import { DISCLAIMER } from '../content';
import { EXAMPLES } from '../scripts/form';
---
<section id="results" class="results" aria-labelledby="results-heading">
  <div class="results__empty" id="results-empty">
    <p>Not sure where to start? Try an example:</p>
    <ul class="results__examples">
      {EXAMPLES.map((e, i) => <li><button type="button" class="chip chip--button" data-example={String(i)}>{e.label}</button></li>)}
    </ul>
  </div>
  <div class="results__body" id="results-body" hidden>
    <div class="results__header">
      <h2 id="results-heading" tabindex="-1">Titles</h2>
      <div class="results__tools">
        <button type="button" class="btn btn--small btn--secondary" id="copy-all"><span class="btn__label">Copy all</span><span class="visually-hidden"> results</span></button>
        <a href="#shortlist" class="results__jump" id="shortlist-jump">Shortlist (<span id="shortlist-jump-count">0</span>)</a>
      </div>
    </div>
    <div class="notices" id="notices" role="status"></div>
    <ol class="results__list" id="results-list"></ol>
    <button type="button" class="btn btn--secondary results__again" id="generate-again">Generate again</button>
  </div>
  <p class="disclaimer" id="disclaimer">{DISCLAIMER}</p>
  <div class="visually-hidden" id="announcer" aria-live="polite"></div>
</section>
```

`apps/video-game-name-generator/src/components/ResultTemplates.astro`:
```astro
<template id="tpl-result">
  <li class="result-card">
    <h3 class="result-card__title"></h3>
    <ul class="result-card__chips" aria-label="Settings"></ul>
    <p class="result-card__note"></p>
    <div class="result-card__actions">
      <button type="button" class="btn btn--small" data-action="copy"></button>
      <button type="button" class="btn btn--small" data-action="save" aria-pressed="false"><span class="btn__icon" aria-hidden="true"></span></button>
      <button type="button" class="btn btn--small" data-action="similar" aria-expanded="false"></button>
      <details class="check disclosure">
        <summary class="btn btn--small"></summary>
        <ul class="check__links"></ul>
        <p class="check__note">Each link opens a search on that site, which receives the title.</p>
      </details>
    </div>
    <div class="similar" hidden>
      <h4 class="similar__heading"></h4>
      <ol class="similar__list"></ol>
    </div>
  </li>
</template>
<template id="tpl-similar-item">
  <li class="similar-item">
    <span class="similar-item__title"></span>
    <button type="button" class="btn btn--small" data-action="copy"></button>
    <button type="button" class="btn btn--small" data-action="save" aria-pressed="false"><span class="btn__icon" aria-hidden="true"></span></button>
  </li>
</template>
<template id="tpl-shortlist-item">
  <li class="shortlist-item">
    <span class="shortlist-item__title"></span>
    <span class="shortlist-item__meta"></span>
    <div class="shortlist-item__actions">
      <button type="button" class="btn btn--small" data-action="copy"></button>
      <button type="button" class="btn btn--small" data-action="similar" aria-expanded="false"></button>
      <button type="button" class="btn btn--small" data-action="remove"></button>
    </div>
    <div class="similar" hidden>
      <h4 class="similar__heading"></h4>
      <ol class="similar__list"></ol>
    </div>
  </li>
</template>
```

- [ ] **Step 5: Wire Generate in main.ts**

Append to `src/scripts/main.ts`:
```ts
import { generate, type GenerateResult, type TitleResult } from '@vps-name-tools/game-titles';
import { createAnnouncer } from './announce';
import { EXAMPLES } from './form';
import { RecentTitles } from './recent';
import { copyWithFeedback, renderBatch, resultsHeading, type CardHooks } from './results';
import { toneLabel } from '../form-options';

const announce = createAnnouncer($('announcer'));
const recent = new RecentTitles(500);
let lastBatch: GenerateResult | undefined;

/** Filled in by Tasks 34–36 and 39. */
export const hooks: CardHooks = {
  onCopy: () => {},
  onSave: () => {},
  isSaved: () => false,
  onSimilar: () => {},
  onCheck: () => {},
};

export function runGenerate(s: Settings) {
  const batch = generate(s, { exclude: recent.set() });
  recent.add(batch.titles.map(t => t.title));
  lastBatch = batch;
  const tones = (batch.titles[0]?.meta.tones ?? []).map(toneLabel);
  renderBatch(batch, resultsHeading(batch, tones), hooks, announce);
  return batch;
}
handlers.onGenerate = s => void runGenerate(s);

$('generate-again').addEventListener('click', () => form.requestSubmit());
$('copy-all').addEventListener('click', e => {
  if (!lastBatch) return;
  const text = lastBatch.titles.map((t: TitleResult) => t.title).join('\n');
  void copyWithFeedback(e.currentTarget as HTMLElement, `${text}\n`, `${lastBatch.titles.length} titles`, announce);
});
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-example]')) {
  b.addEventListener('click', () => {
    const example = EXAMPLES[Number(b.dataset.example)];
    applySettings(normalizeSettings({ ...DEFAULT_SETTINGS, ...example.settings }));
    form.requestSubmit();
  });
}
```
(Merge the imports with the existing ones at the top of the file.)

- [ ] **Step 6: The failing browser test**

`apps/video-game-name-generator/test/browser/results.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate, titles } from './helpers.mjs';

useBrowser();

test('Generate shows 10 cards, focuses the heading and announces it', { skip }, async () => {
  const { page, errors } = await open('/');
  await generate(page);
  assert.equal((await titles(page)).length, 10);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'results-heading');
  assert.match(await page.$eval('#results-heading', h => h.textContent), /^10 titles · Fantasy/);
  assert.equal(await page.$$eval('#results-list > li h3', h => h.length), 10);
  assert.deepEqual(errors, []);
});

test('buttons carry the title in their accessible names', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const [title] = await titles(page);
  const names = await page.$eval('#results-list > li', li => [...li.querySelectorAll('button, summary')].map(b => b.textContent.trim().replace(/\s+/g, ' ')));
  assert.ok(names.includes(`Copy ${title}`), names.join(' | '));
  assert.ok(names.includes(`Save ${title} to shortlist`));
  assert.ok(names.includes(`Similar titles to ${title}`));
  assert.ok(names.includes(`Check ${title}`));
});

test('Copy copies one title and announces it; Copy all copies the batch', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const all = await titles(page);
  await page.click('#results-list > li [data-action="copy"]');
  await page.waitForFunction(() => document.getElementById('announcer').textContent.startsWith('Copied'));
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), all[0]);
  assert.equal(await page.$eval('#results-list > li [data-action="copy"] .btn__label', el => el.textContent), 'Copied');
  await page.click('#copy-all');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${all.join('\n')}\n`);
});

test('Generate again gives a new batch without repeats', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const first = await titles(page);
  await page.click('#generate-again');
  await page.waitForFunction(t => document.querySelector('#results-list .result-card__title').textContent !== t, {}, first[0]);
  const second = await titles(page);
  assert.equal(second.filter(t => first.includes(t)).length, 0);
});

test('example chips fill the form and generate', { skip }, async () => {
  const { page } = await open('/');
  await page.click('[data-example="2"]');
  await page.waitForSelector('#results-list > li');
  assert.equal(await page.$eval('#f-genre', el => el.value), 'psychological-horror');
  assert.match(await page.$eval('#f-themes', el => el.value), /analog horror/);
});

test('user text never becomes markup', { skip }, async () => {
  const { page, errors } = await open('/');
  await page.$eval('#more-options', d => { d.open = true; d.closest('details#fine-tune').open = true; });
  await page.type('#f-include', '<img src=x onerror=alert(1)>');
  await page.type('#f-themes', '<script>alert(1)</script>, <b>bold</b>');
  await generate(page);
  assert.equal(await page.$$eval('#results-list img, #results-list script, #results-list b', n => n.length), 0);
  assert.ok((await titles(page)).every(t => t.toLowerCase().includes('<img')));
  assert.deepEqual(errors, []);
});

test('the disclaimer is always visible under the results', { skip }, async () => {
  const { page } = await open('/');
  assert.equal(await page.$eval('#disclaimer', el => el.textContent),
    'Generated names are brainstorming suggestions. Check trademarks, existing game titles, domains, and storefronts before commercial use. This tool does not check availability and cannot tell you a name is free to use.');
});
```

- [ ] **Step 7: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/results.test.ts && npm run check && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add the results panel with Copy, Copy all and the example presets"
```

---

### Task 34: Generate Similar in the UI

**Files:**
- Create: `apps/video-game-name-generator/src/scripts/similar-ui.ts`
- Modify: `src/scripts/main.ts`
- Test: `apps/video-game-name-generator/test/browser/similar.browser.mjs`

**Interfaces:**
- Consumes: `generateSimilar` (game-titles), `labelButton`, `copyWithFeedback` (Task 33), `RecentTitles`.
- Produces: `interface SimilarDeps { exclude: ReadonlySet<string>; isSaved(id: string): boolean; onSave(r: TitleResult, b: HTMLButtonElement): void; onCopy(r: TitleResult): void; announce(m: string): void }`, `openSimilar(source: TitleResult, container: HTMLElement, button: HTMLButtonElement, deps: SimilarDeps): GenerateResult | undefined` (returns undefined when it closed an open group).

Behaviour (spec §11.2–11.3): opens an inline group of 6 related titles under the card, each with Copy and Save; opening another closes the previous; pressing the same button again closes it; the source's settings snapshot drives generation, so Similar still works after the form changes; no ad containers inside.

- [ ] **Step 1: Write the failing browser test**

`apps/video-game-name-generator/test/browser/similar.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate, titles } from './helpers.mjs';

useBrowser();
const groupTitles = (page, sel) => page.$$eval(`${sel} .similar__list .similar-item__title`, els => els.map(e => e.textContent));

test('Similar opens 6 related titles under the card and announces them', { skip }, async () => {
  const { page, errors } = await open('/');
  await page.select('#f-genre', 'dark-fantasy');
  await generate(page);
  const [source] = await titles(page);
  await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
  const card = '#results-list > li:nth-child(1)';
  assert.equal(await page.$eval(`${card} [data-action="similar"]`, b => b.getAttribute('aria-expanded')), 'true');
  const sims = await groupTitles(page, card);
  assert.equal(sims.length, 6);
  assert.ok(!sims.includes(source));
  assert.match(await page.$eval(`${card} .similar__heading`, h => h.textContent), new RegExp(`Similar to ${source}`));
  assert.equal(await page.$$eval(`${card} .similar [data-ad], ${card} .similar .ad-slot`, n => n.length), 0);
  assert.deepEqual(errors, []);
});

test('opening another group closes the previous one; the same button toggles', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
  await page.click('#results-list > li:nth-child(2) [data-action="similar"]');
  assert.equal(await page.$eval('#results-list > li:nth-child(1) .similar', el => el.hidden), true);
  assert.equal(await page.$eval('#results-list > li:nth-child(1) [data-action="similar"]', b => b.getAttribute('aria-expanded')), 'false');
  await page.click('#results-list > li:nth-child(2) [data-action="similar"]');
  assert.equal(await page.$eval('#results-list > li:nth-child(2) .similar', el => el.hidden), true);
});

test('Similar uses the snapshot after the form changes and keeps the Include word', { skip }, async () => {
  const { page } = await open('/');
  await page.$eval('#more-options', d => { d.open = true; d.closest('#fine-tune').open = true; });
  await page.type('#f-include', 'Aeternum');
  await generate(page);
  await page.select('#f-genre', 'cozy');
  await page.$eval('#f-include', el => { el.value = ''; });
  await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
  const sims = await groupTitles(page, '#results-list > li:nth-child(1)');
  assert.ok(sims.length >= 4);
  assert.ok(sims.every(t => t.includes('Aeternum')), sims.join(' | '));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run build && npm run test:browser`
Expected: FAIL in `similar.browser.mjs` (no group renders).

- [ ] **Step 3: Implement**

`apps/video-game-name-generator/src/scripts/similar-ui.ts`:
```ts
import { generateSimilar, type GenerateResult, type TitleResult } from '@vps-name-tools/game-titles';
import { copyWithFeedback, labelButton } from './results';

export interface SimilarDeps {
  exclude: ReadonlySet<string>;
  isSaved(id: string): boolean;
  onSave(r: TitleResult, b: HTMLButtonElement): void;
  onCopy(r: TitleResult): void;
  announce(m: string): void;
}

let open: { container: HTMLElement; button: HTMLButtonElement } | undefined;

function close() {
  if (!open) return;
  open.container.hidden = true;
  open.container.querySelector('.similar__list')?.replaceChildren();
  open.button.setAttribute('aria-expanded', 'false');
  open = undefined;
}

export function openSimilar(
  source: TitleResult,
  container: HTMLElement,
  button: HTMLButtonElement,
  deps: SimilarDeps,
): GenerateResult | undefined {
  const same = open?.button === button;
  close();
  if (same) return undefined;
  const result = generateSimilar(source, { count: 6, exclude: deps.exclude });
  container.querySelector('.similar__heading')!.textContent = result.titles.length ? `Similar to ${source.title}` : `No close variations of ${source.title} fit these settings`;
  const list = container.querySelector('.similar__list')!;
  for (const r of result.titles) {
    const item = (document.getElementById('tpl-similar-item') as HTMLTemplateElement).content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    item.dataset.id = r.id;
    item.querySelector('.similar-item__title')!.textContent = r.title;
    const copy = item.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
    labelButton(copy, 'Copy', ` ${r.title}`);
    copy.addEventListener('click', () => { deps.onCopy(r); void copyWithFeedback(copy, r.title, r.title, deps.announce); });
    const save = item.querySelector<HTMLButtonElement>('[data-action="save"]')!;
    labelButton(save, 'Save', ` ${r.title} to shortlist`);
    save.setAttribute('aria-pressed', String(deps.isSaved(r.id)));
    save.addEventListener('click', () => deps.onSave(r, save));
    list.append(item);
  }
  container.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  open = { container, button };
  deps.announce(`${result.titles.length} similar titles to ${source.title}`);
  return result;
}
```

In `main.ts` set the hook:
```ts
import { openSimilar } from './similar-ui';

hooks.onSimilar = (r, card, button) => {
  const result = openSimilar(r, card.querySelector<HTMLElement>('.similar')!, button, {
    exclude: recent.set(), isSaved: id => hooks.isSaved(id), onSave: (x, b) => hooks.onSave(x, b), onCopy: x => hooks.onCopy(x), announce,
  });
  if (result) recent.add(result.titles.map(t => t.title));
};
```

`syncSaveButtons` (Task 33) already covers buttons inside Similar groups because it searches `#results [data-action="save"]` and each Similar item has `data-id`.

- [ ] **Step 4: Run to verify pass**

Run: `npm run check && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add inline Generate Similar groups"
```

---

### Task 35: Check links

**Files:**
- Create or finish: `apps/video-game-name-generator/src/scripts/check-links.ts`
- Test: `apps/video-game-name-generator/test/check-links.test.ts`, `test/browser/check.browser.mjs`

**Interfaces:**
- Produces: `type CheckLinkId = 'google' | 'steam' | 'itch'`, `checkLinks(title: string): readonly { id: CheckLinkId; label: string; href: string }[]`.

- [ ] **Step 1: Write the failing unit test**

`apps/video-game-name-generator/test/check-links.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLinks } from '../src/scripts/check-links';

test('check links match spec §11.2 exactly and are encoded', () => {
  assert.deepEqual(checkLinks('Ashen Oath: Rime & Ruin'), [
    { id: 'google', label: 'Google', href: 'https://www.google.com/search?q=%22Ashen%20Oath%3A%20Rime%20%26%20Ruin%22%20game' },
    { id: 'steam', label: 'Steam', href: 'https://store.steampowered.com/search/?term=Ashen%20Oath%3A%20Rime%20%26%20Ruin' },
    { id: 'itch', label: 'itch.io', href: 'https://itch.io/search?q=Ashen%20Oath%3A%20Rime%20%26%20Ruin' },
  ]);
});

test('no domain or trademark lookups in the MVP', () => {
  assert.equal(checkLinks('X').length, 3);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/check-links.test.ts`
Expected: FAIL if the module is missing or differs.

- [ ] **Step 3: Implement**

`apps/video-game-name-generator/src/scripts/check-links.ts`:
```ts
export type CheckLinkId = 'google' | 'steam' | 'itch';

/** Google, Steam and itch.io only (Revision 2, decision 18). Never claims a name is available. */
export function checkLinks(title: string): readonly { id: CheckLinkId; label: string; href: string }[] {
  const q = encodeURIComponent(title);
  return [
    { id: 'google', label: 'Google', href: `https://www.google.com/search?q=${encodeURIComponent(`"${title}" game`)}` },
    { id: 'steam', label: 'Steam', href: `https://store.steampowered.com/search/?term=${q}` },
    { id: 'itch', label: 'itch.io', href: `https://itch.io/search?q=${q}` },
  ];
}
```

- [ ] **Step 4: Browser test**

`apps/video-game-name-generator/test/browser/check.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate, titles } from './helpers.mjs';

useBrowser();

test('Check opens an inline list of three safe links', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const [title] = await titles(page);
  await page.click('#results-list > li:nth-child(1) .check summary');
  const links = await page.$$eval('#results-list > li:nth-child(1) .check__links a', as => as.map(a => ({ text: a.childNodes[0].textContent, href: a.href, rel: a.rel, target: a.target })));
  assert.deepEqual(links.map(l => l.text), ['Google', 'Steam', 'itch.io']);
  for (const l of links) {
    assert.equal(l.target, '_blank');
    assert.equal(l.rel, 'noopener noreferrer nofollow');
  }
  assert.equal(links[1].href, `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`);
});

test('no copy claims availability or trademark safety', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const text = await page.evaluate(() => document.body.innerText);
  assert.doesNotMatch(text, /\bavailable\b|trademark[- ]safe|AI[- ]powered/i);
});
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/check-links.test.ts && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add Google, Steam and itch.io check links"
```

---

### Task 36: Shortlist panel

**Files:**
- Create: `apps/video-game-name-generator/src/components/ShortlistPanel.astro`, `src/scripts/shortlist-ui.ts`, `src/scripts/download.ts`, `src/shortlist-items.ts`
- Modify: `src/pages/index.astro` (replace the `#shortlist` placeholder with `<ShortlistPanel />`), `src/scripts/main.ts`
- Test: `apps/video-game-name-generator/test/shortlist-items.test.ts`, `test/browser/shortlist.browser.mjs`

**Interfaces:**
- Consumes: `createShortlist`, `safeLocalStorage`, `storageKeys`, `tool` (site-kit); `normalizeSettings`, `TitleResult`, `Recipe` (game-titles); `openSimilar`, `labelButton`, `copyWithFeedback`, `syncSaveButtons` (Tasks 33–34).
- Produces:
  - `shortlist-items.ts`: `toShortlistItem(r: TitleResult): Omit<ShortlistItem, 'savedAt'>`, `fromShortlistItem(item: ShortlistItem): TitleResult`, `isValidSavedTitle(item: ShortlistItem): boolean`
  - `download.ts`: `downloadText(filename: string, text: string, type: string): void`
  - `shortlist-ui.ts`: `mountShortlist(deps: { announce(m: string): void; onChange(): void; onCopy(r: TitleResult): void; similarDeps(): SimilarDeps }): { toggle(r: TitleResult): boolean; has(id: string): boolean; render(): void }`

- [ ] **Step 1: Write the failing unit test**

`apps/video-game-name-generator/test/shortlist-items.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate, generateSimilar } from '@vps-name-tools/game-titles';
import { fromShortlistItem, isValidSavedTitle, toShortlistItem } from '../src/shortlist-items';

test('a saved title round-trips and still drives Similar', () => {
  const r = generate({ genre: 'dark-fantasy', myth: 'norse' }, { seed: 'sl' }).titles[0];
  const item = { ...toShortlistItem(r), savedAt: new Date().toISOString() };
  assert.ok(isValidSavedTitle(item));
  const back = fromShortlistItem(item);
  assert.equal(back.title, r.title);
  assert.ok(generateSimilar(back, { seed: 'x' }).titles.length >= 4);
});

test('imported records with broken recipes or settings are rejected', () => {
  const r = generate({}, { seed: 'bad' }).titles[0];
  const item = { ...toShortlistItem(r), savedAt: new Date().toISOString() };
  assert.equal(isValidSavedTitle({ ...item, recipe: { templateId: 5 } }), false);
  assert.equal(isValidSavedTitle({ ...item, recipe: { ...r.recipe, parts: 'x' } }), false);
  assert.equal(isValidSavedTitle({ ...item, settings: [] as unknown as Record<string, unknown> }), false);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/shortlist-items.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

`apps/video-game-name-generator/src/shortlist-items.ts`:
```ts
import { normalizeSettings, type Recipe, type TitleMeta, type TitleResult } from '@vps-name-tools/game-titles';
import type { ShortlistItem } from '@vps-name-tools/site-kit';

export function toShortlistItem(r: TitleResult): Omit<ShortlistItem, 'savedAt'> {
  return { id: r.id, title: r.title, meta: { ...r.meta }, recipe: r.recipe, settings: { ...r.settings } };
}

export function fromShortlistItem(item: ShortlistItem): TitleResult {
  return { id: item.id, title: item.title, meta: item.meta as unknown as TitleMeta, recipe: item.recipe as Recipe, settings: normalizeSettings(item.settings) };
}

const isPart = (p: unknown): boolean => typeof p === 'object' && p !== null && typeof (p as { kind?: unknown }).kind === 'string'
  && typeof (p as { text?: unknown }).text === 'string' && ((p as { text: string }).text.length <= 80);

/** Shape check for imported records; Similar tolerates entries that no longer exist in the data. */
export function isValidSavedTitle(item: ShortlistItem): boolean {
  const r = item.recipe as Partial<Recipe> | null;
  if (typeof item.settings !== 'object' || item.settings === null || Array.isArray(item.settings)) return false;
  if (!r || typeof r !== 'object') return false;
  return typeof r.templateId === 'string' && typeof r.family === 'string' && typeof r.variant === 'number' && typeof r.headSlot === 'number'
    && Array.isArray(r.parts) && r.parts.length <= 12 && r.parts.every(isPart);
}
```

`apps/video-game-name-generator/src/scripts/download.ts`:
```ts
export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

`apps/video-game-name-generator/src/components/ShortlistPanel.astro`:
```astro
<section id="shortlist" class="shortlist-section" aria-labelledby="shortlist-heading">
  <details class="shortlist disclosure" id="shortlist-panel">
    <summary><h2 class="shortlist__heading" id="shortlist-heading" tabindex="-1">Shortlist (<span id="shortlist-count">0</span>)</h2></summary>
    <div class="shortlist__header">
      <p class="shortlist__note">Saved in this browser only. Copy your shortlist somewhere safe; browsers can clear site data.</p>
      <div class="shortlist__tools">
        <button type="button" class="btn btn--small btn--secondary" id="shortlist-copy-all"><span class="btn__label">Copy all</span><span class="visually-hidden"> saved titles</span></button>
        <details class="menu disclosure" id="shortlist-menu">
          <summary class="btn btn--small btn--secondary"><span aria-hidden="true">⋯</span><span class="visually-hidden">Download or import</span></summary>
          <div class="menu__items">
            <button type="button" class="btn btn--small btn--ghost" id="download-txt">Download TXT</button>
            <button type="button" class="btn btn--small btn--ghost" id="download-json">Download JSON (backup)</button>
            <button type="button" class="btn btn--small btn--ghost" id="import-button">Import JSON</button>
            <input type="file" id="import-file" accept="application/json,.json" hidden />
          </div>
        </details>
        <button type="button" class="btn btn--small btn--ghost" id="shortlist-clear">Clear all</button>
      </div>
    </div>
    <div class="confirm" id="clear-confirm" role="group" aria-labelledby="clear-question" hidden>
      <span id="clear-question"></span>
      <button type="button" class="btn btn--small btn--primary" id="clear-yes">Yes, clear</button>
      <button type="button" class="btn btn--small btn--secondary" id="clear-cancel">Cancel</button>
    </div>
    <p class="notice notice--warn" id="shortlist-notice" hidden></p>
    <p class="shortlist__empty" id="shortlist-empty">Nothing saved yet. Use Save on any title.</p>
    <ol class="shortlist__list" id="shortlist-list"></ol>
  </details>
</section>
```

Add to `src/styles/app.css` (shortlist open from 600 px, collapsed on mobile per spec §12.2):
```css
@media (min-width: 600px) {
  .shortlist > summary { pointer-events: none; }
  .shortlist::details-content { content-visibility: visible; }
}
```

`apps/video-game-name-generator/src/scripts/shortlist-ui.ts`:
```ts
import type { TitleResult } from '@vps-name-tools/game-titles';
import { createShortlist, safeLocalStorage, storageKeys, tool, type StorageNotice } from '@vps-name-tools/site-kit';
import { fromShortlistItem, isValidSavedTitle, toShortlistItem } from '../shortlist-items';
import { downloadText } from './download';
import { copyWithFeedback, labelButton } from './results';
import { openSimilar, type SimilarDeps } from './similar-ui';

const NOTICES: Readonly<Record<StorageNotice, string>> = {
  unavailable: "Your browser isn't letting this page save; your shortlist lasts until you close the tab.",
  'corrupt-reset': 'Your saved shortlist could not be read, so it was set aside and a new one started.',
  quota: 'Your browser storage is full. New saves last until you close the tab; download a backup.',
};
const MAX_IMPORT_BYTES = 1_000_000;

export function mountShortlist(deps: {
  announce(m: string): void;
  onChange(): void;
  onCopy(r: TitleResult): void;
  similarDeps(): SimilarDeps;
}) {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const { store, persistent } = safeLocalStorage();
  const shortlist = createShortlist({ kv: store, key: storageKeys.shortlist, tool: tool.id, validateItem: isValidSavedTitle });
  const panel = $<HTMLDetailsElement>('shortlist-panel');
  const desktop = window.matchMedia('(min-width: 600px)');
  const syncOpen = () => { if (desktop.matches) panel.open = true; };
  desktop.addEventListener('change', syncOpen);
  syncOpen();

  function render() {
    const items = shortlist.items();
    $('shortlist-count').textContent = String(items.length);
    const jump = document.getElementById('shortlist-jump-count');
    if (jump) jump.textContent = String(items.length);
    $('shortlist-empty').hidden = items.length > 0;
    for (const id of ['shortlist-copy-all', 'shortlist-clear', 'download-txt', 'download-json']) ($<HTMLButtonElement>(id)).disabled = items.length === 0;
    const notice = shortlist.notice() ?? (persistent ? undefined : 'unavailable');
    $('shortlist-notice').hidden = !notice;
    $('shortlist-notice').textContent = notice ? NOTICES[notice] : '';
    const list = $('shortlist-list');
    list.replaceChildren(...items.map((item, index) => {
      const li = (document.getElementById('tpl-shortlist-item') as HTMLTemplateElement).content.firstElementChild!.cloneNode(true) as HTMLLIElement;
      const r = fromShortlistItem(item);
      li.dataset.id = item.id;
      li.querySelector('.shortlist-item__title')!.textContent = item.title;
      const meta = item.meta as { genreLabel?: string; mythLabel?: string; myth?: string };
      li.querySelector('.shortlist-item__meta')!.textContent = [meta.genreLabel, meta.myth !== 'none' ? meta.mythLabel : undefined].filter(Boolean).join(' · ');
      const copy = li.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
      labelButton(copy, 'Copy', ` ${item.title}`);
      copy.addEventListener('click', () => { deps.onCopy(r); void copyWithFeedback(copy, item.title, item.title, deps.announce); });
      const similar = li.querySelector<HTMLButtonElement>('[data-action="similar"]')!;
      labelButton(similar, 'Similar', ` titles to ${item.title}`);
      const region = li.querySelector<HTMLElement>('.similar')!;
      region.id = `shortlist-similar-${index}`;
      similar.setAttribute('aria-controls', region.id);
      similar.addEventListener('click', () => openSimilar(r, region, similar, deps.similarDeps()));
      const remove = li.querySelector<HTMLButtonElement>('[data-action="remove"]')!;
      labelButton(remove, 'Remove', ` ${item.title} from shortlist`);
      remove.addEventListener('click', () => {
        shortlist.remove(item.id);
        render();
        deps.onChange();
        deps.announce(`Removed ${item.title} from shortlist`);
        $('shortlist-heading').focus();
      });
      return li;
    }));
  }

  $('shortlist-copy-all').addEventListener('click', e => void copyWithFeedback(e.currentTarget as HTMLElement, shortlist.exportText(), `${shortlist.items().length} saved titles`, deps.announce));
  $('download-txt').addEventListener('click', () => downloadText('video-game-name-shortlist.txt', shortlist.exportText(), 'text/plain'));
  $('download-json').addEventListener('click', () => downloadText('video-game-name-shortlist.json', shortlist.exportJson(), 'application/json'));
  $('import-button').addEventListener('click', () => $<HTMLInputElement>('import-file').click());
  $<HTMLInputElement>('import-file').addEventListener('change', async e => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) return deps.announce('That file is too large to be a shortlist backup.');
    const report = shortlist.importJson(await file.text());
    render();
    deps.onChange();
    deps.announce(report.error ?? `Added ${report.added} titles. Skipped ${report.duplicates} duplicates and ${report.invalid} invalid entries.${report.full ? ` ${report.full} did not fit (the limit is 500).` : ''}`);
  });
  $('shortlist-clear').addEventListener('click', () => {
    $('clear-question').textContent = `Clear all ${shortlist.items().length} saved titles?`;
    $('clear-confirm').hidden = false;
    $('clear-cancel').focus();
  });
  $('clear-cancel').addEventListener('click', () => { $('clear-confirm').hidden = true; $('shortlist-clear').focus(); });
  $('clear-yes').addEventListener('click', () => {
    shortlist.clear();
    $('clear-confirm').hidden = true;
    render();
    deps.onChange();
    deps.announce('Shortlist cleared');
    $('shortlist-heading').focus();
  });
  document.getElementById('shortlist-jump')?.addEventListener('click', () => { panel.open = true; });
  window.addEventListener('storage', e => {
    if (e.key !== storageKeys.shortlist) return;
    shortlist.reload();
    render();
    deps.onChange();
  });
  render();

  return {
    has: (id: string) => shortlist.has(id),
    toggle(r: TitleResult) {
      const saved = shortlist.toggle(toShortlistItem(r));
      render();
      deps.onChange();
      deps.announce(saved ? `Saved ${r.title} to shortlist` : `Removed ${r.title} from shortlist`);
      return saved;
    },
    render,
  };
}
```

Wire it in `main.ts`:
```ts
import { mountShortlist } from './shortlist-ui';
import { syncSaveButtons } from './results';

const saved = mountShortlist({
  announce,
  onChange: () => syncSaveButtons(id => saved.has(id)),
  onCopy: r => hooks.onCopy(r),
  similarDeps: () => ({ exclude: recent.set(), isSaved: id => saved.has(id), onSave: (r, b) => hooks.onSave(r, b), onCopy: r => hooks.onCopy(r), announce }),
});
hooks.isSaved = id => saved.has(id);
hooks.onSave = (r, button) => {
  button.setAttribute('aria-pressed', String(saved.toggle(r)));
};
```

- [ ] **Step 4: The failing browser test**

`apps/video-game-name-generator/test/browser/shortlist.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useBrowser, open, skip, generate, titles } from './helpers.mjs';

useBrowser();
const saved = page => page.$$eval('#shortlist-list .shortlist-item__title', els => els.map(e => e.textContent));

test('Save toggles, persists after reload and keeps newest first', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  const t = await titles(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await page.click('#results-list > li:nth-child(2) [data-action="save"]');
  assert.equal(await page.$eval('#results-list > li:nth-child(1) [data-action="save"]', b => b.getAttribute('aria-pressed')), 'true');
  assert.deepEqual(await saved(page), [t[1], t[0]]);
  assert.equal(await page.$eval('#shortlist-count', el => el.textContent), '2');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.deepEqual(await saved(page), [t[1], t[0]]);
});

test('Remove and Clear all (with inline confirmation)', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  for (const n of [1, 2, 3]) await page.click(`#results-list > li:nth-child(${n}) [data-action="save"]`);
  await page.click('#shortlist-list > li:nth-child(1) [data-action="remove"]');
  assert.equal((await saved(page)).length, 2);
  await page.click('#shortlist-clear');
  assert.equal(await page.$eval('#clear-question', el => el.textContent), 'Clear all 2 saved titles?');
  await page.click('#clear-cancel');
  assert.equal((await saved(page)).length, 2);
  await page.click('#shortlist-clear');
  await page.click('#clear-yes');
  assert.equal((await saved(page)).length, 0);
  assert.equal(await page.$eval('#results-list > li:nth-child(2) [data-action="save"]', b => b.getAttribute('aria-pressed')), 'false');
});

test('Download JSON and Import it into a fresh profile', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'vps-shortlist-'));
  const a = await open('/');
  await generate(a.page);
  await a.page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await a.page.click('#results-list > li:nth-child(2) [data-action="save"]');
  const cdp = await a.page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
  await a.page.$eval('#shortlist-menu', d => { d.open = true; });
  await a.page.click('#download-json');
  const file = join(dir, 'video-game-name-shortlist.json');
  for (let i = 0; i < 50 && !existsSync(file); i++) await new Promise(r => setTimeout(r, 100));
  const data = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(data.format, 'vps-name-tools/shortlist');
  assert.equal(data.items.length, 2);
  data.items.push({ id: 'bad', title: '' });
  writeFileSync(file, JSON.stringify(data));

  const b = await open('/');
  await b.page.$eval('#shortlist-menu', d => { d.open = true; });
  const input = await b.page.$('#import-file');
  await input.uploadFile(file);
  await b.page.waitForFunction(() => document.getElementById('announcer').textContent.startsWith('Added'));
  assert.equal(await b.page.$eval('#announcer', el => el.textContent), 'Added 2 titles. Skipped 0 duplicates and 1 invalid entries.');
  assert.equal((await saved(b.page)).length, 2);
});

test('Similar works from a saved title', { skip }, async () => {
  const { page } = await open('/');
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await page.click('#shortlist-list > li:nth-child(1) [data-action="similar"]');
  assert.ok((await page.$$eval('#shortlist-list .similar-item', n => n.length)) >= 4);
});

test('two open tabs stay in sync', { skip }, async () => {
  const first = await open('/');
  const second = await open('/', { context: first.context });
  await generate(first.page);
  await first.page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await second.page.waitForFunction(() => document.getElementById('shortlist-count').textContent === '1');
});

test('a throwing localStorage falls back to memory with one quiet notice', { skip }, async () => {
  const { page } = await open('/');
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  assert.equal((await saved(page)).length, 1);
  assert.match(await page.$eval('#shortlist-notice', el => el.textContent), /lasts until you close the tab/);
  assert.equal(await page.$eval('#shortlist-notice', el => el.hidden), false);
});
```

- [ ] **Step 5: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/shortlist-items.test.ts && npm run check && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add the shortlist with backup, import, clear-all confirmation and tab sync"
```

---

### Task 37: Content sections, privacy, SEO and the indexing switch

**Files:**
- Create: `apps/video-game-name-generator/src/components/InfoSections.astro`, `scripts/og-image.mjs`, `apps/video-game-name-generator/public/og.png` (generated)
- Modify: `src/content.ts` (privacy copy), `src/pages/index.astro` (add `<InfoSections slot="after-main" />` before `OtherTools`, pass `ogImage`), `src/scripts/main.ts` (Clear my saved data)
- Test: `apps/video-game-name-generator/test/indexing.test.ts`, `test/copy.test.ts`, `test/browser/content.browser.mjs`

**Interfaces:**
- Produces: `PRIVACY_POINTS: readonly string[]`, `COUNTED_EVENTS_TEXT: string` (content.ts); the agreement test for the three `noindex` switches.

- [ ] **Step 1: Write the failing unit tests**

`apps/video-game-name-generator/test/indexing.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tool } from '@vps-name-tools/site-kit';
import { robotsText } from '../src/pages/robots.txt';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the three noindex switches agree with tool.indexing', () => {
  const headers = read('public/_headers');
  const robots = robotsText(tool.indexing);
  const page = read('src/pages/index.astro');
  assert.match(page, /indexing=\{tool\.indexing\}/, 'the page passes the switch to the layout (robots meta)');
  if (tool.indexing) {
    assert.doesNotMatch(headers, /X-Robots-Tag/);
    assert.doesNotMatch(robots, /Disallow: \//);
  } else {
    assert.match(headers, /X-Robots-Tag: noindex, nofollow/);
    assert.match(robots, /Disallow: \//);
  }
});

test('the canonical URL never carries parameters', () => {
  assert.equal(new URL(tool.canonicalUrl).search, '');
  assert.ok(tool.canonicalUrl.endsWith('/'));
});
```

`apps/video-game-name-generator/test/copy.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DISCLAIMER, PAGE, PRIVACY_POINTS } from '../src/content';

const src = new URL('../src/', import.meta.url);
const all = ['content.ts', ...readdirSync(new URL('components/', src)).map(f => `components/${f}`)].map(f => readFileSync(new URL(f, src), 'utf8')).join('\n');

test('honest copy: never "available", "trademark safe" or "AI-powered"', () => {
  assert.doesNotMatch(all, /\bavailable\b|trademark[- ]safe|AI[- ]powered/i);
});

test('the disclaimer is verbatim', () => {
  assert.equal(DISCLAIMER, 'Generated names are brainstorming suggestions. Check trademarks, existing game titles, domains, and storefronts before commercial use. This tool does not check availability and cannot tell you a name is free to use.');
});

test('title and description use the main search phrases naturally', () => {
  assert.match(PAGE.title, /Video Game Name Generator/);
  assert.ok(PAGE.description.length >= 110 && PAGE.description.length <= 160, String(PAGE.description.length));
  assert.match(all, /game title generator/i);
});

test('the privacy note lists exactly what is counted and never collected', () => {
  const text = PRIVACY_POINTS.join(' ');
  assert.match(text, /page views/i);
  assert.match(text, /genre/);
  assert.match(text, /never/i);
  for (const word of ['themes', 'Include', 'Avoid', 'titles', 'shortlist']) assert.match(text, new RegExp(word));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/indexing.test.ts apps/video-game-name-generator/test/copy.test.ts`
Expected: FAIL (`PRIVACY_POINTS` missing).

- [ ] **Step 3: Copy and the sections**

Append to `apps/video-game-name-generator/src/content.ts`:
```ts
/** Spec §24: the privacy note lists exactly what is counted. Keep in sync with src/analytics-events.ts (Task 39). */
export const PRIVACY_POINTS: readonly string[] = [
  'Names are generated in your browser. Nothing you type is sent to a server.',
  'Your shortlist and last-used settings are saved in this browser only (local storage). There is no account.',
  'We count page views with Cloudflare Web Analytics, which uses no cookies.',
  'We count a few anonymous actions (generate, similar, copy, save, check) with the chosen genre, cultural style and device type (mobile, tablet or desktop).',
  'We never collect your themes, Include or Avoid words, generated titles or shortlist contents.',
  'Browsers that send Global Privacy Control or Do Not Track send no action counts.',
  'Check links open Google, Steam or itch.io, which receive the title you check.',
];
```

`apps/video-game-name-generator/src/components/InfoSections.astro`:
```astro
---
import { DISCLAIMER, PRIVACY_POINTS } from '../content';
---
<div class="info">
  <section aria-labelledby="how-heading">
    <h2 id="how-heading">How it works</h2>
    <p>This video game name generator builds titles from curated word banks, 35 title structures and a phonetic engine for invented words, all running in your browser. Genre and cultural style set the vocabulary and the sound; tone and naming style shape the structure; your themes steer the results without being pasted into every title. Length, creativity and the number of results fine-tune the batch. Use it as a game title generator for jams, prototypes, pitches and tabletop campaigns.</p>
    <p>Each batch is chosen for variety: no structure dominates, worn-out frames like "Shadow of" and "Echoes of" appear rarely, and famous game titles are never produced. Save the ones you like, then use Similar to explore close variations of a favourite.</p>
  </section>
  <section aria-labelledby="choose-heading">
    <h2 id="choose-heading">Choosing a good game title</h2>
    <ul>
      <li>Say it aloud. Could someone spell it after hearing it once?</li>
      <li>Search Steam, itch.io and the web for the exact title.</li>
      <li>Skip filler like "Shadow of" and "Echoes of" unless it truly fits.</li>
      <li>Check a trademark database: USPTO, EUIPO TMview or the WIPO Global Brand Database.</li>
      <li>Keep subtitles purposeful; they should add information, not length.</li>
      <li>Check it at small capsule size: does it stay legible on a store tile?</li>
    </ul>
  </section>
  <section aria-labelledby="myth-heading">
    <h2 id="myth-heading">Mythology with care</h2>
    <p>Cultural styles inspire imagery, concepts and sound. They never insert deity or sacred names, and styles drawn from living cultures and religions are labelled "-inspired" and lean on everyday imagery rather than sacred vocabulary. Invented words are inspiration, not real words in any language.</p>
    <p>If something reads wrong to you, we want to hear about it; each style has a reviewed record and can be corrected or withdrawn.</p>
  </section>
  <section id="privacy" aria-labelledby="privacy-heading">
    <h2 id="privacy-heading">Privacy</h2>
    <ul>{PRIVACY_POINTS.map(p => <li>{p}</li>)}</ul>
    <p>{DISCLAIMER}</p>
    <p>
      <button type="button" class="btn btn--small btn--secondary" id="clear-data">Clear my saved data</button>
    </p>
    <div class="confirm" id="clear-data-confirm" role="group" aria-labelledby="clear-data-question" hidden>
      <span id="clear-data-question">Remove your saved shortlist and settings from this browser?</span>
      <button type="button" class="btn btn--small btn--primary" id="clear-data-yes">Yes, remove</button>
      <button type="button" class="btn btn--small btn--secondary" id="clear-data-cancel">Cancel</button>
    </div>
  </section>
</div>
```

In `index.astro`, add `<InfoSections slot="after-main" />` before `<OtherTools slot="after-main" />` and pass `ogImage={new URL('og.png', tool.canonicalUrl).href}` to `CreatorLayout`.

Clear my saved data (append to `main.ts`):
```ts
$('clear-data').addEventListener('click', () => { $('clear-data-confirm').hidden = false; $('clear-data-cancel').focus(); });
$('clear-data-cancel').addEventListener('click', () => { $('clear-data-confirm').hidden = true; $('clear-data').focus(); });
$('clear-data-yes').addEventListener('click', () => {
  kv.remove(storageKeys.shortlist);
  kv.remove(storageKeys.settings);
  for (const k of kv.keys()) if (k.startsWith(`${storageKeys.shortlist}.corrupt-`) || k.startsWith(`${storageKeys.settings}.corrupt-`)) kv.remove(k);
  $('clear-data-confirm').hidden = true;
  window.dispatchEvent(new StorageEvent('storage', { key: storageKeys.shortlist }));
  applySettings(DEFAULT_SETTINGS);
  announce('Your saved data was removed from this browser.');
  $('clear-data').focus();
});
```
(`kv.remove` and `kv.keys` may throw in a locked-down browser; wrap the three storage lines in `try { … } catch { /* nothing saved to remove */ }`.)

- [ ] **Step 4: Open Graph image**

`scripts/og-image.mjs` renders a 1200×630 PNG from inline HTML using the tokens, so the image matches the visual system and is reproducible:
```js
import { existsSync, readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME_PATH ?? ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium'].find(existsSync);
const tokens = readFileSync('packages/site-kit/src/styles/tokens.css', 'utf8');
const html = `<!doctype html><style>${tokens}
body{margin:0;width:1200px;height:630px;display:grid;place-content:center;gap:24px;background:var(--page-gradient),var(--c-bg);color:var(--c-text);font-family:var(--font-display);text-align:center}
h1{font-size:76px;margin:0;letter-spacing:.01em}p{font-size:30px;color:var(--c-text-muted);margin:0}
.titles{font-size:34px;color:var(--c-accent)}</style>
<h1>Video Game Name Generator</h1><p>Game titles that fit your genre, myth and vibe.</p><p class="titles">Rimeholt · Static in the Pines · Bramblebuddies</p>`;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html);
await page.screenshot({ path: 'apps/video-game-name-generator/public/og.png' });
await browser.close();
console.log('Wrote apps/video-game-name-generator/public/og.png');
```
Run: `node scripts/og-image.mjs` (re-run after Task 26 changes the tokens).

- [ ] **Step 5: Browser test**

`apps/video-game-name-generator/test/browser/content.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate } from './helpers.mjs';

useBrowser();

test('one h1, logical heading order, structured data and Open Graph', { skip }, async () => {
  const { page } = await open('/');
  assert.equal(await page.$$eval('h1', h => h.length), 1);
  const levels = await page.$$eval('h1, h2, h3, h4', hs => hs.filter(h => h.offsetParent !== null).map(h => Number(h.tagName[1])));
  for (let i = 1; i < levels.length; i++) assert.ok(levels[i] - levels[i - 1] <= 1, `heading jump at ${i}: ${levels.join(',')}`);
  const ld = JSON.parse(await page.$eval('script[type="application/ld+json"]', s => s.textContent));
  assert.equal(ld['@type'], 'WebApplication');
  assert.match(await page.$eval('meta[property="og:image"]', m => m.content), /og\.png$/);
});

test('Clear my saved data removes the shortlist and settings after confirmation', { skip }, async () => {
  const { page } = await open('/');
  await page.select('#f-genre', 'western');
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await page.click('#clear-data');
  await page.click('#clear-data-yes');
  assert.equal(await page.$eval('#shortlist-count', el => el.textContent), '0');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('#f-genre', el => el.value), 'fantasy');
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('vps-name-tools.')).length), 1, 'only the settings re-saved on load remain');
});
```

- [ ] **Step 6: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/indexing.test.ts apps/video-game-name-generator/test/copy.test.ts && npm run check && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add content sections, privacy note, SEO metadata and the indexing agreement test"
```

---

### Task 38: Responsive and mobile pass

**Files:**
- Modify: `apps/video-game-name-generator/src/styles/app.css`, `src/scripts/main.ts` (textarea auto-grow fallback)
- Test: `apps/video-game-name-generator/test/app-css.test.ts`, `test/browser/responsive.browser.mjs`

**Interfaces:** none new.

Spec §17: < 600 px single column; 600–1023 px two-column controls, one-column results; ≥ 1024 px three-column controls, two-column results; ≥ 1280 px rails reserved (ads on only); targets ≥ 24 px everywhere and 44 px for primary actions on touch; no horizontal scroll at 320 px; long words wrap; no sticky bars; textarea grows to 5 lines then scrolls.

- [ ] **Step 1: Write the failing tests**

`apps/video-game-name-generator/test/app-css.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('app styles use tokens only and no decorative images', () => {
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i);
  assert.doesNotMatch(css, /url\(/i);
});

test('no sticky or fixed bars in the app', () => {
  assert.doesNotMatch(css, /position:\s*(sticky|fixed)/);
});

test('results switch to two columns at 1024 px', () => {
  assert.match(css, /@media \(min-width: 1024px\)[^@]*\.results__list\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
```

`apps/video-game-name-generator/test/browser/responsive.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate, noHorizontalScroll } from './helpers.mjs';

useBrowser();
const columns = (page, sel) => page.$eval(sel, el => getComputedStyle(el).gridTemplateColumns.split(' ').length);

for (const [width, controls, results] of [[360, 1, 1], [768, 2, 1], [1100, 3, 2], [1440, 3, 2]]) {
  test(`layout at ${width} px: ${controls} control columns, ${results} result columns, no horizontal scroll`, { skip }, async () => {
    const { page } = await open('/', { width, height: 900 });
    await page.$eval('#more-options', d => { d.open = true; d.closest('#fine-tune').open = true; });
    await page.$eval('#f-include', el => { el.value = 'Supercalifragilisticexpialidociouslylong'; });
    await generate(page);
    assert.equal(await columns(page, '.generator__grid'), controls);
    assert.equal(await columns(page, '#results-list'), results);
    assert.ok(await noHorizontalScroll(page));
  });
}

test('320 px (400% zoom equivalent) has no horizontal scroll with results and shortlist open', { skip }, async () => {
  const { page } = await open('/', { width: 320, height: 640 });
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
  await page.$eval('#shortlist-panel', d => { d.open = true; });
  assert.ok(await noHorizontalScroll(page));
});

test('every interactive target is at least 24 px (inline text links exempt, WCAG 2.5.8); primary actions 44 px on mobile', { skip }, async () => {
  const { page } = await open('/', { width: 360, height: 740 });
  await generate(page);
  const small = await page.$$eval('button, a[href], summary, select, input:not([type="radio"]):not([type="file"]), textarea, label:has(input[type="radio"])', els =>
    els.filter(e => e.offsetParent !== null && !e.closest('.visually-hidden') && !(e.tagName === 'A' && e.parentElement?.matches('p, li')))
      .map(e => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 24 || r.height < 24)
      .map(({ e }) => e.outerHTML.slice(0, 80)));
  assert.deepEqual(small, []);
  const primary = await page.$eval('#generate', b => b.getBoundingClientRect().height);
  assert.ok(primary >= 44, String(primary));
});

test('reduced motion: scrolling to results is instant', { skip }, async () => {
  const { page } = await open('/', { width: 360, height: 740, reducedMotion: true });
  await generate(page);
  const top = await page.$eval('#results-heading', h => Math.round(h.getBoundingClientRect().top));
  assert.ok(top >= -2 && top < 100, String(top));
});

test('the themes field grows to about five lines, then scrolls', { skip }, async () => {
  const { page } = await open('/', { width: 360, height: 740 });
  const h1 = await page.$eval('#f-themes', el => el.getBoundingClientRect().height);
  await page.type('#f-themes', 'line\n'.repeat(12));
  const h2 = await page.$eval('#f-themes', el => el.getBoundingClientRect().height);
  assert.ok(h2 > h1);
  assert.ok(h2 < 220, String(h2));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test apps/video-game-name-generator/test/app-css.test.ts && npm run build && npm run test:browser`
Expected: FAIL on the two-column results rule (not yet written) and on any undersized target or overflow found.

- [ ] **Step 3: Implement**

Append to `src/styles/app.css`:
```css
@media (min-width: 1024px) {
  .results__list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 599px) {
  .generator__actions .btn--primary { width: 100%; }
  .result-card__actions .btn, .result-card__actions summary.btn { min-height: var(--target-touch); }
  .shortlist-item { grid-template-columns: minmax(0, 1fr); }
  .shortlist-item__actions { grid-column: 1; grid-row: auto; justify-content: flex-start; }
}
```

Append the auto-grow fallback (browsers without `field-sizing: content`) to `main.ts`:
```ts
const themes = $<HTMLTextAreaElement>('f-themes');
if (!CSS.supports('field-sizing', 'content')) {
  const grow = () => {
    themes.style.height = 'auto';
    themes.style.height = `${Math.min(themes.scrollHeight + 2, parseFloat(getComputedStyle(themes).maxHeight) || themes.scrollHeight)}px`;
  };
  themes.addEventListener('input', grow);
  grow();
}
```

Fix whatever the browser test reports (usually a chip, a summary or a link that needs `min-height: var(--target-min)`), then re-run.

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test apps/video-game-name-generator/test/app-css.test.ts && npm run build && npm run test:browser`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Finish the responsive and mobile layout"
```

---

## M7 — Analytics

### Task 39: Event schema, beacon client and the `/api/e` Pages Function

Spec §24 and Revision 2 decision 14: aggregate counts only. Page views come from Cloudflare Web Analytics (switched on for the Pages project; Cloudflare injects its cookieless beacon, already allowed by the CSP). Events (`generate`, `similar`, `copy`, `save`, `check`) go by `navigator.sendBeacon` to a small Pages Function that writes to Workers Analytics Engine. Properties are enums only: `genre` (31 ids), `myth` (31 ids), `device` (`mobile` < 600 px, `tablet` < 1024 px, `desktop`), and `link` (`google`, `steam`, `itch`) on `check` only. Client and Function both reject anything else. No IP, user agent, cookie or identifier is stored. Global Privacy Control or Do Not Track means no events. Events stay off (`analytics.events = false`) until Task 45 verifies the binding.

**Files:**
- Create: `packages/site-kit/src/analytics.ts`
- Create: `apps/video-game-name-generator/src/analytics-events.ts`, `apps/video-game-name-generator/functions/api/e.ts`
- Modify: `packages/site-kit/src/index.ts`, `apps/video-game-name-generator/src/scripts/main.ts`
- Test: `packages/site-kit/test/analytics.test.ts`, `apps/video-game-name-generator/test/analytics-events.test.ts`, `apps/video-game-name-generator/test/function.test.ts`, `apps/video-game-name-generator/test/browser/analytics.browser.mjs`

**Interfaces:**
- Consumes: `AnalyticsConfig`, `analytics` (Task 27); `GENRE_IDS` from `@vps-name-tools/game-titles/ids`, `MYTH_IDS` from `@vps-name-tools/data/ids` (light entry points, so the Function bundle stays tiny).
- Produces:
  - site-kit: `type DeviceClass = 'mobile' | 'tablet' | 'desktop'`, `deviceClass(width: number): DeviceClass`, `privacySignal(nav: { globalPrivacyControl?: boolean; doNotTrack?: string | null }): boolean`, `interface AnalyticsDeps { send(url: string, body: string): boolean; random(): number; nav: { globalPrivacyControl?: boolean; doNotTrack?: string | null }; width(): number }`, `createAnalytics<P>(config: AnalyticsConfig, validate: (payload: unknown) => P | undefined, deps: AnalyticsDeps): { track(event: string, props: Record<string, string>): boolean }`, `browserAnalyticsDeps(): AnalyticsDeps`
  - app: `TOOL_EVENTS`, `CHECK_LINKS`, `DEVICES`, `type ToolEvent`, `parseToolEvent(x: unknown): ToolEvent | undefined`
  - Function: `onRequest(ctx: { request: Request; env: { EVENTS?: { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void } } }): Promise<Response>`

- [ ] **Step 1: Write the failing tests**

`packages/site-kit/test/analytics.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics, deviceClass, privacySignal, type AnalyticsDeps } from '../src/index';

const sent: string[] = [];
const deps = (over: Partial<AnalyticsDeps> = {}): AnalyticsDeps => ({
  send: (_url, body) => (sent.push(body), true), random: () => 0.5, nav: {}, width: () => 400, ...over,
});
const allowAll = (p: unknown) => p as Record<string, string>;
const on = { pageviews: true, events: true, endpoint: '/api/e', sampleRate: 1 };

test('device classes follow the layout breakpoints', () => {
  assert.equal(deviceClass(599), 'mobile');
  assert.equal(deviceClass(600), 'tablet');
  assert.equal(deviceClass(1023), 'tablet');
  assert.equal(deviceClass(1024), 'desktop');
});

test('Global Privacy Control and Do Not Track switch events off', () => {
  assert.equal(privacySignal({ globalPrivacyControl: true }), true);
  assert.equal(privacySignal({ doNotTrack: '1' }), true);
  assert.equal(privacySignal({ doNotTrack: '0' }), false);
  sent.length = 0;
  assert.equal(createAnalytics(on, allowAll, deps({ nav: { globalPrivacyControl: true } })).track('generate', {}), false);
  assert.equal(sent.length, 0);
});

test('the events flag and sampling gate sending', () => {
  sent.length = 0;
  assert.equal(createAnalytics({ ...on, events: false }, allowAll, deps()).track('generate', {}), false);
  assert.equal(createAnalytics({ ...on, sampleRate: 0.4 }, allowAll, deps({ random: () => 0.5 })).track('generate', {}), false);
  assert.equal(sent.length, 0);
  assert.equal(createAnalytics(on, allowAll, deps()).track('generate', { genre: 'fantasy' }), true);
  assert.deepEqual(JSON.parse(sent[0]), { event: 'generate', genre: 'fantasy', device: 'mobile' });
});

test('payloads the validator rejects are never sent', () => {
  sent.length = 0;
  assert.equal(createAnalytics(on, () => undefined, deps()).track('generate', { themes: 'secret' }), false);
  assert.equal(sent.length, 0);
});
```

`apps/video-game-name-generator/test/analytics-events.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseToolEvent } from '../src/analytics-events';

const ok = { event: 'generate', genre: 'dark-fantasy', myth: 'norse', device: 'mobile' };

test('accepts allowlisted events', () => {
  assert.deepEqual(parseToolEvent(ok), ok);
  assert.deepEqual(parseToolEvent({ ...ok, event: 'check', link: 'itch' }), { ...ok, event: 'check', link: 'itch' });
});

test('rejects anything outside the allowlist', () => {
  for (const bad of [
    { ...ok, event: 'pageview' }, { ...ok, genre: 'racing' }, { ...ok, myth: 'atlantis' }, { ...ok, device: 'watch' },
    { ...ok, themes: 'frozen kingdom' }, { ...ok, title: 'Ashen Oath' }, { ...ok, link: 'google' }, { ...ok, event: 'check' },
    { ...ok, event: 'check', link: 'bing' }, null, 'generate', [ok],
  ]) assert.equal(parseToolEvent(bad), undefined, JSON.stringify(bad));
});
```

`apps/video-game-name-generator/test/function.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/e';

const points: unknown[] = [];
const env = { EVENTS: { writeDataPoint: (p: unknown) => void points.push(p) } };
const post = (body: string, headers: Record<string, string> = {}) =>
  onRequest({ request: new Request('https://x.test/api/e', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } }), env });

test('only POST is accepted', async () => {
  const r = await onRequest({ request: new Request('https://x.test/api/e'), env });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('Allow'), 'POST');
});

test('valid events are written as enum blobs only', async () => {
  points.length = 0;
  const r = await post(JSON.stringify({ event: 'check', genre: 'cozy', myth: 'none', device: 'desktop', link: 'steam' }), { 'cf-connecting-ip': '203.0.113.9', 'user-agent': 'X' });
  assert.equal(r.status, 204);
  assert.deepEqual(points, [{ blobs: ['check', 'cozy', 'none', 'desktop', 'steam'], indexes: ['check'] }]);
  assert.doesNotMatch(JSON.stringify(points), /203\.0\.113|user-agent|X"/);
});

test('invalid, oversized or extra-field bodies are rejected', async () => {
  points.length = 0;
  assert.equal((await post('{nope')).status, 400);
  assert.equal((await post(JSON.stringify({ event: 'generate', genre: 'cozy', myth: 'none', device: 'desktop', themes: 'x' }))).status, 400);
  assert.equal((await post('x'.repeat(600))).status, 413);
  assert.equal(points.length, 0);
});

test('a missing binding is harmless', async () => {
  const r = await onRequest({ request: new Request('https://x.test/api/e', { method: 'POST', body: JSON.stringify({ event: 'save', genre: 'rpg', myth: 'greek', device: 'tablet' }) }), env: {} });
  assert.equal(r.status, 204);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test packages/site-kit/test/analytics.test.ts apps/video-game-name-generator/test/analytics-events.test.ts apps/video-game-name-generator/test/function.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`packages/site-kit/src/analytics.ts`:
```ts
import type { AnalyticsConfig } from './network';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';
export const deviceClass = (width: number): DeviceClass => (width < 600 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop');

export const privacySignal = (nav: { globalPrivacyControl?: boolean; doNotTrack?: string | null }): boolean =>
  nav.globalPrivacyControl === true || nav.doNotTrack === '1';

export interface AnalyticsDeps {
  send(url: string, body: string): boolean;
  random(): number;
  nav: { globalPrivacyControl?: boolean; doNotTrack?: string | null };
  width(): number;
}

export function createAnalytics<P>(config: AnalyticsConfig, validate: (payload: unknown) => P | undefined, deps: AnalyticsDeps) {
  return {
    track(event: string, props: Record<string, string>): boolean {
      if (!config.events || privacySignal(deps.nav) || deps.random() >= config.sampleRate) return false;
      const payload = validate({ event, ...props, device: deviceClass(deps.width()) });
      if (payload === undefined) return false;
      try {
        return deps.send(config.endpoint, JSON.stringify(payload));
      } catch {
        return false;
      }
    },
  };
}

export function browserAnalyticsDeps(): AnalyticsDeps {
  return {
    send: (url, body) => navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' })) ?? false,
    random: Math.random,
    nav: navigator as Navigator & { globalPrivacyControl?: boolean },
    width: () => window.innerWidth,
  };
}
```

Append to `packages/site-kit/src/index.ts`: `export * from './analytics';`

`apps/video-game-name-generator/src/analytics-events.ts`:
```ts
import { MYTH_IDS } from '@vps-name-tools/data/ids';
import { GENRE_IDS } from '@vps-name-tools/game-titles/ids';

export const TOOL_EVENTS = ['generate', 'similar', 'copy', 'save', 'check'] as const;
export const CHECK_LINKS = ['google', 'steam', 'itch'] as const;
export const DEVICES = ['mobile', 'tablet', 'desktop'] as const;

export interface ToolEvent {
  readonly event: (typeof TOOL_EVENTS)[number];
  readonly genre: (typeof GENRE_IDS)[number];
  readonly myth: (typeof MYTH_IDS)[number];
  readonly device: (typeof DEVICES)[number];
  readonly link?: (typeof CHECK_LINKS)[number];
}

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/** The allowlist shared by the client and the Pages Function. Anything else is rejected (spec §24). */
export function parseToolEvent(x: unknown): ToolEvent | undefined {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return undefined;
  const o = x as Record<string, unknown>;
  const allowed = o.event === 'check' ? ['event', 'genre', 'myth', 'device', 'link'] : ['event', 'genre', 'myth', 'device'];
  if (Object.keys(o).some(k => !allowed.includes(k))) return undefined;
  if (!oneOf(TOOL_EVENTS, o.event) || !oneOf(GENRE_IDS, o.genre) || !oneOf(MYTH_IDS, o.myth) || !oneOf(DEVICES, o.device)) return undefined;
  if (o.event === 'check') {
    if (!oneOf(CHECK_LINKS, o.link)) return undefined;
    return { event: o.event, genre: o.genre, myth: o.myth, device: o.device, link: o.link };
  }
  return { event: o.event, genre: o.genre, myth: o.myth, device: o.device };
}
```

`apps/video-game-name-generator/functions/api/e.ts`:
```ts
import { parseToolEvent } from '../../src/analytics-events';

interface AnalyticsEngineDataset { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void }
interface Context { request: Request; env: { EVENTS?: AnalyticsEngineDataset } }

const MAX_BYTES = 512;
const empty = (status: number, headers: Record<string, string> = {}) => new Response(null, { status, headers });

/** Counts allowlisted, enum-only events. Stores no IP, user agent, cookie or identifier (spec §24). */
export const onRequest = async ({ request, env }: Context): Promise<Response> => {
  if (request.method !== 'POST') return empty(405, { Allow: 'POST' });
  const text = await request.text();
  if (text.length > MAX_BYTES) return empty(413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return empty(400);
  }
  const e = parseToolEvent(body);
  if (!e) return empty(400);
  env.EVENTS?.writeDataPoint({ blobs: e.link ? [e.event, e.genre, e.myth, e.device, e.link] : [e.event, e.genre, e.myth, e.device], indexes: [e.event] });
  return empty(204);
};
```

- [ ] **Step 4: Wire the client**

Append to `apps/video-game-name-generator/src/scripts/main.ts`:
```ts
import { analytics as analyticsConfig, browserAnalyticsDeps, createAnalytics } from '@vps-name-tools/site-kit';
import { parseToolEvent } from '../analytics-events';

const analytics = createAnalytics(analyticsConfig, parseToolEvent, browserAnalyticsDeps());
const count = (event: 'generate' | 'similar' | 'copy' | 'save' | 'check', s: { genre: string; myth: string }, extra: Record<string, string> = {}) =>
  analytics.track(event, { genre: s.genre, myth: s.myth, ...extra });
```
Then attach `count` to the hooks (only the settings' genre and myth are passed; never text):
```ts
const generateHandler = handlers.onGenerate;
handlers.onGenerate = s => { generateHandler(s); count('generate', s); };
hooks.onCopy = r => void count('copy', r.settings);
hooks.onCheck = (r, link) => void count('check', r.settings, { link });
const saveHandler = hooks.onSave;
hooks.onSave = (r, button) => {
  saveHandler(r, button);
  if (button.getAttribute('aria-pressed') === 'true') count('save', r.settings);
};
const similarHandler = hooks.onSimilar;
hooks.onSimilar = (r, card, button) => {
  similarHandler(r, card, button);
  if (button.getAttribute('aria-expanded') === 'true') count('similar', r.settings);
};
```

- [ ] **Step 5: Browser test (events off by default)**

`apps/video-game-name-generator/test/browser/analytics.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip, generate } from './helpers.mjs';

useBrowser();

test('with events switched off no request reaches /api/e', { skip }, async () => {
  const { page } = await open('/');
  const hits = [];
  page.on('request', r => { if (r.url().includes('/api/e')) hits.push(r.postData()); });
  await page.type('#f-themes', 'frozen kingdom');
  await generate(page);
  await page.click('#results-list > li [data-action="copy"]');
  await page.click('#results-list > li [data-action="save"]');
  assert.deepEqual(hits, []);
});
```

- [ ] **Step 6: Run to verify pass**

Run: `npx tsx --test packages/site-kit/test/analytics.test.ts apps/video-game-name-generator/test/analytics-events.test.ts apps/video-game-name-generator/test/function.test.ts && npm run typecheck && npm run build && npm run test:browser`
Expected: PASS. Also confirm the privacy note (Task 37 `PRIVACY_POINTS`) still lists exactly these events and properties.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add allowlisted analytics events, the beacon client and the /api/e function"
```

---

## M8 — QA

### Task 40: Accessibility, ad-layout rules and the keyboard run-through

**Files:**
- Modify: `apps/video-game-name-generator/src/pages/index.astro` (ads preview flag), `apps/video-game-name-generator/astro.config.mjs` (preview output directory), `apps/video-game-name-generator/test/browser/helpers.mjs` (`useBrowser({ dist })` option), root `package.json` (scripts `build:ads-preview`, `test:browser:ads`), `.github/workflows/validate.yml`
- Create: `apps/video-game-name-generator/test/browser/a11y.browser.mjs`, `test/browser/keyboard.browser.mjs`, `test/browser/ads-layout.browser.mjs`, `test/browser/screenshot.mjs`
- Test: the files above

**Interfaces:**
- Consumes: everything in M6.
- Produces: `useBrowser({ dist?: string })`; an ads-preview build (`PUBLIC_ADS_PREVIEW=1`, output `dist-ads/`, never deployed) used only to prove the ad-ready layout.

- [ ] **Step 1: Ads preview build and helper option**

`apps/video-game-name-generator/astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

// PUBLIC_ADS_PREVIEW=1 renders the reserved ad containers into dist-ads/ for layout tests only. It is never deployed.
const preview = process.env.PUBLIC_ADS_PREVIEW === '1';
export default defineConfig({ output: 'static', trailingSlash: 'always', outDir: preview ? './dist-ads' : './dist' });
```

In `src/pages/index.astro`, compute `const adsOn = ads.enabled || import.meta.env.PUBLIC_ADS_PREVIEW === '1';` in the frontmatter and pass `adsEnabled={adsOn}` to `CreatorLayout` and `enabled={adsOn}` to `AdSlot`.

In `test/browser/helpers.mjs`, change `useBrowser()` to `useBrowser({ dist: distDir = 'dist' } = {})` and compute the served directory from it: `const dist = fileURLToPath(new URL(`../../${distDir}/`, import.meta.url));` (move the `dist` constant inside `useBrowser` and pass it to `resolve`).

Root `package.json` scripts:
```json
"build:ads-preview": "PUBLIC_ADS_PREVIEW=1 npm run build -w apps/video-game-name-generator",
"test:browser:ads": "node --test apps/video-game-name-generator/test/browser/ads-layout.browser.mjs"
```
Append `apps/*/dist-ads/` to `.gitignore`. The default `test:browser` glob also picks up `ads-layout.browser.mjs`; that file skips itself unless `ADS_PREVIEW=1` is set (shown below).

- [ ] **Step 2: Write the tests**

Install axe: `npm install -D @axe-core/puppeteer axe-core`.

`apps/video-game-name-generator/test/browser/a11y.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { useBrowser, open, skip, generate } from './helpers.mjs';

useBrowser();
const axe = async page => {
  const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
};

for (const width of [1280, 360]) {
  test(`axe: zero violations on the empty page, after Generate, with Similar open and a saved title (${width} px)`, { skip }, async () => {
    const { page, errors } = await open('/', { width, height: 900 });
    assert.deepEqual(await axe(page), []);
    await generate(page);
    await page.click('#results-list > li:nth-child(1) [data-action="save"]');
    await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
    await page.click('#results-list > li:nth-child(2) .check summary');
    await page.$eval('#shortlist-panel', d => { d.open = true; });
    assert.deepEqual(await axe(page), []);
    assert.deepEqual(errors, []);
  });
}

test('axe: zero violations on the 404 page', { skip }, async () => {
  const { page } = await open('/missing/');
  assert.deepEqual(await axe(page), []);
});

test('focus indicators are visible', { skip }, async () => {
  const { page } = await open('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const style = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth}`; });
  assert.notEqual(style.split(' ')[0], 'none', style);
});
```

`apps/video-game-name-generator/test/browser/keyboard.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip } from './helpers.mjs';

useBrowser();
const active = page => page.evaluate(() => {
  const el = document.activeElement;
  return { id: el?.id ?? '', action: el?.getAttribute('data-action') ?? '', text: el?.textContent?.trim().replace(/\s+/g, ' ') ?? '' };
});
async function tabTo(page, predicate, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (predicate(await active(page))) return active(page);
  }
  throw new Error('target not reached by Tab');
}

test('keyboard-only: skip link, generate with Ctrl+Enter, copy, save, similar and check', { skip }, async () => {
  const { page, errors } = await open('/', { width: 1280 });
  await page.keyboard.press('Tab');
  assert.match((await active(page)).text, /Skip to the generator/);
  await page.keyboard.press('Enter');
  await tabTo(page, a => a.id === 'f-themes');
  await page.keyboard.type('ravens, blood oath');
  await page.keyboard.down('Control');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Control');
  await page.waitForSelector('#results-list > li');
  assert.equal((await active(page)).id, 'results-heading');
  await tabTo(page, a => a.action === 'copy');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('announcer').textContent.startsWith('Copied'));
  await tabTo(page, a => a.action === 'save');
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-pressed')), 'true');
  await tabTo(page, a => a.action === 'similar');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-expanded')), 'true');
  await tabTo(page, a => a.text.startsWith('Check'));
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.closest('details').open), true);
  assert.deepEqual(errors, []);
});

test('Enter in the Include field submits; no single-key shortcuts exist', { skip }, async () => {
  const { page } = await open('/');
  await page.$eval('#more-options', d => { d.open = true; });
  await page.focus('#f-include');
  await page.keyboard.type('Aeternum');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#results-list > li');
  const before = await page.$eval('#results-heading', h => h.textContent);
  await page.keyboard.press('g');
  await page.keyboard.press('s');
  assert.equal(await page.$eval('#results-heading', h => h.textContent), before);
});
```

`apps/video-game-name-generator/test/browser/ads-layout.browser.mjs`:
```js
// Runs against the ads-preview build: npm run build:ads-preview && ADS_PREVIEW=1 npm run test:browser:ads
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip as noChrome, generate } from './helpers.mjs';

const skip = noChrome || (process.env.ADS_PREVIEW !== '1' && 'Set ADS_PREVIEW=1 after npm run build:ads-preview.');
if (!skip) useBrowser({ dist: 'dist-ads' });

const layout = page => page.evaluate(() => {
  const r = el => el.getBoundingClientRect();
  const main = document.getElementById('main');
  const rails = [...document.querySelectorAll('.ad-rail')].filter(el => getComputedStyle(el).display !== 'none').map(el => Math.round(r(el).width));
  return { mainLeft: Math.round(r(main).left), mainWidth: Math.round(r(main).width), rails, vw: window.innerWidth };
});

for (const [width, rail] of [[1440, 160], [1700, 300]]) {
  test(`rails of ${rail} px at ${width} px; the generator column stays centred`, { skip }, async () => {
    const { page } = await open('/', { width, height: 900 });
    const l = await layout(page);
    assert.deepEqual(l.rails, [rail, rail]);
    assert.ok(Math.abs(l.mainLeft - (l.vw - l.mainWidth) / 2) <= 1, JSON.stringify(l));
  });
}

test('no rails below 1280 px or on mobile; the below-content slot remains', { skip }, async () => {
  for (const width of [1100, 360]) {
    const { page } = await open('/', { width, height: 800 });
    assert.deepEqual((await layout(page)).rails, []);
    assert.equal(await page.$eval('.ad-slot', el => getComputedStyle(el).display !== 'none'), true);
  }
});

test('ad containers never sit between controls and results, inside results, Similar or the shortlist', { skip }, async () => {
  const { page } = await open('/', { width: 1440 });
  await generate(page);
  await page.click('#results-list > li:nth-child(1) [data-action="save"]');
  await page.click('#results-list > li:nth-child(1) [data-action="similar"]');
  const report = await page.evaluate(() => {
    const ads = [...document.querySelectorAll('[data-ad]')];
    const form = document.getElementById('generator');
    const results = document.getElementById('results');
    const shortlist = document.getElementById('shortlist');
    const after = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      between: ads.filter(ad => after(form, ad) && after(ad, results)).length,
      inside: ads.filter(ad => results.contains(ad) || shortlist.contains(ad) || ad.closest('.similar')).length,
      slotAfterShortlist: after(shortlist, document.querySelector('.ad-slot')),
      fixed: ads.filter(ad => getComputedStyle(ad).position === 'fixed').length,
      railsInMain: ads.filter(ad => ad.classList.contains('ad-rail') && ad.closest('main')).length,
    };
  });
  assert.deepEqual(report, { between: 0, inside: 0, slotAfterShortlist: true, fixed: 0, railsInMain: 0 });
});

test('copied text never includes ad labels', { skip }, async () => {
  const { page } = await open('/', { width: 1440 });
  await generate(page);
  await page.click('#copy-all');
  assert.doesNotMatch(await page.evaluate(() => navigator.clipboard.readText()), /Advertisement/);
});
```

`apps/video-game-name-generator/test/browser/screenshot.mjs` (for reviews; not a test):
```js
// node apps/video-game-name-generator/test/browser/screenshot.mjs  →  docs/brand/capture/app-<width>.png (git-ignored)
import { existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
const chrome = process.env.CHROME_PATH ?? ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium'].find(existsSync);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let p = join(dist, decodeURIComponent((req.url ?? '/').split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
mkdirSync('docs/brand/capture', { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });
for (const width of [1440, 390]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.click('[data-example="0"]');
  await page.waitForSelector('#results-list > li');
  await page.screenshot({ path: `docs/brand/capture/app-${width}.png`, fullPage: true });
}
await browser.close();
server.close();
console.log('Wrote docs/brand/capture/app-1440.png and app-390.png');
```

- [ ] **Step 3: Run**

Run: `npm run build && npm run test:browser && npm run build:ads-preview && ADS_PREVIEW=1 npm run test:browser:ads`
Expected: PASS. Fix every axe violation in markup or CSS (never by disabling a rule).

- [ ] **Step 4: CI**

Append to `.github/workflows/validate.yml` steps:
```yaml
      - run: npm run build:ads-preview
      - run: npm run test:browser:ads
        env:
          CI: 'true'
          ADS_PREVIEW: '1'
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add axe, keyboard and ad-layout browser tests"
```

---

### Task 41: Combination, cultural and collision sweeps

**Files:**
- Create: `scripts/sweep.ts`, `scripts/collisions.ts`
- Modify: root `package.json` (scripts `sweep`, `sweep:quick`, `collisions`), `.github/workflows/validate.yml`
- Output: `docs/content/COLLISION-REVIEW.md` (generated sample for human review)

**Interfaces:**
- Consumes: `generate`, `flattenParts`, `GENRE_IDS`, `STYLE_IDS`, `LENGTH_OPTIONS`, `CREATIVITY_LEVELS`, `GAME` (game-titles); `DATA`, `TONE_IDS`, `containsTerm` (data); `normalize`, `unsafeGenerated` (core).
- Produces: `npm run sweep` (full, release gate), `npm run sweep:quick` (CI), `npm run collisions`.

- [ ] **Step 1: The sweep script**

`scripts/sweep.ts`:
```ts
import { normalize, unsafeGenerated } from '@vps-name-tools/core';
import { DATA, TONE_IDS, containsTerm } from '@vps-name-tools/data';
import { CREATIVITY_LEVELS, GAME, GENRE_IDS, LENGTH_OPTIONS, STYLE_IDS, flattenParts, generate, type Settings, type TitleResult } from '@vps-name-tools/game-titles';

const quick = process.argv.includes('--quick');
const failures: string[] = [];
const times: number[] = [];
const myths = DATA.myths.filter(m => m.review.status !== 'held');

const engineText = (t: TitleResult) => normalize(flattenParts(t.recipe.parts).filter(p => p.kind !== 'user' && p.kind !== 'include').map(p => p.text).join(' '));
const builtWords = (t: TitleResult) => flattenParts(t.recipe.parts).flatMap(p => (p.kind === 'coined' || p.kind === 'compound' ? [p.text] : []));

function run(label: string, s: Partial<Settings>, seed: string, expect = s.count ?? 10) {
  let r;
  const start = performance.now();
  try {
    r = generate(s, { seed });
  } catch (e) {
    failures.push(`${label}: threw ${(e as Error).message}`);
    return;
  }
  times.push(performance.now() - start);
  if (r.titles.length < expect) failures.push(`${label}: ${r.titles.length}/${expect} titles (${r.notices.map(n => n.code).join(',')})`);
  const pack = DATA.myths.find(m => m.id === (s.myth ?? 'none'));
  for (const t of r.titles) {
    const text = engineText(t);
    if (unsafeGenerated(t.title, builtWords(t), DATA.safety)) failures.push(`${label}: unsafe "${t.title}"`);
    if (GAME.knownTitles.has(normalize(t.title))) failures.push(`${label}: known title "${t.title}"`);
    for (const f of GAME.franchiseTerms) if (containsTerm(text, f)) failures.push(`${label}: franchise "${f}" in "${t.title}"`);
    for (const d of pack?.denylist ?? []) if (containsTerm(text, d)) failures.push(`${label}: denylisted "${d}" in "${t.title}"`);
  }
  return r;
}

// 1. Genre × cultural option (961 combinations, spec §18 item 3)
const mythIds = quick ? myths.filter((_, i) => i % 6 === 0).map(m => m.id) : myths.map(m => m.id);
for (const genre of GENRE_IDS) for (const myth of mythIds) run(`${genre}/${myth}`, { genre, myth }, `sweep:${genre}:${myth}`);

// 2. Every tone, style, length and creativity on fixed settings
for (const tone of TONE_IDS) run(`tone ${tone}`, { genre: 'fantasy', tone }, `tone:${tone}`);
for (const style of STYLE_IDS) run(`style ${style}`, { genre: 'dark-fantasy', myth: 'norse', style }, `style:${style}`);
for (const length of LENGTH_OPTIONS) for (const creativity of CREATIVITY_LEVELS) run(`length ${length}/${creativity}`, { genre: 'sci-fi', length, creativity }, `len:${length}:${creativity}`);

// 3. Cultural sweep: 5,000 titles per pack across genres (spec §18 item 7); quick mode uses 400
const perPack = quick ? 400 : 5000;
const genresForPacks = ['fantasy', 'dark-fantasy', 'survival', 'cozy', 'sci-fi', 'strategy', 'horror', 'adventure'] as const;
for (const m of myths) {
  if (m.id === 'none') continue;
  for (let n = 0, i = 0; n < perPack; i++, n += 20) {
    const genre = genresForPacks[i % genresForPacks.length];
    run(`pack ${m.id}/${genre}#${i}`, { genre, myth: m.id, count: 20, creativity: CREATIVITY_LEVELS[i % 3] }, `pack:${m.id}:${i}`, 15);
  }
}

times.sort((a, b) => a - b);
const p95 = times[Math.floor(times.length * 0.95)] ?? 0;
console.log(`${times.length} batches; median ${times[Math.floor(times.length / 2)]?.toFixed(2)} ms; p95 ${p95.toFixed(2)} ms`);
if (p95 > 15) failures.push(`p95 batch time ${p95.toFixed(1)} ms > 15 ms (Node, unthrottled)`);
for (const f of failures.slice(0, 200)) console.log(`FAIL ${f}`);
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nSweep clean.');
process.exit(failures.length ? 1 : 0);
```

- [ ] **Step 2: The collision script**

`scripts/collisions.ts`:
```ts
import { writeFileSync } from 'node:fs';
import { createRng, normalize } from '@vps-name-tools/core';
import { DATA } from '@vps-name-tools/data';
import { CREATIVITY_LEVELS, GAME, GENRE_IDS, STYLE_IDS, generate } from '@vps-name-tools/game-titles';

const TOTAL = 100_000;
const rng = createRng('collisions');
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];
const myths = DATA.myths.filter(m => m.review.status !== 'held').map(m => m.id);
const known = [...GAME.knownTitles];
const exact: string[] = [];
const near: { title: string; known: string }[] = [];
const distance = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
};

let made = 0;
for (let i = 0; made < TOTAL; i++) {
  const r = generate({ genre: pick(GENRE_IDS), myth: pick(myths), style: rng() < 0.5 ? 'auto' : pick(STYLE_IDS), creativity: pick(CREATIVITY_LEVELS), count: 20 }, { seed: `col:${i}` });
  for (const t of r.titles) {
    made++;
    const key = normalize(t.title);
    if (GAME.knownTitles.has(key)) exact.push(t.title);
    else if (near.length < 2000 && key.length >= 5) {
      const hit = known.find(k => k.length >= 5 && distance(key, k) <= 1);
      if (hit) near.push({ title: t.title, known: hit });
    }
  }
}
const sample = near.slice(0, 50);
writeFileSync('docs/content/COLLISION-REVIEW.md', [
  '# Collision review sample', '', `Generated by \`npm run collisions\` from ${made} titles. Exact known-title matches: ${exact.length}.`, '',
  'Near matches (edit distance 1) for human review. Mark any that should join the known-title list.', '',
  '| Generated | Known title |', '|---|---|', ...sample.map(n => `| ${n.title} | ${n.known} |`), '',
].join('\n'));
console.log(`${made} titles; ${exact.length} exact matches; ${near.length} near matches (sample written).`);
process.exit(exact.length ? 1 : 0);
```

Root `package.json` scripts:
```json
"sweep": "tsx scripts/sweep.ts",
"sweep:quick": "tsx scripts/sweep.ts --quick",
"collisions": "tsx scripts/collisions.ts"
```

- [ ] **Step 3: Run**

Run: `npm run sweep:quick`
Expected: `Sweep clean.` Then `npm run sweep` (several minutes) and `npm run collisions`. Expected: clean sweep; 0 exact matches. Fix failures at the source: thin pools mean missing content; denylist or franchise hits mean an entry or profile needs a `forbid` pattern or an entry removed. Review the collision sample by hand; add any title that should never be produced to `known-titles-data.ts`. Record results in `docs/VALIDATION.md`.

- [ ] **Step 4: CI and commit**

Append to `.github/workflows/validate.yml` steps: `- run: npm run sweep:quick`

```bash
git add -A
git commit -m "Add combination, cultural and collision sweeps"
```

---

### Task 42: Performance budgets

**Files:**
- Create: `scripts/check-budget.mjs`, `scripts/lighthouse.mjs`, `apps/video-game-name-generator/test/browser/perf.browser.mjs`
- Modify: `apps/video-game-name-generator/src/scripts/main.ts` (performance marks), root `package.json` (scripts `budget`, `lighthouse`; devDependency `lighthouse`), `.github/workflows/validate.yml`
- Conditional (only if the budget fails): `packages/data/src/core.ts`, `packages/data/src/myths/loaders.ts`, `packages/game-titles/src/defaults.ts`, `packages/game-titles/src/engine.ts`, package `exports`, `apps/video-game-name-generator/src/scripts/data-loader.ts`

**Interfaces:**
- Produces: `npm run budget` (≤ 120 KB gzipped JS + data), `npm run lighthouse` (mobile performance ≥ 95, accessibility 100, SEO 100), the 20-titles-in-30-ms browser test at 4× CPU throttle.

- [ ] **Step 1: Performance marks**

In `main.ts` `runGenerate`, wrap the engine call:
```ts
performance.mark('generate-start');
const batch = generate(s, { exclude: recent.set() });
performance.measure('generate', 'generate-start');
```

- [ ] **Step 2: Write the budget script and the failing perf test**

`scripts/check-budget.mjs`:
```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 120 * 1024;
const dir = 'apps/video-game-name-generator/dist';
const files = [];
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } };
walk(dir);
let total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(f), { level: 9 }).length;
  total += gz;
  console.log(`${(gz / 1024).toFixed(1).padStart(7)} KB  ${f}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  total gzipped JS + data (limit ${LIMIT / 1024} KB)`);
process.exit(total > LIMIT ? 1 : 0);
```

`apps/video-game-name-generator/test/browser/perf.browser.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useBrowser, open, skip } from './helpers.mjs';

useBrowser();

test('20 titles in under 30 ms at 4x CPU throttle (median of 10)', { skip }, async () => {
  const { page } = await open('/', { width: 390, height: 844 });
  await page.click('label:has(input[name="count"][value="20"])').catch(async () => {
    await page.$eval('#fine-tune', d => { d.open = true; });
    await page.click('label:has(input[name="count"][value="20"])');
  });
  await page.$eval('#f-themes', el => { el.value = 'frozen kingdom, ravens, forgotten gods, blood oath, northern lights'; });
  await page.select('#f-genre', 'dark-fantasy');
  await page.select('#f-myth', 'norse');
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (let i = 0; i < 11; i++) {
    await page.click('#generate');
    await page.waitForFunction(n => performance.getEntriesByName('generate').length >= n, {}, i + 1);
  }
  const times = (await page.evaluate(() => performance.getEntriesByName('generate').map(e => e.duration))).slice(1).sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  assert.ok(median < 30, `median ${median.toFixed(1)} ms`);
});
```

- [ ] **Step 3: Lighthouse script**

`npm install -D lighthouse chrome-launcher`

`scripts/lighthouse.mjs`:
```js
// Mobile Lighthouse against the local build. While staging is noindex, the is-crawlable audit is skipped and
// reported separately; Task 45 re-runs without the skip after the indexing switch.
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const dist = 'apps/video-game-name-generator/dist';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = createServer(async (req, res) => {
  let p = join(dist, decodeURIComponent((req.url ?? '/').split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/`;
const chromePath = process.env.CHROME_PATH ?? ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium', '/usr/bin/chromium'].find(existsSync);
const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', ...(process.env.CI ? ['--no-sandbox'] : [])] });
const indexed = process.argv.includes('--indexed');
const { lhr } = await lighthouse(url, { port: chrome.port, output: 'json', formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3 },
  skipAudits: indexed ? [] : ['is-crawlable'] });
await chrome.kill();
server.close();
const score = k => Math.round((lhr.categories[k].score ?? 0) * 100);
const result = { performance: score('performance'), accessibility: score('accessibility'), seo: score('seo') };
console.log(result, indexed ? '' : '(is-crawlable skipped while staging is noindex)');
const ok = result.performance >= 95 && result.accessibility === 100 && result.seo === 100;
process.exit(ok ? 0 : 1);
```

Root `package.json` scripts:
```json
"budget": "node scripts/check-budget.mjs",
"lighthouse": "node scripts/lighthouse.mjs"
```

- [ ] **Step 4: Run**

Run: `npm run build && npm run budget && npm run test:browser && npm run lighthouse`
Expected: budget ≤ 120 KB; perf test median < 30 ms; Lighthouse 95+/100/100. Record the numbers in `docs/VALIDATION.md`.

- [ ] **Step 5 (only if the budget fails): load cultural packs lazily**

Spec §9.3 and §17 allow lazy pack loading when the bundle is over budget. Apply this change, then re-run Step 4.

`packages/data/src/core.ts`:
```ts
import { ALIASES } from './aliases';
import { CONCEPTS } from './concepts';
import { LEXICON } from './lexicon/index';
import { NONE } from './myths/none';
import { PROFILES } from './profiles/index';
import { SAFETY } from './safety';
import { TONES } from './tones';
import type { DataBundle } from './types';

/** Everything except the cultural packs (which load on demand in the browser). */
export const CORE_DATA: DataBundle = { concepts: CONCEPTS, aliases: ALIASES, lexicon: LEXICON, tones: TONES, profiles: PROFILES, myths: [NONE], safety: SAFETY };
```

`packages/data/src/myths/loaders.ts`:
```ts
import type { MythId } from '../ids';
import type { MythPack } from '../types';

type Loader = () => Promise<MythPack>;
export const PACK_LOADERS: Readonly<Record<Exclude<MythId, 'none'>, Loader>> = {
  original: () => import('./original').then(m => m.ORIGINAL), norse: () => import('./norse').then(m => m.NORSE),
  icelandic: () => import('./icelandic').then(m => m.ICELANDIC), germanic: () => import('./germanic').then(m => m.GERMANIC),
  'anglo-saxon': () => import('./anglo-saxon').then(m => m.ANGLO_SAXON), celtic: () => import('./celtic').then(m => m.CELTIC),
  arthurian: () => import('./arthurian').then(m => m.ARTHURIAN), greek: () => import('./greek').then(m => m.GREEK),
  roman: () => import('./roman').then(m => m.ROMAN), egyptian: () => import('./egyptian').then(m => m.EGYPTIAN),
  mesopotamian: () => import('./mesopotamian').then(m => m.MESOPOTAMIAN), persian: () => import('./persian').then(m => m.PERSIAN),
  arabian: () => import('./arabian').then(m => m.ARABIAN), slavic: () => import('./slavic').then(m => m.SLAVIC),
  finnish: () => import('./finnish').then(m => m.FINNISH), japanese: () => import('./japanese').then(m => m.JAPANESE),
  chinese: () => import('./chinese').then(m => m.CHINESE), korean: () => import('./korean').then(m => m.KOREAN),
  indian: () => import('./indian').then(m => m.INDIAN), mesoamerican: () => import('./mesoamerican').then(m => m.MESOAMERICAN),
  aztec: () => import('./aztec').then(m => m.AZTEC), maya: () => import('./maya').then(m => m.MAYA),
  andean: () => import('./andean').then(m => m.ANDEAN), polynesian: () => import('./polynesian').then(m => m.POLYNESIAN),
  african: () => import('./african').then(m => m.AFRICAN), biblical: () => import('./biblical').then(m => m.BIBLICAL),
  gnostic: () => import('./gnostic').then(m => m.GNOSTIC), alchemical: () => import('./alchemical').then(m => m.ALCHEMICAL),
  cosmic: () => import('./cosmic').then(m => m.COSMIC), 'fairy-tale': () => import('./fairy-tale').then(m => m.FAIRY_TALE),
};

/** Loads a pack and the packs it blends (Mesoamerican → Aztec + Maya). */
export async function loadPacks(id: MythId): Promise<MythPack[]> {
  if (id === 'none') return [];
  const pack = await PACK_LOADERS[id]();
  const blended = await Promise.all((pack.blend ?? []).map(b => (b.id === 'none' ? undefined : PACK_LOADERS[b.id]())));
  return [pack, ...blended.filter((p): p is MythPack => p !== undefined)];
}
```

Add `"./core": "./src/core.ts"` and `"./loaders": "./src/myths/loaders.ts"` to `packages/data/package.json` `exports`.

In `packages/game-titles`, move the defaulting out of the engine so the browser can import the engine without the full data bundle:
- `src/generate.ts` and `src/similar.ts`: remove `import { DATA } from '@vps-name-tools/data'` and `import { GAME } from './game'`; rename the exported functions to `generateWith(input, opts: GenerateOptions & { data: DataBundle; game: GameData })` and `generateSimilarWith(source, opts: SimilarOptions & { data: DataBundle; game: GameData })` and use `opts.data` / `opts.game` directly.
- `src/defaults.ts`:
```ts
import { DATA } from '@vps-name-tools/data';
import { GAME } from './game';
import { generateWith } from './generate';
import { generateSimilarWith } from './similar';
import type { GenerateOptions, GenerateResult, SimilarOptions, TitleResult } from './types';
import type { Settings } from './settings';

/** Node and test convenience: the full data bundle by default. */
export const generate = (input: Partial<Settings>, opts: GenerateOptions = {}): GenerateResult =>
  generateWith(input, { ...opts, data: opts.data ?? DATA, game: opts.game ?? GAME });
export const generateSimilar = (source: TitleResult, opts: SimilarOptions = {}): GenerateResult =>
  generateSimilarWith(source, { ...opts, data: opts.data ?? DATA, game: opts.game ?? GAME });
```
- `src/engine.ts`: re-export everything from `index.ts` except `defaults.ts`, `quality.ts` and `validate-game.ts` (they import the full bundle). Add `"./engine": "./src/engine.ts"` to `exports`; `index.ts` additionally exports `./defaults`.

`apps/video-game-name-generator/src/scripts/data-loader.ts`:
```ts
import { CORE_DATA } from '@vps-name-tools/data/core';
import { loadPacks } from '@vps-name-tools/data/loaders';
import type { DataBundle, MythId, MythPack } from '@vps-name-tools/data';

let data: DataBundle = CORE_DATA;
const loaded = new Map<string, MythPack>();

/** Returns a bundle containing the requested pack (and its blends). Bundles are rebuilt only when a pack arrives. */
export async function dataFor(myth: MythId): Promise<DataBundle> {
  if (myth === 'none' || loaded.has(myth)) return data;
  for (const p of await loadPacks(myth)) loaded.set(p.id, p);
  data = { ...CORE_DATA, myths: [...CORE_DATA.myths, ...loaded.values()] };
  return data;
}

/** Warm the remaining packs when the browser is idle, so Wild cross-myth blending and Similar stay instant. */
export function prefetchPacks(ids: readonly MythId[]): void {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  idle(() => { void Promise.all(ids.map(id => dataFor(id))); });
}
```
Then in the app, import `generateWith` and `generateSimilarWith` from `@vps-name-tools/game-titles/engine` (plus `GAME` from the same entry), make `runGenerate` and the Similar hooks `async` (`const data = await dataFor(s.myth)` before calling the engine), import tone labels from `CORE_DATA` instead of `DATA` in `form-options.ts` for client use, and call `prefetchPacks` with the option values of `#f-myth` after the first batch renders. Re-run all tests, the budget and the perf test.

- [ ] **Step 6: CI and commit**

Append to `.github/workflows/validate.yml` steps (after the build): `- run: npm run budget`. Lighthouse stays a release-gate command (scores vary on shared runners); record each run.

```bash
git add -A
git commit -m "Add bundle, engine-speed and Lighthouse budgets"
```

---

### Task 43: Human review, cultural review records and the QA checklist

**Files:**
- Create: `scripts/review-sheet.ts`, `docs/QA-CHECKLIST.md`, `docs/content/review/` (generated CSV files)
- Modify: root `package.json` (script `review-sheet`), `docs/VALIDATION.md`, `README.md` (status table)

**Interfaces:**
- Produces: `npm run review-sheet` (writes the rating sheet) and `npm run review-sheet -- --score <file.csv>` (computes the targets).

- [ ] **Step 1: The review sheet script**

`scripts/review-sheet.ts`:
```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { generate, QUALITY_PRESETS, type Settings } from '@vps-name-tools/game-titles';

const csv = (fields: readonly string[]) => fields.map(f => `"${f.replace(/"/g, '""')}"`).join(',');
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const scoreIdx = process.argv.indexOf('--score');
if (scoreIdx > 0) {
  const rows = readFileSync(process.argv[scoreIdx + 1], 'utf8').trim().split(/\r?\n/).slice(1).map(parseCsvLine);
  const rated = rows.filter(r => r[8]?.trim());
  const fourPlus = rated.filter(r => Number(r[8]) >= 4).length;
  const broken = rows.filter(r => r[9]?.trim().toLowerCase() === 'y').length;
  console.log(`${rated.length} rated; ${(100 * fourPlus / Math.max(1, rated.length)).toFixed(1)}% rated 4+ (target ≥ 30%); ${(100 * broken / Math.max(1, rows.length)).toFixed(1)}% broken (target < 5%)`);
  process.exit(fourPlus / Math.max(1, rated.length) >= 0.3 && broken / Math.max(1, rows.length) < 0.05 ? 0 : 1);
}

const extra: { name: string; settings: Partial<Settings> }[] = [
  { name: 'Brandable fantasy', settings: { style: 'brandable' } },
  { name: 'Epic fantasy style', settings: { style: 'epic-fantasy' } },
  { name: 'Include Aeternum', settings: { include: 'Aeternum' } },
  { name: 'Survival, one word', settings: { genre: 'survival', length: 'one' } },
  { name: 'Space opera subtitle', settings: { genre: 'space-opera', style: 'subtitle' } },
  { name: 'Horror, cryptic', settings: { genre: 'horror', style: 'cryptic' } },
  { name: 'City builder, Roman', settings: { genre: 'city-builder', myth: 'roman' } },
  { name: 'Creature collector, Japanese-inspired', settings: { genre: 'creature-collector', myth: 'japanese' } },
];
const presets = [...QUALITY_PRESETS, ...extra].slice(0, 20);
const date = new Date().toISOString().slice(0, 10);
const lines = [csv(['preset', 'seed', 'title', 'genre', 'myth', 'genre_fit', 'theme_fit', 'originality', 'steam_page', 'broken_y', 'readability', 'notes'])];
for (const p of presets) {
  const titles = [...generate({ ...p.settings, count: 20 }, { seed: `review:${p.name}:a` }).titles, ...generate({ ...p.settings, count: 20 }, { seed: `review:${p.name}:b` }).titles,
    ...generate({ ...p.settings, count: 10 }, { seed: `review:${p.name}:c` }).titles];
  for (const t of titles.slice(0, 50)) lines.push(csv([p.name, t.recipe.seed, t.title, t.settings.genre, t.settings.myth, '', '', '', '', '', '', '']));
}
mkdirSync('docs/content/review', { recursive: true });
const file = `docs/content/review/human-review-${date}.csv`;
writeFileSync(file, `${lines.join('\n')}\n`);
console.log(`Wrote ${lines.length - 1} titles to ${file}. Rate columns 1–5; mark broken titles with "y".`);
```
(The score columns are, in order: `genre_fit`, `theme_fit`, `originality`, `steam_page` ("would I put this on a Steam page?", the column scored as 4+), `broken_y`, `readability`. Keep that order; the scorer reads `steam_page` at index 8 and `broken_y` at index 9.)

Run: `npm run review-sheet`
Expected: `Wrote 1000 titles to docs/content/review/human-review-<date>.csv`.

- [ ] **Step 2: The QA checklist for the checks a person must do**

`docs/QA-CHECKLIST.md`:
```markdown
# Manual QA checklist

Record each completed item in docs/VALIDATION.md (date, device/browser, result, notes). Only record what was actually done.

## Screen readers (spec §16)
- [ ] NVDA + Firefox on Windows: generate, hear the results heading, copy, save, open Similar, open Check, clear the shortlist.
- [ ] VoiceOver + Safari on macOS: same flow; rotor shows h1/h2/h3 in order.
- [ ] VoiceOver on iOS: same flow; Fine-tune summary is read; the Save state is announced as pressed.
- [ ] TalkBack + Chrome on Android: same flow.

## Cross-browser (spec §18 item 13)
- [ ] Chrome, Firefox, Safari (macOS and iOS), Samsung Internet: generate, copy (clipboard works inside the tap), save, reload, download and import.

## Content review
- [ ] Human review sheet rated (docs/content/review/…csv) and scored: ≥ 30% rated 4+, < 5% broken.
- [ ] Every cultural pack reviewed or held with a reason (npm run pack-status); external readers for Tier B packs if arranged.
- [ ] Collision sample reviewed (docs/content/COLLISION-REVIEW.md).
- [ ] VPS token sheet approved (docs/brand/VPS-CREATOR-VISUAL-SYSTEM.md).
```

- [ ] **Step 3: Status and records**

Update the README status table to distinguish implemented, tested and planned items honestly. Add rows to `docs/VALIDATION.md` for every automated check run so far (unit, property, browser, axe, sweeps, collisions, budget, Lighthouse) with date, environment and result.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add the human review sheet, QA checklist and validation records"
```

---

## M9 — Launch (Cloudflare Pages, one primary page)

Launch scope (Revision 2 decisions 3 and 5): the generator page, a 404 page, the on-page privacy note, robots.txt and a sitemap. The six SEO landing pages are not required and are not built.

### Task 44: Deploy workflow, Cloudflare Pages project and a staging deployment

**Prerequisites (user):** the GitHub secrets `CLOUDFLARE_API_TOKEN` (scope: Account › Cloudflare Pages › Edit) and `CLOUDFLARE_ACCOUNT_ID`, and a `main` branch made from the approved work. See "Actions only you can take".

**Files:**
- Create: `.github/workflows/deploy.yml`, `apps/video-game-name-generator/wrangler.toml`
- Modify: `README.md` (deploy and rollback section), `docs/VALIDATION.md`

**Interfaces:**
- Produces: production deployments of `apps/video-game-name-generator/dist` plus `functions/` to the Pages project `vps-video-game-name-generator`, on pushes to `main` (and manual runs).

- [ ] **Step 1: Pages configuration**

`apps/video-game-name-generator/wrangler.toml`:
```toml
# Cloudflare Pages configuration for the Video Game Name Generator.
# The Analytics Engine binding for /api/e is added in Task 45 once the account has Workers Analytics Engine.
name = "vps-video-game-name-generator"
pages_build_output_dir = "./dist"
compatibility_date = "2026-09-01"
```

- [ ] **Step 2: The deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
# Production deployment for the Video Game Name Generator (VPS Utility Network › Creator Tools).
# Every push to main is checked, tested and built here, then uploaded with Wrangler Direct Upload to the
# Cloudflare Pages project "vps-video-game-name-generator". This workflow is the only deployment path.
# Requires repository secrets CLOUDFLARE_API_TOKEN (Account > Cloudflare Pages > Edit) and CLOUDFLARE_ACCOUNT_ID.
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: cloudflare-pages-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run validate:release
      - run: npm run quality -- --check
      - run: npm run sweep:quick
      - run: npm run check
      - run: npm run build
      - run: npm run budget
      - run: npm run test:browser
        env:
          CI: 'true'
      - name: Create the Pages project on first run
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: >-
          npx --yes wrangler@4 pages project list | grep -q "vps-video-game-name-generator" ||
          npx --yes wrangler@4 pages project create vps-video-game-name-generator --production-branch=main
      - name: Deploy to Cloudflare Pages (production)
        working-directory: apps/video-game-name-generator
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          COMMIT_MESSAGE: ${{ github.event.head_commit.message }}
        run: >-
          npx --yes wrangler@4 pages deploy dist
          --project-name=vps-video-game-name-generator
          --branch=main
          --commit-hash="$GITHUB_SHA"
          --commit-message="$(printf '%s' "${COMMIT_MESSAGE:-Manual deployment}" | head -n 1)"
          --commit-dirty=false
```
(Wrangler picks up `functions/` because the deploy runs from the app directory.)

- [ ] **Step 3: Validate the workflow locally**

Read the workflow side by side with the toolkit's `deploy.yml` (same action versions, concurrency group and Wrangler flags), then run `npm run typecheck && npm test && npm run build && npm run test:browser`.
Expected: all green.

- [ ] **Step 4: First deployment and smoke test (after the user creates `main` and the secrets)**

Push to `main` (or run the workflow manually). When it finishes:
```bash
curl -sSI https://vps-video-game-name-generator.pages.dev/ | grep -iE "^(content-security-policy|x-robots-tag|x-frame-options|referrer-policy):"
curl -sS https://vps-video-game-name-generator.pages.dev/robots.txt
curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://vps-video-game-name-generator.pages.dev/api/e -H 'content-type: application/json' -d '{"event":"generate","genre":"fantasy","myth":"none","device":"desktop"}'
curl -sS -o /dev/null -w "%{http_code}\n" https://vps-video-game-name-generator.pages.dev/api/e
BASE_URL=https://vps-video-game-name-generator.pages.dev npm run test:browser
```
Expected: the CSP and `X-Robots-Tag: noindex, nofollow` headers are present; robots.txt disallows; the POST returns `204` (binding not yet attached, so nothing is stored) and the GET returns `405`; the browser suite passes against the deployed site. Record the results in `docs/VALIDATION.md`.

- [ ] **Step 5: README deploy and rollback notes, then commit**

Add a "Deploy" section to `README.md`: what deploys and when, the secrets, the staging `noindex` state, and rollback ("promote the previous deployment in the Cloudflare Pages dashboard, then revert the commit on `main`").

```bash
git add -A
git commit -m "Add the Cloudflare Pages deploy workflow and Pages config"
```

---

### Task 45: Release gate, analytics switch-on, domain and the indexing switch

**Files:**
- Modify: `packages/site-kit/src/network.ts` (`tool.canonicalUrl`, `tool.indexing`, `analytics.events`), `apps/video-game-name-generator/public/_headers` (remove the `X-Robots-Tag` line), `apps/video-game-name-generator/wrangler.toml` (Analytics Engine binding), `README.md`, `docs/VALIDATION.md`, `docs/content/CULTURAL-PACK-STATUS.md`
- Test: existing suites, especially `apps/video-game-name-generator/test/indexing.test.ts` and `packages/site-kit/test/network.test.ts` (update its `ads`/`analytics`/`indexing` expectations only as each switch is deliberately flipped)

**Interfaces:** none new.

- [ ] **Step 1: Release gate (spec §25)**

Run and record each in `docs/VALIDATION.md`:
```bash
npm ci && npm run typecheck && npm test && npm run validate:release && npm run quality -- --check
npm run sweep && npm run collisions
npm run check && npm run build && npm run budget && npm run test:browser
npm run build:ads-preview && ADS_PREVIEW=1 npm run test:browser:ads
npm run lighthouse
npm run pack-status
npm run review-sheet -- --score docs/content/review/<the rated file>.csv
```
Expected: everything green; Lighthouse ≥ 95 / 100 / 100; the review targets met; every cultural pack `reviewed` (or `externally-reviewed`) or `held` with a reason. Confirm with the user: the token sheet is approved (Task 26), the disclaimer and privacy copy are final, the manual checks in `docs/QA-CHECKLIST.md` are done, and the pack status is accepted. If a pack is held, the release notes name it and the reason.

- [ ] **Step 2: Switch on analytics events (only after the binding is verified)**

When the user confirms Workers Analytics Engine is available, append to `apps/video-game-name-generator/wrangler.toml`:
```toml
[[analytics_engine_datasets]]
binding = "EVENTS"
dataset = "vps_name_tools_events"
```
Deploy, POST one test event with `curl` (as in Task 44 Step 4), and ask the user to confirm it appears in the dataset (Analytics Engine SQL API or dashboard). Only then set `analytics.events = true` in `packages/site-kit/src/network.ts`, update the expectation in `packages/site-kit/test/network.test.ts` (`assert.equal(analytics.events, true)`), and update the Task 39 browser test to expect beacons containing only `event`, `genre`, `myth`, `device` (and `link` for checks):
```js
test('events carry enums only', { skip }, async () => {
  const { page } = await open('/');
  const bodies = [];
  page.on('request', r => { if (r.url().endsWith('/api/e')) bodies.push(JSON.parse(r.postData())); });
  await page.type('#f-themes', 'frozen kingdom');
  const beacon = page.waitForRequest(r => r.url().endsWith('/api/e'));
  await generate(page);
  await beacon;
  for (const b of bodies) assert.deepEqual(Object.keys(b).sort(), ['device', 'event', 'genre', 'myth']);
  assert.ok(bodies.some(b => b.event === 'generate'));
});
```
If Analytics Engine is not available on the plan, leave events off: page views still work through Cloudflare Web Analytics.

- [ ] **Step 3: Domain**

When the user has chosen the domain and added it to the Pages project (Custom domains), set `tool.canonicalUrl` to it (with a trailing slash), rebuild, and regenerate the Open Graph image only if the tokens changed (`node scripts/og-image.mjs`). Run `npm test` (the canonical-URL test checks there are no parameters).

- [ ] **Step 4: Flip the indexing switch (all three together)**

1. `packages/site-kit/src/network.ts`: `indexing: true`.
2. `apps/video-game-name-generator/public/_headers`: delete the `X-Robots-Tag: noindex, nofollow` line.
3. `robots.txt` follows automatically (`robotsText(true)` allows and names the sitemap); the robots meta tag disappears because the page passes `tool.indexing`.

Update `packages/site-kit/test/network.test.ts` (`assert.equal(tool.indexing, true)`) and the Task 31 shell browser test (expect no robots meta and an `Allow` robots.txt). Run:
```bash
npx tsx --test apps/video-game-name-generator/test/indexing.test.ts packages/site-kit/test/network.test.ts
npm run build && npm run test:browser && npm run lighthouse -- --indexed
```
Expected: the agreement test passes; Lighthouse SEO is 100 with `is-crawlable` included.

- [ ] **Step 5: Launch**

Merge to `main`; the deploy workflow publishes. Verify with `curl -sSI <domain>` (no `X-Robots-Tag`), `curl <domain>/robots.txt` (Allow + Sitemap) and `BASE_URL=<domain> npm run test:browser`. Ask the user to add the property in Google Search Console and submit `sitemap.xml`. Update the README status table (implemented / tested / launched) and add the launch row to `docs/VALIDATION.md`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Launch: enable indexing, set the canonical domain and record the release gate"
```

**Rollback:** promote the previous deployment in the Cloudflare Pages dashboard, then revert on `main`. To re-hide the site, restore the three `noindex` switches together (the agreement test enforces this).

**After launch (not part of this plan):** watch Search Console for 8–12 weeks before deciding on any evidence-based landing page (spec §15.2); domain lookup and other Phase 2 items stay out of scope.
