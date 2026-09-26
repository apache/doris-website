---
{
    "title": "NANOSECONDS_DIFF",
    "language": "en",
    "description": "Returns the difference in nanoseconds between two date-time values."
}
---

## Description

Returns the difference in nanoseconds between two date-time values. The result is `<end_time> - <start_time>`.

## Syntax

```sql
NANOSECONDS_DIFF(<end_time>, <start_time>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<end_time>` | The end time. At least one argument must be `TIMESTAMP_NS`; the other may be `TIMESTAMP_NS` or `DATETIME`. |
| `<start_time>` | The start time. At least one argument must be `TIMESTAMP_NS`; the other may be `TIMESTAMP_NS` or `DATETIME`. |

## Return Value

Returns a `BIGINT` representing `<end_time> - <start_time>` in nanoseconds. Returns `NULL` if either argument is `NULL`.

A positive result means the end time is later than the start time; a negative result means it is earlier. The result must fit in `BIGINT`; otherwise, the function reports an overflow error.

## Example

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
|    2 |
+------+
```

Arguments may mix `TIMESTAMP_NS` and `DATETIME`:

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000' AS DATETIME(6))
) AS diff;
```

```text
+------+
| diff |
+------+
|    1 |
+------+
```

```sql
SELECT NANOSECONDS_DIFF(
    CAST(NULL AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
| NULL |
+------+
```
