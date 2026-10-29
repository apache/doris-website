---
{
    "title": "COLLECT_LIST",
    "language": "zh-CN",
    "description": "聚合函数，用于将某一列的所有值聚集成一个数组"
}
---

## 描述

聚合函数，用于将某一列的所有值聚集成一个数组

## 别名

- GROUP_ARRAY

## 语法

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |
| `<max_size>` | 可选参数，通过设置该参数能够将结果数组的大小限制为 max_size 个元素 |

## 返回值

返回类型是 ARRAY，该数组包含所有值。特殊情况：

- 如果值为 NULL，则会过滤

返回数组中元素的顺序不保证。可使用 `array_sort` 对结果排序，但指定 `max_size` 时，保留哪些元素仍不保证。以下结果展示一种可能的输出；对结果排序不会固定截取的元素。

## 举例

```sql
-- 建表并插入测试数据
CREATE TABLE collect_list_test (
	k1 INT,
	k2 DATE,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_list_test VALUES
(1, '2023-01-01', 'hello'),
(2, '2023-01-02', NULL),
(2, '2023-01-02', 'hello'),
(3, NULL, 'world'),
(3, '2023-01-02', 'hello'),
(4, '2023-01-02', 'sql'),
(4, '2023-01-03', 'sql');
```

```sql
select k1,k2,k3 from collect_list_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-02 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | sql   |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```

```text
+-----------------------+----------------------+
| collect_list(`k1`)    | collect_list(`k1`,3) |
+-----------------------+----------------------+
| [1, 2, 2, 3, 3, 4, 4] | [1, 2, 2]            |
+-----------------------+----------------------+
```

```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```

```text
+----+------------------------------+----------------------+
| k1 | collect_list(`k2`)           | collect_list(`k3`,1) |
+----+------------------------------+----------------------+
| 1  | ["2023-01-01"]               | ["hello"]            |
| 2  | ["2023-01-02", "2023-01-02"] | ["hello"]            |
| 3  | ["2023-01-02"]               | ["world"]            |
| 4  | ["2023-01-02", "2023-01-03"] | ["sql"]              |
+----+------------------------------+----------------------+
```

仅包含 NULL 的输入返回空数组：

```sql
SELECT COLLECT_LIST(CAST(NULL AS INT)) AS result;
```

```text
+--------+
| result |
+--------+
| []     |
+--------+
```
