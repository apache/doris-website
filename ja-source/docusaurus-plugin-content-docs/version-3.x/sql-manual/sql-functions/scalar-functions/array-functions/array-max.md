---
{
  "title": "ARRAY_MAX",
  "description": "配列内の最大要素を取得します（NULL値はスキップされます）。配列が空であるか、配列内のすべての要素がNULL値である場合、",
  "language": "ja"
}
---
## description

配列内の最大要素を取得します（`NULL`値はスキップされます）。
配列が空の場合、または配列内のすべての要素が`NULL`値の場合、この関数は`NULL`を返します。

## Syntax

```sql
ARRAY_MAX(<arr>)
```
## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<arr>` | ARRAY配列 |

## 戻り値

配列内の最大要素を返します。特殊ケース：
- 配列内の`NULL`値はスキップされます。
- 空の配列またはすべての要素が`NULL`の配列の場合、結果は`NULL`になります。

## example

```sql
create table array_type_table(
    k1 INT, 
    k2 Array<int>
        ) 
duplicate key (k1)
distributed by hash(k1) buckets 1 
properties(
    'replication_num' = '1'
    );
insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3]), (3, [1, NULL, 3]);
select k2, array_max(k2) from array_type_table;
```
```text
+--------------+-----------------+
| k2           | array_max(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               3 |
| [1, NULL, 3] |               3 |
+--------------+-----------------+
```
