---
{
    "title": "COLLECT_SET",
    "language": "zh-CN",
    "description": "聚合函数，聚合指定列的所有唯一值，去除重复的元素，并返回一个集合类型的结果。"
}
---

## 描述

聚合函数，聚合指定列的所有唯一值，去除重复的元素，并返回一个集合类型的结果。

## 别名

- GROUP_UNIQ_ARRAY

## 语法

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |
| `<max_size>` | 可选参数，通过设置该参数能够将结果数组的大小限制为 max_size 个元素 |

## 返回值

返回类型是 ARRAY，该数组包含去重后的所有值，特殊情况：

- 如果值为 NULL，则会过滤

返回数组中元素的顺序不保证。可使用 `array_sort` 对结果排序，但指定 `max_size` 时，保留哪些元素仍不保证。以下结果展示一种可能的输出；对结果排序不会固定截取的元素。

## 举例

```sql
-- 建表并插入测试数据
CREATE TABLE collect_set_test (
	k1 INT,
	k2 DATE,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES
(1, '2023-01-01', 'hello'),
(2, '2023-01-01', NULL),
(2, '2023-01-02', 'hello'),
(3, NULL, 'world'),
(3, '2023-01-02', 'hello'),
(4, '2023-01-02', 'doris'),
(4, '2023-01-03', 'sql');
```

```sql
select k1,k2,k3 from collect_set_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-01 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | doris |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select array_sort(collect_set(k1)),array_sort(collect_set(k1,2)) from collect_set_test;
```

```text
+-------------------------------+---------------------------------+
| array_sort(collect_set(`k1`)) | array_sort(collect_set(`k1`,2)) |
+-------------------------------+---------------------------------+
| [1, 2, 3, 4]                  | [1, 2]                          |
+-------------------------------+---------------------------------+
```

```sql
select k1,array_sort(collect_set(k2)),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+----+-------------------------------+---------------------+
| k1 | array_sort(collect_set(`k2`)) | collect_set(`k3`,1) |
+----+-------------------------------+---------------------+
| 1  | ["2023-01-01"]                | ["hello"]           |
| 2  | ["2023-01-01", "2023-01-02"]  | ["hello"]           |
| 3  | ["2023-01-02"]                | ["world"]           |
| 4  | ["2023-01-02", "2023-01-03"]  | ["sql"]             |
+----+-------------------------------+---------------------+
```

仅包含 NULL 的输入返回空数组：

```sql
SELECT COLLECT_SET(CAST(NULL AS INT)) AS result;
```

```text
+--------+
| result |
+--------+
| []     |
+--------+
```
