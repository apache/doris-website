---
{
    "title": "転置インデックス（テキスト検索）",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris のテキスト検索は転置インデックスを基盤とし、全文検索、フレーズ一致、正規表現による一致、カスタムトークン化、BM25 による関連度スコアリングをサポートします。ベクトル検索と組み合わせることで、RAG などのハイブリッド検索にも利用できます。"
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

テキスト検索は、データセットから特定の語句やフレーズを含むドキュメントを取得し、関連度に基づいて結果を並べます。

| 検索方法 | 強み | 適した場面 |
|----------|------|----------|
| テキスト検索 | 「正確に探す」：制御しやすく説明可能な厳密な一致により、キーワードのヒットとフィルター条件を確実に適用できる | キーワード検索、フレーズ一致、論理条件による絞り込み |
| ベクトル検索 | 「幅広く探す」：意味的な類似性を利用して検索対象を広げる | 意味検索、近似一致 |

生成 AI アプリケーション、特に検索拡張生成（RAG）では、テキスト検索とベクトル検索は互いを補完します。

- 意味的な検索範囲の広さと、語句による検索の精度を両立する
- 結果の正確さと説明可能性を確保しながら、再現率を高める
- 組み合わせることで、大規模言語モデルにより正確で関連性の高いコンテキストを提供する、信頼性の高い検索基盤を構築する

## Doris におけるテキスト検索の進化

Doris はバージョン 2.0.0 で、高速な全文検索をサポートする転置インデックスを導入しました。検索の用途が多様化し、クエリが複雑になるにつれて、その後のリリースでもテキスト検索機能を拡充してきました。

| 段階 | バージョン | 主な機能 |
|------|------|----------|
| 基盤整備 | 2.0+ | 列単位の転置インデックスを導入。基本的な全文検索演算子（`MATCH_ANY`、`MATCH_ALL`）と多言語トークナイザーを提供し、大規模なデータセットで効率的なキーワード検索をサポート |
| 機能拡充 | 2.x から 3.x | 演算子体系を拡張し、フレーズ一致（`MATCH_PHRASE`）、プレフィックス検索（`MATCH_PHRASE_PREFIX`）、正規表現による一致（`MATCH_REGEXP`）などの高度な演算子を追加。バージョン 3.1 でカスタムトークン化を導入 |
| 機能強化 | 4.0+ | BM25 による関連度スコアリングと、統一されたクエリのエントリーポイントである `SEARCH` 関数を導入。テキストの関連度による順位付けとハイブリッドな順位付けをサポート |

4.0+ の主な機能強化は次のとおりです。

- **BM25 による関連度スコアリング**：`score()` 関数はテキストの関連度に基づいて結果を並べます。ベクトルの類似度スコアと組み合わせて、ハイブリッドな順位付けもできます。
- **SEARCH 関数**：複数列にまたがるクエリと論理演算の組み合わせをサポートする統一クエリ DSL を提供します。複雑なクエリの作成を簡素化し、クエリ性能をさらに向上させます。

---

## Doris の主なテキスト検索機能

### 1. 豊富なテキスト検索演算子

Doris は、基本的なキーワード一致から複雑なフレーズクエリまで、さまざまな検索パターンに対応する全文検索演算子を提供します。

現行バージョンでサポートされる主な演算子は次のとおりです。

| 演算子 | 説明 | 代表的な用途 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | いずれかの語に一致（OR）、またはすべての語に一致（AND） | 一般的なキーワード検索 |
| `MATCH_PHRASE` | スロップ値と語順をカスタマイズできる完全なフレーズ一致 | 近接する語の検索 |
| `MATCH_PHRASE_PREFIX` | フレーズのプレフィックス一致 | オートコンプリート、逐次検索 |
| `MATCH_REGEXP` | 正規表現に基づく一致 | パターンを用いたテキスト検索 |

これらの演算子は単独で使用することも、`SEARCH()` 関数を通じて組み合わせ、複雑な論理クエリを構築することもできます。例：

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[すべての演算子を見る](./search-operators.md)

---

### 2. カスタムトークン化（3.1+）

テキスト検索では、トークン化の方法が検索精度と再現率を直接左右します。Doris はバージョン 3.1 から**カスタムアナライザー**をサポートし、用途に応じてトークン化の処理手順を柔軟に定義できます。

カスタムトークン化では、次の三種類のコンポーネントを組み合わせ、テキストを細かく制御します。

- **文字フィルター（char_filter）**：トークン化の前に記号を置換、削除、または正規化する
- **トークナイザー（tokenizer）**：トークン化アルゴリズムを選択する。`standard`、`ngram`、`edge_ngram`、`keyword`、`icu` などの種類をサポートし、異なる言語や構造のテキストを処理する
- **トークンフィルター（token_filter）**：`lowercase`、`word_delimiter`、`ascii_folding` などを使用し、トークン化の結果を正規化・調整する

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

Doris は、テキストの関連度を計算する **BM25（Best Matching 25）** アルゴリズムを実装し、全文検索の順位付けとスコアリングを提供します。

BM25 の主な特性は次のとおりです。

- 語の出現頻度（TF）、逆文書頻度（IDF）、ドキュメントの長さに基づく確率モデル
- 短いテキストにも長いテキストにも安定して適用できる
- `k1` と `b` のパラメーターで重み付けの方法を調整できる

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[スコアリングの仕組みについて詳しく見る](./scoring.md)

---

### 4. SEARCH 関数：統一されたクエリのエントリーポイント（4.0+）

`SEARCH()` 関数は、テキスト検索のための統一された構文を提供します。複数列の検索と論理演算の組み合わせをサポートし、複雑なクエリを簡潔に記述できます。

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[SEARCH 関数の完全ガイド](./search-function.md)

---

## クイックスタート

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
DISTRIBUTED BY HASH(id) BUCKETS 10;
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

RAG アプリケーションでは、テキスト検索とベクトルの類似度を組み合わせることで、より広範な検索が可能になります。

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

### インデックスを表示する

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 関連ドキュメント

### 基本ドキュメント

- [テキスト検索演算子](./search-operators.md)：演算子の完全なリファレンスとクエリの高速化
- [SEARCH 関数](./search-function.md)：統一クエリ DSL の構文と例
- [関連度スコアリング](./scoring.md)：関連度による順位付けのアルゴリズムと使い方

### 高度なトピック

- [カスタムアナライザー](./custom-analyzer.md)：用途に特化したトークナイザーとフィルターの構築
- [ベクトル検索](../vector-index/overview.md)：埋め込みベクトルを使用した意味的な類似度検索
