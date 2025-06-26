---
{
    "title": "ARRAY_MIN",
    "language": "zh-CN"
}
---

## array_min

array_min

## 描述

## 语法
`T array_min(ARRAY<T> array1)`

返回数组中最小的元素，数组中的`NULL`值会被跳过。空数组以及元素全为`NULL`值的数组，结果返回`NULL`值。

## 举例

```shell
mysql> create table array_type_table(k1 INT, k2 Array<int>) duplicate key (k1)
    -> distributed by hash(k1) buckets 1 properties('replication_num' = '1');
mysql> insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3]), (3, [1, NULL, 3]);
mysql> select k2, array_min(k2) from array_type_table;
+--------------+-----------------+
| k2           | array_min(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               1 |
| [1, NULL, 3] |               1 |
+--------------+-----------------+
4 rows in set (0.02 sec)

```

### keywords

ARRAY,MIN,ARRAY_MIN

