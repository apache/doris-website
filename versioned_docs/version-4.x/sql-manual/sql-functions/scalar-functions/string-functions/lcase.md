---
{
    "title": "LCASE/LOWER",
    "language": "en",
    "description": "The LCASE function (alias LOWER) converts all uppercase letters in a string to lowercase."
}
---

## Description

The LCASE function (alias LOWER) converts all uppercase letters in a string to lowercase.

## Syntax

```sql
LCASE(<str>)
LOWER(<str>)
```

## Parameters

| Parameter | Description |
|---------|--------------|
| `<str>` | The string to convert to lowercase. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the string after conversion to lowercase.

Conversion rules:
- Converts all uppercase letters in the string to their corresponding lowercase letters
- Non-letter characters (numbers, symbols, spaces, etc.) remain unchanged
- Letters that are already lowercase remain unchanged

Special cases:
- If parameter is NULL, returns NULL
- If string is empty, returns empty string
- If string contains no uppercase letters, returns original string

## Examples

1. Basic English letter conversion
```sql
SELECT LOWER('AbC123'), LCASE('AbC123');
```
```text
+-----------------+-----------------+
| LOWER('AbC123') | LCASE('AbC123') |
+-----------------+-----------------+
| abc123          | abc123          |
+-----------------+-----------------+
```

2. Mixed character handling
```sql
SELECT LOWER('Hello World!'), LCASE('TEST@123');
```
```text
+----------------------+------------------+
| LOWER('Hello World!') | LCASE('TEST@123') |
+----------------------+------------------+
| hello world!         | test@123         |
+----------------------+------------------+
```

3. NULL value handling
```sql
SELECT LOWER(NULL), LCASE(NULL);
```
```text
+-------------+-------------+
| LOWER(NULL) | LCASE(NULL) |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```

4. Empty string
```sql
SELECT LOWER(''), LCASE('');
```
```text
+-----------+-----------+
| LOWER('') | LCASE('') |
+-----------+-----------+
|           |           |
+-----------+-----------+
```

5. String already lowercase or numeric-only
```sql
SELECT LOWER('already lowercase'), LCASE('abc123');
```
```text
+----------------------------+-----------------+
| LOWER('already lowercase') | LCASE('abc123') |
+----------------------------+-----------------+
| already lowercase          | abc123          |
+----------------------------+-----------------+
```

6. Non-alphabetic characters are passed through unchanged
```sql
SELECT LOWER('123!@#$%'), LCASE('PRICE: $99.99');
```
```text
+-------------------+------------------------+
| LOWER('123!@#$%') | LCASE('PRICE: $99.99') |
+-------------------+------------------------+
| 123!@#$%          | price: $99.99          |
+-------------------+------------------------+
```

7. UTF-8 multi-byte case folding
```sql
SELECT LOWER('ṬṚÌ TEST'), LCASE('ḌḌUMAI HELLO');
```
```text
+------------------------+---------------------------+
| LOWER('ṬṚÌ TEST')      | LCASE('ḌḌUMAI HELLO')     |
+------------------------+---------------------------+
| ṭṛì test               | ḍḍumai hello              |
+------------------------+---------------------------+
```
