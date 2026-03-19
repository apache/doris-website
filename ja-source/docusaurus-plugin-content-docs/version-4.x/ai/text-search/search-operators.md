---
{
  "title": "フルテキスト検索およびクエリアクセラレーションサポート",
  "description": "MATCH_ANY、MATCH_ALL、MATCH_PHRASE、MATCH_REGEXP、および反転インデックスクエリ高速化を含む全文検索演算子を探索し、データベースシステムにおける高性能データ取得を実現します。",
  "language": "ja"
}
---
## Full-Text Search Operators

### MATCH_ANY
- フィールド内に指定されたキーワードのいずれかを含む行にマッチします。

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
- 高速化のためにインデックスプロパティ `"support_phrase" = "true"` が必要。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```
### MATCH_PHRASE with slop
- 項間に最大距離までの間隔を許可する緩い句マッチング。

```sql
-- Allow up to 3 terms between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```
### MATCH_PHRASE with strict order
- `+`を使用してslopとstrict orderを組み合わせ、用語の順序を強制します。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```
### MATCH_PHRASE_PREFIX
- 最後の語がプレフィックスマッチングを使用するフレーズマッチ。
- 単一の語の場合、その語に対するプレフィックスマッチングに退化する。

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
- 最初の語を後方一致、中間の語を完全一致、最後の語を前方一致として処理し、語は隣接している必要があります。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```
## Inverted Index クエリ加速

### サポートされる演算子と関数

- 等価性と集合: `=`, `!=`, `IN`, `NOT IN`
- 範囲: `>`, `>=`, `<`, `<=`, `BETWEEN`
- NULL チェック: `IS NULL`, `IS NOT NULL`
- 配列: `array_contains`, `array_overlaps`

```sql
-- Examples
SELECT * FROM t WHERE price >= 100 AND price < 200;          -- range
SELECT * FROM t WHERE tags IN ('a','b','c');                  -- set
SELECT * FROM t WHERE array_contains(attributes, 'color');    -- arrays
```
