export type KanaString = string & { readonly __brand: 'KanaString' };
export const KanaString = (s: string): KanaString => s as KanaString;

export type JapaneseText = string & { readonly __brand: 'JapaneseText' };
export const JapaneseText = (s: string): JapaneseText => s as JapaneseText;

export function buildKanaUnits(kanaStr: KanaString): string[] {
  const result: string[] = [];
  let i = 0;
  const chars = [...kanaStr];
  const small = 'ぁぃぅぇぉゃゅょ';
  while (i < chars.length) {
    if (i + 1 < chars.length && small.includes(chars[i + 1])) {
      result.push(chars[i] + chars[i + 1]);
      i += 2;
    } else {
      result.push(chars[i]);
      i++;
    }
  }
  return result;
}

export function katakanaToHiragana(str: string): KanaString {
  return str.replace(/[ァ-ン]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)) as KanaString;
}

const KANA_ONLY = /^[ぁ-ん々ー、。「」『』・…！？\s]+$/;
export function isKanaOnly(str: string): str is KanaString {
  return KANA_ONLY.test(str);
}

export function splitBySentenceEnd(text: string): JapaneseText[] {
  const result: JapaneseText[] = [];
  const re = /[^。！？]*[。！？]/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(text)) !== null) {
    result.push(JapaneseText(m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(JapaneseText(text.slice(last)));
  return result.filter(s => s.length > 0);
}
