# Video Game Name Generator: Blueprint (Design Spec)

| | |
|---|---|
| **Status** | Revision 2, 2026-10-08. Direction approved with the changes listed below. Nothing is built yet. |
| **Product** | Free, standalone creator utility in the VPS Utility Network (Creator Tools) |
| **Codebase** | VPS Name Tools workspace (this repository); first and only tool for now: Video Game Name Generator |
| **Audience** | Indie developers, game-jam teams, worldbuilders, writers, RPG and TTRPG designers |
| **Hosting** | Cloudflare Pages, one primary generator page |
| **Implementation plan** | `docs/superpowers/plans/2026-10-08-video-game-name-generator.md` |
| **Parent blueprint** | VPS Utility Network Master Blueprint v1.1 (in the VPS-Landscape-Project-Toolkit repository). Deviations are recorded in §26. |

**How to read this.** Sections 1–21 follow the order of your original deliverable list; sections 22–26 were
added in Revision 2. The appendices hold the template catalogue, phonetic-profile sketches, worked examples
and sources. All example titles in this document are hand-written to show intended behaviour. They are not
engine output, and nobody has checked them against existing games.

**Research method (be aware).** This environment's network policy blocked direct page loads of the
generator sites (fantasynamegenerators.com, namelix.com, thestoryshack.com and others) and of
valkyrjapublishingstudios.com. The competitor research therefore relies on search-indexed descriptions,
third-party reviews and long-standing knowledge of how these tools work. The visual capture of the VPS site
is a planned step that runs once the site is reachable (§22.2).

### Revision 2 decisions (2026-10-08)

| # | Decision |
|---|---|
| 1 | Keep None + all 30 cultural styles at launch, with the care tiers and imagery-first rules. If a pack cannot be completed responsibly in time, report that pack and the reason; never cut the catalogue broadly. |
| 2 | Keep all 31 genres. The engine stays data-driven, so genres can be added without changing generation logic. |
| 3 | The six SEO landing pages are optional post-launch work, decided by Search Console data. Launch is one excellent generator page. |
| 4 | This repository becomes a small shared VPS Name Tools codebase. Only the Video Game Name Generator is built now; future reuse never widens this tool's UI or scope. |
| 5 | Hosting is Cloudflare Pages. Network utilities may use separate domains; the main VPS website (WordPress) is separate. |
| 6–7 | The visual direction comes from the main Valkyrja Publishing Studios website, translated into a dark, cinematic, modern creator-tool UI, not the Landscape Toolkit's VPS Earth look. Mythology lives in the content, not the decoration (§22). |
| 8 | Identity: VPS Utility Network → Creator Tools → Video Game Name Generator; subtle VPS branding; link to Valkyrja Publishing Studios; Other Free Creator Tools; no service-business funnel (§23). |
| 9 | Ads: optional desktop side rails when wide enough; one responsive area below the functional content; never between controls and results, inside results or the shortlist, or as pop-ups. No rails on mobile. No ad code until requested (§23.4). |
| 10–13 | Feature set, "steer, don't force", Generate Similar as a flagship feature, and the browser-only procedural runtime are confirmed. Check links: Google, Steam, itch.io. |
| 14 | Privacy-friendly aggregate analytics; never typed themes, Include or Avoid words, favourites or shortlist contents (§24). |
| 15 | Defaults: Fantasy · None · Auto tone · Auto style · Any length · Balanced · 10 results. |
| 16 | Classic frames (Echoes of, Shadow of, Chronicles of, Rise of, Legends, Saga) stay available at reduced frequency; batches are never dominated by them. |
| 17 | Safety filtering is contextual. Ordinary numbers such as 14 or 88 are allowed ("Station 88", "Sector 14"); only explicit extremist phrases and code combinations are blocked. |
| 18 | Domain checking moves to Phase 2. Never claim "available" or "trademark safe"; the disclaimer stays. |
| 19 | English-first UI and titles. Cultural packs shape sound, imagery and rhythm without posing as translations. |
| 20 | Keep the full engine (35 templates, concepts, phonetic profiles, batch diversity, quality rules, reusable design). Keep the interface simple. |

---

## 1. Competitive Research Summary

### 1.1 What was reviewed

| Tool | Category | How it works | Notable for |
|---|---|---|---|
| Fantasy Name Generators (video game names) | Game titles | Pick one of 6 genres, get 10 names per click; two optional boxes replace the first or second half of each result | Speed, volume, zero friction; the de facto standard |
| The Story Shack (video game title generator) | Game titles | Randomised word combinations, part of 2,500+ generators | Breadth; quirky results; no steering |
| Codeitbro Random Game Name Generator | Game titles | Verb/noun/adjective combinations nudged by genre | Typical output: "Cyber Void Chronicles", "Happy Farm Tycoon" |
| Imagine Forest, CoolGenerator, GeneratorMix | Game titles | One button, optional category | Simple, but repetitive and impersonal |
| Masterpiece Generator | Game titles | Your own words + templates, bulk lists | Keyword input; reviewers note pop-ups and banners |
| SpinXO | Usernames | Personal info → handles | Not titles, but often confused with them in roundups |
| Seele AI, Taskade, Texta, Simplified, YouWare | AI title tools | LLM prompt with genre, tone, setting, keywords | Real steering; slower, often account- or paywall-gated, generic |
| Ahrefs "game business name" | AI naming | LLM with a tone selector | Aimed at studio names, not game titles |
| Namelix | Brand naming (AI) | Keywords + style (brandable, evocative, short phrase, compound, alternate spelling, non-English, real words) + randomness (low/medium/high) | Best-in-class style taxonomy and randomness dial; saved names tune later results |
| Wordoid | Invented words | Language flavour (English, Spanish, French, Italian, mixes), "naturalness" quality slider, fixed fragment at start/middle/end, max length, domain status | Pronounceable coined words with a quality control |
| NameMesh | Domain naming | Keywords → grouped results (common, new, short, similar, SEO, mix) + availability | Grouping results by *kind* of name |
| donjon / Name Forge | Fantasy names | Markov chains trained on real-culture name lists; pattern engine for invented peoples | Culture-flavoured names; the author admits many weak results |
| RinkWorks (and clones) | Fantasy names | Tiny pattern language: syllable/vowel/consonant codes, alternation, literals, capitalisation | Templates as data; very controllable |
| Zompist Gen, Lexifer, Awkwords, Vocabug | Conlang word generators | Phoneme categories + syllable types + frequency drop-off + rewrite rules | The right model for a pronounceable invented-word engine |
| Tracery, Perchance | Text-grammar engines | Symbols expand into rules recursively; nested lists | Cheap, endless structural variety from small data |

Two pieces of naming research also shaped this plan:

- **PC Gamer on forgettable Steam names** (Hannah Flynn, Failbetter): developers copy the sound of other games'
  names and land on bland, near-identical titles. A developer thread counted roughly 11,500 Steam results for
  "fall of", 8,200 for "shadow of" and 2,750 for "echoes of".
- **Chris Zukowski's 2025 analysis of 94,371 Steam releases**: most titles are 1–3 words; length does not
  correlate with sales; about 13% use a colon subtitle, and colon "genre stuffing" is falling. An older study
  of 5,820 Steam games found an average of 2.8 words per title.

### 1.2 What competitors do well

1. **Zero friction.** One click, ten results, no account. Fantasy Name Generators wins on this alone.
2. **Fast re-rolls.** Users judge names in batches. Ten per click is the right default.
3. **Style taxonomies.** Namelix shows that "what kind of name" (brandable, evocative, compound, real word) matters as much as topic.
4. **A creativity dial.** Namelix's low/medium/high randomness is easy to grasp.
5. **Pronounceable invented words.** Wordoid's language flavour and naturalness slider beat random letter soup.
6. **Fragment anchoring.** Wordoid's start/middle/end fragment and FNG's half-replacement boxes satisfy the "it must contain X" need.
7. **Grammar engines.** RinkWorks, Tracery and Perchance prove that small, well-structured data gives huge variety at zero cost.
8. **Availability next to the idea.** Domain tools put the "is it taken?" question beside each result.

### 1.3 What competitors do poorly

1. **One formula, forever.** Most random game-title tools glue an adjective to a noun ("Infected Legends", "Eclipse Arena"). After 30 results every title sounds the same.
2. **No coherence.** Words are picked independently, so titles mix unrelated ideas ("Cyber Void Chronicles").
3. **No real steering.** Random tools ignore your game. Keyword boxes do literal substitution and paste your word into every result.
4. **Cliché saturation.** "Shadow of", "Echoes of", "Fall of", "Legends", "Chronicles", "Quest" dominate, which is exactly what makes Steam names forgettable.
5. **Mythology means name-dropping.** Culture-specific generators exist for *character* names. Game-title tools either ignore culture or drop a deity name into a template.
6. **AI tools trade one problem for others.** They steer well but are slow, often gated behind sign-up or payment, cost money per click, send your ideas to a server, and drift in tone between runs.
7. **No avoid list, no memory.** Almost none let you ban words, and few keep favourites past a reload.
8. **Collision checks stop at domains.** Nobody links straight to Steam or itch.io searches, where game-title collisions actually matter.
9. **Ad-cluttered workflows.** Ads between controls and results, pop-ups and interstitials.
10. **Thin SEO pages.** Thousands of near-duplicate "X name generator" pages with the same tool and no useful content.

### 1.4 Feature-by-feature verdict

| Feature | Seen in | Verdict |
|---|---|---|
| Genre filters | FNG (6 genres), CoolGenerator, AI tools | **MVP**: 31 genres, data-driven |
| Tone / mood | Ahrefs, Seele, Simplified | **MVP**: 19 tones + optional secondary tone |
| Seed words | FNG half-replacement, Masterpiece, AI tools | **MVP**: handled by the themes field |
| Custom keywords / themes | AI tools only | **MVP, core differentiator**, done without AI |
| Title length | Namelix, Texta | **MVP**: one Length control |
| Naming style | Namelix | **MVP**: 13 styles + Auto |
| Randomness / creativity | Namelix | **MVP**: Focused / Balanced / Wild |
| Word locking | Wordoid, FNG | **MVP**: Include word (any position). **Phase 2**: start/end placement |
| Avoid / blacklist | Rare; recommended in naming guides | **MVP** |
| Favourites | Namelix | **MVP**: local storage, no account |
| Copy to clipboard | Common | **MVP**, plus Copy all |
| Bulk generation | FNG (10), Masterpiece | **MVP**: 5/10/20. Bigger dumps rejected (§20) |
| Title structures | Mostly one or two patterns | **MVP**: 35 templates (Appendix A) |
| Mythology / cultural style | Character-name tools only | **MVP, key differentiator** |
| Pronunciation / readability | Wordoid, conlang tools | **MVP**: built-in readability scoring. **Phase 2**: "Hear it" |
| Collision / searchability | Domain tools only | **MVP**: outbound Google, Steam and itch.io searches + known-title guard. No availability verdicts. Domain lookup in Phase 2 |
| Save / export | Rare | **MVP**: Copy all, Download (TXT/JSON) and Import (JSON). **Phase 2**: CSV |

---

## 2. Recommended Product Direction

### 2.1 Positioning

> **Game titles that fit *your* game.** Pick a genre, a mythic or cultural flavour and a tone, describe your
> world in a few words, and get varied, readable title ideas instantly. Free, no sign-up, no AI fees, and it
> runs entirely in your browser.

The tool competes on **fit, variety and respect**, not on volume or "AI magic":

- **Fit**: your themes steer vocabulary and imagery without being pasted into every title.
- **Variety**: 35 structures, batch-level diversity rules and cliché control stop the adjective+noun treadmill.
- **Respect**: mythology shapes sound, imagery and rhythm. It never means inserting gods' names.

### 2.2 Who it serves and the jobs they bring

| User | Job |
|---|---|
| Game-jam team | "We need a working title in five minutes." |
| Indie developer before a Steam page | "Our working title is taken or bland; give us a shortlist that fits the game." |
| Worldbuilder / TTRPG designer | "Name my campaign, module, in-world game, realm or expansion." |
| Designer exploring a pitch | "What would a Norse survival game *sound* like?" |

### 2.3 Product principles

1. **Fast.** A batch appears in under 50 ms. No spinners, no network round trip.
2. **Honest.** No fake quality scores, no "available ✓" badges, no claims a name is legally free.
3. **Private.** Inputs never leave the device.
4. **Respectful.** Cultural packs are imagery-led and reviewed. Living traditions get extra care.
5. **Calm.** No ads inside the workflow, no upsells, no funnel.
6. **Small.** Every feature must earn its place. The MVP is a generator, a results list and a shortlist.

### 2.4 Shape of the solution

A static web page with a client-side procedural engine:

- **Engine** (pure TypeScript, no DOM): structure templates, a tagged and weighted lexicon, a concept
  dictionary for theme steering, a phonetic engine for invented words, constraint filters, and a
  scorer that picks a diverse batch.
