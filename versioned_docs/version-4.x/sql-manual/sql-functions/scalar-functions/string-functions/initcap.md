---
{
    "title": "INITCAP",
    "language": "en"
}
---

## Description

The INITCAP function converts the first letter of each word in a string to uppercase and the remaining letters to lowercase. A word is defined as a sequence of alphanumeric characters separated by non-alphanumeric characters. This function is suitable for formatting names, titles, and other scenarios requiring standard case formatting.

## Syntax

```sql
INITCAP(<str>)
```

## Parameters

| Parameter | Description |
|---------|-----------|
| `<str>` | The string to convert case format. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the converted string.

Conversion rules:
- The first letter of each word is converted to uppercase
- Remaining letters in the word are converted to lowercase
- Words are separated by non-alphanumeric characters (spaces, punctuation, symbols, etc.)
- Numeric characters are not case-converted
- Supports Unicode character case conversion

Special cases:
- If parameter is NULL, returns NULL
- If string is empty, returns empty string
- Consecutive non-alphanumeric characters are treated as a single separator
- Letters at the beginning of the string are capitalized

## Examples

1. Basic word capitalization
```sql
SELECT INITCAP('hello world');
```
```text
+------------------------+
| INITCAP('hello world') |
+------------------------+
| Hello World            |
+------------------------+
```

2. Mixed case conversion
```sql
SELECT INITCAP('hELLo WoRLD');
```
```text
+------------------------+
| INITCAP('hELLo WoRLD') |
+------------------------+
| Hello World            |
+------------------------+
```

3. NULL value handling
```sql
SELECT INITCAP(NULL);
```
```text
+---------------+
| INITCAP(NULL) |
+---------------+
| NULL          |
+---------------+
```

4. String with numbers and symbols
```sql
SELECT INITCAP('hello hello.,HELLO123HELlo');
```
```text
+---------------------------------------+
| INITCAP('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,Hello123hello            |
+---------------------------------------+
```