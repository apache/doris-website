---
{
    "title": "ARRAY_ENUMERATE",
    "language": "zh-CN"
}
---

## array_enumerate

array_enumerate

## 描述
## 语法

`ARRAY<T> array_enumerate(ARRAY<T> arr)`

返回数组下标, 例如  [1, 2, 3, …, length (arr) ]

## 举例

```shell
mysql> create table array_type_table(k1 INT, k2 Array<STRING>) duplicate key (k1)
    -> distributed by hash(k1) buckets 1 properties('replication_num' = '1');
mysql> insert into array_type_table values (0, []), ("1", [NULL]), ("2", ["1", "2", "3"]), ("3", ["1", NULL, "3"]), ("4", NULL);
mysql> select k2, array_enumerate(k2) from array_type_table;
+------------------+-----------------------+
| k2               | array_enumerate(`k2`) |
+------------------+-----------------------+
| []               | []                    |
| [NULL]           | [1]                   |
| ['1', '2', '3']  | [1, 2, 3]             |
| ['1', NULL, '3'] | [1, 2, 3]             |
| NULL             | NULL                  |
+------------------+-----------------------+
5 rows in set (0.01 sec)
```

### keywords

ARRAY,ENUMERATE,ARRAY_ENUMERATE
