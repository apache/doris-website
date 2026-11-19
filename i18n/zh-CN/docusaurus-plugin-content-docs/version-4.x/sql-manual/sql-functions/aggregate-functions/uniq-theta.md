---
{
    "title": "UNIQ_THETA",
    "language": "zh-CN",
    "description": "返回非 NULL 的不同元素的近似数量，基于 Apache DataSketches Theta Sketch 实现。"
}
---

## 描述

返回非 NULL 的不同元素的近似数量。

该函数基于 [Apache DataSketches](https://datasketches.apache.org/docs/Theta/ThetaSketches.html) 的 Theta Sketch 实现。与基于 HyperLogLog 的 [APPROX_COUNT_DISTINCT](./approx-count-distinct) 相比，Theta Sketch 产生的中间状态是可合并的，并且支持集合运算（并集 / 交集 / 差集），因此适合把明细数据预聚合为 sketch，之后再跨分区、跨维度或跨时间窗口合并。它采用 KMV 算法，在默认 4096 nominal entries 下相对误差为 3.125%（95% 置信度）；在小基数时结果是精确的。

## 语法

```sql
UNIQ_THETA(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 用于计算的表达式。支持的类型包括 String、Date、DateTime、Timestamptz、IPv4、IPv6、TinyInt、Bool、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal。|

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
-- 建表并写入数据
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
```

```sql
select uniq_theta(k_string) from t1;
```

String 类型：计算所有 k_string 值的近似去重数量，NULL 值不计入。

```text
+----------------------+
| uniq_theta(k_string) |
+----------------------+
|                    4 |
+----------------------+
```

```sql
select uniq_theta(k_tinyint) from t1;
```

TinyInt 类型：计算所有 k_tinyint 值的近似去重数量。

```text
+-----------------------+
| uniq_theta(k_tinyint) |
+-----------------------+
|                     5 |
+-----------------------+
```

```sql
select k1, uniq_theta(k_string) from t1 group by k1 order by k1;
```

按 k1 分组，计算每组内 k_string 的近似去重数量。当组内记录全为 NULL 时返回 0。

```text
+------+----------------------+
| k1   | uniq_theta(k_string) |
+------+----------------------+
|    1 |                    2 |
|    2 |                    2 |
|    3 |                    0 |
+------+----------------------+
```

```sql
select uniq_theta(k_string) from t1 where k1 = 999;
```

当查询结果为空时返回 0。

```text
+----------------------+
| uniq_theta(k_string) |
+----------------------+
|                    0 |
+----------------------+
```

### 可合并的 sketch 中间状态

由于 `uniq_theta` 是作为普通聚合函数注册的，通用的 `agg_state` 组合子 `uniq_theta_state` / `uniq_theta_merge` / `uniq_theta_union` 会自动可用。这样即可预计算 sketch，之后再合并或求并集，而无需重新扫描明细数据。

```sql
set enable_agg_state = true;

-- uniq_theta_merge(uniq_theta_state(...)) 与直接 uniq_theta 结果一致
select uniq_theta_merge(uniq_theta_state(k_string)) from t1;
```

```text
+----------------------------------------------+
| uniq_theta_merge(uniq_theta_state(k_string)) |
+----------------------------------------------+
|                                            4 |
+----------------------------------------------+
```

```sql
-- 将每个 key 的 sketch 持久化到聚合表，之后再合并 / 求并集
create table theta_agg(
        k1 int,
        s agg_state<uniq_theta(varchar(100))> generic
)
aggregate key(k1)
distributed by hash(k1) buckets 1
properties ("replication_num"="1");

insert into theta_agg values
    (1, uniq_theta_state(cast('apple' as varchar(100)))),
    (1, uniq_theta_state(cast('banana' as varchar(100)))),
    (2, uniq_theta_state(cast('orange' as varchar(100))));

-- 每个 key 的基数
select k1, uniq_theta_merge(s) from theta_agg group by k1 order by k1;
```

```text
+------+---------------------+
| k1   | uniq_theta_merge(s) |
+------+---------------------+
|    1 |                   2 |
|    2 |                   1 |
+------+---------------------+
```

```sql
-- 跨 key 求并集，再 merge 得到全局基数
select uniq_theta_merge(u) from
    (select uniq_theta_union(s) as u from theta_agg group by k1) t;
```

```text
+---------------------+
| uniq_theta_merge(u) |
+---------------------+
|                   3 |
+---------------------+
```
