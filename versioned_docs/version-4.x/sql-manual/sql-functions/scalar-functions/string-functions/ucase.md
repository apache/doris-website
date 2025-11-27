---
{
    "title": "UCASE/UPPER",
    "language": "en"
}
---

## Description

The UCASE function (alias UPPER) converts all lowercase letters in a string to uppercase letters. This function supports Unicode character conversion and can correctly handle case conversion rules for various languages.

## Syntax

```sql
UCASE(<str>)
UPPER(<str>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The string to convert to uppercase. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the string converted to uppercase letters.

Conversion rules:
- Converts all lowercase letters in the string to corresponding uppercase letters
- Non-letter characters (numbers, symbols, spaces, etc.) remain unchanged
- Letters already in uppercase remain unchanged

Special cases:
- Returns NULL if parameter is NULL
- Returns empty string if string is empty
- Returns original string if there are no lowercase letters

## Examples

1. Basic English letter conversion
```sql
SELECT UCASE('aBc123'), UPPER('aBc123');
```
```text
+-----------------+-----------------+
| UCASE('aBc123') | UPPER('aBc123') |
+-----------------+-----------------+
| ABC123          | ABC123          |
+-----------------+-----------------+
```

2. Mixed character handling
```sql
SELECT UCASE('Hello World!'), UPPER('test@123');
```
```text
+----------------------+------------------+
| UCASE('Hello World!') | UPPER('test@123') |
+----------------------+------------------+
| HELLO WORLD!         | TEST@123         |
+----------------------+------------------+
```

3. NULL value handling
```sql
SELECT UCASE(NULL), UPPER(NULL);
```
```text
+-------------+-------------+
| UCASE(NULL) | UPPER(NULL) |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```

4. Empty string handling
```sql
SELECT UCASE(''), UPPER('');
```
```text
+-----------+-----------+
| UCASE('') | UPPER('') |
+-----------+-----------+
|           |           |
+-----------+-----------+
```

5. Already uppercase string
```sql
SELECT UCASE('ALREADY UPPERCASE'), UPPER('ABC123');
```
```text
+---------------------------+----------------+
| UCASE('ALREADY UPPERCASE') | UPPER('ABC123') |
+---------------------------+----------------+
| ALREADY UPPERCASE         | ABC123         |
+---------------------------+----------------+
```

6. Numbers and symbols
```sql
SELECT UCASE('123!@#$%'), UPPER('price: $99.99');
```
```text
+-------------------+----------------------+
| UCASE('123!@#$%') | UPPER('price: $99.99') |
+-------------------+----------------------+
| 123!@#$%          | PRICE: $99.99        |
+-------------------+----------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT UCASE('ṭṛì test'), UPPER('ḍḍumai hello');
```
```text
+--------------------+-----------------------+
| UCASE('ṭṛì test')  | UPPER('ḍḍumai hello') |
+--------------------+-----------------------+
| ṬṚÌ TEST           | ḌḌUMAI HELLO          |
+--------------------+-----------------------+
```

8. Cyrillic letters
```sql
SELECT UCASE('Кириллица'), UPPER('Бәйтерек');
```
```text
+---------------------+-------------------+
| UCASE('Кириллица')  | UPPER('Бәйтерек') |
+---------------------+-------------------+
| КИРИЛЛИЦА           | БӘЙТЕРЕК          |
+---------------------+-------------------+
```

### Keywords

    UCASE, UPPER
