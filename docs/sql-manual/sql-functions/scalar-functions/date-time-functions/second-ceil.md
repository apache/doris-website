---
{
    "title": "SECOND_CEIL",
    "language": "en"
}
---

## Description

The SECOND_CEIL function rounds the input datetime value up to the nearest specified second period. If a starting time (origin) is specified, it uses that time as the basis for dividing periods and rounding; if not specified, it defaults to 0001-01-01 00:00:00 as the basis. This function supports processing DATETIME types.

Date calculation formula:
$$
\text{SECOND\_CEIL}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{SECOND} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{SECOND} \geq \langle\text{date\_or\_time\_expr}\rangle\}
$$
K represents the number of periods needed to reach the target time from the base time.

## Syntax

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | Required. The input datetime value. Supports datetime type. For specific datetime formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion). |
| `<period>` | Optional. Indicates how many seconds make up each period. Supports positive integer type (INT). Default is 1 second. |
| `<origin_datetime>` | Optional. The alignment starting point. Supports datetime type and strings that conform to datetime formats. If not specified, defaults to 0001-01-01T00:00:00. |

## Return Value

Returns a value of type DATETIME, representing the time value after rounding up to the nearest specified second period based on the input datetime. The precision of the return value matches the precision of the input datetime parameter.

- If `<period>` is a non-positive integer (≤0), returns an error.
- If any parameter is NULL, returns NULL.
- When period is not specified, defaults to a 1-second period.
- When `<origin>` is not specified, defaults to 0001-01-01 00:00:00 as the basis.
- If the input is DATE type (only contains year, month, day), its time portion defaults to 00:00:00.
- If the calculation result exceeds the valid range of DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), returns an error.
- For datetime with scale, all decimal places are truncated to 0.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql
--- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_CEIL('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

--- 5-second period, upward rounding result with default starting point
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

--- Specify starting time (origin)
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

--- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_CEIL('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:35:00.000000 |
+----------------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECOND_CEIL('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

--- Calculation result exceeds maximum datetime range, returns error
SELECT SECOND_CEIL('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 9999-12-31 23:59:59, 2 out of range

--- Period is non-positive, returns error
mysql> SELECT SECOND_CEIL('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 2025-01-23 12:34:56, -3 out of range

--- Any parameter is NULL, returns NULL
SELECT SECOND_CEIL(NULL, 5), SECOND_CEIL('2025-01-23 12:34:56', NULL) AS result;
+------------------------+--------+
| second_ceil(NULL, 5)   | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```