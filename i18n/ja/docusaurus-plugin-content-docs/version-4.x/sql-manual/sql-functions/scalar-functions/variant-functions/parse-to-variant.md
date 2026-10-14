---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ja",
    "description": "完全な JSON 値を含むテキストまたは JSON/JSONB 式を解析し、型付きの VARIANT 値に変換します。"
}
---

## 説明

`PARSE_TO_VARIANT` は、単一の完全な JSON 値を解析して `VARIANT` に変換します。JSON オブジェクト、配列、文字列、数値、真偽値、および JSON リテラルの `null` を受け付けます。この関数は Doris 4.1.4 以降で使用できます。

## 構文

```sql
PARSE_TO_VARIANT(<json_value>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<json_value>` | 単一の完全な JSON 値を含む `CHAR`、`VARCHAR`、`STRING` 式、または `JSON`/`JSONB` 式です。JSON/JSONB 入力は JSON テキストに変換してから VARIANT として解析されます。 |

## 戻り値

`VARIANT` 値を返します。

- SQL `NULL` を入力すると SQL `NULL` を返します。
- JSON リテラルの `null` を入力すると VARIANT/JSON の `null` を返します。これは SQL `NULL` とは異なります。
- 無効な JSON、現在の検証設定で拒否されるオブジェクトキーの重複、サポートされないネストの深さ、その他の検証エラーは、クエリの失敗を引き起こします。

## 例

JSON テキストを解析する:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------------+
| value                                  |
+----------------------------------------+
| {"id":42,"tags":["doris","sql"]}     |
+----------------------------------------+
```

JSON/JSONB 式を解析する:

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

値を取り出して具体的な SQL 型に CAST する:

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

SQL `NULL` は SQL `NULL` のままになる:

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

無効な JSON はエラーになる:

```sql
SELECT PARSE_TO_VARIANT('{"id":');
```

```text
ERROR: Parse json document failed
```

## 使用上の注意

- [TRY_PARSE_TO_VARIANT](./try-parse-to-variant) を使用すると、無効な入力を SQL `NULL` に変換できます。
- `PARSE_TO_VARIANT` は JSON を明示的に解析します。一方、`CAST(string AS VARIANT)` は入力を VARIANT 文字列として保持し、JSON としては解析しません。[VARIANT の CAST ルール](../../../basic-element/sql-data-types/semi-structured/VARIANT#supported-operations-and-cast-rules) を参照してください。
