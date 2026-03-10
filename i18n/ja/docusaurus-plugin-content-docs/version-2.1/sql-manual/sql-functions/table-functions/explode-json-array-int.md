---
{
  "title": "EXPLODE_JSON_ARRAY_INT",
  "language": "ja",
  "description": "explodejsonarrayintテーブル関数は、各要素がinteger型であるJSON配列を受け取ります。"
}
---
## Description

`explode_json_array_int`テーブル関数は、各要素が整数型のJSON配列を受け取り、配列内の各整数を複数の行に展開します。各行には1つの整数が含まれます。LATERAL VIEWと組み合わせて使用されます。

`explode_json_array_int_outer`は`explode_json_array_int`と似ていますが、NULL値の処理が異なります。

JSON文字列自体がNULLの場合、`OUTER`バージョンは1行を返し、値はNULLになります。通常バージョンはそのようなレコードを完全に無視します。

JSON配列が空の場合、`OUTER`バージョンは1行を返し、値はNULLになります。通常バージョンは結果を返しません。

## Syntax

```sql
EXPLODE_JSON_ARRAY_INT(<json>)
EXPLODE_JSON_ARRAY_INT_OUTER(<json>)
```
## 戻り値

| パラメータ | 説明 |
| -- | -- |
| `<json>` | json型 |

## パラメータ

JSON配列を展開し、各要素に対して行を作成し、integer列を返します。

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
LATERAL VIEW EXPLODE_JSON_ARRAY_INT(json_array) tmp1 AS e1
WHERE id = 1;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    1 |    1 |
|    1 |    2 |
|    1 |    3 |
|    1 |    4 |
|    1 |    5 |
+------+------+
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_INT(json_array) tmp1 AS e1
WHERE id = 5;
Empty set (0.01 sec)
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_INT_OUTER(json_array) tmp1 AS e1
WHERE id = 5;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    5 | NULL |
+------+------+
```
