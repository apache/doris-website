---
{
    "title": "Pattern Matching Operators",
    "language": "en",
    "description": "Pattern matching operators are used to compare character-type data."
}
---

## Description

Pattern matching operators are used to compare character-type data.

## Operator Introduction

| Operator | Function | Example |
| ----------------------------------- | ------------------------------------------------------------ | --------------------------- |
| `<char1> [NOT] LIKE <char2>` | If `<char1>` does not match the pattern `<char2>`, it is TRUE. In `<char2>`, the character `%` matches any zero or multiple characters (except for an empty string). The character `_` matches any single character. If there is an escape character before the wildcard character, it is treated as a literal character. | `SELECT 'ABCD' LIKE '%C_'` |
| `<char1> [NOT] {REGEXP \| RLIKE} <char2>` | If `<char1>` does not match the pattern `<char2>`, it is TRUE. For the specific rules of regular expressions, please refer to the subsequent REGEXP section. | `SELECT 'ABCD' REGEXP 'A.*D'` |

### LIKE

The LIKE condition specifies a test involving pattern matching. The equality comparison operator (`=`) precisely matches one character value to another character value, while the LIKE condition matches a part of one character value with another character value by searching for the pattern specified in the second value within the first value.

The syntax is as follows:

```sql
<char1> [ NOT ] LIKE <char2> [ ESCAPE 'char_escape' ]
```

Where:

- `char1` is a character expression (such as a character column), known as the search value.
- `char2` is a character expression, usually a string literal, known as the pattern.
- `char_escape` (optional) is a character expression and must be a character of length 1 (under ascii encoding). It allows you to define escape characters, and if you do not provide char_escape, the default ' \ ' is an escape character.

Both character expressions (`char1`, `char2`) can be any of CHAR, VARCHAR, or STRING data types. If they are different, Doris will convert them all to VARCHAR or STRING.

Patterns can include special pattern matching characters:

- The underscore (`_`) in the pattern matches exactly one character in the value.
- The percent sign (`%`) in the pattern can match zero or multiple characters in the value. The pattern `%` cannot match NULL.

### Example


```sql
select "%a" like "\%_";
```

The result is as follows, because "%" is a special character, it needs to be escaped with "\%" to match correctly.

```text
+-----------------+
| "%a" like "\%_" |
+-----------------+
|               1 |
+-----------------+
```


```sql
select "%a" like "a%_" ESCAPE "a";
```

The difference from the previous example is that "a" is specified as the escape character.

```text
+----------------------------+
| "%a" like "a%_" ESCAPE "a" |
+----------------------------+
|                          1 |
+----------------------------+
```


### REGEXP (RLIKE)

REGEXP is similar to the LIKE condition, differing in that REGEXP performs regular expression matching, rather than the simple pattern matching performed by LIKE. This condition uses a set of input characters defined by a character to evaluate strings.

The syntax is as follows:

```sql
<char1> [ NOT ] { REGEXP | RLIKE } <char2>
```

Where:

- `char1` is a character expression (such as a character column), known as the search value.
- `char2` is a character expression, usually a string literal, known as the pattern.

Both character expressions (`char1`, `char2`) can be any of CHAR, VARCHAR, or STRING data types. If they are different, Doris will convert them all to VARCHAR or STRING.