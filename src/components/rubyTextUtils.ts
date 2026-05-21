import { KanaUnitIndex } from '../azikEngine';
import { buildKanaUnits } from '../kanaUtils';
import type { RubySegment } from '../sentences';

export function buildSegmentKanaOffsets(segments: RubySegment[]): KanaUnitIndex[] {
  const offsets: KanaUnitIndex[] = [];
  let pos = 0;
  for (const seg of segments) {
    offsets.push(KanaUnitIndex(pos));
    pos += buildKanaUnits(seg.ruby).length;
  }
  return offsets;
}

export type SegmentState = 'done' | 'active' | 'pending';

export function getSegmentState(segStart: KanaUnitIndex, segLen: number, kanaPos: KanaUnitIndex): SegmentState {
  if (kanaPos >= segStart + segLen) return 'done';
  if (kanaPos >= segStart) return 'active';
  return 'pending';
}
