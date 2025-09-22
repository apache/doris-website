---
{
    "title": "CAST 表达式",
    "language": "zh-CN"
}
---

CAST 用于将一个数据类型的值转换为另一个数据类型。
TRY_CAST 则是一种安全的类型转换方式，当转换可能发生错误时，它不会抛出异常，而是返回一个 SQL 的 NULL 值。

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

## 示例

正常的 CAST 转换：

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

在严格模式下，一些不合法的 CAST 转换可能会报错：

```sql
select cast('abc' as int);
```

```text
[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

此时可以使用 TRY_CAST 来避免错误，将转换失败的结果转换为 NULL 值：

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

我们按照目标数据类型（target_data_type）对 CAST 的行为进行分类：

- [转换为 ARRAY](./array-conversion.md)
- [转换为 BOOLEAN](./boolean-conversion.md)
- [转换为 DATE](./date-conversion.md)
- [转换为 TIME](./time-conversion.md)
- [转换为 DATETIME](./datetime-conversion.md)
- [转换为整数（INT 等）](./int-conversion.md)
- [转换为浮点（FLOAT/DOUBLE）](./float-double-conversion.md)
- [转换为 DECIMAL](./decimal-conversion.md)
- [转换为 JSON / 从 JSON 转换到其他类型](./json-conversion.md)
- [转换为 MAP](./map-conversion.md)
- [转换为 STRUCT](./struct-conversion.md)
- [转换为 IP](./ip-conversion.md)

## 隐式 CAST

某些函数可能会触发隐式 CAST（类型转换），在特定情况下这可能导致非预期的行为。
您可以通过 EXPLAIN 语句来判断是否发生了隐式 CAST：

```sql
explain select length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

从上述执行计划中可以看到，系统自动进行了一次 CAST 转换，将整数 123 转换为字符串类型。
