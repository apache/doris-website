---
{
    "title": "ARRAY_DISTINCT",
    "language": "zh-CN"
}
---

## 描述
返回去除了重复元素的数组，如果输入数组为 NULL，则返回 NULL。

## 语法
```sql
ARRAY_DISTINCT(<arr> )
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | 可能包含要删除的重复元素的数组 |

## 返回值
返回去除了重复元素的数组。特殊情况：
- 如果输入数组为 NULL，则返回 NULL。

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
(7, [1, 2, 3, NULL, NULL]);
select k1, k2, array_distinct(k2) from array_test;
```
```text
+------+-----------------------------+---------------------------+
| k1   | k2                          | array_distinct(k2)        |
+------+-----------------------------+---------------------------+
| 1    | [1, 2, 3, 4, 5]             | [1, 2, 3, 4, 5]           |
| 2    | [6, 7, 8]                   | [6, 7, 8]                 |
| 3    | []                          | []                        |
| 4    | NULL                        | NULL                      |
| 5    | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [1, 2, 3, 4, 5]           |
| 6    | [1, 2, 3, NULL]             | [1, 2, 3, NULL]           |
| 7    | [1, 2, 3, NULL, NULL]       | [1, 2, 3, NULL]           |
+------+-----------------------------+---------------------------+
```
```sql
CREATE TABLE array_test01 (
   k1 INT,
   k2 ARRAY<VARCHAR>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test01 VALUES
(1, ['a', 'b', 'c', 'd', 'e']),
(2, ['f', 'g', 'h']),
(3, ['']),
(3, [NULL]),
(5, ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c']),
(6, NULL),
(7, ['a', 'b', NULL]),
(8, ['a', 'b', NULL, NULL]);
select k1, k2, array_distinct(k2) from array_test01;
```
```text
+------+------------------------------------------+---------------------------+
| k1   | k2                                       | array_distinct(`k2`)      |
+------+------------------------------------------+---------------------------+
| 1    | ['a', 'b', 'c', 'd', 'e']                | ['a', 'b', 'c', 'd', 'e'] |
| 2    | ['f', 'g', 'h']                          | ['f', 'g', 'h']           |
| 3    | ['']                                     | ['']                      |
| 3    | [NULL]                                   | [NULL]                    |
| 5    | ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c'] | ['a', 'b', 'c', 'd', 'e'] |
| 6    | NULL                                     | NULL                      |
| 7    | ['a', 'b', NULL]                         | ['a', 'b', NULL]          |
| 8    | ['a', 'b', NULL, NULL]                   | ['a', 'b', NULL]          |
+------+------------------------------------------+---------------------------+
```
