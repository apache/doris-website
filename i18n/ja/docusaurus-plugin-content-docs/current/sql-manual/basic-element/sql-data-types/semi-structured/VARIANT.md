---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT は半構造化 JSON を格納します。書き込みと解析の規則、CAST、NULL のセマンティクス、順序付け、Schema Template、ALTER、プロパティ、インデックス、制限について説明します。"
}
---

## 概要 {#overview}

VARIANT 型は、オブジェクト、配列、文字列、数値、真偽値、`null` を含む半構造化 JSON データを格納します。書き込み時、Doris は各 JSON パスの型を推論し、出現頻度の高いパスに Subcolumnization を適用して、独立した列指向のサブカラムとして格納します。そのパスに対するクエリは、必要なサブカラムだけを読み取ります。

:::tip VARIANT を使う理由
ドキュメントの構造が時間とともに変わっても、クエリが少数の頻繁に使うパスに集中する場合、`VARIANT` が適しています。

- 頻繁に使うパスは Subcolumnization の対象となり、列指向処理の性能、ファイルの枝刈り、ベクトル化実行の恩恵を受けられます。
- 重要なパスにはパス単位のインデックスや全文検索を利用でき、Doris のスパースインデックスによる枝刈りも活用できます。
- ワイドカラム向けの最適化により、サブカラムが 10k 規模でも自動 Subcolumnization を実用的に利用できます。ただし、Subcolumnization の対象パスが 10,000 に近づくとハードウェア要件が急激に高まるため、通常は DOC mode から検討するほうが安全です。

デフォルトの動作、スパースカラム、DOC mode、Schema Template の選択には、まず [Variant ワークロードガイド](./variant-workload-guide.md) を参照してください。このページでは、書き込みと解析、型の規則、CAST、NULL と比較のセマンティクス、ALTER、インデックス、制限、設定について説明します。
:::

:::info バージョン
このページでは Doris 5.0.0 以降の VARIANT について説明します。Doris 4.x との違いのうち、既存の SQL に影響しやすいものは次のとおりです。

