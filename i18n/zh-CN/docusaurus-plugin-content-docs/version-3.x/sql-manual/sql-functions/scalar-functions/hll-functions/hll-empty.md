---
{
    "title": "HLL_EMPTY",
    "language": "zh-CN",
    "description": "HLLEMPTY 用于返回一个 HLL（HyperLogLog）类型的空值，表示一个没有任何元素的数据集合。"
}
---

## 描述

`HLL_EMPTY` 用于返回一个 HLL（HyperLogLog）类型的空值，表示一个没有任何元素的数据集合。

## 语法

```sql
HLL_EMPTY()
```

## 返回值

返回一个 HLL 类型的空值，表示一个没有任何元素的数据集合。

## 举例

```sql
select hll_cardinality(hll_empty());
```

```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```