# Video Game Name Generator: Blueprint (Design Spec)

| | |
|---|---|
| **Status** | Draft for review. Nothing is built yet. |
| **Date** | 2026-10-08 |
| **Product** | Free, standalone creator utility for the VPS Utility Network |
| **Audience** | Indie developers, game-jam teams, worldbuilders, TTRPG and CRPG designers |
| **Next step** | You review and approve this spec. After that an implementation plan is written, and only then does building start. |

**How to read this.** Sections 1–21 follow the order of your deliverable list. The appendices hold the
template catalogue, phonetic-profile sketches, worked examples and sources. All example titles in this
document are hand-written to show intended behaviour. They are not engine output, and nobody has checked
them against existing games.

**Research method (be aware).** This environment's network policy blocked direct page loads of the
generator sites (fantasynamegenerators.com, namelix.com, thestoryshack.com and others). The research
therefore relies on search-indexed descriptions, third-party reviews and long-standing knowledge of how
these tools work. Feature details for any single tool may be out of date. A 20-minute hands-on pass over
Fantasy Name Generators, Namelix, Wordoid and one AI title tool before the build is worthwhile; it is
unlikely to change the recommendations.

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
| Collision / searchability | Domain tools only | **MVP**: outbound search links + known-title guard. No availability verdicts |
| Save / export | Rare | **MVP**: Copy all favourites. **Phase 2**: TXT/CSV/JSON download and JSON import |

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
- **Site**: pre-rendered static pages (main tool + a few genuinely distinct landing pages) on any static host.

AI enters only at **authoring time**: a language model may help draft word lists, and a human curates every
entry before it ships. Running costs stay at zero (§8).

---

## 3. MVP Feature Set

**In the MVP**

1. Controls: Genre, Mythology / Culture, Tone (+ optional secondary tone), Naming Style, Length, Creativity, Results (5/10/20).
2. Themes field ("Themes, words, lore or vibe"), free text or comma-separated words.
3. Include-this-word field (hard constraint).
4. Avoid-these-words field (words, phrases, `prefix*`, `*suffix`).
5. Generate button, plus Ctrl/⌘+Enter from the themes field. A small **Surprise me** link randomises genre, myth and tone.
6. Results list: title, chips (genre · style · myth), one-line identity note.
7. Per result: **Copy**, **Save** (favourite), **Similar** (6 related alternatives inline), **Check** (outbound search links).
8. **Copy all** results.
9. Shortlist (favourites) in local storage: copy, remove, **Copy all**, **Clear all** (with inline confirmation).
10. Remember last-used settings locally, with a "Clear saved data" control in the privacy note.
11. Disclaimer and privacy note on the page.
12. Built-in quality rules: batch diversity, cliché penalty, readability checks, known-title guard, blocklists.
13. Main page plus six landing pages with distinct, useful content (§15).
14. "Other Free Creator Tools" block and a subtle Valkyrja Publishing Studios footer link.
15. Ad-ready layout (reserved side rails and a below-content slot), with no ad code in the MVP.

**Not in the MVP:** see §19 (Phase 2), the optional future list and §20 (rejected).

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

- A hate-symbol blocklist covers terms and numbers co-opted by extremist movements (for example "14", "88",
  "1488", "Black Sun", "Blood and Soil", "Wolfsangel", "Sonnenrad"), compiled from the ADL Hate Symbols
  Database. This matters most for Norse and Germanic packs, whose imagery has been misused.
- No direct franchise vocabulary (Mythos proper nouns, Tolkien names, Disney titles, game-franchise terms).
- ASCII spelling by default (ð → d or th, þ → th, æ → ae) so titles stay typeable and searchable.

**Default on first load: None / Neutral.**

### 5.2 The 31 MVP options (None + 30 styles)

| Style | Profile | Imagery and concepts (sample) | Rhythm and structures | Tier and notes |
|---|---|---|---|---|
| None / Neutral | Neutral | Genre vocabulary only | Genre defaults | n/a |
| Norse | Norse | frost, raven, wolf, rune, oath, ash, longhall, serpent, wyrd, skald, iron, storm | Hard monosyllables; kennings ("Wolf-Winter"); -bound/-born/-fall compounds | A. Hate-symbol list applies |
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

### 8.3 Engine modules

Every module is a pure function over data. No module touches the DOM.

