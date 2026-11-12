---
{
    "title": "転置インデックス（テキスト検索）",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris のテキスト検索は転置インデックスに基づき、全文検索、フレーズマッチング、正規表現によるマッチング、カスタムトークン化、BM25 による関連度スコアリングをサポートします。ベクトル検索と組み合わせ、RAG などのハイブリッド検索にも利用できます。"
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

テキスト検索は、データセットから特定の語句やフレーズを含むドキュメントを取得し、関連度に基づいて結果を並べ替えます。

| 検索方法 | 強み | 適した用途 |
|----------|------|----------|
| テキスト検索 | 「正確に探す」：制御しやすく、結果を説明できる完全一致検索により、キーワードのヒットとフィルター条件を確実に適用できる | キーワード検索、フレーズマッチング、ブール条件によるフィルタリング |
| ベクトル検索 | 「幅広く探す」：意味的な類似性を利用して検索対象の範囲を広げる | セマンティック検索、近似マッチング |

生成 AI アプリケーション、特に検索拡張生成（RAG）では、テキスト検索とベクトル検索を組み合わせることで、次のことが可能になります。

- 意味的な広がりと語彙的な精度を両立する
- 再現率を高めながら、結果の正確性と説明可能性を確保する
- 大規模言語モデルに、より正確で関連性の高いコンテキストを提供するための信頼性の高い検索基盤を構築する

:::caution 4.1.5 以降、V1 転置インデックスの新規作成は禁止されています

新しいインデックスには V2 または V3 を使用してください。既存の V1 テーブルは引き続き読み取れますが、転置インデックスの追加や、`ALTER TABLE` によるインデックスのストレージ形式の直接アップグレードはできません。代わりにテーブルを再構築してください。実際に適用される `inverted_index_storage_format` の設定が `V1` のままだと、アップグレード後に FE を起動できません。事前に `fe.conf` と `fe_custom.conf` を更新してください。詳しくは[4.1.5 へのアップグレード](../../../admin-manual/cluster-management/upgrade.md)を参照してください。

:::

## Doris におけるテキスト検索の進化 {#evolution-of-text-search-in-doris}

Doris はバージョン 2.0.0 で、高速な全文検索をサポートする転置インデックスを導入しました。その後も、検索用途の多様化とクエリの複雑化に合わせて、テキスト検索機能を拡充してきました。

| 段階 | バージョン | 主な機能 |
|------|------|----------|
| 基盤の構築 | 2.0+ | 列単位の転置インデックスを導入。基本的な全文検索演算子（`MATCH_ANY`、`MATCH_ALL`）と多言語対応のトークナイザーを提供し、大規模なデータセットでの効率的なキーワード検索をサポート |
| 機能の拡張 | 2.x～3.x | 演算子を拡充し、フレーズマッチング（`MATCH_PHRASE`）、プレフィックス検索（`MATCH_PHRASE_PREFIX`）、正規表現によるマッチング（`MATCH_REGEXP`）などの高度な演算子を追加。バージョン 3.1 でカスタムトークン化を導入 |
| 機能の強化 | 4.0+ | BM25 による関連度スコアリングと、統一されたクエリの入口となる `SEARCH` 関数を導入し、テキストの関連度順やハイブリッドなスコアによる並べ替えをサポート |

4.0+ の主な機能強化は次のとおりです。

- **BM25 による関連度スコアリング**：`score()` 関数でテキストの関連度に基づいて結果を並べ替えられます。ベクトルの類似度スコアと組み合わせたハイブリッドなスコアによる並べ替えも可能です。
- **SEARCH 関数**：列をまたぐクエリやブール論理の組み合わせをサポートする統一されたクエリ DSL を提供します。複雑なクエリを組み立てやすくし、クエリ性能もさらに向上させます。

---

## Doris の主なテキスト検索機能 {#core-text-search-features-in-doris}

### 1. 多彩なテキスト検索演算子 {#1-rich-text-operators}

Doris は、基本的なキーワードマッチングから複雑なフレーズ検索まで、さまざまな検索パターンに対応する全文検索演算子を提供します。

現行バージョンでサポートする主な演算子は次のとおりです。

| 演算子 | 説明 | 主な用途 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | いずれかの語句に一致（OR）、またはすべての語句に一致（AND） | 一般的なキーワード検索 |
| `MATCH_PHRASE` | 正確なフレーズマッチング。語句間の距離（slop）と順序を指定可能 | 近接する語句の検索 |
| `MATCH_PHRASE_PREFIX` | フレーズのプレフィックスに一致 | 自動補完、逐次検索 |
| `MATCH_REGEXP` | 正規表現に基づくマッチング | パターンによるテキスト検索 |

これらの演算子は単独で使用できるほか、`SEARCH()` 関数で組み合わせて複雑な論理クエリを構築できます。次の例で使用する `docs` テーブルは、後述の[クイックスタート](#quick-start)で作成します。

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[すべての演算子を見る](./search-operators.md)

---

### 2. カスタムトークン化（3.1+） {#2-custom-tokenization-31}

テキスト検索では、トークン化の方法が検索の適合率と再現率を直接左右します。バージョン 3.1 以降、Doris は**カスタムアナライザー**をサポートしており、用途に合わせてトークン化の処理手順を柔軟に定義できます。

カスタムトークン化では、次の 3 種類のコンポーネントを組み合わせてテキストを細かく制御します。

- **文字フィルター（char_filter）**：トークン化の前に記号を置換、削除、または正規化する
- **トークナイザー（tokenizer）**：トークン化アルゴリズムを選択する。`standard`、`ngram`、`edge_ngram`、`keyword`、`icu` などをサポートし、言語や構造の異なるテキストを処理できる
- **トークンフィルター（token_filter）**：`lowercase`、`word_delimiter`、`ascii_folding` などを使用して、トークン化の結果を正規化・調整する

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

### 3. BM25 による関連度スコアリング（4.0+） {#3-bm25-relevance-scoring-40}

Doris は、テキストの関連度を計算する **BM25（Best Matching 25）** アルゴリズムを実装し、全文検索の結果をスコア付けして並べ替える機能を提供します。

BM25 の主な特徴は次のとおりです。

- 語句頻度（TF）、逆文書頻度（IDF）、文書の長さに基づく確率モデル
- 短いテキストにも長いテキストにも頑健
- `k1` と `b` のパラメーターで重み付けを調整可能

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[スコアリングの仕組みについて詳しく見る](./scoring.md)

---

### 4. SEARCH 関数：統一されたクエリの入口（4.0+） {#4-search-function-unified-query-entry-point-40}

`SEARCH()` 関数は、テキスト検索のための統一された構文を提供します。複数列の検索とブール論理の組み合わせをサポートし、複雑なクエリも簡潔に記述できます。

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

### ステップ 1：転置インデックスを持つテーブルを作成する {#step-1-create-a-table-with-inverted-indexes}

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

### ステップ 2：テキストクエリを実行する {#step-2-run-text-queries}

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

## ハイブリッド検索：テキスト + ベクトル {#hybrid-search-text--vector}

RAG アプリケーションでは、テキスト検索とベクトルの類似度を組み合わせることで、より網羅的な検索ができます。

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

## 転置インデックスの管理 {#managing-inverted-indexes}

### インデックスを作成する {#create-an-index}

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

### インデックスを削除する {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### インデックスを表示する {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 関連ドキュメント {#further-reading}

### 基本ドキュメント {#core-documentation}

- [テキスト検索演算子](./search-operators.md)：演算子の完全なリファレンスとクエリの高速化
- [SEARCH 関数](./search-function.md)：統一されたクエリ DSL の構文と例
- [関連度スコアリング](./scoring.md)：関連度に基づく並べ替えのアルゴリズムと使い方

### 高度なトピック {#advanced-topics}

- [カスタムアナライザー](./custom-analyzer.md)：用途に特化したトークナイザーとフィルターの構築
- [ベクトル検索](../vector-index/overview.md)：埋め込みベクトルを使った意味的類似性検索
