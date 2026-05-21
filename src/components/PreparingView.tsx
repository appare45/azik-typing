import { useState, useEffect } from 'react';
import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import type { Sentence } from '../sentences';
import { generateSentences } from '../llmInput';

export function PreparingView({
  text,
  tokenizer,
  onReady,
  onError,
}: {
  text: string;
  tokenizer: Tokenizer<IpadicFeatures>;
  onReady: (sentences: Sentence[]) => void;
  onError: (err: string) => void;
}) {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    generateSentences(
      text,
      tokenizer,
      (done, tot) => addLog(`段落 ${done} / ${tot} 完了`),
      addLog,
    ).then(onReady).catch(err => onError(err instanceof Error ? err.message : String(err)));
  }, [text, tokenizer, onReady, onError]);

  return (
    <div style={{ padding: '2rem 0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
      {logs.length === 0 && <div>処理中...</div>}
      {[...logs].reverse().map((line, i) => (
        <div key={i} style={{ color: i === 0 ? '#333' : '#aaa' }}>{line}</div>
      ))}
    </div>
  );
}