```
src/engine/
  rng.ts           seeded PRNG (sfc32); seed strings → reproducible batches
  types.ts         shared types (§13)
  data/
    lexicon/*.ts   core vocabulary by category
    concepts.ts    concept registry + alias dictionary (theme steering)
    genres/*.ts    one file per genre preset
    myths/*.ts     one file per cultural pack
    profiles/*.ts  phonetic profiles
    templates.ts   structure templates (Appendix A)
    blocklists.ts  profanity substrings, hate symbols, franchise terms
    known-titles.ts  famous game titles (exact-match guard)
  context.ts       merge genre + myth + tones + style + creativity → weighted pools
  steering.ts      parse themes / include / avoid → boosts, user phrases, constraints
  phonetics.ts     invented words and place names
  render.ts        morphology, compounding, title case
  filters.ts       avoid list, blocklists, known titles, readability
  score.ts         fit, readability, length, rhythm, novelty, cliché
  select.ts        diverse batch selection with family quotas
  notes.ts         identity-note builder
  similar.ts       Regenerate Similar
  index.ts         public API: generate(), generateSimilar()
```

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
- Each cliché frame ("Echoes of", "Shadow of", "Fall of", "Rise of", "Legends", "Chronicles", "Quest", "Saga")
  appears at most once per batch, at a reduced weight.
- The session remembers the last 500 shown titles and avoids repeating them.

### 8.6 Technology

| Concern | Recommendation | Why |
|---|---|---|
| Language | TypeScript | Typed data files catch authoring mistakes |
| Engine | Framework-free module | Testable, portable, reusable by a future Character Name Generator |
| UI | Plain TypeScript + small render helpers | One form and two lists don't need a framework |
| Site | Astro static output (one interactive island) | Pre-rendered HTML for SEO; shared layout for landing pages; ships no JS beyond the tool |
| Tests | Vitest (engine), Playwright + axe-core (UI), fast-check (property tests) | Standard, fast; Playwright works with the preinstalled Chromium |
| Hosting | Any static host (Cloudflare Pages, Netlify, GitHub Pages) | No server, near-zero cost |
| Embedding | Optional build target: a single self-contained bundle | Works if the network turns out to be WordPress-based |

**Budgets:** generator JS + data ≤ 120 KB gzipped (target ~80 KB). 20 titles in < 30 ms on a mid-range
phone (4× CPU throttle in tests). LCP < 1.5 s.

**Security:** user text only ever reaches the DOM through `textContent`, never `innerHTML`. Inputs are length-capped
(themes 500 chars, include 40, avoid 500) and stripped of control characters. A strict Content-Security-Policy
ships from day one and gets revisited when ads arrive.

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
- Numbers come from curated lists (Nine, Seventh, Thirteen, 47) with the hate-symbol numbers removed.

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
- Fails if it contains a profanity or hate-term substring, or matches a known title. A false positive costs nothing: the engine draws another word.

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
- Built-in filters (profanity, hate symbols, franchise terms, known titles) apply to **engine-generated
  material only**. The user's own words pass through untouched, apart from their own Avoid list.

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
| **Check ▾** | Disclosure with links: Search the web · Steam · itch.io · Domain (.com). Each opens in a new tab. |

**Check links** (built with `encodeURIComponent`; `rel="noopener noreferrer nofollow"`):

- Web: `https://www.google.com/search?q="<title>" game` (engine configurable; see Open Questions)
- Steam: `https://store.steampowered.com/search/?term=<title>`
- itch.io: `https://itch.io/search?q=<title>`
- Domain: neutral ICANN registration lookup for `<slug>.com`, using the main title before any colon
  ("Aeternum: Ashen Crown" → `aeternum.com`). The exact ICANN URL format must be verified during the build.

The page states that clicking a Check link sends that title to the site you open.

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
Include and Avoid constraints still apply. Output: 6 titles, at least 3 strategies represented, none repeated.

### 11.4 Shortlist (favourites)

- Section heading "Shortlist (n)" with a jump link from the results header.
- Each item: title, small meta line (genre · myth), **Copy**, **Remove**, **Similar** (works from saved recipes).
- **Copy all**: plain text, one title per line.
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

