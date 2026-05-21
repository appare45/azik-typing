// AZIKテーブル — AzooKeyKanaKanjiConverter の defaultAzik.swift を基に作成
// https://github.com/azooKey/AzooKeyKanaKanjiConverter/blob/main/Sources/KanaKanjiConverterModule/InputManagement/InputTables/defaultAzik.swift
// Copyright (c) 2023 Miwa / Ensan, MIT License (see LICENSES)

export { buildKanaUnits } from './kanaUtils';
import { buildKanaUnits, KanaString } from './kanaUtils';

export type RomajiPattern = {
  romaji: string[];
  kana: string;
};

// ローマ字→かな のマップ（AzooKey公式AZIKテーブルをそのまま使用）
const ROMAJI_TO_KANA: Record<string, string> = {
  "a": "あ",
  "i": "い",
  "u": "う",
  "e": "え",
  "o": "お",
  "ka": "か",
  "ki": "き",
  "ku": "く",
  "ke": "け",
  "ko": "こ",
  "sa": "さ",
  "si": "し",
  "shi": "し",
  "su": "す",
  "se": "せ",
  "so": "そ",
  "ta": "た",
  "ti": "ち",
  "chi": "ち",
  "tu": "つ",
  "tsu": "つ",
  "te": "て",
  "to": "と",
  "na": "な",
  "ni": "に",
  "nu": "ぬ",
  "ne": "ね",
  "no": "の",
  "ha": "は",
  "hi": "ひ",
  "hu": "ふ",
  "he": "へ",
  "ho": "ほ",
  "ma": "ま",
  "mi": "み",
  "mu": "む",
  "me": "め",
  "mo": "も",
  "ya": "や",
  "yu": "ゆ",
  "yo": "よ",
  "ra": "ら",
  "ri": "り",
  "ru": "る",
  "re": "れ",
  "ro": "ろ",
  "wa": "わ",
  "wi": "うぃ",
  "we": "うぇ",
  "wo": "を",
  "ga": "が",
  "gi": "ぎ",
  "gu": "ぐ",
  "ge": "げ",
  "go": "ご",
  "za": "ざ",
  "zi": "じ",
  "ji": "じ",
  "zu": "ず",
  "ze": "ぜ",
  "zo": "ぞ",
  "da": "だ",
  "di": "ぢ",
  "du": "づ",
  "de": "で",
  "do": "ど",
  "ba": "ば",
  "bi": "び",
  "bu": "ぶ",
  "be": "べ",
  "bo": "ぼ",
  "pa": "ぱ",
  "pi": "ぴ",
  "pu": "ぷ",
  "pe": "ぺ",
  "po": "ぽ",
  "kya": "きゃ",
  "kyu": "きゅ",
  "kye": "きぇ",
  "kyo": "きょ",
  "kga": "きゃ",
  "kgu": "きゅ",
  "kge": "きぇ",
  "kgo": "きょ",
  "sya": "しゃ",
  "syu": "しゅ",
  "sye": "しぇ",
  "syo": "しょ",
  "xa": "しゃ",
  "xu": "しゅ",
  "xe": "しぇ",
  "xo": "しょ",
  "tya": "ちゃ",
  "tyu": "ちゅ",
  "tye": "ちぇ",
  "tyo": "ちょ",
  "ca": "ちゃ",
  "cu": "ちゅ",
  "ce": "ちぇ",
  "co": "ちょ",
  "nya": "にゃ",
  "nyu": "にゅ",
  "nye": "にぇ",
  "nyo": "にょ",
  "nga": "にゃ",
  "ngu": "にゅ",
  "nge": "にぇ",
  "ngo": "にょ",
  "hya": "ひゃ",
  "hyu": "ひゅ",
  "hye": "ひぇ",
  "hyo": "ひょ",
  "hga": "ひゃ",
  "hgu": "ひゅ",
  "hge": "ひぇ",
  "hgo": "ひょ",
  "mya": "みゃ",
  "myu": "みゅ",
  "mye": "みぇ",
  "myo": "みょ",
  "mga": "みゃ",
  "mgu": "みゅ",
  "mge": "みぇ",
  "mgo": "みょ",
  "rya": "りゃ",
  "ryu": "りゅ",
  "rye": "りぇ",
  "ryo": "りょ",
  "gya": "ぎゃ",
  "gyu": "ぎゅ",
  "gye": "ぎぇ",
  "gyo": "ぎょ",
  "zya": "じゃ",
  "zyu": "じゅ",
  "zye": "じぇ",
  "zyo": "じょ",
  "ja": "じゃ",
  "ju": "じゅ",
  "je": "じぇ",
  "jo": "じょ",
  "bya": "びゃ",
  "byu": "びゅ",
  "bye": "びぇ",
  "byo": "びょ",
  "pya": "ぴゃ",
  "pyu": "ぴゅ",
  "pye": "ぴぇ",
  "pyo": "ぴょ",
  "pga": "ぴゃ",
  "pgu": "ぴゅ",
  "pge": "ぴぇ",
  "pgo": "ぴょ",
  "fa": "ふぁ",
  "fi": "ふぃ",
  "fu": "ふ",
  "fe": "ふぇ",
  "fo": "ふぉ",
  "va": "ヴぁ",
  "vi": "ヴぃ",
  "vu": "ヴ",
  "ve": "ヴぇ",
  "vo": "ヴぉ",
  "tgi": "てぃ",
  "tgu": "とぅ",
  "dci": "でぃ",
  "dcu": "どぅ",
  "wso": "うぉ",
  "la": "ぁ",
  "li": "ぃ",
  "lu": "ぅ",
  "le": "ぇ",
  "lo": "ぉ",
  "lya": "ゃ",
  "lyu": "ゅ",
  "lyo": "ょ",
  ";": "っ",
  "q": "ん",
  "nn": "ん",
  ":": "ー",
  "、": "、",
  ",": "、",
  "。": "。",
  ".": "。",
  "z。": "…",
  "z、": "‥",
  "zー": "〜",
  "z「": "『",
  "z」": "』",
  // -ん 拡張 (子音+z/n=あ段+ん, 子音+k=い段+ん, 子音+j=う段+ん, 子音+d=え段+ん, 子音+l=お段+ん)
  "kz": "かん",
  "kn": "かん",
  "kk": "きん",
  "kj": "くん",
  "kd": "けん",
  "kl": "こん",
  "sz": "さん",
  "sn": "さん",
  "sk": "しん",
  "sj": "すん",
  "sd": "せん",
  "sl": "そん",
  "tz": "たん",
  "tn": "たん",
  "tk": "ちん",
  "tj": "つん",
  "td": "てん",
  "tl": "とん",
  "nz": "なん",
  "nk": "にん",
  "nj": "ぬん",
  "nd": "ねん",
  "nl": "のん",
  "hz": "はん",
  "hn": "はん",
  "hk": "ひん",
  "hj": "ふん",
  "hd": "へん",
  "hl": "ほん",
  "mz": "まん",
  "mk": "みん",
  "mj": "むん",
  "md": "めん",
  "ml": "もん",
  "yz": "やん",
  "yn": "やん",
  "yj": "ゆん",
  "yl": "よん",
  "rz": "らん",
  "rn": "らん",
  "rk": "りん",
  "rj": "るん",
  "rd": "れん",
  "rl": "ろん",
  "wz": "わん",
  "wn": "わん",
  "wk": "うぃん",
  "wd": "うぇん",
  "wl": "うぉん",
  "gz": "がん",
  "gn": "がん",
  "gk": "ぎん",
  "gj": "ぐん",
  "gd": "げん",
  "gl": "ごん",
  "zz": "ざん",
  "zn": "ざん",
  "zk": "じん",
  "zj": "ずん",
  "zd": "ぜん",
  "zl": "ぞん",
  "dz": "だん",
  "dn": "だん",
  "dk": "ぢん",
  "dj": "づん",
  "dd": "でん",
  "dl": "どん",
  "bz": "ばん",
  "bn": "ばん",
  "bk": "びん",
  "bj": "ぶん",
  "bd": "べん",
  "bl": "ぼん",
  "pz": "ぱん",
  "pn": "ぱん",
  "pk": "ぴん",
  "pj": "ぷん",
  "pd": "ぺん",
  "pl": "ぽん",
  "kyz": "きゃん",
  "kyn": "きゃん",
  "kyj": "きゅん",
  "kyd": "きぇん",
  "kyl": "きょん",
  "kgz": "きゃん",
  "kgn": "きゃん",
  "kgj": "きゅん",
  "kgd": "きぇん",
  "kgl": "きょん",
  "syz": "しゃん",
  "syn": "しゃん",
  "syj": "しゅん",
  "syd": "しぇん",
  "syl": "しょん",
  "xz": "しゃん",
  "xn": "しゃん",
  "xj": "しゅん",
  "xd": "しぇん",
  "xl": "しょん",
  "tyz": "ちゃん",
  "tyn": "ちゃん",
  "tyj": "ちゅん",
  "tyd": "ちぇん",
  "tyl": "ちょん",
  "cz": "ちゃん",
  "cn": "ちゃん",
  "cj": "ちゅん",
  "cd": "ちぇん",
  "cl": "ちょん",
  "nyz": "にゃん",
  "nyn": "にゃん",
  "nyj": "にゅん",
  "nyd": "にぇん",
  "nyl": "にょん",
  "ngz": "にゃん",
  "ngn": "にゃん",
  "ngj": "にゅん",
  "ngd": "にぇん",
  "ngl": "にょん",
  "hyz": "ひゃん",
  "hyn": "ひゃん",
  "hyj": "ひゅん",
  "hyd": "ひぇん",
  "hyl": "ひょん",
  "hgz": "ひゃん",
  "hgn": "ひゃん",
  "hgj": "ひゅん",
  "hgd": "ひぇん",
  "hgl": "ひょん",
  "myz": "みゃん",
  "myn": "みゃん",
  "myj": "みゅん",
  "myd": "みぇん",
  "myl": "みょん",
  "mgz": "みゃん",
  "mgn": "みゃん",
  "mgj": "みゅん",
  "mgd": "みぇん",
  "mgl": "みょん",
  "ryz": "りゃん",
  "ryn": "りゃん",
  "ryj": "りゅん",
  "ryd": "りぇん",
  "ryl": "りょん",
  "gyz": "ぎゃん",
  "gyn": "ぎゃん",
  "gyj": "ぎゅん",
  "gyd": "ぎぇん",
  "gyl": "ぎょん",
  "zyz": "じゃん",
  "zyn": "じゃん",
  "zyj": "じゅん",
  "zyd": "じぇん",
  "zyl": "じょん",
  "jz": "じゃん",
  "jn": "じゃん",
  "jj": "じゅん",
  "jd": "じぇん",
  "jl": "じょん",
  "byz": "びゃん",
  "byn": "びゃん",
  "byj": "びゅん",
  "byd": "びぇん",
  "byl": "びょん",
  "pyz": "ぴゃん",
  "pyn": "ぴゃん",
  "pyj": "ぴゅん",
  "pyd": "ぴぇん",
  "pyl": "ぴょん",
  "pgz": "ぴゃん",
  "pgn": "ぴゃん",
  "pgj": "ぴゅん",
  "pgd": "ぴぇん",
  "pgl": "ぴょん",
  "fz": "ふぁん",
  "fn": "ふぁん",
  "fk": "ふぃん",
  "fj": "ふん",
  "fd": "ふぇん",
  "fl": "ふぉん",
  "vz": "ゔぁん",
  "vn": "ゔぁん",
  "vk": "ゔぃん",
  "vj": "ゔん",
  "vd": "ゔぇん",
  "vl": "ゔぉん",
  "tgk": "てぃん",
  "tgj": "とぅん",
  "dck": "でぃん",
  "dcj": "どぅん",
  "lz": "ぁん",
  "ln": "ぁん",
  "lk": "ぃん",
  "ld": "ぇん",
  "ll": "ぉん",
  "lyz": "ゃん",
  "lyn": "ゃん",
  "lyj": "ゅん",
  "lyl": "ょん",
  // -ai/-uu/-ei/-ou 拡張 (子音+q=あ段+い, 子音+h=う段+う, 子音+w=え段+い, 子音+p=お段+う)
  "kq": "かい",
  "kh": "くう",
  "kw": "けい",
  "kp": "こう",
  "sq": "さい",
  "sh": "すう",
  "sw": "せい",
  "sp": "そう",
  "tq": "たい",
  "th": "つう",
  "tw": "てい",
  "tp": "とう",
  "nq": "ない",
  "nh": "ぬう",
  "nw": "ねい",
  "np": "のう",
  "hq": "はい",
  "hh": "ふう",
  "hw": "へい",
  "hp": "ほう",
  "mq": "まい",
  "mh": "むう",
  "mw": "めい",
  "mp": "もう",
  "yq": "やい",
  "yh": "ゆう",
  "yp": "よう",
  "rq": "らい",
  "rh": "るう",
  "rw": "れい",
  "rp": "ろう",
  "gq": "がい",
  "gh": "ぐう",
  "gw": "げい",
  "gp": "ごう",
  "zq": "ざい",
  "zh": "ずう",
  "zw": "ぜい",
  "zp": "ぞう",
  "dq": "だい",
  "dh": "づう",
  "dw": "でい",
  "dp": "どう",
  "bq": "ばい",
  "bh": "ぶう",
  "bw": "べい",
  "bp": "ぼう",
  "pq": "ぱい",
  "ph": "ぷう",
  "pw": "ぺい",
  "pp": "ぽう",
  "kyq": "きゃい",
  "kyh": "きゅう",
  "kyw": "きぇい",
  "kyp": "きょう",
  "kgq": "きゃい",
  "kgh": "きゅう",
  "kgw": "きぇい",
  "kgp": "きょう",
  "syq": "しゃい",
  "syh": "しゅう",
  "syw": "しぇい",
  "syp": "しょう",
  "xq": "しゃい",
  "xh": "しゅう",
  "xw": "しぇい",
  "xp": "しょう",
  "tyq": "ちゃい",
  "tyh": "ちゅう",
  "tyw": "ちぇい",
  "typ": "ちょう",
  "cq": "ちゃい",
  "ch": "ちゅう",
  "cw": "ちぇい",
  "cp": "ちょう",
  "nyq": "にゃい",
  "nyh": "にゅう",
  "nyw": "にぇい",
  "nyp": "にょう",
  "ngq": "にゃい",
  "ngh": "にゅう",
  "ngw": "にぇい",
  "ngp": "にょう",
  "hyq": "ひゃい",
  "hyh": "ひゅう",
  "hyw": "ひぇい",
  "hyp": "ひょう",
  "hgq": "ひゃい",
  "hgh": "ひゅう",
  "hgw": "ひぇい",
  "hgp": "ひょう",
  "myq": "みゃい",
  "myh": "みゅう",
  "myw": "みぇい",
  "myp": "みょう",
  "mgq": "みゃい",
  "mgh": "みゅう",
  "mgw": "みぇい",
  "mgp": "みょう",
  "ryq": "りゃい",
  "ryh": "りゅう",
  "ryw": "りぇい",
  "ryp": "りょう",
  "gyq": "ぎゃい",
  "gyh": "ぎゅう",
  "gyw": "ぎぇい",
  "gyp": "ぎょう",
  "zyq": "じゃい",
  "zyh": "じゅう",
  "zyw": "じぇい",
  "zyp": "じょう",
  "jq": "じゃい",
  "jh": "じゅう",
  "jw": "じぇい",
  "jp": "じょう",
  "byq": "びゃい",
  "byh": "びゅう",
  "byw": "びぇい",
  "byp": "びょう",
  "pyq": "ぴゃい",
  "pyh": "ぴゅう",
  "pyw": "ぴぇい",
  "pyp": "ぴょう",
  "pgq": "ぴゃい",
  "pgh": "ぴゅう",
  "pgw": "ぴぇい",
  "pgp": "ぴょう",
  "fq": "ふぁい",
  "fh": "ふう",
  "fw": "ふぇい",
  "fp": "ふぉー",
  "vq": "ゔぁい",
  "vh": "ゔー",
  "vw": "ゔぇい",
  "vp": "ゔぉー",
  "tgh": "とぅー",
  "dch": "どぅー",
  "wq": "わい",
  "ww": "うぇい",
  "wp": "うぉー",
  "lq": "ぁい",
  "lh": "ぅう",
  "lw": "ぇい",
  "lp": "ぉう",
  "lyq": "ゃい",
  "lyh": "ゅう",
  "lyp": "ょう",
  // 単独キー拡張
  "kf": "き",
  "jf": "じゅ",
  "hf": "ふ",
  "yf": "ゆ",
  "mf": "む",
  "nf": "ぬ",
  "df": "で",
  "cf": "ちぇ",
  "pf": "ぽん",
  "wf": "わい",
  "sf": "さい",
  "ss": "せい",
  "zc": "ざ",
  "zv": "ざい",
  "zf": "ぜ",
  "zx": "ぜい",
  // 複合語ショートカット
  "kt": "こと",
  "wt": "わた",
  "km": "かも",
  "sr": "する",
  "rr": "られ",
  "nb": "ねば",
  "nt": "にち",
  "st": "した",
  "mn": "もの",
  "tm": "ため",
  "tr": "たら",
  "zr": "ざる",
  "bt": "びと",
  "dt": "だち",
  "tt": "たち",
  "ms": "ます",
  "dm": "でも",
  "nr": "なる",
  "mt": "また",
  "gr": "がら",
  "wr": "われ",
  "ht": "ひと",
  "ds": "です",
  "kr": "から",
  "yr": "よる",
  "tb": "たび",
  "gt": "ごと",
};

