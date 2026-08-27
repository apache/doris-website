---
{
    "title": "NANOSECOND",
    "language": "en",
    "description": "Extracts the nanosecond part of a TIMESTAMP_NS value."
}
---

## Description

Extracts the nanosecond part of a `TIMESTAMP_NS` value. The result contains all nine fractional-second digits.

## Syntax

```sql
NANOSECOND(<timestamp_ns>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<timestamp_ns>` | A value of type `TIMESTAMP_NS`. |

## Return Value

Returns an `INT` in the range `[0, 999999999]`. Returns `NULL` when the input is `NULL`.

## Example

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS)) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456789 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST(NULL AS TIMESTAMP_NS)) AS ns;
```

```text
+------+
| ns   |
+------+
| NULL |
+------+
```