### 12.1 Desktop (≥ 1024 px; side rails reserved at ≥ 1280 px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ VPS Utility Network › Creator Tools                      Other free tools ▾│
├──────────┬────────────────────────────────────────────────────┬────────────┤
│ reserved │ Video Game Name Generator                          │ reserved   │
│ ad rail  │ Game titles that fit your genre, myth and vibe.    │ ad rail    │
│ (empty   │ Free · No sign-up · Runs in your browser           │ (empty     │
│ in MVP)  │ ┌────────────────────────────────────────────────┐ │ in MVP)    │
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
│          │ Shortlist (4)                      Copy all · Clear │            │
│          │ How it works · Choosing a good title · Mythology   │            │
│          │ with care · Privacy                                │            │
│          │ Other Free Creator Tools  [card] [card] [card]     │            │
│          │ [ reserved below-content ad slot, empty in MVP ]   │            │
├──────────┴────────────────────────────────────────────────────┴────────────┤
│ A free tool from Valkyrja Publishing Studios · Privacy · About             │
└────────────────────────────────────────────────────────────────────────────┘
```

- Content column max-width ~880 px. The controls card uses a responsive grid (3 columns ≥ 1024 px,
  2 columns ≥ 600 px, 1 column below). Results use 2 columns ≥ 1024 px.
- Ad placements live **only** in the side rails (≥ 1280 px) and after the content sections. Never between
  controls and results, never inside the results list or shortlist, never as pop-ups or interstitials.
  Slots get fixed reserved sizes to prevent layout shift.
- After Generate, focus moves to the results heading, which brings it into view (instant scrolling when
  reduced motion is on). Screen readers then read the heading ("10 titles · Dark Fantasy · Norse · Grim").

### 12.2 Mobile (< 600 px)

```
┌───────────────────────────┐
│ VPS Tools           ☰     │
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
│ Content sections…         │
│ [below-content ad slot]   │
└───────────────────────────┘
```

On mobile, Length, Creativity, Results, Include, Avoid and the second tone sit under **Fine-tune**, with
a one-line summary of the current values so defaults stay visible.

### 12.3 Content sections under the tool

1. **How it works** (~150 words): procedural, local, what each control does.
2. **Choosing a good game title**: a checklist. Say it aloud; can someone spell it after hearing it? Search
   Steam, itch.io and the web; avoid filler like "Shadow of" and "Echoes of"; check a trademark database
   (USPTO, EUIPO TMview, WIPO Global Brand Database); keep subtitles purposeful; check legibility at
   small capsule size.
3. **Mythology with care**: two short paragraphs on the imagery-first approach.
4. **Privacy** and the disclaimer.
5. **Other Free Creator Tools**: config-driven card list (placeholder until sibling tools exist).

---

## 13. Data Model

```ts
// ── Identifiers ─────────────────────────────────────────────────────────────
type GenreId = string;     // "dark-fantasy"
type MythId = string;      // "norse"; "none" = neutral
type ToneId = string;      // "grim"
type StyleId = string;     // "evocative"
type ProfileId = string;   // "norse", "soft", "cyberpunk"
type ConceptId = string;   // "oath", "cold", "signal"

// ── Settings (form state; also stored locally) ──────────────────────────────
interface Settings {
  genre: GenreId;
  myth: MythId;
  tone: ToneId | "auto";
  tone2?: ToneId;
  style: StyleId | "auto";
  length: "any" | "one" | "short" | "medium" | "long";
  creativity: "focused" | "balanced" | "wild";
  count: 5 | 10 | 20;
  themes: string;          // ≤ 500 chars
  include: string;         // ≤ 40 chars
  avoid: string;           // ≤ 500 chars
}

// ── Lexicon ─────────────────────────────────────────────────────────────────
type Pos = "noun" | "adj" | "verb" | "abstract" | "place" | "frame" | "prep" | "number";
interface LexEntry {
  id: string;                                   // "ash"
  text: string;                                 // "Ash"
  pos: Pos[];
  forms?: { plural?: string; adj?: string; gerund?: string; past?: string };
  cat: string[];                                // ["material", "force"]
  concepts: ConceptId[];                        // ["fire", "ruin", "death"]
  family?: string;                              // "fire-residue"
  tones?: Partial<Record<ToneId, number>>;      // affinity −1 … +1
  genres?: Partial<Record<GenreId, number>>;    // weight multipliers
  myths?: Partial<Record<MythId, number>>;
  register: "plain" | "archaic" | "lofty" | "technical" | "whimsical";
  syllables: number;
  cliche?: number;                              // 0 … 1
  compound?: "head" | "tail" | "both";
  flags?: ("noStart" | "noEnd" | "sensitive")[];
}

