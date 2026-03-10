---
{
  "title": "EXPLODE_JSON_ARRAY_DOUBLE",
  "language": "ja",
  "description": "explodejsonarraydoubleテーブル関数は、各要素が倍精度浮動小数点型のJSON配列を受け取る。"
}
---
## 説明

`explode_json_array_double`テーブル関数は、各要素が倍精度浮動小数点型のJSON配列を受け取り、配列内の各浮動小数点数を複数の行に展開します。各行には1つの浮動小数点数が含まれます。LATERAL VIEWと組み合わせて使用されます。

`explode_json_array_double_outer`は`explode_json_array_double`と似ていますが、NULL値の処理が異なります。

JSON文字列自体がNULLの場合、`OUTER`版は値をNULLとして1行を返します。通常版はそのようなレコードを完全に無視します。

JSON配列が空の場合、`OUTER`版は値をNULLとして1行を返します。通常版は結果を返しません。

## 構文

```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
EXPLODE_JSON_ARRAY_DOUBLE_OUTER(<json>)
```
## 戻り値

| パラメータ | 説明 |
| -- | -- |
| `<json>` | json型 |

## パラメータ

JSON配列を展開し、各要素に対して行を作成して、倍精度浮動小数点列を返します。

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
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE(json_array) tmp1 AS e1
WHERE id = 2;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    2 |  1.1 |
|    2 |  2.2 |
|    2 |  3.3 |
|    2 |  4.4 |
+------+------+
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE(json_array) tmp1 AS e1
WHERE id = 6;
Empty set (0.01 sec)
```
```sql
SELECT id, e1
FROM json_array_example
LATERAL VIEW EXPLODE_JSON_ARRAY_DOUBLE_OUTER(json_array) tmp1 AS e1
WHERE id = 6;
```
```text
+------+------+
| id   | e1   |
+------+------+
|    6 | NULL |
+------+------+
```
