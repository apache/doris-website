---
{
    "title": "MAKETIME",
    "language": "en"
}
---

## Description

Returns a time value composed from the `hour`, `minute`, and `second` arguments.

This function behaves consistently with the [MAKETIME function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_maketime) in MySQL.

## Syntax

```sql
MAKETIME(`<hour>`, `<minute>`, `<second>`)
```

## Parameters

| Parameter | Description                                                                                                                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hour`    | The hour part of the time, supports integer type (BIGINT). The value range is limited to [-838, 838]. If the input value exceeds this range, it is automatically corrected to the nearest boundary value.                           |
| `minute`  | The minute part of the time, supports integer type (BIGINT). The allowed value range is [0, 59].                                                                                                                                    |
| `second`  | The second part of the time, supports integer type (BIGINT) and float type (DOUBLE). The allowed value range is [0, 60). It supports up to six decimal places of precision. If more than six decimal places are provided, it will be automatically rounded. |

## Return Value

Returns a value of type TIME, in the format `hour:minute:second`. When the input `seconde` is of integer type, the output value precision is 0, and when it is of decimal type, the output value precision is the maximum precision of 6.

- If `minute` or `second` exceeds the allowed range, it returns NULL.
- If any parameter is NULL, it returns NULL.

## Example

```sql
SELECT `hour`, `minute`, `sec`, MAKETIME(`hour`, `minute`, `sec`) AS ans FROM `test_maketime`;
```
```text
+------+-------+--------+---------+-------------------+
| id   | hour  | minute | sec     | ans               |
+------+-------+--------+---------+-------------------+
|    1 |    12 |     15 |      30 | 12:15:30.000000   |
|    2 |    14 |     56 | 12.5789 | 14:56:12.578900   |
|    3 |  1234 |     11 |       4 | 838:59:59.000000  |
|    4 | -1234 |      6 |      52 | -838:59:59.000000 |
|    5 |    20 |     60 |      12 | NULL              |
|    6 |    14 |     51 |      66 | NULL              |
|    7 |  NULL |     15 |      16 | NULL              |
|    8 |     7 |   NULL |       8 | NULL              |
|    9 |     1 |      2 |    NULL | NULL              |
|   10 |    23 |    -40 |      12 | NULL              |
|   11 |    20 |      6 |     -12 | NULL              |
+------+-------+--------+---------+-------------------+
```
> Note:

> 1. The `sec` column type is Float, so all output formats are time values with six decimal places.
> 2. 1 - 2 are normal examples.
> 3. 3 - 4 are examples of hour overflow situations (*return fixed boundary values*).
> 4. 5 - 6 are examples where the minute parameter and sec parameter exceed the reasonable range in the positive interval (*return NULL*).
> 5. 7 - 9 are examples where any parameter is NULL (*return NULL*).
> 6. 10 - 11 are examples where minute and sec are negative (*even if the absolute values are reasonable, return NULL*).   

```sql
SELECT `id`, `hour`, `minute`, MAKETIME(`hour`, `minute`, 27) AS ans FROM `test_maketime`;
```
```text
+------+-------+--------+------------+
| id   | hour  | minute | ans        |
+------+-------+--------+------------+
|    1 |    12 |     15 | 12:15:27   |
|    2 |    14 |     56 | 14:56:27   |
|    3 |  1234 |     11 | 838:59:59  |
|    4 | -1234 |      6 | -838:59:59 |
|    5 |    20 |     60 | NULL       |
|    6 |    14 |     51 | 14:51:27   |
|    7 |  NULL |     15 | NULL       |
|    8 |     7 |   NULL | NULL       |
|    9 |     1 |      2 | 01:02:27   |
|   10 |    23 |    -40 | NULL       |
|   11 |    20 |      6 | 20:06:27   |
+------+-------+--------+------------+
```
> Note:
> The input type of `sec` is an integer type, so the output type is all time types without microseconds.

```sql
-- the precision of second will be rounded to six decimal places if it exceeds six digits
SELECT MAKETIME(12, 7, 56.1234567);
```
```text
+-----------------------------+
| MAKETIME(12, 7, 56.1234567) |
+-----------------------------+
| 12:07:56.123457             |
+-----------------------------+
```