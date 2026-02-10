---
{
    "title": "ARRAY_CUM_SUM",
    "language": "zh-CN",
    "description": "返回数组的累计和。数组中的NULL值会被跳过，并在结果数组的相同位置设置NULL。"
}
---

## 描述

返回数组的累计和。数组中的`NULL`值会被跳过，并在结果数组的相同位置设置`NULL`。

## 语法
```sql
ARRAY_CUM_SUM(<arr>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | 用于计算累加和的数组 |

## 返回值
返回一个数组。特殊情况：
- 数组中的`NULL`值会被跳过，并在结果数组的相同位置设置`NULL`。

## 举例

```sql
create table array_type_table(
    k1 INT, 
    k2 Array<int>
) 
duplicate key (k1) 
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
);
insert into array_type_table values (0, []), 
(1, [NULL]), 
(2, [1, 2, 3, 4]), 
(3, [1, NULL, 3, NULL, 5]);
select k2, array_cum_sum(k2) from array_type_table;
```
```text
+-----------------------+-----------------------+
| k2                    | array_cum_sum(`k2`)   |
+-----------------------+-----------------------+
| []                    | []                    |
| [NULL]                | [NULL]                |
| [1, 2, 3, 4]          | [1, 3, 6, 10]         |
| [1, NULL, 3, NULL, 5] | [1, NULL, 4, NULL, 9] |
+-----------------------+-----------------------+
```
