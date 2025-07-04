---
{
    "title": "ARRAY_ENUMERATE",
    "language": "zh-CN"
}
---

## 描述
返回数组下标，例如  [1, 2, 3, …, length (arr) ]

## 语法
```sql
ARRAY_ENUMERATE(<arr>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `<arr>` | 需要返回数组下标的数组 |

## 返回值
返回包含数组下标的数组，特殊情况：
- 如果参数是 NULL，则返回 NULL

## 举例

```sql
create table array_type_table(
    k1 INT, 
    k2 Array<STRING>
) 
duplicate key (k1)
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
);
insert into array_type_table values (0, []), 
("1", [NULL]), 
("2", ["1", "2", "3"]), 
("3", ["1", NULL, "3"]), 
("4", NULL);
select k2, array_enumerate(k2) from array_type_table;
```
```text
+------------------+-----------------------+
| k2               | array_enumerate(`k2`) |
+------------------+-----------------------+
| []               | []                    |
| [NULL]           | [1]                   |
| ['1', '2', '3']  | [1, 2, 3]             |
| ['1', NULL, '3'] | [1, 2, 3]             |
| NULL             | NULL                  |
+------------------+-----------------------+
```
