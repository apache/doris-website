---
{
    "title": "EXPLODE_JSON_ARRAY_JSON",
    "language": "zh-CN",
    "description": "explodejsonarrayjson 表函数，接受一个 JSON 数组，其中每个元素是 JSON 对象类型，将该 JSON 数组中的每个 JSON 对象展开为多行，每行包含一个 JSON 对象。配合 LATERAL VIEW 使用。"
}
---

## 描述

`explode_json_array_json` 表函数，接受一个 JSON 数组，其中每个元素是 JSON 对象类型，将该 JSON 数组中的每个 JSON 对象展开为多行，每行包含一个 JSON 对象。配合 LATERAL VIEW 使用。

## 语法

```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<json>` | json 类型 |

## 返回值

展开 JSON 数组，每个元素生成一行，返回 JSON 对象列。

## 举例

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