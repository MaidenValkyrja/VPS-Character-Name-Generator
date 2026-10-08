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
