---
{
  "title": "ARRAY_ENUMERATE",
  "description": "配列のサブアイテムのインデックスを返します。例：[1, 2, 3, …, length (arr) ]",
  "language": "ja"
}
---
## 概要
配列のサブアイテムのインデックスを返します（例：[1, 2, 3, …, length (arr) ]）

## 構文

```sql
ARRAY_ENUMERATE(<arr>)
```
## パラメータ
| Parameter | デスクリプション |
|---|---|
| `<arr>` | 配列のサブアイテムのインデックスを返す配列 |

## Return Value
配列のインデックスを含む配列を返します。

## Example

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
