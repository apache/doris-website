---
{
    "title": "WINDOW-FUNCTION-RANK",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION RANK
## 描述

RANK() 函数用来表示排名，与 DENSE_RANK() 不同的是，RANK() 会出现空缺数字。比如，如果出现了两个并列的1， RANK() 的第三个数就是3，而不是2。

```sql
RANK() OVER(partition_by_clause order_by_clause)
```

## 举例

根据 x 进行排名

```sql
select x, y, rank() over(partition by x order by y) as rank from int_t;

| x  | y    | rank     |
|----|------|----------|
| 1  | 1    | 1        |
| 1  | 2    | 2        |
| 1  | 2    | 2        |
| 2  | 1    | 1        |
| 2  | 2    | 2        |
| 2  | 3    | 3        |
| 3  | 1    | 1        |
| 3  | 1    | 1        |
| 3  | 2    | 3        |
```

### keywords

    WINDOW,FUNCTION,RANK