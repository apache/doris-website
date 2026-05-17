---
{
    "title": "MAP_KEYS",
    "language": "zh-CN",
    "description": "将给定 map 的键提取成一个对应类型的 ARRAY。"
}
---

## 描述

将给定 `map` 的键提取成一个对应类型的 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)。

## 语法

```sql
MAP_KEYS(<map>)
```

## 参数
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，输入的 map 内容。

## 返回值
将给定 `map` 的键提取成一个对应类型的 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)。

## 举例
1. 常规参数
    ```sql
    select map_keys(map()),map_keys(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_keys(map()) | map_keys(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    | []              | [1.0, 0.1, null]                            |
    +-----------------+---------------------------------------------+
    ```
2. NULL 参数
    ```sql
    select map_keys(NULL);
    ```
    ```text
    +----------------+
    | map_keys(NULL) |
    +----------------+
    | NULL           |
    +----------------+
    ```