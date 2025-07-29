---
{
    "title": "ARRAY_CONCAT",
    "language": "zh-CN"
}
---

## 描述

将输入的所有数组拼接为一个数组

## 语法
```sql
ARRAY_CONCAT(<arr1> [,<arr2> , ...])
```

## 参数
| 参数 | 说明      |
|---|---|
| `<arr1>` | 源数组 |
| `<arr2>` | 要添加到 arr1 的数组 |

## 返回值

拼接好的数组，特殊情况：
- 如果数组是 NULL（非[NULL]），则返回 NULL

## 举例

```sql
select array_concat([1, 2], [7, 8], [5, 6]);
```
```text
+-----------------------------------------------------+
| array_concat(ARRAY(1, 2), ARRAY(7, 8), ARRAY(5, 6)) |
+-----------------------------------------------------+
| [1, 2, 7, 8, 5, 6]                                  |
+-----------------------------------------------------+
```
```sql
select array_concat([1, 2], [7, 8], [5, 6], NULL);
```
```text
+--------------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6], NULL) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+
```

```sql
CREATE TABLE array_test (
    id int,
    col2 ARRAY<INT>,
    col3 ARRAY<INT>
)
duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test (id, col2, col3) VALUES
(1,[1, 2, 3], [3, 4, 5]),
(2,[1, NULL, 2], [NULL]),
(3,[1, 2, 3], NULL),
(4,[], []);

select col2, col3, array_concat(col2, col3) from array_test;
```
```text
+--------------+-----------+------------------------------+
| col2         | col3      | array_concat(`col2`, `col3`) |
+--------------+-----------+------------------------------+
| [1, 2, 3]    | [3, 4, 5] | [1, 2, 3, 3, 4, 5]           |
| [1, NULL, 2] | [NULL]    | [1, NULL, 2, NULL]           |
| [1, 2, 3]    | NULL      | NULL                         |
| []           | []        | []                           |
+--------------+-----------+------------------------------+
```