interface Concept {
  id: ConceptId;
  label: string;                // used in identity notes: "oath"
  related: ConceptId[];         // Similar and Wild use these
}
type AliasMap = Record<string, ConceptId[]>;    // "northern lights" → ["aurora", "sky", "light", "north", "cold"]

// ── Presets ─────────────────────────────────────────────────────────────────
interface GenrePreset {
  id: GenreId; label: string; group: string;
  parent?: GenreId;                              // inherited at 0.5 weight
  conceptBoosts: Partial<Record<ConceptId, number>>;
  suppress?: ConceptId[];                        // Cozy: ["gore", "war"]
  templateWeights: Partial<Record<string, number>>;
  defaultTones: ToneId[];
  lengthBias: { short: number; medium: number; long: number };
  frameWords?: string[];
  suffixWords?: string[];                        // "Tactics", "Farm", "Online"
  entries?: LexEntry[];                          // genre-specific vocabulary
  profile?: ProfileId;                           // fallback for coined words
}

interface MythPack {
  id: MythId; label: string; group: string;
  tier: "A" | "B";
  blend?: { id: MythId; weight: number }[];      // Mesoamerican = Aztec 0.5 + Maya 0.5
  profile: ProfileId;
  coinedRate: number;                            // Tier B packs use low values
  conceptBoosts: Partial<Record<ConceptId, number>>;
  imagery: LexEntry[];
  symbolic?: (LexEntry & { sourceNote: string })[];   // reviewed terms, each with a source
  templateWeights: Partial<Record<string, number>>;
  noteLabel: string;                             // "Norse", "Japanese-inspired"
  reviewNotes: string;                           // authoring/review record (not shown)
}

interface ToneDef  { id: ToneId; label: string; conceptBoosts: Partial<Record<ConceptId, number>>; templateWeights: Partial<Record<string, number>>; soundBias?: Partial<Record<string, number>> }
interface StyleDef { id: StyleId; label: string; templateWeights: Partial<Record<string, number>>; maxWords?: number; maxChars?: number; coinedRate: number; register?: Partial<Record<LexEntry["register"], number>> }

// ── Templates ───────────────────────────────────────────────────────────────
interface Template {
  id: string;                                    // "of-phrase"
  family: string;                                // quota key
  pattern: string;                               // "{noun} of {nounPl}"
  words: [number, number];
  lengthClass: "one" | "short" | "medium" | "long";
  styleWeights?: Partial<Record<StyleId, number>>;
  genreWeights?: Partial<Record<GenreId, number>>;
  lockSlots: string[];                           // slots that can hold the Include word
}

// ── Phonetics ───────────────────────────────────────────────────────────────
interface PhoneticProfile {
  id: ProfileId; label: string;
  onsets: [string, number][]; nuclei: [string, number][]; codas: [string, number][];
  shapes: [string, number][];                    // ["CVC", 5]
  syllables: [number, number][];                 // [2, 0.7], [3, 0.25]
  endings?: [string, number][];
  forbid: RegExp[];
  rewrite?: [RegExp, string][];
  letters: [number, number];                     // min/max length
}

// ── Output ──────────────────────────────────────────────────────────────────
type RecipePart =
  | { kind: "lex"; slot: string; entryId: string; form: string; text: string }
  | { kind: "user"; slot: string; phrase: string; text: string }
  | { kind: "include"; slot: string; text: string }
  | { kind: "coined"; slot: string; profile: ProfileId; syllables: string[]; text: string }
  | { kind: "literal"; text: string };

interface Recipe { templateId: string; family: string; parts: RecipePart[]; anchor?: ConceptId; seed: string }

interface TitleResult {
  id: string;                                    // stable hash of title + settings
  title: string;
  meta: { genre: GenreId; myth: MythId; style: StyleId; tones: ToneId[]; concepts: ConceptId[]; note: string };
  recipe: Recipe;
  settings: Settings;                            // snapshot used for Similar
}

interface Notice { code: "include-conflicts-avoid" | "pool-limited" | "include-unusable" | "shortfall"; message: string }
interface GenerateResult { titles: TitleResult[]; notices: Notice[]; seed: string }

