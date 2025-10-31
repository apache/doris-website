---
{
    "title": "ROUND_BANKERS",
    "language": "en"
}
---

## Description

Round x using the banker's rounding method and keep d decimal places. The default value of d is 0.

If d is negative, the |d| digits to the left of the decimal point will be set to 0.

If x or d is null, return null.

If d represents a column and the first parameter is of the Decimal type, then the resulting Decimal will have the same number of decimal places as the input Decimal.

According to the rules of the banker's rounding algorithm, when rounding to a specified decimal place:

- If the digit to be rounded is 5 and there are no other non - zero digits following it, the digit immediately preceding it will be checked:
   - If the preceding digit is even, the 5 will be simply dropped.
   - If the preceding digit is odd, the number will be rounded up.

- If the digit to be rounded is greater than 5 or there are non - zero digits following it, the traditional rounding rules will apply: round up if the digit is greater than or equal to 5, otherwise round down.

For example:

- For the value 2.5, since the digit 2 before 5 is even, the result will be rounded to 2.

- For the value 3.5, since the digit 3 before 5 is odd, the result will be rounded to 4.

- For the value 2.51, since the digit after 5 is not 0, it will be rounded up directly, and the result is 3.

## Syntax

```sql
ROUND_BANKERS(<x> [ , <d>])
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>` | The number to be rounded |
| `<d>` | Optional, the number of decimal places to round to, with a default value of 0. |

## Return value

Returns an integer or a float-point number:

- By default, when the parameter d = 0, it returns an integer obtained by calculating x using the banker's rounding algorithm.

- If d is negative, it returns an integer with the first digit to the left of the decimal point being 0.

- If both x and d are NULL, it returns NULL.

- If d represents a column and x is of the Decimal type, it returns a floating-point number with the same precision.

## Example

```sql
select round_bankers(0.4);
```

```text
+--------------------+
| round_bankers(0.4) |
+--------------------+
|                  0 |
+--------------------+
```

```sql
select round_bankers(-3.5);
```

```text
+---------------------+
| round_bankers(-3.5) |
+---------------------+
|                  -4 |
+---------------------+
```

```sql
select round_bankers(-3.4);
```

```text
+---------------------+
| round_bankers(-3.4) |
+---------------------+
|                  -3 |
+---------------------+
```

```sql
select round_bankers(10.755, 2);
```

```text
+--------------------------+
| round_bankers(10.755, 2) |
+--------------------------+
|                    10.76 |
+--------------------------+
```

```sql
select round_bankers(10.745, 2);
```

```text
+--------------------------+
| round_bankers(10.745, 2) |
+--------------------------+
|                    10.74 |
+--------------------------+
```

```sql
select round_bankers(1667.2725, -2);
```

```text
+------------------------------+
| round_bankers(1667.2725, -2) |
+------------------------------+
|                         1700 |
+------------------------------+
```

```sql
SELECT number
, round_bankers(number * 2.5, number - 1) AS rb_decimal_column
, round_bankers(number * 2.5, 0) AS rb_decimal_literal
, round_bankers(cast(number * 2.5 AS DOUBLE), number - 1) AS rb_double_column
, round_bankers(cast(number * 2.5 AS DOUBLE), 0) AS rb_double_literal
FROM test_enhanced_round
WHERE rid = 1;
```

```text
+--------+-------------------+--------------------+------------------+-------------------+
| number | rb_decimal_column | rb_decimal_literal | rb_double_column | rb_double_literal |
+--------+-------------------+--------------------+------------------+-------------------+
|      1 |               2.0 |                  2 |                2 |                 2 |
+--------+-------------------+--------------------+------------------+-------------------+
```