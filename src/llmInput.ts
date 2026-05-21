import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import type { Sentence, RubySegment } from './sentences';
import { katakanaToHiragana, isKanaOnly, splitBySentenceEnd, JapaneseText, KanaString } from './kanaUtils';
import { buildSegmentsFromTokens } from './kuromoji';

export { buildTokenizer } from './kuromoji';

export const EXAMPLE_TEXTS = [
  {
    label: '桃太郎',
    text: 'むかし、むかし、あるところにおじいさんとおばあさんがいました。おじいさんは山へ柴刈りに、おばあさんは川へ洗濯に行きました。おばあさんが川で洗濯をしていると、川上から大きな桃がどんぶらこどんぶらこと流れてきました。',
  },
  {
    label: '日本国憲法',
    text: '日本国民は、正当に選挙された国会における代表者を通じて行動し、われらとわれらの子孫のために、諸国民との協和による成果と、わが国全土にわたつて自由のもたらす恵沢を確保し、政府の行為によつて再び戦争の惨禍が起ることのないやうにすることを決意し、ここに主権が国民に存することを宣言し、この憲法を確定する。そもそも国政は、国民の厳粛な信託によるものであつて、その権威は国民に由来し、その権力は国民の代表者がこれを行使し、その福利は国民がこれを享受する。これは人類普遍の原理であり、この憲法は、かかる原理に基くものである。われらは、これに反する一切の憲法、法令及び詔勅を排除する。日本国民は、恒久の平和を念願し、人間相互の関係を支配する崇高な理想を深く自覚するのであつて、平和を愛する諸国民の公正と信義に信頼して、われらの安全と生存を保持しようと決意した。われらは、平和を維持し、専制と隷従、圧迫と偏狭を地上から永遠に除去しようと努めてゐる国際社会において、名誉ある地位を占めたいと思ふ。われらは、全世界の国民が、ひとしく恐怖と欠乏から免かれ、平和のうちに生存する権利を有することを確認する。われらは、いづれの国家も、自国のことのみに専念して他国を無視してはならないのであつて、政治道徳の法則は、普遍的なものであり、この法則に従ふことは、自国の主権を維持し、他国と対等関係に立たうとする各国の責務であると信ずる。日本国民は、国家の名誉にかけ、全力をあげてこの崇高な理想と目的を達成することを誓ふ。'
  }
];

type LM = typeof LanguageModel;

async function createSession(lm: LM, systemPrompt: string): Promise<LanguageModel> {
  return lm.create({
    initialPrompts: [{ role: 'system', content: systemPrompt }],
  });
}

function reconcileSegments(llmSegments: string[], originalText: string): string[] {
  const result: string[] = [];
  let pos = 0;

  for (const seg of llmSegments) {
    if (pos >= originalText.length) break;
    if (originalText.startsWith(seg, pos)) {
      result.push(seg);
      pos += seg.length;
    } else {
      const lastChar = seg[seg.length - 1];
      const nextPos = originalText.indexOf(lastChar, pos);
      if (nextPos === -1) continue;
      const chunk = originalText.slice(pos, nextPos + 1);
      for (const s of splitBySentenceEnd(chunk)) {
        result.push(s);
      }
      pos = nextPos + 1;
    }
  }

  if (pos < originalText.length) {
    for (const s of splitBySentenceEnd(originalText.slice(pos))) {
      result.push(s);
    }
  }

  return result;
}

async function stepSplitParagraphs(lm: LM, text: string, onStatus?: (msg: string) => void): Promise<string[]> {
  const systemPrompt = `You are a Japanese text segmenter. Split the given Japanese text into meaningful paragraph-level chunks suitable for a typing game — each chunk should be one natural sentence or clause.

Output a JSON array of strings. Each string must be copied EXACTLY from the original text. No markdown, no explanation.`;
  const schema = { type: 'array', items: { type: 'string' } };

  onStatus?.('AIで段落を分割中...');
  const session = await createSession(lm, systemPrompt);
  let raw: string;
  try {
    raw = await session.prompt(`Split into paragraphs:\n${text}`, { responseConstraint: schema });
  } catch {
    raw = await session.prompt(`Split into paragraphs:\n${text}`);
  }
  session.destroy();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    onStatus?.('分割結果を解析できなかったため、句点で分割します');
    return splitBySentenceEnd(text);
  }
  if (!Array.isArray(parsed) || parsed.some(s => typeof s !== 'string')) {
    onStatus?.('分割結果が不正なため、句点で分割します');
    return splitBySentenceEnd(text);
  }
  const llmResult: string[] = parsed;

  const joined = llmResult.join('');
  if (joined === text) return llmResult;

  onStatus?.('分割結果を照合・修復中...');
  const reconciled = reconcileSegments(llmResult, text);
  if (reconciled.join('') === text) return reconciled;

  onStatus?.('修復できなかったため、句点で分割します');
  return splitBySentenceEnd(text);
}