// ── Public engine API ───────────────────────────────────────────────────────
declare function generate(settings: Settings, opts?: { seed?: string; exclude?: Set<string> }): GenerateResult;
declare function generateSimilar(source: TitleResult, opts?: { count?: number; seed?: string; exclude?: Set<string> }): GenerateResult;
```

**Data validation.** A build- and test-time check (zod or hand-written; never shipped to the browser) confirms
that every entry has its required fields, every referenced concept, genre, myth and template id exists, no ids
repeat, and no entry hits the franchise or hate-symbol blocklists.

---

## 14. Local Storage Strategy

| Key | Contents | Limit |
|---|---|---|
| `vps.gameTitles.v1.favorites` | `{ v: 1, items: FavoriteItem[] }` | 500 items |
| `vps.gameTitles.v1.settings` | Last-used `Settings` | 1 object |

```ts
interface FavoriteItem {
  id: string; title: string; savedAt: string;    // ISO date
  meta: TitleResult["meta"];
  recipe: Recipe; settings: Settings;            // lets Similar work from the shortlist
}
```

- **One storage module** wraps every read and write in try/catch. If storage is unavailable (blocked, full, or
  throwing), the app keeps favourites in memory and shows one quiet notice: "Your browser isn't letting this
  page save; favourites last until you close the tab."
- **Validation and migration.** Each read checks the shape and the `v` field. Older versions migrate forward.
  Corrupt JSON is copied to `…favorites.corrupt-<timestamp>` and the user starts fresh, with a notice.
- **Cross-tab sync.** Listen for the `storage` event and refresh the shortlist.
- **Quota errors** show "Couldn't save; browser storage is full or disabled."
- **Session memory** (recently shown titles) stays in memory only.
- **Durability warning.** Safari can delete script-written storage for sites you haven't visited in about a
  week of browsing. That is why the shortlist note recommends Copy all, and why Phase 2 adds file export and import.
- **Clear saved data** in the privacy section removes both keys.
- **Share links (Phase 2)** would put settings in the URL *fragment* (`#…`), which browsers never send to the
  server, so themes stay private even in shared links.

---

## 15. SEO Strategy

### 15.1 Position

Search engines punish near-duplicate pages built to catch query variants (Google's doorway-page and
scaled-content-abuse policies, reinforced since March 2024). The plan is **few pages, each genuinely different
and useful**, sharing one generator.

### 15.2 Structure

| URL (assuming the network hosts tools under its own domain) | Content |
|---|---|
| `/video-game-name-generator/` | Main tool + how it works + naming checklist + mythology note + privacy |
| `/video-game-name-generator/fantasy/` | Fantasy title conventions; how Dark, High and generic Fantasy titles differ; structures with examples; cliché list; 12–20 curated examples; generator preset to Fantasy |
| `/video-game-name-generator/horror/` | Horror vs psychological vs cosmic naming; the power of short and imperative titles; examples; preset to Horror |
| `/video-game-name-generator/rpg/` | RPG, Action RPG and CRPG naming; subtitles and franchise planning; examples |
| `/video-game-name-generator/sci-fi/` | Sci-fi, cyberpunk and space opera naming; codes and numbers; examples |
| `/video-game-name-generator/norse/` | Kennings, saga titles, Old Norse spelling and searchability, symbols to avoid; examples |
| `/video-game-name-generator/mythology/` | Hub for all 30 styles: one honest sentence each on how the style shapes titles, the care tiers, and links that preset the selector |

Each landing page carries 400–800 words of category-specific guidance, written by hand, plus 12–20 curated
examples rendered as static HTML. Examples are chosen from engine output and checked against Steam. The
generator on each page is the same tool with a different default preset.

### 15.3 What not to build

- No genre × myth combination pages (961 near-duplicates).
- No tag pages, no auto-generated example dumps, no keyword-stuffed copy.
- Query-parameter variants (`?genre=cyberpunk`) carry a canonical link to the main page and are not indexed.

### 15.4 Growth rule

After 8–12 weeks, read Search Console. Add a Phase 2 page (Cozy, Cyberpunk, Survival, Roguelike, Creature
Collector, Greek, Celtic, Egyptian, Japanese-inspired) **only** where impressions and queries show demand
*and* there is something distinct to say.

