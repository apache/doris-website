---
{
    "title": "転置インデックス（テキスト検索）",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Dorisのテキスト検索は転置インデックスを基盤とし、全文検索、フレーズ一致、正規表現によるマッチング、カスタムトークン化、BM25による関連度スコアリングをサポートします。ベクトル検索と組み合わせることで、RAGなどのハイブリッド検索にも利用できます。"
}
---

<!-- 知識タイプ: 機能紹介 + クイックスタート -->
<!-- 適用シナリオ: キーワード検索 / フレーズ一致 / RAGハイブリッド検索 / 関連度ランキング -->

テキスト検索は、データセットから特定の語句やフレーズを含むドキュメントを取得し、関連度に基づいて結果を順位付けします。

| 検索方法 | 強み | 適用シナリオ |
|----------|------|----------|
| テキスト検索 | 「正確に見つける」：制御しやすく説明可能な厳密一致により、キーワードのヒットとフィルター条件について決定的な結果を得られる | キーワード検索、フレーズ一致、ブール条件によるフィルタリング |
| ベクトル検索 | 「幅広く見つける」：意味的な類似性を使って検索対象の範囲を広げる | セマンティック検索、近似一致 |

生成AIアプリケーション、特に検索拡張生成（RAG）では、テキスト検索とベクトル検索が互いを補完します。

- 意味的な検索範囲の広さと、語句に基づく精度を両立する
- 検索漏れを減らしながら、結果の正確性と説明可能性を確保する
- 大規模言語モデルにより正確で関連性の高いコンテキストを提供するための、信頼できる検索基盤を構築する

:::caution 4.1.5以降、V1転置インデックスの作成は禁止されています

新しいインデックスにはV2またはV3を使用してください。既存のV1テーブルは引き続き読み取り可能ですが、`ALTER TABLE`を使って転置インデックスを追加したり、インデックスのストレージ形式をその場でアップグレードしたりすることはできません。代わりにテーブルを再構築してください。アップグレード後も有効な`inverted_index_storage_format`設定が`V1`のままだと、FEは起動できません。事前に`fe.conf`と`fe_custom.conf`を更新してください。詳しくは[4.1.5へのアップグレード](../../../admin-manual/cluster-management/upgrade.md)を参照してください。

:::

## Dorisにおけるテキスト検索の進化 {#evolution-of-text-search-in-doris}

Dorisはバージョン2.0.0で転置インデックスを導入し、高性能な全文検索に対応しました。その後も、検索シナリオの多様化とクエリの複雑化に合わせて、テキスト検索機能を拡充してきました。

| 段階 | バージョン | 主な機能 |
|------|------|----------|
| 基盤構築 | 2.0+ | カラム単位の転置インデックスを導入。基本的な全文検索演算子（`MATCH_ANY`、`MATCH_ALL`）と多言語トークナイザーを提供し、大規模なデータセットでも効率的にキーワードを検索できるようにした |
| 機能拡張 | 2.x〜3.x | 演算子を拡充し、フレーズ一致（`MATCH_PHRASE`）、プレフィックス検索（`MATCH_PHRASE_PREFIX`）、正規表現によるマッチング（`MATCH_REGEXP`）などの高度な演算子を追加。バージョン3.1ではカスタムトークン化を導入した |
| 機能強化 | 4.0+ | BM25による関連度スコアリングと、クエリの統一的な入口となる`SEARCH`関数を導入し、テキストの関連度ランキングとハイブリッドランキングに対応した |

4.0+での主な機能強化は次のとおりです。

- **BM25による関連度スコアリング**：`score()`関数でテキストの関連度に基づいて結果を順位付けできます。ベクトルの類似度スコアと組み合わせれば、ハイブリッドランキングも実現できます。
- **SEARCH関数**：カラムをまたぐクエリとブール論理の組み合わせに対応した統一的なクエリDSLを提供します。複雑なクエリを組み立てやすくするとともに、クエリ性能をさらに向上させます。

---

## Dorisのテキスト検索の主な機能 {#core-text-search-features-in-doris}

