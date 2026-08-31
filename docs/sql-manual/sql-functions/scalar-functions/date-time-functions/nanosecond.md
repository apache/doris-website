---
{
    "title": "NANOSECOND",
    "language": "en",
    "description": "Extracts the nanosecond part of a DATE, DATETIME, or TIMESTAMP_NS value, padding DATETIME fractional seconds to nine digits."
}
---

## Description

Extracts the nanosecond part of a `DATE`, `DATETIME`, or `TIMESTAMP_NS` value. For `DATE`, the result is always 0. For `DATETIME(p)`, the fractional-second value is padded with trailing zeros to nine digits; for `TIMESTAMP_NS`, all nine fractional-second digits are returned.

## Syntax

```sql
NANOSECOND(<date>)
NANOSECOND(<datetime>)
NANOSECOND(<timestamp_ns>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<date>` | A value of type `DATE`. |
| `<datetime>` | A value of type `DATETIME(p)`, where `p` is from 0 to 6. |
| `<timestamp_ns>` | A value of type `TIMESTAMP_NS`. |

## Return Value

Returns an `INT` in the range `[0, 999999999]`. `DATE` input returns 0. `DATETIME(p)` input returns its fractional-second part expressed in nanoseconds, padded with trailing zeros to nine digits. `TIMESTAMP_NS` input returns all nine fractional-second digits. Returns `NULL` when the input is `NULL`.

## Example

```sql
SELECT NANOSECOND(CAST('2024-02-29' AS DATE)) AS ns;
```

```text
+----+
| ns |
+----+
|  0 |
+----+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456' AS DATETIME(6))) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456000 |
+-----------+
```

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
