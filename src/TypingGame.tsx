import { useState, useEffect, useCallback } from 'react';
import { SENTENCES } from './sentences';
import type { Sentence } from './sentences';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import { IdleView } from './components/IdleView';
import { PreparingView } from './components/PreparingView';
import { PlayingView } from './components/PlayingView';
import { ResultView } from './components/ResultView';

type GamePhase = 'idle' | 'preparing' | 'playing' | 'finished';

export type GameResult = {
  elapsedTime: number;
  keystrokes: number;
  missCount: number;
};

const PRESET_SENTENCES = SENTENCES;

export function TypingGame() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [sentences, setSentences] = useState<Sentence[] | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  const [prepareInput, setPrepareInput] = useState<{ text: string; tokenizer: Tokenizer<IpadicFeatures> } | null>(null);
  const [prepareError, setPrepareError] = useState('');

  const handleStart = useCallback((text: string, tokenizer: Tokenizer<IpadicFeatures>) => {
    if (!text) {
      setSentences(PRESET_SENTENCES);
      setResult(null);
      setPhase('playing');
      return;
    }
    setPrepareInput({ text, tokenizer });
    setPrepareError('');
    setPhase('preparing');
  }, []);

  const handleReady = useCallback((s: Sentence[]) => {
    setSentences(s);
    setResult(null);
    setPhase('playing');
  }, []);

  const handlePrepareError = useCallback((err: string) => {
    setPrepareError(err);
    setPhase('idle');
  }, []);

  const handleFinish = useCallback((r: GameResult) => {
    setResult(r);
    setPhase('finished');
  }, []);

  const handleRestart = useCallback(() => {
    setResult(null);
    setPhase('playing');
  }, []);

  const handleReturnToIdle = useCallback(() => {
    setResult(null);
    setSentences(null);
    setPhase('idle');
  }, []);

  useEffect(() => {
    if (phase === 'finished') {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter') handleRestart();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [phase, handleRestart]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        AZIKタイピング
        <a
          href="https://github.com/appare45/azik-typing"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#555' }}
        >
          GitHub
        </a>
      </h1>

      {phase === 'idle' && (
        <IdleView onStart={handleStart} prepareError={prepareError} />
      )}

      {phase === 'preparing' && prepareInput && (
        <PreparingView
          text={prepareInput.text}
          tokenizer={prepareInput.tokenizer}
          onReady={handleReady}
          onError={handlePrepareError}
        />
      )}

      {phase === 'playing' && sentences && (
        <PlayingView key={sentences === PRESET_SENTENCES ? 'preset' : sentences[0]?.text} sentences={sentences} onFinish={handleFinish} />
      )}

      {phase === 'finished' && sentences && result && (
        <ResultView result={result} onRestart={handleReturnToIdle} />
      )}
    </div>
  );
}
