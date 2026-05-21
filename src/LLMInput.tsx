import type { IpadicFeatures, Tokenizer } from 'kuromoji';
import type { Sentence, RubySegment } from './sentences';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KuromojiModule = any;

const EXAMPLE_TEXTS = [
  {
    label: '桃太郎',
    text: 'むかし、むかし、あるところにおじいさんとおばあさんがいました。おじいさんは山へ柴刈りに、おばあさんは川へ洗濯に行きました。おばあさんが川で洗濯をしていると、川上から大きな桃がどんぶらこどんぶらこと流れてきました。',
  },
  {
    label: '日本国憲法',
    text: '日本国民は、正当に選挙された国会における代表者を通じて行動し、われらとわれらの子孫のために、諸国民との協和による成果と、わが国全土にわたつて自由のもたらす恵沢を確保し、政府の行為によつて再び戦争の惨禍が起ることのないやうにすることを決意し、ここに主権が国民に存することを宣言し、この憲法を確定する。そもそも国政は、国民の厳粛な信託によるものであつて、その権威は国民に由来し、その権力は国民の代表者がこれを行使し、その福利は国民がこれを享受する。これは人類普遍の原理であり、この憲法は、かかる原理に基くものである。われらは、これに反する一切の憲法、法令及び詔勅を排除する。日本国民は、恒久の平和を念願し、人間相互の関係を支配する崇高な理想を深く自覚するのであつて、平和を愛する諸国民の公正と信義に信頼して、われらの安全と生存を保持しようと決意した。われらは、平和を維持し、専制と隷従、圧迫と偏狭を地上から永遠に除去しようと努めてゐる国際社会において、名誉ある地位を占めたいと思ふ。われらは、全世界の国民が、ひとしく恐怖と欠乏から免かれ、平和のうちに生存する権利を有することを確認する。われらは、いづれの国家も、自国のことのみに専念して他国を無視してはならないのであつて、政治道徳の法則は、普遍的なものであり、この法則に従ふことは、自国の主権を維持し、他国と対等関係に立たうとする各国の責務であると信ずる。日本国民は、国家の名誉にかけ、全力をあげてこの崇高な理想と目的を達成することを誓ふ。'
  }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LM = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSession(lm: LM, systemPrompt: string): Promise<any> {
  return lm.create({
    initialPrompts: [{ role: 'system', content: systemPrompt }],
  });
}

// カタカナをひらがなに変換
function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ン]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// ひらがな・句読点・記号のみで構成されているか検証
const KANA_ONLY = /^[ぁ-ん々ー、。「」『』・…！？\s]+$/;
function isKanaOnly(str: string): boolean {
  return KANA_ONLY.test(str);
}

// 句点・感嘆符・疑問符で機械的に段落分割するフォールバック
function splitBySentenceEnd(text: string): string[] {
  const result: string[] = [];
  const re = /[^。！？]*[。！？]/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(text)) !== null) {
    result.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result.filter(s => s.length > 0);
}

// LLM出力の各セグメントを元テキストに照合し、ずれたセグメントだけ機械的に再分割して修復する
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

