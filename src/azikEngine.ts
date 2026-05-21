import { buildKanaUnits, KanaString } from './kanaUtils';
import { ROMAJI_TO_KANA } from './azikTable';

function buildKanaToRomaji(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [romaji, kana] of Object.entries(ROMAJI_TO_KANA)) {
    const existing = map.get(kana) ?? [];
    existing.push(romaji);
    map.set(kana, existing);
  }
  return map;
}

const KANA_TO_ROMAJI = buildKanaToRomaji();
// 歴史的仮名遣い：旧字体かなのローマ字入力
KANA_TO_ROMAJI.set('ゐ', ['wi']);
KANA_TO_ROMAJI.set('ゑ', ['we']);

const ROMAJI_PREFIXES = new Set<string>();
for (const romaji of Object.keys(ROMAJI_TO_KANA)) {
  for (let i = 1; i <= romaji.length; i++) {
    ROMAJI_PREFIXES.add(romaji.slice(0, i));
  }
}

// -----------------------------------------------------------------------
// NFA方式のリアルタイム入力マッチャー
// かな列全体に対して、任意のローマ字入力経路を並列追跡する
// -----------------------------------------------------------------------

// kanaUnits配列上のインデックス（Unicode文字数と混同しないためのbranded type）
export type KanaUnitIndex = number & { readonly __brand: 'KanaUnitIndex' };
export const KanaUnitIndex = (n: number): KanaUnitIndex => n as KanaUnitIndex;

type NFAState = {
  kanaPos: KanaUnitIndex;
  buf: string;
};

export type MatchResult = {
  valid: boolean;
  kanaPos: KanaUnitIndex;
  buf: string;
  finished: boolean;
  recentRomaji: string;
};

export class InputMatcher {
  private kana: string[];
  private states: NFAState[];
  private recentRomaji: string = '';

  constructor(kanaStr: KanaString) {
    this.kana = buildKanaUnits(kanaStr);
    this.states = [{ kanaPos: KanaUnitIndex(0), buf: '' }];
  }

  get kanaUnits(): string[] { return this.kana; }

  private bestState(): NFAState {
    return this.states.reduce((a, b) => a.kanaPos >= b.kanaPos ? a : b);
  }

  get completedKanaCount(): KanaUnitIndex { return this.bestState().kanaPos; }
  get currentBuf(): string { return this.bestState().buf; }
  get isFinished(): boolean { return this.bestState().kanaPos >= this.kana.length; }

  input(key: string): MatchResult {
    const nextStates: NFAState[] = [];
    let confirmedRomaji: string | null = null;

    for (const state of this.states) {
      if (state.kanaPos >= this.kana.length) {
        nextStates.push(state);
        continue;
      }

      const newBuf = state.buf + key;

      const consumed = this.tryConsume(newBuf, state.kanaPos);
      for (const nextPos of consumed) {
        nextStates.push({ kanaPos: nextPos, buf: '' });
        if (confirmedRomaji === null || nextPos > (nextStates[0]?.kanaPos ?? 0)) {
          confirmedRomaji = newBuf;
        }
      }

      if (ROMAJI_PREFIXES.has(newBuf)) {
        if (this.canExtend(newBuf, state.kanaPos)) {
          nextStates.push({ kanaPos: state.kanaPos, buf: newBuf });
        }
      }
    }

    if (nextStates.length === 0) {
      const best = this.bestState();
      return { valid: false, kanaPos: best.kanaPos, buf: best.buf, finished: this.isFinished, recentRomaji: this.recentRomaji };
    }

    const maxKanaPos = nextStates.reduce((m, s) => Math.max(m, s.kanaPos), 0);
    const seen = new Set<string>();
    this.states = nextStates.filter(s => {
      if (s.kanaPos < maxKanaPos) return false;
      const k = `${s.kanaPos}:${s.buf}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (confirmedRomaji !== null) {
      this.recentRomaji = confirmedRomaji;
    }

    const best = this.bestState();
    return { valid: true, kanaPos: best.kanaPos, buf: best.buf, finished: this.isFinished, recentRomaji: this.recentRomaji };
  }

  backspace(): MatchResult | null {
    const best = this.bestState();
    if (best.buf.length === 0) return null;
    const newBuf = best.buf.slice(0, -1);
    this.states = [{ kanaPos: best.kanaPos, buf: newBuf }];
    return { valid: true, kanaPos: best.kanaPos, buf: newBuf, finished: false, recentRomaji: this.recentRomaji };
  }

  private tryConsume(buf: string, kanaPos: KanaUnitIndex): KanaUnitIndex[] {
    const results: KanaUnitIndex[] = [];

    const mapped = ROMAJI_TO_KANA[buf];
    if (mapped) {
      const mappedUnits = buildKanaUnits(KanaString(mapped));
      let pos = kanaPos;
      let ok = true;
      for (const unit of mappedUnits) {
        if (pos >= this.kana.length || this.kana[pos] !== unit) { ok = false; break; }
        pos++;
      }
      if (ok) results.push(KanaUnitIndex(pos));
    }

    if (kanaPos < this.kana.length) {
      const unit = this.kana[kanaPos];
      const romajis = KANA_TO_ROMAJI.get(unit);
      if (romajis?.includes(buf) && mapped !== unit) {
        results.push(KanaUnitIndex(kanaPos + 1));
      }
    }

    return results;
  }

  private canExtend(buf: string, kanaPos: KanaUnitIndex): boolean {
    for (const [romaji, mapped] of Object.entries(ROMAJI_TO_KANA)) {
      if (!romaji.startsWith(buf)) continue;
      const mappedUnits = buildKanaUnits(KanaString(mapped));
      let pos = kanaPos;
      let ok = true;
      for (const unit of mappedUnits) {
        if (pos >= this.kana.length || this.kana[pos] !== unit) { ok = false; break; }
        pos++;
      }
      if (ok) return true;
    }

    if (kanaPos < this.kana.length) {
      const unit = this.kana[kanaPos];
      const romajis = KANA_TO_ROMAJI.get(unit);
      if (romajis?.some(r => r.startsWith(buf))) return true;
    }

    return false;
  }
}
