---
{
    "title": "SEARCH 関数",
    "language": "ja",
    "description": "SEARCH 関数は、Apache Doris 4.0 が提供する統一された全文検索の入口です。簡潔な DSL 式でクエリ条件を記述し、転置インデックスを使用して、単語、フレーズ、ブール演算、ワイルドカード、正規表現による検索を効率的に実行します。"
}
---

<!-- ナレッジの種類: 関数リファレンス / 手順 -->
<!-- ユースケース: 全文検索 / 転置インデックスのクエリ / DSL 式の記述 -->

`SEARCH` 関数は、Apache Doris 4.0 以降で提供される、全文検索クエリの統一された入口です。簡潔な DSL（ドメイン固有言語）でクエリ条件を記述し、転置インデックスを使用して効率的に実行します。

`SEARCH` はブール値を返す述語関数です。`WHERE` 句のフィルター条件として使用できます。テキストの一致ルールを記述する SEARCH DSL 文字列を受け取り、インデックスで処理できる条件を転置インデックスにプッシュダウンして実行します。

**主なユースケース：**

- テキストフィールドに対する単語、フレーズ、ブール演算を組み合わせた検索
- 複数列を対象とする検索
- ワイルドカードまたは正規表現を使ったパターンマッチ
- VARIANT サブカラムに対する構造化テキスト検索
- Lucene/Elasticsearch の query_string 構文形式との互換性の維持

## 構文 {#syntax}

### 基本的な呼び出し形式 {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**パラメーターの説明：**

| パラメーター | 必須 | 説明 |
| --- | --- | --- |
| `<search_expression>` | 必須 | SEARCH DSL のクエリ式（文字列リテラル） |
| `<default_field>` | 任意 | DSL 内の単語にフィールドが明示されていない場合、自動的に適用される列名 |
| `<default_operator>` | 任意 | 複数の単語からなる式に適用するデフォルトのブール演算子。指定できる値は `and` または `or` のみ（大文字と小文字は区別しない）。デフォルトは `or` |

**使用上の注意：**

- **使用位置**：行のフィルタリングに使う述語として `WHERE` 句で使用
- **戻り値の型**：NULL を許容しない BOOLEAN（一致すれば TRUE、それ以外は FALSE。Doris 4.2 以降）

`default_field` を指定すると、Doris はフィールドを明示していない単語や関数を、そのフィールドに自動的に展開します。例：

- `SEARCH('foo bar', 'tags', 'and')` は `SEARCH('tags:ALL(foo bar)')` と同等
- `SEARCH('foo bar', 'tags')` は `tags:ANY(foo bar)` に展開される

DSL 内で明示したブール演算が最優先され、デフォルトの演算子より優先されます。

### オプションパラメーター（JSON 形式） {#options-parameter-json-format}

高度な設定には、JSON 文字列を第2パラメーターとして指定することもできます：

```sql
SEARCH('<search_expression>', '<options_json>')
```

**サポートされるオプション：**

| オプション | 型 | 説明 |
| --- | --- | --- |
| `default_field` | string | フィールドが明示されていない単語に使うデフォルトの列名 |
| `default_operator` | string | 複数の単語からなる式に適用するデフォルトの演算子（`and` または `or`） |
| `mode` | string | `standard`（デフォルト）または `lucene` |
| `minimum_should_match` | integer | 一致が必要な SHOULD 句の最小数（Lucene モードのみ） |
| `fields` | array of strings | フィールドが明示されていない単語の対象列を指定する任意のオプション。空でない `default_field` とは併用不可 |
| `type` | string | 複数フィールドへの展開方法を指定する任意のオプション。`best_fields`（デフォルト）または `cross_fields`。スコアリングやソートのアルゴリズムは選択しない |

