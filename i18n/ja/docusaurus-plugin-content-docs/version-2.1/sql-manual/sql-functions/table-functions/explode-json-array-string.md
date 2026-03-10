---
{
  "title": "EXPLODE_JSON_ARRAY_STRING",
  "language": "ja",
  "description": "explodejsonarraystring テーブル関数は、各要素が文字列型のJSON配列を受け取ります。"
}
---
## Description

`explode_json_array_string` テーブル関数は、各要素が文字列型のJSON配列を受け取り、配列内の各文字列を複数の行に展開し、各行が1つの文字列を含むようにします。この関数はLATERAL VIEWと組み合わせて使用されます。

`explode_json_array_string_outer` は `explode_json_array_string` と類似していますが、NULL値の処理が異なります。

JSON文字列自体がNULLの場合、`OUTER` バージョンは1行を返し、その値はNULLとなります。通常のバージョンはそのようなレコードを完全に無視します。

JSON配列が空の場合、`OUTER` バージョンは1行を返し、その値はNULLとなります。通常のバージョンは結果を返しません。

## Syntax

```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```
## 戻り値

| パラメータ | 説明 |
| -- | -- |
| `<json>` | json型 |

## パラメータ

JSON配列を展開し、各要素に対して行を作成し、文字列列を返します。

## 例

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
