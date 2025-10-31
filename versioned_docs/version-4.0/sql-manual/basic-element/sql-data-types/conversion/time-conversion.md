---
{
    "title": "Cast to TIME Type",
    "language": "en"
}
---

Valid range for TIME type is `[-838:59:59.999999, 838:59:59.999999]`.

TIME type includes a type parameter `p`, which represents the number of decimal places. The complete representation is `TIME(p)` type. For example, TIME(6) represents a TIME type that supports microsecond precision.

## FROM String

:::caution Behavior Change
Starting from version 4.0, TIME type parsing only supports the formats described in this document and no longer attempts secondary conversion through rules allowed by the Datetime type.
:::

### Strict Mode

#### BNF Definition

```xml
<time> ::= ("+" | "-")? (<colon-format> | <numeric-format>)

<colon-format> ::= <hour> ":" <minute> (":" <second> (<microsecond>)?)?
<hour> ::= <digit>+
<minute> ::= <digit>{1,2}
<second> ::= <digit>{1,2}

<numeric-format> ::= <digit>+ (<microsecond>)?

<microsecond> ::= "." <digit>*

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
```

#### Rule Description

##### Overall Structure

Two formats are supported: `<colon-format>` and `<numeric-format>`.

* First is an optional plus or minus sign, representing the sign of the result.

* `<colon-format>` includes in sequence:

  * `<hour>`: 0-23. At least one digit, and must not exceed the INT range.

  * `<minute>`: 0-59. One or two digits, with a separator `:` required between it and `<hour>`.

  * `<second>`: **Optional**. 0-59. One or two digits, with a separator `:` required between it and `<minute>`. Default value is 0.

  * `<microsecond>`: **Optional**, starts with `.` followed by any number of digits. Default value is 0.

* `<numeric-format>` includes in sequence:

  * A string of consecutive digits, treated as continuous hour, minute, and second fields. Right-aligned, meaning the ones place of the input aligns with the seconds place of the result, then filled in sequence to the left. For example, the thousands place of the input aligns with the tens of minutes place of the result.

  * Optional decimal part same as the `<microsecond>` field. Digits exceeding `p` will be rounded to `p` decimal places.

##### Error Handling

* **Format Error**: If it does not conform to any of the BNF branches above, an error is reported immediately.

* **Domain Error**: If the result is not a valid time, or exceeds the TIME type domain, an error is reported.

#### Examples

| String               | Cast as TIME(6) Result  | Comment               |
| ----------------- | ------------------- | --------------------- |
| `1`               | `00:00:01.000000`   | Ones place aligned to seconds place               |
| `123`             | `00:01:23.000000`   | Ones place aligned to seconds place, extending left          |
| `2005959.12`      | `200:59:59.120000`  | Decimal input                  |
| `0.12`            | `00:00:00.120000`   | Numeric format 0 time input + decimal      |
| `00:00:00.12`     | `00:00:00.120000`   | Separated format 0 time input + decimal      |
| `123.`            | `00:01:23.000000`   | Decimal allows 0 digits              |
| `123.0`           | `00:01:23.000000`   | Decimal 1 digit 0              |
| `123.123`         | `00:01:23.123000`   | Valid decimal                 |
| `-1`              | `-00:00:01.000000`  | Negative input                  |
| `12-34:56.1`      | Error (format error)            | '-' is not a valid separator           |
| `12 : 34 : 56`    | Error (format error)            | Invalid whitespace                 |
| `76`              | Error (domain error)            | 76 seconds is invalid               |
| `200595912`       | Error (domain error)            | 20059 hours is invalid           |
| `8385959.9999999` | Error (domain error)            | Carry over exceeds upper limit               |

### Non-Strict Mode

:::caution Behavior Change
Starting from 4.0, DECIMAL type is converted according to its literal value representation. Supports parsing `<microsecond>` field to microseconds. Any format exceeding the boundary is considered an error and handled accordingly.
:::

Non-strict mode supports leading and trailing spaces, and error handling is different from strict mode.

#### BNF Definition

```xml
<time> ::= <whitespace>* ("+" | "-")? (<colon-format> | <numeric-format>) <whitespace>*

<colon-format> ::= <hour> ":" <minute> (":" <second> (<microsecond>)?)?
<hour> ::= <digit>+
<minute> ::= <digit>{1,2}
<second> ::= <digit>{1,2}

<numeric-format> ::= <digit>+ (<microsecond>)?

<microsecond> ::= "." <digit>*

<digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
<whitespace> ::= " " | "\t" | "\n" | "\r" | "\v" | "\f"
```

