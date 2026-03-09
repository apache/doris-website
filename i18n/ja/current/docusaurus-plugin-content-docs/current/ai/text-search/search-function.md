---
{
  "title": "SEARCH関数",
  "language": "ja",
  "description": "SEARCH関数は、Apache Doris 4.0バージョンから全文検索クエリのための簡潔なDSL（ドメイン固有言語）を提供します。"
}
---
## 概要

`SEARCH` 関数は、Apache Doris 4.0 版から全文クエリ用の簡潔なDSL（ドメイン固有言語）を提供します。一般的なテキスト検索パターンを統一されたクエリエントリに簡素化し、高性能な転置インデックス上で実行します。

SEARCH はWHERE句で評価されるboolean述語関数です。テキストマッチングルールを記述するSEARCH DSL文字列を受け取り、マッチ可能な述語を転置インデックスにプッシュします。

## 構文と意味

構文

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```
- `<search_expression>` — SEARCH DSL式を含む文字列リテラル。
- `<default_field>` *(オプション)* — フィールドを指定しない項に自動的に適用される列名。
- `<default_operator>` *(オプション)* — 複数項式のデフォルトブール演算子。`and`または`or`を受け入れる（大文字小文字を区別しない）。デフォルトは`or`。

使用方法

- 配置: `WHERE`句で述語として使用。
- 戻り値の型: BOOLEAN（マッチする行に対してTRUE）。

`default_field`が提供される場合、Dorisは裸の項や関数をそのフィールドに展開します。例えば、`SEARCH('foo bar', 'tags', 'and')`は`SEARCH('tags:ALL(foo bar)')`のように動作し、`SEARCH('foo bark', 'tags')`は`tags:ANY(foo bark)`に展開されます。DSL内の明示的なブール演算子は常にデフォルト演算子より優先されます。

### Optionsパラメータ（JSON形式）

2番目のパラメータは高度な設定のためのJSON文字列にすることもできます：

```sql
SEARCH('<search_expression>', '<options_json>')
```
**サポートされているオプション:**

| Option | Type | Description |
|--------|------|-------------|
| `default_field` | string | 明示的なフィールドを持たない用語のカラム名 |
| `default_operator` | string | 複数用語式における `and` または `or` |
| `mode` | string | `standard` (デフォルト) または `lucene` |
| `minimum_should_match` | integer | マッチさせる最小SHOULD句数 (Luceneモードのみ) |

**例:**

```sql
SELECT * FROM docs WHERE search('apple banana',
  '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```
`SEARCH()`はSQLの三値論理に従います。参照されるすべてのフィールドがNULLである行は、他の述語が式を短絡させない限り（`TRUE OR NULL = TRUE`、`FALSE OR NULL = NULL`、`NOT NULL = NULL`）、UNKNOWN（`WHERE`句でフィルタアウト）として評価され、専用のテキスト検索演算子の動作と一致します。

### 現在サポートされているクエリ

#### Term query
- 構文: `column:term`
- セマンティクス: 列のトークンストリーム内の用語にマッチ；大文字小文字の区別はインデックスの`lower_case`に依存
- インデックス作成のヒント: 適切な`parser`/analyzerを使用して列に転置インデックスを追加

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```
#### ANY
- 構文: `column:ANY(term1 term2 ...)`
- セマンティクス: 列にリストされた任意の用語が存在する場合にマッチ（OR）；順序非依存；重複は無視
- インデックスのヒント: トークン化された転置インデックスを使用（例：`english`/`chinese`/`unicode`パーサー）

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```
#### ALL
- 構文: `column:ALL(term1 term2 ...)`
- セマンティクス: リストされたすべての用語が存在することを要求 (AND); 順序非依存; 重複は無視
- インデックスのヒント: トークン化された転置インデックスを使用 (例: `english`/`chinese`/`unicode` parser)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```
#### Boolean演算子
- 構文: `(expr) AND/OR/NOT (expr)`
- セマンティクス: boolean演算子を使用してSEARCH内のサブ式を結合する
- インデックス化のヒント: プッシュダウンのためにマッチ可能な条件をSEARCH内に保持する。他のWHERE述語はフィルタとして動作する

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
- セマンティクス: 括弧で優先順位を制御する; マルチレベルネストがサポートされている
- インデックス作成のヒント: 上記と同様

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```
#### Lucene Boolean Mode

Luceneモードは、ブール演算子が従来のブール代数ではなく左から右への修飾子として動作するElasticsearch/Luceneのquery_string動作を模倣します。

**標準モードとの主要な違い:**
- AND/OR/NOTは隣接する項に影響を与える修飾子です
- 演算子の優先順位は左から右です
- 内部的にMUST/SHOULD/MUST_NOTを使用します（LuceneのOccur enumのように）
- 純粋なNOTクエリは空の結果を返します（肯定的な節が必要）

**Luceneモードを有効にする:**

```sql
-- Basic Lucene mode
SELECT * FROM docs WHERE search('apple AND banana',
  '{"default_field":"title","mode":"lucene"}');

-- With minimum_should_match
SELECT * FROM docs WHERE search('apple AND banana OR cherry',
  '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```
**動作比較:**

| クエリ | Standard Mode | Lucene Mode |
|-------|--------------|-------------|
| `a AND b` | a ∩ b | +a +b (both MUST) |
| `a OR b` | a ∪ b | a b (both SHOULD, min=1) |
| `NOT a` | ¬a | Empty (no positive clause) |
| `a AND NOT b` | a ∩ ¬b | +a -b (MUST a, MUST_NOT b) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (only a is MUST) |

**注意:** Lucene modeでは、`a AND b OR c`は左から右へ解析されます: OR演算子により`b`はMUSTからSHOULDに変更されます。SHOULDマッチを必須にするには`minimum_should_match`を使用してください。

#### Phrase query
- 構文: `column:"quoted phrase"`
- 意味: columnのanalyzerを使用して連続するトークンを順序通りにマッチします; 引用符はフレーズ全体を囲む必要があります。
- インデックス作成のヒント: 位置情報を保持するtokenizer (`parser`)で設定されたinverted indexが必要です。

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```
#### マルチカラム検索
- 構文: `column1:term OR column2:ANY(...) OR ...`
- セマンティクス: 複数のカラムにわたって検索します。各カラムは独自のindex/analyzerの設定に従います
- インデックス作成のヒント: 関連する各カラムに転置インデックスを追加してください

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```
#### ワイルドカードクエリ
- 構文: `column:prefix*`、`column:*mid*`、`column:?ingle`
- セマンティクス: `*`（複数文字）および `?`（単一文字）ワイルドカードを使用してパターンマッチングを実行します。
- インデックス作成のヒント: untokenized インデックスおよび大文字小文字を区別しないマッチングが必要な場合は `lower_case` を使用した tokenized インデックスで動作します。

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Using the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```
#### 正規表現クエリ
- 構文: `column:/regex/`
- セマンティクス: Lucene形式の正規表現マッチングを適用します。スラッシュでパターンを区切ります。
- インデックス作成のヒント: トークン化されていないインデックスでのみ利用可能です。

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```
#### EXACT クエリ

- パターン: `column:EXACT(<text>)`
- セマンティクス: 列値全体との完全一致；大文字小文字を区別；部分トークンにはマッチしない
- インデックス作成のヒント: 最高のパフォーマンスを得るには、列に対してトークン化されていない転置インデックス（`parser`なし）を使用してください

Example:

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```
#### Variantサブカラムクエリ

- パターン: `variant_col.sub.path:term`
- セマンティクス: ドット記法を使用してVARIANTサブカラムをクエリします。マッチングはVARIANTカラムに設定されたindex/analyzerに従います
- boolean組み合わせ、`ANY`/`ALL`、ネストされたパスをサポートします。存在しないサブカラムは単にマッチしません

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
#### エスケープ文字

DSLで特殊文字をエスケープするには、バックスラッシュ（`\`）を使用します：

| エスケープ | 説明 | 例 |
|--------|-------------|---------|
| `\ ` | リテラルスペース（用語を結合） | `title:First\ Value`は"First Value"にマッチ |
| `\(` `\)` | リテラル括弧 | `title:hello\(world\)`は"hello(world)"にマッチ |
| `\:` | リテラルコロン | `title:key\:value`は"key:value"にマッチ |
| `\\` | リテラルバックスラッシュ | `title:path\\to\\file`は"path\to\file"にマッチ |

**例：**

```sql
-- Search for value containing space as single term
SELECT * FROM docs WHERE search('title:First\\ Value');

-- Search for value with parentheses
SELECT * FROM docs WHERE search('title:hello\\(world\\)');

-- Search for value with colon
SELECT * FROM docs WHERE search('title:key\\:value');
```
**注意:** SQL文字列では、バックスラッシュは二重エスケープが必要です。DSLで単一の`\`を生成するには、SQLで`\\`を使用してください。

### 現在の制限事項

- 範囲および リスト句（`field:[a TO b]`、`field:IN(...)`）は、依然として用語検索に劣化します。数値/日付範囲または明示的な`IN`フィルターには、通常のSQL述語に依存してください。

必要に応じて、代替として標準演算子またはテキスト検索演算子を使用してください。例えば：

```sql
-- Range filters via SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
