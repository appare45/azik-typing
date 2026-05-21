import type { GameResult } from '../TypingGame';

export function ResultView({
  result,
  onRestart,
}: {
  result: GameResult;
  onRestart: () => void;
}) {
  const { elapsedTime, keystrokes, missCount } = result;
  const kps = elapsedTime > 0 ? (keystrokes / elapsedTime).toFixed(1) : '0.0';
  const accuracy = keystrokes > 0 ? Math.round(((keystrokes - missCount) / keystrokes) * 100) : 100;

  return (
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
        onClick={onRestart}
        style={{ marginTop: '0.4rem', fontSize: '0.85rem', padding: '0.3rem 1rem', cursor: 'pointer' }}
      >
        別のテキストを選ぶ
      </button>
    </div>
  );
}
