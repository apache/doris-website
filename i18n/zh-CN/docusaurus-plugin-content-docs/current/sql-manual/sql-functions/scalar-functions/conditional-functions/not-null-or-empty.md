---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "zh-CN",
    "description": "notnullorempty 函数用于判断给定的值是否为非 NULL 且非空。如果输入值不为 NULL 且不为空，则返回 true；否则返回 false。"
}
---

## 描述

`not_null_or_empty` 函数用于判断给定的值是否为非 NULL 且非空。如果输入值不为 NULL 且不为空，则返回 true；否则返回 false。

## 语法

```sql
NOT_NULL_OR_EMPTY (<str>)
```

## 参数
- `<str>` String 类型，用于判定是否为 NULL 或者为空的字符串。

## 返回值
如果字符串为空字符串或者 NULL，返回 false；否则返回 true。

## 举例
1. 示例1
    ```sql
    select not_null_or_empty(null), not_null_or_empty(""), not_null_or_empty(" ");
    ```
    ```text
    +-------------------------+-----------------------+------------------------+
    | not_null_or_empty(null) | not_null_or_empty("") | not_null_or_empty(" ") |
    +-------------------------+-----------------------+------------------------+
    |                       0 |                     0 |                      1 |
    +-------------------------+-----------------------+------------------------+
    ```
