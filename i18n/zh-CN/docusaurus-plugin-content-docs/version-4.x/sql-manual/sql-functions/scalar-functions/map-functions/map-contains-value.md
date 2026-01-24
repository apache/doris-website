---
{
    "title": "MAP_CONTAINS_VALUE",
    "language": "zh-CN",
    "description": "判断给定 map 中是否包含特定的值 value"
}
---

## 描述

判断给定 `map` 中是否包含特定的值 `value`

## 语法

```sql
MAP_CONTAINS_VALUE(<map>, <value>)
```

## 参数
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，输入的 map 内容。
- `<value>` 支持多种类型，需要检索的 value。

## 返回值
判断给定 `map` 中是否包含特定的值 `value`,存在返回 1 ,不存在返回 0。

## 使用说明
1. 如果参数 `<map>` 为 NULL，返回 NULL。
2. `<value>` 可以是 NULL，这里对 NULL 的比较为 `null-safe-equal` 即认为 NULL 和 NULL 是相等的。

## 举例
1. 普通参数
    ```sql
    select map_contains_value(map(1, "100", 0.1, 2), 100), map_contains_value(map(1, "100", 0.1, 2), 101);
    ```
    ```text
    +------------------------------------------------+------------------------------------------------+
    | map_contains_value(map(1, "100", 0.1, 2), 100) | map_contains_value(map(1, "100", 0.1, 2), 101) |
    +------------------------------------------------+------------------------------------------------+
    |                                              1 |                                              0 |
    +------------------------------------------------+------------------------------------------------+
    ```
2. NULL 参数
    ```sql
    select map_contains_value(NULL, 100);
    ```
    ```text
    +-------------------------------+
    | map_contains_value(NULL, 100) |
    +-------------------------------+
    |                          NULL |
    +-------------------------------+
    ```
    ```sql
    select map_contains_value(map(null, null), null), map_contains_value(map(null, 100), null);
    ```
    ```text
    +-------------------------------------------+------------------------------------------+
    | map_contains_value(map(null, null), null) | map_contains_value(map(null, 100), null) |
    +-------------------------------------------+------------------------------------------+
    |                                         1 |                                        0 |
    +-------------------------------------------+------------------------------------------+
    ```