---
{
  "title": "SEARCH関数",
  "description": "SEARCH関数は、Apache Doris 4.0バージョンから全文検索クエリのための簡潔なDSL（ドメイン固有言語）を提供します。",
  "language": "ja"
}
---
## はじめに

`SEARCH`関数は、Apache Doris 4.0バージョンから全文クエリのための簡潔なDSL（ドメイン固有言語）を提供します。この関数は、一般的なテキスト検索パターンを統一されたクエリエントリに簡素化し、高いパフォーマンスを得るために転置インデックス上で実行されます。

SEARCHは、WHERE句で評価されるboolean述語関数です。テキストマッチングルールを記述するSEARCH DSL文字列を受け取り、マッチ可能な述語を転置インデックスにプッシュします。

## 構文と意味

構文

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```
- `<search_expression>` — SEARCH DSL式を含む文字列リテラル
- `<default_field>` *(省略可能)* — フィールドを指定しない項に自動的に適用される列名
- `<default_operator>` *(省略可能)* — 複数項式のデフォルトブール演算子。`and` または `or` を受け付けます（大文字小文字を区別しません）。デフォルトは `or` です。

使用方法

- 配置: 述語として `WHERE` 句で使用
- 戻り値の型: BOOLEAN（マッチする行に対してTRUE）

`default_field` が提供された場合、Dorisは裸の項や関数をそのフィールドに展開します。例えば、`SEARCH('foo bar', 'tags', 'and')` は `SEARCH('tags:ALL(foo bar)')` のように動作し、`SEARCH('foo bark', 'tags')` は `tags:ANY(foo bark)` に展開されます。DSL内の明示的なブール演算子は、常にデフォルト演算子より優先されます。

`SEARCH()` はSQLの三値論理に従います。参照されるすべてのフィールドがNULLである行は、他の述語が式を短絡評価しない限り（`TRUE OR NULL = TRUE`、`FALSE OR NULL = NULL`、`NOT NULL = NULL`）、UNKNOWN と評価され（`WHERE` 句でフィルタリングされ）、専用のテキスト検索演算子の動作と一致します。

### 現在サポートされているクエリ

#### Term query
- 構文: `column:term`
- セマンティクス: 列のトークンストリーム内の項をマッチ。大文字小文字の区別はインデックスの `lower_case` に依存
- インデックスのヒント: 適切な `parser`/analyzerを使用した転置インデックスを列に追加

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```
#### ANY
- 構文: `column:ANY(term1 term2 ...)`
- セマンティクス: 列に記載された用語のいずれかが存在する場合にマッチ（OR）；順序に依存しない；重複は無視される
- インデックスのヒント: トークン化された転置インデックスを使用（例: `english`/`chinese`/`unicode` パーサー）

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```
#### ALL
- 構文: `column:ALL(term1 term2 ...)`
- 意味: リストされたすべての項目が存在することを要求する（AND）；順序に依存しない；重複は無視される
- インデックスのヒント: トークン化された転置インデックスを使用する（例: `english`/`chinese`/`unicode` パーサー）

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```
#### Boolean演算子
- 構文: `(expr) AND/OR/NOT (expr)`
- セマンティクス: boolean演算子を使用してSEARCH内のサブ式を結合する
- インデックス作成のヒント: プッシュダウンのためにマッチ可能な条件をSEARCH内に保持し、その他のWHERE述語はフィルターとして機能させる

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```
#### グループ化とネスト
- 構文: 括弧で囲まれた部分式
- セマンティクス: 括弧で優先順位を制御する。多階層のネストがサポートされる
- インデックス作成のヒント: 上記と同じ

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```
#### フレーズクエリ
- 構文: `column:"quoted phrase"`
- セマンティクス: カラムのアナライザーを使用して連続するトークンを順序通りにマッチします。クォートはフレーズ全体を囲む必要があります。
- インデックス作成のヒント: 位置情報を保持するtokenizer（`parser`）で設定された転置インデックスが必要です。

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```
#### マルチカラム検索
- 構文: `column1:term OR column2:ANY(...) OR ...`
- セマンティクス: 複数のカラムにまたがって検索を行う。各カラムはそれぞれのindex/analyzer設定に従う
- インデックス作成のヒント: 関係する各カラムにinverted indexを追加する

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```
#### Wildcard query
- 構文: `column:prefix*`, `column:*mid*`, `column:?ingle`
- 意味: `*`（複数文字）と`?`（単一文字）のワイルドカードを使用してパターンマッチングを実行します。
- インデックスのヒント: トークン化されていないインデックスと、大文字小文字を区別しないマッチングが必要な場合は`lower_case`を使用したトークン化されたインデックスで動作します。

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Using the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```
#### 正規表現クエリ
- 構文: `column:/regex/`
- セマンティクス: Lucene形式の正規表現マッチングを適用します。スラッシュがパターンを区切ります。
- インデックス作成のヒント: トークン化されていないインデックスでのみ利用可能です。

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```
#### EXACT query

- パターン: `column:EXACT(<text>)`
- セマンティクス: 列値全体との完全一致；大文字小文字を区別；部分トークンはマッチしない
- インデックスのヒント: 最高のパフォーマンスを得るには、列に対してトークン化されていない転置インデックス（`parser`なし）を使用する

例:

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```
#### Variant サブカラムクエリ

- パターン: `variant_col.sub.path:term`
- セマンティクス: ドット記法を使用してVARIANTサブカラムをクエリする。マッチングはVARIANTカラムで設定されたindex/analyzerに従う
- ブール結合、`ANY`/`ALL`、ネストされたパスをサポート。存在しないサブカラムは単純にマッチしない結果を生成する

例:

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```
### 例

```sql
-- Table with both tokenized and untokenized indexes
CREATE TABLE t (
  id INT,
  content STRING,
  INDEX idx_untokenized(content) USING INVERTED,
  INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);

-- Exact string match (uses untokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- No match for partial token with EXACT
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT vs ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;

-- Mixed conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- Simplified syntax with default field/operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- expands to tags:ALL(deep learning)

-- Phrase and wildcard queries in one DSL
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;

-- VARIANT column with inverted index
CREATE TABLE test_variant_search_subcolumn (
  id BIGINT,
  properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
  INDEX idx_properties (properties) USING INVERTED PROPERTIES (
    "parser" = "unicode",
    "lower_case" = "true",
    "support_phrase" = "true"
  )
);

-- Single term
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```
### 現在の制限事項

- Range句とlist句（`field:[a TO b]`、`field:IN(...)`）は依然としてterm検索に劣化します。数値/日付の範囲や明示的な`IN`フィルタには通常のSQL述語を使用してください。

必要に応じて、代替として標準演算子やテキスト検索演算子を使用してください。例えば：

```sql
-- Range filters via SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