#### Rule Description

##### Overall Structure

Two formats are supported: `<colon-format>` and `<numeric-format>`.

* An optional sign, representing the sign of the time.

* `<colon-format>` includes:

  * `<hour>`: 0-23. At least one digit, not exceeding the INT range.

  * `<minute>`: 0-59. One or two digits, separated by `:`.

  * `<second>`: Optional. 0-59. One or two digits, separated by `:`.

  * `<microsecond>`: Optional. Starts with `.`, followed by any number of digits.

* `<numeric-format>` includes:

  * A string of consecutive digits, treated as continuous hour, minute, and second fields. The rightmost digit aligns with the second field, and the rest are filled in from right to left.

  * An optional decimal part, same as `<microsecond>`. Excess digits are rounded to the specified `p` decimal places.

##### Error Handling

* **Format Error**: Does not match either BNF branch, returns NULL.

* **Domain Error**: The result is not a valid time or exceeds the TIME type range, returns NULL.

#### Examples

| Input String          | Cast as TIME(6) Result | Comment               |
| ----------------- | ------------------- | --------------------- |
| `1`               | `00:00:01.000000`   | Rightmost digit aligns with seconds |
| `123`             | `00:01:23.000000`   | Rightmost digit aligns with seconds, filling in from right to left |
| `2005959.12`      | `200:59:59.120000`  | Decimal input                  |
| `0.12`            | `00:00:00.120000`   | Numeric format 0 time input + decimal |
| `00:00:00.12`     | `00:00:00.120000`   | Colon format 0 time input + decimal |
| `123.`            | `00:01:23.000000`   | Decimal allows 0 digits              |
| `123.0`           | `00:01:23.000000`   | Decimal 1 digit 0              |
| `123.123`         | `00:01:23.123000`   | Valid decimal                 |
| `-1`              | `-00:00:01.000000`  | Negative input                  |
| `-800:05:05`      | `-800:05:05.000000` | 3-digit hour, negative              |
| `-991213.56`      | `-99:12:13.560000`  | Negative input                  |
| `80302.9999999`   | `08:03:03.000000`   | Decimal exceeds 6 digits, carries over |
| `5656.3000000009` | `00:56:56.300000`   | Discarded low decimal digits          |
| `5656.3000007001` | `00:56:56.300001`   | Rounding to microseconds               |
| `    1    `       | NULL            | Invalid format, BNF does not match whitespace |
| `.123`            | NULL            | No field before decimal point |
| `:12:34`          | NULL            | Missing hour                   |
| `12-34:56.1`      | NULL            | '-' is not a valid separator           |
| `12 : 34 : 56`    | NULL            | Invalid whitespace                 |
| `76`              | NULL            | 76 seconds is invalid               |
| `200595912`       | NULL            | 20059 hours is invalid           |
| `8385959.9999999` | NULL            | Carry over exceeds upper limit               |

## From Numeric

All numeric types can be converted to TIME type.

:::caution Behavior Change
Starting from version 4.0, Doris supports parsing the decimal part and supports converting any numeric type to Time type.
:::

### Strict Mode

#### Rule Description

##### Valid Formats

For integer digits, numbers are filled from the lowest to the highest digit, from the rightmost end of the date to the left. The following are valid formats and their corresponding filling results (excluding the microseconds part):

```sql
1-digit number(a)         00:00:0a
2-digit number(ab)        00:00:ab
3-digit number(abc)       00:0a:bc
4-digit number(abcd)      00:ab:cd
5-digit number(abcde)     0a:bc:de
6-digit number(abcdef)    ab:cd:ef
7-digit number(abcdefg)   abc:de:fg
```

For decimal places, digits are filled from the highest to the lowest digit, from the leftmost end after the decimal point (hundred milliseconds place) to the right. If the decimal is a non-exact representation type (float, double), we will use its actual value before the Cast directly. Digits exceeding `p` positions will be rounded to `p` decimal places.

If the input is negative, the result is the parsed value with the sign reversed.

##### Error Handling

When the input cannot be parsed into a valid TIME value according to the rules, an error is reported.

#### Examples

| Number         | Cast as TIME(3) Result | Comment     |
| ---------- | ------------------ | ----------- |
| `123456`   | `12:34:56.000`     |             |
| `-123456`  | `-12:34:56.000`    |             |
| `123`      | `00:01:23.000`     |             |
| `6.99999`  | `00:00:07.000`     |             |
| `-0.99`    | `-00:00:00.990`    |             |
| `8501212`  | `850:12:12.000`    |             |
| `20001212` | Error                 | Length out of range        |
| `9000000`  | Error                 | Hour 900 exceeds upper limit |
| `67`       | Error                 | Second 67 is invalid    |

