---
{
    "title": "MAP_SIZE",
    "language": "zh-CN",
    "description": "计算 Map 中元素的个数"
}
---

## 描述

计算 Map 中元素的个数

## 语法

```sql
MAP_SIZE(<map>)
```

## 参数
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，输入的 map 内容。
## 返回值
返回 Map 中元素的个数

## 使用说明
1. 无论 key 或者 value 是 NULL 都会被计数。
2. 对于 NULL 参数，返回 NULL。

## 举例
1. 常规参数
    ```sql
    select map_size(map()), map_size(map(1, "100", 0.1, 2, null, null));
    ```

    ```text
    +-----------------+---------------------------------------------+
    | map_size(map()) | map_size(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    |               0 |                                           3 |
    +-----------------+---------------------------------------------+
    ```
2. NULL 参数
    ```sql
    select map_size(NULL);
    ```
    ```text
    +----------------+
    | map_size(NULL) |
    +----------------+
    |           NULL |
    +----------------+
    ```