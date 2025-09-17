---
{
    "title": "CAST 表达式",
    "language": "zh-CN"
}
---

CAST 用于将一个数据类型的值转换为另一个数据类型。

## 语法

```sql
CAST( <source_expr> AS <target_data_type> )
```

## 参数

- source_expr
  - 任意受支持的数据类型表达式，作为待转换的源值。
- target_data_type
  - 目标数据类型。如果该类型支持额外属性（例如 DECIMAL(p, s) 的精度与小数位），可一并指定。

## 示例

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

## 行为说明

我们按 <target_data_type> 对 CAST 的行为进行分类：

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

某些函数可能会触发隐式 CAST，在特定情况下可能导致非预期行为。
可通过 EXPLAIN 语句判断是否发生了隐式 CAST：

```sql
explain select length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

可以看到执行计划中包含一次 CAST。
