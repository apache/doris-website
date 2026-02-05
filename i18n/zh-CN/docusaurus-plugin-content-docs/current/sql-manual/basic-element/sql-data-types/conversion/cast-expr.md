---
{
    "title": "CAST 表达式",
    "language": "zh-CN",
    "description": "CAST 表达式用于将一种数据类型的值转换为另一种数据类型。而 TRYCAST 是一种安全的类型转换方式，它在转换可能发生错误时不会抛出异常，而是返回 SQL NULL 值。"
}
---

## 介绍

CAST 表达式用于将一种数据类型的值转换为另一种数据类型。而 TRY_CAST 是一种安全的类型转换方式，它在转换可能发生错误时不会抛出异常，而是返回 SQL NULL 值。

## 语法

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## 参数

- source_expr
  - 任意受支持的数据类型表达式，作为待转换的源值。
- target_data_type
  - 目标数据类型。如果该类型支持额外属性（例如 DECIMAL(p, s) 的精度与小数位数），可以一并指定。

## 严格模式

在 Doris 4.0 之前，Doris 的 CAST 行为参考了 MySQL 等数据库系统，会尽可能避免 CAST 操作报错。例如，在 MySQL 中执行以下 SQL：

```sql
select cast('abc' as signed);
```

会得到结果：
```
0
```

从 Doris 4.0 开始，我们采用了更严谨的方式，参考 PostgreSQL 的做法：当遇到不合法的转换时，直接报错而不是生成可能令人困惑的结果。

Doris 4.0 引入了新变量 `enable_strict_cast`，可以通过以下命令开启严格模式的 CAST：

```sql
set enable_strict_cast = true;
```

在严格模式下，非法的 CAST 会直接报错：

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

严格模式的优势在于：
1. 避免用户在 CAST 时产生非预期的值
2. 系统可以假设所有数据都能顺利完成类型转换（不合法的数据会直接报错），从而在计算时实现更好的优化

## 示例

### 正常的 CAST 转换

```sql
select cast('123' as int);
```

```text
+--------------------+
| cast('123' as int) |
+--------------------+
|                123 |
+--------------------+
```

### 使用 TRY_CAST 处理可能失败的转换

当转换可能失败时，使用 TRY_CAST 可以避免查询报错，而是返回 NULL：

```sql
select try_cast('abc' as int);
```

```text
+------------------------+
| try_cast('abc' as int) |
+------------------------+
|                   NULL |
+------------------------+
```

## 行为说明

下面按照目标数据类型（target_data_type）对 CAST 的行为进行详细分类：

- [转换为 ARRAY](./array-conversion.md)
- [转换为 BOOLEAN](./boolean-conversion.md)
- [转换为 DATE](./date-conversion.md)
- [转换为 TIME](./time-conversion.md)
- [转换为 DATETIME](./datetime-conversion.md)
- [转换为 TIMESTAMPTZ](./timestamptz-conversion.md)
- [转换为整数（INT 等）](./int-conversion.md)
- [转换为浮点（FLOAT/DOUBLE）](./float-double-conversion.md)
- [转换为 DECIMAL](./decimal-conversion.md)
- [转换为 JSON / 从 JSON 转换到其他类型](./json-conversion.md)
- [转换为 MAP](./map-conversion.md)
- [转换为 STRUCT](./struct-conversion.md)
- [转换为 IP](./ip-conversion.md)

## 隐式 CAST

某些函数可能会触发隐式 CAST（类型转换），这在特定情况下可能导致非预期的行为。您可以通过 EXPLAIN 语句来检查是否发生了隐式 CAST：

```sql
explain select length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

从上述执行计划可以看到，系统自动将整数 123 转换为字符串类型，这就是一个隐式 CAST 的例子。
