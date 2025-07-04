---
{
"title": "EXPLODE_JSON_OBJECT",
"language": "zh-CN"
}
---

## 描述

`explode_json_object` 将 JSON 对象展开为多行，每行包含一个键值对。通常用于处理 JSON 数据，将 JSON 对象展开为更易查询的格式。该函数只支持包含元素的 JSON 对象。

`explode_json_object_outer` 与 `explode_json_object` 类似，但在处理空值和 NULL 值时有不同的行为。它可以保留空的或 NULL 的 JSON 对象，返回相应的记录。

## 语法
```sql
EXPLODE_JSON_OBJECT(<json>)
EXPLODE_JSON_OBJECT_OUTER(<json>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<json>` | json 类型 |

## 返回值

当  JSON 对象不为空或 NULL 时，`explode_json_object` 和 `explode_json_object_outer` 的返回值相同。每个键值对生成一行，键作为列之一，值作为另一个列。

当 JSON 对象为空或 NULL 时：

`explode_json_object` 不会返回任何行。

`explode_json_object_outer`  会返回一行，展开列的值为 NULL。

## 举例

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
