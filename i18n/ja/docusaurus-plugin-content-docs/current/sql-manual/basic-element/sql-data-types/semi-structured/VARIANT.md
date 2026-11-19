---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT は半構造化 JSON を格納します。書き込みと解析の規則、CAST、NULL の意味、順序、Schema Template、ALTER、プロパティ、インデックス、制限を説明します。"
}
---

## 概要 {#overview}

VARIANT 型は、オブジェクト、配列、文字列、数値、ブール値、`null` を含む半構造化 JSON データを格納します。書き込み時に Doris は各 JSON パスの型を推論し、頻出するパスに Subcolumnization を適用して、独立した列形式のサブカラムとして格納します。そのパスを参照するクエリは、必要なサブカラムだけを読み取ります。

:::tip VARIANT を使う理由
ドキュメントの構造が時間とともに変わっても、クエリが少数の頻繁に使うパスに集中する場合、`VARIANT` が適しています。

- 頻繁に使うパスには Subcolumnization が適用されるため、列形式の性能、ファイルの枝刈り、ベクトル化実行の利点を得られます。
- 重要なパスにはパス単位のインデックスと全文検索を利用でき、Doris のスパースインデックスによる枝刈りも引き続き利用できます。
- ワイドカラム向けの最適化により、サブカラムが 10k 規模でも自動的な Subcolumnization を実用的に使えます。ただし、Subcolumnization の対象パスが 10,000 に近づくとハードウェア要件が急激に高くなるため、通常は DOC mode から検討するほうが安全です。

デフォルトの動作、スパースカラム、DOC mode、Schema Template のいずれを使うか決めるには、まず [Variant Workload Guide](./variant-workload-guide.md) を参照してください。このページは、書き込みと解析、型の規則、CAST、NULL と比較の意味、ALTER、インデックス、制限、設定のリファレンスです。
:::

:::info バージョン
このページでは Doris 5.0.0 以降の VARIANT を説明します。既存の SQL に影響しやすい Doris 4.x からの変更点は次のとおりです。

- `INSERT` は文字列を JSON として解析せず、VARIANT 文字列として格納します。`s3()` や `hdfs()` などのテーブル関数から `INSERT INTO ... SELECT` する場合も同様です。`INSERT` で JSON テキストを書き込むには `PARSE_TO_VARIANT` を使用してください。Stream Load などのデータロードジョブは引き続き JSON を解析します。
- VARIANT 値全体で `GROUP BY`、`DISTINCT`、集合演算を使用できます。2 つの VARIANT 値は `=`、`!=`、`<=>` で比較でき、結合キー、`ORDER BY` キー、ウィンドウキーにも使用できます。
- `VARIANT_TYPE` はパスから型へのマップではなく、`object` などの型名を 1 つ返します。
- VARIANT 配列は 1 から始まる整数のインデックスで参照できます。

Doris 4.x については、このページの 4.x 版を参照してください。
:::

## クイックスタート {#quick-start}

```sql
CREATE TABLE events (
    id BIGINT,
    v  VARIANT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- INSERT keeps a string literal as a VARIANT string, so parse JSON text explicitly.
INSERT INTO events VALUES
    (1, PARSE_TO_VARIANT('{"user": {"id": 42, "name": "alice"}, "tags": ["doris", "sql"], "score": 9.5}')),
    (2, PARSE_TO_VARIANT('{"user": {"id": 7, "name": "bob"}, "score": 3}'));

SELECT id,
       CAST(v['user']['name'] AS STRING) AS name,
       v['tags'][1] AS first_tag
FROM events
WHERE CAST(v['score'] AS DOUBLE) > 5;
```

```text
+------+-------+-----------+
| id   | name  | first_tag |
+------+-------+-----------+
|    1 | alice | doris     |
+------+-------+-----------+
```

