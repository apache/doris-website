---
{
    "title": "DENSE_RANK",
    "language": "zh-CN",
    "description": "DENSERANK() 是一种窗口函数，用于计算分组内值的排名，与 RANK() 不同的是，DENSERANK() 返回的排名是连续的，不会出现空缺数字。排名值从 1 开始按顺序递增，如果出现相同的值，它们将具有相同的排名。 如果未显示指定窗口，"
}
---

## 描述

DENSE_RANK() 是一种窗口函数，用于计算分组内值的排名，与 RANK() 不同的是，DENSE_RANK() 返回的排名是连续的，不会出现空缺数字。排名值从 1 开始按顺序递增，如果出现相同的值，它们将具有相同的排名。
如果未显示指定窗口，会隐式生成`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` 类型，且当前仅支持此类。

## 语法

```sql
DENSE_RANK()
```

## 返回值

返回 BIGINT 类型的排名值，从 1 开始。

## 举例

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 2    | -- 相同值具有相同排名 |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    | -- 排名连续，没有空缺 |
| 3   | 1   | 1    |
| 3   | 1   | 1    |
| 3   | 2   | 2    |
+-----+-----+------+
```