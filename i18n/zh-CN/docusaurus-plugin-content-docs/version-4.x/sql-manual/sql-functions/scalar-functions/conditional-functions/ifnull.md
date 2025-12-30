---
{
    "title": "IFNULL",
    "language": "zh-CN",
    "description": "如果 <expr1> 的值不为 NULL，则返回 <expr1>；否则返回 <expr2>。"
}
---

## 描述

如果 `<expr1>` 的值不为 `NULL`，则返回 `<expr1>`；否则返回 `<expr2>`。

## 别名

- NVL

## 语法

```sql
IFNULL(<expr1>, <expr2>)
```

## 参数
- `<expr1>` 需要判断是否为 `NULL` 的表达式。
- `<expr2>` `<expr1>` 为 `NULL` 时返回的值。

## 返回值
- 如果 `<expr1>` 不为 `NULL`，则返回 `<expr1>`。  
- 否则，返回 `<expr2>`。

## 举例
1. 示例 1
    ```sql
    SELECT IFNULL(1, 0);
    ```
    ```text
    +--------------+
    | IFNULL(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
2. 示例 2
    ```sql
    SELECT IFNULL(NULL, 10);
    ```

    ```text
    +------------------+
    | IFNULL(NULL, 10) |
    +------------------+
    |               10 |
    +------------------+
    ```
3. 参数都为 NULL
    ```sql
    SELECT IFNULL(NULL, NULL);
    ```
    ```text
    +--------------------+
    | IFNULL(NULL, NULL) |
    +--------------------+
    |               NULL |
    +--------------------+
    ```