---
{
  "title": "MAX_BY",
  "language": "ja",
  "description": "MAXBY関数は、指定された列の最大値に基づいて関連付けられた値を返します。"
}
---
## 説明

MAX_BY関数は、指定された列の最大値に基づいて関連する値を返します。

## 構文

```sql
MAX_BY(<expr1>, <expr2>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | 関連する値の式。サポートされる型：Bool、TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal、String、Date、Datetime、Array、Map、Struct。 |
| `<expr2>` | 最大値の式。サポートされる型：Bool、TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal、String、Date、Datetime、Array。 |

## 戻り値

`<expr1>`と同じデータ型を返します。
グループに有効なデータがない場合はNULLを返します。

## 例

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    arr ARRAY<INT>,
    mp MAP<STRING, INT>,
    st STRUCT<a: INT, b: STRING>,
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 100, [1,2,3], {"x": 1, "y": 4}, NAMED_STRUCT("a", 1, "b", "x")),
    (1, 4,   [5, 6],  {"x": 2, "y": 3}, NAMED_STRUCT("a", 2, "b", "y")),
    (4, 1,   [7],     {"x": 3, "y": 2}, NAMED_STRUCT("a", 3, "b", "z")),
    (3, 1,   [8],     {"x": 4, "y": 1}, NAMED_STRUCT("a", 4, "b", "r"));
```
```sql
select max_by(k1, k2) from tbl;
```
```text
+----------------+
| max_by(k1, k2) |
+----------------+
|              0 |
+----------------+
```
```sql
select max_by(arr, k1), max_by(mp, k1), max_by(st, k1) from tbl;
```
```text
+-----------------+----------------+------------------+
| max_by(arr, k1) | max_by(mp, k1) | max_by(st, k1)   |
+-----------------+----------------+------------------+
| [7]             | {"x":3, "y":2} | {"a":3, "b":"z"} |
+-----------------+----------------+------------------+
```
```sql
select max_by(k1, arr), max_by(mp, arr), max_by(st, arr), max_by(arr, arr) from tbl;
```
```text
+-----------------+-----------------+------------------+------------------+
| max_by(k1, arr) | max_by(mp, arr) | max_by(st, arr)  | max_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               3 | {"x":4, "y":1}  | {"a":4, "b":"r"} | [8]              |
+-----------------+-----------------+------------------+------------------+
```
```sql
select max_by(k1, k2) from tbl where k1 is null;
```
```text
+----------------+
| max_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```
