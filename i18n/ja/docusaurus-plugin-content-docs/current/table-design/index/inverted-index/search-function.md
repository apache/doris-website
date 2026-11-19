---
{
    "title": "SEARCH 関数",
    "language": "ja",
    "description": "SEARCH 関数は、Apache Doris 4.0 が提供する統一された全文検索の入口です。簡潔な DSL 式でクエリ条件を記述し、転置インデックスを使用して単語、フレーズ、ブール演算、ワイルドカード、正規表現による検索を効率的に実行します。"
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

`SEARCH` 関数は、Apache Doris 4.0 以降で提供される、全文検索クエリの統一された入口です。簡潔な DSL（ドメイン固有言語）でクエリ条件を記述し、転置インデックスを使用して効率的に実行します。

`SEARCH` は真偽値を返す述語関数です。`WHERE` 句のフィルター条件として使用できます。テキストのマッチング規則を記述した SEARCH DSL 文字列を受け取り、インデックスで処理できる条件を転置インデックスにプッシュダウンして実行します。

**主な用途：**

- テキストフィールドで単語、フレーズ、ブール演算を組み合わせた検索を行う
- 複数の列を横断して検索する
- ワイルドカードや正規表現でパターンマッチングを行う
- VARIANT サブカラムで構造化テキストを検索する
- Lucene/Elasticsearch の query_string 構文スタイルとの互換性を保つ

## 構文 {#syntax}

### 基本的な呼び出し形式 {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**パラメータ：**

| パラメータ | 必須かどうか | 説明 |
| --- | --- | --- |
| `<search_expression>` | 必須 | SEARCH DSL のクエリ式（文字列リテラル） |
| `<default_field>` | 任意 | DSL 内の単語にフィールドが明示されていない場合に自動的に適用する列名 |
| `<default_operator>` | 任意 | 複数の単語を含む式に適用するデフォルトのブール演算子。`and` または `or` のみ指定でき、大文字と小文字は区別しません。デフォルトは `or` です |

**使用上の注意：**

- **使用位置**：`WHERE` 句で行を絞り込む述語として使用します
- **戻り値の型**：NULL を許容しない BOOLEAN（マッチする場合は TRUE、それ以外は FALSE）

`default_field` を指定すると、Doris はフィールドが指定されていない単語や関数をそのフィールドに自動的に展開します。例：

- `SEARCH('foo bar', 'tags', 'and')` は `SEARCH('tags:ALL(foo bar)')` と同等です
- `SEARCH('foo bar', 'tags')` は `tags:ANY(foo bar)` に展開されます

DSL 内で明示されたブール演算が最も優先され、デフォルトの演算子より優先されます。

### オプションパラメータ（JSON 形式） {#options-parameter-json-format}

高度な設定を行う場合、次のように第2パラメータに JSON 文字列を指定することもできます：

```sql
SEARCH('<search_expression>', '<options_json>')
```

**サポートされるオプション：**

| オプション | 型 | 説明 |
| --- | --- | --- |
| `default_field` | string | フィールドを明示していない単語に使用するデフォルトの列名 |
| `default_operator` | string | 複数の単語を含む式のデフォルト演算子（`and` または `or`） |
| `mode` | string | `standard`（デフォルト）または `lucene` |
| `minimum_should_match` | integer | 一致が必要な SHOULD 句の最小数（Lucene モードのみ） |
| `fields` | array of strings | フィールドを明示していない単語の検索対象となる列。任意で指定でき、空でない `default_field` とは併用できません |
| `type` | string | 複数フィールドへの展開方法。任意で指定でき、`best_fields`（デフォルト）または `cross_fields` を使用します。スコアリングやソートのアルゴリズムは選択しません |

**例：**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL と二値のマッチング {#null-and-three-valued-logic}

**対象バージョン：** 以下の二値マッチング規則、NULL/NOT の例、VARIANT のインデックスエラーに関する動作は、Doris 4.2 以降に適用されます。

`SEARCH` は NULL を許容しない BOOLEAN を返します。マッチすれば TRUE、マッチしなければ FALSE です。通常の単語は、NULL 値や、ストレージ上に存在しないことが確認された VARIANT パスにはマッチしません。SEARCH は UNKNOWN を伝播しません。

standard モードでは、`AND` はマッチした行の集合の積集合、`OR` は和集合を取り、`NOT` はクエリから見える行に対する補集合を取ります。したがって、`SEARCH('NOT a:hit')` と `NOT SEARCH('a:hit')` はどちらも NULL の行を含みます。Lucene モードでも NULL はマッチしませんが、ブール演算の解析には後述する独自の規則を使用します。`score()` の計算やクエリキャッシュの使用によって、マッチする行の集合全体は変わりません。ソートや LIMIT によって、返される行は変わることがあります。

通常の SQL 比較と `MATCH` 演算子には、SQL の三値論理が適用されます。入力が NULL の場合、`a != 'hit'` と `NOT (a MATCH_ANY 'hit')` は UNKNOWN となり、`WHERE` によって除外されます。外側の SQL 式では、NULL を許容するほかのオペランドによって UNKNOWN が生じることもあります。

#### 例：NULL と NOT {#example-null-and-not}

CREATE、INSERT、SELECT の権限があるデータベースで、以下の例を実行してください。以下の単一バケットと単一レプリカは、小規模なデモ用テーブルの設定です。

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

NULL の行も除外するには、`IS NOT NULL` フィルターを明示的に追加します：

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

この三行では、SQL 条件 `a != 'hit'` とテキスト検索条件 `NOT (a MATCH_ANY 'hit')` も、id 2 の行だけを返します。

#### VARIANT：NULL、存在しないパス、使用できないインデックス {#variant-null-missing-paths-and-unavailable-indexes}

`v.a:hit` のような通常の VARIANT の単語にも、同じ規則が適用されます：

| `v` に書き込んだ値 | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}`（パス `a` が存在しない） | FALSE | TRUE |
| SQL NULL（VARIANT 列全体が NULL） | FALSE | TRUE |

配列の外にある保存済みオブジェクトでは、JSON `null` のメンバーは削除されます。そのため、そのパスを読み取ると、メンバーが存在しない場合と同様に SQL NULL が返ります。これは式の中で計算された JSON `null` とは異なります。詳しくは [VARIANT の NULL セマンティクス](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics)を参照してください。

JSON オブジェクトの挿入には `parse_to_variant` を使用します。次のテーブルでは doc モードを無効にし、実行可能なインデックスを持つマテリアライズ済みサブパスを例で使用できるようにしています。

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

`NOT SEARCH('v.a:hit')` も同じ id を返します。あるパスがすべての行で存在しない場合、`SEARCH('v.absent:hit')` は行を返さず、`SEARCH('NOT v.absent:hit')` は全行を返します。対象パスの値が NULL でない行だけを残すには、SEARCH の外側に `v['a'] IS NOT NULL` を追加します。

**パスが存在しない状態と、インデックスを使用できない状態は異なります。** パスにデータがあっても、必要な転置インデックスを実行できない場合、SEARCH は `SEARCH index unavailable for Variant field 'v.a'` を報告します。否定クエリでも同様です。たとえば、CREATE INDEX 後にインデックスがまだ構築されていない過去の rowset や、実行可能なリーフインデックスがなく doc ストレージにのみ保持されているパスが該当します。SEARCH はこれらの状態をマッチする行がない状態として扱わず、スキャンにも自動的に切り替えません。クエリ対象のすべてのデータで必要なパスのインデックスを使用できるようにするか、抽出したパスを通常の SQL でクエリしてください。

## シナリオ別の SEARCH の使い方 {#using-search-by-scenario}

### シナリオ 1：単一単語のマッチング {#scenario-1-single-term-match}

**用途：** フィールドに特定の単語を含むドキュメントを検索します。

- **構文：** `column:term`
- **動作：** 列のトークン化結果に対して単語をマッチングします。大文字と小文字を区別するかどうかは、インデックスの `lower_case` プロパティによって決まります
- **推奨インデックス：** 適切な `parser`/`analyzer` を設定した転置インデックスを列に作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### シナリオ 2：複数単語の OR マッチング（ANY） {#scenario-2-multi-term-or-match-any}

**用途：** タグのマッチングやキーワードを組み合わせた検索など、候補の単語のいずれかにマッチすればよい場合に使用します。

- **構文：** `column:ANY(term1 term2 ...)`
- **動作：** 列のトークン化結果にリスト内の単語がいずれか含まれていればマッチします（OR の動作）。順序は問いません。重複する単語は無視されます
- **推奨インデックス：** 列にトークン化する転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### シナリオ 3：複数単語の AND マッチング（ALL） {#scenario-3-multi-term-and-match-all}

**用途：** トピックを厳密に絞り込む場合など、複数の単語すべてにマッチする必要がある場合に使用します。

- **構文：** `column:ALL(term1 term2 ...)`
- **動作：** 列のトークン化結果にリスト内のすべての単語が同時に含まれていればマッチします（AND の動作）。順序は問いません。重複する単語は無視されます
- **推奨インデックス：** 列にトークン化する転置インデックス（`english`/`chinese`/`unicode` など）を作成します

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### シナリオ 4：ブール演算を組み合わせたクエリ {#scenario-4-boolean-combination-query}

**用途：** 「A を含み、B を含まない」など、複数の条件を AND/OR/NOT で組み合わせます。

- **構文：** `(expr) AND/OR/NOT (expr)`
- **動作：** SEARCH 内で `AND`、`OR`、`NOT` を使って部分式を組み合わせます
- **推奨インデックス：** インデックスへのプッシュダウンを利用するため、マッチング可能な条件はできるだけ SEARCH 内に記述します。追加の絞り込みには、ほかの WHERE 条件を使用します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### シナリオ 5：複雑な入れ子の式 {#scenario-5-complex-nested-expressions}

**用途：** 括弧でブール演算の優先順位を制御し、複数階層に入れ子になったフィルター条件を作成します。

- **構文：** `(expr1 OR expr2) AND expr3` のように、括弧で式をグループ化します
- **動作：** 括弧でブール演算の優先順位を制御します。複数階層の入れ子に対応しています
- **推奨インデックス：** ブール演算を組み合わせたクエリと同じです

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### シナリオ 6：Lucene/Elasticsearch 構文との互換性 {#scenario-6-luceneelasticsearch-syntax-compatibility}

**用途：** Elasticsearch から移行する場合や、Lucene の query_string セマンティクスに従って式を記述したい場合に使用します。

Lucene モードは、Elasticsearch/Lucene の query_string の動作を再現します。ブール演算子は従来のブール代数ではなく、左から右へ適用される修飾子として機能します。

**standard モードとの主な違い：**

- AND/OR/NOT は隣接する単語に作用する修飾子です
- 演算子は左から右へ適用されます
- 内部では MUST/SHOULD/MUST_NOT が使用されます（Lucene の Occur enum に類似）
- NOT のみのクエリでは、すべてにマッチする条件を追加してから、マッチした行を除外します

**Lucene モードを有効にする方法：**

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
| `NOT a` | ¬a | a を除くすべてのドキュメントにマッチ（`-a`） |
| `a AND NOT b` | a ∩ ¬b | +a -b（a は MUST、b は MUST_NOT） |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c（a のみ MUST） |

> **注：** Lucene モードでは、`a AND b OR c` は左から右へ解析されます。OR 演算子によって `b` が MUST から SHOULD に変わります。SHOULD 句のマッチを必須にするには、`minimum_should_match` を使用します。

### シナリオ 7：フレーズクエリ {#scenario-7-phrase-query}

**用途：** 「machine learning」がこの順序で現れることを要求する場合など、連続した順序どおりのフレーズを検索します。

- **構文：** `column:"quoted phrase"`
- **動作：** 列の analyzer に従い、連続した順序どおりの単語にマッチします。フレーズ全体を二重引用符で囲む必要があります
- **推奨インデックス：** 対象列には、位置情報を保持する、トークン化する転置インデックスを使用する必要があります（`parser` で設定）

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### シナリオ 8：複数列を横断する検索 {#scenario-8-combined-search-across-multiple-columns}

**用途：** タイトル、タグ、著者のいずれかにマッチする行を返す場合など、単一のクエリで複数のフィールドを検索します。

- **構文：** `column1:term OR column2:ANY(...) OR ...`
- **動作：** 単一の式内で複数列を横断してマッチングします。各列には、それぞれのインデックスと tokenizer の設定が適用されます
- **推奨インデックス：** 検索に使う各列に適切な転置インデックスを作成します

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### シナリオ 9：ワイルドカードクエリ {#scenario-9-wildcard-query}

**用途：** 「Chris」で始まる名前をすべて検索する場合など、前方一致、後方一致、部分一致に使用します。

- **構文：** `column:prefix*`、`column:*mid*`、`column:?ingle`
- **動作：** `*` は任意の長さの文字列に、`?` は単一の文字にマッチします
- **推奨インデックス：** トークン化しないインデックスに適しています。`lower_case` を有効にした、トークン化するインデックスでも使用でき、その場合は大文字と小文字を区別せずにマッチングできます

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### シナリオ 10：正規表現クエリ {#scenario-10-regular-expression-query}

**用途：** Lucene 形式の正規表現で複雑なパターンマッチングを行います。

- **構文：** `column:/regex/`
- **動作：** スラッシュで囲んだ Lucene 形式の正規表現を使用してマッチングします
- **推奨インデックス：** トークン化しない転置インデックスのみサポートされます

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### シナリオ 11：厳密な等価マッチング（EXACT） {#scenario-11-strict-equality-match-exact}

**用途：** 列の元の値全体に厳密にマッチさせます。大文字と小文字を区別し、トークン化は行いません。

- **構文：** `column:EXACT(text)`
- **動作：** 列の値全体に対して厳密にマッチングします。大文字と小文字を区別し、部分的な単語にはマッチしません
- **推奨インデックス：** EXACT を高速化するため、同じ列にトークン化しない転置インデックスも作成します（`parser` は設定しません）

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### シナリオ 12：VARIANT サブカラムのクエリ {#scenario-12-variant-subcolumn-query}

**用途：** 半構造化された VARIANT フィールド内の特定のサブパスを検索します。

- **構文：** `variant_col.sub.path:term`
- **動作：** ドットで区切ったパスを使用して VARIANT サブカラムにアクセスし、マッチングします。マッチングの動作は VARIANT 列のインデックスと analyzer の設定に従います
- **サポートされる機能：** ブール演算の組み合わせ、`ANY`/`ALL`、入れ子のパス。存在しないサブカラムにはマッチしません

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 一通りの例 {#complete-example}

次の例では、同じ列にトークン化するインデックスとトークン化しないインデックスの両方を作成し、EXACT、ANY/ALL、フレーズ、ワイルドカードのクエリを組み合わせる方法を示します。

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

### EXACT クエリとトークン化するクエリの比較 {#comparing-exact-and-tokenized-queries}

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
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="2048")>,
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

バックスラッシュ（`\`）を使用して、DSL 内の特殊文字をエスケープします：

| エスケープ | 説明 | 例 |
| --- | --- | --- |
| `\ ` | リテラルの空白（単語を結合） | `title:First\ Value` は「First Value」にマッチします |
| `\(` `\)` | リテラルの括弧 | `title:hello\(world\)` は「hello(world)」にマッチします |
| `\:` | リテラルのコロン | `title:key\:value` は「key:value」にマッチします |
| `\\` | リテラルのバックスラッシュ | `title:path\\to\\file` は「path\to\file」にマッチします |

**例：**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **注：** SQL 文字列では、バックスラッシュを二重にエスケープする必要があります。SQL で `\\` を使用すると、DSL では単一の `\` になります。

## 現在の制限事項 {#current-limitations}

- 範囲句とリスト句（`field:[a TO b]` や `field:IN(...)` など）は、引き続き通常の単語マッチングにフォールバックします。代わりに、通常の SQL の範囲フィルターまたは `IN` フィルターを使用してください。

代わりに、標準の演算子やテキスト検索演算子を使用できます：

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## 複数フィールドのオプションの例 {#multi-field-options-example}

`fields` と `type` は Doris 4.1.0 で使用できます。`standard` モードでは、`best_fields` はクエリ全体を各フィールドに適用し、それらを OR で結合します。`cross_fields` は各単語を複数のフィールドに展開します。以下の「同じフィールド内」と「複数のフィールドを横断」の違いは、`AND` または `default_operator="and"` を使用した場合のものです。デフォルトの OR 演算子にもこの違いが当てはまると想定しないでください。`lucene` モードでは句ごとに展開するため、以下の standard モードでの AND の比較は Lucene の動作を説明するものではありません。

CREATE、INSERT、SELECT の権限があるデータベースに、次のデータを準備します：

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

否定句のみを含む Lucene クエリでは、すべてにマッチする条件を追加してから、否定された単語を除外します：

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
