---
{
    "title": "FLOAT",
    "language": "zh-CN"
}
---

## FLOAT
## 描述
    FLOAT
    4字节单精度浮点数。

## 取值范围

Doris使用IEEE-754单精度浮点数，取值范围：

- -∞（负无穷大， -Infinity）
- [-3.402E+38, -1.175E-37]
- 0
- [1.175E-37, 3.402E+38]
- +∞（正无穷大， +Infinity）
- NaN（Not a Number）

详情参见[C++ float 类型](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types)和[Wikipedia单精度浮点数](https://en.wikipedia.org/wiki/Single-precision_floating-point_format)。

## 示例

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
