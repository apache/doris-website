---
{
  "title": "GROUP_BIT_AND",
  "description": "単一の整数列または式内のすべての値に対してビット単位のAND演算を実行します。",
  "language": "ja"
}
---
## 説明

単一の整数列または式内のすべての値に対してビット単位のAND演算を実行します。

## 構文

```sql
GROUP_BIT_AND(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | サポートする型：TinyInt、SmallInt、Integer、BigInt、LargeInt |

## Return Value

`<expr>`と同じ型の整数値を返します。すべての値がNULLの場合、NULLを返します。NULL値はビット演算に関与しません。

## Example

```sql
-- setup
create table group_bit(
    value int
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into group_bit values
    (3),
    (1),
    (2),
    (4),
    (NULL);
```
```sql
select group_bit_and(value) from group_bit;
```
```text
+----------------------+
| group_bit_and(value) |
+----------------------+
|                    0 |
+----------------------+
```
```sql
select group_bit_and(value) from group_bit where value is null;
```
```text
+----------------------+
| group_bit_and(value) |
+----------------------+
|                 NULL |
+----------------------+
```
