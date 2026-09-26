---
{
    "title": "NANOSECONDS_SUB",
    "language": "en",
    "description": "Subtracts a number of nanoseconds from a TIMESTAMP_NS value."
}
---

## Description

Subtracts a number of nanoseconds from a `TIMESTAMP_NS` value while preserving nanosecond precision.

## Syntax

```sql
NANOSECONDS_SUB(<timestamp_ns>, <delta>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<timestamp_ns>` | The base value, of type `TIMESTAMP_NS`. |
| `<delta>` | The number of nanoseconds to subtract, of type `BIGINT`. A negative value adds nanoseconds. |

## Return Value

Returns `TIMESTAMP_NS`. Returns `NULL` if any argument is `NULL`. Reports an error if the result is outside the `TIMESTAMP_NS` range.

## Example

```sql
SELECT NANOSECONDS_SUB(
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

A negative delta adds nanoseconds:

```sql
SELECT NANOSECONDS_SUB(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), -1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_SUB(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