### 1. 多彩なテキスト検索演算子 {#1-rich-text-operators}

Dorisは、基本的なキーワード一致から複雑なフレーズクエリまで、さまざまな検索パターンに対応する全文検索演算子を提供します。

現行バージョンでサポートされる主な演算子は次のとおりです。

| 演算子 | 説明 | 主な用途 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | いずれかの語に一致（OR）、またはすべての語に一致（AND） | 一般的なキーワード検索 |
| `MATCH_PHRASE` | 完全なフレーズ一致。語間距離（slop）や語順を指定可能 | 近接する語の検索 |
| `MATCH_PHRASE_PREFIX` | フレーズのプレフィックス一致 | オートコンプリート、入力途中の検索 |
| `MATCH_REGEXP` | 正規表現に基づく一致 | パターンに基づくテキスト検索 |

これらの演算子は単独で使用するほか、`SEARCH()`関数を通じて組み合わせ、複雑な論理クエリを構築できます。例：

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[すべての演算子を見る](./search-operators.md)

---

### 2. カスタムトークン化（3.1+） {#2-custom-tokenization-31}

テキスト検索では、トークン化の方法が検索の適合率と再現率を直接左右します。バージョン3.1以降、Dorisは**カスタムアナライザー**をサポートし、業務上の要件に合わせてトークン化の処理手順を柔軟に定義できます。

カスタムトークン化では、次の3種類のコンポーネントを組み合わせてテキストをきめ細かく処理します。

- **文字フィルター（char_filter）**：トークン化の前に記号を置換、削除、または正規化する
- **トークナイザー（tokenizer）**：トークン化アルゴリズムを選択する。`standard`、`ngram`、`edge_ngram`、`keyword`、`icu`などをサポートし、言語や構造の異なるテキストを処理できる
- **トークンフィルター（token_filter）**：`lowercase`、`word_delimiter`、`ascii_folding`などを使用して、トークン化の結果を正規化・調整する

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

[カスタムトークン化について学ぶ](./custom-analyzer.md)

---

### 3. BM25による関連度スコアリング（4.0+） {#3-bm25-relevance-scoring-40}

Dorisはテキストの関連度を計算する**BM25（Best Matching 25）**アルゴリズムを実装し、全文検索の結果をスコア付けして順位付けできます。

BM25の主な特徴は次のとおりです。

- 語の出現頻度（TF）、逆文書頻度（IDF）、ドキュメントの長さに基づく確率モデル
- 短いテキストにも長いテキストにも安定して対応
- `k1`と`b`のパラメーターで重み付けを調整可能

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[スコアリングの仕組みについて詳しく見る](./scoring.md)

---

### 4. SEARCH関数：統一的なクエリの入口（4.0+） {#4-search-function-unified-query-entry-point-40}

`SEARCH()`関数はテキスト検索のための統一的な構文を提供します。複数カラムの検索やブール論理の組み合わせに対応し、複雑なクエリも簡潔に記述できます。

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[SEARCH関数の完全ガイド](./search-function.md)

---

## クイックスタート {#quick-start}

### ステップ1：転置インデックス付きのテーブルを作成する {#step-1-create-a-table-with-inverted-indexes}

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

### ステップ2：テキストクエリを実行する {#step-2-run-text-queries}

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

RAGアプリケーションでは、テキスト検索とベクトル類似度を組み合わせることで、より網羅的に検索できます。

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

### インデックスを確認する {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 関連資料 {#further-reading}

### 基本ドキュメント {#core-documentation}

- [テキスト検索演算子](./search-operators.md)：演算子の完全なリファレンスとクエリの高速化
- [SEARCH関数](./search-function.md)：統一的なクエリDSLの構文と例
- [関連度スコアリング](./scoring.md)：関連度ランキングのアルゴリズムと使い方

### 高度なトピック {#advanced-topics}

- [カスタムアナライザー](./custom-analyzer.md)：特定の分野に合わせたトークナイザーとフィルターの構築
- [ベクトル検索](../vector-index/overview.md)：埋め込みベクトルを使用した意味的類似性検索
