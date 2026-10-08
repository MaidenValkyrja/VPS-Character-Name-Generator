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
