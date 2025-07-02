---
{
    "title": "WINDOW_FUNCTION_DENSE_RANK",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION DENSE_RANK
## 描述

DENSE_RANK() 函数用来表示排名，与RANK()不同的是，DENSE_RANK() 不会出现空缺数字。比如，如果出现了两个并列的1，DENSE_RANK() 的第三个数仍然是2，而RANK()的第三个数是3。

```sql
DENSE_RANK() OVER(partition_by_clause order_by_clause)
```

## 举例

按照 property 列分组对x列排名：

```sql
 select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
 
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
 | 3  | 2    | 2        |
```

### keywords

    WINDOW,FUNCTION,DENSE_RANK
