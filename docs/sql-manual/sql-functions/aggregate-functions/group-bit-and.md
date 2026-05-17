---
{
    "title": "GROUP_BIT_AND",
    "language": "en",
    "description": "Performs a bitwise AND operation on all values in a single integer column or expression."
}
---

## Description

Performs a bitwise AND operation on all values in a single integer column or expression.

## Syntax

```sql
GROUP_BIT_AND(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Supports types: TinyInt, SmallInt, Integer, BigInt, LargeInt. |

## Return Value

Returns an integer value of the same type as <expr>. If all values are NULL, returns NULL. NULL values are not involved in the bitwise operation.

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