### Non-strict Mode

Except for error handling, the behavior in non-strict mode is entirely consistent with strict mode.

#### Rule Description

##### Valid Formats

For integer digits, numbers are filled from the lowest to the highest digit, from the rightmost end of the time to the left. The following are valid formats and their corresponding filling results (excluding the microseconds part):

```sql
1-digit number(a)         00:00:0a
2-digit number(ab)        00:00:ab
3-digit number(abc)       00:0a:bc
4-digit number(abcd)      00:ab:cd
5-digit number(abcde)     0a:bc:de
6-digit number(abcdef)    ab:cd:ef
7-digit number(abcdefg)   abc:de:fg
```

For the decimal part, the number is filled from high to low, from the leftmost end of the date after the decimal point (hundred milliseconds place). If the decimal is an imprecise representation type (float, double), we will use the actual value it represents before the Cast.

If the input is negative, the result is the parsed value with the sign reversed.

##### Error Handling

When the input cannot be parsed into a valid TIME value according to the rules, NULL is returned.

#### Examples

| Number         | Cast as TIME(3) Result | Comment     |
| ---------- | ------------------ | ----------- |
| `123456`   | `12:34:56.000`     |             |
| `-123456`  | `-12:34:56.000`    |             |
| `123`      | `00:01:23.000`     |             |
| `6.99999`  | `00:00:07.000`     |             |
| `-0.99`    | `-00:00:00.990`    |             |
| `8501212`  | `850:12:12.000`    |             |
| `20001212` | NULL               | Length out of range        |
| `9000000`  | NULL               | Hour 900 exceeds upper limit |
| `67`       | NULL               | Second 67 is invalid    |

## From Datelike Types

### From Datetime

:::caution Behavior Change
Starting from version 4.0, conversion from Datetime type to Time type is supported.
:::

The result is the time part of the input, and this conversion is always valid.

#### Examples

| Input DATETIME                  | Cast as TIME(4) Result |
| ---------------------------- | ------------------ |
| `2012-02-05 12:12:12.123456` | `12:12:12.1235`    |

### From Time

#### Strict Mode

##### Rule Description

When converting from lower precision to higher precision, the newly appearing decimal places are filled with 0, and this conversion is always valid.

When converting from higher precision to lower precision, there will be a carry forward, which can continue to propagate forward. If an overflow occurs, the converted value is invalid.

##### Error Handling

If an overflow occurs, an error is reported.

##### Examples

Assume the current date is 2025-04-29, then:

| Input TIME            | Source Type     | Target Type    | Result TIME           | Comment        |
| ------------------ | ------- | ------- | ----------------- | -------------- |
| `00:00:00.123`     | TIME(3) | TIME(6) | `00:00:00.123000` | Expanded precision           |
| `00:00:00.123456`  | TIME(6) | TIME(3) | `00:00:00.123`    | Reduced precision, no carry       |
| `120:00:00.99666`  | TIME(6) | TIME(2) | `120:00:01.00`    | Reduced precision, carries to seconds      |
| `838:59:59.999999` | TIME(6) | TIME(5) | Error                | Carry overflow, produces invalid TIME |

#### Non-Strict Mode

Except for error handling, the behavior in non-strict mode is entirely consistent with strict mode.

##### Rule Description

When converting from lower precision to higher precision, the newly appearing decimal places are filled with 0, and this conversion is always valid.

When converting from higher precision to lower precision, there will be a carry forward, which can continue to propagate forward. If an overflow occurs, the converted value is invalid.

##### Error Handling

If an overflow occurs, NULL is returned.

##### Examples

| Input TIME            | Source Type     | Target Type    | Result TIME           | Comment              |
| ------------------ | ------- | ------- | ----------------- | -------------------- |
| `00:00:00.123`     | TIME(3) | TIME(6) | `00:00:00.123000` | Expanded precision                 |
| `00:00:00.123456`  | TIME(6) | TIME(3) | `00:00:00.123`    | Reduced precision, no carry             |
| `120:00:00.99666`  | TIME(6) | TIME(2) | `120:00:01.00`    | Reduced precision, carries to seconds            |
| `838:59:59.999999` | TIME(6) | TIME(5) | NULL                | Carry overflow, produces invalid TIME |
