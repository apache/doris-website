---
{
    "title": "SECOND_FLOOR",
    "language": "en"
}
---

## Description

The SECOND_FLOOR function rounds the input datetime value down to the nearest specified second period. If a starting time (origin) is specified, it uses that time as the basis for dividing periods and rounding; if not specified, it defaults to 0001-01-01 00:00:00 as the basis. This function supports processing DATETIME types.

Datetime calculation formula:
$$
\text{SECOND\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
K represents the number of periods from the base time to the target time.

## Syntax

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | Required. The input datetime value. Supports datetime type. For specific datetime formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |
| `<period>` | Optional. Indicates how many seconds make up each period. Supports positive integer type (INT). Default is 1 second. |
| `<origin_datetime>` | Optional. The alignment starting point. Supports datetime type. If not specified, defaults to 0001-01-01T00:00:00. |

## Return Value

Returns a value of type DATETIME, representing the time value after rounding down to the nearest specified second period based on the input datetime. The precision of the return value matches the precision of the input datetime parameter.

- If `<period>` is a non-positive (≤0), returns error.
- If any parameter is NULL, returns NULL.
- When period is not specified, defaults to a 1-second period.
- When `<origin_datetime>` is not specified, defaults to 0001-01-01 00:00:00 as the basis.
- If the input is DATE type (only contains year, month, day), its time portion defaults to 00:00:00.
- For datetime with scale, all decimal places are truncated to 0.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql
--- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

--- 5-second period, downward rounding result with default starting point
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

--- Specify starting time (origin)
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

--- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000000 |
+----------------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

--- Period is non-positive, returns error
mysql> SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

--- Any parameter is NULL, returns NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```