- `INSERT` は文字列を JSON として解析せず、VARIANT 文字列として格納します。`s3()` や `hdfs()` などのテーブル関数から `INSERT INTO ... SELECT` する場合も同様です。`INSERT` で JSON テキストを書き込むには `PARSE_TO_VARIANT` を使用します。Stream Load などのデータロードジョブは引き続き JSON を解析します。
- VARIANT 値全体に対して `GROUP BY`、`DISTINCT`、集合演算を使用できます。2 つの VARIANT 値は `=`、`!=`、`<=>` で比較でき、結合キー、`ORDER BY` キー、ウィンドウキーにも使用できます。
- `VARIANT_TYPE` は、パスから型へのマップではなく、`object` などの型名を 1 つ返します。
- VARIANT 配列には、1 から始まる整数のインデックスでアクセスできます。

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
- パスを比較や計算に使用する前に、CAST で具体的な型に変換します。
- Stream Load などのデータロードジョブは JSON テキストを自動的に解析します。[データの書き込み](#write-data)を参照してください。

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
- `properties(...)` はカラム単位のストレージプロパティを設定します。[カラムプロパティ](#column-properties)を参照してください。
- VARIANT カラムには `NULL` または `NOT NULL` を指定できます。許可されるデフォルト値は `NULL` のみです。
- トップレベルの VARIANT カラム名には、バッククォートで囲んだ場合でもドット（`.`）を含められません。たとえば `` `v.x` VARIANT `` は無効です。この制限は `CREATE TABLE` と `ALTER TABLE` に適用されますが、VARIANT 値内の JSON フィールド名には適用されません。

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
| テーブルスキーマで別の型の内部に配置（`ARRAY<VARIANT>`、`MAP`、`STRUCT`） | 不可 | クエリ結果は、たとえば `COLLECT_LIST(v)` の結果のように `ARRAY<VARIANT>` にできます。 |
| デフォルト値 | `NULL` のみ | `DEFAULT '{}'` など、NULL 以外のデフォルト値は拒否されます。 |

## データの書き込み {#write-data}

`INSERT` と `CAST` は文字列を VARIANT 文字列として保持します。`PARSE_TO_VARIANT`、`TRY_PARSE_TO_VARIANT`、Stream Load などのデータロードジョブは JSON テキストを解析します。データロードの例については、[VARIANT データのロード](../../../../data-operate/import/complex-types/variant.md)を参照してください。

### 解析エラー {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)、[TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)、データロードジョブは同じ JSON パーサーを使用します。データロードジョブのエラー処理は `TRY_PARSE_TO_VARIANT` と同じです。

| 入力 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` とデータロードジョブ |
| --- | --- | --- |
| 有効な JSON | 解析された値 | 解析された値 |
| `hello` や `{"id":` など、有効な JSON ではないテキスト | VARIANT 文字列として保持 | VARIANT 文字列として保持 |
| `{"a": 1, "n": 100000000000000000000}` など、[-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値を含む JSON | テキスト全体を VARIANT 文字列として保持するため、`v['a']` は `NULL` を返します | テキスト全体を VARIANT 文字列として保持 |
| 空文字列 | 空のオブジェクト `{}` | 空のオブジェクト `{}` |
| ネストが 128 階層を超える場合 | エラー | SQL `NULL` |
| オブジェクトのキーが `variant_max_json_key_length` バイトを超える場合（BE 設定、デフォルト 255） | エラー | SQL `NULL` |
| 同じオブジェクト内に重複キーがある場合 | エラー | SQL `NULL` |
| 有効な UTF-8 ではない文字列 | エラー | SQL `NULL` |

JSON パーサー自体が拒否するほど深くネストしたドキュメント（約 1,000 階層）は無効な JSON であるため、文字列として保持されます。

次の 2 つの BE 設定は、この規則を変更します。

- `variant_throw_exeception_on_invalid_json`（デフォルト `false`）：`true` の場合、範囲外の数値を含む JSON など、パーサーが拒否するテキストは、VARIANT 文字列として保持されません。`PARSE_TO_VARIANT` ではエラー、`TRY_PARSE_TO_VARIANT` とデータロードジョブでは SQL `NULL` になります。
- `variant_enable_duplicate_json_path_check`（デフォルト `false`）：`true` の場合、オブジェクト内で重複したキーはエラーにならず、最初の値が保持されます。ドットを含むキーがネストしたパスと重複しても書き込みは失敗せず、いずれか一方の値だけが格納されます。

範囲外の整数を含むドキュメントを構造化されたまま保持するには、JSON を経由して変換します：`CAST(CAST(text AS JSON) AS VARIANT)`。最大 38 桁の整数は正確な数値として保持され、それより大きく `LARGEINT` の範囲内にある整数は文字列になり、さらに大きい整数は `DOUBLE` になります。`PARSE_TO_VARIANT(CAST(text AS JSON))` は JSON テキストを再解析するため、この問題の解決にはなりません。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### 格納後に保持される値 {#what-storage-keeps}

値をテーブルに書き込むと正規化されます。読み戻した値は、書き込み前に計算された値と異なる場合があります。

| 書き込み前 | テーブルから読み戻した値 |
| --- | --- |
| `{"a": null, "b": 1}` のように、値が JSON `null` のオブジェクトメンバー | メンバーは削除されます：`{"b":1}`。`v['a']` は SQL `NULL` を返します。 |
| `{"a": {}, "b": [], "c": {"d": null}}` のように、値が空のオブジェクトや配列のメンバー、またはこれらの規則によって空になるオブジェクト | 削除されます：`{}` |
| `{"p": [null, null], "q": 1}` のように、値が `null` だけを含む配列のオブジェクトメンバー | 削除される場合があります：`{"q":1}` |
| `{"arr": [{"a": null}, {}, [], null]}` のような配列内の値 | そのまま保持されます。`v['arr'][1]['a']` は VARIANT `null` です。 |
| `PARSE_TO_VARIANT('null')` のようなルートの JSON `null` | 空のオブジェクト `{}` |
| ルートの空配列 `[]` または空オブジェクト `{}` | 保持されます |
| `CAST(date_col AS VARIANT)` のようなルート値の `DATE` や `DATETIME`、または他の型の値も存在するパス上のこれらの値 | テキストとして格納され、読み戻すと文字列になります。日付だけを保持するオブジェクトパスでは、型が維持されます。 |
| 同じパスに混在する真偽値と数値 | 同じ書き込み内での値の順序やコンパクションによって、真偽値が `1` または `0` として読み戻される場合があります |
| `{"a.b": 1}` のようにドットを含むキー | ネストしたパスとして格納されます：`{"a":{"b":1}}`。`v['a.b']` と `v['a']['b']` はどちらも `1` を返します。ドキュメントにキー `a.b` と、`a` 内のキー `b` の両方があると、`variant_enable_duplicate_json_path_check` が `true` でない限り、INSERT またはデータロードジョブ全体が失敗します。 |
| オブジェクトのキー | バイト順で返されます |

これらの規則は、同時に書き込まれる他の行や DOC mode にも依存します。そのため、`null` 値や空のコンテナーが格納後も残ることを前提にしないでください。Schema Template で宣言したパスは、代わりに宣言された型に変換されます。[Schema Template](#schema-template) を参照してください。

## 型推論と型の競合 {#type-inference-and-type-conflicts}

Schema Template がない場合、Doris は JSON の解析時に各値の型を推論します。`VARIANT_TYPE` はその型を返します。

| JSON 値 | 型 |
| --- | --- |
| `BIGINT` の範囲内の整数 | 値を格納できる最小の `tinyint`、`smallint`、`int`、`bigint` |
| `BIGINT` の範囲を超え、18446744073709551615 以下の整数 | `decimal` |
| 小数部分または指数を含む数値 | `double` |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値 | 数値にはなりません。テキスト全体が無効な JSON として扱われます（[解析エラー](#parse-errors)を参照） |
| 文字列 | `string` |
| `true`、`false` | `bool` |
| `null` | `null` |
| 配列、オブジェクト | `array`、`object` |

データの格納時には、各パスに 1 つの格納型が割り当てられます。

- 整数は `BIGINT`、必要な場合は `LARGEINT` として格納されます。浮動小数点数は `DOUBLE`、十進数は `DECIMAL`、文字列は `STRING`、真偽値は `BOOLEAN`、スカラー値の配列は `ARRAY<T>` として格納されます。
- オブジェクトの配列、ネストした配列、および整数と浮動小数点数、数値と文字列、スカラー値と配列のように型の異なる値を持つパスは、`JSONB` として格納されます（`DESC` では `json` と表示）。要素の型が競合する配列は `ARRAY<JSONB>` になります。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

`JSONB` パスはすべての値を保持しますが、型付きの格納ではなくなるため、そのパスではインデックスと型に基づく枝刈りが使えなくなります。真偽値は例外です。パスの最初の値が真偽値で後続の値が数値の場合、そのパスが数値として格納され、真偽値が `1` または `0` として読み戻されることがあります。安定した型が必要なパスは Schema Template で宣言してください。

`VARIANT_TYPE` は各値の型を報告するため、`BIGINT` パスから読み出した整数でも `tinyint` になる場合があります。各パスの格納型を確認するには、`SET describe_extend_variant_column = true;` を実行してから `DESC table_name;` を実行します。[サブカラムと型の確認](#inspect-subcolumns-and-types)を参照してください。

## パスへのアクセスと出力 {#access-paths-and-output}

- `v['key']` と `v['a']['b']` はオブジェクトのメンバーを読み取ります。`v['arr'][1]` は配列要素を読み取ります。インデックスは 1 から始まり、`-1` は最後の要素を表します。[ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) も同等です。
- 結果は `VARIANT` 値です。存在しないキー、インデックス `0`、範囲外のインデックス、配列に対する文字列キー、オブジェクトに対する整数インデックス、スカラー値に対するキーは、いずれも SQL `NULL` を返します。
- 計算された値では、ドットを含むキーは 1 つのキーです。`v['a.b']` はキー `a.b` を読み、`v['a']['b']` は `a` 内の `b` を読みます。格納時にはこの区別は保持されません。[格納後に保持される値](#what-storage-keeps)を参照してください。
- パスは配列の各要素に自動適用されません。`{"a": [{"b": 1}]}` に対して、`v['a']['b']` は `NULL` を返します。`v['a'][1]['b']` を使用してください。

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

一般的には、クエリに必要な型へパスを CAST します。

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

VARIANT 値全体を読み取ると JSON テキストが返されます。オブジェクトのキーはバイト順で、空白なしで返されるため、入力とはバイト単位で一致しません。ルートの文字列は引用符なしで返されます。

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
| `CHAR`、`VARCHAR`、`STRING` | VARIANT 文字列。JSON テキストは解析されません。文字列は有効な UTF-8 でなければならず、そうでない場合は CAST が失敗します。 |
| `BOOLEAN` | 真偽値。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT` | 整数。 |
| `LARGEINT` | 十進数。絶対値が 10^38 - 1 を超える値は文字列になります。 |
| `FLOAT`、`DOUBLE` | 浮動小数点数。 |
| `DECIMALV2`、`p <= 38` の `DECIMAL(p, s)` | 十進数。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付、またはタイムゾーンのないタイムスタンプ。 |
| `IPV4`、`IPV6` | 値のテキスト表現を持つ文字列。 |
| `JSON` / `JSONB` | 同じ構造。`DECIMAL256` の数値など、VARIANT が保持できない値やオブジェクト内の重複キーがあると CAST は失敗します。 |
| `ARRAY<T>` | 各要素を変換した配列。`T` は `VARIANT` またはこの表にある型である必要があります。 |
| `MAP`、`STRUCT`、`TIME`、`TIMESTAMPTZ`、`VARBINARY`、その他の型 | サポートされません。ステートメントは失敗します。 |

変換元の値は、それ自体の型としても有効である必要があります。無効な値は修復されずに拒否されます。CAST は文字列を解析しません。`CAST('{"id": 1}' AS VARIANT)` は文字列 `{"id": 1}` になります。JSON テキストを解析するには `PARSE_TO_VARIANT` を使用してください。

### VARIANT からの CAST {#cast-from-variant}

| 変換先の型 | 結果 |
| --- | --- |
| `BOOLEAN` | 真偽値はそのままです。数値はゼロ以外なら `true` です。文字列は `CAST(string AS BOOLEAN)` と同じ方法で変換されます。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 整数。十進数または浮動小数点数の小数部分は切り捨てられます（`1.5` は `1`）。真偽値は `1` または `0` になります。`"123"` のような数値文字列も変換されます。 |
| `FLOAT`、`DOUBLE`、`DECIMAL(p, s)` | 数値と数値文字列。`DECIMAL` はスケール `s` に丸められます。`FLOAT` には大きすぎる値は `Infinity` になります。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付と時刻の値、日付または時刻形式の文字列、`20240102` のような数値。 |
| `TIMESTAMPTZ(p)` | 日付と時刻の値、および日付または時刻形式の文字列。 |
| `IPV4`、`IPV6` | IP アドレス形式の文字列。 |
| `CHAR`、`VARCHAR`、`STRING` | ルートの文字列は引用符なしでそのまま返されます。オブジェクトと配列は JSON テキストとして返されます。その他のスカラー値は対応する SQL 型と同じ形式になり、ルートの真偽値は `1` または `0`、`DATETIME` 値は小数部 6 桁、`TIMESTAMP_NS` 値は小数部 9 桁になります。VARIANT `null` は文字列 `null` になります。 |
| `JSON` / `JSONB` | 同じ構造。日付やタイムスタンプなど JSON に対応する型がない値は JSON 文字列になります。タイムゾーン付きタイムスタンプはセッションのタイムゾーンで書式化されます。 |
| `ARRAY<T>` | 要素ごとに変換された配列。変換できない要素は `NULL` になります。`"[1, 2]"` のように JSON 配列を含む文字列も変換されます。それ以外の値は `NULL` を返します。 |
| `MAP`、`STRUCT`、`TIME`、その他の型 | サポートされません。ステートメントは失敗します。 |

変換先の型に変換できない値は、`enable_strict_cast` が有効な場合も SQL `NULL` を返します。ただし、数値から `TIMESTAMPTZ`、`IPV4`、`IPV6` への変換や、日付またはタイムスタンプから `BOOLEAN` への変換のように、値の型から変換先の型への変換自体が存在しない場合は、ステートメントが失敗します。

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

これらの型を VARIANT に変換する場合の動作は次のとおりです。

| Doris の型 | 動作 |
| --- | --- |
| 従来の `DECIMALV2` | 精度が最大 27、スケールが最大 9 の値は正確に保持されます。 |
| `DECIMAL(p, s)` | `1 <= p <= 38` かつ `0 <= s <= p` の値は正確に保持されます。精度が 38 を超える十進数はサポートされません。 |
| `DATE` | 時刻やタイムゾーンを含まない暦日。 |
| `DATETIME(p)` | `0 <= p <= 6`。タイムゾーン調整は行われません。 |
| `TIMESTAMP_NS` | ナノ秒精度。タイムゾーン調整は行われず、値は TIMESTAMP_NS の範囲内である必要があります。 |
| `TIMESTAMPTZ(p)` | CAST でも Schema Template のパスとしてもサポートされません。 |
| `TIME` | サポートされません。 |

## NULL のセマンティクス {#null-semantics}

VARIANT には 2 種類の null があります。

- **SQL `NULL`** は値がないことを意味します。カラム値が `NULL` の場合、`v['no_such_key']` のようにパスが存在しない場合、または CAST が失敗した場合に生じます。
- **VARIANT `null`** は、`PARSE_TO_VARIANT('null')` や配列内の `null` 要素のような、JSON リテラル `null` という値です。`VARIANT_TYPE` はこれに対して `null` を返します。

| 操作 | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| VARIANT の `x` を使う `COALESCE(v, x)`、`IFNULL(v, x)` | `x` を返します | VARIANT `null` を返します |
| `COUNT(v)` | カウントされません | カウントされます |
| `GROUP BY v`、`DISTINCT` | すべての SQL `NULL` が 1 つのグループになります | すべての VARIANT `null` が別のグループになります |
| `v = x`、等価結合 | 一致しません | 別の VARIANT `null` と一致します |
| `ORDER BY v` | `NULLS FIRST` または `NULLS LAST` に従って配置されます | 昇順では、NULL 以外のすべての値より前に配置されます |
| `CAST(v AS STRING)` | SQL `NULL` | 文字列 `null` |

値を格納すると、配列外のオブジェクトで値が `null` のメンバーは削除されるため、読み取ると SQL `NULL` を返します。ルートの `null` は `{}` として読み戻されます（[格納後に保持される値](#what-storage-keeps)を参照）。そのため、格納済みデータの `v['a'] IS NULL` では、存在しないメンバーと `null` のメンバーを区別できません。

## 比較、グループ化、順序付け {#comparison-grouping-and-ordering}

VARIANT 値は、テキストや物理エンコーディングではなく、論理値で比較されます。等価判定、ハッシュ化（`GROUP BY`、`DISTINCT`、結合）、順序付け（`ORDER BY`、ウィンドウキー）には同じ規則が適用されるため、等しい値は必ず同じグループに入り、ソート時も同順位になります。

### サポートされる操作 {#supported-operations}

| VARIANT 値に対する操作 | サポート | 備考 |
| --- | --- | --- |
| 2 つの VARIANT 値の間、または `NULL` リテラルとの `=`、`!=`、`<=>` | 可 | `v['a'] = w['a']` のようなサブパスも含みます。 |
| 等価結合、セミ結合とアンチ結合、`IN` と `NOT IN` のサブクエリ | 可 | VARIANT の結合キーにはランタイムフィルターが生成されません。 |
| `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`UNION`、`INTERSECT`、`EXCEPT` | 可 | |
| `ORDER BY`、`ORDER BY ... LIMIT` | 可 | |
| ウィンドウの `PARTITION BY` と `ORDER BY` | 可 | |
| `COUNT(v)`、`COLLECT_LIST(v)`、`ARRAY_AGG(v)` | 可 | |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 可 | VARIANT と別の型を混在させると、VARIANT 値はもう一方の型に変換されます（もう一方が整数の場合は `DECIMAL(38, 9)`）。変換できない値は `NULL` になります。 |
| `CAST(v AS ARRAY<VARIANT>)`、`EXPLODE_VARIANT_ARRAY`、`ARRAY<VARIANT>` に対する `EXPLODE` と `EXPLODE_OUTER` | 可 | |
| VARIANT 値同士の `<`、`<=`、`>`、`>=`、`BETWEEN` | 不可 | 先に具体的な型へ CAST してください。 |
| `v = 1` のような、VARIANT 値全体と VARIANT 以外の値との比較 | 不可 | サブパスは暗黙的に変換されるため、`v['a'] = 1` は使用できます。 |
| `v IN (PARSE_TO_VARIANT('1'))` のような、VARIANT 値を含む `IN` リスト | 不可 | VARIANT 以外の値を使う `v IN ('a', 'b')` は暗黙の変換によって使用できます。 |
| `MIN`、`MAX` | 不可 | 先にサブパスを CAST してください。 |
| VARIANT を引数に取る `ARRAY(...)`、`MAP(...)`、`NAMED_STRUCT(...)` | 不可 | |

### 等価性 {#equality}

- **数値。** 整数、小数部分がゼロの十進数、整数値の浮動小数点数は等価です。`1`、`1.0`、`1.00` は 1 つの値です。十進数の末尾のゼロは影響せず、`-0.0` は `0` と等価です。小数部分がある十進数と浮動小数点数は等価になりません。`DECIMAL 1.5` は `DOUBLE 1.5` と等価ではありません。小数部分を持つ JSON 数値は `DOUBLE` として解析されます。十進数は CAST、Schema Template のパス、`BIGINT` には大きすぎる整数から生じます。
- **種類の異なる値は等価になりません。** 数値 `1`、文字列 `"1"`、`true` はそれぞれ別の値です。`DATE` は文字列 `"2024-01-01"` と等価ではなく、タイムゾーンのないタイムスタンプもタイムゾーン付きタイムスタンプと等価ではありません。
- **文字列**は、バイトが同じ場合にのみ等価です。比較では大文字と小文字を区別します。
- **オブジェクト**は、同じキーを持ち、対応する値がすべて等しい場合に等価です。キーの順序は影響しません。
- **配列**は、長さが同じで、同じ位置の要素がすべて等しい場合に等価です。
- VARIANT `null` は別の VARIANT `null` と等価です。SQL `NULL` には SQL の規則が適用されます。

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### 順序付け {#ordering}

VARIANT 値に対する `ORDER BY` は、単一の全順序を使用します。種類が異なる値は、まず種類によって次の順に並びます。

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

binary、time、UUID の値は Doris の JSON 解析や CAST では生成できません。VARIANT カラムを持つ Parquet ファイルなど、他のシステムが書き込んだ VARIANT データからのみ取得できます。

同じ種類の値は、次の規則で並びます。

- **真偽値：** `false` が `true` より前です。
- **数値：** 整数（`INT`、`BIGINT` など）、十進数（`DECIMAL`）、浮動小数点数（`FLOAT`、`DOUBLE`）は数値順に並びます。`INT 1`、`FLOAT/DOUBLE 1.0`、`DECIMAL 1.00` は等価で、同じ位置に並びます。十進数の末尾のゼロは影響しません。等しい非整数値では十進数が先に並びます。`DECIMAL 1.5` は `FLOAT/DOUBLE 1.5` より前であり、VARIANT 値としては等価ではありません。浮動小数点数の精度も順序に影響します。`DOUBLE 0.1` は `DECIMAL 0.1` よりわずかに大きくなります。負の無限大が最初で、正の無限大、その後に NaN が最後に並びます。
- **文字列：** UTF-8 のバイト順に並びます。大文字は小文字より前で、`"10"` は `"9"` より前です。
- **日付とタイムスタンプ：** 時間順に並びます。すべての日付はすべてのタイムスタンプより前です。
- **オブジェクト：** キー順にエントリを 1 つずつ比較します。最小のキー、対応する値、次のキーの順に比較します。一方のエントリ列が他方の接頭部分にあたる場合は短いほうが先なので、`{"a":1}` < `{"a":1,"b":2}` < `{"b":0}` となります。
- **配列：** 要素を 1 つずつ比較し、接頭部分にあたる配列が先に並びます。したがって、`[]` < `[null]` < `[1]` < `[1,2]` です。

SQL `NULL` は `NULLS FIRST` または `NULLS LAST` に従って配置されます。

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

比較に VARIANT の規則を使うか、具体的な型の規則を使うかは、オペランドによって決まります。値が `1`、`1.0`、`"1"` のパス `a` を例にします。

| 式 | 比較に使う型 | 結果 |
| --- | --- | --- |
| `v['a'] = 1` | `v['a']` を暗黙的に CAST した `DECIMAL(38, 9)` | すべての値に一致 |
| `v['a'] = CAST(1 AS VARIANT)`、`v['a'] = w['a']` | VARIANT | `1` と `1.0` に一致し、`"1"` には一致しません |
| `GROUP BY v['a']` | VARIANT | `1` と `1.0` が 1 つのグループ、`"1"` が別のグループになります |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | `1` の 1 つのグループになります |
| `ORDER BY v['a']` | VARIANT | 数値が先、文字列が後になります |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 数値順。変換できない値は `NULL` になります |

### 注意事項 {#notes}

- **コスト。** VARIANT キーは論理値に基づいてハッシュ化・比較されます。4400 万行のベンチマークでは、VARIANT キーに対する `GROUP BY`、ソート、結合は、`CAST(v['path'] AS <type>)` に対する同じ操作の 1.2～3.7 倍の時間がかかりました。パスの型が既知であれば CAST してください。
- **結果は格納された値に従います。** [格納後に保持される値](#what-storage-keeps)にある正規化は比較前に行われます。`null` だったメンバーは存在しなくなり、ルート値の `DATE` は文字列として比較され、同じパスに数値と混在する真偽値は `1` または `0` として読み戻される場合があります。型が重要なパスは Schema Template で宣言してください。
- **型が混在する場合は、値より先に種類で並びます。** パスに数値と数値文字列の両方があると、`ORDER BY v['a']` ではすべての数値がすべての文字列より前になり、文字列はバイト順に並びます。数値順または辞書順が必要なら、1 つの型に CAST してください。
- **表示が同じでも値が異なる場合があります。** `GROUP BY` の結果では、数値 `1` と文字列 `"1"` は同じように表示されますが、別のグループになります。`VARIANT_TYPE` で区別できます。
- 種類をまたぐ順序は、結果を決定的にするため Doris が定義しています。JSON 標準の一部ではなく、他のシステムとは異なる場合があります。
- VARIANT 値の内部ハッシュは実装の詳細であり、ユーザー向けの安定したチェックサムではありません。

## Schema Template {#schema-template}

Schema Template は、選択したパスの格納型を宣言します。安定した型やパス固有のインデックスが必要な重要パスだけを宣言し、ドキュメントの残りの部分は動的なままにします。

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
- `ARRAY<T>`。`T` は上記のいずれかの型で、配列は 1 次元のみ

### テンプレートのパスへの書き込み {#writing-to-template-paths}

宣言済みのパスでは、各値が非厳格モードの CAST 規則で宣言された型に変換されます。変換できない値は `NULL` として格納され、読み戻すとそのパスは存在しません。行の残りの部分は書き込まれます。変換によって値が変わる場合があります。

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

- `"123"` は `123` になり、`1.7` は `1` に切り捨てられ、`9.999` は `10.00` に丸められます。タイムスタンプは宣言された精度（ミリ秒）を保持しますが、テキスト形式では常に小数部 6 桁が表示されます。
- `"abc"`、`"x"`、`"not a time"` は変換できないため、削除されます。
- 小数部分を含む JSON 数値は変換前に `DOUBLE` として解析されるため、`DECIMAL` パスでは精度が失われる場合があります。すべての桁を保持するには、値を JSON 文字列として書き込んでください（[FAQ](#faq)を参照）。
- 日付と IP の値は JSON 文字列にする必要があります。`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は有効な JSON ではありません。`{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` を書き込んでください。

:::caution
値の JSON 型から宣言された型への変換が存在する場合にのみ、その値が変換されます。`IPV4` または `IPV6` パスに JSON 数値があると、書き込み全体が失敗します。1 回の書き込みで `DATE`、`DATETIME`、`IPV4`、`IPV6` のパスに JSON 文字列と数値が混在すると、そのパスにある有効な値まで削除される場合があります。これらのパスの値は JSON 文字列として書き込んでください。
:::

### テンプレートのパスの読み取り {#reading-template-paths}

宣言済みのパスでも、`v['path']` は `VARIANT` 型のままです。Doris は宣言された型へ自動的に CAST しません。宣言された型が必要な場合は明示的に CAST してください。フィルター内でも宣言された型に CAST すると、そのパスのゾーンマップやインデックスをクエリで利用できます。

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template が決めるのは値の格納方法だけです。同じ JSON をクエリ内で計算した場合は、解析された型が維持されます。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### パターンマッチング {#pattern-matching}

フィールド名はデフォルトで glob パターン（`MATCH_NAME_GLOB`）です。`*` はネストしたキーの間の `.` を含む任意の文字列に一致し、`?` は 1 文字に一致します。たとえば `'m*'` は `m1` と `m2.x` の両方に一致します。パスが複数のフィールドに一致した場合は、定義順で最初のフィールドが使われます。

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

`*` を含む名前に文字どおり一致させるには、`MATCH_NAME` を使用します。

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

一致したパスはデフォルトで Subcolumnization の対象になります。一致するパスが多すぎてサブカラムが増えすぎる場合は、`variant_enable_typed_paths_to_sparse` を検討してください（[カラムプロパティ](#column-properties)を参照）。

カラム作成後に Schema Template は変更できません。[ALTER TABLE](#alter-table) を参照してください。

## ALTER TABLE {#alter-table}

`ADD COLUMN`（一括追加を含む）、`MODIFY COLUMN`、`RENAME COLUMN` でも、トップレベルの VARIANT カラム名にドットを含めることはできません。たとえば、次のステートメントは拒否されます。

```sql
ALTER TABLE example_tbl ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

`ALTER TABLE` では次の操作をサポートします。

- Schema Template とプロパティの有無にかかわらず、NULL を許可する VARIANT カラムの `ADD COLUMN`。
- `DROP COLUMN`、`RENAME COLUMN`、`MODIFY COLUMN ... COMMENT '...'`。
- `ADD INDEX` と `DROP INDEX`。`field_pattern` を持つインデックスは `CREATE TABLE` でのみ定義できます。
- Schema Template のないカラムで、`NOT NULL` から `NULL` への変更、および `variant_doc_materialization_min_rows` の変更。`MODIFY COLUMN` には完全なカラム定義が必要です。省略したプロパティはデフォルト値になります（[カラムプロパティ](#column-properties)を参照）。デフォルト値と異なるプロパティはすべて再指定してください。

次の操作はサポートされません。

- `ADD COLUMN ... VARIANT NOT NULL`。`ALTER` で追加する `NOT NULL` カラムにはデフォルト値が必要ですが、VARIANT で許可されるのは `DEFAULT NULL` のみです。`NOT NULL` の VARIANT カラムは `CREATE TABLE` で定義してください。
- 既存のカラムへの Schema Template の追加。Schema Template を持つカラムで `MODIFY COLUMN` によって変更できるのはコメントのみです。同じテンプレートを再指定する場合を含め、それ以外の変更は失敗します。
- `variant_doc_materialization_min_rows` 以外のプロパティ変更、`NULL` から `NOT NULL` への変更、VARIANT と他の型の間の変換。
- VARIANT カラムに対する `BUILD INDEX`。

これらの変更が必要な場合は、新しい定義でテーブルを作成し、`INSERT INTO ... SELECT` でデータをコピーしてください。変換元が `STRING` カラムなら `PARSE_TO_VARIANT` で囲みます。

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## カラムプロパティ {#column-properties}

カラムプロパティは VARIANT 型内の `properties(...)` で設定します。

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
| `variant_max_subcolumns_count` | `2048` | 不可 | 1 つのデータファイルで Subcolumnization の対象となる動的パス数の上限です。NULL 以外の値が多いパスが優先され、残りはスパースカラムに格納されます。`0` は無制限を意味します。範囲は 0～100000 ですが、10000 以下にしてください。デフォルト値でほとんどのワークロードに対応できます。はるかに多くのサブカラムが必要な場合は、[DOC mode](./variant-workload-guide.md#doc-mode-template) を優先して検討してください。 |
| `variant_enable_typed_paths_to_sparse` | `false` | 不可 | デフォルトでは、Schema Template のパスは常に Subcolumnization の対象となり、`variant_max_subcolumns_count` に算入されません。`true` にすると上限に算入され、スパースカラムに格納される場合があります。 |
| `variant_sparse_hash_shard_count` | `1` | 不可 | スパースパスをハッシュで分配する物理的なスパースカラムの数です。範囲は 0～1024 で、`0` は `1` として扱われます。 |
| `variant_max_sparse_column_statistics_size` | `10000` | 不可 | 1 つのデータファイルで統計情報を記録するスパースパス数の上限です。これを超えると、統計情報のないパスに対するクエリではスパースカラムをスキップできません。範囲は 1～50000 です。 |
| `variant_enable_doc_mode` | `false` | 不可 | DOC mode を有効にします。`variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse`、`variant_max_sparse_column_statistics_size`、`variant_sparse_hash_shard_count` と同時に設定することはできません。 |
| `variant_doc_materialization_min_rows` | `0` | Schema Template がない場合のみ | DOC mode 専用です。このしきい値より行数が少ない書き込みではドキュメントのみを格納し、コンパクションでファイルがしきい値までマージされた時点で Subcolumnization を行います。`0` の場合は書き込み時に Subcolumnization を行います。範囲は 0～1000000000 です。 |
| `variant_doc_hash_shard_count` | `64` | 不可 | DOC mode 専用です。格納するドキュメントを分割するカラム数です。範囲は 0～1024 で、`0` は `1` として扱われます。 |

**ALTER** 列は、`ALTER TABLE ... MODIFY COLUMN` でそのプロパティを変更できるかどうかを示します。[ALTER TABLE](#alter-table) を参照してください。スパースカラムと DOC mode のプロパティの使い方は、[ワイドカラム](#wide-columns)を参照してください。

### BE 設定 {#be-configuration}

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON オブジェクトのキーの最大バイト長です。超えると解析エラーになります。範囲は 1～65535 です。 |
| `variant_throw_exeception_on_invalid_json` | `false` | `false` の場合、JSON パーサーが拒否するテキストは VARIANT 文字列として保持されます。`true` の場合は解析エラーになります。 |
| `variant_enable_duplicate_json_path_check` | `false` | `false` の場合、オブジェクト内で重複したキーは解析エラーになります。`true` の場合は最初の値を保持し、重複するキーは無視されます。 |

これら 3 つはすべて実行時に変更できます。解析エラーの報告方法については、[解析エラー](#parse-errors)を参照してください。

## VARIANT のインデックス {#variant-indexes}

### インデックスの選択 {#choosing-indexes}

VARIANT ではサブパスに BloomFilter と Inverted Index を使用できます。
- カーディナリティの高い等価条件や IN フィルターには、BloomFilter を優先します。インデックスが小さく、書き込み性能も高くなります。
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

特定の VARIANT サブパスにインデックスプロパティを指定できます。同じパスにトークン化する Inverted Index とトークン化しない Inverted Index の両方を設定することもできます。パス固有のインデックスには、Schema Template でパスの型を宣言する必要があります。

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

ワイルドカードを使ったパスのインデックス指定：

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

Doris 4.1.5 以降では、次のインデックスプロパティまたは BE 設定で norms を無効にできます。

VARIANT パス上のトークン化インデックスは、デフォルトで BM25 norms を書き込みます。そのパスに値がない行も含め、行ごと・パスごとに 1 バイトを使用します。フィルタリングにしか使わないパスでは、`"norms" = "false"` で norms を無効にしてください。`field_pattern` がない場合、このプロパティはインデックスが対象とするすべてのサブパスに適用されます。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms を無効にしても `MATCH` フィルタリングには影響しませんが、`score()` が norms のないセグメントを読み取るとエラーを返します。BE 設定の `inverted_index_skip_norms_for_variant` は、すべての VARIANT パスで norms を無効にします。詳細は[レコード長と norms プロパティ](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property)を参照してください。

### インデックスが機能しない場合 {#when-indexes-dont-work}

1. 型の変更によってインデックスが失われる場合：サブパスが互換性のない型に変わると（例：INT → JSONB）、インデックスは失われます。Schema Template で型とインデックスを固定してください。
2. フィルターがパスをその格納型で比較していない場合：
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   `v['id']` が文字列として格納されている場合は、`v['id'] = '123456'` のように文字列と比較してください。
3. インデックスの設定が誤っている場合：インデックスは VARIANT カラム全体ではなく、サブパスに適用されます。
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

取り込むデータに多くの異なる JSON キーが含まれると、Subcolumnization によって生成されるサブカラム数が急増します。規模が大きくなると、メタデータの肥大化、書き込みやマージのコスト増加、クエリの速度低下が起こり得ます。サブカラムが多すぎる「ワイドカラム」に対して、VARIANT は **スパースカラム** と **DOC エンコーディング** の 2 つの仕組みを提供します。

ワークロードに応じた選び方は、[Variant ワークロードガイド](./variant-workload-guide.md)を参照してください。ここでは、各仕組みと関連するプロパティを説明します。

注：この 2 つの仕組みは併用できません。DOC エンコーディングを有効にするとスパースカラムが無効になり、その逆も同様です。

### スパースカラム {#sparse-columns}

**仕組み**

- システムは、パスを NULL 以外の値の割合とスパース性に基づいて並べます。出現頻度の高い、スパース性の低いパスには Subcolumnization を適用し、独立したサブカラムとして格納します。残りの出現頻度が低いパスは、まとめてスパースカラムに格納します。抽出されるサブカラム数の上限は `variant_max_subcolumns_count` で制御します。
- Schema Template で宣言したパスは、デフォルトではスパースカラムに移されません。型を宣言したパスも移せるようにするには、`variant_enable_typed_paths_to_sparse` を設定します。
- スパースカラムはシャーディングに対応します。スパースなサブパスを複数のスパースカラムに分配することで、カラムごとの読み取り負荷を減らし、読み取り効率を高められます。物理的に格納するスパースカラムの数は `variant_sparse_hash_shard_count` で指定します。

**参考事項**

- ほとんどのキーで NULL 以外の値の割合が近い場合は、本当にスパースなパスを特定しにくくなり、スパースカラムの効果が小さくなります。
- `variant_max_subcolumns_count` のデフォルト値 `2048` は、ほとんどのワークロードに十分です。抽出するサブカラムを事前に多く確保するためだけに、値を大幅に増やさないでください。ワークロードで大規模な Subcolumnization が必要な場合は、[DOC mode](./variant-workload-guide.md#doc-mode-template) を優先して検討してください。実用上の上限として、引き続き `10000` 以下を推奨します。
- `variant_sparse_hash_shard_count` は「スパースパス数 / 128」で概算できます。たとえば、JSON キーの総数が約 10,000、`variant_max_subcolumns_count = 2000` の場合、スパースパスは約 8000 になるため、`variant_sparse_hash_shard_count` は `8000/128` 前後から始められます。

### DOC エンコーディング（DOC mode） {#doc-encoding-doc-mode}

**仕組み**

- パスに基づくクエリのために Subcolumnization を引き続き適用できます。同時に、JSON ドキュメント全体を効率よく返せるよう、元の JSON を格納フィールドとして追加保存します。
- DOC エンコーディングはシャーディングに対応します。元の JSON は複数のカラムに分割して格納され、JSON 全体を読み取る際に再構成されます。DOC シャード数は `variant_doc_hash_shard_count` で指定します。
- 小規模なバッチ書き込みでは Subcolumnization を省略し、後のマージまで延期できます。これは `variant_doc_materialization_min_rows` で制御します。たとえば `variant_doc_materialization_min_rows = 10000` の場合、10,000 行未満の書き込みでは元の JSON のみが格納され、そのバッチで Subcolumnization は行われません。
- Subcolumnization の規模が 10,000 サブカラムに近づく超ワイドなワークロードでは、DOC mode はより安定した選択肢です。デフォルトの書き込み時 Subcolumnization と比べて、コンパクションのメモリ使用量を約 3 分の 2 削減でき、スパースなワイドカラムの取り込みスループットを約 5～10 倍に改善できます。
- `VARIANT` カラムが非常に幅広く、クエリでドキュメント全体を頻繁に読み取る場合、DOC mode の `SELECT variant_col` は、多数のサブカラムからドキュメントを再構成する場合に比べて、桁違いに速くなる可能性があります。

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
- `variant_doc_hash_shard_count` は「JSON キーの総数 / 128」で概算できます。

### 上限に達した場合の動作とチューニングの提案 {#behavior-at-limits-and-tuning-suggestions}

1. しきい値を超えると、新しいパスはスパースカラムに書き込まれます。Rowset のマージによって、一部のパスがスパースカラムへ移動する場合もあります。
2. システムは、NULL 以外の値の割合とアクセス頻度が高いパスを、Subcolumnization の対象として優先的に維持します。
3. Subcolumnization の対象パスが 10,000 に近づくと高性能なハードウェアが必要です（ノードあたり 128G 以上の RAM、32C 以上を推奨）。ワークロードがすでにこの規模に近い場合は、DOC mode を先に評価してください。
4. 取り込みのチューニング：クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms` / `group_commit_data_bytes` を増やします）。
5. バケットの枝刈りが不要なら、RANDOM バケットとシングルタブレットロードの有効化を検討し、コンパクションによる書き込み増幅を減らします。
6. BE のチューニング項目：`max_cumu_compaction_threads`（8 以上）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善しますが、メモリ使用量は増加）、`segment_cache_memory_percentage=20`（メタデータキャッシュの効率を改善）。
7. Compaction Score を監視してください。上昇し続ける場合はコンパクションが追いついていないため、取り込み負荷を下げます。
8. VARIANT に対する大規模な `SELECT *` を避け、`SELECT v['path']` のように必要なパスだけを指定してください。

## サブカラムと型の確認 {#inspect-subcolumns-and-types}

方法 1：[VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) を使用して、値またはパスの型を行ごとに取得します。確認対象の各行を読み取ります。

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

方法 2：拡張された `DESC` を使用し、Subcolumnization で抽出されたサブパスとその格納型を表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

方法 1 は各値の型を示し、方法 2 は各パスの格納方法を示します。

## 制限事項 {#limitations}

- **ワイドテーブルの最適化**：`VARIANT` 型によって大量の動的サブカラムが生成されるワイドテーブル（たとえば 2000 カラム超）では、テーブルの `PROPERTIES` に `"storage_format" = "V3"` を指定して **Storage Format V3** を有効にすることを強く推奨します。カラムのメタデータが Segment Footer から分離され、ファイルを開く処理が速くなり、メモリ使用量も減ります。
- JSON キーの長さは、デフォルトで最大 255 バイトです（`variant_max_json_key_length`）。
- VARIANT カラムはキー、パーティション、バケットのカラムにできず、テーブルスキーマで別の型の内部にも配置できません（[VARIANT カラムの定義](#define-a-variant-column)を参照）。
- DOC mode 以外では、VARIANT カラム全体を読み取るとすべてのサブパスをスキャンします。非常に幅広いカラムでは、DOC mode を有効にしない限り、通常は `SELECT variant_col` を直接使用しないことを推奨します。サブパスが多いカラムで `LIKE` などを使ってオブジェクト全体を検索する場合は、元の JSON 文字列を追加の STRING/JSONB カラムに格納することを検討してください。

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

- ストレージ：JSON は行指向の JSONB として格納されます。VARIANT は書き込み時に Subcolumnization を適用し、圧縮率が高く、サイズが小さくなります。
- クエリ：JSON では解析が必要です。VARIANT はカラムを直接スキャンするため、通常ははるかに高速です。

変更を加えた ClickBench（43 クエリ）の結果：
- ストレージ：VARIANT は JSON と比べて約 65% の容量を節約します。
- クエリ：VARIANT は JSON より 8 倍以上高速で、事前定義した静的カラムに近い性能です。

**ストレージ容量**

| 型 | サイズ |
| --- | --- |
| 事前定義したカラム | 12.618 GB |
| VARIANT | 12.718 GB |
| JSON | 35.711 GB |

**約 65% の容量削減**

| 実行 | 事前定義したカラム | VARIANT | JSON |
| --- | --- | --- | --- |
| 初回（コールド） | 233.79s | 248.66s | ほとんどがタイムアウト |
| 2 回目（ホット） | 86.02s | 94.82s | 789.24s |
| 3 回目（ホット） | 83.03s | 92.29s | 743.69s |

## FAQ {#faq}

1. VARIANT の `null` と SQL `NULL` は同じですか？
   - いいえ。クエリ内で計算された JSON `null` は VARIANT `null` という値ですが、存在しないパスは SQL `NULL` です。値を格納すると、配列外のオブジェクトで値が `null` のメンバーは削除され、SQL `NULL` として読み戻されます。[NULL のセマンティクス](#null-semantics)を参照してください。
2. `INSERT INTO t VALUES (1, '{"a": 1}')` の後に `v['a']` が `NULL` を返すのはなぜですか？
   - `INSERT` は文字列を解析せずに VARIANT 文字列として格納します。`s3()`、`hdfs()`、その他の文字列カラムからの `INSERT INTO ... SELECT` でも同様です。`PARSE_TO_VARIANT('{"a": 1}')` を使用するか、Stream Load などのデータロードジョブでデータをロードしてください。[データの書き込み](#write-data)を参照してください。
3. 有効な JSON ドキュメント全体が文字列として格納されるのはなぜですか？
   - ドキュメントに [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値が含まれている可能性があります。パーサーはそのドキュメントを拒否し、デフォルトでは文字列として保持します。[解析エラー](#parse-errors)を参照してください。
4. クエリやインデックスが機能しないのはなぜですか？
   - パスを格納型に CAST しているか（暗黙の数値比較ではインデックスを使用できません）、型の競合によって JSONB に変更されていないか、サブパスではなく VARIANT 全体にインデックスが適用されると誤解していないかを確認してください。
5. `ORDER BY v['a']` で `"10"` が `9` より後になり、`GROUP BY v['a']` で `1` と `"1"` が別のグループになるのはなぜですか？
   - VARIANT の順序付けと等価判定では、まず値の種類を見ます。数値は文字列より前に並び、数値と文字列が等価になることはありません。数値順または辞書順のセマンティクスが必要な場合は、パスを 1 つの型に CAST してください。[比較、グループ化、順序付け](#comparison-grouping-and-ordering)を参照してください。
6. `v['a']` が文字列のとき、`COALESCE(v['a'], 0)` が `0.000000000` を返し、`IF(..., v['a'], 1)` が `NULL` を返すのはなぜですか？
   - VARIANT と別の型を混在させると、VARIANT 値はもう一方の型に変換されます。もう一方が整数の場合は `DECIMAL(38, 9)` です。`"abc"` のような文字列は変換できず `NULL` になるため、`COALESCE` が返す `0` は `0.000000000` と表示されます。VARIANT の結果を維持するには `COALESCE(v['a'], CAST(0 AS VARIANT))` と書くか、`v['a']` を必要な型に CAST してください。
7. VARIANT カラムへの書き込み時に DECIMAL の精度が失われるのはなぜですか？
   - 小数部分のある JSON 数値は `DECIMAL` ではなく `DOUBLE` として推論されるため、末尾の桁が失われる場合があります。たとえば Schema Template で `v VARIANT<'num': DECIMAL(9, 3)>` のようにパスを `DECIMAL` と宣言しても、先に `DOUBLE` として解析されるため、完全な解決にはなりません。`PARSE_TO_VARIANT('{"num": "12.345"}')` のように、ドキュメント内で値を JSON 文字列として書き込んでください。その場合は精度を失わずに `DECIMAL(9, 3)` へ直接変換されます。
