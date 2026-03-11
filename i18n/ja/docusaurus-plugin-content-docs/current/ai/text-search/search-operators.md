---
{
  "title": "フルテキスト検索とクエリアクセラレーションサポート",
  "language": "ja",
  "description": "全文検索演算子（MATCH_ANY、MATCH_ALL、MATCH_PHRASE、MATCH_REGEXP）と転置インデックスクエリ高速化の包括的ガイド：実用的なSQL例を用いたデータベースシステムにおけるテキスト検索と構造化データクエリの最適化"
}
---
## 全文検索演算子

### MATCH_ANY
- フィールド内で指定されたキーワードのいずれかを含む行にマッチします。

```sql
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
```
### MATCH_ALL
- フィールド内に指定されたすべてのキーワードを含む行にマッチします。

```sql
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
```
### MATCH_PHRASE
- 用語が隣接して順序通りに現れるフレーズマッチ。
- 高速化のためにインデックスプロパティ`"support_phrase" = "true"`が必要。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```
### MATCH_PHRASE with slop
- 用語間の最大距離までのギャップを許可する、緩い句マッチング。

```sql
-- Allow up to 3 terms between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```
### 厳密な順序でのMATCH_PHRASE
- `+`を使用してslopと厳密な順序を組み合わせ、用語の順序を強制します。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```
### MATCH_PHRASE_PREFIX
- 最後の単語がプレフィックスマッチングを使用するフレーズマッチ。
- 単一の単語の場合、その単語のプレフィックスマッチングに縮退する。

```sql
-- Last term as prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- Single-term prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```
### MATCH_REGEXP
- フィールドのトークン化された用語に対する正規表現マッチ。

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```
### MATCH_PHRASE_EDGE
- 最初の項を後方一致、中間の項を完全一致、最後の項を前方一致として扱います。項は隣接している必要があります。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```
### USING ANALYZERでのAnalyzerの指定

カラムに異なるanalyzerを持つ複数の転置インデックスがある場合、`USING ANALYZER`句を使用してクエリで使用するanalyzerを指定します。

**構文:**

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```
**サポートされているオペレーター:**
すべてのMATCHオペレーターは`USING ANALYZER`句をサポートします:
- MATCH / MATCH_ANY
- MATCH_ALL
- MATCH_PHRASE
- MATCH_PHRASE_PREFIX
- MATCH_PHRASE_EDGE
- MATCH_REGEXP

**例:**

```sql
-- Use standard analyzer (tokenizes text into words)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Use with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```
**注意点:**
- 指定したanalyzerのindexが構築されていない場合、クエリは自動的に非index経路にフォールバックします（正しい結果、性能は低下）
- analyzerが指定されていない場合、システムは利用可能な任意のindexを使用します
- 組み込みanalyzer名: `none`（完全一致）、`standard`、`chinese`

## 転置インデックスクエリ高速化

### サポートされる演算子と関数

- 等価と集合: `=`、`!=`、`IN`、`NOT IN`
- 範囲: `>`、`>=`、`<`、`<=`、`BETWEEN`
- NULL チェック: `IS NULL`、`IS NOT NULL`
- 配列: `array_contains`、`array_overlaps`

```sql
-- Examples
SELECT * FROM t WHERE price >= 100 AND price < 200;          -- range
SELECT * FROM t WHERE tags IN ('a','b','c');                  -- set
SELECT * FROM t WHERE array_contains(attributes, 'color');    -- arrays
```
