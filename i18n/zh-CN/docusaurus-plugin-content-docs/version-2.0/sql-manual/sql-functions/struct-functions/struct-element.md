---
{
    "title": "STRUCT_ELEMENT",
    "language": "zh-CN"
}
---

## struct_element

struct_element

## 描述

返回 struct 数据列内的某一 field

## 语法

```
struct_element(struct, n/s)
```

## 参数

```
struct - 输入的struct列，如果是null，则返回null
n - field的位置，起始位置从1开始，仅支持常量
s - field的名字，仅支持常量
```

## 返回值

返回指定的 field 列，类型为任意类型

## 举例

```
mysql> select struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2');
+--------------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2') |
+--------------------------------------------------------+
| a                                                      |
+--------------------------------------------------------+
1 row in set (0.03 sec)

mysql> select struct_element(named_struct('f1', 1, 'f2', 'a'), 1);
+-----------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 1) |
+-----------------------------------------------------+
|                                                   1 |
+-----------------------------------------------------+
1 row in set (0.02 sec)

mysql> select struct_col, struct_element(struct_col, 'f1') from test_struct;
+-------------------------------------------------+-------------------------------------+
| struct_col                                      | struct_element(`struct_col `, 'f1') |
+-------------------------------------------------+-------------------------------------+
| {1, 2, 3, 4, 5}                                 |                                   1 |
| {1, 1000, 10000000, 100000000000, 100000000000} |                                   1 |
| {5, 4, 3, 2, 1}                                 |                                   5 |
| NULL                                            |                                NULL |
| {1, NULL, 3, NULL, 5}                           |                                   1 |
+-------------------------------------------------+-------------------------------------+
9 rows in set (0.01 sec)
```

### keywords

STRUCT, ELEMENT, STRUCT_ELEMENT