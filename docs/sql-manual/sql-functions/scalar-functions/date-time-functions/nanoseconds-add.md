---
{
    "title": "NANOSECONDS_ADD",
    "language": "en",
    "description": "Adds a number of nanoseconds to a TIMESTAMP_NS value."
}
---

## Description

Adds a number of nanoseconds to a `TIMESTAMP_NS` value while preserving nanosecond precision.

## Syntax

```sql
NANOSECONDS_ADD(<timestamp_ns>, <delta>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<timestamp_ns>` | The base value, of type `TIMESTAMP_NS`. |
| `<delta>` | The number of nanoseconds to add, of type `BIGINT`. A negative value subtracts nanoseconds. |

## Return Value

Returns `TIMESTAMP_NS`. Returns `NULL` if any argument is `NULL`. Reports an error if the result is outside the `TIMESTAMP_NS` range.

## Example

```sql
SELECT NANOSECONDS_ADD(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

A negative delta subtracts nanoseconds:

```sql
SELECT NANOSECONDS_ADD(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS), -2
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_ADD(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