- `v['user']['name']` と `v['tags'][1]` は `VARIANT` 値を返します。配列のインデックスは 1 から始まります。
- パスを比較や計算に使用する前に、CAST で具体的な型に変換してください。
- Stream Load などのデータロードジョブは JSON テキストを自動的に解析します。「[データの書き込み](#write-data)」を参照してください。

## VARIANT カラムの定義 {#define-a-variant-column}

```sql
column_name VARIANT
column_name VARIANT< field_definition [, field_definition ...] >
column_name VARIANT< properties('key' = 'value' [, ...]) >
column_name VARIANT< field_definition [, ...], properties('key' = 'value' [, ...]) >

field_definition:
    [MATCH_NAME | MATCH_NAME_GLOB] 'path_or_pattern' : data_type [COMMENT 'comment']
```

- `field_definition` のリストが [Schema Template](#schema-template) です。選択したパスの格納型を固定します。
- `properties(...)` はカラム単位のストレージプロパティを設定します。「[カラムプロパティ](#column-properties)」を参照してください。
- VARIANT カラムには `NULL` または `NOT NULL` を指定できます。指定できるデフォルト値は `NULL` だけです。
- 最上位の VARIANT カラム名には、バッククォートで囲んだ場合でもドット（`.`）を含められません。たとえば `` `v.x` VARIANT `` は無効です。この制限は `CREATE TABLE` と `ALTER TABLE` に適用されますが、VARIANT 値内の JSON フィールド名には適用されません。

```sql
CREATE TABLE IF NOT EXISTS example_tbl (
    k BIGINT,
    v VARIANT<
        'id' : INT,             -- path id is stored as INT
        'message*' : STRING,    -- paths matching message* are stored as STRING
        'tags*' : ARRAY<TEXT>,  -- paths matching tags* are stored as ARRAY<TEXT>
        properties('variant_max_subcolumns_count' = '2048')
    > NULL
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

テーブル内で VARIANT カラムを使用できる範囲は次のとおりです。

| 用途 | サポート | 備考 |
| --- | --- | --- |
| Duplicate Key、Unique Key、Aggregate Key テーブルの値カラム | 可 | Aggregate Key テーブルでは、集約型は `REPLACE` または `REPLACE_IF_NOT_NULL` である必要があります。 |
| キーカラム、パーティションカラム、バケットカラム | 不可 | |
| テーブルスキーマ内で別の型にネストすること（`ARRAY<VARIANT>`、`MAP`、`STRUCT`） | 不可 | `COLLECT_LIST(v)` などのクエリ結果は `ARRAY<VARIANT>` にできます。 |
| デフォルト値 | `NULL` のみ | `DEFAULT '{}'` など、NULL 以外のデフォルト値は拒否されます。 |

## データの書き込み {#write-data}

`INSERT` と `CAST` は文字列を VARIANT 文字列として保持します。`PARSE_TO_VARIANT`、`TRY_PARSE_TO_VARIANT`、Stream Load などのデータロードジョブは JSON テキストを解析します。データロードの例は「[VARIANT データのロード](../../../../data-operate/import/complex-types/variant.md)」を参照してください。

### 解析エラー {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)、[TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)、データロードジョブは同じ JSON パーサーを使用します。データロードジョブのエラー処理は `TRY_PARSE_TO_VARIANT` と同じです。

| 入力 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` とデータロードジョブ |
| --- | --- | --- |
| 有効な JSON | 解析された値 | 解析された値 |
| `hello` や `{"id":` など、有効な JSON ではないテキスト | VARIANT 文字列として保持 | VARIANT 文字列として保持 |
| `{"a": 1, "n": 100000000000000000000}` など、[-2^63, 2^64 - 1] の範囲外の整数または `DOUBLE` の範囲外の数値を含む JSON | テキスト全体を VARIANT 文字列として保持するため、`v['a']` は `NULL` を返す | テキスト全体を VARIANT 文字列として保持 |
| 空文字列 | 空のオブジェクト `{}` | 空のオブジェクト `{}` |
| ネストが 128 階層を超える場合 | エラー | SQL `NULL` |
| オブジェクトのキーが `variant_max_json_key_length` バイトを超える場合（BE 設定、デフォルト 255） | エラー | SQL `NULL` |
| 1 つのオブジェクト内の重複キー | エラー | SQL `NULL` |
| 有効な UTF-8 ではない文字列 | エラー | SQL `NULL` |

JSON パーサー自体が拒否するほど深くネストされたドキュメント（約 1,000 階層）は無効な JSON と見なされ、文字列として保持されます。

次の 2 つの BE 設定で、これらの規則が変わります。

- `variant_throw_exeception_on_invalid_json`（デフォルト `false`）：`true` の場合、範囲外の数値を含む JSON など、パーサーが拒否したテキストは VARIANT 文字列になりません。`PARSE_TO_VARIANT` ではエラー、`TRY_PARSE_TO_VARIANT` とデータロードジョブでは SQL `NULL` になります。
- `variant_enable_duplicate_json_path_check`（デフォルト `false`）：`true` の場合、オブジェクト内で重複したキーはエラーにならず、最初の値が保持されます。ドットを含むキーがネストされたパスと重複する場合も書き込みは失敗せず、いずれか一方の値だけが格納されます。

範囲外の整数を含むドキュメントを構造化された値として保持するには、JSON を経由して変換します：`CAST(CAST(text AS JSON) AS VARIANT)`。38 桁までの整数は正確な数値として保持され、それより大きく `LARGEINT` の範囲内にある整数は文字列に、さらに大きな整数は `DOUBLE` になります。`PARSE_TO_VARIANT(CAST(text AS JSON))` は JSON テキストを再び解析するため、この問題の解決にはなりません。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### ストレージに保持される値 {#what-storage-keeps}

テーブルへの書き込み時に値は正規化されます。読み戻した値は、書き込み前に計算された値と異なる場合があります。

| 書き込み前 | テーブルから読み戻した値 |
| --- | --- |
| `{"a": null, "b": 1}` など、値が JSON `null` のオブジェクトメンバー | メンバーが削除され、`{"b":1}` になります。`v['a']` は SQL `NULL` を返します。 |
| `{"a": {}, "b": [], "c": {"d": null}}` など、値が空のオブジェクトや配列であるメンバー、またはこれらの規則によって空になるオブジェクト | 削除され、`{}` になります。 |
| `{"p": [null, null], "q": 1}` など、配列の要素が `null` だけのオブジェクトメンバー | 削除され、`{"q":1}` になる場合があります。 |
| `{"arr": [{"a": null}, {}, [], null]}` など、配列内の値 | そのまま保持されます。`v['arr'][1]['a']` は VARIANT `null` です。 |
| `PARSE_TO_VARIANT('null')` など、ルートの JSON `null` | 空のオブジェクト `{}` |
| ルートの空配列 `[]` または空オブジェクト `{}` | 保持されます。 |
| `CAST(date_col AS VARIANT)` など、ルート値の `DATE` と `DATETIME`、または他の型の値も含むパス上の日付 | テキストとして格納され、文字列として読み戻されます。日付だけを含むオブジェクトのパスでは型が保持されます。 |
| 同じパスに混在するブール値と数値 | 同じ書き込み内での値の順序やコンパクションによって、ブール値が `1` または `0` として読み戻される場合があります。 |
| `{"a.b": 1}` など、ドットを含むキー | ネストされたパス `{"a":{"b":1}}` として格納されます。`v['a.b']` と `v['a']['b']` はどちらも `1` を返します。キー `a.b` と、`a` の中のキー `b` を同時に含むドキュメントは、`variant_enable_duplicate_json_path_check` が `true` でない限り、INSERT 全体またはデータロードジョブ全体が失敗します。 |
| オブジェクトのキー | バイト順で返されます。 |

これらの規則は、同時に書き込まれる他の行や DOC mode にも依存します。`null` 値や空のコンテナーが書き込み後も残ることを前提にしないでください。Schema Template で宣言されたパスは、代わりに宣言された型へ変換されます。「[Schema Template](#schema-template)」を参照してください。

## 型推論と型の競合 {#type-inference-and-type-conflicts}

Schema Template がない場合、Doris は JSON の解析時に各値の型を推論します。`VARIANT_TYPE` はその型を返します。

| JSON 値 | 型 |
| --- | --- |
| `BIGINT` の範囲内の整数 | 値を格納できる最小の `tinyint`、`smallint`、`int`、`bigint` |
| `BIGINT` の範囲を超え、18446744073709551615 以下の整数 | `decimal` |
| 小数部分または指数を持つ数値 | `double` |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値 | 数値になりません。テキスト全体が無効な JSON になります（「[解析エラー](#parse-errors)」を参照）。 |
| 文字列 | `string` |
| `true`、`false` | `bool` |
| `null` | `null` |
| 配列、オブジェクト | `array`、`object` |

データを格納するとき、各パスには 1 つの格納型が割り当てられます。

- 整数は `BIGINT` として、必要な場合は `LARGEINT` として格納されます。浮動小数点数は `DOUBLE`、十進数は `DECIMAL`、文字列は `STRING`、ブール値は `BOOLEAN`、スカラーの配列は `ARRAY<T>` として格納されます。
- オブジェクトの配列、ネストされた配列、整数と浮動小数点数、数値と文字列、スカラーと配列など、異なる型の値を持つパスは `JSONB` として格納されます（`DESC` では `json` と表示）。要素の型が競合する配列は `ARRAY<JSONB>` になります。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

`JSONB` パスはすべての値を保持しますが、型付きストレージではなくなるため、そのパスにはインデックスと型に基づく枝刈りが適用されません。ブール値は例外です。パス上の最初の値がブール値で、後の値が数値の場合、パスが数値として格納され、ブール値が `1` または `0` として読み戻されることがあります。安定した型が必要なパスは Schema Template で宣言してください。

`VARIANT_TYPE` は各値の型を報告するため、`BIGINT` パスから読み取った整数でも `tinyint` になる場合があります。各パスの格納型を確認するには、`SET describe_extend_variant_column = true;` を実行してから `DESC table_name;` を実行します。「[サブカラムと型の確認](#inspect-subcolumns-and-types)」を参照してください。

## パスへのアクセスと出力 {#access-paths-and-output}

- `v['key']` と `v['a']['b']` はオブジェクトのメンバーを読み取ります。`v['arr'][1]` は配列要素を読み取ります。インデックスは 1 から始まり、`-1` は最後の要素です。[ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) も同じ動作です。
- 結果は `VARIANT` 値です。存在しないキー、インデックス `0`、範囲外のインデックス、配列に対する文字列キー、オブジェクトに対する整数インデックス、スカラー値に対するキーは、いずれも SQL `NULL` を返します。
- 計算された値では、ドットを含むキーは 1 つのキーです。`v['a.b']` はキー `a.b` を読み取り、`v['a']['b']` は `a` 内の `b` を読み取ります。ストレージではこの区別は保持されません。「[ストレージに保持される値](#what-storage-keeps)」を参照してください。
- パスは配列の各要素に自動適用されません。`{"a": [{"b": 1}]}` の場合、`v['a']['b']` は `NULL` を返します。`v['a'][1]['b']` を使用してください。

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

通常は、クエリに必要な型へパスを CAST します。

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

VARIANT 値全体を読み取ると JSON テキストが返されます。オブジェクトのキーはバイト順で、空白なしで返されるため、入力とバイト単位では一致しません。ルートの文字列は引用符なしで返されます。

```sql
CREATE TABLE variant_tbl (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, PARSE_TO_VARIANT('{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }'));

SELECT v FROM variant_tbl WHERE k = 1;
-- {"a":1,"b":2,"c":{"x":10,"y":20}}
```

## CAST {#cast}

### VARIANT への CAST {#cast-to-variant}

| 変換元の型 | 結果 |
| --- | --- |
| `CHAR`、`VARCHAR`、`STRING` | VARIANT 文字列。JSON テキストは解析されません。文字列は有効な UTF-8 である必要があり、そうでなければ CAST は失敗します。 |
| `BOOLEAN` | ブール値。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT` | 整数。 |
| `LARGEINT` | 十進数。絶対値が 10^38 - 1 を超える値は文字列になります。 |
| `FLOAT`、`DOUBLE` | 浮動小数点数。 |
| `DECIMALV2`、`p <= 38` の `DECIMAL(p, s)` | 十進数。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付、またはタイムゾーンのないタイムスタンプ。 |
| `IPV4`、`IPV6` | 値のテキスト表現を持つ文字列。 |
| `JSON` / `JSONB` | 同じ構造。`DECIMAL256` の数値など VARIANT で保持できない値や、オブジェクト内の重複キーがあると CAST は失敗します。 |
| `ARRAY<T>` | 各要素を変換した配列。`T` は `VARIANT` またはこの表に記載された型である必要があります。 |
| `MAP`、`STRUCT`、`TIME`、`TIMESTAMPTZ`、`VARBINARY`、その他の型 | サポートされず、ステートメントが失敗します。 |

変換元の値は、元の型としても有効でなければなりません。無効な値は修正されず、拒否されます。CAST は文字列を解析しません。`CAST('{"id": 1}' AS VARIANT)` は文字列 `{"id": 1}` になります。JSON テキストの解析には `PARSE_TO_VARIANT` を使用してください。

### VARIANT からの CAST {#cast-from-variant}

| 変換先の型 | 結果 |
| --- | --- |
| `BOOLEAN` | ブール値はそのままです。数値はゼロ以外なら `true` です。文字列は `CAST(string AS BOOLEAN)` と同じ規則で変換されます。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 整数。十進数または浮動小数点数の小数部分は切り捨てられます（`1.5` は `1`）。ブール値は `1` または `0` になります。`"123"` などの数値文字列も変換されます。 |
| `FLOAT`、`DOUBLE`、`DECIMAL(p, s)` | 数値と数値文字列。`DECIMAL` はスケール `s` に丸めます。`FLOAT` の範囲を超える値は `Infinity` になります。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付と時刻の値、日付または時刻の形式の文字列、および `20240102` などの数値。 |
| `TIMESTAMPTZ(p)` | 日付と時刻の値、および日付または時刻の形式の文字列。 |
| `IPV4`、`IPV6` | IP アドレス形式の文字列。 |
| `CHAR`、`VARCHAR`、`STRING` | ルートの文字列は引用符なしでそのまま返されます。オブジェクトと配列は JSON テキストとして返されます。他のスカラーは対応する SQL 型と同じ形式です。ルートのブール値は `1` または `0`、`DATETIME` 値の小数部は 6 桁、`TIMESTAMP_NS` 値の小数部は 9 桁になります。VARIANT `null` は文字列 `null` になります。 |
| `JSON` / `JSONB` | 同じ構造。日付やタイムスタンプなど、JSON に対応する型がない値は JSON 文字列になります。タイムゾーン付きタイムスタンプはセッションのタイムゾーンで整形されます。 |
| `ARRAY<T>` | 要素ごとに変換された配列。変換できない要素は `NULL` になります。`"[1, 2]"` など、JSON 配列を含む文字列も変換されます。それ以外の値は `NULL` を返します。 |
| `MAP`、`STRUCT`、`TIME`、その他の型 | サポートされず、ステートメントが失敗します。 |

変換先の型に変換できない値は、`enable_strict_cast` が有効でも SQL `NULL` を返します。ただし、数値から `TIMESTAMPTZ`、`IPV4`、`IPV6` への変換や、日付またはタイムスタンプから `BOOLEAN` への変換のように、値の型から変換先の型への変換自体が存在しない場合、ステートメントは失敗します。

```sql
SELECT CAST(PARSE_TO_VARIANT('"123"') AS INT)      AS from_string,   -- 123
       CAST(PARSE_TO_VARIANT('"abc"') AS INT)      AS not_a_number,  -- NULL
       CAST(PARSE_TO_VARIANT('1.5') AS INT)        AS truncated,     -- 1
       CAST(PARSE_TO_VARIANT('300') AS TINYINT)    AS overflow,      -- NULL
       CAST(PARSE_TO_VARIANT('{"a": 1}') AS INT)   AS from_object,   -- NULL
       CAST(PARSE_TO_VARIANT('[1, "2", null, "x"]') AS ARRAY<INT>) AS arr;  -- [1, 2, null, null]

SELECT CAST(PARSE_TO_VARIANT('true') AS STRING)        AS bool_root,     -- 1
       CAST(PARSE_TO_VARIANT('{"b": true}') AS STRING) AS object_text,   -- {"b":true}
       CAST(PARSE_TO_VARIANT('"abc"') AS STRING)       AS string_root,   -- abc
       CAST(PARSE_TO_VARIANT('null') AS STRING)        AS variant_null;  -- null
```

### Decimal と日付・時刻の値 {#decimal-and-datetime-values}

これらの型を VARIANT に変換する場合の動作は次のとおりです。

| Doris の型 | 動作 |
| --- | --- |
| 従来の `DECIMALV2` | 精度が最大 27、スケールが最大 9 の値は正確に保持されます。 |
| `DECIMAL(p, s)` | `1 <= p <= 38` かつ `0 <= s <= p` の値は正確に保持されます。精度が 38 を超える十進数はサポートされません。 |
| `DATE` | 時刻とタイムゾーンを含まない暦日。 |
| `DATETIME(p)` | `0 <= p <= 6`。タイムゾーンによる調整はありません。 |
| `TIMESTAMP_NS` | タイムゾーンによる調整のないナノ秒精度。値は TIMESTAMP_NS の範囲内にある必要があります。 |
| `TIMESTAMPTZ(p)` | CAST でも Schema Template のパスとしてもサポートされません。 |
| `TIME` | サポートされません。 |

## NULL の意味 {#null-semantics}

VARIANT には 2 種類の null があります。

- **SQL `NULL`** は値がないことを意味します。カラム値が `NULL` の場合、`v['no_such_key']` のような存在しないパス、または失敗した CAST から生じます。
- **VARIANT `null`** は値です。`PARSE_TO_VARIANT('null')` や配列内の `null` 要素など、JSON リテラルの `null` に対応します。`VARIANT_TYPE` は `null` を返します。

| 操作 | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| VARIANT の `x` を指定した `COALESCE(v, x)`、`IFNULL(v, x)` | `x` を返す | VARIANT `null` を返す |
| `COUNT(v)` | カウントされない | カウントされる |
| `GROUP BY v`、`DISTINCT` | すべての SQL `NULL` 値が 1 つのグループになる | すべての VARIANT `null` 値が別のグループになる |
| `v = x`、等値結合 | 一致しない | 別の VARIANT `null` と一致する |
| `ORDER BY v` | `NULLS FIRST` または `NULLS LAST` に従って配置される | 昇順では、NULL 以外のすべての値より前に配置される |
| `CAST(v AS STRING)` | SQL `NULL` | 文字列 `null` |

値の格納後、配列の外にあるオブジェクトの `null` メンバーは削除されるため、読み取ると SQL `NULL` が返されます。ルートの `null` は `{}` として読み戻されます（「[ストレージに保持される値](#what-storage-keeps)」を参照）。したがって、格納済みデータに対する `v['a'] IS NULL` では、メンバーが存在しない場合と `null` の場合を区別できません。

## 比較、グループ化、順序付け {#comparison-grouping-and-ordering}

VARIANT 値は、テキストや物理的なエンコードではなく、論理値で比較されます。等値判定、ハッシュ処理（`GROUP BY`、`DISTINCT`、結合）、順序付け（`ORDER BY`、ウィンドウキー）には同じ規則が使われます。そのため、等しい値は必ず同じグループに入り、並べ替えでも同順位になります。

### サポートされる操作 {#supported-operations}

| VARIANT 値に対する操作 | サポート | 備考 |
| --- | --- | --- |
| 2 つの VARIANT 値の間、または `NULL` リテラルとの `=`、`!=`、`<=>` | 対応 | `v['a'] = w['a']` などのサブパスも含みます。 |
| 等値結合、セミ結合とアンチ結合、`IN` と `NOT IN` のサブクエリ | 対応 | VARIANT の結合キーにはランタイムフィルターが生成されません。 |
| `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`UNION`、`INTERSECT`、`EXCEPT` | 対応 | |
| `ORDER BY`、`ORDER BY ... LIMIT` | 対応 | |
| ウィンドウの `PARTITION BY` と `ORDER BY` | 対応 | |
| `COUNT(v)`、`COLLECT_LIST(v)`、`ARRAY_AGG(v)` | 対応 | |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 対応 | VARIANT と別の型を混在させると、VARIANT 値は別の型に変換されます。その型が整数なら `DECIMAL(38, 9)` です。変換できない値は `NULL` になります。 |
| `CAST(v AS ARRAY<VARIANT>)`、`EXPLODE_VARIANT_ARRAY`、`ARRAY<VARIANT>` に対する `EXPLODE` と `EXPLODE_OUTER` | 対応 | |
| VARIANT 値同士の `<`、`<=`、`>`、`>=`、`BETWEEN` | 非対応 | 先に具体的な型へ CAST してください。 |
| `v = 1` など、VARIANT 値全体と VARIANT 以外の値との比較 | 非対応 | サブパスは暗黙的に変換されるため、`v['a'] = 1` は使用できます。 |
| `v IN (PARSE_TO_VARIANT('1'))` など、VARIANT 値を含む `IN` リスト | 非対応 | VARIANT 以外の値を使う `v IN ('a', 'b')` は暗黙的な変換により使用できます。 |
| `MIN`、`MAX` | 非対応 | 先にサブパスを CAST してください。 |
| VARIANT 引数を指定した `ARRAY(...)`、`MAP(...)`、`NAMED_STRUCT(...)` | 非対応 | |

### 等値判定 {#equality}

- **数値。** 整数、小数部分がゼロの十進数、値が整数の浮動小数点数は等しく、`1`、`1.0`、`1.00` は同じ値です。十進数の末尾のゼロは影響せず、`-0.0` は `0` と等しくなります。小数部分を持つ十進数と浮動小数点数は等しくならず、`DECIMAL 1.5` は `DOUBLE 1.5` と異なります。小数部分を持つ JSON 数値は `DOUBLE` として解析されます。十進数は CAST、Schema Template のパス、`BIGINT` の範囲を超える整数から生じます。
- **種類が異なる値は等しくなりません。** 数値 `1`、文字列 `"1"`、`true` はそれぞれ異なる値です。`DATE` は文字列 `"2024-01-01"` と等しくなく、タイムゾーンのないタイムスタンプはタイムゾーン付きタイムスタンプと等しくありません。
- **文字列**はバイトが一致するときだけ等しくなります。大文字と小文字は区別されます。
- **オブジェクト**は、同じキーを持ち、対応する値がすべて等しいときに等しくなります。キーの順序は影響しません。
- **配列**は、長さが同じで、同じ位置の要素がすべて等しいときに等しくなります。
- VARIANT `null` は別の VARIANT `null` と等しくなります。SQL `NULL` には SQL の規則が適用されます。

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### 順序付け {#ordering}

VARIANT 値の `ORDER BY` には単一の全順序が使われます。種類が異なる値は、まず次の種類の順に並びます。

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

binary、time、UUID の値は、Doris の JSON 解析や CAST では生成できません。VARIANT カラムを持つ Parquet ファイルなど、他のシステムが書き込んだ VARIANT データからのみ取得できます。

同じ種類の中では、次の規則が適用されます。

- **ブール値：** `false` が `true` より前に並びます。
- **数値：** 整数（`INT`、`BIGINT` など）、十進数（`DECIMAL`）、浮動小数点数（`FLOAT`、`DOUBLE`）は数値の大きさで並びます。`INT 1`、`FLOAT/DOUBLE 1.0`、`DECIMAL 1.00` は等しく、並べ替えでの位置も同じです。十進数の末尾のゼロは影響しません。小数部分を持つ同じ数値では十進数が先に並びます。`DECIMAL 1.5` は `FLOAT/DOUBLE 1.5` より前に並び、VARIANT 値としては等しくありません。浮動小数点の精度も順序に影響します。`DOUBLE 0.1` は `DECIMAL 0.1` よりわずかに大きくなります。負の無限大が最初に、正の無限大と NaN が最後に並びます。
- **文字列：** UTF-8 のバイト順です。大文字は小文字より前に、`"10"` は `"9"` より前に並びます。
- **日付とタイムスタンプ：** 時間順です。すべての日付はすべてのタイムスタンプより前に並びます。
- **オブジェクト：** キーの順にエントリを比較します。最小のキー、その値、次のキーの順に比較します。一方のエントリがもう一方のプレフィックスである場合は短いほうが先に並ぶため、`{"a":1}` < `{"a":1,"b":2}` < `{"b":0}` です。
- **配列：** 要素ごとに比較し、プレフィックスが先に並びます。したがって、`[]` < `[null]` < `[1]` < `[1,2]` です。

SQL `NULL` の位置は `NULLS FIRST` または `NULLS LAST` に従います。

```sql
SELECT v, VARIANT_TYPE(v) AS type
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS v UNION ALL
    SELECT PARSE_TO_VARIANT('{"a": 1}')    UNION ALL
    SELECT PARSE_TO_VARIANT('"9"')         UNION ALL
    SELECT PARSE_TO_VARIANT('"10"')        UNION ALL
    SELECT PARSE_TO_VARIANT('10')          UNION ALL
    SELECT PARSE_TO_VARIANT('9.5')         UNION ALL
    SELECT PARSE_TO_VARIANT('true')        UNION ALL
    SELECT PARSE_TO_VARIANT('null')        UNION ALL
    SELECT NULL
) t
ORDER BY v;
```

```text
+---------+---------+
| v       | type    |
+---------+---------+
| NULL    | NULL    |
| null    | null    |
| true    | bool    |
| 9.5     | double  |
| 10      | tinyint |
| 10      | string  |
| 9       | string  |
| {"a":1} | object  |
| [1,2]   | array   |
+---------+---------+
```

### 型付き比較と VARIANT 比較 {#typed-comparison-and-variant-comparison}

比較に VARIANT の規則と具体的な型の規則のどちらを使うかは、オペランドによって決まります。値が `1`、`1.0`、`"1"` のパス `a` を例にします。

| 式 | 比較に使う型 | 結果 |
| --- | --- | --- |
| `v['a'] = 1` | `v['a']` を暗黙的に CAST した `DECIMAL(38, 9)` | すべての値が一致 |
| `v['a'] = CAST(1 AS VARIANT)`、`v['a'] = w['a']` | VARIANT | `1` と `1.0` が一致し、`"1"` は一致しない |
| `GROUP BY v['a']` | VARIANT | `1` と `1.0` が同じグループ、`"1"` は別のグループ |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | `1` の 1 グループ |
| `ORDER BY v['a']` | VARIANT | 数値が先、文字列が後 |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 数値順。変換できない値は `NULL` になる |

### 補足 {#notes}

- **コスト。** VARIANT キーは論理値でハッシュ処理と比較が行われます。44 million 行のベンチマークでは、VARIANT キーに対する `GROUP BY`、ソート、結合は、`CAST(v['path'] AS <type>)` に対する同じ操作の 1.2～3.7 倍の時間がかかりました。パスの型が既知なら CAST してください。
- **結果は格納後の値に従います。** 「[ストレージに保持される値](#what-storage-keeps)」の正規化は比較前に行われます。`null` だったメンバーは存在しなくなり、ルート値の `DATE` は文字列として比較され、同じパスで数値と混在するブール値は `1` または `0` として読み戻される場合があります。型が重要なパスは Schema Template で宣言してください。
- **混在する型は値ではなく種類で並びます。** パスに数値と数値文字列の両方がある場合、`ORDER BY v['a']` はすべての数値をすべての文字列より前に置き、文字列をバイト順で並べます。数値順または辞書順が必要な場合は、1 つの型に CAST してください。
- **同じように見える値でも異なる場合があります。** `GROUP BY` の結果では、数値 `1` と文字列 `"1"` は同じ表示でも別のグループになります。`VARIANT_TYPE` で違いを確認できます。
- 種類をまたぐ順序は、結果を決定的にするため Doris が定義しています。JSON 標準の一部ではなく、他のシステムとは異なる場合があります。
- VARIANT 値の内部ハッシュは実装の詳細であり、安定したユーザー向けのチェックサムではありません。

## Schema Template {#schema-template}

Schema Template は、選択したパスの格納型を宣言します。安定した型やパス固有のインデックスが必要な重要なパスだけを宣言し、ドキュメントの残りは動的なままにします。

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");
```

テンプレートのフィールドには次の型を使用できます。

- 数値：`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`、および `p <= 38` の `DECIMAL(p, s)`
- `STRING`（または `TEXT`）
- `BOOLEAN`
- `DATE`、`DATETIME(p)`、`TIMESTAMP_NS`
- `IPV4`、`IPV6`
- `ARRAY<T>`。`T` は上記のいずれかの型で、次元は 1 つだけです。

### テンプレートのパスへの書き込み {#writing-to-template-paths}

宣言されたパスでは、各値が非厳格 CAST の規則で宣言型に変換されます。変換できない値は `NULL` として格納されるため、読み戻すとそのパスは存在しません。行の残りの部分は書き込まれます。変換によって値が変わる場合があります。

```sql
CREATE TABLE tpl_demo (
    k INT,
    v VARIANT<'id': INT, 'price': DECIMAL(10, 2), 'ts': DATETIME(3)>
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO tpl_demo VALUES
    (1, PARSE_TO_VARIANT('{"id": "123", "price": 9.999, "ts": "2024-01-01 10:00:00.123456"}')),
    (2, PARSE_TO_VARIANT('{"id": "abc", "price": "x", "ts": "not a time"}')),
    (3, PARSE_TO_VARIANT('{"id": 1.7}'));

SELECT k, v FROM tpl_demo ORDER BY k;
```

```text
+------+------------------------------------------------------------+
| k    | v                                                          |
+------+------------------------------------------------------------+
|    1 | {"id":123,"price":10.00,"ts":"2024-01-01 10:00:00.123000"} |
|    2 | {}                                                         |
|    3 | {"id":1}                                                   |
+------+------------------------------------------------------------+
```

- `"123"` は `123` に、`1.7` は切り捨てられて `1` に、`9.999` は丸められて `10.00` になります。タイムスタンプは宣言された精度（ミリ秒）を保持し、テキスト表現では小数部が常に 6 桁になります。
- `"abc"`、`"x"`、`"not a time"` は変換できないため、削除されます。
- 小数部分を持つ JSON 数値は変換前に `DOUBLE` として解析されるため、`DECIMAL` パスで精度が失われる場合があります。すべての桁を保持するには JSON 文字列として書き込んでください（[FAQ](#faq) を参照）。
- 日付と IP の値は JSON 文字列にする必要があります。`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は有効な JSON ではありません。`{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` を書き込んでください。

:::caution
値の JSON 型から宣言型への変換が存在する場合にのみ、値が変換されます。`IPV4` または `IPV6` のパスに JSON 数値を書き込むと、書き込み全体が失敗します。1 回の書き込みで `DATE`、`DATETIME`、`IPV4`、`IPV6` のパスに JSON 文字列と数値が混在すると、そのパス上の有効な値まで削除される場合があります。これらのパスの値は JSON 文字列として書き込んでください。
:::

### テンプレートのパスの読み取り {#reading-template-paths}

宣言されたパスでも `v['path']` は `VARIANT` 型のままです。Doris は宣言型へ自動的に CAST しません。宣言型が必要なら明示的に CAST してください。フィルターでも宣言型に CAST すると、そのパスのゾーンマップとインデックスをクエリで使用できます。

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template が決めるのは値の格納方法だけです。同じ JSON をクエリ内で計算した場合は、解析で得られた型が保持されます。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### パターンマッチング {#pattern-matching}

フィールド名はデフォルトで glob パターン（`MATCH_NAME_GLOB`）です。`*` はネストされたキー間の `.` を含む任意の文字列に一致し、`?` は 1 文字に一致します。たとえば `'m*'` は `m1` と `m2.x` の両方に一致します。1 つのパスが複数のフィールドに一致した場合は、定義順で最初のフィールドが使用されます。

```sql
CREATE TABLE test_var_pattern (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- enumString1 matches both enumString* and enum*; the first one (STRING) is used.
```

`*` を文字どおりに含む名前に一致させるには、`MATCH_NAME` を使用します。

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

一致したパスには常に Subcolumnization が適用され、`variant_max_subcolumns_count` の数には含まれません。そのため、多数のパスに一致するパターンは避けてください。

カラム作成後に Schema Template は変更できません。「[ALTER TABLE](#alter-table)」を参照してください。

## ALTER TABLE {#alter-table}

`ADD COLUMN`（一括追加を含む）、`MODIFY COLUMN`、`RENAME COLUMN` でも、最上位の VARIANT カラム名にドットを含めることはできません。たとえば、次のステートメントは拒否されます。

```sql
ALTER TABLE example_tbl ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

`ALTER TABLE` でサポートされる操作は次のとおりです。

- Schema Template とプロパティの有無を問わず、NULL を許可する VARIANT カラムの `ADD COLUMN`。
- `DROP COLUMN`、`RENAME COLUMN`、`MODIFY COLUMN ... COMMENT '...'`。
- `ADD INDEX` と `DROP INDEX`。`field_pattern` を指定するインデックスは `CREATE TABLE` でしか定義できません。
- Schema Template のないカラムでは、`NOT NULL` から `NULL` への変更、および `variant_doc_materialization_min_rows` の変更。ただし、バージョン 4.2 より前に作成され、DOC mode を使わず、`variant_max_subcolumns_count = 0` であるカラムでは、この値を `0` のままにする必要があります。`MODIFY COLUMN` には完全なカラム定義が必要です。省略したプロパティはデフォルト値になります（「[カラムプロパティ](#column-properties)」を参照）。デフォルト値と異なるプロパティはすべて再指定してください。

サポートされない操作は次のとおりです。

- `ADD COLUMN ... VARIANT NOT NULL`。`ALTER` で追加する `NOT NULL` カラムにはデフォルト値が必要ですが、VARIANT に指定できるのは `DEFAULT NULL` だけです。`NOT NULL` の VARIANT カラムは `CREATE TABLE` で定義してください。
- 既存カラムへの Schema Template の追加。Schema Template のあるカラムでは、`MODIFY COLUMN` で変更できるのはコメントだけです。同じテンプレートを再指定する場合でも、それ以外の変更は失敗します。
- `variant_doc_materialization_min_rows` 以外のプロパティの変更、`NULL` から `NOT NULL` への変更、VARIANT と他の型との間の変換。
- VARIANT カラムに対する `BUILD INDEX`。

これらの変更が必要な場合は、新しい定義でテーブルを作成し、`INSERT INTO ... SELECT` でデータをコピーしてください。変換元のカラムが `STRING` なら `PARSE_TO_VARIANT` で囲みます。

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## カラムプロパティ {#column-properties}

カラムプロパティは VARIANT 型の内部の `properties(...)` に設定します。

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

| プロパティ | デフォルト | ALTER | 説明 |
| --- | --- | --- | --- |
| `variant_max_subcolumns_count` | `2048` | 不可 | 1 つのデータファイルで Subcolumnization が適用される動的パス数の上限です。NULL 以外の値が多いパスから選ばれ、残りはスパースカラムに格納されます。`0` は動的パスに Subcolumnization を適用せず、すべてスパースカラムに格納することを意味します。ただし、バージョン 4.2 より前に作成したカラムでは `0` は引き続き無制限を意味します。「[スパースカラム](#sparse-columns)」を参照してください。範囲は 0～100000 で、10000 以下を推奨します。ほとんどのワークロードにはデフォルト値で十分です。さらに多くのサブカラムが本当に必要なら [DOC mode](./variant-workload-guide.md#doc-mode-template) を優先してください。 |
| `variant_enable_typed_paths_to_sparse` | `false` | 不可 | バージョン 4.2 以降は設定できません。`false` を含め、カラム定義に記載すると失敗します。Schema Template のパスには常に Subcolumnization が適用され、`variant_max_subcolumns_count` には含まれません。バージョン 4.2 より前に `true` に設定したカラムでは以前の動作が維持されます。これらのパスは上限に含まれ、スパースカラムに格納される場合があります。バージョン 4.2 より前の `SHOW CREATE TABLE` は、DOC mode を使わないすべての VARIANT カラムについてこのプロパティを出力します。その出力を実行する前に削除し、シャード数を維持するには `variant_sparse_hash_shard_count` を `variant_doc_hash_shard_count` に変更してください。 |
| `variant_doc_hash_shard_count` | `1` | 不可 | スパースパスをハッシュで分散する物理的なスパースカラムの数です。DOC mode では、格納されるドキュメントの分割先カラム数です。範囲は 0～1024 で、`0` は `1` として扱われます。バージョン 4.2 より前は DOC mode でのみ適用されました。 |
| `variant_max_sparse_column_statistics_size` | `10000` | 不可 | 1 つのデータファイルで統計を記録するスパースパス数の上限です。この上限を超えると、統計のないパスへのクエリはスパースカラムを読み飛ばせません。範囲は 1～50000 です。 |
| `variant_enable_doc_mode` | `false` | 不可 | 完全なドキュメントも格納する DOC mode を有効にします。`variant_max_subcolumns_count`、`variant_doc_materialization_min_rows`、`variant_doc_hash_shard_count` と併用できますが、`variant_max_sparse_column_statistics_size` とは併用できません。 |
| `variant_doc_materialization_min_rows` | `0` | Schema Template のない場合のみ可 | 行数がこの値より少ないデータファイルでは Subcolumnization を省略し、動的パスをスパースカラムに格納します（DOC mode ではドキュメントのみを格納）。コンパクションがこのしきい値に達するデータファイルを書き込むと、Subcolumnization が実行されます。`0` では書き込み時に Subcolumnization が実行されます。範囲は 0～1000000000 です。バージョン 4.2 より前は DOC mode でのみ適用されました。 |

**ALTER** 列は、`ALTER TABLE ... MODIFY COLUMN` でプロパティを変更できるかを示します。「[ALTER TABLE](#alter-table)」を参照してください。スパースカラムと DOC mode のプロパティの使用方法は「[ワイドカラム](#wide-columns)」を参照してください。

### BE 設定 {#be-configuration}

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON オブジェクトのキーの最大バイト長です。これを超えるキーは解析エラーになります。範囲は 1～65535 です。 |
| `variant_throw_exeception_on_invalid_json` | `false` | `false` の場合、JSON パーサーが拒否したテキストは VARIANT 文字列として保持されます。`true` の場合は解析エラーになります。 |
| `variant_enable_duplicate_json_path_check` | `false` | `false` の場合、オブジェクト内の重複キーは解析エラーになります。`true` の場合は最初の値を保持し、重複を無視します。 |

これらの設定はすべて実行時に変更できます。解析エラーの報告方法は「[解析エラー](#parse-errors)」を参照してください。

## VARIANT のインデックス {#variant-indexes}

### インデックスの選択 {#choosing-indexes}

VARIANT はサブパスに対する BloomFilter と Inverted Index をサポートします。
- カーディナリティの高い等値フィルターや IN フィルターには、BloomFilter を推奨します。インデックスがより疎で、書き込み性能に優れます。
- トークン化、フレーズ検索、範囲検索には Inverted Index を使用し、適切な `parser` / `analyzer` プロパティを設定します。

フィルターがパスをその格納型で比較する場合にのみ、インデックスまたは BloomFilter を使用できます。数値パスは明示的に CAST してください。文字列パスと文字列リテラルの比較には CAST は不要です。

```sql
...
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 12345678;
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) IN (1, 2, 3);
```

VARIANT カラムに Inverted Index を作成すると、すべてのサブパスが同じインデックスプロパティ（parser など）を継承します。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### サブパスごとのインデックス {#index-by-subpath}

特定の VARIANT サブパスにインデックスプロパティを指定できます。同じパスに、トークン化する転置インデックスとトークン化しない転置インデックスの両方を設定することもできます。パス固有のインデックスには、Schema Template で宣言されたパスの型が必要です。

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, norms, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

ワイルドカードを使用したパスのインデックス作成：

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

Doris 4.1.5 以降では、以下のインデックスプロパティまたは BE 設定で norms を無効にできます。

VARIANT パスのトークン化インデックスは、デフォルトで BM25 norms を書き込みます。パスの値がない行も含め、行とパスの組ごとに 1 バイトが必要です。フィルターにしか使わないパスでは、`"norms" = "false"` で無効にしてください。`field_pattern` がない場合、このプロパティはインデックスが対象とするすべてのサブパスに適用されます。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms を無効にしても `MATCH` フィルターには影響しませんが、`score()` が norms のないセグメントを読み取るとエラーになります。BE 設定 `inverted_index_skip_norms_for_variant` は、すべての VARIANT パスで norms を無効にします。詳細は「[レコード長と norms プロパティ](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property)」を参照してください。

### インデックスが機能しない場合 {#when-indexes-dont-work}

1. 型の変更によりインデックスが失われる場合：サブパスが互換性のない型（例：INT → JSONB）に変わると、インデックスが失われます。Schema Template で型とインデックスを固定してください。
2. フィルターがパスを格納型で比較していない場合：
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   `v['id']` が文字列として格納されている場合は、文字列と比較します：`v['id'] = '123456'`。
3. インデックスの設定が不適切な場合：インデックスは VARIANT カラム全体ではなくサブパスに適用されます。
   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```
4. パスがスパースカラムに格納されている場合：サブパスのインデックスにはサブカラムが必要です。`variant_max_subcolumns_count` を超えたパスにはサブカラムがありません。`variant_max_subcolumns_count = 0` では動的パスにサブカラムがありません。行数が `variant_doc_materialization_min_rows` より少ないデータファイルにも、コンパクションがしきい値に達するデータファイルを書き込むまでは動的サブカラムがありません。サブカラムがない場合、`SEARCH()` は「SEARCH index unavailable for Variant field」というエラーになり、`MATCH` は行ごとの値の照合にフォールバックします。ただし `enable_match_without_inverted_index = false` なら失敗します。Schema Template でパスを固定するか、「[スパースカラム](#sparse-columns)」を参照してください。

## ワイドカラム {#wide-columns}

取り込むデータに多数の異なる JSON キーがあると、Subcolumnization によって生成されるサブカラムの数が急増します。規模が大きくなると、メタデータの肥大化、書き込みやマージのコスト増加、クエリの低速化が起こり得ます。サブカラムが多すぎる「ワイドカラム」に対応するため、VARIANT には **スパースカラム** と **DOC エンコーディング** の 2 つの仕組みがあります。

ワークロードに適した方式の選択については、[Variant Workload Guide](./variant-workload-guide.md) を参照してください。この節では仕組みと関連プロパティを説明します。

DOC エンコーディングでも `variant_max_subcolumns_count`、`variant_doc_materialization_min_rows`、`variant_doc_hash_shard_count` が適用されます。抽出されるパスは最大 `variant_max_subcolumns_count` 個で、残りはドキュメントから読み取られます。`variant_max_sparse_column_statistics_size` は DOC エンコーディングと併用できません。各シナリオで選ぶ値については、[VARIANT Storage and Tuning](./variant-storage-tuning.md) を参照してください。

### スパースカラム {#sparse-columns}

**仕組み**

- システムは NULL 以外の値の割合、つまり疎密に基づいてパスを順位付けします。出現頻度の高い、疎でないパスには Subcolumnization が適用され、独立したサブカラムとして格納されます。残りの出現頻度の低い疎なパスはまとめてスパースカラムに格納されます。抽出するサブカラム数の上限は `variant_max_subcolumns_count` で制御します。
- Schema Template で宣言されたパスはスパースカラムに移されません。ただし、バージョン 4.2 より前に `variant_enable_typed_paths_to_sparse = true` を設定したカラムは例外です。
- `variant_max_subcolumns_count = 0` では、すべての動的パスがスパースカラムに格納され、Schema Template のパスには引き続き Subcolumnization が適用されます。主に値全体を読み取る場合に使用します。動的パスすべてに Subcolumnization を適用してサブパスのインデックスを維持したい場合などは、異なるパスの数より大きい値を設定します。
  ```sql
  -- every dynamic path in sparse columns
  v VARIANT<properties('variant_max_subcolumns_count' = '0')>

  -- every dynamic path as a subcolumn, as long as the paths fit in the count
  v VARIANT<properties('variant_max_subcolumns_count' = '2048')>
  ```

  バージョン 4.2 以降、この意味は `CREATE TABLE`、`CREATE TABLE LIKE`、`CREATE TABLE AS SELECT` を含むすべてのテーブル作成ステートメントに適用されます。バージョン 4.2 より前に作成されたカラムは従来の動作を維持し、`0` は上限なしですべての動的パスに Subcolumnization を適用することを意味します。`SHOW CREATE TABLE` は VARIANT カラムの型の後にコメントを付けます。バージョン 4.2 より前に作成されたカラムには `/* variant_serialize_type = v1 */`、バージョン 4.2 以降のカラムには `/* variant_serialize_type = v2 */` が付きます。このコメントは動作を示すだけです。出力を実行するとコメントは無視され、新しいカラムが作成されます。

  ```sql
  -- Version 4.1
  CREATE TABLE old_t (
      k INT,
      v VARIANT<properties('variant_max_subcolumns_count' = '0')>
  )
  DUPLICATE KEY(k) DISTRIBUTED BY HASH(k) BUCKETS 1;
  INSERT INTO old_t VALUES (1, PARSE_TO_VARIANT('{"a": 1, "b": "x"}'));

  -- After upgrading to version 4.2: new_t has the same definition as old_t, with a count of 0
  CREATE TABLE new_t LIKE old_t;
  INSERT INTO new_t SELECT * FROM old_t;

  SET describe_extend_variant_column = true;
  DESC old_t;  -- lists the subcolumns v.a and v.b, because old_t keeps the old meaning
  DESC new_t;  -- lists no subcolumn, because new_t stores a and b in sparse columns
  SHOW CREATE TABLE old_t;  -- the type of v is followed by /* variant_serialize_type = v1 */
  SHOW CREATE TABLE new_t;  -- the type of v is followed by /* variant_serialize_type = v2 */
  ```

  `CREATE TABLE AS SELECT` が `PARSE_TO_VARIANT(...)`、`TRY_PARSE_TO_VARIANT(...)`、サブパス `v['a']` など、クエリで計算した VARIANT を新しいカラムに格納する場合、そのカラムは式の型の `variant_max_subcolumns_count` を引き継ぎます。`PARSE_TO_VARIANT` と `TRY_PARSE_TO_VARIANT` では `0` なので、すべての動的パスがスパースカラムに格納されます。サブパスでは変換元カラムの値を引き継ぎます。デフォルトの上限にするには式を VARIANT に CAST してください。`CAST(PARSE_TO_VARIANT(s) AS VARIANT)` の上限は `2048` です。
- スパースカラムはシャーディングをサポートします。スパースなサブパスを複数のスパースカラムに分散し、カラムごとの読み取り負荷を下げて効率を高めます。物理的に格納するスパースカラムの数は `variant_doc_hash_shard_count` で指定します。バージョン 4.0 と 4.1 では `variant_sparse_hash_shard_count` でシャード数を設定しました。バージョン 4.2 以降も指定は可能ですが、その値は無視されます。

:::caution ロールバック
バージョン 4.2 にアップグレードした後、新しい VARIANT カラムを作成した場合は、4.2 より前のバージョンにロールバックしないでください。新しいカラムは、このページで説明したバージョン 4.2 の動作で格納されます。たとえば、新しいカラムの `variant_max_subcolumns_count = 0` を古いバージョンは無制限と解釈し、コンパクションによってスパースカラムにだけ格納されたパスが失われます。次の操作は新しい VARIANT カラムを作成します。

- VARIANT カラムを含む `CREATE TABLE`。
- VARIANT カラムを持つテーブルに対する `CREATE TABLE LIKE`、または `SHOW CREATE TABLE` の出力の再実行。バージョン 4.2 より前に作成されたテーブルも含みます。
- 結果に VARIANT カラムがある `CREATE TABLE AS SELECT`。
- VARIANT カラムを追加する `ALTER TABLE ... ADD COLUMN`。バージョン 4.2 より前に作成されたテーブルへの追加も含みます。
- VARIANT カラムを持つ非同期マテリアライズドビュー。

`SHOW CREATE TABLE` では、新しいカラムに `/* variant_serialize_type = v2 */` が付いています。
:::

**参考事項**

- ほとんどのキーで NULL 以外の値の割合が近い場合は、真に疎なパスを見分けにくく、スパースカラムの効果は小さくなります。
- `variant_max_subcolumns_count` のデフォルトは `2048` で、ほとんどのワークロードには十分です。抽出するサブカラムを事前に増やすためだけに大幅に引き上げることは避けてください。大規模な Subcolumnization が本当に必要なワークロードでは、[DOC mode](./variant-workload-guide.md#doc-mode-template) を優先してください。実用上の上限として 10000 以下を推奨します。
- `variant_doc_hash_shard_count` は「スパースパス数 / 128」で概算できます。たとえば、JSON キーの総数が約 10,000 で `variant_max_subcolumns_count = 2000` なら、スパースパスは約 8000 です。`variant_doc_hash_shard_count` は `8000/128` 程度から始められます。

### DOC エンコーディング（DOC mode） {#doc-encoding-doc-mode}

**仕組み**

- パスベースのクエリのため、最大 `variant_max_subcolumns_count` 個のパスに引き続き Subcolumnization を適用できます。同時に、JSON ドキュメント全体を効率的に返せるよう、元の JSON も格納フィールドとして保存します。
- DOC エンコーディングはシャーディングをサポートします。元の JSON を複数のカラムに分割して格納し、JSON 全体を問い合わせるときに再構築します。DOC シャード数は `variant_doc_hash_shard_count` で指定します。
- 小さなバッチの書き込みでは、Subcolumnization を省略して後のマージまで延期できます。これは `variant_doc_materialization_min_rows` で制御します。たとえば `variant_doc_materialization_min_rows = 10000` なら、10,000 行未満の書き込みでは元の JSON だけが格納され、そのバッチには Subcolumnization が適用されません。
- 極めて幅の広いワークロードで Subcolumnization の規模が 1 万近くのサブカラムに達する場合も、DOC mode のほうが安定しています。デフォルトの即時 Subcolumnization と比べて、コンパクションに必要なメモリを約 3 分の 2 削減でき、疎なワイドカラムの取り込みスループットを約 5～10 倍に改善できる場合があります。
- `VARIANT` カラムが非常に幅広く、クエリでドキュメント全体を頻繁に読む場合、DOC mode の `SELECT variant_col` は、多数のサブカラムからドキュメントを再構築する場合と比べて桁違いに高速になることがあります。

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

**参考事項**

- DOC mode には `variant_enable_doc_mode = true` が必要です。
- DOC mode では、Schema Template のフィールドは文字列、整数、`FLOAT`、`DOUBLE`、`BOOLEAN`、およびこれらの型の配列に限られます。
- DOC mode では、`variant_doc_hash_shard_count` を「JSON キーの総数 / 128」で概算できます。
- 新しい DOC mode カラムのデフォルトは `1` シャードです（バージョン 4.2 より前は 64）。
- バージョン 4.2 以降、`variant_doc_hash_shard_count` は DOC mode の有無にかかわらずシャード数を設定します。バージョン 4.2 より前に作成された DOC mode テーブルの `SHOW CREATE TABLE` 出力は実行でき、シャード数も維持されます。ただし、その出力には `variant_max_subcolumns_count` が指定されないため、新しいカラムで抽出されるパスは最大 `2048` 個です。別の値が必要なら明示してください。
- バージョン 4.2 より前に作成された DOC mode カラムは従来の動作を維持します。データファイルが行数のしきい値に達すると、すべてのパスが抽出され、作成時のシャード数が維持されます。

### 上限に達したときの動作とチューニングの提案 {#behavior-at-limits-and-tuning-suggestions}

1. しきい値を超えた後、新しいパスはスパースカラムに書き込まれます。Rowset のマージによって、一部のパスがスパースカラムに移る場合もあります。
2. システムは NULL 以外の値の割合とアクセス頻度が高いパスを優先して Subcolumnization の対象に保ちます。
3. Subcolumnization の対象パスが 10,000 に近い場合は、高性能なハードウェアが必要です（ノードあたり RAM ≥128G、CPU ≥32C を推奨）。ワークロードがすでにこの規模に近いなら、まず DOC mode を評価してください。
4. データ取り込みのチューニング：クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms` / `group_commit_data_bytes` を増やします）。
5. バケットの枝刈りが不要なら、RANDOM バケットと単一タブレットへのロードを検討し、コンパクション時の書き込み増幅を抑えてください。
6. BE のチューニング項目：`max_cumu_compaction_threads`（≥8）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善しますが、メモリ使用量は増えます）、`segment_cache_memory_percentage=20`（メタデータキャッシュの効率を改善します）。
7. Compaction Score を監視してください。上昇が続く場合、コンパクションが追いついていないため、データ取り込みの負荷を下げます。
8. VARIANT に対する大きな `SELECT *` を避け、`SELECT v['path']` のように必要なパスを指定してください。

## サブカラムと型の確認 {#inspect-subcolumns-and-types}

方法 1：[VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) で値またはパスの型を行ごとに取得します。確認対象の各行を読み取ります。

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

方法 2：拡張 `DESC` で、Subcolumnization によって抽出されたサブパスとその格納型を表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

方法 1 は各値の型を、方法 2 は各パスの格納方法を示します。

## 制限事項 {#limitations}

- **ワイドテーブルの最適化**：`VARIANT` 型から多数の動的サブカラムが生成されるワイドテーブル（たとえば 2000 カラム超）では、テーブルの `PROPERTIES` に `"storage_format" = "V3"` を指定して **Storage Format V3** を有効にすることを強く推奨します。カラムのメタデータを Segment Footer から分離し、ファイルを開く速度を上げてメモリ使用量を減らします。
- JSON キーの長さは、デフォルトで最大 255 バイトです（`variant_max_json_key_length`）。
- VARIANT カラムは、キー、パーティション、バケットのカラムにできず、テーブルスキーマ内で別の型にネストできません（「[VARIANT カラムの定義](#define-a-variant-column)」を参照）。
- DOC mode 以外で VARIANT カラム全体を読み取ると、すべてのサブパスがスキャンされます。非常に幅広いカラムでは、DOC mode を有効にしない限り、通常は直接 `SELECT variant_col` を実行しないことを推奨します。サブパスが多数ある場合、`LIKE` などでオブジェクト全体を検索できるよう、元の JSON 文字列を追加の STRING/JSONB カラムに格納することを検討してください。

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## JSON 型との比較 {#compared-with-json-type}

- ストレージ：JSON は行指向の JSONB として格納されます。VARIANT は書き込み時に Subcolumnization を適用するため、圧縮率が高く、サイズが小さくなります。
- クエリ：JSON は解析が必要です。VARIANT はカラムを直接スキャンするため、通常は大幅に高速です。

変更を加えた ClickBench（43 クエリ）：
- ストレージ：VARIANT は JSON より約 65% 少ない容量で済みます。
- クエリ：VARIANT は JSON より 8 倍以上高速で、事前定義した静的カラムに近い性能です。

**ストレージ容量**

| 型 | サイズ |
| ------------------- | ---------- |
| 事前定義されたカラム | 12.618 GB |
| VARIANT | 12.718 GB |
| JSON | 35.711 GB |

**約 65% の容量削減**

| 実行 | 事前定義 | VARIANT | JSON |
| ----------------| ---------- | ------- | --------------- |
| 1 回目（コールド） | 233.79s | 248.66s | 大半がタイムアウト |
| 2 回目（ホット） | 86.02s | 94.82s | 789.24s |
| 3 回目（ホット） | 83.03s | 92.29s | 743.69s |

## FAQ {#faq}

1. VARIANT の `null` と SQL `NULL` は同じですか？
   - いいえ。クエリで計算した JSON `null` は VARIANT `null` 値ですが、存在しないパスは SQL `NULL` です。格納後は配列の外にあるオブジェクトの `null` メンバーが削除され、SQL `NULL` として読み戻されます。「[NULL の意味](#null-semantics)」を参照してください。
2. `INSERT INTO t VALUES (1, '{"a": 1}')` の後で `v['a']` が `NULL` を返すのはなぜですか？
   - `INSERT` は文字列を解析せずに VARIANT 文字列として格納します。`s3()`、`hdfs()`、別の文字列カラムからの `INSERT INTO ... SELECT` でも同じです。`PARSE_TO_VARIANT('{"a": 1}')` を使用するか、Stream Load などのデータロードジョブで読み込んでください。「[データの書き込み](#write-data)」を参照してください。
3. 有効な JSON なのにドキュメント全体が文字列として格納されるのはなぜですか？
   - [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値が含まれている可能性があります。パーサーはそのドキュメントを拒否し、デフォルトでは文字列として保持します。「[解析エラー](#parse-errors)」を参照してください。
4. クエリやインデックスが機能しないのはなぜですか？
   - パスを格納型に CAST しているか（暗黙的な数値比較ではインデックスを使用できません）、型の競合によって JSONB に変わっていないか、VARIANT 全体のインデックスがサブパスに適用されると誤解していないかを確認してください。
5. `ORDER BY v['a']` で `"10"` が `9` より後に並んだり、`GROUP BY v['a']` で `1` と `"1"` が別のグループになったりするのはなぜですか？
   - VARIANT の順序付けと等値判定は、まず値の種類を見ます。数値は文字列より前に並び、数値と文字列は等しくなりません。数値順または辞書順が必要なら、パスを 1 つの型に CAST してください。「[比較、グループ化、順序付け](#comparison-grouping-and-ordering)」を参照してください。
6. `v['a']` が文字列のとき、`COALESCE(v['a'], 0)` が `0.000000000` を返し、`IF(..., v['a'], 1)` が `NULL` を返すのはなぜですか？
   - VARIANT と別の型を混在させると、VARIANT 値は別の型に変換されます。整数の場合、その型は `DECIMAL(38, 9)` です。`"abc"` のような文字列は変換できず `NULL` になるため、`COALESCE` の `0` は `0.000000000` として返されます。結果を VARIANT に保つには `COALESCE(v['a'], CAST(0 AS VARIANT))` を使用するか、`v['a']` を必要な型に CAST してください。
7. DECIMAL を VARIANT カラムに書き込むと精度が失われるのはなぜですか？
   - 小数部分を持つ JSON 数値は `DECIMAL` ではなく `DOUBLE` と推論されるため、末尾の桁が失われる場合があります。Schema Template でパスを `DECIMAL` と宣言しても、たとえば `v VARIANT<'num': DECIMAL(9, 3)>` の場合でも、先に `DOUBLE` として解析されるため十分ではありません。ドキュメント内で値を JSON 文字列として、たとえば `PARSE_TO_VARIANT('{"num": "12.345"}')` のように書き込んでください。これにより、精度を失わず直接 `DECIMAL(9, 3)` に変換されます。
