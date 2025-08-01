---
{
    "title": "ANY_VALUE",
    "language": "zh-CN"
}
---

## 描述

返回分组中表达式或列的任意一个值。如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。

## 别名

- ANY

## 语法

```sql
ANY_VALUE(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |

## 返回值

如果存在非 NULL 值，返回任意非 NULL 值，否则返回 NULL。
返回值的类型与输入的 expr 类型一致。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        k2 varchar(100)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple'),
    (1, 'banana'),
    (2, 'orange'),
    (2, null),
    (3, null);
```

```sql
select k1, any_value(k2) from t1 group by k1;
```

对于每个分组，返回任意一个非 NULL 值。对于 k1=1 的分组，可能返回 'apple' 或 'banana'。

```text
+------+---------------+
| k1   | any_value(k2) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```


```sql
select any_value(k2) from t1 where k1 = 3;
```

当组内所有值都为 NULL 时，返回 NULL。

```text
+---------------+
| any_value(k2) |
+---------------+
|          NULL |
+---------------+
```

```sql
select k1, any(k2) from t1 group by k1;
```

使用别名 ANY 的效果与 ANY_VALUE 相同。

```text
+------+--------+
| k1   | any(k2) |
+------+--------+
|    1 | apple  |
|    2 | orange |
|    3 | NULL   |
+------+--------+
```