### 15.5 Technical basics

- Pre-rendered HTML; unique `<title>`, meta description and H1 per page; use "video game name generator"
  and "game title generator" naturally.
- `WebApplication` structured data (free, browser-based) and `BreadcrumbList`. FAQ and HowTo rich results
  are deprecated, so don't build pages around them.
- XML sitemap, Open Graph image per page, fast Core Web Vitals, internal links between landing pages and to
  sibling creator tools.
- Honest copy: "no AI, no sign-up, runs in your browser" is a real differentiator. Don't claim "AI-powered".

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
- **Visual.** Text contrast ≥ 4.5:1; chips never rely on colour alone; light and dark themes via `prefers-color-scheme`.
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

1. **Engine unit tests (Vitest):** PRNG determinism; theme parsing (phrases, aliases, lemmas, raw words);
   Avoid syntax (word, phrase, prefix, suffix, contains); Include placement; morphology and title case;
   compound joining; every template renders; identity-note frames; Similar strategies.
2. **Property-based tests (fast-check), random settings × random seeds:**
   - result count equals the request, or a shortfall notice explains why;
   - the Include word appears in 100% of titles;
   - zero Avoid matches; zero blocklist or known-title matches in engine-generated parts;
   - no duplicates within a batch; length class honoured;
   - the same seed gives the same output.
3. **Combinatorial smoke test:** all 31 genres × 31 cultural options (961 combinations) × 20 titles, plus every tone ×
   every naming style on a fixed genre. Expect no exceptions, no empty pools, and the time budget met.
4. **Quality metrics script (`npm run quality`)**, 1,000 titles per sample preset, thresholds enforced in CI:
   - largest template-family share ≤ 30%;
   - no single word in more than 4% of titles;
   - cliché-frame rate under target;
   - literal user-keyword rate inside the band for each creativity level (Balanced: 30–50%);
   - every user phrase used at least once per 20-title batch;
   - average length matches the length class.
5. **Golden snapshots:** 20 fixed seed + preset pairs saved as JSON. Data edits that change them get reviewed on purpose.
6. **Human review rubric:** for 20 core presets, rate 50 titles each from 1 to 5 on genre fit, theme fit,
   originality, readability and "would I put this on a Steam page?". Targets: ≥ 30% rated 4+, < 5% broken
   (ungrammatical or nonsense). Repeat after major data changes.
7. **Cultural review:** a checklist per pack (no deity or sacred names in Tier B, no stereotypes, no co-opted
   hate symbols, every symbolic term has a source note). Sign-off recorded in `docs/VALIDATION.md`. A reader from,
   or deeply familiar with, each Tier B culture is strongly recommended (see Open Questions).
8. **Collision sweep:** generate 100,000 titles across presets and compare with the known-title list. Expect zero
   exact matches; manually review a sample of near-matches (one edit away).
9. **End-to-end (Playwright, Chromium):** generate; change settings; Copy (with clipboard permission granted);
   Save → reload → still saved; Remove; Clear all with confirmation; Similar shows 6 related titles; Include and
   Avoid through the UI; Check links encode correctly; 360 × 740 viewport has no horizontal scroll;
   keyboard-only run-through.
10. **Accessibility:** `@axe-core/playwright` on every page (zero violations), plus the manual screen-reader passes in §16.
11. **Performance:** Lighthouse CI budgets (mobile performance ≥ 95, accessibility 100, SEO 100); bundle ≤ 120 KB gzipped; 20 titles < 30 ms at 4× CPU throttle.
12. **Storage robustness:** storage disabled or throwing (Playwright init script), corrupt JSON, quota exceeded, two tabs open.
13. **Cross-browser manual check:** Chrome, Firefox, Safari (macOS and iOS), Samsung Internet.
14. **Security:** XSS payloads in every input render as text; CSP violations fail the e2e run.

In line with the VPS Atmosphere Visualizer's honesty rules, `docs/VALIDATION.md` records only checks
actually performed, with dates and results, and the README separates implemented, tested and planned.

---

## 19. Phase 2 Features

Ordered by value for effort.

