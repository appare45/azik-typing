# azik-typing

AZIK入力方式のタイピング練習ゲームです。日本国憲法前文をプリセットとして収録しており、任意の日本語テキストを入力して練習することもできます。

## 特徴

- **AZIK入力対応** — 標準ローマ字に加え、`sz`→「さん」、`kz`→「かん」のような子音+拡張キーによる高速入力に対応
- **任意テキスト対応** — 好きな日本語テキストを貼り付けると、kuromoji.js で形態素解析してルビを自動生成
- **LLM補完** — Chrome の Prompt API（Gemini Nano）が利用可能な環境では、kuromoji が読めない語をAIで補完し、意味のある段落単位に分割
- **リアルタイムフィードバック** — 入力バッファ・直前のローマ字・KPS・正確率をリアルタイム表示

## 動作環境

Node.js 18以上、モダンブラウザ（Chrome推奨）。

LLM補完機能は [Chrome Prompt API](https://developer.chrome.com/docs/ai/built-in) が有効な Chrome でのみ動作します。Gemini Nano が利用できない環境でも kuromoji.js によるルビ生成は動作します。

## セットアップ

```bash
npm install
npm run dev
```

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run lint     # ESLint
npm run preview  # ビルド成果物のプレビュー
```

## AZIK入力方式について

[AzooKey](https://github.com/azooKey/AzooKeyKanaKanjiConverter) の defaultAzik.swift に基づく実装です。標準ローマ字入力に以下の拡張を追加しています。

| 入力例 | 出力 |
|--------|------|
| `sz` | さん |
| `kz` | かん |
| `tz` | たん |
| `sq` | さい |
| `sh` | さう（長音） |
| `ms` | ます |
| `ds` | です |

その他の対応表は `src/azik.ts` の `ROMAJI_TO_KANA` を参照してください。

## テキスト入力機能

idle画面のテキストエリアに日本語を貼り付けて「スタート」を押すと：

1. LLMが利用可能な場合 → AIが意味段落に分割
2. LLMが利用できない場合 → 句点・感嘆符・疑問符で分割
3. kuromoji.js で形態素解析してルビを付与
4. kuromoji が読めなかった語はLLMで補完

## ライセンス

MIT

### サードパーティ

`src/azik.ts` のAZIKテーブルは [AzooKeyKanaKanjiConverter](https://github.com/azooKey/AzooKeyKanaKanjiConverter)（Copyright (c) 2023 Miwa / Ensan, MIT License）の `defaultAzik.swift` を基に作成しています。詳細は [LICENSES](./LICENSES) を参照してください。
