---
{
    "title": "HLL_RAW_AGG",
    "language": "zh-CN",
    "description": "HLLRAWAGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并成一个。"
}
---

## 描述

HLL_RAW_AGG 函数是一种聚合函数，主要用于将多个 HyperLogLog 数据结构合并成一个。

## 别名

- HLL_UNION

## 语法

```sql
HLL_RAW_AGG(<hll>)
HLL_UNION(<hll>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<hll>` | 需要被计算的表达式，支持类型为 HLL 。 |

## 返回值

返回被聚合后的 HLL 类型。
如果组内没有合法数据则返回 HLL_EMPTY ;

## 举例

```sql
-- setup
create table test_uv(
    id int,
    uv_set string
) distributed by hash(id) buckets 1
properties ("replication_num"="1");
insert into test_uv values
    (1, ('a')),
    (1, ('b')),
    (2, ('c')),
    (2, ('d')),
    (3, null);
```


```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              4 |
+------------------------------------------------+
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv where uv_set is null;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              0 |
+------------------------------------------------+
```
