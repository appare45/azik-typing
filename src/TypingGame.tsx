import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { InputMatcher, buildKanaUnits, KanaUnitIndex } from './azik';
import { SENTENCES } from './sentences';
import type { RubySegment, Sentence } from './sentences';
import { generateSentences, buildTokenizer, EXAMPLE_TEXTS } from './LLMInput';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';

type GameState = 'idle' | 'preparing' | 'playing' | 'finished';

function buildSegmentKanaOffsets(segments: RubySegment[]): KanaUnitIndex[] {
  const offsets: KanaUnitIndex[] = [];
  let pos = 0;
  for (const seg of segments) {
    offsets.push(KanaUnitIndex(pos));
    pos += buildKanaUnits(seg.ruby).length;
  }
  return offsets;
}

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

// 日本国憲法前文を1つのSentenceとして扱う（segments=全段落のflatMap）
const PRESET_SENTENCES = SENTENCES;

export function TypingGame() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [activeSentences, setActiveSentences] = useState<Sentence[]>(PRESET_SENTENCES);
  const [matcher, setMatcher] = useState<InputMatcher | null>(null);
  const [kanaPos, setKanaPos] = useState<KanaUnitIndex>(KanaUnitIndex(0));
  const [buf, setBuf] = useState('');
  const [recentRomaji, setRecentRomaji] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [wrongKey, setWrongKey] = useState(false);

  // テキスト入力UI
  const [inputText, setInputText] = useState('');
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [prepareTotal, setPrepareTotal] = useState(0);
  const [prepareStatus, setPrepareStatus] = useState('');
  const [prepareError, setPrepareError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matcherRef = useRef<InputMatcher | null>(null);
  const paraRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tokenizerRef = useRef<Tokenizer<IpadicFeatures> | null>(null);
  const [tokenizerReady, setTokenizerReady] = useState(false);

  useEffect(() => {
    buildTokenizer()
      .then(t => { tokenizerRef.current = t; setTokenizerReady(true); })
      .catch(err => console.error('[kuromoji] failed to load:', err));
  }, []);

  const fullKana = useMemo(
    () => activeSentences.map(s => s.kana).join(''),
    [activeSentences]
  );

  const startGame = useCallback((sentences: Sentence[]) => {
    const kana = sentences.map(s => s.kana).join('');
    const m = new InputMatcher(kana);
    matcherRef.current = m;
    setMatcher(m);
    setActiveSentences(sentences);
    setKanaPos(KanaUnitIndex(0));
    setBuf('');
    setRecentRomaji('');
    setKeystrokes(0);
    setMissCount(0);
    setElapsedTime(0);
    setWrongKey(false);
    setGameState('playing');
    setStartTime(Date.now());
  }, []);

  const handleStart = useCallback(async () => {
    if (!tokenizerRef.current) return;
    const text = inputText.trim();

    if (!text) {
      // テキスト未入力ならプリセット
      startGame(PRESET_SENTENCES);
      return;
    }

    setGameState('preparing');
    setPrepareProgress(0);
    setPrepareTotal(0);
    setPrepareStatus('');
    setPrepareError('');

    try {
      const sentences = await generateSentences(
        text,
        tokenizerRef.current,
        (done, total) => {
          setPrepareProgress(done);
          setPrepareTotal(total);
        },
        (msg) => setPrepareStatus(msg),
      );
      startGame(sentences);
    } catch (err) {
      setPrepareError(err instanceof Error ? err.message : String(err));
      setGameState('idle');
    }
  }, [inputText, startGame]);

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
    if (gameState === 'idle' || gameState === 'finished') {
      containerRef.current?.focus();
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    if (gameState === 'finished') {
      if (e.key === 'Enter') startGame(activeSentences);
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
  }, [gameState, startTime, startGame, activeSentences]);

  const paraKanaOffsets = useMemo(() => {
    const offsets: KanaUnitIndex[] = [];
    let acc = 0;
    for (const s of activeSentences) {
      offsets.push(KanaUnitIndex(acc));
      acc += buildKanaUnits(s.kana).length;
    }
    return offsets;
  }, [activeSentences]);

  const kanaUnits = matcher?.kanaUnits ?? [];

  const activePara = gameState === 'playing'
    ? paraKanaOffsets.findLastIndex(offset => kanaPos >= offset)
    : -1;
  useEffect(() => {
    if (activePara >= 0) {
      paraRefs.current[activePara]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activePara]);

  const kps = elapsedTime > 0 ? (keystrokes / elapsedTime).toFixed(1) : '0.0';
  const accuracy = keystrokes > 0
    ? Math.round(((keystrokes - missCount) / keystrokes) * 100)
    : 100;

  const isCustom = activeSentences !== PRESET_SENTENCES;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none', padding: '2rem', fontFamily: 'monospace' }}
    >
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 1.2rem' }}>
        {gameState === 'playing' || gameState === 'finished'
          ? isCustom ? 'カスタムテキスト タイピング' : '日本国憲法前文 タイピング'
          : 'AZIKタイピング'}
      </h1>

      {/* idle: テキスト選択・入力フォーム */}
      {gameState === 'idle' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#888' }}>例文:</span>
            {EXAMPLE_TEXTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setInputText(ex.text)}
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.7rem', cursor: 'pointer' }}
              >
                {ex.label}
              </button>
            ))}
            {inputText && (
              <button
                onClick={() => setInputText('')}
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#999' }}
              >
                ✕ クリア
              </button>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`テキストを入力（空欄のままスタートすると日本国憲法前文）`}
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              padding: '0.6rem',
              border: '1px solid #ccc',
              resize: 'vertical',
              color: '#333',
            }}
          />

          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button
              onClick={handleStart}
              disabled={!tokenizerReady}
              style={{
                padding: '0.4rem 1.4rem',
                fontSize: '1rem',
                cursor: tokenizerReady ? 'pointer' : 'default',
              }}
            >
              スタート
            </button>
            {!tokenizerReady && (
              <span style={{ fontSize: '0.8rem', color: '#999' }}>辞書を読み込んでいます...</span>
            )}
            {prepareError && (
              <span style={{ fontSize: '0.85rem', color: 'red' }}>{prepareError}</span>
            )}
          </div>
        </div>
      )}

      {/* preparing: ルビ生成中 */}
      {gameState === 'preparing' && (
        <div style={{ padding: '2rem 0', color: '#666' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {prepareTotal === 0
              ? (prepareStatus || '処理中...')
              : `ルビを生成中... ${prepareProgress} / ${prepareTotal} 段落`}
          </div>
          {prepareTotal === 0 && prepareStatus && (
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              しばらくお待ちください
            </div>
          )}
          {prepareTotal > 0 && (
            <div style={{ width: '100%', maxWidth: '320px', height: '6px', background: '#eee', borderRadius: '3px' }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                background: '#4a9',
                width: `${Math.round((prepareProgress / prepareTotal) * 100)}%`,
                transition: 'width 0.2s ease',
              }} />
            </div>
          )}
        </div>
      )}

      {/* テキスト表示（playing / finished） */}
      {(gameState === 'playing' || gameState === 'finished') && (
        <div style={{
          marginBottom: '4rem',
          padding: '1.2rem 1.5rem',
          border: '1px solid #ddd',
          fontSize: '1.4rem',
        }}>
          {activeSentences.map((s, pi) => {
            const offset = paraKanaOffsets[pi];
            const nextOffset = pi + 1 < activeSentences.length ? paraKanaOffsets[pi + 1] : kanaUnits.length;
            const paraLen = nextOffset - offset;
            const isActive = gameState === 'playing' && kanaPos >= offset && kanaPos < offset + paraLen;
            const relKanaPos: KanaUnitIndex = gameState === 'playing' ? KanaUnitIndex(kanaPos - offset) : KanaUnitIndex(-1);
            return (
              <div key={pi} ref={el => { paraRefs.current[pi] = el; }} style={{
                lineHeight: 3.2,
                paddingBottom: gameState === 'playing' ? '2rem' : '1.5rem',
                borderBottom: pi < activeSentences.length - 1 ? '1px solid #eee' : 'none',
                marginBottom: pi < activeSentences.length - 1 ? '2rem' : 0,
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
      )}

      {/* playing: ステータスバー */}
      {gameState === 'playing' && (
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
          <span>{kanaPos} / {fullKana.length} 文字</span>
        </div>
      )}

      {/* finished: 結果 */}
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
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Enter キーでもう一度</p>
          <button
            onClick={() => setGameState('idle')}
            style={{ marginTop: '0.4rem', fontSize: '0.85rem', padding: '0.3rem 1rem', cursor: 'pointer' }}
          >
            別のテキストを選ぶ
          </button>
        </div>
      )}
    </div>
  );
}
