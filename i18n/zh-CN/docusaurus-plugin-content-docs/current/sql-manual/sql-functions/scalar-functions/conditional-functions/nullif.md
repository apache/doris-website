---
{
    "title": "NULLIF",
    "language": "zh-CN",
    "description": "如果两个输入值相等，则返回 NULL；否则返回第一个输入值。该函数等价于以下 CASE WHEN 表达式："
}
---

## 描述

如果两个输入值相等，则返回 `NULL`；否则返回第一个输入值。该函数等价于以下 `CASE WHEN` 表达式：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## 语法

```sql
NULLIF(<expr1>, <expr2>)
```

## 参数
- `<expr1>` 需要进行比较的第一个输入值，参数类型说明见下面的使用说明。
- `<expr2>` 需要与第一个输入值进行比较的第二个值，参数类型说明见下面的使用说明。

## 使用说明
参数支持以下类型：
1. 布尔（Boolean）
2. 数字类型（TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal）
3. 日期类型（Date、DateTime、Time）
4. 字符类型（String、VARCHAR、CHAR）

## 返回值
- 如果 `<expr1>` 等于 `<expr2>`，则返回 `NULL`。
- 否则，返回 `<expr1>` 的值。

## 示例
1. 示例 1
    ```sql
    SELECT NULLIF(1, 1);
    ```
    ```text
    +--------------+
    | NULLIF(1, 1) |
    +--------------+
    |         NULL |
    +--------------+
    ```
2. 示例 2
    ```sql
    SELECT NULLIF(1, 0);
    ```
    ```text
    +--------------+
    | NULLIF(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```