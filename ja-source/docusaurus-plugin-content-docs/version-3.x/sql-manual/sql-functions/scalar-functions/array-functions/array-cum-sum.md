---
{
  "title": "ARRAY_CUM_SUM",
  "description": "配列の累積和を取得します（NULL値はスキップされます）。配列にNULL値が含まれている場合、",
  "language": "ja"
}
---
## 説明

配列の累積和を取得します（`NULL`値はスキップされます）。
配列に`NULL`値が含まれている場合、結果配列の同じ位置に`NULL`が設定されます。

## 構文

```sql
ARRAY_CUM_SUM(<arr>)
```
## パラメータ

| Parameter | デスクリプション |
|---|---|
| `<arr>` | 累積和を計算する配列 |

## 戻り値

配列を返します。特殊なケース：
- 配列内の`NULL`値はスキップされ、結果配列の同じ位置に`NULL`が設定されます。


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
insert into array_type_table values (0, []), 
(1, [NULL]), 
(2, [1, 2, 3, 4]), 
(3, [1, NULL, 3, NULL, 5]);
select k2, array_cum_sum(k2) from array_type_table;
```
```text
+-----------------------+-----------------------+
| k2                    | array_cum_sum(`k2`)   |
+-----------------------+-----------------------+
| []                    | []                    |
| [NULL]                | [NULL]                |
| [1, 2, 3, 4]          | [1, 3, 6, 10]         |
| [1, NULL, 3, NULL, 5] | [1, NULL, 4, NULL, 9] |
+-----------------------+-----------------------+
```
