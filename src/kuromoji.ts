import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import type { RubySegment } from './sentences';
import { katakanaToHiragana, isKanaOnly, JapaneseText, KanaString } from './kanaUtils';

type KuromojiModule = typeof import('kuromoji');

function isKuromojiModule(v: unknown): v is KuromojiModule {
  return typeof v === 'object' && v !== null && 'builder' in v && typeof (v as Record<string, unknown>).builder === 'function';
}

function getWindowKuromoji(): KuromojiModule | undefined {
  const v = (window as unknown as Record<string, unknown>).kuromoji;
  return isKuromojiModule(v) ? v : undefined;
}

export function buildTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    const existing = getWindowKuromoji();
    if (existing) {
      initTokenizer(existing, resolve, reject);
      return;
    }
    const script = document.createElement('script');
    script.src = '/kuromoji.js';
    script.onload = () => {
      const k = getWindowKuromoji();
      if (!k) { reject(new Error('kuromoji not found on window')); return; }
      initTokenizer(k, resolve, reject);
    };
    script.onerror = () => reject(new Error('Failed to load kuromoji.js'));
    document.head.appendChild(script);
  });
}

function initTokenizer(
  kuromoji: KuromojiModule,
  resolve: (t: Tokenizer<IpadicFeatures>) => void,
  reject: (e: Error) => void
) {
  kuromoji.builder({ dicPath: '/kuromoji-dict' }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
    if (err) reject(err);
    else resolve(tokenizer);
  });
}

export function buildSegmentsFromTokens(tokens: IpadicFeatures[], paragraph: string): RubySegment[] {
  const segments: RubySegment[] = [];

  let pos = 0;
  for (const token of tokens) {
    const sf = token.surface_form;
    if (!paragraph.startsWith(sf, pos)) {
      const idx = paragraph.indexOf(sf, pos);
      if (idx > pos) {
        const missed = paragraph.slice(pos, idx);
        segments.push({ text: JapaneseText(missed), ruby: KanaString(missed) });
        pos = idx;
      }
    }

    const reading = token.reading;
    const noReading = !reading || reading === '*' || reading === sf;

    if (noReading && !isKanaOnly(sf)) {
      segments.push({ text: JapaneseText(sf), ruby: KanaString(sf) });
    } else {
      const ruby = katakanaToHiragana(reading ?? sf);
      segments.push({ text: JapaneseText(sf), ruby });
    }

    pos += sf.length;
  }

  if (pos < paragraph.length) {
    const rest = paragraph.slice(pos);
    segments.push({ text: JapaneseText(rest), ruby: KanaString(rest) });
  }

  return segments;
}
