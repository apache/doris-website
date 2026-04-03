---
{
  "title": "ARRAY_AVG",
  "language": "ja",
  "description": "配列内のすべての要素の平均値を取得します（NULL値はスキップされます）。配列が空またはすべての要素がNULL値の場合、"
}
---
## 説明
配列内のすべての要素の平均値を取得します（`NULL`値はスキップされます）。
配列が空の場合、または配列内のすべての要素が`NULL`値の場合、この関数は`NULL`を返します。

## 構文

```sql
ARRAY_AVG(<arr>)
```
## パラメータ
| パラメータ | 説明 |
|---|---|
| `<arr>` | 平均値を計算する配列 |

## 戻り値

定数を返します。特殊なケース：
- 配列内の`NULL`値はスキップされます。
- 配列内のStringsとvarcharはスキップされます。

## 例

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
select k2, array_avg(k2) from array_type_table;
```
```text
+--------------+-----------------+
| k2           | array_avg(`k2`) |
+--------------+-----------------+
| []           |            NULL |
| [NULL]       |            NULL |
| [1, 2, 3]    |               2 |
| [1, NULL, 3] |               2 |
+--------------+-----------------+
```
```sql
select array_avg(['test',2,1,null]);
```
```text
+------------------------------------------------------------+
| array_avg(cast(['test', '2', '1', NULL] as ARRAY<DOUBLE>)) |
+------------------------------------------------------------+
|                                                        1.5 |
+------------------------------------------------------------+
```
