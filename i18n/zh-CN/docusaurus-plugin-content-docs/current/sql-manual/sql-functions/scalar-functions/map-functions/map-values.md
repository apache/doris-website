---
{
    "title": "MAP_VALUES",
    "language": "zh-CN",
    "description": "将给定 MAP 的值提取成一个对应类型的 ARRAY。"
}
---

## 描述

将给定 [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 的值提取成一个对应类型的 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)。

## 语法

```sql
MAP_VALUES(<map>)
```

## 参数
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，输入的 map 内容。

## 返回值
将给定 `map` 的值提取成一个对应类型的 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)。

## 使用说明
1. 对于 NULL 参数，返回 NULL。
2. 对于空的 MAP 对象，返回空的数组。
3. MAP 中的 NULL 值也会包含在返回的数组中。

## 举例
1. 常规参数
    ```sql
    select map_values(map()), map_values(map(1, "100", 0.1, 2, 0.3, null));
    ```

    ```text
    +-------------------+----------------------------------------------+
    | map_values(map()) | map_values(map(1, "100", 0.1, 2, 0.3, null)) |
    +-------------------+----------------------------------------------+
    | []                | ["100", "2", null]                           |
    +-------------------+----------------------------------------------+
    ```
2. NULL 参数
    ```sql
    select map_values(null);
    ```
    ```text
    +------------------+
    | map_values(null) |
    +------------------+
    | NULL             |
    +------------------+
    ```
