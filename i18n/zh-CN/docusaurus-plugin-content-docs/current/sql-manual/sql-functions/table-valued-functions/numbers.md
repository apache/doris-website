---
{
    "title": "NUMBERS",
    "language": "zh-CN",
    "description": "表函数，生成一张只含有一列的临时表，列名为number，如果指定了constvalue，则所有元素值均为constvalue，否则为[0,number) 递增。"
}
---

## 描述

表函数，生成一张只含有一列的临时表，列名为`number`，如果指定了`const_value`，则所有元素值均为`const_value`，否则为[0,`number`) 递增。

## 语法
```sql
NUMBERS(
    "number" = "<number>"
    [, "<const_value>" = "<const_value>" ]
  );
```

## 必填参数

| 字段        | 描述     |
|--------------|----------|
| **number**   | 行数     |

## 选填参数

| 字段             | 描述   |
|----------------|------|
| **const_value** | 常量值  |

## 返回值
| 字段名            | 类型      | 描述       |
|----------------|---------|----------|
| **number**     | BIGINT  | 指定每行返回的值 |

## 举例
```sql
select * from numbers("number" = "5");
```
```text
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
```

```sql
select * from numbers("number" = "5", "const_value" = "-123");
```
```text
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
```

