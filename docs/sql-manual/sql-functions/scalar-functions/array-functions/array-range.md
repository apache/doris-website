---
{
    "title": "ARRAY_RANGE",
    "language": "en",
    "description": "Generate an arithmetic sequence array of numbers or datetimes."
}
---

<a id="function"></a>

## Description

Generates an arithmetic sequence array of numbers or datetimes. The result includes the start and excludes the end. Returns NULL if any argument is NULL.

In the Doris 4.1 series since 4.1.5, datetime sequences retain every valid value below the end, even when the last value is less than a full interval away from the end. Earlier versions could omit these trailing values.

## Syntax

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end> [, <step>])
ARRAY_RANGE(<start_dt>, <end_dt> [, INTERVAL <step> <unit>])
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<start>` | Optional non-negative INT start value. Defaults to 0. |
| `<end>` | Non-negative INT end value, excluded from the result. |
| `<step>` | Optional positive integer step. Defaults to 1. |
| `<start_dt>`, `<end_dt>` | DATETIME or TIMESTAMP_NS start and end values. Both arguments must have the same type. The end is excluded. Without INTERVAL, the step is 1 DAY. |
| `<unit>` | Datetime step unit: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, or SECOND. |

## Return Value

Returns an ARRAY. Numeric sequences contain INT elements; datetime sequences contain elements of the input type, DATETIME or TIMESTAMP_NS.

<a id="usage-notes"></a>

- Returns NULL if any argument is NULL or invalid, such as a negative numeric start or end, or a non-positive step.
- Returns an empty array `[]` if the start is greater than or equal to the end.
- Each successive value is calculated from the previous value. Month arithmetic can adjust a date to the last day of the target month.
- Reports an error if the sequence exceeds the array size limit. If a successor exceeds the date type's range, generation stops after the last valid value.
- `SEQUENCE` is an alias for `ARRAY_RANGE`.

<a id="examples"></a>

## Example

Numeric sequences exclude the end:

```sql
SELECT ARRAY_RANGE(5), ARRAY_RANGE(2, 6, 2), ARRAY_RANGE(3, 2);
```

```text
[0, 1, 2, 3, 4]    [2, 4]    []
```

Datetime sequences default to a one-day step. The last value is retained even if less than one day remains:

```sql
SELECT ARRAY_RANGE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-02 12:00:00.000000' AS DATETIME(6)));
```

```text
["2024-01-01 00:00:00.000000", "2024-01-02 00:00:00.000000"]
```

A monthly step increments from the previously generated date:

```sql
SELECT ARRAY_RANGE(
    CAST('2020-01-31 00:00:00' AS DATETIME(6)),
    CAST('2020-03-30 00:00:00' AS DATETIME(6)), INTERVAL 1 MONTH);
```

```text
["2020-01-31 00:00:00.000000", "2020-02-29 00:00:00.000000", "2020-03-29 00:00:00.000000"]
```

`SEQUENCE` uses the same rules:

```sql
SELECT SEQUENCE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-01 00:00:01.500000' AS DATETIME(6)), INTERVAL 1 SECOND);
```

```text
["2024-01-01 00:00:00.000000", "2024-01-01 00:00:01.000000"]
```

NULL or invalid arguments:

```sql
SELECT ARRAY_RANGE(NULL), ARRAY_RANGE(-1, 3), ARRAY_RANGE(1, 3, 0);
```

```text
NULL    NULL    NULL
```

TIMESTAMP_NS input preserves nanosecond precision:

```sql
SELECT ARRAY_RANGE(
    CAST('2022-05-15 12:00:00.123456789' AS TIMESTAMP_NS),
    CAST('2022-05-15 12:00:02.123456789' AS TIMESTAMP_NS), INTERVAL 1 SECOND);
```

```text
["2022-05-15 12:00:00.123456789", "2022-05-15 12:00:01.123456789"]
```
