import { useState, useEffect, useRef } from 'react';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import { buildTokenizer, EXAMPLE_TEXTS } from '../llmInput';

export function IdleView({
  onStart,
  prepareError,
}: {
  onStart: (text: string, tokenizer: Tokenizer<IpadicFeatures>) => void;
  prepareError: string;
}) {
  const [inputText, setInputText] = useState('');
  const tokenizerRef = useRef<Tokenizer<IpadicFeatures> | null>(null);
  const [tokenizerReady, setTokenizerReady] = useState(false);

  useEffect(() => {
    buildTokenizer()
      .then(t => { tokenizerRef.current = t; setTokenizerReady(true); })
      .catch(err => console.error('[kuromoji] failed to load:', err));
  }, []);

  return (
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
          onClick={() => tokenizerRef.current && onStart(inputText.trim(), tokenizerRef.current)}
          disabled={!tokenizerReady}
          style={{ padding: '0.4rem 1.4rem', fontSize: '1rem', cursor: tokenizerReady ? 'pointer' : 'default' }}
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
  );
}
