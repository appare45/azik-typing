import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InputMatcher, KanaUnitIndex } from '../azikEngine';
import { buildKanaUnits, KanaString } from '../kanaUtils';
import type { Sentence } from '../sentences';
import type { GameResult } from '../TypingGame';
import { RubyText } from './RubyText';

function SentenceView({
  sentences,
  paraKanaOffsets,
  kanaUnitsLength,
  kanaPos,
  wrongKey,
  recentRomaji,
  buf,
  paraRefs,
}: {
  sentences: Sentence[];
  paraKanaOffsets: KanaUnitIndex[];
  kanaUnitsLength: number;
  kanaPos: KanaUnitIndex;
  wrongKey: boolean;
  recentRomaji: string;
  buf: string;
  paraRefs: React.RefObject<(HTMLDivElement | null)[]>;
}) {
  return (
    <div style={{ marginBottom: '4rem', padding: '1.2rem 1.5rem', border: '1px solid #ddd', fontSize: '1.4rem' }}>
      {sentences.map((s, pi) => {
        const offset = paraKanaOffsets[pi];
        const nextOffset = pi + 1 < sentences.length ? paraKanaOffsets[pi + 1] : kanaUnitsLength;
        const paraLen = nextOffset - offset;
        const isActive = kanaPos >= offset && kanaPos < offset + paraLen;
        const relKanaPos = KanaUnitIndex(kanaPos - offset);
        return (
          <div key={pi} ref={el => { paraRefs.current[pi] = el; }} style={{
            lineHeight: 3.2,
            paddingBottom: '2rem',
            borderBottom: pi < sentences.length - 1 ? '1px solid #eee' : 'none',
            marginBottom: pi < sentences.length - 1 ? '2rem' : 0,
          }}>
            <RubyText
              segments={s.segments}
              kanaPos={relKanaPos}
              wrongKey={isActive ? wrongKey : false}
              recentRomaji={isActive ? recentRomaji : ''}
              buf={isActive ? buf : ''}
            />
          </div>
        );
      })}
    </div>
  );
}

function StatusBar({
  elapsedTime,
  keystrokes,
  missCount,
  kanaPos,
  totalKana,
}: {
  elapsedTime: number;
  keystrokes: number;
  missCount: number;
  kanaPos: KanaUnitIndex;
  totalKana: number;
}) {
  const kps = elapsedTime > 0 ? (keystrokes / elapsedTime).toFixed(1) : '0.0';
  const accuracy = keystrokes > 0 ? Math.round(((keystrokes - missCount) / keystrokes) * 100) : 100;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: '#fff',
      borderTop: '1px solid #ddd',
      padding: '0.6rem 2rem',
      display: 'flex',
      gap: '2rem',
      fontSize: '0.9rem',
      zIndex: 100,
    }}>
      <span>時間: {elapsedTime.toFixed(1)}s</span>
      <span>打鍵: {keystrokes}</span>
      <span>ミス: {missCount}</span>
      <span>KPS: {kps}</span>
      <span>正確率: {accuracy}%</span>
      <span>{kanaPos} / {totalKana} 文字</span>
    </div>
  );
}

export function PlayingView({
  sentences,
  onFinish,
}: {
  sentences: Sentence[];
  onFinish: (result: GameResult) => void;
}) {
  const matcherRef = useRef<InputMatcher | null>(null);
  const paraRefs = useRef<(HTMLDivElement | null)[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [started, setStarted] = useState(false);
  const [kanaPos, setKanaPos] = useState<KanaUnitIndex>(KanaUnitIndex(0));
  const [buf, setBuf] = useState('');
  const [recentRomaji, setRecentRomaji] = useState('');
  const [wrongKey, setWrongKey] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [missCount, setMissCount] = useState(0);

  const matcher = useMemo(() => {
    const kana = KanaString(sentences.map(s => s.kana).join(''));
    return new InputMatcher(kana);
  }, [sentences]);

  useEffect(() => {
    matcherRef.current = matcher;
  }, [matcher]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const paraKanaOffsets = useMemo(() => {
    const offsets: KanaUnitIndex[] = [];
    let acc = 0;
    for (const s of sentences) {
      offsets.push(KanaUnitIndex(acc));
      acc += buildKanaUnits(s.kana).length;
    }
    return offsets;
  }, [sentences]);

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
      }
    }, 100);
    return () => clearInterval(id);
  }, [started]);

  const activePara = paraKanaOffsets.findLastIndex(offset => kanaPos >= offset);
  useEffect(() => {
    if (activePara >= 0) {
      paraRefs.current[activePara]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activePara]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

    if (!started) {
      if (e.key === 'Enter') {
        startTimeRef.current = Date.now();
        setStarted(true);
      }
      return;
    }

    const m = matcherRef.current;
    if (!m) return;

    if (e.key === 'Backspace') {
      const result = m.backspace();
      if (result) { setBuf(result.buf); setRecentRomaji(result.recentRomaji); setWrongKey(false); }
      return;
    }

    if (e.key.length !== 1) return;

    const result = m.input(e.key);
    if (result.valid) {
      setKanaPos(result.kanaPos);
      setBuf(result.buf);
      setRecentRomaji(result.recentRomaji);
      setWrongKey(false);
      setKeystrokes(k => k + 1);
      if (result.finished) {
        const elapsed = startTimeRef.current !== null
          ? Math.floor((Date.now() - startTimeRef.current) / 100) / 10
          : 0;
        setElapsedTime(elapsed);
        onFinish({ elapsedTime: elapsed, keystrokes: keystrokes + 1, missCount });
      }
    } else {
      setMissCount(mc => mc + 1);
      setWrongKey(true);
      setTimeout(() => setWrongKey(false), 150);
      setKeystrokes(k => k + 1);
    }
  }, [started, keystrokes, missCount, onFinish]);

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} style={{ outline: 'none' }}>
      {!started && (
        <div style={{ padding: '1rem 0', color: '#888', fontSize: '0.95rem' }}>
          Enter キーで開始
        </div>
      )}
      <SentenceView
        sentences={sentences}
        paraKanaOffsets={paraKanaOffsets}
        kanaUnitsLength={matcher.kanaUnits.length}
        kanaPos={kanaPos}
        wrongKey={wrongKey}
        recentRomaji={recentRomaji}
        buf={buf}
        paraRefs={paraRefs}
      />
      <StatusBar
        elapsedTime={elapsedTime}
        keystrokes={keystrokes}
        missCount={missCount}
        kanaPos={kanaPos}
        totalKana={matcher.kanaUnits.length}
      />
    </div>
  );
}
