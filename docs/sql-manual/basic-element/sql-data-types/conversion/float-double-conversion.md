---
{
    "title": "Convert to FLOAT/DOUBLE",
    "language": "en",
    "description": ":::caution Behavior Change Since version 4.0, the result of overflow is no longer NULL, but +/-Infinity. :::"
}
---

## From string

:::caution Behavior Change
Since version 4.0, the result of overflow is no longer NULL, but +/-Infinity.
:::

### Strict mode

If the source type is nullable, returns nullable type;

If the source type is non-nullable, returns non-nullable type;

#### BNF definition

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```

#### Rule description

* Only supports decimal format numbers;

* Supports scientific notation;

* Numbers can be prefixed with positive or negative sign characters;

* Strings allow arbitrary prefix and suffix whitespace characters, including: " ", "\t", "\n", "\r", "\f", "\v";

* Supports Infinity and NaN;

* Return error for other formats;

* Overflow converts to +|-Infinity.

#### Examples

| String                              | float/double | Comment                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "123456."                           | 123456       |                                          |
| "123456"                            | 123456       |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | With prefix and suffix whitespace       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | With prefix and suffix whitespace, negative sign |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | Scientific notation                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v"   | 123400       | Scientific notation with positive exponent |
| " \t\r\n\f\v+1.23456e-1 \t\r\n\f\v" | 0.123456     | Scientific notation with negative exponent |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | Error        | Invalid format                           |
| "1.7e409"                           | Infinity     | Overflow                                 |
| "-1.7e409"                          | -Infinity    | Overflow                                 |

### Non-strict mode

Always returns nullable type.

#### BNF definition

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```

#### Rule description

* Supports all valid formats from strict mode;

* Invalid format converts to NULL;

* Overflow converts to +|-Infinity.

#### Examples

| String                              | float/double | Comment                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "12345."                            | 12345        |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | With prefix and suffix whitespace       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | With prefix and suffix whitespace, negative sign |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | Scientific notation                      |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | NULL         | Invalid format                           |
| "1.7e409"                           | Infinity     | Overflow                                 |
| "-1.7e409"                          | -Infinity    | Overflow                                 |

## From bool

true converts to 1, false converts to 0.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

## From integer

Follows C++ static cast semantics. May lose precision.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

## From float to double

Follows C++ static cast semantics.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

## From double to float

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

### Rule description

* Follows C++ static cast semantics.

* Overflow converts to +-Infinity.

### Examples

| double        | float     | Comment |
| ------------- | --------- | ------- |
| 1.79769e+308  | Infinity  | Overflow |
| -1.79769e+308 | -Infinity | Overflow |

## From decimal to float

Casting Decimal type to float may lose precision.

Doris's `Decimal(p, s)` type is actually represented by an integer in memory, where the integer value equals `Decimal actual value * 10^s`. For example, a `Decimal(10, 6)` value `1234.56789` is represented by integer value `1234567890` in memory.

When converting Decimal type to float or double type, Doris actually performs the following operation: `static_cast<float>(integer value in memory) / (10^scale)`.

### Strict mode

Converts to Infinity if overflow.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Decimal(76, 6)                                                                | float     | Comment                              |
| ----------------------------------------------------------------------------- | --------- | ------------------------------------ |
| 123456789.012345                                                              | 123456790 | Casting to float will lose precision |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | Overflow                             |

### Non-strict mode

Converts to Infinity if overflow.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Decimal(76, 6)                                                                | float     | Comment                              |
| ----------------------------------------------------------------------------- | --------- | ------------------------------------ |
| 123456789.012345                                                              | 123456790 | Casting to float will lose precision |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | Overflow                             |

## From decimal to double

Currently, Decimal type can have at most 76 significant digits. Casting to double type does not have overflow issues, only precision loss issues.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

### Examples

| Decimal(76, 6)                                                                | double             | Comment                                                      |
| ----------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| 123456789.012345                                                              | 123456789.012345   | 15 significant digits, casting to double will not lose precision |
| 12345678901.012345                                                            | 12345678901.012344 | 17 significant digits, casting to double will lose precision |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | 1e+70              | Will lose precision                                          |

## From date to float

### Strict mode

Return error.

### Non-strict mode

Concatenates the year, month, and day numbers of the date in order to form an integer, with month and day treated as two digits, padding with a leading 0 if less than 10. Then static_cast this integer to float, which may lose precision.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| date       | float    | Comment        |
| ---------- | -------- | -------------- |
| 2025-04-21 | 20250420 | Precision loss |

## From date to double

### Strict mode

Return error.

### Non-strict mode

Concatenates the year, month, and day numbers of the date in order to form an integer, with month and day treated as two digits, padding with a leading 0 if less than 10. Then static_cast this integer to double.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| date       | double   | Comment                               |
| ---------- | -------- | ------------------------------------- |
| 2025-04-21 | 20250421 | 8 significant digits, no precision loss |

## From datetime to float

### Strict mode

Return error.

### Non-strict mode

Discards the microsecond part of datetime, then concatenates the year, month, day, hour, minute, and second in order to form an integer, with month, day, hour, minute, and second treated as two digits, padding with a leading 0 if less than 10. Then static_cast this integer to float, which may lose precision.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| datetime                   | float          | Comment        |
| -------------------------- | -------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 | Precision loss |
| 9999-12-31 23:59:59.999999 | 99991231235959 | Precision loss |

## From datetime to double

### Strict mode

Return error.

### Non-strict mode

Discards the microsecond part of datetime, then concatenates the year, month, day, hour, minute, and second in order to form an integer, with month, day, hour, minute, and second treated as two digits, padding with a leading 0 if less than 10. Then static_cast this integer to double.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| datetime                   | double          | Comment                                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| 2025-03-14 17:00:01.123456 |  20250314170001 | 14 significant digits, no precision loss        |
| 9999-12-31 23:59:59.999999 |  99991231235959 |                                                 |

## From time

### Strict mode

Return error.

### Non-strict mode

Converts to float/double number in microseconds.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Time             | float         | Comment |
| ---------------- | ------------- | ------- |
| 00:00:01         | 1000000       |         |
| 838:59:58        | 3020398000000 |         |
| 838:59:58.123456 | 3020398123456 |         |

## From other types

Not supported.