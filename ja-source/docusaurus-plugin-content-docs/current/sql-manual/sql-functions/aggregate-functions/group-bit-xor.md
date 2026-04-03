---
{
  "title": "GROUP_BIT_XOR",
  "language": "ja",
  "description": "単一の整数列または式のすべての値に対してbitwise XOR演算を実行します。"
}
---
## 説明

単一の整数列または式のすべての値に対してビット単位のXOR演算を実行します。

## 構文

```sql
GROUP_BIT_XOR(<expr>)
```
## パラメータ

| Parameter | Description |
| -- | -- |
| `<expr>` | サポートする型: TinyInt、SmallInt、Integer、BigInt、LargeInt。 |

## 戻り値

<expr>と同じ型の整数値を返します。すべての値がNULLの場合、NULLを返します。NULL値はビット演算に関与しません。

## 例

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
select group_bit_xor(value) from group_bit;
```
```text
+----------------------+
| group_bit_xor(value) |
+----------------------+
|                    4 |
+----------------------+
```
```sql
select group_bit_xor(value) from group_bit where value is null;
```
```text
+----------------------+
| group_bit_xor(value) |
+----------------------+
|                 NULL |
+----------------------+
```
