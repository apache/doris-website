---
{
    "title": "Cast to int",
    "language": "en"
}
---

## From string

### Strict mode

If the source type is nullable, returns nullable type;

If the source type is non-nullable, returns non-nullable type;

#### BNF definition

```xml
<integer>       ::= <whitespace>* <sign>? <decimal_digit>+ <whitespace>*

<sign>          ::= "+" | "-"

<decimal_digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### Rule description

* Only supports decimal format numbers;

* Numbers can be prefixed with positive or negative sign characters;

* Strings allow arbitrary prefix and suffix whitespace characters, including: ' ', '\t', '\n', '\r', '\f', '\v';

* Does not support scientific notation;

* Return error for other formats;

* Return error if overflow.

#### Examples

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | With prefix and suffix whitespace       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | With prefix and suffix whitespace, negative sign |
| 'abc'                               | Error              | Invalid format                           |
| '123.456'                           | Error              | Decimal format not supported             |
| '1.23456e5'                         | Error              | Scientific notation not supported        |
| '2147483648'                        | Error              | Overflow                                 |
| '-2147483649'                       | Error              | Overflow                                 |

### Non-strict mode

Always returns nullable type.

#### BNF definition

```xml
<integer_non_strict> ::= <whitespace_char>* <sign>? <number> <whitespace_char>*

<sign>               ::= "+" | "-"

<number>             ::= <decimal_number> | <decimal_number> "." <decimal_number> | <decimal_number> "." | "." <decimal_number>

<decimal_number>     ::= <decimal_digit>+

<decimal_digit>      ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace_char>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### Rule description

* Supports all valid formats from strict mode;

* Supports strict mode format followed by decimal part, conversion result directly discards the decimal part;

* Scientific notation format converts to NULL;

* All other format cases convert to NULL;

* Converts to NULL when overflow occurs.

#### Examples

| String                              | Cast as int result | Comment                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | With prefix and suffix whitespace       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | With prefix and suffix whitespace, positive sign |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | With prefix and suffix whitespace, negative sign |
| '123.456'                           | 123                |                                          |
| '1.23456e5'                         | NULL               | Scientific notation                      |
| 'abc'                               | NULL               | Invalid format                           |
| '2147483648'                        | NULL               | Overflow                                 |
| '-2147483649'                       | NULL               | Overflow                                 |

## From bool

true converts to 1, false converts to 0.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

## From integer to integer

Supports conversion between any integer types.

### Strict mode

Return error when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | Error      | Overflow |
| -2147483649 | Error      | Overflow |

### Non-strict mode

Returns NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast bigint as int`), returns nullable type;

* Otherwise returns non-nullable type (e.g., `cast int as bigint`).

#### Examples

| Bigint      | int        | Comment |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | NULL       | Overflow |
| -2147483649 | NULL       | Overflow |

## From date

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

### Rule description

* Does not support casting to tinyint and smallint, as overflow will definitely occur.

* Supports casting to int, bigint and largeint. Concatenates the year, month, and day numbers of the date in order to form an integer, with month and day treated as two digits, padding with a leading 0 if less than 10.

### Examples

| date       | int      |
| ---------- | -------- |
| 2025-03-14 | 20250314 |

## From datetime

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

### Rule description

* Does not support casting to tinyint, smallint, int, as overflow will definitely occur;

* Supports casting to bigint, largeint. Discards the microsecond part of datetime, then concatenates year, month, day, hour, minute, second in order to form an integer, with month, day, hour, minute, second treated as two digits, padding with a leading 0 if less than 10.

### Examples

| datetime                   | int            |
| -------------------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 |
| 9999-12-31 23:59:59.999999 | 99991231235959 |

## From float/double

Does not support rounding.

### Strict mode

#### Rule description

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

* Return error when overflow occurs;

* Return error for Infinity and NaN values.

#### Examples

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | Truncation |
| 1.79769E308  | Error       | Overflow |
| Infinity     | Error       |         |
| NaN          | Error       |         |

### Non-strict mode

Always returns nullable type.

#### Rule description

* Converts to NULL when overflow occurs;

* Infinity converts to NULL;

* NaN converts to NULL.

#### Examples

| float/double | Cast as int | Comment |
| ------------ | ----------- | ------- |
| 1.5          | 1           | Truncation |
| 1.79769E308  | NULL        | Overflow |
| Infinity     | NULL        |         |
| -Infinity    | NULL        |         |
| NaN          | NULL        |         |

## From decimal

Does not support rounding.

### Strict mode

Return error when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Decimal(18, 6)  | int   | comment    |
| --------------- | ----- | ---------- |
| 1.654321        | 1     | Truncation |
| 12345678901.123 | Error | Overflow   |

### Non-strict mode

Converts to NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast decimal(18, 0) as int`), returns nullable type;

* Otherwise returns non-nullable type (e.g., `cast decimal(9, 0) as bigint`).

#### Examples

| Decimal(18, 6)  | int  | comment    |
| --------------- | ---- | ---------- |
| 1.654321        | 1    | Truncation |
| 12345678901.123 | NULL | Overflow   |

## From time

Converts to microseconds.

### Strict mode

Return error when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable, returns non-nullable type.

#### Examples

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | Error   | Overflow |

### Non-strict mode

Converts to NULL when overflow occurs.

If the source type is nullable, returns nullable type.

If the source type is non-nullable:

* If overflow is possible (e.g., `cast time as tinyint`), returns nullable type;

* Otherwise returns non-nullable type (e.g., `cast time as bigint`).

#### Examples

| Time      | int     | Comment |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | NULL    | Overflow |

## Other types

Not supported