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
+-------+--------+---------+-------------------+
| hour  | minute | sec     | ans               |
+-------+--------+---------+-------------------+
|    12 |     15 |      30 | 12:15:30.000000   |
|   111 |      0 | 23.1235 | 111:00:23.123457  |
|  1234 |     11 |       4 | 838:59:59.000000  |
| -1234 |      6 |      52 | -838:59:59.000000 |
|    20 |     60 |      12 | NULL              |
|    14 |     51 |      66 | NULL              |
|  NULL |     15 |      16 | NULL              |
|     7 |   NULL |       8 | NULL              |
|     1 |      2 |    NULL | NULL              |
+-------+--------+---------+-------------------+
```

```sql
SELECT `hour`, `minute`, MAKETIME(`hour`, `minute`, 27) AS ans FROM `test_maketime`;
```
```text
+-------+--------+------------+
| hour  | minute | ans        |
+-------+--------+------------+
|    12 |     15 | 12:15:27   |
|   111 |      0 | 111:00:27  |
|  1234 |     11 | 838:59:59  |
| -1234 |      6 | -838:59:59 |
|    20 |     60 | NULL       |
|    14 |     51 | 14:51:27   |
|  NULL |     15 | NULL       |
|     7 |   NULL | NULL       |
|     1 |      2 | 01:02:27   |
+-------+--------+------------+
```