- **UI**: one form, one results list, one shortlist. Plain TypeScript, no framework needed.
- **Site**: one pre-rendered static page on Cloudflare Pages, plus a tiny Pages Function that only counts allowlisted analytics events.

AI enters only at **authoring time**: a language model may help draft word lists, and a human curates every
entry before it ships. Running costs stay at zero (§8).

---

## 3. MVP Feature Set

The interface stays simple: arrive, pick a few settings, type a vibe, generate. Everything else sits behind
sensible defaults or one disclosure.

**Generator**
1. Controls: Genre (31), Mythology / Cultural Inspiration (None + 30), Tone (19, Auto by default) with an optional second tone, Naming Style (13, Auto by default), Length, Creativity (Focused / Balanced / Wild), Results (5 / 10 / 20, default 10).
2. "Themes, words, lore or vibe" field: free text or comma-separated words, applied with the "steer, don't force" rules (§10).
3. Include this word (hard constraint) and Avoid these words, under "More options".
4. Generate button (also Ctrl/⌘+Enter in the themes field) and a small **Surprise me** link that randomises genre, myth and tone.

**Results**
5. Title, chips (genre · style · myth), one-line identity note.
6. Per result: **Copy** · **Save** · **Generate Similar** · **Check** (Google, Steam, itch.io).
7. **Copy all** results.

**Shortlist**
8. Saved on this device (local storage), no account: Copy, Remove, Similar, **Copy all**, **Clear all** (inline confirmation).
9. **Download** (TXT or JSON) and **Import** (JSON) in a small menu in the shortlist header. Added for consistency with the network rule that every utility offers backup and restore of locally saved work (§26); it is easy to drop if you prefer.

**Page and network**
10. Locally remembered settings and a "Clear my saved data" control in the privacy note.
11. Disclaimer and privacy note.
12. VPS Creator Tools identity: network breadcrumb, Other Free Creator Tools, link to Valkyrja Publishing Studios (§23).
13. Ad-ready layout (side rails and one below-content area) with ads switched off (§23.4).
14. Privacy-friendly aggregate analytics (§24).
15. Built-in quality rules: batch diversity, frequency control for classic frames, readability checks, known-title guard, contextual safety filtering.

**Not in the MVP:** SEO landing pages (post-launch, §15.2), domain lookups (Phase 2) and everything in §19 and §20.

---

## 4. Genre List

### 4.1 Rules

- Each genre is **one data file**. Adding a genre means adding a file. No engine changes.
- A genre may inherit from a parent at half weight (Dark Fantasy → Fantasy, Cosmic Horror → Horror).
- A genre sets **concept boosts** (vocabulary), **template weights** (structures), **default tones**,
  a **length bias**, optional **frame words** ("Chronicles", "Tales"), optional **genre suffixes**
  ("Tactics", "Farm", "Online"), concepts to suppress (Cozy suppresses gore and war) and a fallback phonetic profile.
- The select groups genres with `<optgroup>`s so 31 options stay scannable.
- **Default on first load: Fantasy.**

### 4.2 The 31 MVP genres

| Group | Genre | Vocabulary leans toward | Favoured structures | Default tones | Length |
|---|---|---|---|---|---|
| Fantasy & RPG | Fantasy | crown, realm, oath, blade, relic, tower, vale, spell | of-phrase, the-noun, name:subtitle, compound | Epic, Mystical | Medium |
| | Dark Fantasy (→ Fantasy) | ash, blood, ruin, rot, curse, hollow, pyre, thorn, grave | pair, compound, prepositional | Dark, Grim | Short–medium |
| | High Fantasy (→ Fantasy) | star, silver, song, age, elder, spire, dawn, light | the-noun-of, frame, saga, name:subtitle | Epic, Elegant | Medium–long |
| | RPG | journey, fate, realm, age, guild, relic, chronicle | frame, name:subtitle, of-phrase | Epic, Heroic | Medium–long |
| | Action RPG (→ RPG) | blade, hunt, fang, fury, siege, strike, wrath, iron | compound, verb-the-noun, pair | Brutal, Cinematic | Short–medium |
| | Tabletop-inspired / CRPG | tome, tavern, codex, campaign, keep, crypt, ledger, party | the-noun-of, possessive, name:subtitle, frame | Heroic, Whimsical | Medium–long |
| | MMO | realm, world, age, kingdom, guild, frontier | name + "Online/Realms/Worlds", of-phrase | Epic, Heroic | Medium–long |
| Horror | Horror | dread, hollow, rot, night, house, whisper, bone, door | single, the-noun, imperative, sentence | Dark, Mysterious | Short |
| | Psychological Horror (→ Horror) | memory, mirror, quiet, absence, room, static, guilt, loop | sentence, imperative, single abstract, possessive | Melancholic, Surreal | Short–medium |
| | Cosmic Horror (→ Horror) | deep, abyss, star, tide, signal, aeon, void, sunken, dream | prepositional, "The X from Y", coined, of-phrase | Weird, Ancient | Medium |
| Sci-Fi & Punk | Sci-Fi | orbit, signal, station, colony, drift, vector, core, protocol | code, single, pair, name:subtitle | Cinematic, Minimalist | Short |
| | Cyberpunk (→ Sci-Fi) | neon, chrome, grid, ghost, wire, glitch, syndicate, rain | code, compound, coined, pair | Dark, Cinematic | Short |
| | Space Opera (→ Sci-Fi) | empire, star, fleet, throne, nebula, dynasty, frontier | of-phrase, name:subtitle, frame | Epic, Cinematic | Medium–long |
| | Post-Apocalyptic | ash, rust, dust, remnant, ruin, scrap, after, wasteland | prepositional ("After the…"), single, number | Grim, Melancholic | Short |
| | Steampunk | brass, gear, cog, aether, airship, clockwork, foundry, gaslight | the-noun-of, possessive, compound, duo | Whimsical, Elegant | Medium |
| | Dieselpunk | diesel, iron, smog, rivet, factory, radio, propaganda | pair, code, number, name:subtitle | Grim, Retro | Short–medium |
| Adventure & Survival | Adventure | journey, map, compass, isle, horizon, expedition, wind | of-phrase, prepositional, possessive | Heroic, Mysterious | Medium |
| | Survival | winter, hunger, shelter, fire, wild, salt, last, storm | verb-the-noun, number, pair, single | Grim, Brutal | Short |
| | Roguelike / Roguelite | depth, loop, run, descent, crypt, spiral, deck, fate | compound, single, prepositional ("Below"), number | Grim, Playful | Short |
| | Sandbox | world, build, forge, frontier, island, ground, make | compound, single, pair | Playful, Modern | Short |
| Cozy & Life | Cozy | hearth, tea, garden, cottage, bloom, quilt, honey, lantern, moss | cozy place, possessive, duo, pair | Cozy, Whimsical | Short–medium |
| | Farming / Life Sim (→ Cozy) | farm, harvest, valley, seed, orchard, meadow, season, barn | place, descriptive, "…Farm/Days/Life" | Cozy, Playful | Medium |
| | Creature Collector | critter, wild, bond, egg, nest, isle, buddy, tamer | coined (soft), compound, duo, "…Keepers/Tamers" | Playful, Whimsical | Short |
| Strategy & Simulation | Strategy | empire, dominion, siege, banner, front, command, dynasty | of-phrase, pair, "…Tactics/Command" | Epic, Cinematic | Medium |
| | City Builder | city, harbor, district, settlement, bridge, river, founders | place, descriptive, "…Founders/Builders" | Cozy, Elegant | Short–medium |
| | Simulation | shop, workshop, career, routine, craft, manager | descriptive, "…Simulator/Manager", possessive | Playful, Modern | Medium |
| Mystery & Puzzle | Puzzle | tile, key, light, shape, knot, lock, mirror, prism | single, compound, coined, pair | Minimalist, Playful | Short |
| | Mystery | secret, clue, manor, letter, fog, cipher, missing, lake | the-noun-of, possessive, "The X Affair", prepositional | Mysterious, Elegant | Medium |
| | Detective / Noir | rain, smoke, case, city, neon, gin, badge, alley, ledger | case, pair, sentence, "… at Midnight" | Dark, Melancholic | Medium |
| Setting | Western | dust, frontier, gold, outlaw, mesa, bounty, canyon, sundown | pair, the-noun-of, "West of X", number | Grim, Cinematic | Short–medium |
| | Historical | empire, dynasty, crown, siege, age, banner, legion, river | of-phrase, name:subtitle, number | Epic, Ancient | Medium–long |

Genre-specific guard rails (enforced by blocklists and the known-title guard):

- Creature Collector: never "Pocket … Monsters" or a "-mon" suffix.
- Tabletop-inspired: no D&D trademarks or setting names ("Dungeons & Dragons", "Forgotten Realms", "Baldur's Gate", "beholder").
- Sandbox: "-craft" is heavily penalised (a strong Minecraft echo).
- Post-Apocalyptic: "Fallout" is blocked.
- Western: no stereotyped Native American imagery.

### 4.3 Candidates for later

Metroidvania, Platformer, Shooter/FPS, Racing, Sports, Fighting, Rhythm, Visual Novel, Dating Sim, Tactics,
Deckbuilder, Stealth, Immersive Sim, Open World, Pirate/Nautical, Mecha, Superhero, Grimdark, Solarpunk,
Weird West, Gothic, Idle/Incremental, Tower Defense, 4X / Grand Strategy, Party, Educational. Add them
based on what users ask for.

---

## 5. Mythology / Cultural Style List

### 5.1 How a cultural style works

A style ("myth pack") influences five things, and **never** inserts deity names:

| Influence | Mechanism |
|---|---|
| **Phonetics** | Chooses the phonetic profile for invented words and place names (§9.6). |
| **Imagery** | Adds a curated set of evocative common nouns and adjectives (raven, rune, frost for Norse). |
| **Concepts** | Boosts concept tags (oath, fate, winter) across the whole lexicon. |
| **Symbolic vocabulary** | A short, reviewed list of non-sacred cultural terms ("wyrd", "saga"), used sparingly. |
| **Rhythm** | Adjusts template weights (kennings for Norse, triads for Celtic, parallel couplets for Chinese-inspired). |

**Care tiers**

- **Tier A, historical or literary traditions** (classical, medieval, literary and esoteric sources):
  full use, including invented words. Still: no mockery, and no symbols co-opted by hate movements.
- **Tier B, living cultures and religions**: imagery-led. No deity or sacred names. Symbolic vocabulary
  limited to widely used, non-sacred folkloric terms. Invented words appear less often, using the Neutral
  profile or a restrained dedicated one (Celtic, Slavic, Finnic, Japanese-inspired), because fake Japanese, Arabic or Nahuatl reads as caricature to speakers and can accidentally form real words.
  Labels say "-inspired". Each Tier B pack gets a review before launch (§18.7).

**Universal guard rails**

- Safety filtering is contextual, to avoid false positives:
  - **At authoring time,** pack and lexicon review keeps extremist-coded vocabulary out of the data. This
    matters most for the Norse and Germanic packs, whose imagery has been misused.
  - **At runtime, on engine output only,** a short list of unambiguous extremist phrases and codes compiled
    from the ADL Hate Symbols Database ("1488", "14/88", "Blood and Soil", "Fourteen Words", "Sieg Heil",
    "Fourth Reich", "Sonnenrad", "Wolfsangel"), plus one combination rule: a single title never pairs 14 and 88.
  - **Ordinary numbers are allowed.** "Station 88" and "Sector 14" are fine. Common imagery such as
    "Black Sun" (an eclipse image in countless works) is not banned.
- No direct franchise vocabulary (Mythos proper nouns, Tolkien names, Disney titles, game-franchise terms).
- ASCII spelling by default (ð → d or th, þ → th, æ → ae) so titles stay typeable and searchable.

**Default on first load: None / Neutral.**

### 5.2 The 31 MVP options (None + 30 styles)

