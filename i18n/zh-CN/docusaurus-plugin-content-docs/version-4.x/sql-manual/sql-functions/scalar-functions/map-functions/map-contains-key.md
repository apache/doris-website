---
{
    "title": "MAP_CONTAINS_KEY",
    "language": "zh-CN",
    "description": "判断给定 map 中是否包含特定的键 key"
}
---

## 描述

判断给定 `map` 中是否包含特定的键 `key`

## 语法

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```

## 参数
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，输入的 map 内容。
- `<key>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 支持的 key 类型，需要检索的 key。

## 返回值
判断给定 `map` 中是否包含特定的键 `key`,存在返回 1 ,不存在返回 0。

## 举例

```sql
select map_contains_key(map(null, 1, 2, null), null),map_contains_key(map(1, "100", 0.1, 2), 0.11);
```

```text
+-----------------------------------------------+-----------------------------------------------+
| map_contains_key(map(null, 1, 2, null), null) | map_contains_key(map(1, "100", 0.1, 2), 0.11) |
+-----------------------------------------------+-----------------------------------------------+
|                                             1 |                                             0 |
+-----------------------------------------------+-----------------------------------------------+
```
* Map 中的 key 比较使用的是 “null-safe equal”（null 和 null 被认为是相等的），这与标准 SQL 的定义不同。

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+