// かな→ローマ字の逆引きマップを構築
function buildKanaToRomaji(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [romaji, kana] of Object.entries(ROMAJI_TO_KANA)) {
    const existing = map.get(kana) ?? [];
    existing.push(romaji);
    map.set(kana, existing);
  }
  return map;
}

// かな文字列を複数ユニットに分解して各ユニットのローマ字候補を返す
// maxFirstLen: 先頭ユニットの最大かな文字数（複合かな自身より短く分解させるため）
// 例: splitKanaToUnits("きょう", map, 2) → [["kyo",...], ["u",...]]
function splitKanaToUnits(kana: string, map: Map<string, string[]>, maxFirstLen = 3): string[][] | null {
  if (kana.length === 0) return [];
  for (let len = Math.min(maxFirstLen, kana.length); len >= 1; len--) {
    const substr = kana.slice(0, len);
    const romajis = map.get(substr);
    if (romajis) {
      // 複合語由来のローマ字（そのローマ字自体が別のかなにマップされる場合）を除外
      const singleRomajis = romajis.filter(r => ROMAJI_TO_KANA[r] === substr);
      if (singleRomajis.length === 0) continue;
      const rest = splitKanaToUnits(kana.slice(len), map);
      if (rest !== null) {
        return [singleRomajis, ...rest];
      }
    }
  }
  return null;
}