| Style | Profile | Imagery and concepts (sample) | Rhythm and structures | Tier and notes |
|---|---|---|---|---|
| None / Neutral | Neutral | Genre vocabulary only | Genre defaults | n/a |
| Norse | Norse | frost, raven, wolf, rune, oath, ash, longhall, serpent, wyrd, skald, iron, storm | Hard monosyllables; kennings ("Wolf-Winter"); -bound/-born/-fall compounds | A. Extremist-coded vocabulary excluded at authoring time; runtime phrase list applies |
| Icelandic / Old Norse-inspired | Norse (Icelandic variant) | glacier, lava, ash plain, saga, outlaw, assembly, long night, turf, fjord | Spare one- and two-word titles; "The Saga of X", "X's Saga" | A (medieval saga literature); ASCII-folded |
| Germanic | Germanic | forest, iron, march, oak, hunt, mine, castle, witch, lindworm | -mund/-wald/-burg/-hild endings; pair, of-phrase | A |
| Anglo-Saxon | Old English | mead-hall, barrow, wyrd, wyrm, fen, hoard, helm, thane, moot | Kennings; alliterative pairs | A; æ/þ folded |
| Celtic | Celtic | mist, cairn, barrow, oak, hound, cauldron, torc, tide, hollow, bard | Triads ("Stone, Salt and Song"); lilting -wyn/-ach/-mor/-dun | B (Irish, Gaelic, Welsh and Breton are living languages): no fake Gaelic spelling |
| Arthurian | Celtic + Old English blend | grail, lake, knight, chapel, wasteland, isle, oath, court, siege | Romance titles: "The Knight of X", "Lay of X", "X and the Y" | A (medieval romance); no "Round Table" or "Excalibur" verbatim |
| Greek | Hellenic | laurel, labyrinth, oracle, marble, olive, hymn, fate, aether, lyre, ichor | "The X of Y"; epithets; -os/-ia/-is/-eon | A |
| Roman | Latin | legion, eagle, forum, laurel, imperium, arena, aqueduct | Latin single words (aeternum, ignis, umbra) and hand-checked two-word phrases only | A; no machine-built Latin grammar |
| Egyptian | Ancient | sand, scarab, obelisk, dune, river, reed, tomb, jackal, falcon, papyrus | Stately of-phrases: "Sands of X", "Book of X" | A; "Curse of the Pharaoh" is cliché-penalised |
| Mesopotamian | Ancient | ziggurat, clay tablet, flood, lion, star, reed, city wall, gate, bull | Inscription-like: "Tablet of X", "Seven X" | A |
| Persian | Neutral, low rate | garden, rose, nightingale, mirror, cypress, pomegranate, citadel, poet | Poetic: "Of Roses and Ash" | B; Zoroastrian sacred terms excluded |
| Arabian | Neutral, low rate | dune, oasis, caravan, star chart, brass lamp, sandstorm, astrolabe, mirage | Tale-frames: "The X of a Thousand Y" | B; religious terms excluded; Orientalist clichés penalised |
| Slavic | Slavic | birch, crossroads, steppe, bog, linden, frost, firebird, hut, wolf | -grad/-ov/-ica/-mir endings; folkloric pairs | B (living cultures; folk-spirit names only as rare flavour) |
| Finnish | Finnic | lake, birch, bear, spruce, ice, fox-fire (aurora), kantele, forge | Alliteration and parallelism; double vowels and consonants | B |
| Japanese | Japanese-inspired (mora) | lantern, fox, ink, blossom, crane, tide, mountain pass, paper, moon | Short balanced pairs; seasonal juxtaposition ("Late Snow") | B; no kami names; "ninja/samurai/geisha" penalised; coined words rare and labelled |
| Chinese | Neutral, low rate | jade, crane, mountain, river, scroll, bamboo, ink, phoenix, tiger | Parallel couplets ("Jade River, Iron Sky"); four-part rhythm | B; no pseudo-Mandarin coined words |
| Korean | Neutral, low rate | magpie, tiger, pine, crane, tide, fox, moon, ink, mountain | Short pastoral pairs | B; no pseudo-Korean coined words |
| Hindu / Indian mythology | Neutral, low rate | lotus, river, monsoon, peacock, serpent, chariot, conch, banyan, elephant | Epic and cyclical: "The Age of X" | B, highest care: no deity names, no sacred syllables, no "exotic" framing |
| Mesoamerican | Neutral, low rate (blend of the Aztec and Maya packs) | jade, obsidian, jaguar, feathered serpent, cenote, maize, codex, eclipse | Calendar and count references ("Thirteen Suns") | B (living Nahua and Maya communities); no pseudo-Nahuatl/Mayan |
| Aztec | Neutral, low rate | obsidian, eagle, jaguar, lake city, flower, sun, causeway | As above, with stronger sun and war imagery | B; sacrifice is not a default trope |
| Maya | Neutral, low rate | jungle, cenote, stela, star-path, codex, jade, maize, bat | Astronomical and cyclical | B |
| Incan / Andean | Neutral, low rate | condor, terrace, mountain, knotted cords, sun, gold, highland road, cloud forest, llama | Mountain/sun pairings | B (living Quechua and Aymara cultures) |
| Polynesian | Neutral, low rate | ocean, voyaging canoe, star path, reef, island, tide, coral, trade wind, wayfinding | Navigation and sea imagery | B; "tiki" excluded; "mana" excluded (sacred concept) |
| African mythology | Neutral, low rate | baobab, savanna, river, drum, trickster, spider, iron, gold, storyteller, harmattan | Storytelling frames ("The Tale of X") | B. Africa holds thousands of traditions, so the MVP label is "African folklore-inspired (pan-African)". Split into named traditions later, with consultation |
| Biblical / Apocryphal | Neutral | covenant, exile, wilderness, seraph, psalm, relic, flood, salt, scroll, garden | Scriptural cadence: "The Book of X", "And the Rivers Shall Burn" | B (living faiths); no divine names, no mockery |
| Gnostic / Esoteric | Ancient | aeon, archon, demiurge, spark, veil, mirror, emanation, light | Abstract paradox: "The Light Beneath" | A |
| Lovecraftian / Cosmic | Cosmic | abyss, deep, star, sunken city, tide, dream, void, aeon, eldritch, lighthouse | "The X from Y", "Beneath the X", "At the X of Y" | A. Many of Lovecraft's stories are public domain in the US, but Mythos proper nouns stay out for originality, and his racial themes are not reproduced |
| Fairy Tale / Folklore | Soft/Whimsical | woods, cottage, crow, spindle, briar, wolf, mirror, well, wish, apple, bramble | "The X Who Y", "X and the Y", "Little X" | A (European folklore); Disney titles blocked |
| Alchemical / Occult | Ancient | crucible, mercury, sulfur, salt, sigil, grimoire, retort, ouroboros, nigredo | Latin-flavoured pairs; "Opus X", "The Great Work" | A |
| Original Mythic / Mixed | Neutral | A curated "generic mythic" bank: oath, relic, star, tide, hollow, crown, ember | Blends two random packs at low weight (Wild only) | n/a; the "build your own pantheon" option |

Note on overlaps: Norse, Icelandic, Germanic and Anglo-Saxon overlap on purpose. They differ in profile
(Old English sounds softer and more alliterative; Germanic leans on continental endings) and in imagery
(volcanic saga landscape for Icelandic). "Mesoamerican" is implemented as a blend of the Aztec and Maya packs,
so the three options stay consistent.

**Launch completeness.** All 30 styles ship at launch. Each pack carries a review record (status, reviewer,
date, notes) and a denylist of names it must never produce (deity and sacred names for Tier B packs, franchise
names for literary packs). If a pack cannot pass its review in time, the release report names that pack and
the reason, and only that pack is held back (§18, item 7).

---

## 6. Tone Options

Tones bias vocabulary through per-entry tone affinities, nudge phonetics, and shift template weights.

- **Default: Auto**, which uses the genre's default tones.
- An optional **second tone** applies at half weight. It hides behind a "+ add a second tone" link.

| Tone | Vocabulary bias | Sound bias | Structure bias |
|---|---|---|---|
| Epic | vast, age, war, crown, legend | Long vowels | of-phrase, subtitle, frame |
| Dark | night, blood, rot, ruin | Harsh consonants | pair, single, prepositional |
| Grim | ash, iron, hunger, grave, cold | Short closed syllables | single, compound, number |
| Mystical | star, rune, veil, moon, dream | Liquids and sibilants (l, r, s, th) | of-phrase, prepositional |
| Heroic | dawn, banner, oath, rise, blade | Strong stops | verb-the-noun, frame, subtitle |
| Whimsical | berry, button, puddle, whistle | Soft profile, -le/-kin endings | possessive, duo; alliteration bonus |
| Cozy | hearth, tea, quilt, moss, warm | Soft profile | place, possessive; violent concepts suppressed |
| Romantic | rose, heart, vow, letter, moonlight | Soft | duo, poetic, possessive |
| Melancholic | last, empty, rain, faded, quiet, remain | Open vowels | sentence, "After the…", single abstract |
| Brutal | bone, fury, siege, fang | Hard clusters (kr, gr), short words | single, compound, verb-the-noun |
| Mysterious | hidden, cipher, fog, door, missing | s/sh sounds | the-noun, case, prepositional, imperative |
| Ancient | elder, aeon, tomb, first, relic | Archaic register, Latinate endings | of-phrase, saga, epithet |
| Elegant | silver, swan, glass, marble | Liquids, no harsh clusters | the-adj-noun, duo, poetic |
| Weird | fungus, eye, wrong, tangle, jelly | Unusual pairings (wildcard pool raised) | sentence, compound, coined |
| Surreal | dream, clock, cloud, melting, door | Cross-category pairings | sentence, poetic |
| Cinematic | last, protocol, rising, zero, dawn | Strong pairs | name:subtitle, number, code |
| Minimalist | Single abstract words | ≤ 8 characters | single, coined |
| Retro | super, turbo, blaster, mega, quest | Arcade register | "Super X", "X Blaster", genre suffix |
| Playful | bounce, pop, zip, buddy, tumble | Soft plosives; alliteration | duo, compound, possessive |

Conflicting combinations (Cozy + Brutal) are allowed and simply blend. Odd pairings are a creative tool.

---

## 7. Naming Styles

Style sits independent of genre: it picks *what kind of title* to build. **Default: Auto (mixed)**, which
blends styles using the genre's weights.

Examples below all use **Dark Fantasy · Norse · themes "frozen kingdom, ravens, forgotten gods, blood oath"**
so you can see how style alone changes output.

| Style | Behaviour | Example |
|---|---|---|
| Short & Punchy | 1–2 words, ≤ 2 syllables per word, ≤ 14 characters | Rimeblood · Oathfall |
| Epic Fantasy | the-noun-of, frame, subtitle; lofty register | Oath of the Frozen King |
| Poetic | Prepositional phrases, "Where the…", sentence fragments, abstract nouns | Where the Ravens Keep Their Oaths |
| Brandable | Mostly one coined (5–9 letters) or compound (≤ 12 letters) word, easy spelling; up to 20% two-word brand names | Skaldra · Vaskeld |
| Evocative | Unusual but coherent noun pairings, concrete imagery | Blood & Aurora · Raven Salt |
| Compound Word | Head + tail morphemes ("Frost" + "bound") | Frostbound · Ravenmarch |
| Invented Word | Phonetic engine only | Hrimvald · Eldrun |
| Ancient / Mythic | Archaic words, saga and epithet frames | Wyrd of the Frost-Kings |
| Modern | Plain contemporary words, numbers, no archaic register | Cold Oath · Last Winter |
| Cryptic | Abstract singles, ordinals, negations, codes | Unsworn · Ninth Frost |
| Descriptive | Says what the game is (useful for store discoverability) | Frozen Kingdom Survival |
| Subtitle-heavy | Always "Name: Subtitle" | Rimeholt: The Unbroken Oath |
| Franchise-style | Name + franchise word ("Origins", "Tactics", "Online", "Legends") or "Name: Subtitle" | Vaskeld Tactics · Ravenmark: Origins |

**Fantasy + Brandable vs Fantasy + Epic Fantasy:** Brandable returns mostly one-word coined or compound names
("Skaldra"). Epic Fantasy returns three-to-six-word phrases ("Oath of the Frozen King"). Both draw on
the same Fantasy vocabulary and concepts.

### 7.1 Length (one control)

Your brief offered Title Length and Word Count as alternatives. Two controls that overlap would crowd the
panel, so the MVP merges them into one **Length** control. Subtitle format is reached through the
Subtitle-heavy style or Length = Long.

| Option | Rule |
|---|---|
| **Any** (default) | Mix guided by the genre's length bias and the style |
| 1 word | Single, compound and coined templates only |
| Short | 1–2 words, ≤ 16 characters |
| Medium | 2–4 words, ≤ 28 characters |
| Long | 4+ words or any subtitle, ≤ 48 characters |

### 7.2 Creativity

| Lever | Focused | Balanced (default) | Wild |
|---|---|---|---|
| Weight sharpening (T in §9.4) | 0.7: favourites dominate | 1.0 | 1.5: flatter, rarer words surface |
| Titles using a user word literally | ~60% | ~40% | ~25% (the rest use related concepts) |
| Wildcard vocabulary (adjacent genres, surreal pairings) | 0% | ~6% | ~18% |
| Invented words, unless the style says otherwise | ≤ 10% | ≤ 20% | ≤ 35% |
| Templates | Highest-weighted only | All | Rare templates boosted |
| Cross-myth blending | No | No | Light |

Tier B cultural packs multiply the invented-word caps by their lower `coinedRate`.

---

## 8. Generation Architecture

### 8.1 Options considered