1. **Export and import the shortlist:** TXT, CSV and JSON downloads; JSON import to restore.
2. **Capsule preview:** show a title on a Steam-capsule-sized card (460 × 215) in a few type styles to judge legibility at small sizes. CSS only.
3. **"Hear it":** speak a title with the browser's built-in speech synthesis, to test pronounceability.
4. **Include-word placement:** Start / End / Anywhere.
5. **"Avoid clichés" toggle:** turns the soft cliché penalty into a hard filter.
6. **Shareable links:** settings + seed in the URL fragment, so themes stay private.
7. **Session history:** step back to the previous batch or two.
8. **"Also suits" hints:** cross-genre fit chips computed from concept overlap.
9. **Notes on favourites** (one line per saved title).
10. **More check links:** App Store, Google Play, IGDB/MobyGames, USPTO, EUIPO TMview, WIPO.
11. **More landing pages,** driven by Search Console data (§15.4).
12. **More genres and split cultural packs** (named African traditions, for example), with consultation.
13. **Optional diacritics** for cultural styles, off by default for searchability.

**Optional future (only if there's demand)**

- Opt-in AI "refine this title" using the visitor's own API key or a tightly rate-limited proxy, clearly disclosed.
- Offline support (PWA), since the tool already runs entirely client-side.
- A shared engine for a VPS Character Name Generator (the phonetic engine and lexicon carry over).
- Studio-name and TTRPG-campaign modes.
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

---

## 21. Open Questions / Suggestions

### Open questions (your call)

1. **Which repository?** This repo is named *VPS-Character-Name-Generator* and is empty. Options:
   (a) build the game-title tool here and rename the repo; (b) create a new repo for it; (c) make this a small
   "VPS name tools" project where one engine powers both a game-title and a character-name generator.
   **I recommend (c) or (a).** The phonetic engine and lexicon are exactly what a character-name generator needs.
2. **Where does the VPS Utility Network live?** Domain, URL conventions, and whether it is a static site or
   WordPress. This decides between Astro static pages (recommended) and an embeddable bundle.
3. **Hosting:** Cloudflare Pages (a Cloudflare connection exists on your account), Netlify or GitHub Pages?
4. **Brand assets:** existing VPS colours, fonts and logo? Dark theme by default?
5. **Cultural review:** can we get one reader per Tier B culture before launch? If not, choose:
   (a) ship all 30 styles with the imagery-first design and "-inspired" labels (my recommendation, with the
   checklist review), or (b) launch Tier A styles first and add Tier B after review.
6. **Analytics:** none at all, or cookieless aggregate counts (page views, Generate clicks, selected genre;
   never typed text)?
7. **Check links:** Google or DuckDuckGo for the web search? Neutral ICANN lookup or a registrar for domains
   (and is any affiliate arrangement intended)?
8. **Defaults:** Fantasy · None · Auto · Auto · Any · Balanced · 10. Change any?
9. **Cultural list edits:** relabel "African mythology" as "African folklore-inspired (pan-African)" for the MVP?
   Keep Aztec and Maya alongside Mesoamerican (implemented as a blend)?
10. **Ads timeline:** if ads come soon, the privacy note, consent banner (EU/UK) and CSP need planning now.
11. **English only** for generated titles at launch?
12. **Clichés:** keep classic frames like "Chronicles of X" available at reduced frequency (current plan), or ban them by default?

### Suggestions

- **Author with AI, ship without it.** Use a model to draft word lists quickly, then curate by hand. Most of
  the build effort is data, not code.
- **Start with six landing pages.** Expand only on evidence.
- **Make Similar the hero interaction.** No competitor has it, and it turns "almost" into "yes".
- **Lean into the anti-cliché story.** "Avoids the 'Shadow of' trap" is a concrete promise that resonates with developers.

### Proposed build sequence (detailed in the implementation plan after approval)

1. Engine skeleton: types, PRNG, template renderer, data validation, 3 genres, 3 styles, tests.
2. Full data: 31 genres, 30 cultural packs, lexicon, concepts, aliases, 16 profiles; quality script; cultural checklist.
3. UI: form, results, Similar, Check links, shortlist, storage, accessibility, mobile.
4. Site: main page, six landing pages with written content, network header and footer, privacy, SEO basics.
5. QA: end-to-end, axe, Lighthouse, cross-browser, human rubric, cultural sign-off; then launch.

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
- ICANN registration data lookup: https://www.icann.org/en/blogs/details/updated-lookup-tool-for-domain-name-registration-data-now-available-29-7-2019-en
