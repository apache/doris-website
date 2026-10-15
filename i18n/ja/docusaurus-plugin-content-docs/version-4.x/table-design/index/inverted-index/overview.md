---
{
    "title": "転置インデックス（テキスト検索）",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris のテキスト検索は転置インデックスを基盤とし、全文検索、フレーズマッチ、正規表現マッチ、カスタムトークン化、BM25 による関連度スコアリングをサポートします。ベクトル検索と組み合わせることで、RAG などのハイブリッド検索にも利用できます。"
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

テキスト検索は、データセットから特定の語句やフレーズを含むドキュメントを取得し、関連度に応じて結果を並べ替えます。

| 検索方法 | 強み | 適したシナリオ |
|----------|------|----------|
| テキスト検索 | 「正確に探す」：制御可能で説明しやすい厳密なマッチングにより、キーワードのヒットとフィルター条件に基づく決定的な結果を得られる | キーワード検索、フレーズマッチ、ブール条件による絞り込み |
| ベクトル検索 | 「幅広く探す」：意味的な類似度を利用して検索対象を広げる | セマンティック検索、近似マッチ |

生成 AI アプリケーション、特に検索拡張生成（RAG）では、テキスト検索とベクトル検索が互いを補完します。

- 意味的な網羅性と語句の厳密性のバランスを取る
- 結果の正確性と説明可能性を確保しながら再現率を高める
- 大規模言語モデルに、より正確で関連性の高いコンテキストを提供するための信頼できる検索基盤を構築する

## Doris におけるテキスト検索の進化

Doris はバージョン 2.0.0 で、高性能な全文検索をサポートする転置インデックスを導入しました。その後、検索シナリオの多様化とクエリの複雑化に合わせて、テキスト検索機能を拡張してきました。

| 段階 | バージョン | 主な機能 |
|------|------|----------|
| 基盤の構築 | 2.0+ | カラム単位の転置インデックスを導入。基本的な全文検索演算子（`MATCH_ANY`、`MATCH_ALL`）と多言語トークナイザーを提供し、大規模なデータセットで効率的なキーワード検索をサポート |
| 機能の拡張 | 2.x から 3.x | 演算子を拡充し、フレーズマッチ（`MATCH_PHRASE`）、プレフィックス検索（`MATCH_PHRASE_PREFIX`）、正規表現マッチ（`MATCH_REGEXP`）などの高度な演算子を追加。バージョン 3.1 でカスタムトークン化を導入 |
| 機能の強化 | 4.0+ | BM25 による関連度スコアリングと、統一されたクエリエントリーポイントとなる `SEARCH` 関数を導入し、テキストの関連度順の並べ替えとハイブリッドランキングをサポート |

4.0+ における主な強化点は次のとおりです。

- **BM25 による関連度スコアリング**：`score()` 関数はテキストの関連度に基づいて結果を並べ替えます。ベクトル類似度スコアと組み合わせて、ハイブリッドランキングも実現できます。
- **SEARCH 関数**：カラムをまたぐクエリとブール論理の組み合わせをサポートする統一的なクエリ DSL を提供します。複雑なクエリの構築を簡単にし、クエリ性能もさらに向上させます。

---

## Doris の主なテキスト検索機能

### 1. 多様なテキスト検索演算子

Doris は複数の検索パターンに対応する全文検索演算子を提供し、基本的なキーワードマッチから複雑なフレーズクエリまで対応します。

現行バージョンでサポートされる主な演算子は次のとおりです。

| 演算子 | 説明 | 主な用途 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | いずれかの語にマッチ（OR）、またはすべての語にマッチ（AND） | 一般的なキーワード検索 |
| `MATCH_PHRASE` | スロップ値と語順を指定できる厳密なフレーズマッチ | 近接する語の検索 |
| `MATCH_PHRASE_PREFIX` | フレーズのプレフィックスマッチ | オートコンプリート、インクリメンタル検索 |
| `MATCH_REGEXP` | 正規表現に基づくマッチング | パターンに基づくテキスト検索 |

これらの演算子は単独で使用することも、`SEARCH()` 関数を通じて組み合わせ、複雑な論理クエリを構築することもできます。たとえば、以下のクエリで参照する `docs` テーブルは、後述の[クイックスタート](#quick-start)で作成するものです。

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[すべての演算子を見る](./search-operators.md)

---

### 2. カスタムトークン化（3.1+）

テキスト検索では、トークン化の方法が検索の適合率と再現率を直接左右します。Doris はバージョン 3.1 から**カスタムアナライザー**をサポートし、用途に応じてトークン化の処理を柔軟に定義できるようになりました。

カスタムトークン化では、次の三種類のコンポーネントを組み合わせて、テキストの処理を細かく制御します。

- **文字フィルター（char_filter）**：トークン化の前に記号を置換、削除、または正規化する
- **トークナイザー（tokenizer）**：トークン化アルゴリズムを選択する。`standard`、`ngram`、`edge_ngram`、`keyword`、`icu` などのタイプをサポートし、さまざまな言語や構造のテキストを処理できる
- **トークンフィルター（token_filter）**：`lowercase`、`word_delimiter`、`ascii_folding` などを使い、トークン化の結果を正規化・調整する

```sql
-- Example: Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

-- Use the custom analyzer when creating a table
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[カスタムトークン化について詳しく見る](./custom-analyzer.md)

---

### 3. BM25 による関連度スコアリング（4.0+）

Doris はテキストの関連度を計算する **BM25（Best Matching 25）** アルゴリズムを実装し、全文検索の結果をスコアリングして並べ替える機能を提供します。

BM25 の主な特徴は次のとおりです。

- 語の出現頻度（TF）、逆文書頻度（IDF）、ドキュメントの長さに基づく確率モデル
- 短いテキストと長いテキストの両方に対応
- `k1` と `b` のパラメータで重み付け戦略を調整可能

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[スコアリングの仕組みについて詳しく見る](./scoring.md)

---

### 4. SEARCH 関数：統一されたクエリエントリーポイント（4.0+）

`SEARCH()` 関数はテキスト検索に統一された構文のエントリーポイントを提供します。複数カラムに対する検索とブール論理の組み合わせをサポートし、複雑なクエリをより簡潔に記述できます。

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[SEARCH 関数の完全ガイド](./search-function.md)

---

## クイックスタート {#quick-start}

### ステップ 1：転置インデックスを持つテーブルを作成する

```sql
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    category STRING,
    tags ARRAY<STRING>,
    created_at DATETIME,
    -- Text search indexes
    INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
    INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
    INDEX idx_category(category) USING INVERTED,
    INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES ("replication_num" = "1");
```

### ステップ 2：テキストクエリを実行する

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full-text search';

-- Boolean query with SEARCH
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:database OR tags:ANY(sql nosql))');

-- Relevance-based ranking
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time analytics OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## ハイブリッド検索：テキストとベクトル

RAG アプリケーションでは、テキスト検索とベクトル類似度検索を組み合わせることで、より包括的な検索が可能になります。

```sql
-- Hybrid retrieval: semantic similarity + keyword filtering
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
    -- Vector filter for semantic similarity
    cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
    -- Text filter for keyword constraints
    AND SEARCH('title:search AND content:engine AND category:technology')
ORDER BY text_relevance DESC
LIMIT 10;
```

## 転置インデックスの管理

### インデックスを作成する

```sql
-- Create at table creation time
CREATE TABLE t (
    content STRING,
    INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- Create on an existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Build the index for existing data
BUILD INDEX idx_content ON docs;
```

### インデックスを削除する

```sql
DROP INDEX idx_content ON docs;
```

### インデックスを確認する

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 関連ドキュメント

### 基本ドキュメント

- [テキスト検索演算子](./search-operators.md)：演算子の完全なリファレンスとクエリの高速化
- [SEARCH 関数](./search-function.md)：統一されたクエリ DSL の構文と使用例
- [関連度スコアリング](./scoring.md)：関連度順に並べ替えるアルゴリズムと使用方法

### 高度なトピック

- [カスタムアナライザー](./custom-analyzer.md)：用途に特化したトークナイザーとフィルターを構築する
- [ベクトル検索](../vector-index/overview.md)：埋め込みベクトルを使用して意味的類似度に基づいて検索する