| Option | Cost per click | Speed | Control and consistency | Privacy | Verdict |
|---|---|---|---|---|---|
| **A. Procedural engine in the browser** (templates + tagged lexicon + concept steering + phonetics) | $0 | < 50 ms | High: deterministic, testable, tunable | Inputs stay local | **Recommended for MVP** |
| B. AI API for every click | Grows with usage; abuse risk | 1–5 s | Low: tone drift, generic output, hard to test | Inputs sent to a third party | Rejected (§20) |
| C. Hybrid: procedural by default + optional AI "refine" | $0 by default; paid only on click | Mixed | Mixed | Mixed; needs disclosure | Optional future, opt-in only |
| D. Markov chains trained on real name corpora | $0 | Fast | Medium: derivative output, licensing of corpora, "lots of junk" | Local | Not for MVP; maybe a later invented-word variant |

### 8.2 Recommendation: procedural engine now, AI at authoring time

**Runtime: Option A.** Everything runs in the browser from bundled data. Generation is deterministic
for a given seed, which makes tests reliable and enables share links later.

**Authoring time: AI-assisted drafting.** A language model may help *draft* candidate word lists, concept
aliases and pack imagery during development. A human curates every entry before it ships, checking fit,
franchise terms and cultural care. This captures most of an LLM's breadth at zero running cost and with no
privacy trade-off.

The engine stays fast, cheap and functional, which is your stated preference, and it leaves room for an
optional opt-in AI feature later without redesign (§19).

### 8.3 Codebase structure (VPS Name Tools)

The repository becomes a small npm-workspaces codebase that follows the VPS Utility Network convention
(Astro static pages, TypeScript modules, Cloudflare Pages). Shared parts are written so later name tools
(characters, places, factions) can reuse them, but only the Video Game Name Generator is built now.

```
packages/
  core/         @vps-name-tools/core: generic engine code (seeded random, weighted choice, text
                utilities, theme steering, Avoid rules, contextual safety, phonetic engine, diverse
                selection). No game-title knowledge.
  data/         @vps-name-tools/data: shared content (concepts, aliases, core lexicon, 19 tones,
                16 phonetic profiles, None + 30 cultural packs, safety lists) and its validator.
  game-titles/  @vps-name-tools/game-titles: the game-title domain (31 genres, 13 styles,
                35 templates, title vocabulary, known-title guard, context, fill, render, score,
                notes, generate, Similar).
  site-kit/     @vps-name-tools/site-kit: VPS Creator visual system and network shell (tokens, base
                CSS, header, footer, ad rails and slot, Other Free Creator Tools, storage adapter,
                shortlist store, analytics client).
apps/
  video-game-name-generator/  Astro site: the generator page, 404, UI scripts, security headers,
                              and one Pages Function for analytics events.
```

Every engine module is a pure function over data and never touches the DOM. Exact files and interfaces are
in the implementation plan.

### 8.4 Pipeline

```
generate(settings, seed):
  ctx   = buildContext(settings)            // weighted pools, template weights, constraints
  cands = []
  repeat count × 6 times:                   // over-generate, then choose
    t      = pickTemplate(ctx, quotas)
    anchor = pickAnchorConcept(ctx)         // user concepts first (§10)
    parts  = fillSlots(t, anchor, ctx)      // include word, user phrase, lexicon, coined
    title  = render(parts)                  // forms, compounds, articles, title case
    if passesFilters(title, ctx): cands.push(score(title, ctx))
  picks = selectDiverse(cands, count, quotas)   // greedy: best score minus similarity to picks
  return picks.map(attachMetaAndNote)
```

Scoring and selecting from six times as many candidates is what makes batches feel curated. With ~120
candidates the whole pipeline takes a few milliseconds.

### 8.5 Batch diversity rules (defaults)

- No template family supplies more than 30% of a batch, and adjective + noun is capped at 20% (rounded down,
  minimum 1: a batch of 10 allows 3 and 2; a batch of 5 allows 1 and 1).
- No head noun repeats within a batch. No lexicon word appears more than twice, except the Include word.
- Classic frames ("Echoes of", "Shadow of", "Chronicles of", "Rise of", "Fall of", "Legends", "Saga", "Quest")
  stay available at reduced weight. Each appears at most once per batch, and together they fill at most 20%
  of a batch (minimum 1). If the user types one of these words in Themes or Include, its penalty is lifted.
- The session remembers the last 500 shown titles and avoids repeating them.

### 8.6 Technology

Follows the VPS Utility Network baseline (Master Blueprint §6) and the conventions in the VPS Landscape
Project Toolkit repository.

| Concern | Choice |
|---|---|
| Runtime | Node 22.16.0 (`.node-version`), npm workspaces |
| Language | TypeScript, strict |
| Site | Astro static output, `trailingSlash: 'always'`, one interactive page; no server adapter |
| UI | Plain TypeScript modules; the form is rendered as HTML at build time and enhanced by one script |
| Engine tests | Node's test runner via `tsx --test` (network convention) + fast-check property tests |
| Browser tests | puppeteer-core driving Chrome/Chromium (network convention) + axe-core |
| Validation | zod in build and test scripts only, never shipped to the browser |
| Fonts | Self-hosted via @fontsource; no third-party font service |
| Hosting | Cloudflare Pages, deployed by GitHub Actions with Wrangler Direct Upload (as the toolkit does) |
| Server code | One small Pages Function for allowlisted analytics events (§24); nothing else |

**Budgets:** generator JS + data ≤ 120 KB gzipped (target ~80 KB). 20 titles in < 30 ms on a mid-range
phone (4× CPU throttle in tests). LCP < 1.5 s.

