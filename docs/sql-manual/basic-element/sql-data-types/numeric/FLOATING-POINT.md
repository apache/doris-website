---
{
    "title": "Floating-Point Types (FLOAT and DOUBLE)",
    "language": "en"
}
---

## Description

Doris provides two floating-point data types: `FLOAT` and `DOUBLE`. These are variable-precision numeric types that follow the IEEE 754 standard for floating-point arithmetic.

| Type | Alias | Storage Size | Description |
|------|------|----------|------|
| FLOAT | FLOAT4, REAL | 4 bytes | Single-precision floating-point |
| DOUBLE | FLOAT8, DOUBLE PRECISION | 8 bytes | Double-precision floating-point |

## Value Range

### FLOAT

Doris uses IEEE-754 single-precision floating-point numbers, with a value range of:

- -∞ (-Infinity)
- [-3.402E+38, -1.175E-37]
- 0
- [1.175E-37, 3.402E+38]
- +∞ (+Infinity)
- NaN (Not a Number)

For more details, see [C++ float type](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types) and [Wikipedia Single-precision floating-point format](https://en.wikipedia.org/wiki/Single-precision_floating-point_format).

### DOUBLE

Doris uses IEEE-754 double-precision floating-point numbers, with a value range of:

- -∞ (-Infinity)
- [-1.79769E+308, -2.225E-307]
- 0
- [+2.225E-307, +1.79769E+308]
- +∞ (+Infinity)
- NaN (Not a Number)

For more details, see [C++ double type](https://en.cppreference.com/w/cpp/language/types.html#Standard_floating-point_types) and [Wikipedia Double-precision floating-point format](https://en.wikipedia.org/wiki/Double-precision_floating-point_format).

## Special Values

In addition to regular numeric values, floating-point types have several special values that conform to the IEEE 754 standard:

- `Infinity` or `Inf`: Positive infinity
- `-Infinity` or `-Inf`: Negative infinity
- `NaN`: Not a Number

These special values can be generated through CAST conversions:

```sql
mysql> select cast('NaN' as double), cast('inf' as double), cast('-Infinity' as double);
+-----------------------+-----------------------+-----------------------------+
| cast('NaN' as double) | cast('inf' as double) | cast('-Infinity' as double) |
+-----------------------+-----------------------+-----------------------------+
|                   NaN |              Infinity |                   -Infinity |
+-----------------------+-----------------------+-----------------------------+
```

Floating-point numbers also have a non-intuitive property: there are two different zero values, `+0` and `-0`.
While they are considered equal in most contexts, they differ in their sign bit:

```sql
mysql> select cast('+0.0' as double), cast('-0.0' as double);
+------------------------+------------------------+
| cast('+0.0' as double) | cast('-0.0' as double) |
+------------------------+------------------------+
|                      0 |                     -0 |
+------------------------+------------------------+
```

## Floating-Point Operations

### Arithmetic Operations

Doris floating-point numbers support common arithmetic operations like addition, subtraction, multiplication, and division.

It's important to note that Doris does not fully follow the IEEE 754 standard when handling division by 0 with floating-point numbers.

Doris follows PostgreSQL's implementation in this regard, returning SQL NULL instead of generating special values when dividing by 0:

| Expression | PostgreSQL | IEEE 754 | Doris |
|--------|------------|----------|-------|
| 1.0 / 0.0 | Error | Infinity | NULL |
| 0.0 / 0.0 | Error | NaN | NULL |
| -1.0 / 0.0 | Error | -Infinity | NULL |
| 'Infinity' / 'Infinity' | NaN | NaN | NaN |
| 1.0 / 'Infinity' | 0.0 | 0.0 | 0 |
| 'Infinity' - 'Infinity' | NaN | NaN | NaN |
| 'Infinity' - 1.0 | Infinity | Infinity | Infinity |

### Comparison Operations

The IEEE standard defines floating-point comparisons that differ from typical integer comparisons in important ways. For example, negative zero and positive zero are considered equal, and any NaN value is not equal to any other value (including itself). All finite floating-point numbers are strictly less than +∞ and strictly greater than -∞.

To ensure consistency and predictability of results, Doris handles NaN differently from the IEEE standard.
In Doris, NaN is considered greater than all other values (including Infinity):

```sql
mysql> select * from sort_float order by d;
+------+-----------+
| id   | d         |
+------+-----------+
|    5 | -Infinity |
|    2 |      -123 |
|    1 |       123 |
|    4 |  Infinity |
|    8 |       NaN |
|    9 |       NaN |
+------+-----------+
```

## Floating-Point Precision Issues

### Approximate Values and Precision Loss

Floating-point numbers are inherently approximate representations. This means that certain decimal values cannot be stored exactly in the binary representation of floating-point numbers and are instead stored as approximations. As a result, small discrepancies may occur during storage and retrieval.

For example:

```sql
mysql> SELECT CAST(1.3 AS FLOAT) - CAST(0.7 AS FLOAT) = CAST(0.6 AS FLOAT);
+--------------------------------------------------------------+
| CAST(1.3 AS FLOAT) - CAST(0.7 AS FLOAT) = CAST(0.6 AS FLOAT) |
+--------------------------------------------------------------+
|                                                            0 |
+--------------------------------------------------------------+
```

Due to floating-point representation errors, this may not evaluate to `TRUE` as expected.

### Operations Don't Follow Associative Law

Due to precision limitations in floating-point operations, the computational properties of floating-point numbers differ from theoretical mathematical operations. Floating-point addition and multiplication do not strictly follow the [associative and distributive laws](https://en.wikipedia.org/wiki/Floating-point_arithmetic#Accuracy_problems).

This leads to an important consequence: different computation orders may produce slightly different results.
Since Doris uses an MPP architecture and cannot guarantee the exact order of data processing, calculations involving floating-point numbers may produce slightly different results in different executions, even with identical input data.

#### Aggregate Functions

Performing aggregate functions on floating-point values may accumulate errors, especially when dealing with large datasets. When data contains extremely large or small values, these errors can be further amplified.
Due to the indeterminate calculation order, running the same aggregate function multiple times may yield different results when the data contains extreme values.

#### Join Operations

Similar to aggregate functions, it is not recommended to perform table joins on floating-point columns. Due to precision issues with floating-point numbers, two theoretically equal values might have slightly different internal representations, causing matches to fail.

### Floating-Point Output

When floating-point numbers are converted to strings, Doris follows these precision rules:
- Single-precision floating-point numbers (FLOAT) guarantee at least 7 significant digits
- Double-precision floating-point numbers (DOUBLE) guarantee at least 16 significant digits
Note that floating-point output may use scientific notation, so the length of a floating-point string representation is not necessarily equal to its number of significant digits:
```sql
mysql> select cast('1234567' as float) , cast('12345678' as float);
+--------------------------+---------------------------+
| cast('1234567' as float) | cast('12345678' as float) |
+--------------------------+---------------------------+
|                  1234567 |              1.234568e+07 |
+--------------------------+---------------------------+
```

## Best Practices

1. **Choose the appropriate data type**: For financial calculations or other scenarios requiring exact numeric values, use the `DECIMAL` type instead of floating-point types.

2. **Be cautious with equality comparisons**: Avoid directly comparing whether two floating-point values are equal, especially in JOIN operations.

3. **Be careful with string conversions**: Converting floating-point numbers to strings and back may introduce additional precision loss.

4. **Understand platform differences**: Different database systems may have subtle differences in handling floating-point operations, especially when dealing with special cases like NaN and Infinity (although most database systems broadly follow the IEEE standard).

5. **Round results appropriately for display**: When displaying floating-point calculation results, consider appropriate rounding to reduce precision issues for users.

## Keywords

FLOAT, FLOAT4, REAL, DOUBLE, DOUBLE PRECISION, FLOAT8, floating-point
