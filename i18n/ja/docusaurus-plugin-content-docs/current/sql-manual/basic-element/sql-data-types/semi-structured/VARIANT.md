---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT は半構造化 JSON を格納します。書き込みと解析のルール、CAST、NULL の意味、並び順、Schema Template、ALTER、プロパティ、インデックス、制限について説明します。"
}
---

## 概要 {#overview}

VARIANT 型は、オブジェクト、配列、文字列、数値、真偽値、`null` などの半構造化 JSON データを格納します。書き込み時に、Doris は各 JSON パスの型を推論し、頻繁に現れるパスを Subcolumnization によって独立した列指向のサブカラムとして格納します。そのパスを参照するクエリは、必要なサブカラムだけを読み取ります。

:::tip VARIANT を選ぶ理由
ドキュメントの構造が時間とともに変わっても、クエリが少数の頻繁に使うパスに集中する場合、`VARIANT` が適しています。

- 頻繁に使うパスは Subcolumnization の対象となり、列指向処理の性能、ファイルの枝刈り、ベクトル化実行の利点を得られます。
- 主要なパスではパス単位のインデックスや全文検索を使用でき、Doris のスパースインデックスによる枝刈りも利用できます。
- ワイドカラム向けの最適化により、サブカラムが 10k 規模でも自動的な Subcolumnization を実用的に利用できます。ただし、Subcolumnization の対象となるパスが 10,000 に近づくとハードウェア要件が急激に高まるため、通常は DOC モードから始める方が安全です。

デフォルトの動作、スパースカラム、DOC モード、Schema Template のどれを選ぶか迷っている場合は、[VARIANT ワークロードガイド](./variant-workload-guide.md)をご覧ください。このページでは、書き込みと解析、型のルール、CAST、NULL と比較の意味、ALTER、インデックス、制限、設定について説明します。
:::

:::info バージョン
このページでは、Doris 5.0.0 以降の VARIANT について説明します。既存の SQL に影響する可能性が高い Doris 4.x からの変更点は次のとおりです。

- `INSERT` は文字列を JSON として解析せず、VARIANT の文字列として格納します。`s3()` や `hdfs()` などのテーブル関数からの `INSERT INTO ... SELECT` も同様です。`INSERT` で JSON テキストを書き込むには `PARSE_TO_VARIANT` を使用してください。Stream Load などのデータロードジョブでは、引き続き JSON を解析します。
- VARIANT 値全体を `GROUP BY`、`DISTINCT`、集合演算で使用できます。2 つの VARIANT 値は `=`、`!=`、`<=>` で比較でき、結合キー、`ORDER BY` キー、ウィンドウキーにも使用できます。
- `VARIANT_TYPE` は、パスから型へのマップではなく、`object` など単一の型名を返します。
- VARIANT 配列は、1 から始まる整数で要素を参照できます。

