---
{
    "title": "Cast to DECIMAL Type",
    "language": "en"
}
---

## From string

### Strict mode

If the source type is nullable, returns nullable type;

If the source type is non-nullable, returns non-nullable type;

#### BNF definition

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>?

<sign>        ::= "+" | "-"

<significand> ::= <digits> "." <digits> | <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```

#### Rule description

* Only supports decimal digits;

* Supports scientific notation;

* Supports rounding;

* Strings allow arbitrary prefix and suffix whitespace characters, including: " ", "\t", "\n", "\r", "\f", "\v".

* Return error when integer part overflows;

* Return error for invalid format.

#### Examples

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | Rounding                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | With prefix and suffix whitespace       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | With prefix and suffix whitespace, negative sign |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | Scientific notation                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | Scientific notation with positive exponent |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | Scientific notation with negative exponent |
| "123.456a"                        | Error          | Invalid format                           |
| "1234567890123.123456"            | Error          | Overflow                                 |

### Non-strict mode

Always returns nullable type;

#### BNF definition

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```

#### Rule description

* Supports all valid formats from strict mode;

* Converts to NULL when overflow occurs;

* Converts to NULL for invalid format.

#### Examples

| String                            | Decimal(18, 6) | Comment                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | Rounding                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | With prefix and suffix whitespace       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | With prefix and suffix whitespace, negative sign |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | Scientific notation                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | Scientific notation with positive exponent |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | Scientific notation with negative exponent |
| "123.456a"                        | NULL           | Invalid format                           |
| "1234567890123.123456"            | NULL           | Overflow                                 |

## From bool

true converts to 1, false converts to 0.

### Strict mode

Error when overflow occurs (e.g., `cast bool as decimal(1, 1)`).

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

### Non-strict mode

Converts to NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast bool as decimal(1, 1)`), returns nullable type;

* Otherwise returns non-nullable type.

## From integer

### Strict mode

Error when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | Error          | Overflow |

### Non-strict mode

Converts to NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast int as decimal(1, 0)`), returns nullable type;

* Otherwise returns non-nullable type (e.g., `cast int as decimal(18, 0)`).

#### Examples

| int        | Decimal(18, 9) | Comment |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | NULL           | Overflow |

## From float/double

Supports rounding.

### Strict mode

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

* Infinity and NaN cause errors.

* Error when overflow occurs.

#### Examples

| float/double | Decimal(18, 3) | Comment |
| ------------ | -------------- | ------- |
| 1.1239       | 1.124          | Rounding |
| 3.40282e+38  | Error          | Overflow |
| Infinity     | Error          |         |
| NaN          | Error          |         |

### Non-strict mode

Always returns nullable type.

* +/-Inf converts to NULL;

* NaN converts to NULL;

* Converts to NULL when overflow occurs.

#### Examples

| float/double | Decimal(18, 6) | Comment |
| ------------ | -------------- | ------- |
| 1.123456     | 1.123456       |         |
| 3.40282e+38  | NULL           | Overflow |
| Infinity     | NULL           |         |
| NaN          | NULL           |         |

## Cast between decimals

Supports rounding.

### Strict mode

Error when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | Rounding |
| 12345.12345678 | Error          | Integer part overflow |

### Non-strict mode

Converts to NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast decimal(18, 0) as decimal(9, 0)`), returns nullable type;

* Otherwise returns non-nullable type (e.g., `cast decimal(9, 0) as decimal(18, 0)`).

#### Examples

| Decimal(18, 8) | Decimal(10, 6) | Comment |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | Rounding |
| 12345.12345678 | NULL           | Integer part overflow |

## From date

Not supported.

## From datetime

Not supported.

## From time

Not supported.

## From other types

Not supported