// ステップ1: LLMで意味段落に分割し、不一致部分を自動修復
async function stepSplitParagraphs(lm: LM, text: string, onStatus?: (msg: string) => void): Promise<string[]> {
  const systemPrompt = `You are a Japanese text segmenter. Split the given Japanese text into meaningful paragraph-level chunks suitable for a typing game — each chunk should be one natural sentence or clause.

Output a JSON array of strings. Each string must be copied EXACTLY from the original text. No markdown, no explanation.`;
  const schema = { type: 'array', items: { type: 'string' } };

  console.log('[stepSplitParagraphs] input:', text);
  onStatus?.('AIで段落を分割中...');
  const session = await createSession(lm, systemPrompt);
  let raw: string;
  try {
    raw = await session.prompt(`Split into paragraphs:\n${text}`, { responseConstraint: schema });
  } catch {
    raw = await session.prompt(`Split into paragraphs:\n${text}`);
  }
  session.destroy();

  console.log('[stepSplitParagraphs] LLM raw output:', raw);

  let llmResult: unknown;
  try {
    llmResult = JSON.parse(raw.trim());
  } catch {
    console.warn('[stepSplitParagraphs] JSON parse failed, fallback to splitBySentenceEnd');
    onStatus?.('分割結果を解析できなかったため、句点で分割します');
    return splitBySentenceEnd(text);
  }
  if (!Array.isArray(llmResult) || llmResult.some(s => typeof s !== 'string')) {
    console.warn('[stepSplitParagraphs] result is not string[], fallback');
    onStatus?.('分割結果が不正なため、句点で分割します');
    return splitBySentenceEnd(text);
  }

  const joined = (llmResult as string[]).join('');
  if (joined === text) {
    console.log('[stepSplitParagraphs] exact match OK');
    return llmResult as string[];
  }

  console.warn('[stepSplitParagraphs] mismatch, trying reconcile. joined:', joined);
  onStatus?.('分割結果を照合・修復中...');
  const reconciled = reconcileSegments(llmResult as string[], text);
  if (reconciled.join('') === text) return reconciled;

  console.warn('[stepSplitParagraphs] reconcile failed, fallback to splitBySentenceEnd');
  onStatus?.('修復できなかったため、句点で分割します');
  return splitBySentenceEnd(text);
}

// kuromoji tokenizeを使って段落からRubySegmentを生成する
// readingが得られなかった漢字含みトークンはruby=textのままにしてLLM補完候補とする
function buildSegmentsFromTokens(tokens: IpadicFeatures[], paragraph: string): RubySegment[] {
  const segments: RubySegment[] = [];

  let pos = 0;
  for (const token of tokens) {
    const sf = token.surface_form;
    if (!paragraph.startsWith(sf, pos)) {
      const idx = paragraph.indexOf(sf, pos);
      if (idx > pos) {
        const missed = paragraph.slice(pos, idx);
        segments.push({ text: missed, ruby: missed });
        pos = idx;
      }
    }

    const reading = token.reading;
    // readingがない・'*'・表層形そのまま（未知語）かつひらがな以外を含む場合はLLM補完候補
    const noReading = !reading || reading === '*' || reading === sf;

    if (noReading && !isKanaOnly(sf)) {
      segments.push({ text: sf, ruby: sf });
      console.log(`[kuromoji] no-reading: "${sf}" (word_type=${token.word_type}, reading=${reading})`);
    } else {
      const ruby = katakanaToHiragana(reading ?? sf);
      segments.push({ text: sf, ruby });
      console.log(`[kuromoji] "${sf}" → "${ruby}"`);
    }

    pos += sf.length;
  }

  if (pos < paragraph.length) {
    const rest = paragraph.slice(pos);
    segments.push({ text: rest, ruby: rest });
  }

  return segments;
}

// LLMでrubyがひらがなでないセグメントを補完する（kuromoji未知語 + 変換失敗分）
async function fillMissingRubyWithLLM(lm: LM, segments: RubySegment[], paragraph: string): Promise<RubySegment[]> {
  const targets = segments
    .map((s, i) => ({ i, s }))
    .filter(({ s }) => !isKanaOnly(s.ruby));

  if (targets.length === 0) return segments;

  console.log('[fillMissingRuby] targets:', targets.map(({ s }) => `"${s.text}"(ruby="${s.ruby}")`));

  const session = await createSession(lm, `You are a Japanese furigana expert. You will be given a sentence and one word from it. Output only the correct hiragana reading of that word as it is used in the sentence. Output only hiragana, nothing else.`);

  const result = [...segments];
  for (const { i, s } of targets) {
    const prompt = `Sentence: ${paragraph}\nWord: ${s.text}\nHiragana reading:`;
    let reading: string;
    try {
      reading = (await session.prompt(prompt)).trim();
    } catch {
      console.warn(`[fillMissingRuby] failed for "${s.text}", keeping as-is`);
      continue;
    }
    const converted = katakanaToHiragana(reading);
    console.log(`[fillMissingRuby] "${s.text}" → "${converted}"`);
    result[i] = { text: s.text, ruby: converted };
  }
  session.destroy();

  // LLM後もひらがなでないものが残った場合は警告だけしてテキストをrubyに使う
  const stillInvalid = result.filter(s => !isKanaOnly(s.ruby));
  if (stillInvalid.length > 0) {
    console.warn('[fillMissingRuby] still invalid after LLM:', stillInvalid.map(s => `"${s.text}"→"${s.ruby}"`));
    return result.map(s => isKanaOnly(s.ruby) ? s : { text: s.text, ruby: s.text });
  }

  return result;
}

