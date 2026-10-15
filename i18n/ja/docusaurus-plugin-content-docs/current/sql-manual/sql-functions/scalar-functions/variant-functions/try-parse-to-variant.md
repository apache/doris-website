---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "ja",
    "description": "単一の JSON 値を VARIANT として解析します。長すぎるキーや重複したキーがある場合はエラーではなく SQL NULL を返し、有効な JSON ではないテキストは文字列として保持します。"
}
---

## 説明

`TRY_PARSE_TO_VARIANT` は、単一の完全な JSON 値を解析して `VARIANT` に変換します。`TRY_` 接頭辞が示すとおり、解析エラーが発生した場合はクエリを失敗させず、SQL `NULL` を返します。デフォルトでは、有効な JSON ではないテキストは解析エラーになりません。詳しくは「戻り値」を参照してください。この関数は Doris 4.1.4 以降で使用できます。このページでは Doris 5.0.0 以降の動作を説明します。

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
- 次の解析エラーでは SQL `NULL` を返します。オブジェクトのキーが `variant_max_json_key_length` バイト（BE 設定、デフォルトは 255）を超える場合、同一オブジェクト内に重複したキーがある場合（ただし、BE 設定の `variant_enable_duplicate_json_path_check` が `true` の場合は最初の値が保持されます）、ネストが 128 階層を超える場合、文字列が有効な UTF-8 ではない場合です。
- 有効な JSON ではないテキスト、および [-2^63, 2^64 - 1] の範囲外の整数や `DOUBLE` の範囲外の数値を含む JSON は、[PARSE_TO_VARIANT](./parse-to-variant.md) と同様に VARIANT の文字列として返されます。SQL `NULL` を返すのは、BE 設定の `variant_throw_exeception_on_invalid_json` が `true`（デフォルトは `false`）の場合に限られます。
- 空文字列は空のオブジェクト `{}` を返します。
- SQL `NULL` を入力すると SQL `NULL` を返します。
- JSON リテラルの `null` は VARIANT の `null` を返し、SQL `NULL` とは異なります。

## 例

有効な値は保持し、解析エラーは SQL `NULL` に変換する:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id": 1, "id": 2}') IS NULL AS duplicate_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-------------------+---------------+
| valid_value | duplicate_is_null | input_is_null |
+-------------+-------------------+---------------+
| {"id":1}    |                 1 |             1 |
+-------------+-------------------+---------------+
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

JSON の `null` は SQL `NULL` とは異なり、有効な JSON ではないテキストは文字列として保持される:

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       VARIANT_TYPE(TRY_PARSE_TO_VARIANT('{"id":')) AS invalid_json_type;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | invalid_json_type |
+-----------------------+-------------------+
|                     0 | string            |
+-----------------------+-------------------+
```

## 使用上の注意

- 解析エラーでクエリを失敗させ、データ品質の問題を明らかにするには、[PARSE_TO_VARIANT](./parse-to-variant.md) を使用します。
- この関数は解析エラーだけを SQL `NULL` に変換します。有効な JSON の `null` の意味は変わりません。
- Stream Load などのロードジョブも、この関数と同じルールで JSON テキストを解析します。「[解析エラー](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors)」を参照してください。
