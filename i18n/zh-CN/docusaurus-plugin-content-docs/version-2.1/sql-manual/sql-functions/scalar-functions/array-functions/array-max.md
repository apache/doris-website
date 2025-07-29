---
{
    "title": "ARRAY_MAX",
    "language": "zh-CN"
}
---

## 描述

返回数组中最大的元素，数组中的`NULL`值会被跳过。空数组以及元素全为`NULL`值的数组，结果返回`NULL`值。

## 语法
```sql
ARRAY_MAX(<arr>)
```
## 参数

| 参数 | 说明 | 
| --- | --- |
| `<arr>` | ARRAY 数组 |

## 返回值

返回数组中最大的元素，特殊情况：
- 数组中的`NULL`值会被跳过。
- 空数组以及元素全为`NULL`值的数组，结果返回`NULL`值。

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
select k2, array_max(k2) from array_type_table;
```
```text
+--------------+-----------------+
| k2           | array_max(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               3 |
| [1, NULL, 3] |               3 |
+--------------+-----------------+
```

