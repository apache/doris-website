---
{
    "title": "EXPLODE_JSON_ARRAY_INT",
    "language": "zh-CN",
    "description": "explodejsonarrayint 表函数，接受一个 JSON 数组，其中每个元素是整数类型，将该 JSON 数组中的每个整数展开为多行，每行包含一个整数。配合 LATERAL VIEW 使用。"
}
---

## 描述

`explode_json_array_int` 表函数，接受一个 JSON 数组，其中每个元素是整数类型，将该 JSON 数组中的每个整数展开为多行，每行包含一个整数。配合 LATERAL VIEW 使用。

`explode_json_array_int_outer` 和 `explode_json_array_int` 类似，对于空值或 NULL 的处理不同。

如果 JSON 字符串本身为 NULL，`OUTER` 版本会返回一行，且该行中的值为 NULL。普通版本会完全忽略这类记录。

如果 JSON 数组为空，`OUTER` 版本会返回一行，且该行的值为 NULL。普通版本则不会返回任何结果。

## 语法

```sql
EXPLODE_JSON_ARRAY_INT(<json>)
EXPLODE_JSON_ARRAY_INT_OUTER(<json>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<json>` | json 类型 |

## 返回值

展开 JSON 数组，每个元素生成一行，返回整数列。

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
