---
{
    "title": "WINDOW-FUNCTION-ROW_NUMBER",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION ROW_NUMBER
## 描述

为每个 Partition 的每一行返回一个从1开始连续递增的整数。与 RANK() 和 DENSE_RANK() 不同的是，ROW_NUMBER() 返回的值不会重复也不会出现空缺，是连续递增的。

```sql
ROW_NUMBER() OVER(partition_by_clause order_by_clause)
```

## 举例

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;

| x | y    | rank     |
|---|------|----------|
| 1 | 1    | 1        |
| 1 | 2    | 2        |
| 1 | 2    | 3        |
| 2 | 1    | 1        |
| 2 | 2    | 2        |
| 2 | 3    | 3        |
| 3 | 1    | 1        |
| 3 | 1    | 2        |
| 3 | 2    | 3        |
```

### keywords

    WINDOW,FUNCTION,ROW_NUMBER