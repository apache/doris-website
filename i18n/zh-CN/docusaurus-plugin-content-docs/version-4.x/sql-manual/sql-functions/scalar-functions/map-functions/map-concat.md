---
{
    "title": "MAP_CONCAT",
    "language": "zh-CN"
}
---

## 描述

将多个 map 合并为一个 map。

## 语法

```sql
MAP_CONCAT(<map1> [, <map2> [, <map3> ... ]])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<map1>`, `<map2>`, `<map3>`, ... | [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 类型，需要合并的输入 map |

## 返回值

返回一个合并后的 `MAP`，包含所有输入 map 中的键值对。

## 使用说明

1. 该函数接受零个或多个 map 参数。
2. 如果任何参数为 NULL，则结果为 NULL。

## 示例

1. 基本用法
    ```sql
    select map_concat() as empty_map;
    ```
    ```text
    +-----------+
    | empty_map |
    +-----------+
    | {}        |
    +-----------+
    ```

    ```sql
    select map_concat(map('single', 'argument')) as single_argument;
    ```
    ```text
    +-----------------+
    | single_argument |
    +-----------------+
    | {"single":"argument"} |
    +-----------------+
    ```

    ```sql
    select map_concat({'a': 'apple'}, {'b': 'banana'}, {'c': 'cherry'}) as literal_maps_merged;
    ```
    ```text
    +-------------------------------+
    | literal_maps_merged           |
    +-------------------------------+
    | {"a":"apple", "b":"banana", "c":"cherry"} |
    +-------------------------------+
    ```

2. NULL 参数
    ```sql
    select map_concat({'a': 'apple'}, NULL) as with_null;
    ```
    ```text
    +------------+
    | with_null  |
    +------------+
    | NULL       |
    +------------+
    ```
