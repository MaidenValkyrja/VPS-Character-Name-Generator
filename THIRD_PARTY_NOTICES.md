# Third-party notices

Entries are added when third-party data, fonts or code ship in the product.

## naughty-words 1.2.0

- Licence: CC-BY-4.0
- Source: https://www.npmjs.com/package/naughty-words (the "List of Dirty, Naughty, Obscene, and Otherwise Bad Words", originally from Shutterstock).
- Use: a development-time word list. `scripts/build-safety.ts` reads it and writes `packages/data/src/safety-generated.ts`, the list of fragments that rejects invented words. The generated fragment list ships in the generator data bundle; the package itself does not ship.
- Changes: words are lower-cased, de-duplicated, reduced to plain a-z entries of 4 to 12 letters, and sorted. Three-letter entries are reviewed by hand before any are used.
