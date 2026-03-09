---
{
  "title": "テキスト検索",
  "sidebar_label": "Overview",
  "language": "ja",
  "description": "テキスト検索は特定の用語や語句を含む文書を取得し、関連性によって結果をランク付けします。"
}
---
## 概要

テキスト検索は、特定の用語やフレーズを含むドキュメントを取得し、関連性によって結果をランク付けします。

セマンティック類似性を通じて再現率を拡張することで「幅広く見つける」ことに優れたベクトル検索と比較して、テキスト検索はキーワードヒットと決定論的フィルタを確保する制御可能で説明可能な完全一致を提供することで「正確に見つける」ことに優れています。

生成AI アプリケーション、特にRetrieval‑Augmented Generation（RAG）において、テキスト検索とベクトル検索は相互に補完します。連携することで、セマンティックな広がりと語彙的精度のバランスを取り、精度と解釈可能性を確保しながら再現率を向上させ、モデルにより正確で関連性の高いコンテキストを提供する信頼性のある検索基盤を構築します。

## Doris テキスト検索の進化

バージョン2.0.0以降、Dorisは多様な検索シナリオと増大するクエリの複雑性に対応するため、テキスト検索を導入し継続的に拡張しています。

### 基盤（2.0+）
基本的な全文検索演算子（MATCH_ANY、MATCH_ALL）と多言語トークナイザーを持つ列レベルの転置インデックスにより、大規模データセットでの効率的なキーワード検索を実現します。

### 機能拡張（2.x → 3.x）
豊富な演算子セットにより、フレーズマッチング（MATCH_PHRASE）、前方一致検索（MATCH_PHRASE_PREFIX）、正規表現マッチング（MATCH_REGEXP）が追加されます。バージョン3.1では、多様なテキスト解析ニーズに対応するためのカスタムアナライザーが導入されます。

### 機能強化（4.0+）
テキスト検索に関連性スコアリングと統一検索エントリが追加され、正式にBM25スコアリングとSEARCH関数が導入されます。

- BM25関連性スコアリング：`score()`でテキスト関連性による結果ランキングを行い、ベクトル類似性とブレンドしてハイブリッドランキングを実現します。

- SEARCH関数：列間検索とブール論理をサポートする統一クエリDSLにより、パフォーマンスを向上させながら複雑なクエリ構築を簡素化します。

## コアテキスト検索機能

### 豊富なテキスト演算子

Dorisは、キーワードマッチングから高度なフレーズクエリまで、複数の検索パターンをカバーする全文検索演算子セットを提供します。

主要な演算子には以下があります：

- `MATCH_ANY` / `MATCH_ALL`：一般的なキーワード検索のためのOR/AND複数用語マッチング
- `MATCH_PHRASE`：設定可能なslopと順序制御を持つ完全フレーズ
- `MATCH_PHRASE_PREFIX`：オートコンプリートと増分検索のためのフレーズ前方一致
- `MATCH_REGEXP`：パターンベース検索のためのトークン化された用語での正規表現

演算子は単独で使用することも、`SEARCH()`を介して組み合わせて複雑なロジックを構築することもできます。例えば：

```sql
-- Keyword search (any keyword match)
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris database';

-- Require all keywords
SELECT * FROM docs WHERE content MATCH_ALL 'real-time analytics OLAP';

-- Exact phrase
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Phrase with slop (allow up to 2 words between terms)
SELECT * FROM docs WHERE content MATCH_PHRASE 'machine learning ~2';

-- Prefix matching
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';  -- matches "data warehouse", "data warehousing"
```
[全オペレータを参照 →](./search-operators.md)

### Custom Analyzers (3.1+)

トークン化戦略は適合率と再現率の両方に直接影響します。3.1以降、Dorisはcustom analyzersをサポートしており、`char_filter`、`tokenizer`、および`token_filter`を組み合わせて分析パイプラインを定義できます。

典型的な用途には以下が含まれます：

- トークン化前の置換/正規化のためのカスタム文字フィルタリング
- 異なる言語やテキスト形式に対して`standard`、`ngram`、`edge_ngram`、`keyword`、`icu`などのtokenizerを選択
- トークンを正規化し調整するための`lowercase`、`word_delimiter`、`ascii_folding`などのtoken filtersの適用

