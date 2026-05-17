---
{
    "title": "COALESCE",
    "language": "zh-CN",
    "description": "返回参数列表中从左到右第一个非空表达式。如果所有参数都为 NULL，则返回 NULL。"
}
---

## 描述

返回参数列表中从左到右第一个非空表达式。如果所有参数都为 NULL，则返回 NULL。

## 语法

```sql
COALESCE( <expr1> [ , ... , <exprN> ] )
```

## 参数
### 必须参数
- `<expr1>` 任意类型的表达式。
### 可变参数
- `COALESCE` 函数支持多个可变参数。

## 返回值
参数列表中第一个非空表达式。如果所有参数都为 NULL，则返回 NULL。

## 使用说明
1. 多个参数的类型应该尽量统一。
2. 如果多个参数的类型不一致，会尝试转换为同一类型，转换规则参考：[类型转换](../../../basic-element/sql-data-types/conversion/overview.md)
3. 目前参数仅支持部分类型：
    * 字符串类型（String/VARCHAR/CHAR）
    * 布尔类型（Boolean）
    * 数字类型（TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal）
    * 日期类型（Date、DataTime）
    * 位图类型（Bitmap）
    * 半结构化类型（JSON、Array、MAP、Struct）

## 示例
1. 参数类型转换
    ```sql
    select coalesce(null, 2, 1.234);
    ```
    ```text
    +--------------------------+
    | coalesce(null, 2, 1.234) |
    +--------------------------+
    |                    2.000 |
    +--------------------------+
    ```
    > 因为第三个参数 "1.234" 是 Deciaml 类型， 参数 "2" 被转换为了 Decimal 类型。

2. 所有参数都是 NULL
    ```sql
    select coalesce(null, null, null);
    ```
    ```text
    +----------------------------+
    | coalesce(null, null, null) |
    +----------------------------+
    | NULL                       |
    +----------------------------+
    ```
