---
{
    "title": "BITMAP_AGG",
    "language": "en",
    "description": "Aggregates the non-NULL values of the input expression into a Bitmap. If a value is less than 0 or greater than 18446744073709551615,"
}
---

## Description

Aggregates the non-NULL values of the input expression into a Bitmap.
If a value is less than 0 or greater than 18446744073709551615, it will be ignored and not merged into the Bitmap.

## Syntax

```sql
BITMAP_AGG(<expr>)
```

## Arguments

| Argument | Description |
| -- | -- |
| `<expr>` | The column or expression to be aggregated. Supported types: TinyInt, SmallInt, Integer, BigInt. |

## Return Value

Returns a value of Bitmap type. If there is no valid data in the group, returns an empty Bitmap.

## Example

```sql
-- setup
CREATE TABLE test_bitmap_agg (
    id INT,
    k0 INT,
    k1 INT,
    k2 INT,
    k3 INT,
    k4 BIGINT,
    k5 BIGINT
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_bitmap_agg VALUES
    (1, 10, 110, 11, 300, 10000000000, 0),
    (2, 20, 120, 21, 400, 20000000000, 200000000000000),
    (3, 30, 130, 31, 350, 30000000000, 300000000000000),
    (4, 40, 140, 41, 500, 40000000000, 18446744073709551616),
    (5, 50, 150, 51, 250, 50000000000, 18446744073709551615),
    (6, 60, 160, 61, 600, 60000000000, -1),
    (7, 60, 160, 120, 600, 60000000000, NULL);
```

```sql
select bitmap_to_string(bitmap_agg(k0)) from test_bitmap_agg;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k0)) |
+----------------------------------+
| 10,20,30,40,50,60                |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(k5))                       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg where k5 is null;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k5)) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(cast(k5 as BIGINT)))       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```