**Security:** user text only ever reaches the DOM through `textContent`, never `innerHTML`. Inputs are length-capped
(themes 500 chars, include 40, avoid 500) and stripped of control characters. A strict Content-Security-Policy
(the toolkit's baseline plus the Cloudflare Web Analytics hosts) ships from day one and is revisited when ads arrive.
The repository is public, so it never holds secrets; deploy credentials live in GitHub Actions secrets.

---

## 9. Word-Bank / Pattern Architecture

### 9.1 Principles

1. **Tag, don't list.** One shared lexicon of tagged entries replaces per-genre adjective and noun lists.
   Genres, myths, tones and themes reweight the same entries.
2. **Store word forms.** Each entry carries its plural, adjective, gerund and past forms (Ash → Ashes, Ashen).
   No guessing at English morphology.
3. **Concepts carry meaning.** Every entry has 2–5 concept tags (fire, ruin, oath). Steering, coherence,
   identity notes and Regenerate Similar all run on concepts.
4. **Families power "Similar".** Entries that are near-synonyms share a family id (ash, ember, cinder, soot).
5. **Clichés are data.** Each entry has a cliché score that lowers its weight and drives the per-batch caps.

### 9.2 Vocabulary categories

Places · objects · creatures · forces · emotions · events · verbs · materials · weather · celestial ·
religious/mythic concepts · conflict · technology · nature · abstract concepts · **plus** people/roles
(knight, keeper, tamer), time (dawn, age, winter), colours/qualities (pale, crimson, hollow), frame words
(chronicles, tales, saga), place tails (-moor, -mere, -wick, -hold), compound heads and tails, numbers and
ordinals, prepositions, and short predicate phrases ("never sleeps", "remember").

### 9.3 Sizing (initial content targets)

| Data | Target size |
|---|---|
| Core lexicon | 1,200–1,800 entries |
| Concept registry | 250–400 concepts |
| Alias dictionary (theme steering) | ~1,000–1,500 keys |
| Per genre | ~30 concept boosts + 10–30 genre-specific entries + frame/suffix words |
| Per cultural pack | 40–80 imagery entries + 0–20 reviewed symbolic terms |
| Compound heads / tails | ~120 / ~80 |
| Place tails | ~60 |
| Templates | 35 (Appendix A) |
| Phonetic profiles | 16 (§9.6) |
| Known-title guard | 1,500–3,000 famous titles, compiled from public best-seller and notable-game lists |

Raw data should land around 150–250 KB (40–70 KB gzipped). If cultural packs push the total over budget,
they load lazily when selected.

### 9.4 Weighting formula

For each candidate entry in a slot pool:

```
w = base
  × genreAffinity        (preset multiplier, parent at half strength)
  × mythAffinity         (pack multiplier; pack imagery entries get a strong boost)
  × toneAffinity         (primary + 0.5 × secondary)
  × styleRegister        (Ancient favours archaic; Modern penalises it)
  × conceptBoost         (user > myth > genre; see §10)
  × (1 − clichéPenalty)
  × coherenceBonus       (× 1.5 if it shares a concept with this title's anchor)

then w' = w^(1 / T)      (T from Creativity: Focused 0.7, Balanced 1.0, Wild 1.5)
```

Example weights for the two presets from your brief:

| Norse + Dark Fantasy | Cozy + Creature Collector |
|---|---|
| frost, oath, raven, ash, rune, vale, wyrd, crown, pyre, blood: × 3–5 | grove, meadow, pocket, bloom, buddy, island, lantern, berry, nest: × 3–5 |
| hollow, iron, wolf, ember, grave: × 2 | puddle, sprout, whistle, moss, pebble: × 2 |
| neon, chrome, office, laser: × 0 (suppressed) | blood, gore, war, corpse: × 0 (suppressed) |

### 9.5 Templates and slots

A template is a pattern with typed slots: `{adj} {noun}`, `{name}: {subtitle}`, `The {noun} of {nounPl}`.
Slot types: `noun`, `nounPl`, `adj`, `verb`, `gerund`, `abstract`, `name`, `place`, `compound`, `coined`,
`number`, `frame`, `suffix`, `prep`, `predicate`, `subtitle` (a sub-grammar), and literal text.

Each template declares its **family** (for quotas), **word range**, **length class**, **style and genre
weights**, and which slots can hold the **Include word**. All 35 MVP templates are listed in Appendix A, grouped into
families (single, compound, coined, pair, of-phrase, prepositional, sentence, imperative, frame, possessive,
subtitle, suffix, descriptive, place, code/number, and the myth rhythms: kenning, triad, couplet, saga,
epithet, alliterative pair).

**Rendering rules**

- Title case keeps small words lowercase (of, the, and, in, a, at, from) unless first, last or right after a colon.
- Compounds join head + tail ("Frost" + "bound"), never triple a letter, and hyphenate when the seam is hard to read.
- Place names come from compound place parts ("Raven" + "moor"), coined roots + place tails ("Vask" + "holt"), or descriptive phrases ("the Frozen Reach").
- Numbers come from curated lists (Nine, Seventh, Thirteen, 47, 88). Ordinary numbers are allowed; the only
  number rules are the contextual ones in §5.1.

### 9.6 Phonetic / invented-word engine

Inspired by Zompist Gen and Lexifer, and implemented from scratch.

**A profile is data:** weighted onsets, nuclei and codas; syllable shapes (CV, CVC, CCVC…) with weights;
a syllable-count distribution; allowed medial clusters; forbidden sequences; preferred endings (morpheme
suffixes such as -holt, -wick, -ara, -ex); spelling rewrite rules (ks → x); and readability limits.

**Generation:** pick a syllable count → build syllables by weighted choice with frequency drop-off → maybe
add an ending → apply rewrites → validate → score.

**Readability checks, every profile:**

- 3–12 letters (Brandable: 5–9).
- Vowel ratio 0.28–0.62.
- No letter three times in a row. No consonant run longer than three, except whitelisted onsets (str, skr).
- No `q` without `u`, no `vv`/`uu`/`ii`, outside profiles that allow them.
- Apostrophes only in the Cosmic profile, at most one.
- Fails if it contains a profanity or extremist-term substring, or matches a known title. A false positive costs nothing: the engine draws another word.

**MVP profiles (16):** Neutral · Norse (with Icelandic variant) · Germanic · Old English · Celtic ·
Elven / High-fantasy · Slavic · Finnic · Latin · Hellenic · Ancient (also serves occult and esoteric styles) ·
Cosmic · Sci-fi · Cyberpunk · Soft/Whimsical (cozy and creature-collector names such as "Mossling") ·
Japanese-inspired (mora-based, low default frequency per §5.1). When the cultural option is None, the genre's
fallback profile applies (High Fantasy → Elven, Cyberpunk → Cyberpunk, Cozy → Soft/Whimsical). Appendix B
sketches three profiles.

These are *inspiration systems*. The page says so: invented words are not real words in any language.

---

## 10. Custom Theme Steering Logic

This is the heart of the tool. The goal is to **prioritise the user's identity without pasting their words
into every title.**

### 10.1 Parsing the themes field

1. Split on commas, semicolons and line breaks into **phrases** ("blood oath", "northern lights").
   A single sentence with no commas is split into chunks around stopwords.
2. Normalise: lowercase for matching, keep the original casing for output, trim, drop empty items, cap at 20 phrases.
3. Tokenise phrases, drop stopwords (the, of, and, a, with, my), and lemmatise lightly with rules plus a
   small irregular map (ravens → raven, frozen → frost/freeze, forgotten → forget, broken → break).
4. Match each phrase and token, in order:
   - **Alias dictionary** (multi-word first): "northern lights" → aurora, sky, light, north, cold;
     "analog horror" → signal, static, tape, broadcast, dread.
   - **Lexicon** entry text and forms: "raven" → the Raven entry and its concepts.
   - **Concept ids** directly: "winter".
5. Anything unmatched becomes a **raw user word**, usable verbatim. A part-of-speech guess decides where it
   can go: -ing → gerund; -ed/-en → adjective; otherwise noun or name.

### 10.2 Turning matches into influence

| Source | Effect |
|---|---|
| Direct concept match | Concept boost × 3.0 |
| Alias-derived concept | × 1.8 |
| Lexicon entry the user named | That entry × 4.0; its family × 1.5 |
| Raw user word | Candidate filler for compatible slots |

User boosts apply **after** genre and myth weights, so the user's identity wins conflicts. Typing "neon"
under Norse will produce neon-and-frost titles, not ignore it.

### 10.3 "Steer, don't force"

- **Per title**, the engine picks one **anchor concept**, weighted toward user concepts. Other slots prefer
  entries that share a concept with the anchor (the coherence bonus), so each title holds together.
- **Literal use**: a title includes one of the user's own words or phrases with probability
  Focused 0.6 / Balanced 0.4 / Wild 0.25. The other titles express the themes through related vocabulary
  ("frozen kingdom" → Rime, Crown, Pale Throne).
- **Coverage scheduler**: across a batch, literal uses rotate through the user's phrases. No single phrase
  appears in more than 30% of titles, unless the user gave only one.
- At most **one** literal user phrase per title (two only in Wild with long templates).
- Multi-word phrases can fill a slot whole ("Blood Oath", "The Blood Oath: …") or contribute their parts.

### 10.4 Include word (hard constraint)

- Every title contains the Include word. It is never optional.
- Its role comes from the lexicon if it is a known word; otherwise it is treated as a **name** (proper noun).
  Multi-word input ("Iron Crown") is treated as one unit.
- Only templates with a compatible lock slot are eligible, and the batch quota still applies, so
  results vary in structure: "Aeternum", "Aeternum: Ashen Crown", "Echoes of Aeternum", "Aeternum Falls",
  "Beyond Aeternum", "The Aeternum Pact", "Aeternum Tactics".
- If the Include word matches an Avoid entry, the form shows an inline message and generation pauses until one is fixed.
- If the word can't fit naturally (a 40-character phrase under One word), the engine returns what it can plus a notice.

### 10.5 Avoid list

- **Syntax** (shown as helper text): `word` (whole word, case-insensitive, also blocks plural and possessive),
  `"exact phrase"`, `frost*` (starts with), `*heim` (ends with), `*grim*` (contains).
- **Applied twice:** first it filters the pools (cheap, and stops near-misses), then it checks the rendered
  title, which catches compounds ("Frostbound" when `frost*` is banned), coined words and user phrases.
- If the list empties a pool, the engine falls back to neighbouring pools and shows "Some options are limited by your Avoid list."
- Built-in filters (profanity inside invented words, the contextual extremist-phrase list, franchise terms,
  known titles) apply to **engine-generated material only**. The user's own words pass through untouched,
  apart from their own Avoid list.

### 10.6 Worked examples

Appendix C walks through your three example inputs end to end.

---

## 11. Result / Favorites UX

### 11.1 Result card

```
┌───────────────────────────────────────────────┐
│  Ashen Oath                                   │  ← title, large display type
│  Dark Fantasy · Evocative · Norse             │  ← chips (text, not colour-only)
│  Grim Norse dark-fantasy title evoking oath,  │  ← identity note, one line, ≤ 100 chars
│  winter and ruin.                             │
│  [Copy]  [♡ Save]  [≈ Similar]  [Check ▾]     │
└───────────────────────────────────────────────┘
```

**Identity note.** Built from a few sentence frames filled with metadata: "{Tone} {myth} {genre} title
evoking {c1}, {c2} and {c3}." Concepts come from the words actually used plus matched user concepts, top
three by weight. Invented words get "Invented word with a {profile}-inspired sound; suits a {tone} {genre} game."
Tier B styles always say "-inspired". The note never claims a coined word means something.

**Metadata chips.** Genre, style and myth as selected. ("Also suits: Survival, RPG" computed from concept
overlap is a Phase 2 idea; the MVP shows only what was chosen, so nothing feels like a fake score.)

### 11.2 Actions

| Action | Behaviour |
|---|---|
| **Copy** | Clipboard API with a fallback; the button says "Copied" for 2 s; a live region announces it. |
| **Save** | Toggle (`aria-pressed`). Adds to or removes from the shortlist immediately. |
| **Similar** | Opens an inline group of 6 related titles under the card, each with its own Copy and Save. Opening another closes the previous group. |
| **Check ▾** | Disclosure with three links: Google · Steam · itch.io. Each opens in a new tab. |

**Check links** (built with `encodeURIComponent`; `rel="noopener noreferrer nofollow"`, `target="_blank"`):

- Google: `https://www.google.com/search?q="<title>" game`
- Steam: `https://store.steampowered.com/search/?term=<title>`
- itch.io: `https://itch.io/search?q=<title>`

A domain lookup is Phase 2. The page states that clicking a Check link sends that title to the site you open.

**Disclaimer** (under the results, always visible):

> Generated names are brainstorming suggestions. Check trademarks, existing game titles, domains, and
> storefronts before commercial use. This tool does not check availability and cannot tell you a name is free to use.

### 11.3 Regenerate Similar

The selected result's **recipe** (template, parts, anchor concept, seed) and **settings snapshot** drive four
strategies. Using the snapshot rather than the current form means "Similar" still works after the user has
changed the controls.

| Strategy | Keeps | Changes | From "Ashen Oath" |
|---|---|---|---|
| Modifier swap | Template, head noun | Modifier → same-concept alternative | Frostbound Oath · Hollow Oath |
| Head swap | Template, modifier | Head → family sibling | Ashen Covenant · Ashen Vow |
| Structural transform | Core concepts | Template → a related family (pair ↔ of-phrase ↔ "The…" ↔ subtitle) | Oath of Embers · The Broken Oath |
| Rhythm match | Syllable pattern and word count (± 20% length) | Scored as a bonus across all of the above | Rime Pact |

Invented words mutate one syllable or keep the onset or ending ("Vaskeld" → Vaskara, Valskeld, Vesskeld).
Include and Avoid constraints still apply. Output: 6 titles, none repeated, with at least 3 strategies represented when the source allows (invented-word sources use mutation and structural transform).

### 11.4 Shortlist (favourites)

- Section heading "Shortlist (n)" with a jump link from the results header.
- Each item: title, small meta line (genre · myth), **Copy**, **Remove**, **Similar** (works from saved recipes).
- **Copy all**: plain text, one title per line.
- **Download** (TXT or JSON) and **Import** (JSON) in a small "⋯" menu in the shortlist header (§14).
- **Clear all**: inline confirmation ("Clear all 7 saved titles? [Yes, clear] [Cancel]"). No modal, no timed toast.
- Newest first. Persists across reloads (§14).
- A short note: "Saved in this browser only. Copy your shortlist somewhere safe; browsers can clear site data."

### 11.5 Results behaviour

- **Generate** replaces the batch (favourites are how users keep things). A "Generate again" button also
  sits at the end of the list so nobody has to scroll back up.
- **Copy all results** lives in the results header.
- An empty state before the first run shows three example chips that fill the form with a preset
  ("Norse survival", "Cozy creature collector", "Analog horror").

---

## 12. Page Layout / Wireframe Description

### 12.1 Desktop (≥ 1024 px; ad rails only when ads are on and the viewport is ≥ 1280 px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [VPS] VPS Utility Network › Creator Tools › Video Game Name Generator  VPS ↗│
├──────────┬────────────────────────────────────────────────────┬────────────┤
│ ad rail  │ Video Game Name Generator                          │ ad rail    │
│ (only    │ Game titles that fit your genre, myth and vibe.    │ (only      │
│ when ads │ Free · No sign-up · Runs in your browser           │ when ads   │
│ are on)  │ ┌────────────────────────────────────────────────┐ │ are on)    │
│          │ │ Genre ▾          Mythology / Culture ▾         │ │            │
│          │ │ Tone ▾  + add a second tone   Naming style ▾   │ │            │
│          │ │ Themes, words, lore or vibe                    │ │            │
│          │ │ ┌────────────────────────────────────────────┐ │ │            │
│          │ │ │ frozen kingdom, ravens, blood oath…        │ │ │            │
│          │ │ └────────────────────────────────────────────┘ │ │            │
│          │ │ Length    (Any | 1 word | Short | Medium | Long)│ │            │
│          │ │ Creativity (Focused | Balanced | Wild)  Results (5|10|20)│      │
│          │ │ ▸ More options: Include word · Avoid words      │ │            │
│          │ │ [ Generate titles ]        Surprise me · Reset  │ │            │
│          │ └────────────────────────────────────────────────┘ │            │
│          │ 10 titles · Dark Fantasy · Norse · Grim   Copy all · Shortlist (4)│
│          │ ┌──────────────────────┐ ┌──────────────────────┐  │            │
│          │ │ result card          │ │ result card          │  │            │
│          │ └──────────────────────┘ └──────────────────────┘  │            │
│          │   …                        [ Generate again ]      │            │
│          │ Disclaimer                                         │            │
│          │ Shortlist (4)              Copy all · ⋯ · Clear all │            │
│          │ ── Advertisement (below-content area, ads on) ──   │            │
│          │ How it works · Choosing a good title · Mythology   │            │
│          │ with care · Privacy                                │            │
│          │ Other Free Creator Tools                           │            │
├──────────┴────────────────────────────────────────────────────┴────────────┤
│ A free creator tool from Valkyrja Publishing Studios · Privacy             │
└────────────────────────────────────────────────────────────────────────────┘
```

- Content column max-width ~880 px, centred. The controls card uses a responsive grid (3 columns ≥ 1024 px,
  2 columns ≥ 600 px, 1 column below). Results use 2 columns ≥ 1024 px.
- Ad placements follow §23.4: side rails on wide desktop viewports only, and one responsive area below the
  functional content (after the shortlist). Never between controls and results, never inside results or the
  shortlist, never pop-ups or interstitials. With ads switched off nothing ad-related renders, and switching
  them on does not move the generator column.
- After Generate, focus moves to the results heading, which brings it into view (instant scrolling when
  reduced motion is on). Screen readers then read the heading ("10 titles · Dark Fantasy · Norse · Grim").

### 12.2 Mobile (< 600 px)

```
┌───────────────────────────┐
│ [VPS] Creator Tools       │
│ Video Game Name Generator │
│ Free · No sign-up         │
│ Genre ▾                   │
│ Mythology / Culture ▾     │
│ Tone ▾                    │
│ Naming style ▾            │
│ Themes… [textarea]        │
│ ▸ Fine-tune               │
│   Any length · Balanced · │
│   10 results              │  ← summary of collapsed defaults
│ [   Generate titles   ]   │
│ ── 10 titles ──  Copy all │
│ Ashen Oath                │
│ Dark Fantasy · Norse      │
│ note…                     │
│ [Copy][♡][≈][Check]       │
│ …                         │
│ [  Generate again  ]      │
│ Disclaimer                │
│ ▸ Shortlist (4)           │
│ [below-content ad area]   │  ← only when ads are on; no rails on mobile
│ Content sections…         │
└───────────────────────────┘
```

On mobile, Length, Creativity, Results, Include and Avoid sit under **Fine-tune**, with a one-line summary of
the current values so defaults stay visible. The second tone stays behind its "+ add a second tone" link next to
Tone, which is already collapsed by default. The shortlist is collapsed under "▸ Shortlist (n)" on mobile.

### 12.3 Content sections under the tool

1. **How it works** (~150 words): procedural, local, what each control does.
2. **Choosing a good game title**: a checklist. Say it aloud; can someone spell it after hearing it? Search
   Steam, itch.io and the web; avoid filler like "Shadow of" and "Echoes of"; check a trademark database
   (USPTO, EUIPO TMview, WIPO Global Brand Database); keep subtitles purposeful; check legibility at
   small capsule size.
3. **Mythology with care**: two short paragraphs on the imagery-first approach.
4. **Privacy** and the disclaimer.
5. **Other Free Creator Tools**: config-driven list (§23.2).

---

## 13. Data Model

The exact TypeScript lives in the implementation plan (Tasks 9, 10, 12 and 28). This section fixes the shapes
and where they live.

**@vps-name-tools/data** (shared content, reusable by future name tools)
- `LexEntry`: id, text, part of speech (noun, adj, verb, abstract, place, morpheme), optional forms (plural,
  adj, gerund, past), concepts, family, tone affinities, register (plain, archaic, lofty, technical,
  whimsical), cliché score, compound role (head, tail, both), place-tail flag. Genre and myth affinity are
  expressed through concept boosts and pack vocabulary, so entries stay tool-neutral.
- `Concept` (id, label, related) and the alias map (phrase → concepts).
- `ToneDef`: concept boosts, template-family weights, alliteration bonus, note word.
- `PhoneticProfile`: onsets, nuclei, codas, syllable shapes and counts, endings, forbidden patterns,
  rewrites, length and vowel-ratio limits.
- `MythPack`: id, label, group, tier (A/B), note label, profile, invented-word rate, optional blend, concept
  boosts, imagery entries, symbolic terms (each with a source note), rhythm (template-family weights),
  denylist, review record.

**@vps-name-tools/game-titles** (this tool)
- `Settings`: genre, myth, tone, tone2, style, length, creativity, count, themes, include, avoid. Defaults per
  Revision 2 decision 15.
- `GenrePreset`: group, parent, concept boosts, suppressed concepts, family weights, default tones, length
  bias, frame words, suffix words, extra entries, fallback profile, guard phrases.
- `StyleDef`, `Template` (family, parsed pattern variants, word range, base weight, rare flag) and `Vocab`
  (frames, suffixes, numbers, prepositions, predicates, epithets, subtitle patterns).
- `Recipe` (template, variant, parts, head index, anchor concept, seed) and `RecipePart` (literal, lexicon,
  vocabulary, user phrase, include word, invented word, compound, group).
- `TitleResult` (id, title, meta with note and concepts, recipe, settings snapshot), `Notice`, `GenerateResult`.

**@vps-name-tools/site-kit**
- `ShortlistItem` (id, title, savedAt, meta, recipe, settings) inside a versioned envelope; export format
  `vps-name-tools/shortlist` version 1.

**Public engine API**
- `generate(settings, { seed?, exclude? }) → GenerateResult`
- `generateSimilar(result, { count?, seed?, exclude? }) → GenerateResult`

**Data validation.** `npm run validate:data` checks ids, references, ASCII spelling, safety and franchise
terms, Tier B rules and denylists, and with `--release` the content targets in §9.3. It runs in CI.

---

## 14. Local Storage Strategy

Follows the network rule: one storage adapter, "Saved on this device" wording, backup and restore, and a
clear-data control (Master Blueprint §3 and §7). The shortlist is small text records, so it uses localStorage
through the adapter rather than IndexedDB (deviation recorded in §26).

| Key | Contents | Limit |
|---|---|---|
| `vps-name-tools.video-game-names.v1.shortlist` | `{ v: 1, items: ShortlistItem[] }` | 500 items |
| `vps-name-tools.video-game-names.v1.settings` | Last-used `Settings` | 1 object |

- Every read and write goes through the adapter's try/catch. If storage is unavailable, the shortlist lives in
  memory and one quiet notice explains it: "Your browser isn't letting this page save; your shortlist lasts
  until you close the tab."
- Reads validate shape and version. Corrupt data is kept under a `.corrupt-<timestamp>` key and the user
  starts fresh, with a notice.
- The `storage` event keeps two open tabs in sync.
- Recently shown titles stay in memory only.
- Safari can delete script-written storage for sites not visited for about a week of use, so the shortlist
  offers Copy all, Download (TXT/JSON) and Import (JSON), and its note says so.
- Export format: `{ format: "vps-name-tools/shortlist", version: 1, tool: "video-game-names", exportedAt, items }`.
  Import validates every item, skips duplicates and invalid entries, and reports how many it added.
- "Clear my saved data" in the privacy note removes both keys after an inline confirmation.
- Share links (Phase 2) would keep settings in the URL fragment so themes never reach a server.

---

## 15. SEO Strategy

### 15.1 Launch: one excellent page

Launch has one indexable page: the generator, with genuinely useful content under the tool (how it works,
choosing a good title, mythology with care, privacy). Technical basics:

- Pre-rendered HTML; unique title, meta description, H1 and canonical URL; "video game name generator" and
  "game title generator" used naturally in the copy.
- `WebApplication` structured data (free, runs in the browser). FAQ and HowTo rich results are deprecated, so
  nothing is built around them.
- XML sitemap, robots.txt, Open Graph image, fast Core Web Vitals.
- Staging stays `noindex` in three places (robots meta tag, `X-Robots-Tag` header, robots.txt) that are
  removed together at launch, with a test that keeps them in agreement (toolkit convention).
- Query-parameter variants are never indexed; the canonical URL never includes parameters.

### 15.2 After launch: evidence-based landing pages

The six candidate pages (Fantasy, Horror, RPG, Sci-Fi, Norse, Mythology) are optional post-launch work. After
8–12 weeks of Search Console data, build a page only where impressions and queries show demand *and* there is
something distinct to say: category-specific guidance written by hand, 12–20 curated examples checked against
Steam, and the same generator preset to that category.

### 15.3 What not to build

- No genre × mythology combination pages, tag pages, auto-generated example dumps or keyword-stuffed copy
  (Google's doorway-page and scaled-content-abuse policies).
- Honest copy: "no AI, no sign-up, runs in your browser" is a real differentiator. Never claim "AI-powered".

---

## 16. Accessibility Considerations

Target: **WCAG 2.2 AA**.

- **Native controls.** `<select>` for Genre, Myth, Tone and Style (best support for screen readers and mobile
  pickers). Segmented controls are radio groups inside `<fieldset>`/`<legend>`. Every control has a visible `<label>`.
- **Keyboard.** Everything works by keyboard in a logical order. Enter submits from single-line inputs;
  Ctrl/⌘+Enter submits from the textarea. No single-key shortcuts.
- **Focus.** A visible focus ring with ≥ 3:1 contrast. No sticky overlays that could hide focus (WCAG 2.4.11).
- **After Generate**, focus moves to the results heading (`tabindex="-1"`), so the new batch is announced and
  in view. The user asked for the new content, so moving focus is expected rather than disorienting.
- **Announcements.** One polite live region for actions that don't move focus: "Copied Ashen Oath",
  "Saved to shortlist", "Shortlist cleared".
- **Names.** Buttons carry the title in their accessible name ("Save Ashen Oath to shortlist"). Save uses `aria-pressed`.
- **Structure.** Results are an ordered list; each title is a heading (h3) for quick navigation; logical heading order across the page.
- **Validation.** Errors (such as an Include word that is also on the Avoid list) are tied to fields with `aria-describedby` and written in plain language.
- **Visual.** Text contrast ≥ 4.5:1; chips never rely on colour alone; one dark studio theme (decision 7) with a higher-contrast variant under `prefers-contrast: more` and support for forced colours (Windows High Contrast).
- **Targets.** ≥ 24 × 24 CSS px everywhere (WCAG 2.5.8); 44 × 44 px for primary actions on touch.
- **Motion.** No animation when `prefers-reduced-motion` is set.
- **Reflow.** Works at 320 px width and 400% zoom without horizontal scrolling.
- **Disclosures.** "More options", "Fine-tune", "Check" and the shortlist use `<details>`/`<summary>` or buttons with `aria-expanded`.
- **Clear all** uses inline confirmation, not a timed toast.
- **Testing:** axe-core in CI plus manual passes with NVDA (Windows), VoiceOver (macOS and iOS) and TalkBack.

---

## 17. Mobile Behavior

- **Breakpoints:** < 600 px single column; 600–1023 px two-column control grid, one-column results;
  ≥ 1024 px three-column controls, two-column results; ≥ 1280 px side rails reserved.
- **Fine-tune disclosure** with a summary line (§12.2) keeps the first screen short.
- **Native pickers** for every select.
- **Input hints:** `enterkeyhint="go"` on inputs. `autocorrect="off" autocapitalize="off" spellcheck="false"`
  on Include and Avoid, so a coined name like "Aeternum" isn't "corrected".
- **Textarea** auto-grows to 5 lines, then scrolls.
- **After Generate**, focus moves to the results heading, which brings it into view (instant with reduced
  motion); "Generate again" sits at the end of the list.
- **Card actions** use icon + text labels at 44 px; "Check" opens an inline list, nothing hover-only.
- **Long words** wrap with `overflow-wrap: anywhere`. No horizontal scrolling anywhere.
- **No sticky bottom bar**, which would cover content and focus.
- **Clipboard** uses the async Clipboard API inside the tap handler (works on iOS Safari) with a fallback.
- **Performance:** the engine runs comfortably on low-end Android; cultural packs load lazily if the bundle exceeds budget.

---

## 18. Testing Plan

Tooling follows the network convention: Node's test runner via `tsx --test` for unit and property tests,
puppeteer-core for browser tests.

1. **Engine unit tests:** seeded randomness; theme parsing; Avoid syntax; contextual safety (14 and 88 allowed
   alone, blocked together); Include placement; morphology and title case; compounding; phonetic readability;
   every template renders; identity notes; Similar strategies.
2. **Property tests (fast-check),** random settings × random seeds: count met or a shortfall notice; the
   Include word in 100% of titles; zero Avoid matches; zero safety, franchise or known-title hits in engine
   output; no duplicates; length class honoured; same seed, same output.
3. **Combination sweep:** 31 genres × 31 cultural options (961 combinations) × 10 titles, plus every tone and
   every style on fixed settings. No exceptions, no empty pools, time budget met.
4. **Quality metrics (`npm run quality`),** 1,000 titles per sample preset, thresholds enforced in CI:
   largest template family ≤ 30%; no word in more than 4% of titles; classic frames ≤ 20% of titles; literal
   theme use inside the creativity band (Balanced 30–50%); every theme phrase reflected at least once per
   20-title batch; average length matches the length class.
5. **Golden snapshots:** 20 fixed seed + preset pairs; data changes that move them are reviewed on purpose.
6. **Human review rubric:** 20 core presets × 50 titles, rated 1–5 on genre fit, theme fit, originality,
   readability and "would I put this on a Steam page?". Targets: ≥ 30% rated 4+, < 5% broken.
7. **Cultural pack checks:** validator rules (no symbolic term without a source note, ASCII spelling, denylist
   absent from data) plus 5,000 generated titles per pack with zero denylist hits. Each pack's review record
   and status appear in `docs/content/CULTURAL-PACK-STATUS.md`; a pack that fails is reported by name with
   the reason (Revision 2 decision 1). External readers for Tier B packs remain recommended.
8. **Collision sweep:** 100,000 titles against the known-title list: zero exact matches; a sample of near
   matches reviewed by hand.
9. **Browser end-to-end:** generate; settings persist; Copy; Save → reload → still saved; Remove; Clear all;
   Download and Import; Similar shows 6 related titles; Include and Avoid through the UI; Check links encoded
   correctly; no ad container between controls and results or inside results and the shortlist; no horizontal
   scroll at 360 × 740; keyboard-only run-through.
10. **Accessibility:** axe-core with zero violations on the page and the 404 page; manual NVDA, VoiceOver
    (macOS and iOS) and TalkBack passes.
11. **Performance:** bundle budget check (≤ 120 KB gzipped JS + data); 20 titles < 30 ms at 4× CPU throttle;
    Lighthouse mobile performance ≥ 95, accessibility 100 and SEO 100 before launch.
12. **Storage robustness:** storage throwing, corrupt JSON, quota exceeded, two tabs open.
13. **Cross-browser manual check:** Chrome, Firefox, Safari (macOS and iOS), Samsung Internet.
14. **Security:** XSS strings in every input render as text; CSP violations fail the browser run; the
    analytics endpoint rejects anything outside its allowlist.

`docs/VALIDATION.md` records only checks actually performed, with dates and results (VPS honesty convention).

---

## 19. Phase 2 Features

Ordered by value for effort.

1. **Domain lookup** in the Check menu (neutral registration lookup for `<title>.com`).
2. **SEO landing pages,** only where Search Console shows demand (§15.2).
3. **Capsule preview:** show a title on a Steam-capsule-sized card (460 × 215) in a few type styles to judge legibility. CSS only.
4. **"Hear it":** speak a title with the browser's built-in speech synthesis to test pronounceability.
5. **Include-word placement:** Start / End / Anywhere.
6. **"Avoid classic frames" toggle:** turns the soft frequency control into a hard filter.
7. **Shareable links:** settings + seed in the URL fragment, so themes stay private.
8. **Session history:** step back to the previous batch or two.
9. **"Also suits" hints:** cross-genre fit chips computed from concept overlap.
10. **Notes on favourites** (one line per saved title) and CSV export.
11. **More check links:** App Store, Google Play, IGDB/MobyGames, USPTO, EUIPO TMview, WIPO.
12. **More genres and split cultural packs** (named African traditions, for example), with consultation.
13. **Optional diacritics** for cultural styles, off by default for searchability.

**Optional future (only with demand)**

- Opt-in AI "refine this title" using the visitor's own API key or a tightly rate-limited proxy, clearly disclosed.
- Offline support (PWA); the tool already runs entirely in the browser.
- Further VPS name tools built on the shared engine (characters, worlds and locations, factions, kingdoms and
  organisations), each as its own page or tool, never added to this generator's interface.
- Localised UI.

---

## 20. Features I Recommend Rejecting

| Feature | Why not |
|---|---|
| Paid AI inference on every click | Running costs grow with traffic, invites abuse, slower, inconsistent tone, sends ideas to a third party |
| Accounts or cloud sync | Contradicts "no sign-up"; adds privacy obligations; local storage + export covers the need |
| "Available ✓" badges or automated trademark verdicts | Legal risk and false confidence. Searches can't prove availability |
| Background API checks against Steam, itch.io or registrars | Terms-of-service, CORS and rate-limit problems; leaks every generated title to third parties |
| Numeric "brandability" or "quality" scores | Fake precision. The ranking already uses scores; showing them adds no truth |
| Genre × myth programmatic landing pages | Doorway and scaled-content risk; thin pages |
| Deity-name insertion or sacred terms | Disrespectful; derivative; the brief rules it out |
| Logo generators, domain-purchase upsells, affiliate-first flows | Turns a creative utility into a funnel |
| Ads inside the workflow, pop-ups, interstitials | Breaks the tool and the trust |
| Markov chains trained on real-language corpora (for MVP) | Derivative output, corpus licensing, less control than phonotactic profiles |
| 100+ result dumps | Encourages skimming over judging; 20 per batch plus re-rolls is enough |
| Streaks, voting, social feeds | Scope creep with no naming value |
| Diacritics on by default | Hurts typeability and searchability |
| Banning ordinary numbers (14, 88) | False positives ("Station 88", "Sector 14"); explicit phrases and combinations are blocked instead |

---

## 21. Open Questions / Suggestions

### Resolved in Revision 2

Repository direction, hosting, the cultural and genre catalogues, SEO timing, analytics, defaults, classic
frames, number filtering, check links and language are decided (see the Revision 2 table).

### Still open

1. **Access to valkyrjapublishingstudios.com.** This build environment's network policy blocks the site, so the
   visual capture (§22.2) cannot run yet. Allow the domain in the environment's network settings, or supply
   screenshots plus the theme's colours and fonts.
2. **Repository name and home.** Rename this repository to `VPS-Name-Tools` (GitHub keeps redirects). Decide
   whether it stays public under your personal account or moves to the Valkyrja-Publishing-Studios
   organisation like the other VPS utilities.
3. **Domain** for this utility (a separate domain is allowed) and the Cloudflare Pages project name. Until
   then the free `*.pages.dev` address is used, kept `noindex`.
4. **Other Free Creator Tools:** which public tools to list at launch. If none are public yet, the block shows
   one line and the VPS link.
5. **Brand mark:** the creator-side VPS logo or wordmark for the header and favicon (from the main site).
6. **Analytics Engine** availability on your Cloudflare plan. If it isn't available, event counts wait while
   page views (Cloudflare Web Analytics) still work.
7. **Cultural readers:** whether external readers can review Tier B packs before or soon after launch.

### Suggestions

- **Author with AI, ship without it.** Use a model to draft word lists quickly, then curate by hand. Most of
  the build effort is data, not code.
- **Make Similar the hero interaction.** No competitor has it, and it turns "almost" into "yes".
- **Lean into the anti-cliché story.** "Avoids the 'Shadow of' trap" is a concrete promise that resonates with developers.

The build sequence lives in the implementation plan.

---

## 22. VPS Creator Visual System

### 22.1 Direction

The tool should feel like the creative-technology side of Valkyrja Publishing Studios turned into an
application: a dark studio interface, cinematic and technological, with mythic undertones and restrained glow.
The main VPS website is the primary reference. The Landscape Project Toolkit is not.

- **Translate, don't copy.** Take the site's atmosphere, colour and accent logic, typography hierarchy, panel
  and border treatment, glow usage, navigation feel, section hierarchy and button language, and apply them to
  an application layout: one workspace, calm but dense controls, results as title cards. The WordPress page
  layout itself is not reproduced.
- **Mythology belongs in the generated content.** No runes, skulls, parchment, fantasy ornament or textured
  backgrounds in the interface chrome.
- **Restraint.** One primary accent for the main action, focus and selected states. Glow only on the primary
  button, the focus ring and saved/active states; never on body text or on every card.

### 22.2 How the live site informs the styling

The capture step (implementation plan, Task 26) runs once the site is reachable from the build environment:

1. Screenshot the home page and two inner pages at 1440 px and 390 px.
2. Extract computed styles: background colours and gradients, text colours, heading and body font families,
   sizes, weights, letter-spacing and case, link and button styles (shape, border, fill, glow, hover), panel
   borders, radii and shadows, header and navigation layout, section spacing.
3. Map them to creator tokens in `docs/brand/VPS-CREATOR-VISUAL-SYSTEM.md`, with a contrast check for every
   text/background pair (≥ 4.5:1 for text, ≥ 3:1 for UI boundaries and focus).
4. You approve the token sheet before UI styling is finalised.

Until the capture runs, the UI is built on the same token names with provisional values (deep neutral
surfaces, one cool accent, one warm secondary), clearly marked as provisional. Swapping in the captured
values is a one-file change plus a screenshot review.

### 22.3 Reused, adapted, and different from the Landscape Toolkit

| | Landscape Project Toolkit (VPS Earth) | Video Game Name Generator (VPS Creator) |
|---|---|---|
| Source of the look | VPS Earth design system (service-business side) | Main Valkyrja Publishing Studios website |
| Mood | Light, earthy, cream and olive; contractor tool | Dark studio, cinematic, technological, mythic undertones |
| Palette | Cream, olive, wine and gold on light backgrounds | Deep neutral surfaces, captured VPS accent(s), restrained glow |
| Type | Libre Baskerville display + Source Sans 3 | Display and UI faces taken from the VPS site, self-hosted |
| Decoration | Topographic motif, "meridian" gradient dividers | Hairline borders, subtle panel gradients, accent glow on focus and primary action only |
| Layout | Multi-tab business workflow with a project tray | One generator workspace: controls → results → shortlist |
| Family line | "A Free Business Tool by VPS" + platform upgrade panel | "A Free Creator Tool by VPS"; no platform funnel |

**Reused from the toolkit (structure, not look):** semantic token naming (components never use raw hex),
fluid type and spacing scales, the focus-ring method, self-hosted fonts, the slim header and footer pattern,
skip link, a single brand/family config file guarded by a test, the `_headers` security baseline, the staging
`noindex` switch, and the deploy workflow.

### 22.4 Components

Header bar, controls card, segmented controls, selects, text areas, primary button (accent fill + soft glow),
secondary and ghost buttons, chips, result cards, the inline Similar group, the Check disclosure, shortlist
rows, notices, footer, and the ad rail and slot containers. Generated titles use the display face at a large
size so they read like title cards; chips and notes stay quiet.

---

## 23. VPS Utility Network Integration

### 23.1 Identity and navigation

- Header: VPS mark, then "VPS Utility Network › Creator Tools › Video Game Name Generator" as a breadcrumb on
  desktop ("Creator Tools" and the tool name on mobile).
- Family line: "A Free Creator Tool by VPS".
- One config file (`packages/site-kit/src/network.ts`) holds every network, family and link string. A test
  fails if any of them is hard-coded elsewhere, and if any service-business platform URL or upgrade copy
  appears in this codebase.

### 23.2 Links

- **Valkyrja Publishing Studios:** a subtle link in the header (desktop) and the footer, to
  `https://valkyrjapublishingstudios.com/`.
- **Other Free Creator Tools:** a config-driven list near the bottom of the page. If no other public creator
  tool exists at launch, it shows one line ("More free creator tools from VPS are on the way.") and the VPS
  link. It never lists unreleased tools as available.
- No links or calls to action for the VPS service-business software.

### 23.3 Separate domains

Each utility may live on its own domain. Local storage is per domain, so any later cross-tool handoff uses
explicit export and import, as the master blueprint prescribes.

### 23.4 Advertising layout (no ad code yet)

- **Desktop:** optional left and right rails when the viewport is wide enough (≥ 1280 px: 160 px rails;
  ≥ 1600 px: 300 px rails), in the page margins outside the content column and sticky within their column.
- **Below the functional content:** one responsive area after the shortlist and disclaimer, before the
  informational sections, labelled "Advertisement", with reserved height to avoid layout shift.
- **Never:** between the controls and results, inside the results or the Similar group, inside the shortlist,
  next to action buttons, or as pop-ups and interstitials. Copied and exported text never includes ads.
- **Mobile:** no rails; only the below-content area.
- **Switch:** `ads.enabled` in the network config. Off: no ad containers render and the content column is
  centred. On: containers render in the reserved positions and the generator column does not move. Adding
  AdSense later means filling these containers, widening the CSP and adding consent handling, not
  redesigning the page.

---

## 24. Analytics

Privacy-friendly aggregate counts only.

| Layer | What | How |
|---|---|---|
| Page views | Visits, referrers, Core Web Vitals | Cloudflare Web Analytics (cookieless), switched on for the Pages project |
| Events | `generate`, `similar`, `copy`, `save`, `check` | `navigator.sendBeacon` to `/api/e`, a small Pages Function writing to Workers Analytics Engine |

- Event properties are enums only: `genre` (31 ids), `myth` (31 ids), `device` (`mobile`, `tablet`,
  `desktop`, from viewport width) and, on `check`, `link` (`google`, `steam`, `itch`). Client and Function both
  reject anything else. No IP address, user agent, cookie or identifier is stored.
- **Never collected:** themes text, the Include word, Avoid words, generated titles, favourites or shortlist contents.
- Events stay off (`analytics.events` flag) until the Analytics Engine binding is verified on your account;
  page views work independently. (Cloudflare Web Analytics does not support custom events, hence the Function.)
- Browsers sending Global Privacy Control or Do Not Track send no events.
- Each Function call counts toward the Workers Free daily request quota (100,000 per day, shared across the
  account); the client can sample events if traffic grows.
- The privacy note lists exactly what is counted.
- Designed to need no cookies or device storage for analytics; confirm with your own legal review. Ads, if
  added later, will need a consent banner.

---

## 25. Hosting and Launch

- **Cloudflare Pages:** one project for this tool (working name `vps-video-game-name-generator`), deployed from
  GitHub Actions with Wrangler Direct Upload on pushes to `main`, as the toolkit does. Validation runs on every
  branch and pull request.
- **Launch scope:** the generator page, a 404 page, the privacy note on the page, robots.txt and a sitemap. No
  SEO landing pages are required.
- **Headers:** the toolkit's security baseline (`nosniff`, `no-referrer`, frame denial, Permissions-Policy,
  strict CSP) plus the Cloudflare Web Analytics hosts.
