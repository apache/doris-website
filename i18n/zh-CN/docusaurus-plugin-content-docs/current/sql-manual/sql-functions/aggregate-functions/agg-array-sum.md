---
{
"title": "AGG_ARRAY_SUM",
"language": "zh-CN"
}
---

## 描述

计算输入数组每一位置元素和，返回一个新的数组

## 语法 

```sql
AGG_ARRAY_SUM(<expr>)
```

## 参数

| 参数 | 说明                                          |
| -- |---------------------------------------------|
| `<expr>` | 需要求和的表达式，元素类型为Numerical的Array。 |

## 返回值

返回一个包含数组每个位置元素和的新数组。
如果组内没有合法数据，则返回空数组。

## 举例

```sql
-- setup
CREATE TABLE agg_array_sum_test (
                                    `group_id` bigint(20) NOT NULL,
                                    `array_column` array<bigint(20)> NULL
) ENGINE=OLAP
duplicate KEY(`group_id`)
DISTRIBUTED BY HASH(`group_id`) BUCKETS 2
PROPERTIES (
        "replication_allocation" = "tag.location.default: 1",
        "in_memory" = "false"
        );
insert into agg_array_sum_test values (1,[1,2,3]),(1,[4,5,6]),(2,[10,20]), (2,[40,50,60]), (2, NULL), (3,[30, 50]), (3,[20, null]), (4, null);
```

```sql
select group_id, agg_array_sum(array_column) as sum_array from agg_array_sum_test group by group_id;
```

```text
+----------+--------------+
| group_id | sum_array    |
+----------+--------------+
|        2 | [50, 70, 60] |
|        3 | [50, 50]     |
|        1 | [5, 7, 9]    |
|        4 | []           |
+----------+--------------+
```

```sql
select agg_array_sum(array_column) as sum_array from agg_array_sum_test where array_column is null;
```

```text
+-----------+
| sum_array |
+-----------+
| []        |
+-----------+
```
