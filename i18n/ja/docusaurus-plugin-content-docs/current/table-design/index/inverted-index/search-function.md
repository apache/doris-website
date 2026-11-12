---
{
    "title": "SEARCH 関数",
    "language": "ja",
    "description": "SEARCH 関数は、Apache Doris 4.0 が提供する統一された全文検索のエントリーポイントです。簡潔な DSL 式でクエリ条件を記述し、転置インデックスを使用して単語、フレーズ、ブール演算、ワイルドカード、正規表現による検索を効率的に実行します。"
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

`SEARCH` 関数は、Apache Doris 4.0 以降で提供される、全文検索クエリの統一されたエントリーポイントです。簡潔な DSL（ドメイン固有言語）でクエリ条件を記述し、転置インデックスを使用して効率的に実行します。

`SEARCH` は BOOLEAN 値を返す述語関数です。`WHERE` 句のフィルター条件として使用できます。テキストの照合規則を記述した SEARCH DSL 文字列を受け取り、転置インデックスで照合できる条件をプッシュダウンして実行します。

**主な使用例：**

- テキストフィールドで単語、フレーズ、ブール演算を組み合わせた検索を行う
- 複数の列を横断して検索する
- ワイルドカードや正規表現でパターンを照合する
- VARIANT のサブカラムで構造化テキストを検索する
- Lucene/Elasticsearch の query_string 構文スタイルとの互換性を保つ

## 構文 {#syntax}

### 基本的な呼び出し形式 {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**パラメータの説明：**

| パラメータ | 必須かどうか | 説明 |
| --- | --- | --- |
| `<search_expression>` | 必須 | SEARCH DSL のクエリ式（文字列リテラル） |
| `<default_field>` | 任意 | DSL 内の単語にフィールドが明示されていない場合に、自動的に適用される列名 |
| `<default_operator>` | 任意 | 複数の単語を含む式に適用するデフォルトのブール演算子。`and` または `or` のみ指定できます（大文字と小文字は区別されません）。デフォルトは `or` です |

**使用上の注意：**

- **使用位置**：行のフィルタリングに使う述語として `WHERE` 句に指定します
- **戻り値の型**：NULL を許容しない BOOLEAN（一致する場合は TRUE、それ以外は FALSE）

`default_field` を指定すると、Doris はフィールドが明示されていない単語や関数を、そのフィールドに対する式へ自動的に展開します。例：

- `SEARCH('foo bar', 'tags', 'and')` は `SEARCH('tags:ALL(foo bar)')` と同等です
- `SEARCH('foo bar', 'tags')` は `tags:ANY(foo bar)` に展開されます

DSL 内で明示したブール演算は最も優先され、デフォルトの演算子より優先されます。

### オプションパラメータ（JSON 形式） {#options-parameter-json-format}

高度な設定には、第二引数に JSON 文字列を指定することもできます。

```sql
SEARCH('<search_expression>', '<options_json>')
```

**サポートされるオプション：**

| オプション | 型 | 説明 |
| --- | --- | --- |
| `default_field` | string | フィールドが明示されていない単語に使用するデフォルトの列名 |
| `default_operator` | string | 複数の単語を含む式に適用するデフォルトの演算子（`and` または `or`） |
| `mode` | string | `standard`（デフォルト）または `lucene` |
| `minimum_should_match` | integer | 一致が必要な SHOULD 句の最小数（Lucene モードのみ） |
| `fields` | array of strings | フィールドが明示されていない単語の検索対象となる任意の列。空でない `default_field` とは同時に指定できません |
| `type` | string | 複数フィールドへの展開方法を指定する任意の設定。`best_fields`（デフォルト）または `cross_fields`。スコアリングやソートのアルゴリズムは選択しません |

**例：**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL と二値の照合 {#null-and-three-valued-logic}

**バージョン：** 以下の二値の照合規則、NULL/NOT の例、VARIANT のインデックスエラーに関する動作は、Doris 4.2 以降に適用されます。

`SEARCH` は NULL を許容しない BOOLEAN を返します。一致する場合は TRUE、一致しない場合は FALSE です。通常の単語検索は、NULL 値や、ストレージ上に存在しないことが確認された VARIANT パスには一致しません。SEARCH は UNKNOWN を伝播しません。

標準モードでは、`AND` は一致する行の集合の積集合、`OR` は和集合を取り、`NOT` はクエリから参照できる行を基準に補集合を取ります。したがって、`SEARCH('NOT a:hit')` と `NOT SEARCH('a:hit')` はどちらも NULL の行を含みます。Lucene モードでも NULL と不一致に関する規則は同じですが、後述する独自のブール式解析規則が適用されます。`score()` の計算やクエリキャッシュの使用によって、一致する行の集合全体は変わりません。ただし、ソートや LIMIT によって、返される行は変わることがあります。

通常の SQL 比較演算子と `MATCH` 演算子には、SQL の三値論理が適用されます。入力が NULL の場合、`a != 'hit'` と `NOT (a MATCH_ANY 'hit')` は UNKNOWN となり、`WHERE` によって除外されます。外側の SQL 式では、ほかの NULL を許容するオペランドによって UNKNOWN が生じる場合もあります。

#### 例：NULL と NOT {#example-null-and-not}

以下の例は、CREATE、INSERT、SELECT の権限を持つデータベースで実行してください。以下では、小規模なデモ用テーブルのために、バケットとレプリカをそれぞれ単一に設定しています。

```sql
CREATE TABLE search_null_demo (
    id INT,
    a VARCHAR(16) NULL,
    INDEX idx_a(a) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_null_demo VALUES (1, 'hit'), (2, 'miss'), (3, NULL);
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('NOT a:hit') ORDER BY id;
```

```text
id
2
3
```

```sql
SELECT id FROM search_null_demo WHERE NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
3
```

NULL の行も除外するには、`IS NOT NULL` フィルターを明示的に追加します。

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

これらの行に対して、SQL 条件 `a != 'hit'` とテキスト検索条件 `NOT (a MATCH_ANY 'hit')` も、id が 2 の行のみを返します。

#### VARIANT：NULL、存在しないパス、利用できないインデックス {#variant-null-missing-paths-and-unavailable-indexes}

`v.a:hit` のような通常の VARIANT の単語検索にも、同じ規則が適用されます。

| `v` に書き込まれた値 | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}`（パス `a` が存在しない） | FALSE | TRUE |
| SQL NULL（VARIANT 列全体が NULL） | FALSE | TRUE |

配列の外にある格納済みオブジェクトでは、JSON の `null` メンバーは削除されます。そのため、そのパスを読み取ると、メンバーが存在しない場合と同様に SQL NULL が返されます。これは式の中で計算された JSON の `null` とは異なります。詳しくは [VARIANT の NULL セマンティクス](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics) を参照してください。

JSON オブジェクトの挿入には `parse_to_variant` を使用します。次のテーブルでは doc モードを無効にし、実行可能なインデックスを持つマテリアライズされたサブパスを使用します。

```sql
CREATE TABLE search_variant_null_demo (
    id INT,
    v VARIANT<PROPERTIES("variant_enable_doc_mode"="false")>,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_variant_null_demo VALUES
    (1, parse_to_variant('{"a":"hit"}')),
    (2, parse_to_variant('{"a":"miss"}')),
    (3, parse_to_variant('{"a":null}')),
    (4, parse_to_variant('{}')),
    (5, NULL);
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('v.a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('NOT v.a:hit') ORDER BY id;
```

```text
id
2
3
4
5
```

`NOT SEARCH('v.a:hit')` も同じ id を返します。すべての行でパスが存在しない場合、`SEARCH('v.absent:hit')` は行を返さず、`SEARCH('NOT v.absent:hit')` はすべての行を返します。対象パスに NULL でない値がある行だけを残すには、SEARCH の外側に `v['a'] IS NOT NULL` を追加します。

**存在しないパスと利用できないインデックスは異なる状態です。** パスにデータがあっても、必要な転置インデックスを使用できない場合、SEARCH は否定クエリを含め、`SEARCH index unavailable for Variant field 'v.a'` を報告します。たとえば、CREATE INDEX の後にまだインデックスが構築されていない過去の rowset や、実行可能なリーフインデックスがなく doc ストレージにのみ保持されているパスが該当します。SEARCH はこれらの状態を空の一致集合として扱わず、自動的にスキャンへ切り替えることもありません。クエリ対象のすべてのデータで必要なパスのインデックスを利用できるようにするか、抽出したパスを通常の SQL でクエリしてください。

## シナリオ別の SEARCH の使い方 {#using-search-by-scenario}

### シナリオ 1：単語の照合 {#scenario-1-single-term-match}

**使用例：** フィールド内に特定の単語を含むドキュメントを検索します。

- **構文：** `column:term`
- **動作：** 列のトークン化結果に対して単語を照合します。大文字と小文字を区別するかどうかは、インデックスプロパティ `lower_case` によって決まります
- **推奨インデックス：** 適切な `parser`/`analyzer` を指定して、列に転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### シナリオ 2：複数単語の OR 照合（ANY） {#scenario-2-multi-term-or-match-any}

**使用例：** 候補リスト内のいずれかの単語に一致すればよい場合に使用します。タグの照合や、キーワードを組み合わせた検索などが該当します。

- **構文：** `column:ANY(term1 term2 ...)`
- **動作：** 列のトークン化結果に、リスト内のいずれかの単語が含まれていれば一致します（OR セマンティクス）。順序は関係なく、重複する単語は無視されます
- **推奨インデックス：** 列にトークン化を行う転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### シナリオ 3：複数単語の AND 照合（ALL） {#scenario-3-multi-term-and-match-all}

**使用例：** 厳密なトピックの絞り込みなど、複数の単語すべてに一致する必要がある場合に使用します。

- **構文：** `column:ALL(term1 term2 ...)`
- **動作：** 列のトークン化結果に、リスト内のすべての単語が同時に含まれていれば一致します（AND セマンティクス）。順序は関係なく、重複する単語は無視されます
- **推奨インデックス：** 列にトークン化を行う転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### シナリオ 4：ブール演算を組み合わせたクエリ {#scenario-4-boolean-combination-query}

**使用例：** 「A を含み、B を含まない」など、複数の条件を AND/OR/NOT で組み合わせる場合に使用します。

- **構文：** `(expr) AND/OR/NOT (expr)`
- **動作：** SEARCH 内の部分式を `AND`、`OR`、`NOT` で組み合わせます
- **推奨インデックス：** インデックスへのプッシュダウンを利用できるよう、照合可能な条件はできるだけ SEARCH 内に記述します。追加の絞り込みには、ほかの WHERE 条件を使用します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### シナリオ 5：複雑な入れ子の式 {#scenario-5-complex-nested-expressions}

**使用例：** 括弧でブール演算の優先順位を制御し、多階層のフィルター条件を構築します。

- **構文：** `(expr1 OR expr2) AND expr3` のように、括弧で式をグループ化します
- **動作：** 括弧でブール演算の優先順位を制御します。多階層の入れ子に対応しています
- **推奨インデックス：** ブール演算を組み合わせたクエリと同じです

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### シナリオ 6：Lucene/Elasticsearch 構文との互換性 {#scenario-6-luceneelasticsearch-syntax-compatibility}

**使用例：** Elasticsearch から移行する場合や、Lucene の query_string セマンティクスに従って式を記述する場合に使用します。

Lucene モードは、Elasticsearch/Lucene の query_string の動作を模倣します。ブール演算子は、従来のブール代数ではなく、左から右に適用される修飾子として機能します。

**標準モードとの主な違い：**

- AND/OR/NOT は隣接する単語に影響する修飾子です
- 演算子は左から右に適用されます
- 内部では MUST/SHOULD/MUST_NOT が使用されます（Lucene の Occur enum と同様）
- NOT のみのクエリでは、すべてに一致する条件を追加したうえで、一致する行を除外します

**Lucene モードを有効にする：**

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
| `NOT a` | ¬a | a 以外のすべてのドキュメントに一致（`-a`） |
| `a AND NOT b` | a ∩ ¬b | +a -b（a は MUST、b は MUST_NOT） |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c（a のみ MUST） |

> **注：** Lucene モードでは、`a AND b OR c` は左から右に解析され、OR 演算子によって `b` が MUST から SHOULD に変わります。SHOULD 句への一致を必須にするには、`minimum_should_match` を使用します。

### シナリオ 7：フレーズクエリ {#scenario-7-phrase-query}

**使用例：** 「machine learning」がこの順序で現れることを要求するなど、連続した順序付きのフレーズを検索します。

- **構文：** `column:"quoted phrase"`
- **動作：** 列の analyzer に従い、連続した順序付きの単語を照合します。フレーズ全体を二重引用符で囲む必要があります
- **推奨インデックス：** 対象の列には、位置情報を持つ、トークン化を行う転置インデックス（`parser` で設定）を使用する必要があります

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### シナリオ 8：複数列を横断する検索 {#scenario-8-combined-search-across-multiple-columns}

**使用例：** 単一のクエリで複数のフィールドを対象にします。たとえば、タイトル、タグ、著者のいずれかに一致する行を返します。

- **構文：** `column1:term OR column2:ANY(...) OR ...`
- **動作：** 単一の式内で複数の列を横断して照合します。各列には、それぞれのインデックスとトークナイザーの設定が適用されます
- **推奨インデックス：** 対象となる各列に適切な転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### シナリオ 9：ワイルドカードクエリ {#scenario-9-wildcard-query}

**使用例：** 「Chris」で始まる名前をすべて検索するなど、前方一致、後方一致、部分一致を行います。

- **構文：** `column:prefix*`、`column:*mid*`、`column:?ingle`
- **動作：** `*` は任意の長さの文字列に、`?` は単一の文字に一致します
- **推奨インデックス：** トークン化しないインデックスに適しています。`lower_case` を有効にしたトークン化を行うインデックスでも使用でき、その場合は大文字と小文字を区別せずに照合できます

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### シナリオ 10：正規表現クエリ {#scenario-10-regular-expression-query}

**使用例：** 複雑なパターンの照合に Lucene 形式の正規表現を使用します。

- **構文：** `column:/regex/`
- **動作：** スラッシュで囲んだ Lucene 形式の正規表現で照合します
- **推奨インデックス：** トークン化しない転置インデックスのみがサポートされます

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### シナリオ 11：厳密な等価照合（EXACT） {#scenario-11-strict-equality-match-exact}

**使用例：** 列の元の値全体と完全に一致させます。大文字と小文字を区別し、トークン化は行いません。

- **構文：** `column:EXACT(text)`
- **動作：** 列の値全体を厳密に照合します。大文字と小文字を区別し、部分的な単語には一致しません
- **推奨インデックス：** EXACT を高速化するため、その列にトークン化しない転置インデックスも作成します（`parser` は設定しません）

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### シナリオ 12：VARIANT サブカラムのクエリ {#scenario-12-variant-subcolumn-query}

**使用例：** 半構造化 VARIANT フィールド内の特定のサブパスを検索します。

- **構文：** `variant_col.sub.path:term`
- **動作：** ドット区切りのパスで VARIANT サブカラムにアクセスして照合します。照合の動作は、VARIANT 列のインデックスと analyzer の設定に従います
- **対応機能：** ブール演算の組み合わせ、`ANY`/`ALL`、入れ子のパス。存在しないサブカラムは一致を返しません

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 完全な例 {#complete-example}

以下の例では、同じ列にトークン化を行うインデックスと行わないインデックスの両方を作成する方法、および EXACT、ANY/ALL、フレーズ、ワイルドカードを使ったクエリを組み合わせる方法を示します。

### テーブルと基本インデックスの作成 {#create-the-table-and-base-indexes}

```sql
-- Build both tokenized and non-tokenized inverted indexes
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### EXACT とトークン化を行うクエリの比較 {#comparing-exact-and-tokenized-queries}

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

### 条件の組み合わせと簡略化した形式 {#combined-conditions-and-simplified-forms}

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

### VARIANT 列の検索例 {#variant-column-search-example}

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

## エスケープ文字 {#escape-characters}

DSL 内の特殊文字をエスケープするには、バックスラッシュ（`\`）を使用します。

| エスケープ | 説明 | 例 |
| --- | --- | --- |
| `\ ` | リテラルの空白（単語を結合） | `title:First\ Value` は「First Value」に一致 |
| `\(` `\)` | リテラルの括弧 | `title:hello\(world\)` は「hello(world)」に一致 |
| `\:` | リテラルのコロン | `title:key\:value` は「key:value」に一致 |
| `\\` | リテラルのバックスラッシュ | `title:path\\to\\file` は「path\to\file」に一致 |

**例：**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **注：** SQL 文字列内では、バックスラッシュを二重にエスケープする必要があります。SQL 内の `\\` は、DSL 内では単一の `\` になります。

## 現在の制限事項 {#current-limitations}

- 範囲句とリスト句（`field:[a TO b]` や `field:IN(...)` など）は、通常の単語照合にフォールバックします。代わりに、通常の SQL の範囲フィルターまたは `IN` フィルターを使用してください。

代替として、標準の演算子やテキスト検索演算子を使用できます。

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## 複数フィールドのオプション例 {#multi-field-options-example}

`fields` と `type` は Doris 4.1.0 以降で使用できます。`standard` モードでは、`best_fields` はクエリ全体を各フィールドに複製し、それらを OR で結合します。`cross_fields` は各単語を複数のフィールドに展開します。以下の単一フィールド内と複数フィールド横断の違いは、`AND` または `default_operator="and"` を使用した場合のものです。デフォルトの OR 演算子にも同じ違いがあると仮定しないでください。`lucene` モードでは句ごとに展開するため、この標準モードの AND に関する比較は Lucene の動作には当てはまりません。

CREATE、INSERT、SELECT の権限を持つデータベースで、以下のデータを準備します。

```sql
CREATE TABLE search_multifield (
    id INT,
    title STRING,
    content STRING,
    INDEX title_idx(title) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true"),
    INDEX content_idx(content) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO search_multifield VALUES
(1, 'Alice', 'Smith'),
(2, 'Alice Smith', 'other'),
(3, 'Bob', 'Smith');
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"best_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
2
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"cross_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
1
2
```

否定句のみを含む Lucene クエリでは、すべてに一致する条件を追加したうえで、否定句に一致する行を除外します。

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
