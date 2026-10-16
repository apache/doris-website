---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "ja",
    "description": "完全な JSON 値を VARIANT として解析し、解析または検証に失敗した場合は SQL NULL を返します。"
}
---

## 説明

`TRY_PARSE_TO_VARIANT` は、単一の完全な JSON 値を解析して `VARIANT` に変換します。`TRY_` 接頭辞が示すとおり、解析または検証に失敗した場合はクエリを失敗させず、SQL `NULL` を返します。この関数は Doris 4.1.4 以降で使用できます。

## 構文

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<json_value>` | 単一の完全な JSON 値を含む `CHAR`、`VARCHAR`、`STRING` 式、または `JSON`/`JSONB` 式です。JSON/JSONB 入力は JSON テキストに変換してから VARIANT として解析されます。 |

## 戻り値

NULL 許容の `VARIANT` 値を返します。

- 有効な入力は、解析後の VARIANT 値を返します。
- 無効な JSON やその他の解析・検証エラーでは、SQL `NULL` を返します。
- SQL `NULL` を入力すると SQL `NULL` を返します。
- 有効な JSON リテラルの `null` は VARIANT/JSON の `null` を返し、SQL `NULL` とは異なります。

## 例

有効な値は保持し、無効な JSON は SQL `NULL` に変換する:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id":') IS NULL AS invalid_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-----------------+---------------+
| valid_value | invalid_is_null | input_is_null |
+-------------+-----------------+---------------+
| {"id":1}    |               1 |             1 |
+-------------+-----------------+---------------+
```

JSON/JSONB 入力を解析する:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT(CAST('[10, 20, 30]' AS JSON))
           AS STRING
       ) AS value;
```

```text
+------------+
| value      |
+------------+
| [10,20,30] |
+------------+
```

JSON の `null` と SQL `NULL` を区別する:

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       TRY_PARSE_TO_VARIANT('{') IS NULL AS error_is_sql_null;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | error_is_sql_null |
+-----------------------+-------------------+
|                     0 |                 1 |
+-----------------------+-------------------+
```

## 使用上の注意

- 無効な入力でクエリを失敗させ、データ品質の問題を明らかにするには、[PARSE_TO_VARIANT](./parse-to-variant) を使用します。
- この関数は解析・検証の失敗だけを SQL `NULL` に変換します。有効な JSON の `null` の意味は変わりません。
