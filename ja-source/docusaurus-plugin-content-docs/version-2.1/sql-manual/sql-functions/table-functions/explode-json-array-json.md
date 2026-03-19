---
{
  "title": "EXPLODE_JSON_ARRAY_JSON",
  "language": "ja",
  "description": "explodejsonarrayjsonテーブル関数は、各要素がJSONオブジェクト型であるJSON配列を受け入れます。"
}
---
## 説明

`explode_json_array_json`テーブル関数は、各要素がJSONオブジェクト型のJSON配列を受け取り、配列内の各JSONオブジェクトを複数の行に展開し、各行に1つのJSONオブジェクトを含めます。LATERAL VIEWと組み合わせて使用されます。

## 構文

```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```
## 戻り値

| パラメータ | 説明 |
| -- | -- |
| `<json>` | json型 |

## パラメータ

JSON配列を展開し、各要素に対して行を作成し、JSONオブジェクトカラムを返します。

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
LATERAL VIEW EXPLODE_JSON_ARRAY_JSON(json_array) tmp1 AS e1
WHERE id = 4;
```
```text
+------+---------+
| id   | e1      |
+------+---------+
|    4 | {"a":1} |
|    4 | {"b":2} |
|    4 | {"c":3} |
+------+---------+
```
