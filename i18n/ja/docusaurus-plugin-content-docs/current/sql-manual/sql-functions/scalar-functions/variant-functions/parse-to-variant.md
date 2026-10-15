---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ja",
    "description": "テキストまたは JSON/JSONB 式から、完全な JSON 値を一つ解析し、型付きの VARIANT 値に変換します。"
}
---

## 説明

`PARSE_TO_VARIANT` は、完全な JSON 値を一つ解析して `VARIANT` に変換します。JSON オブジェクト、配列、文字列、数値、真偽値、および JSON リテラルの `null` を受け付けます。この関数は Doris 4.1.4 以降で使用できます。このページでは、Doris 5.0.0 以降の動作を説明します。

## 構文

```sql
PARSE_TO_VARIANT(<json_value>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<json_value>` | 完全な JSON 値を一つ含む `CHAR`、`VARCHAR`、`STRING` 式、または `JSON`/`JSONB` 式。JSON/JSONB 入力は JSON テキストに変換されてから VARIANT として解析されます。 |

## 戻り値

`VARIANT` 値を返します。

- SQL の `NULL` を入力すると、SQL の `NULL` を返します。
- JSON リテラルの `null` を入力すると、VARIANT の `null` を返します。これは SQL の `NULL` とは異なります。
- 有効な JSON ではないテキストは、VARIANT 文字列として返されます。[-2^63, 2^64 - 1] の範囲外の整数、または `DOUBLE` の範囲外の数値を含む JSON も同様に、テキスト全体が一つの文字列になります。この動作は BE 設定 `variant_throw_exeception_on_invalid_json`（デフォルトは `false`）で制御します。`true` の場合、このような入力によってクエリが失敗します。
- 空文字列を入力すると、空のオブジェクト `{}` を返します。
- JSON パーサー自体が拒否するほど深くネストされたドキュメント（約 1,000 階層）は無効な JSON とみなされ、文字列として返されます。
- オブジェクトのキーが `variant_max_json_key_length` バイト（BE 設定、デフォルトは 255）より長い場合、オブジェクトに重複するキーが含まれる場合（ただし、BE 設定 `variant_enable_duplicate_json_path_check` が `true` の場合は最初の値が保持されます）、ネストが 128 階層を超える場合、または文字列が有効な UTF-8 ではない場合、クエリは失敗します。

## 例

JSON テキストを解析します。

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------+
| value                            |
+----------------------------------+
| {"id":42,"tags":["doris","sql"]} |
+----------------------------------+
```

JSON/JSONB 式を解析します。

```sql
SELECT CAST(
           PARSE_TO_VARIANT(CAST('{"id": 42}' AS JSON))
           AS STRING
       ) AS value;
```

```text
+-----------+
| value     |
+-----------+
| {"id":42} |
+-----------+
```

値を取り出し、具体的な SQL 型に CAST します。

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;
```

```text
+---------+
| user_id |
+---------+
|      42 |
+---------+
```

SQL の `NULL` は SQL の `NULL` のままです。

```sql
SELECT PARSE_TO_VARIANT(NULL) IS NULL AS is_sql_null;
```

```text
+-------------+
| is_sql_null |
+-------------+
|           1 |
+-------------+
```

有効な JSON ではないテキストは文字列として保持されます。

```sql
SELECT CAST(PARSE_TO_VARIANT('{"id":') AS STRING) AS value,
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS type;
```

```text
+--------+--------+
| value  | type   |
+--------+--------+
| {"id": | string |
+--------+--------+
```

キーが重複している場合はエラーを返します。

```sql
SELECT PARSE_TO_VARIANT('{"id": 1, "id": 2}');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INVALID_ARGUMENT]Duplicate Variant object key
```

## 使用上の注意

- [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md) は、解析エラー時にクエリを失敗させず、SQL の `NULL` を返したい場合に使用してください。
- `PARSE_TO_VARIANT` は JSON を明示的に解析します。一方、`CAST(string AS VARIANT)` と、文字列を VARIANT カラムに `INSERT` する操作では、入力は JSON として解析されず、VARIANT 文字列として保持されます。JSON テキストを `INSERT` で書き込むには、`PARSE_TO_VARIANT` で囲んでください。[データの書き込み](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#write-data)と[VARIANT への CAST](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#cast-to-variant)を参照してください。
