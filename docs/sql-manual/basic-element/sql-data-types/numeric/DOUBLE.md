---
{
    "title": "DOUBLE",
    "language": "en"
}
---

## DOUBLE
## Description
    DOUBLE
    8-byte double-precision floating-point number.

## Value Range

Doris uses IEEE-754 double-precision floating-point numbers, the value range is:

- -∞ (-Infinity)
- [-1.79769E+308, -2.225E-307]
- 0
- [+2.225E-307, +1.79769E+308]
- +∞ (+Infinity)
- NaN (Not a Number)

For details, refer to [C++ double type](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types) and [Wikipedia Double-precision floating-point format](https://en.wikipedia.org/wiki/Double-precision_floating-point_format).

## Examples

```sql
create table double_test(f1 int, f2 double) properties("replication_num"="1");

insert into double_test values (0, "-Infinity"), (1, -1.79769E+308), (2, -2.225E-307), (3, 0), (4, +2.225E-307), (5, +1.79769E+308), (6, "+Infinity"), (7, "NaN");

select * from double_test order by f1;
+------+---------------+
| f1   | f2            |
+------+---------------+
|    0 |     -Infinity |
|    1 | -1.79769e+308 |
|    2 |   -2.225e-307 |
|    3 |             0 |
|    4 |    2.225e-307 |
|    5 |  1.79769e+308 |
|    6 |      Infinity |
|    7 |           NaN |
+------+---------------+
```

### keywords
DOUBLE
