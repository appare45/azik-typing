import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InputMatcher, buildKanaUnits, KanaUnitIndex } from './azik';
import { ALL_SENTENCE, SENTENCES } from './sentences';
import type { RubySegment } from './sentences';

type GameState = 'idle' | 'playing' | 'finished';

// セグメントごとのkanaUnits数（InputMatcherと同じ単位）を事前計算（累積）
function buildSegmentKanaOffsets(segments: RubySegment[]): KanaUnitIndex[] {
  const offsets: KanaUnitIndex[] = [];
  let pos = 0;
  for (const seg of segments) {
    offsets.push(KanaUnitIndex(pos));
    pos += buildKanaUnits(seg.ruby).length;
  }
  return offsets;
}

// ルビの各文字をどの色で表示するか（ひらがなの表示単位はkanaUnitsと合わせたい）
type SegmentState = 'done' | 'active' | 'pending';

function getSegmentState(
  segStart: KanaUnitIndex,
  segLen: number,
  kanaPos: KanaUnitIndex
): SegmentState {
  if (kanaPos >= segStart + segLen) return 'done';
  if (kanaPos >= segStart) return 'active';
  return 'pending';
}

function RubyText({
  segments,
  kanaPos,
  wrongKey,
  recentRomaji,
  buf,
}: {
  segments: RubySegment[];
  kanaPos: KanaUnitIndex;
  wrongKey: boolean;
  recentRomaji: string;
  buf: string;
}) {
  const offsets = buildSegmentKanaOffsets(segments);

  return (
    <span>
      {segments.map((seg, i) => {
        const start = offsets[i];
        const len = buildKanaUnits(seg.ruby).length;
        const state = getSegmentState(start, len, kanaPos);

        const rubyColor =
          state === 'done' ? '#aaa' :
          state === 'active' ? (wrongKey ? 'red' : '#e07000') :
          '#ccc';

        const textColor =
          state === 'done' ? '#aaa' :
          state === 'active' ? (wrongKey ? 'red' : '#000') :
          '#ccc';

        const rubyChars = buildKanaUnits(seg.ruby);
        const rubyEl = state === 'active'
          ? rubyChars.map((ch, j) => {
              const absPos = KanaUnitIndex(start + j);
              const chColor = absPos < kanaPos ? '#bbb' : absPos === kanaPos ? (wrongKey ? 'red' : '#e07000') : '#ddd';
              return <span key={j} style={{ color: chColor }}>{ch}</span>;
            })
          : <span style={{ color: rubyColor }}>{seg.ruby}</span>;

        return (
          <span key={i} style={{ display: 'inline-block', position: 'relative' }}>
            <ruby style={{ color: textColor, rubyAlign: 'center' } as React.CSSProperties}>
              {seg.text}
              <rt style={{ fontSize: '0.55em', letterSpacing: 0 }}>{rubyEl}</rt>
            </ruby>
            {state === 'active' && (
              <span style={{
                position: 'absolute',
                top: 'calc(70% - 0.6em)',
                left: 0,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: '0.2rem',
                alignItems: 'center',
                color: '#999',
              }}>
                <span>{recentRomaji}</span>
                {recentRomaji && <span style={{ color: '#ccc' }}>·</span>}
                <span style={{ color: wrongKey ? 'red' : '#333', fontWeight: 'bold' }}>
                  {buf || <span style={{ color: '#ccc', fontWeight: 'normal' }}>_</span>}
                </span>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function TypingGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [matcher, setMatcher] = useState<InputMatcher | null>(null);
  const [kanaPos, setKanaPos] = useState<KanaUnitIndex>(KanaUnitIndex(0));
  const [buf, setBuf] = useState('');
  const [recentRomaji, setRecentRomaji] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [wrongKey, setWrongKey] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matcherRef = useRef<InputMatcher | null>(null);
  const paraRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sentence = ALL_SENTENCE;

  const startGame = useCallback(() => {
    const m = new InputMatcher(sentence.kana);
    matcherRef.current = m;
    setMatcher(m);
    setKanaPos(KanaUnitIndex(0));
    setBuf('');
    setRecentRomaji('');
    setKeystrokes(0);
    setMissCount(0);
    setElapsedTime(0);
    setWrongKey(false);
    setGameState('playing');
    setStartTime(Date.now());
  }, [sentence]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, startTime]);


  useEffect(() => {
    containerRef.current?.focus();
  }, [gameState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (gameState === 'idle' || gameState === 'finished') {
      if (e.key === 'Enter') startGame();
      return;
    }
    if (gameState !== 'playing') return;

    const m = matcherRef.current;
    if (!m) return;

    if (e.key === 'Backspace') {
      const result = m.backspace();
      if (result) {
        setBuf(result.buf);
        setRecentRomaji(result.recentRomaji);
        setWrongKey(false);
      }
      return;
    }

    if (e.key.length !== 1) return;

    setKeystrokes(k => k + 1);
    const result = m.input(e.key);

    if (result.valid) {
      setKanaPos(result.kanaPos);
      setBuf(result.buf);
      setRecentRomaji(result.recentRomaji);
      setWrongKey(false);
      if (result.finished) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
        setGameState('finished');
      }
    } else {
      setMissCount(mc => mc + 1);
      setWrongKey(true);
      setTimeout(() => setWrongKey(false), 150);
    }
  }, [gameState, startTime, startGame]);

  // 各段落の先頭かなユニット絶対位置（InputMatcherのkanaUnits単位、定数）
  const paraKanaOffsets = useMemo(() => {
    const offsets: KanaUnitIndex[] = [];
    let acc = 0;
    for (const s of SENTENCES) {
      offsets.push(KanaUnitIndex(acc));
      acc += buildKanaUnits(s.kana).length;
    }
    return offsets;
  }, []);

  const kanaUnits = matcher?.kanaUnits ?? [];

  // 入力のたびにアクティブ段落を中央にスクロール
  const activePara = gameState === 'playing'
    ? paraKanaOffsets.findLastIndex(offset => kanaPos >= offset)
    : -1;
  useEffect(() => {
    if (activePara >= 0) {
      paraRefs.current[activePara]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [kanaPos]);

  const kps = elapsedTime > 0 ? (keystrokes / elapsedTime).toFixed(1) : '0.0';
  const accuracy = keystrokes > 0
    ? Math.round(((keystrokes - missCount) / keystrokes) * 100)
    : 100;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none', padding: '2rem', fontFamily: 'monospace' }}
    >
      <h1 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        日本国憲法前文 タイピング
      </h1>


      {/* 原文表示（ルビつき・段落ごと） */}
      <div style={{
        marginBottom: '4rem',
        padding: '1.2rem 1.5rem',
        border: '1px solid #ddd',
        fontSize: '1.4rem',
      }}>
        {SENTENCES.map((s, pi) => {
          const offset = paraKanaOffsets[pi];
          const nextOffset = pi + 1 < SENTENCES.length ? paraKanaOffsets[pi + 1] : kanaUnits.length;
          const paraLen = nextOffset - offset;
          const isActive = gameState === 'playing' && kanaPos >= offset && kanaPos < offset + paraLen;
          const relKanaPos: KanaUnitIndex = gameState === 'playing' ? KanaUnitIndex(kanaPos - offset) : KanaUnitIndex(-1);
          return (
            <div key={pi} ref={el => { paraRefs.current[pi] = el; }} style={{
              lineHeight: 3.2,
              paddingBottom: gameState === 'playing' ? '2rem' : '1.5rem',
              borderBottom: pi < SENTENCES.length - 1 ? '1px solid #eee' : 'none',
              marginBottom: pi < SENTENCES.length - 1 ? '2rem' : 0,
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

      {gameState === 'idle' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Enter キーでスタート</p>
        </div>
      )}

      {gameState === 'playing' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
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
          <span>{kanaPos} / {kanaUnits.length} 文字</span>
        </div>
      )}

      {gameState === 'finished' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>完了!</h2>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '1rem 0' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{elapsedTime.toFixed(1)}s</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>時間</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{kps}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>KPS</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{accuracy}%</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>正確率</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{missCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>ミス</div>
            </div>
          </div>
          <p>Enter キーでもう一度</p>
        </div>
      )}
    </div>
  );
}
