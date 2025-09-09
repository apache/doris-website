---
{
    "title": "MILLISECONDS_SUB",
    "language": "en"
}
---

## Description

The `MILLISECONDS_SUB` function subtracts a specified number of milliseconds from the input datetime value and returns the resulting new datetime value. This function supports processing `DATETIME` types.

## Syntax

```sql
MILLISECONDS_SUB(`<datetime>`, `<delta>`)
```

## Parameters

| Parameter    | Description                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | The input datetime value, of type `DATETIME`. For specific datetime formats, see [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion). |
| `<delta>`    | The number of milliseconds to subtract, of type `INT`. 1 second = 1,000 milliseconds = 1,000,000 microseconds. |

## Return Value

Returns a value of type `DATETIME`, representing the result of subtracting the specified milliseconds from the base time.

- If `<delta>` is negative, the function behaves the same as adding the corresponding milliseconds to the base time.
- If the input is of `DATE` type (only includes year, month, and day), the default time part is set to `00:00:00.000`.
- If the calculation result exceeds the valid range of the `DATETIME` type (`0000-01-01 00:00:00` to `9999-12-31 23:59:59.999999`), an exception is thrown.
- If any parameter is `NULL`, the function returns `NULL`.
- If `<delta>` exceeds the range of the `INT` type (`-2147483648` to `2147483647`), the function returns `NULL`.

## Examples

```sql
-- Subtract 1 millisecond
SELECT MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.434123                        |
+---------------------------------------------------+

-- Negative delta (equivalent to addition)
SELECT MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_SUB('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_SUB('2023-01-01', 1500) |
+--------------------------------------+
| 2022-12-31 23:59:58.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_SUB('0000-01-01', 1500);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation milliseconds_sub of 0000-01-01 00:00:00, 1500 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_SUB(NULL, 100), MILLISECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| milliseconds_sub(NULL, 100)  | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Delta exceeds INT range, returns NULL
SELECT MILLISECONDS_SUB('2023-09-08 16:02:08.435', 2147483648) AS after_sub;
+-----------+
| after_sub |
+-----------+
| NULL      |
+-----------+
```