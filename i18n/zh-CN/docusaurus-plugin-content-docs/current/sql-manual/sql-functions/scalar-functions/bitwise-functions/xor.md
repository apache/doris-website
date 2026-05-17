---
{
    "title": "XOR",
    "language": "zh-CN",
    "description": "用于对两个 BOOLEAN 值进行按位异或操作。"
}
---

## 描述
用于对两个 BOOLEAN 值进行按位异或操作。

## 语法
```sql
 <lhs> XOR <rhs>
```

## 参数
- `<lhs>` 参与按位与运算的第一个 BOOLEAN 值。
- `<rhs>` 参与按位与运算的第二个 BOOLEAN 值。

## 返回值
返回两个 BOOLEAN 值的异或值。

## 示例
1. 示例 1
    ```sql
    select true XOR false,true XOR true;
    ```
    ```text
    +----------------+---------------+
    | true XOR false | true XOR true |
    +----------------+---------------+
    |              1 |             0 |
    +----------------+---------------+
    ```
2. NULL 参数
    ```sql
    select true XOR NULL, NULL XOR true, false XOR NULL, NULL XOR false, NULL XOR NULL;
    ```
    ```text
    +---------------+---------------+----------------+----------------+---------------+
    | true XOR NULL | NULL XOR true | false XOR NULL | NULL XOR false | NULL XOR NULL |
    +---------------+---------------+----------------+----------------+---------------+
    |          NULL |          NULL |           NULL |           NULL |          NULL |
    +---------------+---------------+----------------+----------------+---------------+
    ```
