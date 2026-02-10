---
{
    "title": "ROW_NUMBER",
    "language": "zh-CN",
    "description": "ROWNUMBER() 是一个窗口函数，用于为分区内的每一行分配一个唯一的序号。序号从 1 开始连续递增。与 RANK() 和 DENSERANK() 不同，ROWNUMBER() 即使对于相同的值也会分配不同的序号，确保每行都有唯一的编号。 如果未显示指定窗口，"
}
---

## 描述

ROW_NUMBER() 是一个窗口函数，用于为分区内的每一行分配一个唯一的序号。序号从 1 开始连续递增。与 RANK() 和 DENSE_RANK() 不同，ROW_NUMBER() 即使对于相同的值也会分配不同的序号，确保每行都有唯一的编号。
如果未显示指定窗口，会隐式生成`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` 类型，且当前仅支持此类。


## 语法

```sql
ROW_NUMBER()
```

## 返回值

返回 BIGINT 类型的序号，从 1 开始连续递增。在每个分区内，序号都是唯一的。

## 举例

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```
