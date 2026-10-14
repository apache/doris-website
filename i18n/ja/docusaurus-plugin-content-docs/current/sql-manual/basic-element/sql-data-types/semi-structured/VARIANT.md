---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT は半構造化 JSON を格納します。書き込みと解析の規則、CAST、NULL の意味、並び順、Schema Template、ALTER、プロパティ、インデックス、制限を説明します。"
}
---

## 概要 {#overview}

VARIANT 型は、オブジェクト、配列、文字列、数値、真偽値、`null` を含む半構造化 JSON データを格納します。書き込み時、Doris は各 JSON パスの型を推論し、頻繁に現れるパスをサブカラム化（Subcolumnization）して独立した列指向のサブカラムに格納します。そのパスを参照するクエリは、必要なサブカラムだけを読み取ります。

:::tip VARIANT を使う理由
`VARIANT` は、ドキュメントの構造が時間とともに変わっても、クエリが少数の頻繁に使うパスに集中する場合に適しています。

- 頻繁に使うパスはサブカラム化の対象となり、列指向処理の性能、ファイルの枝刈り、ベクトル化実行の利点を得られます。
- 重要なパスにはパス単位のインデックスと全文検索を使用でき、Doris のスパースインデックスによる枝刈りも利用できます。
- ワイドカラム向けの最適化により、約 10kのサブカラムでも自動サブカラム化を実用的に利用できます。ただし、サブカラム化されるパスが 10,000 に近づくとハードウェア要件が急激に高まるため、通常は DOC モードから検討する方が安全です。

デフォルトの動作、スパースカラム、DOC モード、Schema Template の選択については、まず [VARIANT ワークロードガイド](./variant-workload-guide.md) を参照してください。このページでは、書き込みと解析、型の規則、CAST、NULL と比較の意味、ALTER、インデックス、制限、設定を説明します。
:::

:::info バージョン
このページは Doris 5.0.0 以降の VARIANT を説明します。既存の SQL に影響する可能性が高い Doris 4.x との違いは次のとおりです。