- **Staging:** `*.pages.dev` stays `noindex` until launch acceptance; the three switches are removed together.
- **Release gate:** every check in §18 green; the cultural pack status reviewed; the visual token sheet
  approved; Lighthouse budgets met; disclaimer and privacy copy final.
- **Rollback:** promote the previous deployment in the Pages dashboard, then revert on `main`.
- **After launch:** custom domain, Search Console, and the evidence-based landing-page decision (§15.2).

---

## 26. Relationship to the VPS Utility Network Master Blueprint (v1.1)

**Adopted:** Astro static pages and TypeScript modules on Cloudflare Pages; no accounts; "Saved on this device"
with backup, restore and clear-data controls; one storage adapter; privacy-safe analytics that never capture
input text; reserved, labelled ad space kept away from actions; restrictive CSP; staging `noindex`; family and
brand strings in one file; honest status reporting.

**Justified deviations**

1. **Visual system:** VPS Creator (from the main VPS website) instead of VPS Earth, because this tool belongs to
   the creative and game-development side (decision 6).
2. **No business-platform funnel:** the master blueprint lists introducing users to the service-business
   platform as a network purpose; creator tools exclude it (decision 8).
3. **Separate domains** are allowed per utility (decision 5), instead of starting under one shared origin.
4. **Shortlist in localStorage:** small text records through the shared adapter, rather than IndexedDB, which
   the master blueprint reserves for structured projects.
