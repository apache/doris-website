---
{
    "title": "ARRAY_AVG",
    "language": "zh-CN"
}
---

## 描述

返回数组中所有元素的平均值，数组中的`NULL`值会被跳过。空数组以及元素全为`NULL`值的数组，结果返回`NULL`值。

## 语法
```sql
ARRAY_AVG(<arr>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | 用于计算平均值的数组 |

## 返回值
返回一个常量，特殊情况：
- 数组中的`NULL`值会被跳过。
- 数组的字符串会被跳过

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
insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3]), (3, [1, NULL, 3]);
select k2, array_avg(k2) from array_type_table;
```
```text
+--------------+-----------------+
| k2           | array_avg(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               2 |
| [1, NULL, 3] |               2 |
+--------------+-----------------+
```
```sql
select array_avg(['test',2,1,null]);
```
```text
+------------------------------------------------------------+
| array_avg(cast(['test', '2', '1', NULL] as ARRAY<DOUBLE>)) |
+------------------------------------------------------------+
|                                                        1.5 |
+------------------------------------------------------------+
```

