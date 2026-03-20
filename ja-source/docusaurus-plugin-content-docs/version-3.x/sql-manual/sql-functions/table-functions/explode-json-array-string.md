---
{
  "title": "EXPLODE_JSON_ARRAY_STRING",
  "description": "explodejsonarraystring table関数は JSON 配列を受け取ります。この配列の各要素は string 型である必要があります。",
  "language": "ja"
}
---
## 説明

`explode_json_array_string` table関数は、各要素が文字列型のJSON配列を受け取り、配列内の各文字列を複数の行に展開し、各行に1つの文字列を含めます。この関数はLATERAL VIEWと組み合わせて使用されます。

`explode_json_array_string_outer` は `explode_json_array_string` と似ていますが、NULL値の処理が異なります。

JSON文字列自体がNULLの場合、`OUTER` バージョンは1行を返し、値はNULLになります。通常バージョンはそのようなレコードを完全に無視します。

JSON配列が空の場合、`OUTER` バージョンは1行を返し、値はNULLになります。通常バージョンは結果を返しません。

## 構文

```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```
## Return Value

| Parameter | デスクリプション |
| -- | -- |
| `<json>` | json type |

## パラメータ

JSON配列を展開し、各要素に対して行を作成して、文字列列を返します。

## Examples

```sql
CREATE TABLE json_array_example (
    id INT,
    json_array STRING
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```
```sql
INSERT INTO json_array_example (id, json_array) VALUES
(1, '[1, 2, 3, 4, 5]'),
(2, '[1.1, 2.2, 3.3, 4.4]'),
(3, '["apple", "banana", "cherry"]'),
(4, '[{"a": 1}, {"b": 2}, {"c": 3}]'),
(5, '[]'),
(6, 'NULL');
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 3;
```
```text
+------+--------+
| id   | e1     |
+------+--------+
|    3 | apple  |
|    3 | banana |
|    3 | cherry |
+------+--------+
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING(json_array) tmp1 AS e1
WHERE id = 6;
Empty set (0.02 sec)
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_STRING_OUTER(json_array) tmp1 AS e1
WHERE id = 6;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    6 | NULL |
+------+------+
```
