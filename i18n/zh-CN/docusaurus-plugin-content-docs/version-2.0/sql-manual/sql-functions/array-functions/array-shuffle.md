---
{
    "title": "ARRAY_SHUFFLE",
    "language": "zh-CN"
}
---

## array_shuffle

array_shuffle
shuffle

## 描述

## 语法

```sql
ARRAY<T> array_shuffle(ARRAY<T> array1, [INT seed])
ARRAY<T> shuffle(ARRAY<T> array1, [INT seed])
```

将数组中元素进行随机排列。其中，参数 array1 为要进行随机排列的数组，可选参数 seed 是设定伪随机数生成器用于生成伪随机数的初始数值。
shuffle 与 array_shuffle 功能相同。

```
array_shuffle(array1);
array_shuffle(array1, 0);
shuffle(array1);
shuffle(array1, 0);
```

## 举例

```sql

mysql [test]> select c_array1, array_shuffle(c_array1) from array_test; 
+-----------------------+---------------------------+
| c_array1              | array_shuffle(`c_array1`) |
+-----------------------+---------------------------+
| [1, 2, 3, 4, 5, NULL] | [2, NULL, 5, 3, 4, 1]     |
| [6, 7, 8, NULL]       | [7, NULL, 8, 6]           |
| [1, NULL]             | [1, NULL]                 |
| NULL                  | NULL                      |
+-----------------------+---------------------------+
4 rows in set (0.01 sec)

MySQL [test]> select c_array1, array_shuffle(c_array1, 0) from array_test; 
+-----------------------+------------------------------+
| c_array1              | array_shuffle(`c_array1`, 0) |
+-----------------------+------------------------------+
| [1, 2, 3, 4, 5, NULL] | [1, 3, 2, NULL, 4, 5]        |
| [6, 7, 8, NULL]       | [6, 8, 7, NULL]              |
| [1, NULL]             | [1, NULL]                    |
| NULL                  | NULL                         |
+-----------------------+------------------------------+
4 rows in set (0.01 sec)

```

### keywords

ARRAY,ARRAY_SHUFFLE,SHUFFLE
