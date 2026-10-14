---
{
    "title": "SEARCH 関数",
    "language": "ja",
    "description": "SEARCH 関数は、Apache Doris 4.0 で提供される全文検索の統一的なエントリーポイントです。簡潔な DSL 式で検索条件を記述し、転置インデックスを利用して単語、フレーズ、論理演算、ワイルドカード、正規表現による検索を効率的に実行します。"
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

`SEARCH` 関数は、Apache Doris 4.0 以降で提供される全文検索クエリの統一的なエントリーポイントです。簡潔な DSL（ドメイン固有言語）で検索条件を記述し、転置インデックスを利用して効率的に実行します。

`SEARCH` は真偽値を返す述語関数です。`WHERE` 句のフィルター条件として使用できます。テキストの照合ルールを記述した SEARCH DSL 文字列を受け取り、インデックスで照合できる条件を転置インデックスにプッシュダウンして実行します。

**主なユースケース：**

- テキストフィールドに対する単語、フレーズ、および論理演算を組み合わせた検索
- 複数の列にまたがる複合検索
- ワイルドカードまたは正規表現によるパターンマッチング
- VARIANT サブカラムに対する構造化テキスト検索
- Lucene/Elasticsearch の query_string 構文スタイルとの互換性の維持

## 構文

### 基本的な呼び出し形式

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**パラメータの説明：**

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `<search_expression>` | 必須 | SEARCH DSL のクエリ式（文字列リテラル） |
| `<default_field>` | 任意 | DSL 内の検索語にフィールドが明示されていない場合に自動的に適用される列名 |
| `<default_operator>` | 任意 | 複数の検索語を含む式に対するデフォルトの論理演算子。`and` または `or` のみを指定できます（大文字と小文字を区別しません）。デフォルトは `or` です |

**使用上の注意：**

- **使用位置**：行の絞り込みに使う述語として `WHERE` 句で使用します
- **戻り値の型**：BOOLEAN（一致した場合は TRUE）

`default_field` を指定すると、Doris はフィールドが明示されていない検索語や関数を、そのフィールドに自動的に展開します。例：

- `SEARCH('foo bar', 'tags', 'and')` は `SEARCH('tags:ALL(foo bar)')` と同等です
- `SEARCH('foo bar', 'tags')` は `tags:ANY(foo bar)` に展開されます

DSL 内で明示した論理演算子が優先され、デフォルトの演算子を上書きします。

### オプションパラメータ（JSON 形式）

高度な設定には、二番目のパラメータとして JSON 文字列を指定することもできます。

```sql
SEARCH('<search_expression>', '<options_json>')
```

**サポートされるオプション：**

| オプション | 型 | 説明 |
| --- | --- | --- |
| `default_field` | string | フィールドが明示されていない検索語に使用するデフォルトの列名 |
| `default_operator` | string | 複数の検索語を含む式に対するデフォルトの演算子（`and` または `or`） |
| `mode` | string | `standard`（デフォルト）または `lucene` |
| `minimum_should_match` | integer | 一致が必要な SHOULD 句の最小数（Lucene モードのみ） |

**例：**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL と三値論理

`SEARCH()` は SQL の三値論理に従います。

- 照合に関与するすべての列の値が NULL の場合、結果は UNKNOWN になります（`WHERE` 句では除外されます）
- 他の部分式と組み合わせた場合、結果は論理演算の短絡評価ルールに従います。例：
    - `TRUE OR NULL = TRUE`
    - `FALSE OR NULL = NULL`
    - `NOT NULL = NULL`

この動作はテキスト検索演算子と同じです。

## シナリオ別の SEARCH の使用方法

### シナリオ 1：単一の検索語との一致

**用途：** フィールドに特定の検索語を含むドキュメントを検索します。

- **構文：** `column:term`
- **動作：** 列をトークン化した結果に対して検索語を照合します。大文字と小文字を区別するかどうかは、インデックスの `lower_case` プロパティに依存します
- **推奨インデックス：** 適切な `parser`/`analyzer` を指定して、その列に転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### シナリオ 2：複数検索語の OR 検索（ANY）

**用途：** タグの照合や複数のキーワードによる検索など、候補のいずれかに一致すればよい場合に使用します。

- **構文：** `column:ANY(term1 term2 ...)`
- **動作：** 列をトークン化した結果に、リスト内のいずれかの検索語が含まれていれば一致します（OR の動作）。順序は関係なく、重複する検索語は無視されます
- **推奨インデックス：** 列にトークン化を行う転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### シナリオ 3：複数検索語の AND 検索（ALL）

**用途：** 厳密なトピックの絞り込みなど、複数の検索語すべてに一致する必要がある場合に使用します。

- **構文：** `column:ALL(term1 term2 ...)`
- **動作：** 列をトークン化した結果に、リスト内のすべての検索語が同時に含まれていれば一致します（AND の動作）。順序は関係なく、重複する検索語は無視されます
- **推奨インデックス：** 列にトークン化を行う転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### シナリオ 4：論理演算を組み合わせたクエリ

**用途：** 「A を含み、B を含まない」のように、複数の条件を AND/OR/NOT で組み合わせる場合に使用します。

- **構文：** `(expr) AND/OR/NOT (expr)`
- **動作：** `AND`、`OR`、`NOT` を使って SEARCH 内の部分式を組み合わせます
- **推奨インデックス：** インデックスへのプッシュダウンを利用できるよう、可能な限り照合条件を SEARCH 内に記述します。追加の絞り込みには他の WHERE 条件を使用します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### シナリオ 5：複雑なネストした式

**用途：** 括弧で論理演算の優先順位を制御し、複数階層にネストしたフィルター条件を作成します。

- **構文：** `(expr1 OR expr2) AND expr3` のように、括弧で式をグループ化します
- **動作：** 括弧で論理演算の優先順位を制御します。複数階層のネストに対応しています
- **推奨インデックス：** 論理演算を組み合わせたクエリと同じです

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### シナリオ 6：Lucene/Elasticsearch 構文との互換性

**用途：** Elasticsearch から移行する場合や、Lucene の query_string の動作に従った式を記述する場合に使用します。

Lucene モードは、Elasticsearch/Lucene の query_string の動作を再現します。論理演算子は従来のブール代数としてではなく、左から右へ隣接する検索語に作用する修飾子として機能します。

**標準モードとの主な違い：**

- AND/OR/NOT は隣接する検索語に作用する修飾子です
- 演算子は左から右へ評価されます
- 内部では MUST/SHOULD/MUST_NOT が使用されます（Lucene の Occur enum と同様）
- NOT のみのクエリは空の結果を返します（肯定条件が必要です）

**Lucene モードの有効化：**

```sql
-- Basic Lucene mode
SELECT * FROM docs
WHERE SEARCH('apple AND banana',
             '{"default_field":"title","mode":"lucene"}');

-- Use minimum_should_match
SELECT * FROM docs
WHERE SEARCH('apple AND banana OR cherry',
             '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```

**動作の比較：**

| クエリ | 標準モード | Lucene モード |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b（両方とも MUST） |
| `a OR b` | a ∪ b | a b（両方とも SHOULD、min=1） |
| `NOT a` | ¬a | 空の結果（肯定条件なし） |
| `a AND NOT b` | a ∩ ¬b | +a -b（a は MUST、b は MUST_NOT） |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c（a のみ MUST） |

> **注：** Lucene モードでは、`a AND b OR c` は左から右へ解析されます。OR 演算子によって `b` は MUST から SHOULD に変わります。SHOULD 句との一致を必須にするには、`minimum_should_match` を使用します。

### シナリオ 7：フレーズクエリ

**用途：** 連続した語句が順序どおりに現れるかを検索します。たとえば、「machine learning」がこの順序で現れることを要求します。

- **構文：** `column:"quoted phrase"`
- **動作：** 列のアナライザーに従い、連続した検索語を順序どおりに照合します。フレーズ全体を二重引用符で囲む必要があります
- **推奨インデックス：** 対象の列には、位置情報を持つ、トークン化を行う転置インデックス（`parser` で設定）が必要です

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### シナリオ 8：複数列にまたがる複合検索

**用途：** タイトル、タグ、著者のいずれかに一致する行を返すなど、単一のクエリで複数のフィールドを検索します。

- **構文：** `column1:term OR column2:ANY(...) OR ...`
- **動作：** 単一の式の中で複数の列を照合します。各列にはそれぞれのインデックスとトークナイザーの設定が適用されます
- **推奨インデックス：** 対象となる各列に適切な転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### シナリオ 9：ワイルドカードクエリ

**用途：** 「Chris」で始まるすべての名前を探す場合など、前方一致、後方一致、または部分一致を検索します。

- **構文：** `column:prefix*`、`column:*mid*`、`column:?ingle`
- **動作：** `*` は任意の長さの文字列に、`?` は一文字に一致します
- **推奨インデックス：** トークン化しないインデックスに適しています。`lower_case` を有効にしたトークン化を行うインデックスでも、大文字と小文字を区別しない照合に使用できます

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### シナリオ 10：正規表現クエリ

**用途：** 複雑なパターンマッチングに Lucene 形式の正規表現を使用します。

- **構文：** `column:/regex/`
- **動作：** スラッシュで囲んだ Lucene 形式の正規表現を使って照合します
- **推奨インデックス：** トークン化しない転置インデックスのみ対応しています

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### シナリオ 11：厳密一致（EXACT）

**用途：** 列の元の値全体に厳密に一致させます。大文字と小文字を区別し、トークン化は行いません。

- **構文：** `column:EXACT(text)`
- **動作：** 列の値全体に対して厳密一致を行います。大文字と小文字を区別し、一部の検索語のみでは一致しません
- **推奨インデックス：** EXACT を高速化するには、その列にトークン化しない転置インデックス（`parser` を設定しない）も作成します

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### シナリオ 12：VARIANT サブカラムのクエリ

**用途：** 半構造化データを格納した VARIANT フィールド内の特定のサブパスを検索します。

- **構文：** `variant_col.sub.path:term`
- **動作：** ドット区切りのパスで VARIANT サブカラムにアクセスして照合します。照合の動作は VARIANT 列のインデックスおよびアナライザーの設定に従います
- **対応する機能：** 論理演算の組み合わせ、`ANY`/`ALL`、ネストしたパス。存在しないサブカラムは一致しません

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 完全な例

以下の総合的な例では、同じ列にトークン化を行うインデックスと行わないインデックスの両方を作成する方法と、EXACT、ANY/ALL、フレーズ、およびワイルドカードの各クエリを組み合わせる方法を示します。

### テーブルと基本インデックスの作成

```sql
-- Build both tokenized and non-tokenized inverted indexes
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### EXACT とトークン化を行うクエリの比較

```sql
-- Strict equality match (uses the non-tokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- EXACT does not match partial terms
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use the tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT and ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;
```

### 条件の組み合わせと簡略化した形式

```sql
-- Combined conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- Simplified form using a default field and default operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- Automatically expands to tags:ALL(deep learning)

-- Use a phrase and a wildcard together
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;
```

### VARIANT 列の検索例

```sql
-- A VARIANT column with an inverted index
CREATE TABLE test_variant_search_subcolumn (
    id BIGINT,
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
    INDEX idx_properties (properties) USING INVERTED PROPERTIES (
        "parser" = "unicode",
        "lower_case" = "true",
        "support_phrase" = "true"
    )
);

-- Single-term query
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL queries
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR query across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

## エスケープ文字

DSL 内で特殊文字をエスケープするには、バックスラッシュ（`\`）を使用します。

| エスケープ | 説明 | 例 |
| --- | --- | --- |
| `\ ` | リテラルの空白（検索語を結合） | `title:First\ Value` は "First Value" に一致します |
| `\(` `\)` | リテラルの括弧 | `title:hello\(world\)` は "hello(world)" に一致します |
| `\:` | リテラルのコロン | `title:key\:value` は "key:value" に一致します |
| `\\` | リテラルのバックスラッシュ | `title:path\\to\\file` は "path\to\file" に一致します |

**例：**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **注：** SQL 文字列内のバックスラッシュは二重にエスケープする必要があります。SQL 内で `\\` と記述すると、DSL には単一の `\` が渡されます。

## 現在の制限事項

- 範囲句とリスト句（`field:[a TO b]` や `field:IN(...)` など）は、現時点では通常の検索語照合にフォールバックします。代わりに、通常の SQL の範囲フィルターまたは `IN` フィルターを使用してください。

代替として、標準の演算子またはテキスト検索演算子を使用できます。

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
