---
{
    "title": "REGR_COUNT",
    "language": "en",
    "description": "Returns the number of non-null (y, x) pairs in a group."
}
---

## Description

Returns the number of non-null `(y, x)` pairs in a group, where `x` is the independent variable and `y` is the dependent variable. If there are no valid non-null pairs, the function returns `0`.

## Syntax

```sql
REGR_COUNT(<y>, <x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<y>` | The dependent variable. Supported type: Double. |
| `<x>` | The independent variable. Supported type: Double. |

## Return Value

Returns a BIGINT value representing the number of non-null `(y, x)` pairs.
If there are no rows in the group, or there are no valid non-null `(y, x)` pairs, the function returns `0`.

## Example

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL);
```

```sql
SELECT id, REGR_COUNT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+-------------------+
| id   | REGR_COUNT(y, x)  |
+------+-------------------+
|    1 |                 0 |
|    2 |                 4 |
+------+-------------------+
```

REGR_COUNT counts only non-null `(y, x)` pairs, so group 1 returns `0`.
