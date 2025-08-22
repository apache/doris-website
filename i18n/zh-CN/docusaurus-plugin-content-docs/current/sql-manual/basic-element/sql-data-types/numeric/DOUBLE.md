---
{
    "title": "DOUBLE",
    "language": "zh-CN"
}
---

## DOUBLE
## 描述
    DOUBLE
    8字节双精度浮点数。

## 取值范围

Doris使用IEEE-754双精度浮点数，取值范围：

- -∞（负无穷大， -Infinity）
- [-1.79769E+308, -2.225E-307]
- 0
- [+2.225E-307, +1.79769E+308]
- +∞（正无穷大， +Infinity）
- NaN（Not a Number）

详情参见[C++ double 类型](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types)和[Wikipedia双精度浮点数](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)。

## 示例

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