- `INSERT` は文字列を JSON として解析せず、VARIANT 文字列として格納します。`INSERT INTO ... SELECT` を `s3()` や `hdfs()` などのテーブル関数から実行する場合も同様です。JSON テキストを書き込むには、`PARSE_TO_VARIANT` で解析してから `INSERT` してください。Stream Load などのロードジョブは引き続き JSON を解析します。
- VARIANT 値全体を `GROUP BY`、`DISTINCT`、集合演算に使用できます。二つの VARIANT 値は `=`、`!=`、`<=>` で比較でき、結合キー、`ORDER BY` キー、ウィンドウキーにも使用できます。
- `VARIANT_TYPE` は、パスと型の対応表ではなく、`object` などの型名を一つ返します。
- VARIANT 配列は 1 から始まる整数インデックスで参照できます。

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
- パスを比較や計算に使用する前に、具体的な型へ CAST します。
- Stream Load などのロードジョブは JSON テキストを自動的に解析します。[データの書き込み](#write-data)を参照してください。

## VARIANT カラムの定義 {#define-a-variant-column}

```sql
column_name VARIANT
column_name VARIANT< field_definition [, field_definition ...] >
column_name VARIANT< properties('key' = 'value' [, ...]) >
column_name VARIANT< field_definition [, ...], properties('key' = 'value' [, ...]) >

field_definition:
    [MATCH_NAME | MATCH_NAME_GLOB] 'path_or_pattern' : data_type [COMMENT 'comment']
```

- `field_definition` のリストが [Schema Template](#schema-template) です。指定したパスの格納型を固定します。
- `properties(...)` はカラム単位の格納プロパティを設定します。[カラムプロパティ](#column-properties)を参照してください。
- VARIANT カラムには `NULL` または `NOT NULL` を指定できます。許可されるデフォルト値は `NULL` のみです。

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
| Duplicate Key、Unique Key、Aggregate Key テーブルの値カラム | はい | Aggregate Key テーブルでは、集約型は `REPLACE` または `REPLACE_IF_NOT_NULL` である必要があります。 |
| キーカラム、パーティションカラム、バケット分割カラム | いいえ | |
| テーブルスキーマ内で別の型にネストする（`ARRAY<VARIANT>`、`MAP`、`STRUCT`） | いいえ | クエリ結果は `ARRAY<VARIANT>` にできます。たとえば `COLLECT_LIST(v)` の結果が該当します。 |
| デフォルト値 | `NULL` のみ | `DEFAULT '{}'` など、NULL 以外のデフォルト値は拒否されます。 |

## データの書き込み {#write-data}

`INSERT` と `CAST` は文字列を VARIANT 文字列として保持します。`PARSE_TO_VARIANT`、`TRY_PARSE_TO_VARIANT`、Stream Load などのロードジョブは JSON テキストを解析します。ロードの例は [VARIANT データのロード](../../../../data-operate/import/complex-types/variant.md) を参照してください。

### 解析エラー {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)、[TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)、ロードジョブは同じ JSON パーサーを使用します。ロードジョブのエラー処理は `TRY_PARSE_TO_VARIANT` と同じです。

| 入力 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` とロードジョブ |
| --- | --- | --- |
| 有効な JSON | 解析した値 | 解析した値 |
| `hello` や `{"id":` など、有効な JSON ではないテキスト | VARIANT 文字列として保持 | VARIANT 文字列として保持 |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値を含む JSON（例: `{"a": 1, "n": 100000000000000000000}`） | テキスト全体を VARIANT 文字列として保持するため、`v['a']` は `NULL` を返します | テキスト全体を VARIANT 文字列として保持 |
| 空文字列 | 空オブジェクト `{}` | 空オブジェクト `{}` |
| 128 階層を超えるネスト | エラー | SQL `NULL` |
| `variant_max_json_key_length` バイトを超えるオブジェクトキー（BE 設定、デフォルト 255） | エラー | SQL `NULL` |
| 一つのオブジェクト内で重複するキー | エラー | SQL `NULL` |
| 有効な UTF-8 ではない文字列 | エラー | SQL `NULL` |

JSON パーサー自体が拒否するほど深くネストしたドキュメント（約 1,000 階層）は無効な JSON とみなされ、文字列として保持されます。

これらの規則は、次の二つの BE 設定で変わります。

- `variant_throw_exeception_on_invalid_json`（デフォルト `false`）: `true` の場合、範囲外の数値を含む JSON など、パーサーが拒否したテキストは VARIANT 文字列になりません。`PARSE_TO_VARIANT` ではエラーとなり、SQL `NULL` が `TRY_PARSE_TO_VARIANT` とロードジョブから返されます。
- `variant_enable_duplicate_json_path_check`（デフォルト `false`）: `true` の場合、オブジェクト内でキーが重複してもエラーにならず、最初の値を保持します。ドットを含むキーがネストしたパスと重複しても書き込みは失敗せず、いずれか一方の値だけが格納されます。

範囲外の整数を含むドキュメントを構造化されたまま保持するには、JSON を経由して変換します: `CAST(CAST(text AS JSON) AS VARIANT)`。38 桁までの整数は正確な数値のまま保持され、それより大きく `LARGEINT` の範囲内の整数は文字列になり、さらに大きい整数は `DOUBLE` になります。`PARSE_TO_VARIANT(CAST(text AS JSON))` は JSON テキストを再解析するため、この問題の解決にはなりません。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### 格納時に保持される値 {#what-storage-keeps}

テーブルに値を書き込むと正規化されます。そのため、読み出した値が書き込み前に計算された値と異なることがあります。

| 書き込み前 | テーブルから読み出した値 |
| --- | --- |
| 値が JSON `null` のオブジェクトメンバー（例: `{"a": null, "b": 1}`） | そのメンバーは削除され、`{"b":1}` になります。`v['a']` は SQL `NULL` を返します。 |
| 値が空のオブジェクトまたは配列であるメンバー、あるいはこの規則によって空になるオブジェクトメンバー（例: `{"a": {}, "b": [], "c": {"d": null}}`） | 削除され、`{}` になります。 |
| `null` だけを含む配列を値に持つメンバー（例: `{"p": [null, null], "q": 1}`） | 削除されることがあります: `{"q":1}` |
| 配列内の値（例: `{"arr": [{"a": null}, {}, [], null]}`） | そのまま保持されます。`v['arr'][1]['a']` は VARIANT `null` です。 |
| ルートの JSON `null`（例: `PARSE_TO_VARIANT('null')`） | 空オブジェクト `{}` |
| ルートの空配列 `[]` または空オブジェクト `{}` | 保持されます |
| ルート値の `DATE` や `DATETIME`（例: `CAST(date_col AS VARIANT)`）、またはほかの型の値も保持するパス上の日付・日時の値 | テキストとして格納され、読み出すと文字列になります。日付だけを保持するオブジェクトパスでは、型が維持されます。 |
| 同じパス上で真偽値と数値が混在 | 一回の書き込み内での値の順序やコンパクションによって、真偽値が `1` または `0` として読み出されることがあります。 |
| ドットを含むキー（例: `{"a.b": 1}`） | ネストしたパス `{"a":{"b":1}}` として格納されます。`v['a.b']` と `v['a']['b']` はどちらも `1` を返します。キー `a.b` とキー `b`（`a` の内部）の両方を持つドキュメントでは、`variant_enable_duplicate_json_path_check` が `true` でない限り、INSERT またはロードジョブ全体が失敗します。 |
| オブジェクトキー | バイト順で返されます |

これらの規則は、同時に書き込まれるほかの行や DOC モードに依存します。したがって、格納後も `null` 値や空のコンテナーが残ることを前提にしないでください。Schema Template で宣言したパスは、代わりに宣言済みの型へ変換されます。[Schema Template](#schema-template) を参照してください。

## 型推論と型の競合 {#type-inference-and-type-conflicts}

Schema Template がない場合、Doris は JSON の解析時に各値の型を推論します。`VARIANT_TYPE` はその型を返します。

| JSON 値 | 型 |
| --- | --- |
| `BIGINT` の範囲内の整数 | `tinyint`、`smallint`、`int`、`bigint` のうち値を格納できる最小の型 |
| `BIGINT` の範囲を超え、18446744073709551615 以下の整数 | `decimal` |
| 小数部または指数部を持つ数値 | `double` |
| [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値 | 数値として扱われません。テキスト全体が無効な JSON になります（[解析エラー](#parse-errors)を参照）。 |
| 文字列 | `string` |
| `true`, `false` | `bool` |
| `null` | `null` |
| 配列、オブジェクト | `array`、`object` |

データの格納時、各パスには 一つの格納型が割り当てられます。

- 整数は `BIGINT` として、必要な場合は `LARGEINT` として格納されます。浮動小数点数は `DOUBLE`、小数は `DECIMAL`、文字列は `STRING`、真偽値は `BOOLEAN`、スカラーの配列は `ARRAY<T>` として格納されます。
- オブジェクトの配列、ネストした配列、および整数と浮動小数点数、数値と文字列、スカラーと配列など型の異なる値を持つパスは `JSONB` として格納されます（`json` として `DESC` に表示されます）。要素の型が競合する配列は `ARRAY<JSONB>` になります。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

`JSONB` パスはすべての値を保持しますが、型付きの格納ではなくなるため、そのパスにはインデックスや型に基づく枝刈りが適用されません。真偽値は例外です。パスの最初の値が真偽値で後続の値が数値の場合、そのパスが数値として格納され、真偽値が `1` または `0` として読み出されることがあります。パスに安定した型が必要な場合は、Schema Template で宣言してください。

`VARIANT_TYPE` は各値の型を返すため、`BIGINT` パスから読み取った整数でも `tinyint` と表示されることがあります。各パスの格納型を確認するには、`SET describe_extend_variant_column = true;` を実行してから `DESC table_name;` を実行します。[サブカラムと型の確認](#inspect-subcolumns-and-types)を参照してください。

## パスへのアクセスと出力 {#access-paths-and-output}

- `v['key']` と `v['a']['b']` はオブジェクトメンバーを読み取ります。`v['arr'][1]` は配列要素を読み取ります。インデックスは 1 から始まり、`-1` は最後の要素です。[ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) も同じ動作です。
- 結果は `VARIANT` 値です。存在しないキー、インデックス `0`、範囲外のインデックス、配列に対する文字列キー、オブジェクトに対する整数インデックス、スカラー値に対するキーは、いずれも SQL `NULL` を返します。
- 計算中の値では、ドットを含むキーは単一のキーです。`v['a.b']` はキー `a.b` を読み取り、`v['a']['b']` はキー `b`（`a` の内部）を読み取ります。格納時にはこの区別は維持されません。[格納時に保持される値](#what-storage-keeps)を参照してください。
- パスは配列の各要素に自動的には適用されません。`{"a": [{"b": 1}]}` では `v['a']['b']` は `NULL` を返します。`v['a'][1]['b']` を使用してください。

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

一般的には、クエリで必要な型へパスを CAST します。

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

VARIANT 値全体を読み取ると JSON テキストが返されます。オブジェクトキーは空白なしのバイト順で返されるため、テキストは入力とバイト単位で同一ではありません。ルートが文字列の場合は引用符なしで返されます。

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

| 元の型 | 結果 |
| --- | --- |
| `CHAR`、`VARCHAR`、`STRING` | VARIANT 文字列。JSON テキストは解析されません。文字列は有効な UTF-8 である必要があり、そうでなければ CAST は失敗します。 |
| `BOOLEAN` | 真偽値。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT` | 整数。 |
| `LARGEINT` | 小数。絶対値が 10^38 - 1 を超える値は文字列になります。 |
| `FLOAT`、`DOUBLE` | 浮動小数点数。 |
| `DECIMALV2`、`DECIMAL(p, s)`（`p <= 38`） | 小数。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付、またはタイムゾーンなしのタイムスタンプ。 |
| `IPV4`、`IPV6` | 値のテキスト表現を持つ文字列。 |
| `JSON` / `JSONB` | 同じ構造。`DECIMAL256` の数値など VARIANT が保持できない値、またはオブジェクト内の重複キーがあると CAST は失敗します。 |
| `ARRAY<T>` | 配列。各要素が変換されます。`T` は `VARIANT` またはこの表にある型である必要があります。 |
| `MAP`、`STRUCT`、`TIME`、`TIMESTAMPTZ`、`VARBINARY`、その他の型 | サポートされません。ステートメントは失敗します。 |

元の値も元の型に対して有効である必要があります。無効な値は修復されず、拒否されます。CAST は文字列を解析しません。`CAST('{"id": 1}' AS VARIANT)` は文字列 `{"id": 1}` です。JSON テキストを解析するには `PARSE_TO_VARIANT` を使用します。

### VARIANT からの CAST {#cast-from-variant}

| 変換先の型 | 結果 |
| --- | --- |
| `BOOLEAN` | 真偽値はそのまま返されます。数値はゼロ以外なら `true` になります。文字列は `CAST(string AS BOOLEAN)` と同様に変換されます。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 整数。小数または浮動小数点数の小数部は切り捨てられます（`1.5` は `1`）。真偽値は `1` または `0` になります。`"123"` などの数値文字列も変換されます。 |
| `FLOAT`、`DOUBLE`、`DECIMAL(p, s)` | 数値および数値文字列。`DECIMAL` はスケール `s` に丸めます。`FLOAT` に収まらない値は `Infinity` になります。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日付と時刻の値、日付または時刻形式の文字列、`20240102` などの数値。 |
| `TIMESTAMPTZ(p)` | 日付と時刻の値、および日付または時刻形式の文字列。 |
| `IPV4`、`IPV6` | IP アドレス形式の文字列。 |
| `CHAR`、`VARCHAR`、`STRING` | ルートの文字列は引用符なしでそのまま返されます。オブジェクトと配列は JSON テキストとして返されます。そのほかのスカラーは同じ SQL 型と同様に書式化されます。ルートの真偽値は `1` または `0`、`DATETIME` 値の小数秒は 六桁、`TIMESTAMP_NS` 値の小数秒は 九桁です。VARIANT `null` は文字列 `null` になります。 |
| `JSON` / `JSONB` | 同じ構造。日付やタイムスタンプなど、JSON に対応する型がない値は JSON 文字列になります。タイムゾーン付きタイムスタンプはセッションのタイムゾーンで書式化されます。 |
| `ARRAY<T>` | 配列。要素ごとに変換され、変換できない要素は `NULL` になります。`"[1, 2]"` など、JSON 配列を含む文字列も変換されます。それ以外の値は `NULL` を返します。 |
| `MAP`、`STRUCT`、`TIME`、その他の型 | サポートされません。ステートメントは失敗します。 |

変換先の型に変換できない値は、SQL `NULL` を返します。`enable_strict_cast` が有効な場合も同様です。ただし、数値から `TIMESTAMPTZ`、`IPV4`、`IPV6` への変換や、日付・タイムスタンプから `BOOLEAN` への変換のように、型の組み合わせ自体に変換規則がない場合はステートメントが失敗します。

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

### 小数と日付・時刻の値 {#decimal-and-datetime-values}

これらの型を VARIANT に変換した場合の動作は次のとおりです。

| Doris の型 | 動作 |
| --- | --- |
| 旧形式の `DECIMALV2` | 精度 27 桁、スケール 9 桁まで正確に保持されます。 |
| `DECIMAL(p, s)` | `1 <= p <= 38` かつ `0 <= s <= p` の値は正確に保持されます。精度が 38 桁を超える小数はサポートされません。 |
| `DATE` | 時刻やタイムゾーンを含まない暦日。 |
| `DATETIME(p)` | `0 <= p <= 6`。タイムゾーン調整は行われません。 |
| `TIMESTAMP_NS` | タイムゾーン調整を行わないナノ秒精度。値は TIMESTAMP_NS の範囲内である必要があります。 |
| `TIMESTAMPTZ(p)` | CAST でも Schema Template のパスでもサポートされません。 |
| `TIME` | サポートされません。 |

## NULL の意味 {#null-semantics}

VARIANT には 二種類の null があります。

- **SQL `NULL`** は値がないことを表します。`NULL` のカラム値、`v['no_such_key']` のような存在しないパス、失敗した CAST から生じます。
- **VARIANT `null`** は値です。JSON リテラル `null` が該当し、`PARSE_TO_VARIANT('null')` の結果や配列内の `null` 要素が例です。`VARIANT_TYPE` はこれに対して `null` を返します。

| 操作 | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| `COALESCE(v, x)`、`IFNULL(v, x)` で VARIANT の `x` を使う場合 | `x` を返します | VARIANT `null` を返します |
| `COUNT(v)` | カウントされません | カウントされます |
| `GROUP BY v`、`DISTINCT` | すべての SQL `NULL` 値が 一つのグループになります | すべての VARIANT `null` 値が別の 一つのグループになります |
| `v = x`、等価結合 | 一致しません | 別の VARIANT `null` と一致します |
| `ORDER BY v` | `NULLS FIRST` または `NULLS LAST` に従って配置されます | 昇順では、ほかの NULL 以外の値より前に配置されます |
| `CAST(v AS STRING)` | SQL `NULL` | 文字列 `null` |

値を格納すると、配列の外にあるオブジェクトの `null` メンバーは削除されるため、読み出すと SQL `NULL` になります。ルートの `null` は `{}` として読み出されます（[格納時に保持される値](#what-storage-keeps)を参照）。したがって、格納済みデータに対して `v['a'] IS NULL` を評価しても、存在しないメンバーと `null` メンバーは区別できません。

## 比較、グループ化、並び順 {#comparison-grouping-and-ordering}

VARIANT 値は、テキスト表現や物理的なエンコードではなく、論理値で比較されます。等価判定、ハッシュ処理（`GROUP BY`、`DISTINCT`、結合）、並び順（`ORDER BY`、ウィンドウキー）には同じ規則が使われます。そのため、等しい値は常に同じグループに入り、ソート時も同順位になります。

### サポートされる操作 {#supported-operations}

| VARIANT 値に対する操作 | サポート | 備考 |
| --- | --- | --- |
| `=`、`!=`、`<=>` による VARIANT 値同士、または VARIANT 値と `NULL` リテラルの比較 | 対応 | `v['a'] = w['a']` などのサブパスも含みます。 |
| 等価結合、セミ結合、アンチ結合、`IN` および `NOT IN` サブクエリ | 対応 | VARIANT 結合キーにはランタイムフィルターが生成されません。 |
| `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`UNION`、`INTERSECT`、`EXCEPT` | 対応 | |
| `ORDER BY`、`ORDER BY ... LIMIT` | 対応 | |
| ウィンドウの `PARTITION BY` と `ORDER BY` | 対応 | |
| `COUNT(v)`、`COLLECT_LIST(v)`、`ARRAY_AGG(v)` | 対応 | |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 対応 | VARIANT と別の型を混在させると VARIANT 値はその型に変換されます（整数の場合は `DECIMAL(38, 9)`）。変換できない値は `NULL` になります。 |
| `CAST(v AS ARRAY<VARIANT>)`、`EXPLODE_VARIANT_ARRAY`、`EXPLODE` と `EXPLODE_OUTER` を `ARRAY<VARIANT>` に使用 | 対応 | |
| VARIANT 値同士の `<`、`<=`、`>`、`>=`、`BETWEEN` | 非対応 | 先に具体的な型へ CAST してください。 |
| `v = 1` のような VARIANT 値全体と VARIANT 以外の値の比較 | 非対応 | サブパスは暗黙的に変換されるため、`v['a'] = 1` は動作します。 |
| VARIANT 値を含む `IN` リスト（例: `v IN (PARSE_TO_VARIANT('1'))`） | 非対応 | VARIANT 以外の値を持つ `v IN ('a', 'b')` は暗黙的な変換によって動作します。 |
| `MIN`、`MAX` | 非対応 | 先にサブパスを CAST してください。 |
| VARIANT 引数を指定した `ARRAY(...)`、`MAP(...)`、`NAMED_STRUCT(...)` | 非対応 | |

### 等価判定 {#equality}

- **数値。** 整数、小数部がゼロの小数、整数値の浮動小数点数は等しい値です。`1`、`1.0`、`1.00` は 一つの値として扱われます。小数末尾のゼロは影響せず、`-0.0` は `0` と等しくなります。小数部のある小数と浮動小数点数は等しくなりません。`DECIMAL 1.5` は `DOUBLE 1.5` と等しくありません。小数部を持つ JSON 数値は `DOUBLE` として解析されます。小数は CAST、Schema Template のパス、`BIGINT` に収まらない整数から生じます。
- **種類の異なる値は等しくなりません。** 数値の `1`、文字列の `"1"`、`true` はそれぞれ別の値です。`DATE` と文字列 `"2024-01-01"`、タイムゾーンなしのタイムスタンプとタイムゾーン付きのタイムスタンプも等しくなりません。
- **文字列**はバイト列が同じ場合にのみ等しくなります。比較では大文字と小文字が区別されます。
- **オブジェクト**は同じキーを持ち、対応する値が等しい場合に等しくなります。キーの順序は影響しません。
- **配列**は長さが同じで、同じ位置の要素がそれぞれ等しい場合に等しくなります。
- VARIANT `null` は別の VARIANT `null` と等しくなります。SQL `NULL` には SQL の規則が適用されます。

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

バイナリ、時刻、UUID の値は Doris での JSON 解析や CAST からは生成できません。これらは、VARIANT カラムを持つ Parquet ファイルなど、ほかのシステムが書き込んだ VARIANT データからのみ得られます。

同じ種類の値は次の規則で並びます。

- **真偽値:** `false` が `true` より前に並びます。
- **数値:** 整数（`INT`、`BIGINT` など）、小数（`DECIMAL`）、浮動小数点数（`FLOAT`、`DOUBLE`）は数値順に並びます。`INT 1`、`FLOAT/DOUBLE 1.0`、`DECIMAL 1.00` は等しく、同じ位置に並びます。小数末尾のゼロは影響しません。小数部のある値が数値として等しい場合は小数が先に並びます。`DECIMAL 1.5` は `FLOAT/DOUBLE 1.5` より前で、VARIANT 値としては等しくありません。浮動小数点の精度が順序に影響することもあります。`DOUBLE 0.1` は `DECIMAL 0.1` よりわずかに大きくなります。負の無限大が先頭、正の無限大と NaN が末尾に並びます。
- **文字列:** UTF-8 のバイト順で並びます。大文字は小文字より前に並び、`"10"` は `"9"` より前に並びます。
- **日付とタイムスタンプ:** 時系列順に並びます。すべての日付はすべてのタイムスタンプより前に並びます。
- **オブジェクト:** キー順でエントリを 一つずつ比較します。最小のキー、その値、次のキーの順に比較します。一方のエントリが他方の先頭部分と一致する場合は短い方が先です。したがって `{"a":1}` < `{"a":1,"b":2}` < `{"b":0}` です。
- **配列:** 要素を 一つずつ比較し、一方が他方の先頭部分と一致する場合は短い方が先です。したがって `[]` < `[null]` < `[1]` < `[1,2]` です。

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

比較に VARIANT の規則と具体的な型の規則のどちらを使うかは、オペランドによって決まります。パス `a` に `1`、`1.0`、`"1"` がある場合を例にします。

| 式 | 比較に使う型 | 結果 |
| --- | --- | --- |
| `v['a'] = 1` | `DECIMAL(38, 9)`（`v['a']` の暗黙的な CAST による） | すべての値に一致 |
| `v['a'] = CAST(1 AS VARIANT)`、`v['a'] = w['a']` | VARIANT | `1` と `1.0` に一致し、`"1"` には一致しません |
| `GROUP BY v['a']` | VARIANT | `1` と `1.0` は同じグループ、`"1"` は別のグループになります |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | `1` の単一グループになります |
| `ORDER BY v['a']` | VARIANT | 数値、文字列の順に並びます |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 数値順に並び、変換できない値は `NULL` になります |

### 注意点 {#notes}

- **コスト。** VARIANT キーのハッシュ処理と比較には論理値が使われます。44 百万行のベンチマークでは、VARIANT キーを使う `GROUP BY`、ソート、結合は、`CAST(v['path'] AS <type>)` を使う同じ操作の 1.2～3.7 倍の時間を要しました。パスの型が一つに定まっている場合は CAST してください。
- **結果は格納後の値に従います。** 比較の前に [格納時に保持される値](#what-storage-keeps) の正規化が行われます。`null` だったメンバーは存在しなくなり、ルートの `DATE` は文字列として比較され、同じパス上の数値と混在する真偽値は `1` または `0` として読み出されることがあります。型が重要なパスは Schema Template で宣言してください。
- **型が混在する値は、値ではなく種類で並びます。** 数値と数値文字列の両方があるパスでは、`ORDER BY v['a']` はすべての数値をすべての文字列より前に置き、文字列をバイト順に並べます。数値順または辞書順が必要なら、一つの型へ CAST してください。
- **同じように見える値でも異なることがあります。** `GROUP BY` の結果では、数値の `1` と文字列の `"1"` は同じように表示されますが、別のグループになります。違いを確認するには `VARIANT_TYPE` を使用してください。
- 種類間の順序は、結果を決定的にするため Doris が定義しています。JSON 標準の一部ではなく、ほかのシステムと異なる場合があります。
- VARIANT 値の内部ハッシュは実装の詳細であり、ユーザー向けの安定したチェックサムではありません。

## Schema Template {#schema-template}

Schema Template は、指定したパスの格納型を宣言します。安定した型またはパス固有のインデックスが必要な重要パスだけを宣言してください。ドキュメントの残りの部分は動的なままです。

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

- 数値: `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`、および `DECIMAL(p, s)`（`p <= 38`）
- `STRING`（または `TEXT`）
- `BOOLEAN`
- `DATE`, `DATETIME(p)`, `TIMESTAMP_NS`
- `IPV4`, `IPV6`
- `ARRAY<T>`。ここで `T` は上記のいずれかの型です（一次元のみ）。

### テンプレートパスへの書き込み {#writing-to-template-paths}

宣言済みのパスでは、各値が非厳格 CAST の規則に従って宣言型に変換されます。変換できない値は `NULL` として格納されるため、読み出し時にはそのパスが存在しません。行の残りの部分は書き込まれます。変換によって値が変わることがあります。

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

- `"123"` は `123` になり、`1.7` は `1` に切り捨てられ、`9.999` は `10.00` に丸められます。タイムスタンプは宣言された精度（ミリ秒）を維持し、そのテキスト表現では小数秒が常に 六桁で表示されます。
- `"abc"`、`"x"`、`"not a time"` は変換できないため、削除されます。
- 小数部のある JSON 数値は変換前に `DOUBLE` として解析されるため、`DECIMAL` パスでは精度が失われる可能性があります。すべての桁を保持するには、その値を JSON 文字列として書き込んでください（[FAQ](#faq) を参照）。
- 日付と IP アドレスの値は JSON 文字列である必要があります。`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は有効な JSON ではありません。`{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` を書き込んでください。

:::caution
値の JSON 型から宣言型への変換規則がある場合にのみ変換が行われます。`IPV4` または `IPV6` パス上の JSON 数値は、書き込み全体を失敗させます。一回の書き込みで `DATE`、`DATETIME`、`IPV4`、`IPV6` パスに JSON 文字列と数値が混在すると、そのパスの有効な値まで削除されることがあります。これらのパスの値は JSON 文字列として書き込んでください。
:::

### テンプレートパスの読み取り {#reading-template-paths}

宣言済みのパスでも `v['path']` の型は `VARIANT` のままで、Doris は宣言型に自動変換しません。宣言型が必要な場合は明示的に CAST してください。また、パスのゾーンマップとインデックスをクエリで利用できるように、フィルターでも宣言型に CAST します。

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template は値の格納方法だけを決めます。クエリ内で計算した同じ JSON は、解析時の型を維持します。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### パターンマッチング {#pattern-matching}

フィールド名はデフォルトで glob パターン（`MATCH_NAME_GLOB`）です。`*` はネストしたキーの間の `.` を含む任意の文字列に一致し、`?` は 一文字に一致します。たとえば `'m*'` は `m1` と `m2.x` の両方に一致します。パスが複数のフィールドに一致する場合は、定義順で最初のフィールドが使われます。

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

名前に含まれる `*` を文字どおりに照合するには、`MATCH_NAME` を使用します。

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

一致したパスはデフォルトでサブカラム化の対象になります。多くのパスが一致してサブカラムが増えすぎる場合は、`variant_enable_typed_paths_to_sparse` を検討してください（[カラムプロパティ](#column-properties)を参照）。

Schema Template はカラム作成後に変更できません。[ALTER TABLE](#alter-table) を参照してください。

## ALTER TABLE {#alter-table}

`ALTER TABLE` でサポートされる操作は次のとおりです。

- Schema Template とプロパティの有無にかかわらず、NULL 許容の VARIANT カラムを `ADD COLUMN` すること。
- `DROP COLUMN`、`RENAME COLUMN`、`MODIFY COLUMN ... COMMENT '...'`。
- `ADD INDEX` と `DROP INDEX`。`field_pattern` を持つインデックスは `CREATE TABLE` でのみ定義できます。
- Schema Template のないカラムで、`NOT NULL` を `NULL` に変更すること、および `variant_doc_materialization_min_rows` を変更すること。`MODIFY COLUMN` にはカラム定義全体を指定します。省略したプロパティには対応する `default_variant_*` セッション変数の値が適用されるため、異なる値を保持したいプロパティはすべて再指定してください。

サポートされない操作は次のとおりです。

- `ADD COLUMN ... VARIANT NOT NULL`: `NOT NULL` カラムを `ALTER` で追加するにはデフォルト値が必要ですが、VARIANT では `DEFAULT NULL` のみ許可されます。`NOT NULL` の VARIANT カラムは `CREATE TABLE` で定義してください。
- 既存カラムへの Schema Template の追加。Schema Template のあるカラムでは、`MODIFY COLUMN` で変更できるのはコメントだけです。同じテンプレートを再指定する場合でも、それ以外の変更は失敗します。
- `variant_doc_materialization_min_rows` 以外のプロパティの変更、`NULL` から `NOT NULL` への変更、VARIANT とほかの型との変換。
- VARIANT カラムに対する `BUILD INDEX`。

これらの変更が必要な場合は、新しい定義でテーブルを作成し、`INSERT INTO ... SELECT` でデータをコピーします。元のカラムが `STRING` の場合は `PARSE_TO_VARIANT` で囲んでください。

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## カラムプロパティ {#column-properties}

カラムプロパティは、VARIANT 型の内部にある `properties(...)` で設定します。

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
| `variant_max_subcolumns_count` | `2048` | いいえ | 一つのデータファイル内でサブカラム化される動的パスの最大数です。NULL 以外の値が多いパスが先に選ばれ、残りはスパースカラムに格納されます。`0` は無制限を意味します。範囲は 0～100000 ですが、10000 以下に抑えてください。デフォルト値でほとんどのワークロードに十分です。さらに多くのサブカラムが本当に必要なら [DOC モード](./variant-workload-guide.md#doc-mode-template) を推奨します。 |
| `variant_enable_typed_paths_to_sparse` | `false` | いいえ | デフォルトでは Schema Template のパスは常にサブカラム化され、`variant_max_subcolumns_count` の数に含まれません。`true` の場合は上限に含まれ、スパースカラムに格納されることがあります。 |
| `variant_sparse_hash_shard_count` | `1` | いいえ | スパースパスをハッシュで分散する物理スパースカラムの数です。範囲は 0～1024 で、`0` は `1` として扱われます。 |
| `variant_max_sparse_column_statistics_size` | `10000` | いいえ | 一つのデータファイル内で統計が記録されるスパースパスの最大数です。この数を超え、統計のないパスへのクエリではスパースカラムをスキップできません。範囲は 1～50000 です。 |
| `variant_enable_doc_mode` | `false` | いいえ | DOC モードを有効にします。`variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse`、`variant_max_sparse_column_statistics_size`、`variant_sparse_hash_shard_count` と同時に設定することはできません。 |
| `variant_doc_materialization_min_rows` | `0` | Schema Template がない場合のみ | DOC モード専用です。しきい値より少ない行数の書き込みではドキュメントだけを格納し、コンパクションでファイルがしきい値までマージされた時点でサブカラム化します。`0` の場合は書き込み時にサブカラム化します。範囲は 0～1000000000 です。 |
| `variant_doc_hash_shard_count` | `64` | いいえ | DOC モード専用です。格納ドキュメントを分割するカラムの数です。範囲は 0～1024 で、`0` は `1` として扱われます。 |

**ALTER** 列は、`ALTER TABLE ... MODIFY COLUMN` でプロパティを変更できるかどうかを示します。[ALTER TABLE](#alter-table) を参照してください。スパースカラムと DOC モードのプロパティの使い方は [ワイドカラム](#wide-columns) を参照してください。

### セッション変数 {#session-variables}

| 変数 | デフォルト | 説明 |
| --- | --- | --- |
| `default_variant_max_subcolumns_count` | `2048` | このプロパティを指定せずに定義した VARIANT カラムの `variant_max_subcolumns_count` の値です。 |
| `default_variant_enable_typed_paths_to_sparse` | `false` | このプロパティを指定せずに定義したカラムの `variant_enable_typed_paths_to_sparse` の値です。 |
| `default_variant_sparse_hash_shard_count` | `0` | このプロパティを指定せずに定義したカラムの `variant_sparse_hash_shard_count` の値です。`0` は `1` として扱われます。 |
| `default_variant_max_sparse_column_statistics_size` | `10000` | このプロパティを指定せずに定義したカラムの `variant_max_sparse_column_statistics_size` の値です。 |
| `default_variant_enable_doc_mode` | `false` | このプロパティを指定せずに定義したカラムの `variant_enable_doc_mode` の値です。 |
| `default_variant_doc_materialization_min_rows` | `0` | このプロパティを指定せずに定義したカラムの `variant_doc_materialization_min_rows` の値です。 |
| `default_variant_doc_hash_shard_count` | `64` | このプロパティを指定せずに定義したカラムの `variant_doc_hash_shard_count` の値です。 |
| `describe_extend_variant_column` | `false` | `true` の場合、`DESC` は VARIANT カラムのサブカラムも表示します。 |

`default_variant_*` 変数は、`CREATE TABLE` または `ALTER TABLE` でカラムを定義するときに適用されます。変更しても既存カラムには影響しませんが、後でプロパティを省略して `MODIFY COLUMN` すると適用されます。

### BE 設定 {#be-configuration}

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON オブジェクトキーの最大バイト長です。これを超えるキーは解析エラーになります。範囲は 1～65535 です。 |
| `variant_throw_exeception_on_invalid_json` | `false` | `false` の場合、JSON パーサーが拒否したテキストは VARIANT 文字列として保持されます。`true` の場合は解析エラーになります。 |
| `variant_enable_duplicate_json_path_check` | `false` | `false` の場合、オブジェクト内で重複するキーは解析エラーになります。`true` の場合、最初の値が保持され、重複分は無視されます。 |

これら三つの設定は実行時に変更できます。解析エラーの報告方法は [解析エラー](#parse-errors) を参照してください。

## VARIANT インデックス {#variant-indexes}

### インデックスの選択 {#choosing-indexes}

VARIANT はサブパスで BloomFilter と転置インデックスをサポートします。
- カーディナリティの高い等価条件や IN フィルターには BloomFilter を推奨します（インデックスが疎で、書き込み性能に優れます）。
- トークン化、フレーズ検索、範囲検索には転置インデックスを使用し、適切な `parser` / `analyzer` プロパティを設定します。

フィルターがインデックスまたは BloomFilter を使用できるのは、パスをその格納型で比較する場合だけです。数値パスは明示的に CAST してください。文字列パスと文字列リテラルの比較では CAST は不要です。

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

### サブパス単位のインデックス {#index-by-subpath}

特定の VARIANT サブパスにインデックスプロパティを指定できます。同じパスにトークン化された転置インデックスとトークン化されない転置インデックスの両方を設定することもできます。パス固有のインデックスを使うには、Schema Template でそのパスの型を宣言する必要があります。

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, etc.
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

ワイルドカードを含むパスへのインデックス:

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

### インデックスが使われない場合 {#when-indexes-dont-work}

1. 型の変更でインデックスが失われる場合: サブパスが互換性のない型（例: INT → JSONB）に変わると、インデックスが失われます。Schema Template で型とインデックスを固定してください。
2. フィルターがパスを格納型で比較していない場合:
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   `v['id']` が文字列として格納されている場合は、文字列と比較します: `v['id'] = '123456'`。
3. インデックスの設定が不適切な場合: インデックスは VARIANT カラム全体ではなく、サブパスに適用されます。
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

取り込むデータに多くの異なる JSON キーがあると、サブカラム化によるサブカラムの数が急増します。規模が大きくなると、メタデータの肥大化、書き込みやマージのコスト増加、クエリの低速化につながることがあります。サブカラムが多すぎる「ワイドカラム」に対処するため、VARIANT には **スパースカラム** と **DOC エンコード** の 二つの仕組みがあります。

ワークロードに応じた選択方法は [VARIANT ワークロードガイド](./variant-workload-guide.md) を参照してください。この節では仕組みと関連するプロパティだけを説明します。

注: これら 二つの仕組みは同時に使用できません。DOC エンコードを有効にするとスパースカラムは無効になり、その逆も同様です。

### スパースカラム {#sparse-columns}

**仕組み**

- システムは NULL 以外の値の比率、つまり疎さに基づいてパスを順位付けします。高頻度で疎ではないパスをサブカラム化し、独立したサブカラムに格納します。残りの低頻度で疎なパスは統合してスパースカラムに格納します。抽出するサブカラムの最大数は `variant_max_subcolumns_count` で制御します。
- Schema Template で宣言したパスは、デフォルトではスパースカラムに移動しません。型付きパスの移動を許可するには `variant_enable_typed_paths_to_sparse` を設定します。
- スパースカラムはシャーディングをサポートします。スパースなサブパスを複数のスパースカラムへ分散し、カラムあたりの読み取りコストを減らして効率を高めます。物理的に格納するスパースカラムの数は `variant_sparse_hash_shard_count` で指定します。

**参考事項**

- ほとんどのキーで NULL 以外の値の比率が似ている場合（疎さにあまり差がない場合）、真に疎なパスを識別しにくく、スパースカラムの利点も小さくなります。
- `variant_max_subcolumns_count` のデフォルト値 `2048` は、ほとんどのワークロードに十分です。抽出サブカラムを事前に多く確保するためだけに値を大幅に増やさないでください。大規模なサブカラム化が本当に必要なら [DOC モード](./variant-workload-guide.md#doc-mode-template) を推奨します。実用上の上限は `10000` 以下に保つことを推奨します。
- `variant_sparse_hash_shard_count` の概算値は「スパースパス数 / 128」です。たとえば JSON キーの総数が約 10,000、`variant_max_subcolumns_count = 2000` の場合、スパースパスは約 8000 なので、`variant_sparse_hash_shard_count` は `8000/128` 程度から試せます。

### DOC エンコード（DOC モード） {#doc-encoding-doc-mode}

**仕組み**

- パス単位のクエリのためにパスを引き続きサブカラム化できます。加えて、JSON ドキュメント全体を効率的に返すため、元の JSON を格納フィールドとして保存します。
- DOC エンコードはシャーディングをサポートします。元の JSON を複数のカラムに分割して格納し、JSON 全体を照会するときに再構成します。DOC シャードの数は `variant_doc_hash_shard_count` で指定します。
- 小規模なバッチ書き込みでは、サブカラム化を省略して後のマージ時まで延期できます。`variant_doc_materialization_min_rows` で制御します。たとえば `variant_doc_materialization_min_rows = 10000` の場合、10,000 行未満の書き込みでは元の JSON だけを格納し、そのバッチのサブカラム化は行いません。
- 特に幅の広いワークロードでサブカラム化の規模が約一万サブカラムに近づく場合、DOC モードはより安定した選択肢です。デフォルトの即時サブカラム化と比べ、コンパクション時のメモリ使用量を約三分の二 削減でき、スパースなワイドカラムの取り込みスループットを約 5～10 倍に改善できます。
- `VARIANT` カラムが非常に幅広く、クエリでドキュメント全体を頻繁に読み取る場合、DOC モードでは多数のサブカラムからドキュメントを再構成する方法に比べ、`SELECT variant_col` の性能を桁違いに改善できます。

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
- DOC モードでは、Schema Template のフィールドに使用できる型は、文字列、整数、`FLOAT`、`DOUBLE`、`BOOLEAN`、およびこれらの型の配列に限られます。
- `variant_doc_hash_shard_count` の概算値は「JSON キー総数 / 128」です。

### 上限付近の動作とチューニングの提案 {#behavior-at-limits-and-tuning-suggestions}

1. しきい値を超えると、新しいパスはスパースカラムに書き込まれます。Rowset のマージ時に一部のパスがスパースカラムへ移されることもあります。
2. システムは、NULL 以外の値の比率が高く、アクセス頻度も高いパスを優先してサブカラム化します。
3. サブカラム化されるパスが 10,000 に近い場合は高性能なハードウェアが必要です（各ノードに 128G RAM 以上、32C 以上を推奨）。ワークロードがこの規模に近い場合は、まず DOC モードを評価してください。
4. 取り込みのチューニング: クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms` / `group_commit_data_bytes` を増やします）。
5. バケットの枝刈りが不要なら、RANDOM バケット分割と単一タブレットへのロードを有効にし、コンパクション時の書き込み増幅を減らすことを検討してください。
6. BE のチューニング項目: `max_cumu_compaction_threads`（8 以上）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善するが、メモリ使用量は増加）、`segment_cache_memory_percentage=20`（メタデータキャッシュの効率を改善）。
7. Compaction Score を監視してください。上昇し続ける場合はコンパクションが遅れているため、取り込み負荷を下げてください。
8. VARIANT に対する大規模な `SELECT *` は避け、`SELECT v['path']` のように必要なパスだけを選択してください。

## サブカラムと型の確認 {#inspect-subcolumns-and-types}

方法 1: [VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) で各行の値または単一のパスの型を取得します。確認対象の各行を読み取ります。

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

方法 2: 拡張 `DESC` で、サブカラム化によって抽出されたサブパスとその格納型を表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

方法 1 は各値の型を示し、方法 2 は各パスの格納方法を示します。

## 制限事項 {#limitations}

- **ワイドテーブルの最適化:** `VARIANT` 型から多数の動的サブカラム（例: 2000 カラム超）が生成されるワイドテーブルでは、**Storage Format V3** を有効にすることを強く推奨します。`"storage_format" = "V3"` をテーブルの `PROPERTIES` に指定します。カラムのメタデータが Segment Footer から分離され、ファイルを開く処理が速くなり、メモリ使用量も減ります。
- JSON キーの長さはデフォルトで最大 255 バイトです（`variant_max_json_key_length`）。
- VARIANT カラムはキー、パーティションカラム、バケット分割カラムにはできず、テーブルスキーマ内で別の型にネストすることもできません（[VARIANT カラムの定義](#define-a-variant-column)を参照）。
- DOC モード以外では、VARIANT カラム全体を読み取るとすべてのサブパスがスキャンされます。幅の広いカラムでは、DOC モードが有効でない限り `SELECT variant_col` を直接実行することは一般に推奨されません。サブパスが多いカラムで `LIKE` などによるオブジェクト全体の検索を行う場合は、元の JSON 文字列を別の STRING/JSONB カラムに保存することを検討してください。

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

- 格納: JSON は行指向の JSONB として格納されます。VARIANT は書き込み時にサブカラム化するため、圧縮率が高く、サイズが小さくなります。
- クエリ: JSON は解析が必要です。VARIANT はカラムを直接スキャンするため、通常はるかに高速です。

変更を加えた ClickBench（43 クエリ）の結果:
- 格納容量: VARIANT は JSON より約 65% 少なくなります。
- クエリ: VARIANT は JSON より 8 倍以上高速で、事前定義した静的カラムに近い性能です。

**格納容量**

| 型                  | サイズ     |
| ------------------- | ---------- |
| 事前定義したカラム  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**約 65% の容量削減**

| 実行回           | 事前定義 | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| 初回（コールド）| 233.79s    | 248.66s | ほとんどがタイムアウト |
| 二回目（ウォーム）| 86.02s     | 94.82s  | 789.24s         |
| 三回目（ウォーム）| 83.03s     | 92.29s  | 743.69s         |

## FAQ {#faq}

1. VARIANT の `null` と SQL `NULL` は同じですか？
   - いいえ。クエリ内で計算された JSON `null` は VARIANT `null` 値ですが、存在しないパスは SQL `NULL` です。格納後は、配列の外にあるオブジェクトの `null` メンバーは削除され、SQL `NULL` として読み出されます。[NULL の意味](#null-semantics)を参照してください。
2. `v['a']` が `NULL` を返すのはなぜですか？（`INSERT INTO t VALUES (1, '{"a": 1}')` の実行後）
   - `INSERT` は文字列を解析せずに VARIANT 文字列として格納します。`INSERT INTO ... SELECT` を `s3()`、`hdfs()`、または別の文字列カラムから実行する場合も同様です。`PARSE_TO_VARIANT('{"a": 1}')` を使うか、Stream Load などのロードジョブでデータをロードしてください。[データの書き込み](#write-data)を参照してください。
3. 有効な JSON なのにドキュメント全体が文字列として格納されるのはなぜですか？
   - ドキュメントに [-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値が含まれている可能性があります。パーサーはそのドキュメントを拒否し、デフォルトでは文字列として保持します。[解析エラー](#parse-errors)を参照してください。
4. クエリやインデックスが機能しないのはなぜですか？
   - パスを格納型に CAST しているか（数値の暗黙的な比較ではインデックスを使用できません）、型の競合によって JSONB に変わっていないか、サブパスではなく VARIANT 全体にインデックスが適用されると誤解していないかを確認してください。
5. `ORDER BY v['a']` で `"10"` が `9` より後に並び、`GROUP BY v['a']` で `1` と `"1"` が別のグループになるのはなぜですか？
   - VARIANT の並び順と等価判定では、まず値の種類が考慮されます。数値は文字列より前に並び、数値と文字列が等しくなることはありません。数値順や辞書順が必要なら、パスを 一つの型へ CAST してください。[比較、グループ化、並び順](#comparison-grouping-and-ordering)を参照してください。
6. なぜ `COALESCE(v['a'], 0)` は `0.000000000` を返し（`v['a']` が文字列の場合）、`IF(..., v['a'], 1)` は `NULL` を返すのですか？
   - VARIANT と別の型を混在させると、VARIANT 値はその型に変換されます。整数の場合、その型は `DECIMAL(38, 9)` です。`"abc"` のような文字列は変換できず `NULL` になるため、`COALESCE` は `0` を `0.000000000` として返します。VARIANT の結果を維持するには `COALESCE(v['a'], CAST(0 AS VARIANT))` を使用するか、`v['a']` を目的の型へ CAST してください。
7. DECIMAL を VARIANT カラムへ書き込むと精度が失われるのはなぜですか？
   - 小数部のある JSON 数値は `DOUBLE` と推論され、`DECIMAL` にはならないため、末尾の桁が失われることがあります。Schema Template でパスを `DECIMAL` と宣言しても解決しません。たとえば `v VARIANT<'num': DECIMAL(9, 3)>` でも、値は先に `DOUBLE` として解析されます。`PARSE_TO_VARIANT('{"num": "12.345"}')` のように、ドキュメント内では値を JSON 文字列として書き込んでください。その後、精度を失わずに `DECIMAL(9, 3)` へ直接変換されます。
