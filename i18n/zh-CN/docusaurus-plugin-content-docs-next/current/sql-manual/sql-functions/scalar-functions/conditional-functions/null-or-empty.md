---
{
    "title": "NULL_OR_EMPTY",
    "language": "zh-CN",
    "description": "nullorempty 函数用于判断给定的值是否为非 NULL 且非空。如果输入值不为 NULL 且不为空，则返回 true；否则返回 false。"
}
---

## 描述

`null_or_empty` 函数用于判断给定的值是否为非 NULL 且非空。如果输入值不为 NULL 且不为空，则返回 true；否则返回 false。

## 语法

```sql
NULL_OR_EMPTY (<str>)
```

## 参数
- `<str>` String 类型，用于判定是否为 NULL 或者为空的字符串。

## 返回值
如果字符串为空字符串或者 NULL，返回 true；否则返回 false。

## 举例
1. 示例1
    ```sql
    select null_or_empty(null), null_or_empty(""), null_or_empty(" ");
    ```
    ```text
    +---------------------+-------------------+--------------------+
    | null_or_empty(null) | null_or_empty("") | null_or_empty(" ") |
    +---------------------+-------------------+--------------------+
    |                   1 |                 1 |                  0 |
    +---------------------+-------------------+--------------------+
    ```
