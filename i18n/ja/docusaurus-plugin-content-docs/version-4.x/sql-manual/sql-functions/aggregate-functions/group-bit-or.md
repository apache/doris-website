---
{
    "title": "GROUP_BIT_OR",
    "language": "ja",
    "description": "単一の整数型の列または式に含まれるすべての値に対して、ビット単位の OR 演算を行います。"
}
---

## 説明

単一の整数型の列または式に含まれるすべての値に対して、ビット単位の OR 演算を行います。

## 構文

```sql
GROUP_BIT_OR(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | TinyInt、SmallInt、Integer、BigInt、LargeInt 型をサポートします。 |

## 戻り値

<expr> と同じ型の整数値を返します。すべての値が NULL の場合は NULL を返します。NULL 値はビット演算の対象になりません。

## 使用例

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
select group_bit_or(value) from group_bit;
```

```text
+---------------------+
| group_bit_or(value) |
+---------------------+
|                   7 |
+---------------------+
```

```sql
select group_bit_or(value) from group_bit where value is null;
```

```text
+---------------------+
| group_bit_or(value) |
+---------------------+
|                NULL |
+---------------------+
```