async function processParagraph(tokenizer: Tokenizer<IpadicFeatures>, lm: LM | null, paragraph: string): Promise<Sentence> {
  // 改行・全角スペース・制御文字を除去してからトークナイズ
  paragraph = paragraph.replace(/[\r\n\t　 ]+/g, '');
  console.log('[processParagraph] start:', paragraph);

  const tokens = tokenizer.tokenize(paragraph);
  console.log('[processParagraph] tokens:', tokens.map(t => `${t.surface_form}(${t.reading ?? '?'})`).join(' '));

  const segments = buildSegmentsFromTokens(tokens, paragraph);

  let finalSegments = segments;
  if (lm !== null) {
    finalSegments = await fillMissingRubyWithLLM(lm, segments, paragraph);
  } else {
    const missing = segments.filter(s => !isKanaOnly(s.ruby));
    if (missing.length > 0) {
      console.warn('[processParagraph] LLM unavailable, leaving unread:', missing.map(s => s.text));
    }
  }

  const kana = finalSegments.map(s => s.ruby).join('');
  console.log('[processParagraph] kana:', kana);
  return { text: paragraph, kana, segments: finalSegments };
}

// kuromoji tokenizerをPromiseで初期化（browserified版を動的スクリプトロード）
function buildTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, KuromojiModule>).kuromoji) {
      initTokenizer((window as unknown as Record<string, KuromojiModule>).kuromoji, resolve, reject);
      return;
    }
    const script = document.createElement('script');
    script.src = '/kuromoji.js';
    script.onload = () => {
      const k = (window as unknown as Record<string, KuromojiModule>).kuromoji;
      if (!k) { reject(new Error('kuromoji not found on window')); return; }
      initTokenizer(k, resolve, reject);
    };
    script.onerror = () => reject(new Error('Failed to load kuromoji.js'));
    document.head.appendChild(script);
  });
}

function initTokenizer(
  kuromoji: KuromojiModule,
  resolve: (t: Tokenizer<IpadicFeatures>) => void,
  reject: (e: Error) => void
) {
  kuromoji.builder({ dicPath: '/kuromoji-dict' }).build((err: Error | null, tokenizer: Tokenizer<IpadicFeatures>) => {
    if (err) reject(err);
    else resolve(tokenizer);
  });
}

// テキストからSentence[]を生成するロジック（UIなし）
// onProgress(done, total): 段落分割完了時はdone=0で呼ばれ、以降1段落完了ごとにdoneが増える
// onStatus: 処理ステータスの文字列（段落分割フェーズのみ）
export async function generateSentences(
  text: string,
  tokenizer: Tokenizer<IpadicFeatures>,
  onProgress?: (done: number, total: number) => void,
  onStatus?: (msg: string) => void,
): Promise<Sentence[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
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

  const results: Sentence[] = [];
  for (const para of paras) {
    const sentence = await processParagraph(tokenizer, lmAvailable, para);
    results.push(sentence);
    onProgress?.(results.length, paras.length);
  }
  return results;
}

export { buildTokenizer, EXAMPLE_TEXTS };
