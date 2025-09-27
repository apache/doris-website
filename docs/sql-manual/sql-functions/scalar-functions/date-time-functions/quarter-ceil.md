---
{
    "title": "QUARTER_CEIL",
    "language": "en"
}
---

## Description


The quarter_ceil function rounds a datetime value up to the nearest specified quarter period boundary. If origin is specified, the period is calculated based on that time.

Date calculation formula:
$$
\begin{aligned}
&\text{quarter\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods needed from the baseline time to reach the target time.

## Syntax

```sql
QUARTER_CEIL(<datetime>)
QUARTER_CEIL(<datetime>, <origin>)
QUARTER_CEIL(<datetime>, <period>)
QUARTER_CEIL(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<datetime>` | The datetime value to round up, type is DATE or DATETIME |
| `<period>` | Quarter period value, type is INT, representing the number of quarters contained in each period |
| `<origin>` | The starting point of the period, type is DATE or DATETIME, default value is 0001-01-01 00:00:00 |

Notes:
- When period is not specified, it is equivalent to using 1 quarter as the period
- When period is not a positive integer, the function result will be NULL
- The result always rounds to the future time
- The time part of the return value is always 00:00:00

## Return Value

When `<datetime>` is of DATE type, the return type is DATE.
When `<datetime>` is of DATETIME type, the return type is DATETIME.
Represents the rounded up datetime value. The time part of the result will be set to 00:00:00.

## Examples

Starting from '0001-01-01 00:00:00', with periods of 5 / 4 quarters each, return the next period start point closest to the input date.
```sql
SELECT QUARTER_CEIL("2023-07-13 22:28:18", 5), QUARTER_CEIL("2023-07-13 22:28:18", 4);
```

```text
+----------------------------------------+----------------------------------------+
| QUARTER_CEIL("2023-07-13 22:28:18", 5) | QUARTER_CEIL("2023-07-13 22:28:18", 4) |
+----------------------------------------+----------------------------------------+
| 2024-10-01 00:00:00.000000             | 2024-01-01 00:00:00.000000             |
+----------------------------------------+----------------------------------------+
```

Using '2022-01-01 00:00:00' as the period start point, with periods of 2 / 4 quarters each, return the next period start point closest to the input date.
```sql
SELECT QUARTER_CEIL("2023-03-13 22:28:18", 2, "2022-01-01 00:00:00"), QUARTER_CEIL("2023-07-13 22:28:18", 4, "2022-01-01 00:00:00");
```

```text
+---------------------------------------------------------------+---------------------------------------------------------------+
| QUARTER_CEIL("2023-03-13 22:28:18", 2, "2022-01-01 00:00:00") | QUARTER_CEIL("2023-07-13 22:28:18", 4, "2022-01-01 00:00:00") |
+---------------------------------------------------------------+---------------------------------------------------------------+
| 2023-07-01 00:00:00                                           | 2024-01-01 00:00:00                                           |
+---------------------------------------------------------------+---------------------------------------------------------------+
```

## Best Practices

See also [date_ceil](./date-ceil)
