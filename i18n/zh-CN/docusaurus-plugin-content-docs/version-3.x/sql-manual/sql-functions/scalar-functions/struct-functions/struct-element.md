---
{
    "title": "STRUCT_ELEMENT",
    "language": "zh-CN",
    "description": "返回 struct 数据列内的某一 field"
}
---

## 描述

返回 struct 数据列内的某一 field

## 语法

```sql
STRUCT_ELEMENT( <struct>, '<filed_location>/<filed_name>')
```

## 参数

| 参数 | 说明                             |
| -- |--------------------------------|
| `<struct>` | 输入的 struct 列，如果是 null，则返回 null |
| `<filed_location>` | field 的位置，起始位置从 1 开始，仅支持常量     |
| `<filed_name>` | field 的名字，仅支持常量，大小写敏感          |

## 返回值

返回指定的 field 列，类型为任意类型

## 举例

```sql
select struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2'),struct_element(named_struct('f1', 1, 'f2', 'a'), 1);
```

```text
+--------------------------------------------------------+-----------------------------------------------------+
| struct_element(named_struct('f1', 1, 'f2', 'a'), 'f2') | struct_element(named_struct('f1', 1, 'f2', 'a'), 1) |
+--------------------------------------------------------+-----------------------------------------------------+
| a                                                      |                                                   1 |
+--------------------------------------------------------+-----------------------------------------------------+
```

```sql
CREATE TABLE test_struct (
    id INT,
    struct_col STRUCT<f1: BIGINT, f2: BIGINT, f3: BIGINT, f4: BIGINT, f5: BIGINT>
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_struct VALUES
(1, NAMED_STRUCT('f1', 1, 'f2', 2, 'f3', 3, 'f4', 4, 'f5', 5)),
(2, NAMED_STRUCT('f1', 1, 'f2', 1000, 'f3', 10000000, 'f4', 100000000000, 'f5', 100000000000)),
(3, NAMED_STRUCT('f1', 5, 'f2', 4, 'f3', 3, 'f4', 2, 'f5', 1)),
(4, NULL),
(5, NAMED_STRUCT('f1', 1, 'f2', NULL, 'f3', 3, 'f4', NULL, 'f5', 5));

SELECT struct_col, STRUCT_ELEMENT(struct_col, 'f1') AS f1
FROM test_struct
ORDER BY id;
```

```text
+--------------------------------------------------------------------------+------+
| struct_col                                                               | f1   |
+--------------------------------------------------------------------------+------+
| {"f1":1, "f2":2, "f3":3, "f4":4, "f5":5}                                 | 1    |
| {"f1":1, "f2":1000, "f3":10000000, "f4":100000000000, "f5":100000000000} | 1    |
| {"f1":5, "f2":4, "f3":3, "f4":2, "f5":1}                                 | 5    |
| NULL                                                                     | NULL |
| {"f1":1, "f2":null, "f3":3, "f4":null, "f5":5}                           | 1    |
+--------------------------------------------------------------------------+------+
```
