---
{
  "title": "JSON_VALID",
  "description": "JSONVALID関数は、入力が有効なJSONかどうかを示すために0または1を返します。入力がNULLの場合、NULLを返します。",
  "language": "ja"
}
---
## デスクリプション

JSON_VALID関数は、入力が有効なJSONかどうかを示すために0または1を返します。入力がNULLの場合、NULLを返します。

## Syntax

```sql
JSON_VALID( <str> )

```
必須パラメータ
| Parameter | デスクリプション |
|------|------|
| `<str>` | 解析対象となるJSON形式の入力文字列。 |

## Alias

- JSONB_VALID

## Examples

1. 有効なJSON文字列

```sql
SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+

```
2. 無効なJSON文字列

```sql
SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+

```
3. NULL パラメータ

```sql
SELECT json_valid(NULL);
+------------------+
| json_valid(NULL) |
+------------------+
|             NULL |
+------------------+

```
