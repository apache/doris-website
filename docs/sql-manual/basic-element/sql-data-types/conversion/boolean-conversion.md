---
{
    "title": "Cast to BOOLEAN Type",
    "language": "en",
    "description": "The BOOLEAN type represents true or false values, with only two possible states: true value and false value."
}
---

The BOOLEAN type represents true or false values, with only two possible states: true value and false value.

## FROM String

:::caution Behavior Change
Previously, strings like '1.11' could be cast to boolean type 'true', starting from 4.0, they will be converted to null (in non-strict mode) or report an error (in strict mode).
Previously, values like 'on', 'off', 'yes', 'no' would be converted to null, starting from 4.0, they can be converted to their corresponding boolean values.
:::

### Strict Mode

#### BNF Definition

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### Rule Description

Boolean values can be in the following forms: 0, 1, yes, no, on, off, true, false, and are case insensitive. Additionally, boolean values can contain any number of whitespace characters before and after (including spaces, tabs, newlines, etc.).

For formats that do not conform, an error is reported.

#### Examples

| String | Cast as bool Result | Comment |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | With leading and trailing whitespace |
| "1.1" | Error | Invalid format |
| "YeS" | true | Case insensitive |
| '+0' | Error | Invalid format |

### Non-Strict Mode

#### BNF Definition

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### Rule Description

Boolean values can be in the following forms: 0, 1, yes, no, on, off, true, false, and are case insensitive. Additionally, boolean values can contain any number of whitespace characters before and after (including spaces, tabs, newlines, etc.).

For formats that do not conform, null is returned.

#### Examples

| String | Cast as bool Result | Comment |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | With leading and trailing whitespace |
| "1.1" | null | Invalid format |
| "YeS" | true | Case insensitive |
| '+0' | null | Invalid format |

## FROM Numeric

:::caution Behavior Change
Previously, non-numeric types like date/datetime were allowed to be converted to boolean type, starting from 4.0, this is not supported.
:::

### Strict Mode

#### Rule Description

For numeric types (int/double/decimal), non-zero values are considered true.

Positive and negative zeros in floating point numbers are converted to false.

#### Examples

| Numeric Type | Cast as bool Result | Comment |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | Positive zero in floating point |
| -0.0 | false | Negative zero in floating point |
| -1 | true | |
| 1 | true | |

### Non-Strict Mode

#### Rule Description

For numeric types (int/double/decimal), non-zero values are considered true.

Positive and negative zeros in floating point numbers are converted to false.

#### Examples

| Numeric Type | Cast as bool Result | Comment |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | Positive zero in floating point |
| -0.0 | false | Negative zero in floating point |
| -1 | true | |
| 1 | true | |
