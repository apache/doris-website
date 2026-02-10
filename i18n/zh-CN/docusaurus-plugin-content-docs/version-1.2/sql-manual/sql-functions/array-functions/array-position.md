---
{
    "title": "ARRAY_POSITION",
    "language": "zh-CN"
}
---

## array_position

array_position

## 描述

## 语法

`BIGINT array_position(ARRAY<T> arr, T value)`

返回`value`在数组中第一次出现的位置/索引。

```
position - value在array中的位置（从1开始计算）；
0        - 如果value在array中不存在；
NULL     - 如果数组为NULL。
```

## 注意事项

`仅支持向量化引擎中使用`

## 举例

```
mysql> SELECT id,c_array,array_position(c_array, 5) FROM `array_test`;
+------+-----------------+------------------------------+
| id   | c_array         | array_position(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            5 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+

mysql> select array_position([1, null], null);
+--------------------------------------+
| array_position(ARRAY(1, NULL), NULL) |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
1 row in set (0.01 sec)
```

### keywords

ARRAY,POSITION,ARRAY_POSITION
