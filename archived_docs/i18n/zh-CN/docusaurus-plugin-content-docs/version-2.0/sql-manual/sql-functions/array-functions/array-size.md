---
{
    "title": "ARRAY_SIZE",
    "language": "zh-CN"
}
---

## array_size (size, cardinality)
array_size (size, cardinality)
## 描述

## 语法

```sql
BIGINT size(ARRAY<T> arr)
BIGINT array_size(ARRAY<T> arr) 
BIGINT cardinality(ARRAY<T> arr)
```

返回数组中元素数量，如果输入数组为NULL，则返回NULL

## 举例

```
mysql> select k1,k2,size(k2) from array_test;
+------+-----------+------------+
| k1   | k2        | size(`k2`) |
+------+-----------+------------+
|    1 | [1, 2, 3] |          3 |
|    2 | []        |          0 |
|    3 | NULL      |       NULL |
+------+-----------+------------+

mysql> select k1,k2,array_size(k2) from array_test;
+------+-----------+------------------+
| k1   | k2        | array_size(`k2`) |
+------+-----------+------------------+
|    1 | [1, 2, 3] |                3 |
|    2 | []        |                0 |
|    3 | NULL      |             NULL |
+------+-----------+------------------+

mysql> select k1,k2,cardinality(k2) from array_test;
+------+-----------+-------------------+
| k1   | k2        | cardinality(`k2`) |
+------+-----------+-------------------+
|    1 | [1, 2, 3] |                 3 |
|    2 | []        |                 0 |
|    3 | NULL      |              NULL |
+------+-----------+-------------------+
```

### keywords

ARRAY_SIZE, SIZE, CARDINALITY