**例：**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL と二値の一致判定 {#null-and-three-valued-logic}

**バージョン：** 以下の二値の一致判定ルール、NULL/NOT の例、および VARIANT のインデックスエラーに関する動作は、Doris 4.2 以降に適用されます。

`SEARCH` は NULL を許容しない BOOLEAN を返します。一致すれば TRUE、一致しなければ FALSE です。通常の単語は、NULL 値や、ストレージ上に存在しないことが確認された VARIANT パスには一致しません。SEARCH は UNKNOWN を伝播しません。

standard モードでは、`AND` は一致する行の集合の積集合、`OR` は和集合を取り、`NOT` はクエリから見える行を基準に補集合を取ります。そのため、`SEARCH('NOT a:hit')` と `NOT SEARCH('a:hit')` はどちらも NULL の行を含みます。Lucene モードでも、NULL は一致しないという同じルールが適用されますが、ブール演算の解析には後述する独自のルールが適用されます。`score()` の計算やクエリキャッシュの使用によって、一致する行の集合全体は変わりません。ただし、ソートと LIMIT によって返される行は変わる場合があります。

通常の SQL 比較と `MATCH` 演算子には、引き続き SQL の三値論理が適用されます。入力が NULL の場合、`a != 'hit'` と `NOT (a MATCH_ANY 'hit')` は UNKNOWN となり、`WHERE` によって除外されます。外側の SQL 式は、ほかの NULL を許容するオペランドによって UNKNOWN になる場合があります。

#### 例：NULL と NOT {#example-null-and-not}

CREATE、INSERT、SELECT の権限があるデータベースで以下の例を実行してください。以下の単一バケットと単一レプリカは、小規模なデモ用テーブルの設定です。

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

NULL の行も除外するには、明示的な `IS NOT NULL` フィルターを追加します：

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

これらの行に対しては、SQL 条件 `a != 'hit'` とテキスト検索条件 `NOT (a MATCH_ANY 'hit')` も、id が 2 の行だけを返します。

#### VARIANT：NULL、存在しないパス、使用できないインデックス {#variant-null-missing-paths-and-unavailable-indexes}

`v.a:hit` のような通常の VARIANT の単語にも、同じルールが適用されます：

| `v` に書き込まれた値 | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}`（パス `a` が存在しない） | FALSE | TRUE |
| SQL NULL（VARIANT 列全体が NULL） | FALSE | TRUE |

配列の外側にある保存済みオブジェクトでは、JSON `null` を値とするメンバーは削除されます。そのため、そのパスを読み取ると、メンバーが存在しない場合と同じく SQL NULL が返されます。これは、式内で計算された JSON `null` とは異なります。詳しくは [VARIANT ガイド](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md)を参照してください。

JSON オブジェクトの挿入には `parse_to_variant` を使用します。次のテーブルでは doc モードを無効にし、実行可能なインデックスを備えたマテリアライズ済みのサブパスを例で使用します。

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

`NOT SEARCH('v.a:hit')` も同じ id を返します。あるパスがすべての行で存在しない場合、`SEARCH('v.absent:hit')` は行を返さず、`SEARCH('NOT v.absent:hit')` はすべての行を返します。対象パスに NULL 以外の値がある行だけを残すには、SEARCH の外側に `v['a'] IS NOT NULL` を追加します。

**パスが存在しない状態と、インデックスを使用できない状態は異なります。** パスにデータがあっても、必要な転置インデックスを実行できない場合、否定クエリを含め、SEARCH は `SEARCH index unavailable for Variant field 'v.a'` を報告します。たとえば、CREATE INDEX 後に過去の rowset のインデックスがまだ構築されていない場合や、パスが doc ストレージにのみ保持され、実行可能なリーフインデックスがない場合です。SEARCH は、これらの状態を一致する行がない状態として扱わず、自動的にスキャンへ切り替えることもありません。クエリ対象の全データで必要なパスのインデックスが利用できるようにするか、パスを抽出して通常の SQL でクエリしてください。

## シナリオ別の SEARCH の使い方 {#using-search-by-scenario}

### シナリオ 1：単一単語の一致 {#scenario-1-single-term-match}

**ユースケース：** フィールドに特定の単語を含むドキュメントを検索します。

- **構文：** `column:term`
- **動作：** 列をトークン化した結果に対して単語を照合します。大文字と小文字を区別するかどうかは、インデックスプロパティ `lower_case` によって決まります
- **推奨インデックス：** 適切な `parser`/`analyzer` を指定した転置インデックスを列に作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### シナリオ 2：複数単語の OR 一致（ANY） {#scenario-2-multi-term-or-match-any}

**ユースケース：** 候補の単語のいずれかに一致した場合に一致とします。たとえば、タグの照合や複数キーワードによる検索に使用します。

- **構文：** `column:ANY(term1 term2 ...)`
- **動作：** 列をトークン化した結果に、リスト内のいずれかの単語が含まれれば一致します（OR の動作）。順序は問わず、重複する単語は無視されます
- **推奨インデックス：** 列にトークン化する転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### シナリオ 3：複数単語の AND 一致（ALL） {#scenario-3-multi-term-and-match-all}

**ユースケース：** 複数の単語すべてに一致する必要がある場合に使用します。たとえば、トピックを厳密に絞り込む場合です。

- **構文：** `column:ALL(term1 term2 ...)`
- **動作：** 列をトークン化した結果に、リスト内のすべての単語が同時に含まれれば一致します（AND の動作）。順序は問わず、重複する単語は無視されます
- **推奨インデックス：** 列にトークン化する転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### シナリオ 4：ブール演算を組み合わせたクエリ {#scenario-4-boolean-combination-query}

**ユースケース：** 複数の条件を AND/OR/NOT で組み合わせる場合に使用します。たとえば、「A を含み、B は含まない」という条件です。

- **構文：** `(expr) AND/OR/NOT (expr)`
- **動作：** SEARCH 内で `AND`、`OR`、`NOT` を使って部分式を組み合わせます
- **推奨インデックス：** インデックスへのプッシュダウンを利用できるよう、一致判定が可能な条件はできるだけ SEARCH 内に記述します。追加の絞り込みにはほかの WHERE 条件を使用します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### シナリオ 5：複雑な入れ子の式 {#scenario-5-complex-nested-expressions}

**ユースケース：** 括弧でブール演算の優先順位を制御し、複数階層に入れ子になったフィルター条件を作成します。

- **構文：** `(expr1 OR expr2) AND expr3` のように、括弧で式をグループ化します
- **動作：** 括弧でブール演算の優先順位を制御します。複数階層の入れ子をサポートします
- **推奨インデックス：** ブール演算を組み合わせたクエリと同じです

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### シナリオ 6：Lucene/Elasticsearch 構文との互換性 {#scenario-6-luceneelasticsearch-syntax-compatibility}

**ユースケース：** Elasticsearch から移行する場合や、Lucene の query_string の動作に従って式を記述したい場合に使用します。

Lucene モードは、Elasticsearch/Lucene の query_string の動作を模倣します。ブール演算子は、従来のブール代数ではなく、左から右へ適用される修飾子として機能します。

**standard モードとの主な違い：**

- AND/OR/NOT は隣接する単語に作用する修飾子です
- 演算子は左から右へ適用されます
- 内部では MUST/SHOULD/MUST_NOT を使用します（Lucene の Occur 列挙型に類似）
- NOT のみのクエリでは、すべてに一致する条件を追加してから、一致した行を除外します

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

| クエリ | standard モード | Lucene モード |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b（両方とも MUST） |
| `a OR b` | a ∪ b | a b（両方とも SHOULD、min=1） |
| `NOT a` | ¬a | a を除くすべてのドキュメントに一致（`-a`） |
| `a AND NOT b` | a ∩ ¬b | +a -b（a は MUST、b は MUST_NOT） |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c（a のみが MUST） |

> **注：** Lucene モードでは、`a AND b OR c` は左から右へ解析され、OR 演算子によって `b` が MUST から SHOULD に変わります。SHOULD 句の一致を必須にするには `minimum_should_match` を使用します。

### シナリオ 7：フレーズクエリ {#scenario-7-phrase-query}

**ユースケース：** 連続した順序どおりのフレーズを検索します。たとえば、「machine learning」がこの順序で現れることを要求します。

- **構文：** `column:"quoted phrase"`
- **動作：** 列のアナライザーに従って、連続した順序どおりの単語に一致します。フレーズ全体を二重引用符で囲む必要があります
- **推奨インデックス：** 対象列には、位置情報を持つ、トークン化する転置インデックス（`parser` を設定）を使用する必要があります

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### シナリオ 8：複数列にまたがる検索 {#scenario-8-combined-search-across-multiple-columns}

**ユースケース：** 単一のクエリで複数のフィールドを検索します。たとえば、タイトル、タグ、著者のいずれかに一致する行を返します。

- **構文：** `column1:term OR column2:ANY(...) OR ...`
- **動作：** 単一の式で複数列にまたがって照合します。各列には、それぞれのインデックスとトークナイザーの設定が適用されます
- **推奨インデックス：** 対象となる各列に適切な転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### シナリオ 9：ワイルドカードクエリ {#scenario-9-wildcard-query}

**ユースケース：** 前方一致、後方一致、または部分一致に使用します。たとえば、「Chris」で始まる名前をすべて検索します。

- **構文：** `column:prefix*`、`column:*mid*`、`column:?ingle`
- **動作：** `*` は任意の長さの文字列、`?` は単一の文字に一致します
- **推奨インデックス：** トークン化しないインデックスに適しています。`lower_case` を有効にしたトークン化するインデックスでも使用でき、その場合は大文字と小文字を区別せずに照合できます

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### シナリオ 10：正規表現クエリ {#scenario-10-regular-expression-query}

**ユースケース：** 複雑なパターンマッチに Lucene 形式の正規表現を使用します。

- **構文：** `column:/regex/`
- **動作：** スラッシュで囲んだ Lucene 形式の正規表現で照合します
- **推奨インデックス：** トークン化しない転置インデックスのみをサポートします

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### シナリオ 11：厳密な等価一致（EXACT） {#scenario-11-strict-equality-match-exact}

**ユースケース：** 列の元の値全体に厳密に一致させます。大文字と小文字を区別し、トークン化しません。

- **構文：** `column:EXACT(text)`
- **動作：** 列の値全体に対して厳密な一致判定を行います。大文字と小文字を区別し、部分的な単語には一致しません
- **推奨インデックス：** EXACT を高速化するため、列にトークン化しない転置インデックスも作成します（`parser` を設定しません）

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### シナリオ 12：VARIANT サブカラムのクエリ {#scenario-12-variant-subcolumn-query}

**ユースケース：** 半構造化された VARIANT フィールド内の特定のサブパスを検索します。

- **構文：** `variant_col.sub.path:term`
- **動作：** ドット区切りのパスを使って VARIANT サブカラムにアクセスし、照合します。一致判定には、VARIANT 列のインデックスとアナライザーの設定が適用されます
- **サポートされる機能：** ブール演算の組み合わせ、`ANY`/`ALL`、入れ子のパス。存在しないサブカラムは一致する行を返しません

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 完全な例 {#complete-example}

以下の例では、同じ列にトークン化するインデックスとトークン化しないインデックスを作成し、EXACT、ANY/ALL、フレーズ、ワイルドカードのクエリを組み合わせる方法を示します。

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

### EXACT とトークン化するクエリの比較 {#comparing-exact-and-tokenized-queries}

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

DSL 内の特殊文字をエスケープするには、バックスラッシュ（`\`）を使用します：

| エスケープ | 説明 | 例 |
| --- | --- | --- |
| `\ ` | リテラルの空白（単語を連結） | `title:First\ Value` は「First Value」に一致 |
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

> **注：** SQL 文字列内では、バックスラッシュを二重にエスケープする必要があります。SQL 内の `\\` は、DSL 内の単一の `\` になります。

## 現在の制限事項 {#current-limitations}

- 範囲句とリスト句（`field:[a TO b]` や `field:IN(...)` など）は、引き続き通常の単語の一致判定にフォールバックします。代わりに通常の SQL の範囲フィルターまたは `IN` フィルターを使用してください。

代替手段として、標準の演算子またはテキスト検索演算子を使用できます：

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## 複数フィールドオプションの例 {#multi-field-options-example}

`fields` と `type` は Doris 4.1.0 で利用できます。`standard` モードでは、`best_fields` はクエリ全体を各フィールドに複製し、その結果を OR で結合します。`cross_fields` は各単語を複数のフィールドに展開します。以下の「同一フィールド」と「複数フィールド」の違いは、`AND` または `default_operator="and"` を使用した場合のものです。デフォルトの `OR` 演算子でも同じ違いが生じると想定しないでください。`lucene` モードでは句ごとに展開されるため、standard モードでの以下の AND による比較は Lucene の動作には当てはまりません。

CREATE、INSERT、SELECT の権限があるデータベースで、以下のデータを準備してください：

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

否定句のみを含む Lucene クエリでは、すべてに一致する条件を追加してから、否定句に一致する単語を除外します：

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
