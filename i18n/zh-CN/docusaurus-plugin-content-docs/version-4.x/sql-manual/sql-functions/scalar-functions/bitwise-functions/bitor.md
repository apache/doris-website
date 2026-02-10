---
{
    "title": "BITOR",
    "language": "zh-CN",
    "description": "用于对两个整数进行按位或操作。"
}
---

## 描述
用于对两个整数进行按位或操作。

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

## 语法
```sql
BITOR( <lhs>, <rhs>)
```

## 参数
- `<lhs>` 参与运算的第一个数。
- `<rhs>` 参与运算的第二个数。

## 返回值

返回两个整数或运算的结果。

## 示例
1. 示例 1
    ```sql
    select BITOR(3,5), BITOR(4,7);
    ```
    ```text
    +------------+------------+
    | BITOR(3,5) | BITOR(4,7) |
    +------------+------------+
    |          7 |          7 |
    +------------+------------+
    ```
2. NULL 参数
    ```sql
    select BITOR(3, NULL), BITOR(NULL, 5), BITOR(NULL, NULL);
    ```
    ```text
    +----------------+----------------+-------------------+
    | BITOR(3, NULL) | BITOR(NULL, 5) | BITOR(NULL, NULL) |
    +----------------+----------------+-------------------+
    |           NULL |           NULL |              NULL |
    +----------------+----------------+-------------------+
    ```