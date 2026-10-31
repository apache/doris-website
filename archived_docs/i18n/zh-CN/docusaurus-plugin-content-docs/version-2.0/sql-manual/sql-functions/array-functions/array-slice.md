---
{
    "title": "ARRAY_SLICE",
    "language": "zh-CN"
}
---

## array_slice

array_slice

## 描述

## 语法

`ARRAY<T> array_slice(ARRAY<T> arr, BIGINT off, BIGINT len)`

返回一个子数组，包含所有从指定位置开始的指定长度的元素，如果输入参数为NULL，则返回NULL

```
如果off是正数，则表示从左侧开始的偏移量
如果off是负数，则表示从右侧开始的偏移量
当指定的off不在数组的实际范围内，返回空数组
如果len是负数，则表示长度为0
```

## 举例


```
mysql> select k2, k2[2:2] from array_type_table_nullable;
+-----------------+-------------------------+
| k2              | array_slice(`k2`, 2, 2) |
+-----------------+-------------------------+
| [1, 2, 3]       | [2, 3]                  |
| [1, NULL, 3]    | [NULL, 3]               |
| [2, 3]          | [3]                     |
| NULL            | NULL                    |
+-----------------+-------------------------+

mysql> select k2, array_slice(k2, 2, 2) from array_type_table_nullable;
+-----------------+-------------------------+
| k2              | array_slice(`k2`, 2, 2) |
+-----------------+-------------------------+
| [1, 2, 3]       | [2, 3]                  |
| [1, NULL, 3]    | [NULL, 3]               |
| [2, 3]          | [3]                     |
| NULL            | NULL                    |
+-----------------+-------------------------+

mysql> select k2, k2[2:2] from array_type_table_nullable_varchar;
+----------------------------+-------------------------+
| k2                         | array_slice(`k2`, 2, 2) |
+----------------------------+-------------------------+
| ['hello', 'world', 'c++']  | ['world', 'c++']        |
| ['a1', 'equals', 'b1']     | ['equals', 'b1']        |
| ['hasnull', NULL, 'value'] | [NULL, 'value']         |
| ['hasnull', NULL, 'value'] | [NULL, 'value']         |
+----------------------------+-------------------------+

mysql> select k2, array_slice(k2, 2, 2) from array_type_table_nullable_varchar;
+----------------------------+-------------------------+
| k2                         | array_slice(`k2`, 2, 2) |
+----------------------------+-------------------------+
| ['hello', 'world', 'c++']  | ['world', 'c++']        |
| ['a1', 'equals', 'b1']     | ['equals', 'b1']        |
| ['hasnull', NULL, 'value'] | [NULL, 'value']         |
| ['hasnull', NULL, 'value'] | [NULL, 'value']         |
+----------------------------+-------------------------+
```

当指定off为负数:

```
mysql> select k2, k2[-2:1] from array_type_table_nullable;
+-----------+--------------------------+
| k2        | array_slice(`k2`, -2, 1) |
+-----------+--------------------------+
| [1, 2, 3] | [2]                      |
| [1, 2, 3] | [2]                      |
| [2, 3]    | [2]                      |
| [2, 3]    | [2]                      |
+-----------+--------------------------+

mysql> select k2, array_slice(k2, -2, 1) from array_type_table_nullable;
+-----------+--------------------------+
| k2        | array_slice(`k2`, -2, 1) |
+-----------+--------------------------+
| [1, 2, 3] | [2]                      |
| [1, 2, 3] | [2]                      |
| [2, 3]    | [2]                      |
| [2, 3]    | [2]                      |
+-----------+--------------------------+

mysql> select k2, k2[-2:2] from array_type_table_nullable_varchar;
+----------------------------+--------------------------+
| k2                         | array_slice(`k2`, -2, 2) |
+----------------------------+--------------------------+
| ['hello', 'world', 'c++']  | ['world', 'c++']         |
| ['a1', 'equals', 'b1']     | ['equals', 'b1']         |
| ['hasnull', NULL, 'value'] | [NULL, 'value']          |
| ['hasnull', NULL, 'value'] | [NULL, 'value']          |
+----------------------------+--------------------------+

mysql> select k2, array_slice(k2, -2, 2) from array_type_table_nullable_varchar;
+----------------------------+--------------------------+
| k2                         | array_slice(`k2`, -2, 2) |
+----------------------------+--------------------------+
| ['hello', 'world', 'c++']  | ['world', 'c++']         |
| ['a1', 'equals', 'b1']     | ['equals', 'b1']         |
| ['hasnull', NULL, 'value'] | [NULL, 'value']          |
| ['hasnull', NULL, 'value'] | [NULL, 'value']          |
+----------------------------+--------------------------+
```

```
mysql> select k2, array_slice(k2, 0) from array_type_table;
+-----------+-------------------------+
| k2        | array_slice(`k2`, 0) |
+-----------+-------------------------+
| [1, 2, 3] | []                      |
+-----------+-------------------------+

mysql> select k2, array_slice(k2, -5) from array_type_table;
+-----------+----------------------+
| k2        | array_slice(`k2`, -5) |
+-----------+----------------------+
| [1, 2, 3] | []                   |
+-----------+----------------------+
```

### keywords

ARRAY,SLICE,ARRAY_SLICE