Doris 4.x については、このページの 4.x 版をご覧ください。
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
- パスの値を比較や計算に使う前に、CAST で具体的な型に変換してください。
- Stream Load などのデータロードジョブでは JSON テキストが自動的に解析されます。[データの書き込み](#write-data)をご覧ください。

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
- `properties(...)` はカラム単位の格納プロパティを設定します。[カラムのプロパティ](#column-properties)をご覧ください。
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

テーブル内で VARIANT カラムを使用できる場所は次のとおりです。

| 用途 | サポート | 備考 |
| --- | --- | --- |
| Duplicate Key、Unique Key、Aggregate Key テーブルの値カラム | 可 | Aggregate Key テーブルでは、集約型を `REPLACE` または `REPLACE_IF_NOT_NULL` にする必要があります。 |
| キーカラム、パーティションカラム、バケットカラム | 不可 | |
| テーブルスキーマ内で別の型にネストする場合（`ARRAY<VARIANT>`、`MAP`、`STRUCT`） | 不可 | ただし、`COLLECT_LIST(v)` の結果など、クエリ結果を `ARRAY<VARIANT>` にすることはできます。 |
| デフォルト値 | `NULL` のみ | `DEFAULT '{}'` など、NULL 以外のデフォルト値は拒否されます。 |

## データの書き込み {#write-data}

`INSERT` と `CAST` は文字列を VARIANT の文字列として保持します。`PARSE_TO_VARIANT`、`TRY_PARSE_TO_VARIANT`、Stream Load などのデータロードジョブは JSON テキストを解析します。データロードの例については、[VARIANT データのロード](../../../../data-operate/import/complex-types/variant.md)をご覧ください。

### 解析エラー {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)、[TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)、データロードジョブは同じ JSON パーサーを使用します。データロードジョブは `TRY_PARSE_TO_VARIANT` と同じ方法でエラーを処理します。

| 入力 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` とデータロードジョブ |
| --- | --- | --- |
| 有効な JSON | 解析された値 | 解析された値 |
| `hello` や `{"id":` など、有効な JSON ではないテキスト | VARIANT の文字列として保持 | VARIANT の文字列として保持 |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値を含む JSON。例：`{"a": 1, "n": 100000000000000000000}` | テキスト全体が VARIANT の文字列として保持されるため、`v['a']` は `NULL` を返します | テキスト全体を VARIANT の文字列として保持 |
| 空文字列 | 空のオブジェクト `{}` | 空のオブジェクト `{}` |
| ネストの深さが 128 レベルを超える場合 | エラー | SQL `NULL` |
| オブジェクトのキーが `variant_max_json_key_length` バイトを超える場合（BE 設定、デフォルトは 255） | エラー | SQL `NULL` |
| 同じオブジェクト内に重複するキーがある場合 | エラー | SQL `NULL` |
| 有効な UTF-8 ではない文字列 | エラー | SQL `NULL` |

JSON パーサー自体が拒否するほど深くネストされたドキュメント（約 1,000 レベル）は無効な JSON と見なされるため、文字列として保持されます。

次の 2 つの BE 設定によって、これらのルールが変わります。

- `variant_throw_exeception_on_invalid_json`（デフォルトは `false`）：`true` の場合、範囲外の数値を含む JSON など、パーサーが拒否するテキストは VARIANT の文字列にはなりません。`PARSE_TO_VARIANT` ではエラーになり、`TRY_PARSE_TO_VARIANT` とデータロードジョブでは SQL `NULL` になります。
- `variant_enable_duplicate_json_path_check`（デフォルトは `false`）：`true` の場合、オブジェクト内でキーが重複してもエラーにはならず、最初の値が保持されます。ドットを含むキーがネストされたパスと重複する場合も書き込みは失敗せず、いずれか一方の値だけが格納されます。

範囲外の整数を含むドキュメントを構造化されたまま保持するには、JSON を経由して変換します：`CAST(CAST(text AS JSON) AS VARIANT)`。最大 38 桁の整数は正確な数値として保持され、それより大きく `LARGEINT` の範囲内にある整数は文字列になり、さらに大きな整数は `DOUBLE` になります。`PARSE_TO_VARIANT(CAST(text AS JSON))` では JSON テキストが再解析されるため、この問題は解決しません。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### 格納時に保持される値 {#what-storage-keeps}

値をテーブルに書き込むと正規化されます。読み戻した値は、書き込み前に計算された値と異なる場合があります。

| 書き込み前 | テーブルから読み戻した値 |
| --- | --- |
| `{"a": null, "b": 1}` のように、値が JSON `null` であるオブジェクトのメンバー | そのメンバーが削除され、`{"b":1}` になります。`v['a']` は SQL `NULL` を返します。 |
| 値が空のオブジェクトや配列であるメンバー、またはこれらのルールによって空になるオブジェクトのメンバー。例：`{"a": {}, "b": [], "c": {"d": null}}` | 削除され、`{}` になります。 |
| 配列に `null` しか含まれないメンバー。例：`{"p": [null, null], "q": 1}` | 削除されて `{"q":1}` になる場合があります。 |
| `{"arr": [{"a": null}, {}, [], null]}` のような配列内の値 | そのまま保持されます。`v['arr'][1]['a']` は VARIANT の `null` です。 |
| `PARSE_TO_VARIANT('null')` のようなルートの JSON `null` | 空のオブジェクト `{}` |
| ルートの空配列 `[]` または空オブジェクト `{}` | 保持されます。 |
| `CAST(date_col AS VARIANT)` のようなルートの `DATE` と `DATETIME` の値、または異なる型の値も含むパス上のこれらの値 | テキストとして格納され、読み戻すと文字列になります。日付だけを含むオブジェクトのパスでは、型が保持されます。 |
| 同じパスに混在する真偽値と数値 | 書き込み時の値の順序や compaction によって、真偽値が `1` または `0` として読み戻される場合があります。 |
| `{"a.b": 1}` のようにドットを含むキー | ネストされたパス `{"a":{"b":1}}` として格納されます。`v['a.b']` と `v['a']['b']` はどちらも `1` を返します。キー `a.b` と、`a` 内のキー `b` の両方を含むドキュメントでは、`variant_enable_duplicate_json_path_check` が `true` でない限り、INSERT またはデータロードジョブ全体が失敗します。 |
| オブジェクトのキー | バイト順で返されます。 |

これらのルールは、同時に書き込まれる他の行や DOC モードによっても変わるため、`null` 値や空のコンテナーが格納後も残ることを前提にしないでください。Schema Template で宣言したパスは、代わりに宣言した型に変換されます。[Schema Template](#schema-template)をご覧ください。

## 型推論と型の競合 {#type-inference-and-type-conflicts}

Schema Template がない場合、Doris は JSON の解析時に各値の型を推論します。`VARIANT_TYPE` はこの型を返します。

| JSON 値 | 型 |
| --- | --- |
| `BIGINT` の範囲内の整数 | 値が収まる最小の型である `tinyint`、`smallint`、`int`、`bigint` のいずれか |
| `BIGINT` の範囲を超え、18446744073709551615 以下の整数 | `decimal` |
| 小数部または指数を含む数値 | `double` |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値 | 数値として扱われません。テキスト全体が無効な JSON になります（[解析エラー](#parse-errors)を参照）。 |
| 文字列 | `string` |
| `true`、`false` | `bool` |
| `null` | `null` |
| 配列、オブジェクト | `array`、`object` |

データを格納するとき、各パスには格納型が 1 つ割り当てられます。

- 整数は `BIGINT`、その範囲を超える値が必要な場合は `LARGEINT` として格納されます。浮動小数点数は `DOUBLE`、十進数は `DECIMAL`、文字列は `STRING`、真偽値は `BOOLEAN`、スカラー値の配列は `ARRAY<T>` として格納されます。
- オブジェクトの配列、ネストした配列、および整数と浮動小数点数、数値と文字列、スカラーと配列など、異なる型の値を含むパスは `JSONB` として格納されます（`DESC` では `json` と表示されます）。要素の型が競合する配列は `ARRAY<JSONB>` になります。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

`JSONB` のパスはすべての値を保持しますが、型付きの格納方式ではなくなるため、そのパスではインデックスや型に基づく枝刈りを利用できません。真偽値は例外です。パス上の最初の値が真偽値で、後続の値が数値の場合、そのパスが数値として格納され、真偽値が `1` または `0` として読み戻される場合があります。安定した型が必要なパスは、Schema Template で宣言してください。

`VARIANT_TYPE` は各値の型を報告するため、`BIGINT` のパスから読み取った整数でも `tinyint` と表示される場合があります。各パスの格納型を確認するには、`SET describe_extend_variant_column = true;` を実行してから `DESC table_name;` を実行します。[サブカラムと型の確認](#inspect-subcolumns-and-types)をご覧ください。

## パスへのアクセスと出力 {#access-paths-and-output}

- `v['key']` と `v['a']['b']` はオブジェクトのメンバーを読み取ります。`v['arr'][1]` は配列の要素を読み取ります。インデックスは 1 から始まり、`-1` は最後の要素を指します。[ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) も同じ動作です。
- 結果は `VARIANT` 値です。存在しないキー、インデックス `0`、範囲外のインデックス、配列に対する文字列キー、オブジェクトに対する整数インデックス、スカラー値に対するキーは、いずれも SQL `NULL` を返します。
- 計算された値では、ドットを含むキーは単一のキーです。`v['a.b']` はキー `a.b` を読み取り、`v['a']['b']` は `a` 内の `b` を読み取ります。格納時にはこの区別は保持されません。[格納時に保持される値](#what-storage-keeps)をご覧ください。
- パスは配列内の各要素に自動で適用されません。`{"a": [{"b": 1}]}` では `v['a']['b']` は `NULL` を返します。`v['a'][1]['b']` を使用してください。

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

一般的には、パスの値をクエリに必要な型へ CAST します。

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

VARIANT 値全体を読み取ると、JSON テキストが返されます。オブジェクトのキーはバイト順で返され、空白も除かれるため、入力とバイト単位で同一のテキストにはなりません。ルートの文字列は引用符なしで返されます。

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
| `CHAR`、`VARCHAR`、`STRING` | VARIANT の文字列。JSON テキストは解析されません。文字列は有効な UTF-8 である必要があり、そうでない場合は CAST が失敗します。 |
| `BOOLEAN` | 真偽値。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT` | 整数。 |
| `LARGEINT` | 十進数。絶対値が 10^38 - 1 を超える値は文字列になります。 |
| `FLOAT`、`DOUBLE` | 浮動小数点数。 |
| `DECIMALV2`、`p <= 38` の `DECIMAL(p, s)` | 十進数。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付、またはタイムゾーンを持たないタイムスタンプ。 |
| `IPV4`、`IPV6` | 値のテキスト表現を含む文字列。 |
| `JSON` / `JSONB` | 同じ構造。`DECIMAL256` 数値など VARIANT で保持できない値や、オブジェクト内の重複キーがあると CAST は失敗します。 |
| `ARRAY<T>` | 配列。各要素が変換されます。`T` は `VARIANT` またはこの表にある型である必要があります。 |
| `MAP`、`STRUCT`、`TIME`、`TIMESTAMPTZ`、`VARBINARY`、その他の型 | サポートされません。ステートメントは失敗します。 |

変換元の値も、元の型に対して有効である必要があります。無効な値は修正されずに拒否されます。CAST は文字列を解析しません。`CAST('{"id": 1}' AS VARIANT)` は文字列 `{"id": 1}` になります。JSON テキストの解析には `PARSE_TO_VARIANT` を使用してください。

### VARIANT からの CAST {#cast-from-variant}

| 変換先の型 | 結果 |
| --- | --- |
| `BOOLEAN` | 真偽値はそのままです。数値はゼロ以外なら `true` になります。文字列は `CAST(string AS BOOLEAN)` と同じ方法で変換されます。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 整数。十進数や浮動小数点数の小数部は切り捨てられます（`1.5` は `1` になります）。真偽値は `1` または `0` になります。`"123"` のような数値を表す文字列も変換されます。 |
| `FLOAT`、`DOUBLE`、`DECIMAL(p, s)` | 数値と、数値を表す文字列。`DECIMAL` は小数位 `s` に丸めます。`FLOAT` で表せないほど大きい値は `Infinity` になります。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付と時刻の値、日付または時刻の形式の文字列、および `20240102` のような数値。 |
| `TIMESTAMPTZ(p)` | 日付と時刻の値、および日付または時刻の形式の文字列。 |
| `IPV4`、`IPV6` | IP アドレス形式の文字列。 |
| `CHAR`、`VARCHAR`、`STRING` | ルートの文字列は引用符なしでそのまま返されます。オブジェクトと配列は JSON テキストとして返されます。その他のスカラー値は、対応する SQL 型と同様に書式設定されます。ルートの真偽値は `1` または `0`、`DATETIME` 値の小数部は 6 桁、`TIMESTAMP_NS` 値の小数部は 9 桁になります。VARIANT の `null` は文字列 `null` になります。 |
| `JSON` / `JSONB` | 同じ構造。日付やタイムスタンプなど、対応する JSON 値がないものは JSON 文字列になります。タイムゾーン付きタイムスタンプはセッションのタイムゾーンで書式設定されます。 |
| `ARRAY<T>` | 要素ごとに変換された配列。変換できない要素は `NULL` になります。`"[1, 2]"` のように JSON 配列を含む文字列も変換されます。その他の値は `NULL` を返します。 |
| `MAP`、`STRUCT`、`TIME`、その他の型 | サポートされません。ステートメントは失敗します。 |

変換先の型に変換できない値は、`enable_strict_cast` が有効な場合も SQL `NULL` を返します。ただし、数値から `TIMESTAMPTZ`、`IPV4`、`IPV6` への変換や、日付またはタイムスタンプから `BOOLEAN` への変換のように、その値の型から変換先の型への変換自体が存在しない場合は、ステートメントが失敗します。

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

### 十進数と日付・時刻の値 {#decimal-and-datetime-values}

これらの型を VARIANT に変換した場合の動作は次のとおりです。

| Doris の型 | 動作 |
| --- | --- |
| 旧形式の `DECIMALV2` | 最大 27 桁の精度と最大 9 桁の小数位が正確に保持されます。 |
| `DECIMAL(p, s)` | `1 <= p <= 38` かつ `0 <= s <= p` の値が正確に保持されます。精度が 38 を超える十進数はサポートされません。 |
| `DATE` | 時刻やタイムゾーンを持たない暦日。 |
| `DATETIME(p)` | `0 <= p <= 6`。タイムゾーンの調整は行われません。 |
| `TIMESTAMP_NS` | タイムゾーンの調整を行わないナノ秒精度の値。値は TIMESTAMP_NS の範囲内である必要があります。 |
| `TIMESTAMPTZ(p)` | CAST でも Schema Template のパスでもサポートされません。 |
| `TIME` | サポートされません。 |

## NULL の意味 {#null-semantics}

VARIANT には 2 種類の null があります。

- **SQL `NULL`** は値が存在しないことを意味します。`NULL` のカラム値、`v['no_such_key']` のような存在しないパス、失敗した CAST によって生じます。
- **VARIANT の `null`** は値です。`PARSE_TO_VARIANT('null')` や配列内の `null` 要素など、JSON リテラルの `null` を表します。`VARIANT_TYPE` はこれに対して `null` を返します。

| 操作 | SQL `NULL` | VARIANT の `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| VARIANT の `x` を指定した `COALESCE(v, x)`、`IFNULL(v, x)` | `x` を返す | VARIANT の `null` を返す |
| `COUNT(v)` | カウントされない | カウントされる |
| `GROUP BY v`、`DISTINCT` | すべての SQL `NULL` が同じグループになる | すべての VARIANT の `null` が別のグループになる |
| `v = x`、等価結合 | 一致しない | 別の VARIANT の `null` と一致する |
| `ORDER BY v` | `NULLS FIRST` または `NULLS LAST` に従って配置される | 昇順では、NULL 以外のすべての値より前に配置される |
| `CAST(v AS STRING)` | SQL `NULL` | 文字列 `null` |

値を格納すると、配列の外にあるオブジェクトの `null` メンバーは削除されるため、読み取ると SQL `NULL` が返されます。また、ルートの `null` は `{}` として読み戻されます（[格納時に保持される値](#what-storage-keeps)を参照）。そのため、格納済みデータの `v['a'] IS NULL` では、存在しないメンバーと `null` のメンバーを区別できません。

## 比較、グループ化、並び順 {#comparison-grouping-and-ordering}

VARIANT 値は、テキスト表現や物理的なエンコードではなく、論理値によって比較されます。等価比較、ハッシュ処理（`GROUP BY`、`DISTINCT`、結合）、並び順（`ORDER BY`、ウィンドウキー）は同じルールを使用するため、等しい値は必ず同じグループに入り、ソート時にも同順位になります。

### サポートされる操作 {#supported-operations}

| VARIANT 値に対する操作 | サポート | 備考 |
| --- | --- | --- |
| 2 つの VARIANT 値の間、または `NULL` リテラルとの `=`、`!=`、`<=>` | 可 | `v['a'] = w['a']` のようなサブパスも含みます。 |
| 等価結合、セミ結合、アンチ結合、`IN` および `NOT IN` サブクエリ | 可 | VARIANT の結合キーに対してランタイムフィルターは生成されません。 |
| `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`UNION`、`INTERSECT`、`EXCEPT` | 可 | |
| `ORDER BY`、`ORDER BY ... LIMIT` | 可 | |
| ウィンドウの `PARTITION BY` と `ORDER BY` | 可 | |
| `COUNT(v)`、`COLLECT_LIST(v)`、`ARRAY_AGG(v)` | 可 | |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 可 | VARIANT と別の型を混在させると、VARIANT 値がその別の型に変換されます。相手が整数の場合は `DECIMAL(38, 9)` です。変換できない値は `NULL` になります。 |
| `CAST(v AS ARRAY<VARIANT>)`、`EXPLODE_VARIANT_ARRAY`、`ARRAY<VARIANT>` に対する `EXPLODE` と `EXPLODE_OUTER` | 可 | |
| VARIANT 値どうしの `<`、`<=`、`>`、`>=`、`BETWEEN` | 不可 | 先に具体的な型へ CAST してください。 |
| `v = 1` のように、VARIANT 値全体を VARIANT 以外の値と比較する操作 | 不可 | サブパスは暗黙に変換されるため、`v['a'] = 1` は使用できます。 |
| `v IN (PARSE_TO_VARIANT('1'))` のような VARIANT 値を含む `IN` リスト | 不可 | VARIANT 以外の値を含む `v IN ('a', 'b')` は、暗黙の変換によって使用できます。 |
| `MIN`、`MAX` | 不可 | 先にサブパスを CAST してください。 |
| VARIANT 引数を指定した `ARRAY(...)`、`MAP(...)`、`NAMED_STRUCT(...)` | 不可 | |

### 等価性 {#equality}

- **数値。** 整数、小数部がゼロの十進数、整数値を表す浮動小数点数は等しく、`1`、`1.0`、`1.00` は同じ値です。十進数の末尾のゼロは影響せず、`-0.0` は `0` と等しくなります。小数部を持つ十進数と浮動小数点数は等しくならず、`DECIMAL 1.5` は `DOUBLE 1.5` と等しくありません。小数部を持つ JSON 数値は `DOUBLE` として解析されます。十進数は CAST、Schema Template のパス、`BIGINT` を超える整数から生じます。
- **異なる種類の値は等しくなりません。** 数値の `1`、文字列の `"1"`、`true` はそれぞれ別の値です。`DATE` は文字列 `"2024-01-01"` と等しくなく、タイムゾーンなしのタイムスタンプはタイムゾーン付きのタイムスタンプと等しくありません。
- **文字列**は、バイト列が同じ場合だけ等しくなります。比較では大文字と小文字が区別されます。
- **オブジェクト**は、同じキーを持ち、対応する値が等しい場合に等しくなります。キーの順序は関係ありません。
- **配列**は、長さが同じで、同じ位置の要素がそれぞれ等しい場合に等しくなります。
- VARIANT の `null` は別の VARIANT の `null` と等しくなります。SQL `NULL` には SQL のルールが適用されます。

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### 並び順 {#ordering}

VARIANT 値に対する `ORDER BY` は、単一の全順序を使用します。種類の異なる値は、まず種類によって次の順序に並びます。

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

binary、time、UUID の値は、Doris での JSON 解析や CAST では生成できません。これらは、VARIANT カラムを持つ Parquet ファイルなど、他のシステムで書き込まれた VARIANT データからのみ得られます。

同じ種類の値の並び順は次のとおりです。

- **真偽値：** `false` が `true` より前になります。
- **数値：** 整数（`INT`、`BIGINT` など）、十進数（`DECIMAL`）、浮動小数点数（`FLOAT`、`DOUBLE`）は数値の大きさで並びます。`INT 1`、`FLOAT/DOUBLE 1.0`、`DECIMAL 1.00` は等しく、同じ位置に並びます。十進数の末尾のゼロは影響しません。整数でない値の数値が同じ場合は、十進数が先になります。`DECIMAL 1.5` は `FLOAT/DOUBLE 1.5` より前に並び、VARIANT 値としても等しくありません。浮動小数点数の精度は順序に影響する場合があります。`DOUBLE 0.1` は `DECIMAL 0.1` よりわずかに大きくなります。負の無限大が最初に並び、正の無限大、その後に NaN が最後に並びます。
- **文字列：** UTF-8 のバイト列で並びます。大文字は小文字より前になり、`"10"` は `"9"` より前になります。
- **日付とタイムスタンプ：** 時刻順に並びます。すべての日付は、すべてのタイムスタンプより前になります。
- **オブジェクト：** キー順にエントリを比較します。最小のキーから比較し、続いてその値、次のキーを比較します。一方のオブジェクトのエントリが他方の先頭部分と一致する場合、短い方が先に並びます。したがって、`{"a":1}` < `{"a":1,"b":2}` < `{"b":0}` です。
- **配列：** 要素ごとに比較します。一方が他方の先頭部分と一致する場合、短い方が先に並びます。したがって、`[]` < `[null]` < `[1]` < `[1,2]` です。

SQL `NULL` の位置は、`NULLS FIRST` または `NULLS LAST` で決まります。

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

比較に VARIANT のルールと具体的な型のルールのどちらを使うかは、オペランドによって決まります。値が `1`、`1.0`、`"1"` であるパス `a` を例にします。

| 式 | 比較に使う型 | 結果 |
| --- | --- | --- |
| `v['a'] = 1` | `v['a']` の暗黙的な CAST による `DECIMAL(38, 9)` | 3 つの値すべてに一致 |
| `v['a'] = CAST(1 AS VARIANT)`、`v['a'] = w['a']` | VARIANT | `1` と `1.0` に一致し、`"1"` には一致しない |
| `GROUP BY v['a']` | VARIANT | `1` と `1.0` が同じグループになり、`"1"` は別のグループになる |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | `1` の 1 グループになる |
| `ORDER BY v['a']` | VARIANT | 数値が先、文字列が後 |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 数値順。変換できない値は `NULL` になる |

### 補足 {#notes}

- **コスト。** VARIANT キーは論理値に基づいてハッシュ化、比較されます。4,400 万行のベンチマークでは、VARIANT キーに対する `GROUP BY`、ソート、結合に、`CAST(v['path'] AS <type>)` に対する同じ操作の 1.2～3.7 倍の時間がかかりました。パスの型が既知であれば CAST してください。
- **結果は格納された値に従います。** [格納時に保持される値](#what-storage-keeps)に記載した正規化は比較前に行われます。`null` だったメンバーは存在しなくなり、ルートの `DATE` は文字列として比較され、同じパスに数値と混在する真偽値は `1` または `0` として読み戻される場合があります。型が重要なパスは Schema Template で宣言してください。
- **型が混在する値は値の大きさではなく種類で並びます。** パスに数値と数値を表す文字列の両方がある場合、`ORDER BY v['a']` ではすべての数値がすべての文字列より前に並び、文字列はバイト順に並びます。数値順または辞書順が必要な場合は、単一の型へ CAST してください。
- **同じ表示でも値が異なる場合があります。** `GROUP BY` の結果では、数値の `1` と文字列の `"1"` は同じように表示されますが、別のグループになります。違いを確認するには `VARIANT_TYPE` を使用してください。
- 種類間の順序は、結果を決定的にするために Doris が定義しています。JSON 標準の一部ではなく、他のシステムとは異なる場合があります。
- VARIANT 値の内部ハッシュは実装の詳細であり、ユーザーが利用できる安定したチェックサムではありません。

## Schema Template {#schema-template}

Schema Template は、選択したパスの格納型を宣言します。安定した型またはパス固有のインデックスが必要な主要パスだけを宣言してください。ドキュメントの残りの部分は動的なままです。

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

テンプレートのフィールドには、次の型を使用できます。

- 数値：`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`、および `p <= 38` の `DECIMAL(p, s)`
- `STRING`（または `TEXT`）
- `BOOLEAN`
- `DATE`、`DATETIME(p)`、`TIMESTAMP_NS`
- `IPV4`、`IPV6`
- `ARRAY<T>`。`T` は上記のいずれかの型です（一次元のみ）。

### テンプレートのパスへの書き込み {#writing-to-template-paths}

宣言されたパスでは、各値が非厳格な CAST のルールに従って宣言された型へ変換されます。変換できない値は `NULL` として格納されるため、読み戻したときにはそのパスが存在しません。行の残りの部分は書き込まれます。変換によって値が変わる場合があります。

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

- `"123"` は `123` になり、`1.7` は `1` に切り捨てられ、`9.999` は `10.00` に丸められます。タイムスタンプは宣言した精度（ミリ秒）を保持し、テキスト表現では小数部が常に 6 桁で表示されます。
- `"abc"`、`"x"`、`"not a time"` は変換できないため削除されます。
- 小数部を持つ JSON 数値は変換前に `DOUBLE` として解析されるため、`DECIMAL` のパスでは精度が失われる場合があります。すべての桁を保持するには、その値を JSON 文字列として書き込んでください（[FAQ](#faq)を参照）。
- 日付と IP の値は JSON 文字列にする必要があります。`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は有効な JSON ではありません。`{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` のように書き込んでください。

:::caution
値が変換されるのは、JSON の型から宣言された型への変換が存在する場合だけです。`IPV4` または `IPV6` のパスに JSON 数値を書き込むと、書き込み全体が失敗します。単一の書き込みで `DATE`、`DATETIME`、`IPV4`、`IPV6` のパスに JSON 文字列と数値が混在していると、そのパス上の有効な値まで削除される場合があります。これらのパスの値は JSON 文字列として書き込んでください。
:::

### テンプレートのパスの読み取り {#reading-template-paths}

宣言されたパスでも、`v['path']` の型は `VARIANT` のままです。Doris は宣言された型へ自動で CAST しません。その型が必要な場合は明示的に CAST してください。フィルターでも宣言された型に CAST すると、クエリはそのパスの zone map とインデックスを利用できます。

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template が決めるのは値の格納方法だけです。同じ JSON をクエリ内で計算した場合は、解析時の型が保持されます。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### パターンマッチング {#pattern-matching}

フィールド名はデフォルトで glob パターン（`MATCH_NAME_GLOB`）です。`*` はネストしたキーの間の `.` を含む任意の文字列に一致し、`?` は任意の一文字に一致します。たとえば、`'m*'` は `m1` にも `m2.x` にも一致します。パスが複数のフィールドに一致する場合、定義順で最初のフィールドが使用されます。

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

一致したパスはデフォルトで Subcolumnization の対象になります。一致するパスが多すぎてサブカラムが増えすぎる場合は、`variant_enable_typed_paths_to_sparse` を検討してください（[カラムのプロパティ](#column-properties)を参照）。

Schema Template はカラムの作成後に変更できません。[ALTER TABLE](#alter-table) をご覧ください。

## ALTER TABLE {#alter-table}

`ADD COLUMN`（一括追加を含む）、`MODIFY COLUMN`、`RENAME COLUMN` でも、最上位の VARIANT カラム名にはドットを含められません。たとえば、次のステートメントは拒否されます。

```sql
ALTER TABLE example_tbl ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

`ALTER TABLE` では、次の操作がサポートされます。

- NULL 許容の VARIANT カラムの `ADD COLUMN`。Schema Template とプロパティは指定してもしなくてもかまいません。
- `DROP COLUMN`、`RENAME COLUMN`、`MODIFY COLUMN ... COMMENT '...'`。
- `ADD INDEX` と `DROP INDEX`。`field_pattern` を持つインデックスは `CREATE TABLE` でのみ定義できます。
- Schema Template のないカラムでは、`NOT NULL` から `NULL` への変更、および `variant_doc_materialization_min_rows` の変更。`MODIFY COLUMN` にはカラムの完全な定義を指定します。省略したプロパティには、対応する `default_variant_*` セッション変数の値が使われるため、異なる値を維持したいプロパティはすべて再指定してください。

次の操作はサポートされません。

- `ADD COLUMN ... VARIANT NOT NULL`。`ALTER` で追加する `NOT NULL` カラムにはデフォルト値が必要ですが、VARIANT で許可されるのは `DEFAULT NULL` だけです。`NOT NULL` の VARIANT カラムは `CREATE TABLE` で定義してください。
- 既存のカラムへの Schema Template の追加。Schema Template を持つカラムでは、`MODIFY COLUMN` で変更できるのはコメントだけです。同じテンプレートを再指定する場合でも、それ以外の変更は失敗します。
- `variant_doc_materialization_min_rows` 以外のプロパティの変更、`NULL` から `NOT NULL` への変更、VARIANT と他の型の間の変換。
- VARIANT カラムに対する `BUILD INDEX`。

これらの変更を行う場合は、新しい定義でテーブルを作成し、`INSERT INTO ... SELECT` でデータをコピーしてください。変換元が `STRING` カラムの場合は、`PARSE_TO_VARIANT` で包みます。

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## カラムのプロパティ {#column-properties}

カラムのプロパティは、VARIANT 型内の `properties(...)` で設定します。

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```

| プロパティ | デフォルト | ALTER | 説明 |
| --- | --- | --- | --- |
| `variant_max_subcolumns_count` | `2048` | 不可 | 単一のデータファイル内で Subcolumnization の対象となる動的パスの最大数。NULL 以外の値が多いパスから選ばれ、残りはスパースカラムに格納されます。`0` は制限なしを意味します。範囲は 0～100000 ですが、10000 以下に抑えてください。ほとんどのワークロードではデフォルトで十分です。さらに多数のサブカラムが本当に必要な場合は、[DOC モード](./variant-workload-guide.md#doc-mode-template)を選んでください。 |
| `variant_enable_typed_paths_to_sparse` | `false` | 不可 | デフォルトでは、Schema Template のパスは常に Subcolumnization の対象となり、`variant_max_subcolumns_count` にカウントされません。`true` にすると制限にカウントされ、スパースカラムに格納される場合があります。 |
| `variant_sparse_hash_shard_count` | `1` | 不可 | スパースパスをハッシュで振り分ける物理的なスパースカラムの数。範囲は 0～1024 で、`0` は `1` として扱われます。 |
| `variant_max_sparse_column_statistics_size` | `10000` | 不可 | 単一のデータファイル内で統計情報を記録するスパースパスの最大数。この数を超え、あるパスの統計情報がない場合、そのパスのクエリではスパースカラムをスキップできません。範囲は 1～50000 です。 |
| `variant_enable_doc_mode` | `false` | 不可 | DOC モードを有効にします。`variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse`、`variant_max_sparse_column_statistics_size`、`variant_sparse_hash_shard_count` と同時には設定できません。 |
| `variant_doc_materialization_min_rows` | `0` | Schema Template がない場合のみ可 | DOC モード専用。指定した行数より少ない書き込みではドキュメントだけを格納し、compaction によるファイルの統合でしきい値に達したときに Subcolumnization を行います。`0` の場合は書き込み時に Subcolumnization を行います。範囲は 0～1000000000 です。 |
| `variant_doc_hash_shard_count` | `64` | 不可 | DOC モード専用。格納するドキュメントを分割するカラムの数。範囲は 0～1024 で、`0` は `1` として扱われます。 |

**ALTER** 列は、`ALTER TABLE ... MODIFY COLUMN` でそのプロパティを変更できるかどうかを示します。[ALTER TABLE](#alter-table) をご覧ください。スパースカラムと DOC モードのプロパティの使い方については、[ワイドカラム](#wide-columns)をご覧ください。

### セッション変数 {#session-variables}

| 変数 | デフォルト | 説明 |
| --- | --- | --- |
| `default_variant_max_subcolumns_count` | `2048` | このプロパティを指定せずに定義した VARIANT カラムの `variant_max_subcolumns_count` の値。 |
| `default_variant_enable_typed_paths_to_sparse` | `false` | このプロパティを指定せずに定義したカラムの `variant_enable_typed_paths_to_sparse` の値。 |
| `default_variant_sparse_hash_shard_count` | `0` | このプロパティを指定せずに定義したカラムの `variant_sparse_hash_shard_count` の値。`0` は `1` として扱われます。 |
| `default_variant_max_sparse_column_statistics_size` | `10000` | このプロパティを指定せずに定義したカラムの `variant_max_sparse_column_statistics_size` の値。 |
| `default_variant_enable_doc_mode` | `false` | このプロパティを指定せずに定義したカラムの `variant_enable_doc_mode` の値。 |
| `default_variant_doc_materialization_min_rows` | `0` | このプロパティを指定せずに定義したカラムの `variant_doc_materialization_min_rows` の値。 |
| `default_variant_doc_hash_shard_count` | `64` | このプロパティを指定せずに定義したカラムの `variant_doc_hash_shard_count` の値。 |
| `describe_extend_variant_column` | `false` | `true` にすると、`DESC` に VARIANT カラムのサブカラムも表示されます。 |

`default_variant_*` 変数は、`CREATE TABLE` または `ALTER TABLE` でカラムを定義するときに適用されます。これらの変数を変更しても既存のカラムには影響しませんが、後で `MODIFY COLUMN` を実行する際にプロパティを省略すると影響します。

### BE の設定 {#be-configuration}

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON オブジェクトのキーの最大長（バイト）。これを超えるキーは解析エラーになります。範囲は 1～65535 です。 |
| `variant_throw_exeception_on_invalid_json` | `false` | `false` の場合、JSON パーサーが拒否したテキストは VARIANT の文字列として保持されます。`true` の場合は解析エラーになります。 |
| `variant_enable_duplicate_json_path_check` | `false` | `false` の場合、オブジェクト内の重複キーは解析エラーになります。`true` の場合、最初の値が保持され、重複分は無視されます。 |

これら 3 つの設定はすべて実行時に変更できます。解析エラーの報告方法については、[解析エラー](#parse-errors)をご覧ください。

## VARIANT のインデックス {#variant-indexes}

### インデックスの選択 {#choosing-indexes}

VARIANT は、サブパスに対する BloomFilter と Inverted Index をサポートします。
- カーディナリティの高い等価条件や IN 条件のフィルターには、BloomFilter を選びます（インデックスが小さく、書き込み性能に優れます）。
- トークン化、フレーズ検索、範囲検索には Inverted Index を使用し、適切な `parser` / `analyzer` プロパティを設定します。

フィルターがインデックスまたは BloomFilter を使用できるのは、パスをその格納型で比較する場合だけです。数値のパスは明示的に CAST してください。文字列のパスを文字列リテラルと比較する場合、CAST は不要です。

```sql
...
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 12345678;
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) IN (1, 2, 3);
```

VARIANT カラムに転置インデックスを作成すると、すべてのサブパスが同じインデックスプロパティ（parser など）を継承します。

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

特定の VARIANT サブパスにインデックスプロパティを指定できます。同じパスに、トークン化する転置インデックスとトークン化しない転置インデックスを両方設定することもできます。パス固有のインデックスを使うには、そのパスの型を Schema Template で宣言する必要があります。

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

Doris 4.1.5 以降では、次のインデックスプロパティまたは BE 設定を使って norms を無効にできます。

VARIANT パスのトークン化インデックスは、デフォルトで BM25 norms を書き込みます。そのパスに値がない行も含め、パスごとに行あたり 1 バイトかかります。フィルターにしか使用しないパスでは、`"norms" = "false"` で norms を無効にしてください。`field_pattern` を指定しない場合、このプロパティはインデックスが対象とするすべてのサブパスに適用されます。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms を無効にしても `MATCH` によるフィルタリングには影響しませんが、norms のないセグメントを `score()` が読み取るとエラーを返します。BE 設定の `inverted_index_skip_norms_for_variant` は、すべての VARIANT パスで norms を無効にします。詳しくは、[レコード長と norms プロパティ](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property)をご覧ください。

### インデックスが機能しない場合 {#when-indexes-dont-work}

1. 型の変更によってインデックスが失われます。サブパスが互換性のない型に変わると（例：INT → JSONB）、インデックスが失われます。Schema Template で型とインデックスを固定してください。
2. フィルターでパスをその格納型と比較していません。
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   `v['id']` が文字列として格納されている場合は、文字列と比較します：`v['id'] = '123456'`。
3. インデックスの設定が適切ではありません。インデックスは VARIANT カラム全体ではなく、サブパスに適用されます。
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

## ワイドカラム {#wide-columns}

取り込むデータに異なる JSON キーが多数含まれると、Subcolumnization によって生成されるサブカラムが急増します。規模が大きくなると、メタデータの肥大化、書き込みやマージのコスト増加、クエリの低速化につながる場合があります。このような「ワイドカラム」（サブカラムが多すぎる状態）に対応するため、VARIANT には **スパースカラム** と **DOC エンコーディング** の 2 つの仕組みがあります。

ワークロードに応じた選び方は、[VARIANT ワークロードガイド](./variant-workload-guide.md)をご覧ください。このセクションでは、仕組みと関連するプロパティについて説明します。

注：この 2 つの仕組みは同時に使えません。DOC エンコーディングを有効にするとスパースカラムは無効になり、その逆も同様です。

### スパースカラム {#sparse-columns}

**仕組み**

- システムは、NULL 以外の値の比率やスパース性に基づいてパスを順位付けします。出現頻度が高い（スパース性が低い）パスは Subcolumnization の対象となり、独立したサブカラムとして格納されます。残りの出現頻度が低い（スパースな）パスは統合され、スパースカラムに格納されます。抽出するサブカラムの最大数は `variant_max_subcolumns_count` で制御します。
- Schema Template で宣言されたパスは、デフォルトではスパースカラムに移されません。型付きパスをスパースカラムに移せるようにするには、`variant_enable_typed_paths_to_sparse` を設定します。
- スパースカラムはシャーディングをサポートします。スパースなサブパスを複数のスパースカラムに分散させることで、カラムごとの読み取り負荷を減らし、読み取り効率を高めます。物理的に格納するスパースカラムの数は `variant_sparse_hash_shard_count` で指定します。

**参考事項**

- ほとんどのキーで NULL 以外の値の比率が似ている場合（スパース性の差が小さい場合）、真にスパースなパスを見分けにくく、スパースカラムの利点は小さくなります。
- `variant_max_subcolumns_count` のデフォルトは `2048` で、ほとんどのワークロードには十分です。抽出するサブカラムをあらかじめ増やすためだけに、この値を大幅に引き上げないでください。ワークロードで大規模な Subcolumnization が本当に必要なら、[DOC モード](./variant-workload-guide.md#doc-mode-template)を選んでください。実用上の上限は、引き続き `10000` 以下に抑えることを推奨します。
- `variant_sparse_hash_shard_count` は「スパースパスの数 / 128」を目安に見積もれます。例：JSON キーの総数が約 10,000、`variant_max_subcolumns_count = 2000` の場合、スパースパスは約 8000 です。そのため、`variant_sparse_hash_shard_count` は `8000/128` 程度から始められます。

### DOC エンコーディング（DOC モード） {#doc-encoding-doc-mode}

**仕組み**

- パスに基づくクエリのために、引き続き Subcolumnization を行えます。さらに、元の JSON を格納フィールドとして保持し、JSON ドキュメント全体を効率よく返します。
- DOC エンコーディングはシャーディングをサポートします。元の JSON を複数のカラムに分割して格納し、JSON 全体を問い合わせるときに再構成します。DOC シャードの数は `variant_doc_hash_shard_count` で指定します。
- 少量ずつ書き込む場合は、Subcolumnization を省略し、後のマージまで延期できます。これは `variant_doc_materialization_min_rows` で制御します。たとえば `variant_doc_materialization_min_rows = 10000` の場合、10,000 行未満の書き込みでは元の JSON だけを格納し、そのバッチでは Subcolumnization を行いません。
- 非常に幅の広いワークロードで、Subcolumnization の規模がサブカラム 1 万件に近づく場合も、DOC モードの方が安定しています。デフォルトの即時 Subcolumnization と比べると、compaction のメモリ使用量を約 3 分の 2 削減でき、スパースなワイドカラムの取り込みスループットを約 5～10 倍に改善できます。
- `VARIANT` カラムが非常に幅広く、クエリがドキュメント全体を頻繁に読み取る場合、DOC モードでは、多数のサブカラムからドキュメントを再構成する場合と比べて `SELECT variant_col` の性能が桁違いに向上する場合があります。

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

- DOC モードには `variant_enable_doc_mode = true` が必要です。
- DOC モードでは、Schema Template のフィールドに指定できる型は文字列、整数、`FLOAT`、`DOUBLE`、`BOOLEAN`、およびこれらの型の配列に限られます。
- `variant_doc_hash_shard_count` は「JSON キーの総数 / 128」を目安に見積もれます。

### 上限に達したときの動作と調整の提案 {#behavior-at-limits-and-tuning-suggestions}

1. しきい値を超えると、新しいパスはスパースカラムに書き込まれます。Rowset のマージでも、一部のパスがスパースカラムに移される場合があります。
2. システムは、NULL 以外の値の比率とアクセス頻度が高いパスを優先して Subcolumnization の対象に残します。
3. Subcolumnization の対象が 10,000 パスに近づくと、高性能なハードウェアが必要になります（ノードあたり 128G RAM 以上、32C 以上を推奨）。ワークロードがすでにこの規模に近い場合は、まず DOC モードを評価してください。
4. データ取り込みの調整：クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms` / `group_commit_data_bytes` を増やします）。
5. バケットの枝刈りが不要な場合は、RANDOM バケット化と単一 tablet へのデータロードを有効にして、compaction による書き込み増幅を抑えることを検討してください。
6. BE の調整項目：`max_cumu_compaction_threads`（≥8）、`vertical_compaction_num_columns_per_group=500`（vertical compaction を改善しますが、メモリ使用量が増えます）、`segment_cache_memory_percentage=20`（メタデータキャッシュの効率を改善します）。
7. Compaction Score を監視してください。上昇し続ける場合は compaction が追いついていないため、データ取り込みの負荷を下げてください。
8. VARIANT に対する大規模な `SELECT *` は避け、`SELECT v['path']` のように必要な項目を指定してください。

## サブカラムと型の確認 {#inspect-subcolumns-and-types}

方法 1：[VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) を使い、値またはパスの型を行ごとに取得します。確認対象の各行を読み取ります。

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

方法 2：拡張 `DESC` を使い、Subcolumnization によって抽出されたサブパスとその格納型を表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

方法 1 は各値の型を示し、方法 2 は各パスの格納方法を示します。

## 制限事項 {#limitations}

- **ワイドテーブルの最適化**：`VARIANT` 型によって多数の動的サブカラム（例：2000 カラム超）が生成されるワイドテーブルでは、テーブルの `PROPERTIES` に `"storage_format" = "V3"` を指定して **Storage Format V3** を有効にすることを強く推奨します。これによりカラムのメタデータが Segment Footer から分離され、ファイルを開く処理が速くなり、メモリ使用量も減ります。
- JSON キーの長さは、デフォルトで最大 255 バイトです（`variant_max_json_key_length`）。
- VARIANT カラムをキー、パーティション、バケットのカラムにはできません。また、テーブルスキーマ内で別の型にネストすることもできません（[VARIANT カラムの定義](#define-a-variant-column)を参照）。
- DOC モード以外では、VARIANT カラム全体を読み取るとすべてのサブパスがスキャンされます。非常に幅広いカラムでは、DOC モードを有効にしない限り、直接 `SELECT variant_col` を実行することは一般に推奨されません。サブパスが多いカラムで `LIKE` などによるオブジェクト全体の検索が必要なら、元の JSON 文字列を別の STRING/JSONB カラムにも格納することを検討してください。

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

- 格納：JSON は JSONB（行指向）として格納されます。VARIANT は書き込み時に Subcolumnization を行うため、圧縮率が高く、サイズが小さくなります。
- クエリ：JSON には解析が必要です。VARIANT はカラムを直接スキャンするため、通常は大幅に高速です。

変更を加えた ClickBench（43 クエリ）の結果：
- 格納：VARIANT は JSON と比べて約 65% の容量を節約します。
- クエリ：VARIANT は JSON より 8 倍以上速く、事前定義された静的カラムに近い性能です。

**格納容量**

| 型 | サイズ |
| ------------------- | ---------- |
| 事前定義されたカラム | 12.618 GB |
| VARIANT | 12.718 GB |
| JSON | 35.711 GB |

**約 65% の容量削減**

| 実行 | 事前定義されたカラム | VARIANT | JSON |
| ----------------| ---------- | ------- | --------------- |
| 初回（コールド） | 233.79s | 248.66s | ほとんどがタイムアウト |
| 2 回目（ウォーム） | 86.02s | 94.82s | 789.24s |
| 3 回目（ウォーム） | 83.03s | 92.29s | 743.69s |

## FAQ {#faq}

1. VARIANT の `null` と SQL `NULL` は同じですか？
   - いいえ。クエリ内で計算された JSON の `null` は VARIANT の `null` 値ですが、存在しないパスは SQL `NULL` です。値を格納すると、配列の外にあるオブジェクトの `null` メンバーは削除され、SQL `NULL` として読み戻されます。[NULL の意味](#null-semantics)をご覧ください。
2. `INSERT INTO t VALUES (1, '{"a": 1}')` の後に `v['a']` が `NULL` を返すのはなぜですか？
   - `INSERT` は文字列を解析せず、VARIANT の文字列として格納します。`s3()`、`hdfs()`、別の文字列カラムからの `INSERT INTO ... SELECT` も同様です。`PARSE_TO_VARIANT('{"a": 1}')` を使用するか、Stream Load などのデータロードジョブでデータをロードしてください。[データの書き込み](#write-data)をご覧ください。
3. 有効な JSON なのに、JSON ドキュメント全体が文字列として格納されるのはなぜですか？
   - ドキュメントに [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値が含まれている可能性があります。パーサーはそのようなドキュメントを拒否し、デフォルトでは文字列として保持します。[解析エラー](#parse-errors)をご覧ください。
4. クエリやインデックスが機能しないのはなぜですか？
   - パスを格納型へ CAST しているか（暗黙的な数値比較ではインデックスを使用できません）、型の競合によって JSONB に変更されていないか、サブパスではなく VARIANT 全体にインデックスが適用されると誤解していないかを確認してください。
5. `ORDER BY v['a']` で `"10"` が `9` の後に並んだり、`GROUP BY v['a']` で `1` と `"1"` が別のグループになったりするのはなぜですか？
   - VARIANT の並び順と等価性は、まず値の種類を見ます。数値は文字列より前に並び、数値が文字列と等しくなることはありません。数値または辞書順の意味で処理する必要がある場合は、パスを単一の型へ CAST してください。[比較、グループ化、並び順](#comparison-grouping-and-ordering)をご覧ください。
6. `v['a']` が文字列のとき、`COALESCE(v['a'], 0)` はなぜ `0.000000000` を返し、`IF(..., v['a'], 1)` はなぜ `NULL` を返すのですか？
   - VARIANT を別の型と混在させると、VARIANT 値はその別の型に変換されます。整数と混在する場合は `DECIMAL(38, 9)` です。`"abc"` のような文字列は変換できず `NULL` になるため、`COALESCE` は `0` を `0.000000000` として返します。VARIANT の結果を保持するには `COALESCE(v['a'], CAST(0 AS VARIANT))` と記述するか、`v['a']` を必要な型へ CAST してください。
7. DECIMAL を VARIANT カラムに書き込むと精度が失われるのはなぜですか？
   - 小数部を持つ JSON 数値は `DECIMAL` ではなく `DOUBLE` と推論されるため、末尾の桁が失われる場合があります。たとえば Schema Template でパスを `v VARIANT<'num': DECIMAL(9, 3)>` と宣言しても、値が先に `DOUBLE` として解析されるため、完全には解決しません。ドキュメント内で値を JSON 文字列として書き込んでください。例：`PARSE_TO_VARIANT('{"num": "12.345"}')`。これにより、精度を失わずに `DECIMAL(9, 3)` へ直接変換されます。
