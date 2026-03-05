---
{
    "title": "ARRAY_JOIN",
    "language": "zh-CN",
    "description": "根据分隔符 (sep) 和替换 NULL 的字符串 (nullreplace), 将数组中的所有元素组合成一个新的字符串。"
}
---

## 描述

根据分隔符 (sep) 和替换 NULL 的字符串 (null_replace), 将数组中的所有元素组合成一个新的字符串。

## 语法

```sql
ARRAY_JOIN(<arr> , <sep> [, <null_replace>])
```
## 参数
| Parameter | Description |
|---|---|
| `<arr>`   | 需要 join 的数组 |
| `<sep>`   | 分隔符 |
| `<null_replace>`   | 替换 NULL 的字符串 |

## 返回值
返回一个新的字符串，特殊情况：
- 若 sep 为 NULL，则返回值为 NULL。
- 若 null_replace 为 NULL，则返回值也为 NULL。
- 若 sep 为空字符串，则不应用任何分隔符。
- 若 null_replace 为空字符串或者不指定，则直接丢弃数组中的 NULL 元素。

## 举例

```sql
CREATE TABLE array_test (
                            k1 INT,
                            k2 ARRAY<INT>
)
    duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);

INSERT INTO array_test VALUES
                           (1, [1, 2, 3, 4, 5]),
                           (2, [6, 7, 8]),
                           (3, []),
                           (4, NULL),
                           (5, [1, 2, 3, 4, 5, 4, 3, 2, 1]),
                           (6, [1, 2, 3, NULL]),
                           (7, [4, 5, 6, NULL, NULL]);
select k1, k2, array_join(k2, '_', 'null') from array_test order by k1;
```
```text
+------+-----------------------------+------------------------------------+
| k1   | k2                          | array_join(`k2`, '_', 'null')      |
+------+-----------------------------+------------------------------------+
|  1   | [1, 2, 3, 4, 5]             | 1_2_3_4_5                          |
|  2   | [6, 7, 8]                   | 6_7_8                              |
|  3   | []                          |                                    |
|  4   | NULL                        | NULL                               |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | 1_2_3_4_5_4_3_2_1                  |
|  6   | [1, 2, 3, NULL]             | 1_2_3_null                         |
|  7   | [4, 5, 6, NULL, NULL]       | 4_5_6_null_null                    |
+------+-----------------------------+------------------------------------+
```
```sql
select k1, k2, array_join(k2, '_') from array_test order by k1;
```
```text
+------+-----------------------------+----------------------------+
| k1   | k2                          | array_join(`k2`, '_')      |
+------+-----------------------------+----------------------------+
|  1   | [1, 2, 3, 4, 5]             | 1_2_3_4_5                  |
|  2   | [6, 7, 8]                   | 6_7_8                      |
|  3   | []                          |                            |
|  4   | NULL                        | NULL                       |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | 1_2_3_4_5_4_3_2_1          |
|  6   | [1, 2, 3, NULL]             | 1_2_3                      |
|  7   | [4, 5, 6, NULL, NULL]       | 4_5_6                      |
+------+-----------------------------+----------------------------+
```

```sql
CREATE TABLE array_test01 (
    k1 INT,
    k2 ARRAY<STRING>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);

INSERT INTO array_test01 VALUES
(1, ['a', 'b', 'c', 'd']),
(2, ['e', 'f', 'g', 'h']),
(3, [NULL, 'a', NULL, 'b', NULL, 'c']),
(4, ['d', 'e', NULL, ' ']),
(5, [' ', NULL, 'f', 'g']);
select k1, k2, array_join(k2, '_', 'null') from array_test01 order by k1;
```
```text
+------+-----------------------------------+------------------------------------+
| k1   | k2                                | array_join(`k2`, '_', 'null')      |
+------+-----------------------------------+------------------------------------+
|  1   | ['a', 'b', 'c', 'd']              | a_b_c_d                            |
|  2   | ['e', 'f', 'g', 'h']              | e_f_g_h                            |
|  3   | [NULL, 'a', NULL, 'b', NULL, 'c'] | null_a_null_b_null_c               |
|  4   | ['d', 'e', NULL, ' ']             | d_e_null_                          |
|  5   | [' ', NULL, 'f', 'g']             |  _null_f_g                         |
+------+-----------------------------------+------------------------------------+
```

```sql
select k1, k2, array_join(k2, '_') from array_test01 order by k1;
```
```text
+------+-----------------------------------+----------------------------+
| k1   | k2                                | array_join(`k2`, '_')      |
+------+-----------------------------------+----------------------------+
|  1   | ['a', 'b', 'c', 'd']              | a_b_c_d                    |
|  2   | ['e', 'f', 'g', 'h']              | e_f_g_h                    |
|  3   | [NULL, 'a', NULL, 'b', NULL, 'c'] | a_b_c                      |
|  4   | ['d', 'e', NULL, ' ']             | d_e_                       |
|  5   | [' ', NULL, 'f', 'g']             |  _f_g                      |
+------+-----------------------------------+----------------------------+
```