```sql
-- Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
  "tokenizer" = "keyword",
  "token_filter" = "asciifolding, lowercase"
);

-- Use the analyzer in table creation
CREATE TABLE docs (
  id BIGINT,
  content TEXT,
  INDEX idx_content (content) USING INVERTED PROPERTIES (
    "analyzer" = "keyword_lowercase",
    "support_phrase" = "true"
  )
);
```
[カスタムアナライザーについて学ぶ →](./custom-analyzer.md)

### BM25関連性スコアリング (4.0+)

DorisはテキストRelenvance Scoringのために**BM25 (Best Matching 25)**アルゴリズムを実装しており、検索結果のTop-Nランキングを可能にします：

**主な機能：**
- 単語頻度、逆文書頻度、文書長に基づく確率的ランキング
- 長い文書と短い文書の両方に対する堅牢な処理
- ランキング動作の調整可能なパラメータ（k1、b）
- Top-Nクエリとのシームレスな統合

**使用パターン：**

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```
**動作原理:**
- `score()` は一致した各行のBM25スコアを計算します
- より高いスコアは、クエリ用語に対するより強い関連性を示します
- 効率的なTop-N取得のために `ORDER BY` および `LIMIT` と組み合わせます
- すべての `MATCH_*` 演算子および `SEARCH()` 関数と連携します

[スコアリングの詳細 →](./scoring.md)

### SEARCH 関数: 統合クエリDSL (4.0+)

`SEARCH()` 関数は、複雑なテキストクエリのための簡潔で表現力豊かな構文を提供します:

**基本構文:**

```sql
SEARCH('column:term')                          -- Single term
SEARCH('column:ANY(term1 term2)')              -- Any of the terms (OR)
SEARCH('column:ALL(term1 term2)')              -- All terms (AND)
SEARCH('column:EXACT(exact text)')             -- Case-sensitive exact match
```
**Boolean合成:**

```sql
SEARCH('title:apache AND category:database')
SEARCH('title:doris OR title:clickhouse')
SEARCH('tags:ANY(olap analytics) AND NOT status:deprecated')
```
**マルチカラムクエリ:**

```sql
SEARCH('title:search AND (content:engine OR tags:ANY(elasticsearch lucene))')
```
**半構造化データ:**

```sql
SEARCH('properties.user.name:alice')           -- Variant subcolumn access
```
**スコアリングあり:**

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```
[完全なSEARCH機能ガイド →](./search-function.md)

## クイックスタート

### ステップ1: 転置インデックス付きテーブルの作成

```sql
CREATE TABLE docs (
  id BIGINT,
  title STRING,
  content STRING,
  category STRING,
  tags ARRAY<STRING>,
  created_at DATETIME,
  -- Text search indexes
  INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "english"),
  INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "english", "support_phrase" = "true"),
  INDEX idx_category(category) USING INVERTED,
  INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```
### ステップ 2: テキストクエリを実行する

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full text search';

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
## ハイブリッド検索: テキスト + Vector

RAGアプリケーションにおいて、テキスト検索とvector類似性を組み合わせて包括的な検索を実現します：

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

### インデックスの作成

```sql
-- At table creation
CREATE TABLE t (
  content STRING,
  INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "english")
);

-- On existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Build index for existing data
BUILD INDEX idx_content ON docs;
```
### インデックスの削除

```sql
DROP INDEX idx_content ON docs;
```
### インデックスの表示

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```
[Index管理ガイド →](../../table-design/index/inverted-index/overview.md)

## さらに詳しく

### コアドキュメント

- [Inverted Index概要](../../table-design/index/inverted-index/overview.md) — アーキテクチャ、インデックス作成の原理、管理
- [テキスト検索演算子](./search-operators.md) — 完全な演算子リファレンスとクエリアクセラレーション
- [SEARCH関数](./search-function.md) — 統一クエリDSL構文と例
- [関連性スコアリング](./scoring.md) — 関連性ランキングアルゴリズムと使用方法

### 高度なトピック

- [カスタムアナライザー](./custom-analyzer.md) — ドメイン固有のトークナイザーとフィルターの構築
- [ベクトル検索](../vector-search/overview.md) — 埋め込みを使用したセマンティック類似検索