async function fillMissingRubyWithLLM(lm: LM, segments: RubySegment[], paragraph: string, onStatus?: (msg: string) => void): Promise<RubySegment[]> {
  const targets = segments
    .map((s, i) => ({ i, s }))
    .filter(({ s }) => !isKanaOnly(s.ruby));

  if (targets.length === 0) return segments;

  onStatus?.(`ルビ補完: ${targets.map(({ s }) => s.text).join(' ')} ...`);

  const systemPrompt = `You are a Japanese furigana expert. You will be given a sentence and one word from it. Output only the correct hiragana reading of that word as it is used in the sentence. Output only hiragana, nothing else.`;

  const result = [...segments];
  await Promise.all(targets.map(async ({ i, s }) => {
    const session = await createSession(lm, systemPrompt);
    const prompt = `Sentence: ${paragraph}\nWord: ${s.text}\nHiragana reading:`;
    try {
      const reading = (await session.prompt(prompt)).trim();
      const converted = katakanaToHiragana(reading);
      result[i] = { text: s.text, ruby: converted };
      onStatus?.(`  ${s.text} → ${converted}`);
    } catch {
      onStatus?.(`  ${s.text} → (失敗)`);
    } finally {
      session.destroy();
    }
  }));

  const stillInvalid = result.filter(s => !isKanaOnly(s.ruby));
  if (stillInvalid.length > 0) {
    return result.map(s => isKanaOnly(s.ruby) ? s : { text: s.text, ruby: KanaString(s.text) });
  }

  return result;
}

async function processParagraph(tokenizer: Tokenizer<IpadicFeatures>, lm: LM | null, paragraph: string, onStatus?: (msg: string) => void): Promise<Sentence> {
  paragraph = paragraph.replace(/[\r\n\t\u3000\xa0]+/g, '');
  onStatus?.(`\u89e3\u6790: ${paragraph.slice(0, 20)}${paragraph.length > 20 ? '\u2026' : ''}`);
  const tokens = tokenizer.tokenize(paragraph);
  onStatus?.(`  \u30c8\u30fc\u30af\u30f3: ${tokens.map(t => t.surface_form).join(' / ')}`);
  const segments = buildSegmentsFromTokens(tokens, paragraph);

  let finalSegments = segments;
  if (lm !== null) {
    finalSegments = await fillMissingRubyWithLLM(lm, segments, paragraph, onStatus);
  }

  const kana = KanaString(finalSegments.map(s => s.ruby).join(''));
  onStatus?.(`  \u304b\u306a: ${kana}`);
  return { text: JapaneseText(paragraph), kana, segments: finalSegments };
}

export async function generateSentences(
  text: string,
  tokenizer: Tokenizer<IpadicFeatures>,
  onProgress?: (done: number, total: number) => void,
  onStatus?: (msg: string) => void,
): Promise<Sentence[]> {
  const g = globalThis as typeof globalThis & {
    LanguageModel?: LM;
    ai?: { languageModel?: LM };
    window?: { ai?: { languageModel?: LM } };
  };
  const lm = g.LanguageModel ?? g.ai?.languageModel ?? g.window?.ai?.languageModel;

  let lmAvailable: LM | null = null;
  if (lm) {
    try {
      const availability = await lm.availability();
      if (availability !== 'unavailable') lmAvailable = lm;
    } catch { /* kuromoji only */ }
  }

  const paras = lmAvailable
    ? await stepSplitParagraphs(lmAvailable, text, onStatus)
    : splitBySentenceEnd(text);

  onProgress?.(0, paras.length);

  let done = 0;
  const results = await Promise.all(paras.map(async para => {
    const sentence = await processParagraph(tokenizer, lmAvailable, para, onStatus);
    onProgress?.(++done, paras.length);
    return sentence;
  }));
  return results;
}
