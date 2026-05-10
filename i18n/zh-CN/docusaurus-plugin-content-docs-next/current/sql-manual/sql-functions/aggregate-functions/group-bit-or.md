---
{
    "title": "GROUP_BIT_OR",
    "language": "zh-CN",
    "description": "对单个整数列或表达式中的所有值执行按位 or 运算。"
}
---

## 描述

对单个整数列或表达式中的所有值执行按位 or 运算。

## 语法

```sql
GROUP_BIT_OR(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持类型为 TinyInt，SmallInt，Integer，BigInt，LargeInt。 |

## 返回值

返回一个整数值，类型与 <expr> 相同。如果所有值均为 NULL，则返回 NULL。NULL 值不参与按位运算。

## 举例

```sql
-- setup
create table group_bit(
    value int
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into group_bit values
    (3),
    (1),
    (2),
    (4),
    (NULL);
```

```sql
select group_bit_or(value) from group_bit;
```

```text
+---------------------+
| group_bit_or(value) |
+---------------------+
|                   7 |
+---------------------+
```

```sql
select group_bit_or(value) from group_bit where value is null;
```

```text
+---------------------+
| group_bit_or(value) |
+---------------------+
|                NULL |
+---------------------+
```
