---
{
  "title": "EXPLODE_JSON_OBJECT",
  "description": "explodejsonobject は JSON オブジェクトを複数の行に展開し、各行にはキーと値のペアが含まれます。",
  "language": "ja"
}
---
## デスクリプション

`explode_json_object`はJSONオブジェクトを複数の行に展開し、各行にキーと値のペアを含めます。通常、JSONデータを処理し、JSONオブジェクトをよりクエリ可能な形式に展開するために使用されます。この関数は空でないJSONオブジェクトのみをサポートします。

`explode_json_object_outer`は`explode_json_object`と似ていますが、空の値やNULL値を処理する際の動作が異なります。空またはNULLのJSONオブジェクトを保持し、対応するレコードを返すことができます。

## Syntax

```sql
EXPLODE_JSON_OBJECT(<json>)
EXPLODE_JSON_OBJECT_OUTER(<json>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<json>` | json型 |

## 戻り値

JSONオブジェクトが空でもNULLでもない場合、`explode_json_object`と`explode_json_object_outer`の戻り値は同じです。各キー・バリューペアが1行を生成し、キーが1つの列、値がもう1つの列となります。

JSONオブジェクトが空またはNULLの場合：

`explode_json_object`は行を返しません。
`explode_json_object_outer`は1行を返し、展開された列はNULLになります。

## 例

```sql
CREATE TABLE example (
    id INT,
    value_json json
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```
```sql
INSERT INTO example VALUES
(1, '{"key1": "value1", "key2": "value2"}'),
(2, '{}'),
(3, NULL);
```
```sql
select * from example;
```
```text
+------+-----------------------------------+
| id   | value_json                        |
+------+-----------------------------------+
|    2 | {}                                |
|    1 | {"key1":"value1","key2":"value2"} |
|    3 | NULL                              |
+------+-----------------------------------+
```
```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object(value_json) exploded_table AS k , v;
```
```text
+------+------+----------+
| id   | k    | v        |
+------+------+----------+
|    1 | key1 | "value1" |
|    1 | key2 | "value2" |
+------+------+----------+
```
```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object_outer(value_json) exploded_table AS k, v;
```
```text
+------+------+----------+
| id   | k    | v        |
+------+------+----------+
|    3 | NULL | NULL     |
|    1 | key1 | "value1" |
|    1 | key2 | "value2" |
|    2 | NULL | NULL     |
+------+------+----------+
```