const KANA_TO_ROMAJI = buildKanaToRomaji();
// 歴史的仮名遣い：旧字体かなのローマ字入力
KANA_TO_ROMAJI.set('ゐ', ['wi']);
KANA_TO_ROMAJI.set('ゑ', ['we']);

// ローマ字プレフィックス集合（入力中の有効なプレフィックスを判定するため）
const ROMAJI_PREFIXES = new Set<string>();
for (const romaji of Object.keys(ROMAJI_TO_KANA)) {
  for (let i = 1; i <= romaji.length; i++) {
    ROMAJI_PREFIXES.add(romaji.slice(0, i));
  }
}

// ひらがなテキストをローマ字入力パターン列に変換
// テキストは既にかな変換済みであることを前提とする
export function kanaToRomajiPatterns(kana: string): RomajiPattern[] {
  const patterns: RomajiPattern[] = [];
  let i = 0;

  while (i < kana.length) {
    // 促音「っ」の処理：次の文字の子音を重ねるか、；で入力
    if (kana[i] === 'っ') {
      const next = kana[i + 1];
      const options: string[] = [';'];
      if (next) {
        const nextRomajis = KANA_TO_ROMAJI.get(next) ?? [];
        for (const r of nextRomajis) {
          const firstChar = r[0];
          if (!'aiueo;:'.includes(firstChar)) {
            options.push(firstChar + r);
          }
        }
      }
      patterns.push({ romaji: [...new Set(options)], kana: 'っ' });
      i++;
      continue;
    }

    // まず長いかな（複合語など）から順にマッチを試みる
    let matched = false;
    // 最大4文字まで試みる（AZIKの複合語は最大2文字のかな）
    for (let len = Math.min(4, kana.length - i); len >= 1; len--) {
      const substr = kana.slice(i, i + len);
      const romajis = KANA_TO_ROMAJI.get(substr);
      if (romajis && romajis.length > 0) {
        let allRomajis = [...romajis];
        // 複合かな（2かな以上）の場合、個別に打つ候補も追加
        const substrKanaLen = [...substr].length;
        if (substrKanaLen > 1) {
          // maxFirstLen を substrKanaLen-1 にして、複合かな自身へのマッチを防ぐ
          const units = splitKanaToUnits(substr, KANA_TO_ROMAJI, substrKanaLen - 1);
          if (units && units.length > 1) {
            // 各ユニットの候補を直積で連結
            let combos = [''];
            for (const opts of units) {
              const next: string[] = [];
              for (const prefix of combos) {
                for (const opt of opts) next.push(prefix + opt);
              }
              combos = next;
              if (combos.length > 32) { combos = combos.slice(0, 32); break; }
            }
            allRomajis = [...new Set([...allRomajis, ...combos])];
          }
        }
        patterns.push({ romaji: allRomajis, kana: substr });
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // マッピングのない文字はそのまま（記号など）
      patterns.push({ romaji: [kana[i]], kana: kana[i] });
      i++;
    }
  }

  return patterns;
}

// 入力済みのローマ字が有効なプレフィックスかチェック
export function isValidPrefix(input: string, patterns: string[]): boolean {
  return patterns.some(p => p.startsWith(input));
}

// 入力済みのローマ字がパターンに完全一致するかチェック
export function isComplete(input: string, patterns: string[]): boolean {
  return patterns.includes(input);
}

// -----------------------------------------------------------------------
// NFA方式のリアルタイム入力マッチャー
// かな列全体に対して、任意のローマ字入力経路を並列追跡する
// -----------------------------------------------------------------------

// kanaUnits配列上のインデックス（Unicode文字数と混同しないためのbranded type）
export type KanaUnitIndex = number & { readonly __brand: 'KanaUnitIndex' };
export const KanaUnitIndex = (n: number): KanaUnitIndex => n as KanaUnitIndex;

type NFAState = {
  kanaPos: KanaUnitIndex;
  buf: string;
};

export type MatchResult = {
  valid: boolean;
  kanaPos: KanaUnitIndex;
  buf: string;
  finished: boolean;
  recentRomaji: string;
};

export class InputMatcher {
  private kana: string[];
  private states: NFAState[];
  private recentRomaji: string = '';

  constructor(kanaStr: KanaString) {
    // かな文字列をUnicode文字単位に分解（拗音は1文字扱い）
    // ただし複合かな単位（例: きょ）はそのまま2文字として扱う
    this.kana = buildKanaUnits(kanaStr);
    this.states = [{ kanaPos: KanaUnitIndex(0), buf: '' }];
  }

  get kanaUnits(): string[] { return this.kana; }

  private bestState(): NFAState {
    return this.states.reduce((a, b) => a.kanaPos >= b.kanaPos ? a : b);
  }

  get completedKanaCount(): KanaUnitIndex { return this.bestState().kanaPos; }
  get currentBuf(): string { return this.bestState().buf; }
  get isFinished(): boolean { return this.bestState().kanaPos >= this.kana.length; }

  input(key: string): MatchResult {
    const nextStates: NFAState[] = [];
    let confirmedRomaji: string | null = null;

    for (const state of this.states) {
      if (state.kanaPos >= this.kana.length) {
        nextStates.push(state);
        continue;
      }

      const newBuf = state.buf + key;

      const consumed = this.tryConsume(newBuf, state.kanaPos);
      for (const nextPos of consumed) {
        nextStates.push({ kanaPos: nextPos, buf: '' });
        if (confirmedRomaji === null || nextPos > (nextStates[0]?.kanaPos ?? 0)) {
          confirmedRomaji = newBuf;
        }
      }

      if (ROMAJI_PREFIXES.has(newBuf)) {
        if (this.canExtend(newBuf, state.kanaPos)) {
          nextStates.push({ kanaPos: state.kanaPos, buf: newBuf });
        }
      }
    }

    if (nextStates.length === 0) {
      const best = this.bestState();
      return { valid: false, kanaPos: best.kanaPos, buf: best.buf, finished: this.isFinished, recentRomaji: this.recentRomaji };
    }

    const maxKanaPos = nextStates.reduce((m, s) => Math.max(m, s.kanaPos), 0);
    const seen = new Set<string>();
    this.states = nextStates.filter(s => {
      if (s.kanaPos < maxKanaPos) return false;
      const k = `${s.kanaPos}:${s.buf}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (confirmedRomaji !== null) {
      this.recentRomaji = confirmedRomaji;
    }

    const best = this.bestState();
    return { valid: true, kanaPos: best.kanaPos, buf: best.buf, finished: this.isFinished, recentRomaji: this.recentRomaji };
  }

  backspace(): MatchResult | null {
    const best = this.bestState();
    if (best.buf.length === 0) return null;
    const newBuf = best.buf.slice(0, -1);
    this.states = [{ kanaPos: best.kanaPos, buf: newBuf }];
    return { valid: true, kanaPos: best.kanaPos, buf: newBuf, finished: false, recentRomaji: this.recentRomaji };
  }

  private tryConsume(buf: string, kanaPos: KanaUnitIndex): KanaUnitIndex[] {
    const results: KanaUnitIndex[] = [];

    // ROMAJI_TO_KANA経由のマッチ（通常ルート）
    const mapped = ROMAJI_TO_KANA[buf];
    if (mapped) {
      const mappedUnits = buildKanaUnits(KanaString(mapped));
      let pos = kanaPos;
      let ok = true;
      for (const unit of mappedUnits) {
        if (pos >= this.kana.length || this.kana[pos] !== unit) { ok = false; break; }
        pos++;
      }
      if (ok) results.push(KanaUnitIndex(pos));
    }

    // KANA_TO_ROMAJI経由のマッチ（ゐ/ゑ等、ROMAJI_TO_KANAが現在位置のかなと一致しない場合）
    if (kanaPos < this.kana.length) {
      const unit = this.kana[kanaPos];
      const romajis = KANA_TO_ROMAJI.get(unit);
      if (romajis?.includes(buf) && mapped !== unit) {
        results.push(KanaUnitIndex(kanaPos + 1));
      }
    }

    return results;
  }

  private canExtend(buf: string, kanaPos: KanaUnitIndex): boolean {
    for (const [romaji, mapped] of Object.entries(ROMAJI_TO_KANA)) {
      if (!romaji.startsWith(buf)) continue;
      const mappedUnits = buildKanaUnits(KanaString(mapped));
      let pos = kanaPos;
      let ok = true;
      for (const unit of mappedUnits) {
        if (pos >= this.kana.length || this.kana[pos] !== unit) { ok = false; break; }
        pos++;
      }
      if (ok) return true;
    }

    // KANA_TO_ROMAJI経由（ゐ/ゑ等）: 現在位置のかなのローマ字候補のいずれかがbufで始まるか
    if (kanaPos < this.kana.length) {
      const unit = this.kana[kanaPos];
      const romajis = KANA_TO_ROMAJI.get(unit);
      if (romajis?.some(r => r.startsWith(buf))) return true;
    }

    return false;
  }
}
