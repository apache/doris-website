---
{
    "title": "FLOAT",
    "language": "en"
}
---

## FLOAT
## Description
    FLOAT
    4-byte single-precision floating-point number.

## Value Range

Doris uses IEEE-754 single-precision floating-point numbers, the value range is:

- -∞ (-Infinity)
- [-3.402E+38, -1.175E-37]
- 0
- [1.175E-37, 3.402E+38]
- +∞ (+Infinity)
- NaN (Not a Number)

For details, refer to [C++ float type](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types) and [Wikipedia Single-precision floating-point format](https://en.wikipedia.org/wiki/Single-precision_floating-point_format).

## Examples

```sql
create table float_test(f1 int, f2 float) properties("replication_num"="1");

insert into float_test values(0, "-Infinity"), (1, -3.402E+38), (2, -1.175E-37), (3, 0), (4, +1.175E-37), (5, +3.402E+38), (6, "+Infinity"), (7, "NaN");

select * from float_test order by f1;
+------+------------+
| f1   | f2         |
+------+------------+
|    0 |  -Infinity |
|    1 | -3.402e+38 |
|    2 | -1.175e-37 |
|    3 |          0 |
|    4 |  1.175e-37 |
|    5 |  3.402e+38 |
|    6 |   Infinity |
|    7 |        NaN |
+------+------------+
```

### keywords
FLOAT
