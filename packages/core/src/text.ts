const FOLD: Readonly<Record<string, string>> = {
  'æ': 'ae', 'Æ': 'Ae', 'œ': 'oe', 'Œ': 'Oe', 'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th',
  'ø': 'o', 'Ø': 'O', 'ß': 'ss', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ı': 'i',
  'ŋ': 'ng', 'Ŋ': 'Ng',
};

/** Decompose and drop combining marks first, so letters like ǿ reach the special-letter map as ø. */
export function asciiFold(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[æÆœŒðÐþÞøØßłŁđĐıŊŋ]/g, ch => FOLD[ch] ?? ch);
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