5. **One Pages Function,** only for allowlisted analytics events (§24); the toolkit currently has none.
6. **No project interchange record:** this tool has no projects; its export uses its own versioned shortlist format.

---

## Appendix A: Template Catalogue (MVP, 35 templates)

| # | Family | Pattern | Example | Lock slots |
|---|---|---|---|---|
| T01 | single | `{noun}` | Pyre | noun |
| T02 | single | `{abstract}` | Unsworn | abstract |
| T03 | compound | `{compound}` | Frostbound | (none) |
| T04 | coined | `{coined}` | Vaskeld | coined |
| T05 | pair | `{adj} {noun}` (≤ 20% of a batch) | Ashen Oath | noun |
| T06 | pair | `{noun} {noun}` | Blood Oath | either noun |
| T07 | pair | `The {adj?} {noun}` | The Pale Crown | noun |
| T08 | code/number | `{number} {nounPl}` · `{ordinal} {noun}` | Nine Winters · Ninth Winter | noun |
| T09 | pair | `{name} {placeWord}` | Aeternum Falls | name |
| T10 | pair | `{noun} & {noun}` | Salt & Ember | either noun |
| T11 | of-phrase | `{noun} of {noun}` | Crown of Ash | either noun |
| T12 | of-phrase | `The {noun} of {nounPl}` | The Hymn of Ravens | second noun |
| T13 | of-phrase | `{noun} of the {adj?} {noun}` | Oath of the Frozen King | last noun |
| T14 | prepositional | `{prep} the {adj?} {noun}` · `{prep} {name}` · `{noun\|adj} {prep} the {noun}` | After the Thaw · Beyond Aeternum · Static in the Pines | noun, name |
| T15 | prepositional | `Where the {nounPl} {predicate}` | Where the Ravens Sleep | noun |
| T16 | sentence | `The {nounPl} {predicate}` / `{noun} {predicate}` | The Gods Remember | noun |
| T17 | imperative | `{verb} the {adj?} {noun}` | Bury the Forgotten Gods | noun |
| T18 | imperative | `Don't {verb} the {noun}` and similar | Don't Answer the Signal | noun |
| T19 | frame | `{frame} of {name\|place\|noun}` | Chronicles of Aeternum | name/noun |
| T20 | frame | `{name} {frameSuffix}` | Vaskeld Saga | name |
| T21 | possessive | `{name}'s {noun}` | Ysolde's Lantern | name |
| T22 | subtitle | `{name}: {subtitle}` | Aeternum: Ashen Crown | name |
| T23 | subtitle | `{place}: {abstract}` | Ravenmoor: Exile | place |
| T24 | subtitle | `{adj} {noun}: {subtitle}` | Hollow Crown: Oath of Winter | noun |
| T25 | suffix | `{name\|place} {genreSuffix}` | Ravenmark Tactics · Lantern Cove Keepers | name, place |
| T26 | descriptive | `{adj\|noun} {genreNoun}` | Island Creature Keepers | noun |
| T27 | code/number | `{noun}-{number}` / `{noun} {number}` | Signal-9 · Station 47 | noun |
| T28 | place | `{cozyNoun} {placeWord}` | Lantern Cove | noun |
| T29 | the-name | `The {name\|place} {noun}` | The Halloway Affair · The Aeternum Pact | name |
| T30 | kenning (Norse, Old English) | `{noun}-{noun}` | Wolf-Winter | either noun |
| T31 | triad (Celtic) | `{noun}, {noun} and {noun}` | Stone, Salt and Song | any noun |
| T32 | couplet (Chinese-inspired) | `{adj} {noun}, {adj} {noun}` | Jade River, Iron Sky | either noun |
| T33 | saga (Icelandic, Norse) | `The Saga of {name}` / `{name}'s Saga` | The Saga of Vaskeld | name |
| T34 | epithet (Greek, Arthurian) | `{name} the {epithet}` | Kyros the Unbound | name |
| T35 | alliterative pair (Finnic, Old English) | `{noun} and {noun}` (same initial sound) | Birch and Bear | either noun |

