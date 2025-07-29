---
{
"title": "AVG",
"language": "zh-CN"
}
---

## 描述

计算指定列或表达式的所有非 NULL 值的平均值。

## 语法

```sql
AVG([DISTINCT] <expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 是一个表达式或列，通常是一个数值列或者能够转换为数值的表达式 |
| `[DISTINCT]` | 是一个可选的关键字，表示对 expr 中的重复值进行去重后再计算平均值 |

## 返回值

返回所选列或表达式的平均值，如果组内的所有记录均为 NULL，则该函数返回 NULL 。
对于 Decimal 类型的输入，返回值类型为 Decimal 。其他数值类型的返回值为 Double 。

## 举例

```sql
-- setup
create table t1(
        k1 int,
        kd decimalv3(10, 5),
        kstr varchar(100),
        kstr_invalid varchar(100),
        knull int,
        kbigint bigint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222, '1.5', 'test', null, 100),
    (2, 444.444, '2.5', '1', null, 100),
    (3, null, '3.5', '2', null, 1);
```


```sql
select avg(k1) from t1;
```

[1,2,3]的平均值为2。

```text
+---------+
| avg(k1) |
+---------+
|       2 |
+---------+
```


```sql
select avg(kd) from t1;
```

[222.222,444.444,null]的平均值为333.333。

```text
+-----------+
| avg(kd)   |
+-----------+
| 333.33300 |
+-----------+
```

```sql
select avg(kstr) from t1;
```

输入的 Varchar 类型会被隐式转换为 Double。
[1.5,2.5,3.5]的平均值为2.5。

```text
+-----------+
| avg(kstr) |
+-----------+
|       2.5 |
+-----------+
```

```sql
select avg(kstr_invalid) from t1;
```

非法的字符串会在隐式转换中变成 NULL 值。
[null,1,2]的平均值为1.5。

```text
+-------------------+
| avg(kstr_invalid) |
+-------------------+
|               1.5 |
+-------------------+
```

```sql
select avg(knull) from t1;
```

对于输入数据均为 NULL 值的情况，返回 NULL 值。

```text
+------------+
| avg(knull) |
+------------+
|       NULL |
+------------+
```

```sql
select avg(distinct kbigint) from t1;
```

[100,100,1]去重之后为[100,1]，平均值为50.5。

```text
+-----------------------+
| avg(distinct kbigint) |
+-----------------------+
|                  50.5 |
+-----------------------+
```

