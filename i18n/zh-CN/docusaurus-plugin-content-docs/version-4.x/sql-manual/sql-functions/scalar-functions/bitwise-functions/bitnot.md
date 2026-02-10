---
{
    "title": "BITNOT",
    "language": "zh-CN",
    "description": "用于对整数进行按位取反操作。"
}
---

## 描述
用于对整数进行按位取反操作。

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT。

## 语法
```sql
BITNOT( <x>)
```

## 参数
- `<x>` 参与运算整数。

## 返回值
返回一个整数取反运算的结果

## 示例
1. 示例 1
    ```sql
    select BITNOT(7), BITNOT(-127);
    ```
    ```text
    +-----------+--------------+
    | BITNOT(7) | BITNOT(-127) |
    +-----------+--------------+
    |        -8 |          126 |
    +-----------+--------------+
    ```
2. NULL 参数
    ```sql
    select BITNOT(NULL);
    ```
    ```text
    +--------------+
    | BITNOT(NULL) |
    +--------------+
    |         NULL |
    +--------------+
    ```