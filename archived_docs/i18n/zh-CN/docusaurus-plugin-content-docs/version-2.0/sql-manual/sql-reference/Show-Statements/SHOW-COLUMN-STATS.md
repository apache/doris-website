---
{
    "title": "SHOW-COLUMN-STATS",
    "language": "zh-CN"
}
---

## SHOW-COLUMN-STATS

### Name

SHOW COLUMN STATS

## 描述

通过 `SHOW COLUMN STATS` 来查看列的各项统计数据。

语法如下：

```SQL
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

其中：

- cached: 展示当前 FE 内存缓存中的统计信息。
- table_name: 收集统计信息的目标表。可以是  `db_name.table_name`  形式。
- column_name: 指定的目标列，必须是  `table_name`  中存在的列，多个列名称用逗号分隔。

下面是一个例子：

```sql
mysql> show column stats lineitem(l_tax)\G;
*************************** 1. row ***************************
  column_name: l_tax
        count: 6001215.0
          ndv: 9.0
     num_null: 0.0
    data_size: 4.800972E7
avg_size_byte: 8.0
          min: 0.00
          max: 0.08
       method: FULL
         type: FUNDAMENTALS
      trigger: MANUAL
  query_times: 0
 updated_time: 2023-11-07 11:00:46

```

### Keywords

SHOW, COLUMN, STATS