**Subtitle sub-grammar:** `{adj} {noun}` · `{noun} of {noun}` · `The {adj} {noun}` · `{gerund} {noun}` ·
`{abstract}` · `{prep} the {noun}`.

## Appendix B: Phonetic Profile Sketches

**Norse / Germanic**
- Onsets: b d f g h k l m n r s t v · sk st sv br dr fr gr kr tr th hv
- Nuclei: a e i o u y au ei
- Codas: r n l m k g d t · rn rd ld nd lk rk st ng
- Shapes: CVC 5 · CV 3 · CCVC 2 · CVCC 1. Syllables: 2 (70%) · 3 (25%) · 1 (5%)
- Endings: -gard -vald -mark -fell -vik -dal -holt -run -ir (-heim heavily penalised as a cliché)
- Feel: Vaskeld · Torvik · Skardholt · Eldrun

**Soft / Whimsical** (Cozy, Creature Collector, Fairy Tale)
- Onsets: b p m l n w f h t d s · bl pl fl sn tw
- Nuclei: a e i o u oo ee ie
- Codas: mostly open · n m l p s
- Shapes: CV 5 · CVC 3. Syllables: 2 (60%) · 3 (35%) · 1 (5%)
- Endings: -le -ling -kin -wick -bloom -puff -let -o -y
- Feel: Mossling · Pipplewick · Tumblekin · Lumabloom

**Cyberpunk**
- Onsets: k z x v n r d s t · kr tr
- Nuclei: a e i o y (no diphthongs)
- Codas: x k n r s z t
- Shapes: CVC 5 · CV 3. Syllables: 2 (75%) · 1 (15%) · 3 (10%)
- Endings: -ex -ix -on -yn -ra · tech morphemes (-tek, -core, -net) cliché-weighted
- Feel: Vexon · Kyrex · Zentrik

## Appendix C: Worked Steering Examples (illustrative, hand-written)

**1. Dark Fantasy · Norse · Grim (+ Mystical) · Auto style · Balanced**
Themes: `frozen kingdom, ravens, forgotten gods, blood oath, northern lights`

| Phrase | Matched as | Concepts boosted |
|---|---|---|
| frozen kingdom | alias | cold, winter, ice, kingdom, crown |
| ravens | lexicon (Raven) | raven, omen, wing |
| forgotten gods | alias | gods, forgotten, silence, ruin |
| blood oath | lexicon phrase | blood, oath, vow, kin |
| northern lights | alias | aurora, sky, light, north |

Intended flavour of a batch: Rime Oath (T06) · Beneath the Frozen Crown (T14) · Ninth Winter (T08) ·
Ravens Keep No Oaths (T16) · Hrimvald (T04) · Aurora of the Old Gods (T13) · Bloodbound: The Silent Throne (T22) ·
Wolf-Winter (T30) · Bury the Forgotten Gods (T17) · Frost & Feather (T10). Four of ten use a user word
literally (oath, ravens, blood, forgotten gods); every phrase is reflected; ten templates, and no family
exceeds two titles.

**2. Creature Collector · Fairy Tale / Folklore · Cozy (+ Playful) · Auto style · Balanced**
Themes: `cute creatures, islands, collecting, friendship, cozy exploration`

Intended flavour: Mossling · Bramblebuddies · Pip & Puddle · Lantern Cove Keepers · Tidepool Pals ·
Wanderwhistle · Hearthwick Isles · Bloomfolk. Soft phonetics; "Pocket … Monsters" and "-mon" blocked.

**3. Psychological Horror · None · Mysterious (+ Melancholic) · Auto style · Focused**
Themes: `abandoned radio tower, analog horror, snowstorm, missing hikers`

Intended flavour: Tower 9 · Do Not Answer the Static · Whiteout Frequency · The Quiet Band · Coldwave ·
The Hikers Never Came Down · Static in the Pines · Missing Since the Snow. Focused stays close to the stated
themes, uses the user's words more often, and favours short, unsettling structures.

**Include word "Aeternum" (any genre):** Aeternum · Aeternum: Ashen Crown · Echoes of Aeternum (cliché frame,
at most once) · Aeternum Falls · Beyond Aeternum · The Aeternum Pact · Aeternum Tactics.

## Appendix D: Sources

Competitor and tool research
- Fantasy Name Generators, video game names: https://www.fantasynamegenerators.com/video-game-names.php
- CapCut roundup of video game name generators: https://www.capcut.com/resource/video-game-name-generator
- Codeitbro Random Game Name Generator: https://www.codeitbro.com/tool/random-game-name-generator
- The Story Shack video game title generator: https://thestoryshack.com/tools/video-game-title-generator/
- Seele AI game title generator: https://www.seeles.ai/features/tools/game-title-generator
- Taskade game title generator: https://taskade.com/generate/game-development/game-title
- Texta free AI game name generator: https://texta.ai/ai-tools/free-ai-game-name-generator
- Simplified AI game name generator: https://simplified.com/ai-name-generator/game
- Ahrefs game business name generator: https://www.ahrefs.com/writing-tools/business-name-generator/game
- YouWare game title generator: https://www.youware.com/features/game-title-generator
- Namelix overviews: https://www.toolmage.com/en/tool/namelix/ · https://aitoolsexplorer.com/ai-tools/namelix-ai-business-name-generator/
- Wordoid: https://thenextweb.com/news/wordoid-hands-easiest-find-unique-product-website · https://www.saashub.com/compare-wordoid-vs-namegrep
- NameMesh: https://www.whtop.com/news/23439-the-best-business-domain-name-generators · https://zplatform.ai/ai-tools/namemesh/
- Name Forge (donjon-style Markov names): https://foundryvtt.com/packages/name-forge
- RinkWorks pattern language (reimplementation notes): https://nullprogram.com/blog/2009/01/04/
- Zompist Gen help: https://www.zompist.com/genhelp.html
- Conlang tools (Lexifer, Awkwords): https://www.frathwiki.com/Software_tools_for_conlanging · Vocabug: https://www.verduria.org/viewtopic.php?p=104908
- Tracery: https://github.com/galaxykate/tracery · https://videlais.com/category/tracery/
- Seventh Sanctum: https://randroll.com/an-interview-with-steven-savage · https://alternativeto.net/software/seventh-sanctum/about

Naming research
- PC Gamer, forgettable Steam names: https://pcgamer.com/games/why-so-many-steam-games-have-weirdly-similar-and-forgettable-names/
- How To Market A Game, title length analysis (2025): https://howtomarketagame.com/2025/02/03/are-game-names-getting-longer-how-to-quit-your-job-and-write-a-title-for-your-steam-game-in-2025-naming-seo-tips-faq-guide-profits-earnings-optimization/
- Summary of the same analysis: https://www.fixgamingchannel.com/fix-access-one-word-game-titles/
- Analysis of 5,820 Steam games: https://code.tutsplus.com/whats-in-a-name-data-analysis-of-5820-steam-games--cms-30101a
- Wayline naming and legal guides: https://www.wayline.io/blog/game-title-naming-strategies-indie-devs · https://www.wayline.io/blog/how-to-name-video-game-legal-licensing-indie-devs
- Choice of Games forum, naming: https://forum.choiceofgames.com/t/how-to-name-your-game/35699

Cultural care
- LitReactor, mythology and appropriation: https://litreactor.com/columns/taking-from-the-world-tree-mythology-and-cultural-appropriation/
- Arie Farnam, fictional gods and living Pagan traditions: https://csmaccath.com/node/2217
- ADL Hate Symbols Database (for the blocklist): https://www.adl.org/resources/hate-symbols/search

SEO
- Scaled content abuse and doorway pages (summaries): https://ppc.land/scaled-content-abuse/ · https://ppc.land/doorway-pages/
- Google, HowTo and FAQ changes (2023): https://developers.google.com/search/blog/2023/08/howto-faq-changes
- FAQ rich results dropped: https://www.searchenginejournal.com/google-drops-faq-rich-results/574429/

Accessibility
- What's new in WCAG 2.2: https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2
- Target size rule (axe): https://dequeuniversity.com/rules/axe/4.8/target-size

Collision checking
- USPTO trademark search system: https://www.uspto.gov/about-us/news-updates/introducing-usptos-new-cloud-based-trademark-search-system-basic-and-advanced
- EUIPO TMview overview: https://www.intepat.com/blog/tmview/
- WIPO Global Brand Database: https://www.wipo.int/pressroom/en/articles/2013/article_0002.html
- ICANN registration data lookup (Phase 2 domain check): https://www.icann.org/en/blogs/details/updated-lookup-tool-for-domain-name-registration-data-now-available-29-7-2019-en

Hosting and analytics (Revision 2)
- Cloudflare Web Analytics FAQ (no custom events; CSP entries): https://developers.cloudflare.com/web-analytics/faq/
- Pages Functions bindings (Analytics Engine): https://developers.cloudflare.com/pages/functions/bindings/
- Pages Functions pricing (Workers Free quota shared): https://developers.cloudflare.com/pages/functions/pricing/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- VPS Utility Network Master Blueprint v1.1 and the Landscape Project Toolkit conventions: Valkyrja-Publishing-Studios/VPS-Landscape-Project-Toolkit (private repository), `docs/blueprints/VPS-Utility-Network-Master-Blueprint.md`, `README.md`, `docs/LAUNCH-HARDENING.md`
