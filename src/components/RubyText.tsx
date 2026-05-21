import { KanaUnitIndex } from '../azikEngine';
import { buildKanaUnits } from '../kanaUtils';
import type { RubySegment } from '../sentences';
import { buildSegmentKanaOffsets, getSegmentState } from './rubyTextUtils';

export function RubyText({
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

        const rubyColor = state === 'done' ? '#aaa' : state === 'active' ? (wrongKey ? 'red' : '#e07000') : '#ccc';
        const textColor = state === 'done' ? '#aaa' : state === 'active' ? (wrongKey ? 'red' : '#000') : '#ccc';

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
