---
{
    "title": "転置インデックス（テキスト検索）",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris のテキスト検索は転置インデックスに基づき、全文検索、フレーズマッチ、正規表現によるマッチング、カスタムトークン化、BM25 による関連度スコアリングをサポートします。ベクトル検索と組み合わせて、RAG などのハイブリッド検索にも利用できます。"
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

テキスト検索は、データセットから特定の語句やフレーズを含むドキュメントを取得し、関連度に基づいて結果を並べ替えます。

| 検索方法 | 強み | 適した用途 |
|----------|------|----------|
| テキスト検索 | 「正確に見つける」：制御しやすく、結果を説明できる厳密なマッチングにより、キーワードの一致とフィルター条件を確実に適用できる | キーワード検索、フレーズマッチ、ブール条件によるフィルタリング |
| ベクトル検索 | 「幅広く見つける」：意味的な類似性を利用して検索対象の範囲を広げる | セマンティック検索、近似マッチング |

生成 AI アプリケーション、特に検索拡張生成（RAG）では、テキスト検索とベクトル検索が互いを補完します。

- 意味的な検索範囲の広さと語句の一致精度を両立する
- 検索の網羅性を高めながら、結果の正確性と説明可能性を確保する
- 両者を組み合わせて信頼性の高い検索基盤を構築し、大規模言語モデルにより正確で関連性の高いコンテキストを提供する

:::caution 4.1.5 以降、V1 転置インデックスの作成は禁止

新しいインデックスには V2 または V3 を使用してください。既存の V1 テーブルは引き続き読み取れますが、転置インデックスの追加や、`ALTER TABLE` によるインデックスのストレージ形式のその場でのアップグレードはできません。代わりにテーブルを再構築してください。実際に適用される FE の `inverted_index_storage_format` 設定が `V1` のままだと、アップグレード後に FE を起動できません。事前に `fe.conf` と `fe_custom.conf` を更新してください。詳しくは[4.1.5 へのアップグレード](../../../admin-manual/cluster-management/upgrade.md)を参照してください。

:::

## Doris におけるテキスト検索の進化 {#evolution-of-text-search-in-doris}

Doris はバージョン 2.0.0 で、高性能な全文検索を実現する転置インデックスを導入しました。その後も、検索用途の多様化とクエリの複雑化に合わせて、テキスト検索機能を拡充してきました。

| 段階 | バージョン | 主な機能 |
|------|------|----------|
| 基盤の構築 | 2.0+ | カラム単位の転置インデックスを導入。基本的な全文検索演算子（`MATCH_ANY`、`MATCH_ALL`）と多言語トークナイザーを提供し、大規模なデータセットで効率的なキーワード検索を実現 |
| 機能の拡張 | 2.x から 3.x | 演算子を拡充し、フレーズマッチ（`MATCH_PHRASE`）、フレーズのプレフィックス検索（`MATCH_PHRASE_PREFIX`）、正規表現によるマッチング（`MATCH_REGEXP`）などの高度な演算子を追加。バージョン 3.1 でカスタムトークン化を導入 |
| 機能の強化 | 4.0+ | BM25 による関連度スコアリングと統一されたクエリの入口となる `SEARCH` 関数を導入し、テキストの関連度順やハイブリッドスコアによる並べ替えをサポート |

4.0+ の主な強化点は次のとおりです。

- **BM25 による関連度スコアリング**：`score()` 関数でテキストの関連度に基づいて結果を並べ替えられます。ベクトル類似度スコアと組み合わせれば、ハイブリッドスコアによる並べ替えも可能です。
- **SEARCH 関数**：複数カラムにまたがるクエリやブール論理の組み合わせをサポートする統一クエリ DSL を提供します。複雑なクエリを組み立てやすくし、クエリ性能もさらに向上させます。

---

## Doris の主なテキスト検索機能 {#core-text-search-features-in-doris}

### 1. 多彩なテキスト検索演算子 {#1-rich-text-operators}

Doris は、基本的なキーワードマッチから複雑なフレーズクエリまで、さまざまな検索パターンに対応する全文検索演算子を提供します。

現行バージョンでサポートされる主な演算子は次のとおりです。

| 演算子 | 説明 | 代表的な用途 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | いずれかの語に一致（OR）／すべての語に一致（AND） | 一般的なキーワード検索 |
| `MATCH_PHRASE` | 完全なフレーズマッチ。語間距離（slop）と語順を指定可能 | 近接する語の検索 |
| `MATCH_PHRASE_PREFIX` | フレーズのプレフィックスマッチ | オートコンプリート、逐次検索 |
| `MATCH_REGEXP` | 正規表現に基づくマッチング | パターンに基づくテキスト検索 |

これらの演算子は単独で使用できるほか、`SEARCH()` 関数で組み合わせて複雑な論理クエリを構築できます。例：

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[すべての演算子を見る](./search-operators.md)

---

### 2. カスタムトークン化（3.1+） {#2-custom-tokenization-31}

テキスト検索では、トークン化の方法が検索精度と網羅性を直接左右します。バージョン 3.1 以降、Doris は**カスタムアナライザー**をサポートし、業務要件に合わせてトークン化の処理手順を柔軟に定義できるようになりました。

カスタムトークン化では、次の3種類のコンポーネントを組み合わせてテキストを細かく制御します。

- **文字フィルター（char_filter）**：トークン化の前に記号を置換、削除、または正規化する
- **トークナイザー（tokenizer）**：トークン化アルゴリズムを選択する。`standard`、`ngram`、`edge_ngram`、`keyword`、`icu` などに対応し、さまざまな言語や構造のテキストを処理できる
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

Doris はテキストの関連度を計算する **BM25（Best Matching 25）** アルゴリズムを実装しており、全文検索の結果をスコア付けして並べ替えられます。

BM25 の主な特徴は次のとおりです。

- 語の出現頻度（TF）、逆文書頻度（IDF）、文書長に基づく確率モデル
- 短いテキストにも長いテキストにも安定して対応
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

`SEARCH()` 関数は、テキスト検索のための統一された構文を提供します。複数カラムの検索とブール論理の組み合わせをサポートし、複雑なクエリも簡潔に記述できます。

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
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### ステップ 2：テキスト検索クエリを実行する {#step-2-run-text-queries}

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

RAG アプリケーションでは、テキスト検索とベクトル類似度を組み合わせることで、より幅広い検索が可能になります。

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

-- Compute-storage integrated mode: build the index for existing data
BUILD INDEX idx_content ON docs;
```

#### コンピュートとストレージの分離モードにおける既存データ {#cloud-index-build}

Doris 4.1.5 では、上記の `parser="chinese"` インデックスのようなトークン化を伴う転置インデックスを追加すると、スキーマ変更ジョブによって既存データのインデックスが構築されます。ジョブが `FINISHED` になるまで待ってください。そのインデックスに対して別途 `BUILD INDEX` を実行する必要はありません。

```sql
SHOW ALTER TABLE COLUMN WHERE TableName = 'docs';
```

トークン化しない転置インデックス（`parser="none"`）と NGram BloomFilter インデックスでも、デフォルトの `enable_add_index_for_new_data=false` ではスキーマ変更によって既存データのインデックスが構築されます。先に新規データ用のインデックスを追加し、既存データのインデックスを後から別途構築する場合は、`true` に設定します。次の例は、利用可能なコンピュートグループがあるセッションで実行してください。

```sql
CREATE TABLE cloud_index_example (
    id INT,
    tag VARCHAR(64)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO cloud_index_example VALUES (1, 'doris'), (2, 'database');
SET enable_add_index_for_new_data = true;
CREATE INDEX idx_tag ON cloud_index_example(tag)
USING INVERTED PROPERTIES("parser" = "none");
BUILD INDEX ON cloud_index_example;
SHOW BUILD INDEX WHERE TableName = 'cloud_index_example';
```

構築は非同期で行われます。既存の行でインデックスを使用できるようになるのは、`SHOW BUILD INDEX` が `FINISHED` を報告した後です。クラウドモードの構文ではインデックス名を指定しないため、`BUILD INDEX idx_tag ON cloud_index_example` は拒否されます。ここでの Doris 4.1.5 の説明は同バージョンに存在するインデックス形式についてのものであり、新しいカーネルにおける別個の SNII 構築手順については扱いません。

### インデックスを削除する {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### インデックスを確認する {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## よくある質問 {#inverted-index-faq}

### Doris 4.1.5 は日本語のトークン化とタイプミスへの対応をサポートしていますか？ {#does-doris-415-support-japanese-tokenization-and-typo-tolerance}

Doris 4.1.5 は、組み込みの Kuromoji トークナイザーをサポートしていません。実際の用途を代表する日本語テキストで `icu` または `unicode` パーサーを評価し、`TOKENIZE()` で出力を確認してください。これらの分割方法は Kuromoji の形態素解析とは異なります。より新しいパーサーを選ぶ前に、実際に導入しているリリースのドキュメントを確認してください。

[検索演算子](./search-operators.md)は、プレフィックス、正規表現、フレーズの語間距離（slop）を指定したマッチングをサポートします。ただし、これらは編集距離に基づくスペル修正を行いません。スペルを間違えた語が、辞書内の近い語に自動的に展開されることはありません。

## 関連資料 {#further-reading}

### 基本文書 {#core-documentation}

- [テキスト検索演算子](./search-operators.md)：演算子の完全なリファレンスとクエリの高速化
- [SEARCH 関数](./search-function.md)：統一クエリ DSL の構文と例
- [関連度スコアリング](./scoring.md)：関連度に基づく並べ替えのアルゴリズムと使い方

### 高度なトピック {#advanced-topics}

- [カスタムアナライザー](./custom-analyzer.md)：特定の分野向けのトークナイザーとフィルターの構築
- [ベクトル検索](../vector-index/overview.md)：埋め込みベクトルを使用した意味的な類似性の検索
