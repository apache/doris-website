---
{
    "title": "INITCAP",
    "language": "en",
    "description": "The INITCAP function converts the first letter of each word in a string to uppercase and the remaining letters to lowercase."
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

5. Empty string
```sql
SELECT INITCAP('');
```
```text
+-------------+
| INITCAP('') |
+-------------+
|             |
+-------------+
```

6. Multiple non-alphanumeric separators
```sql
SELECT INITCAP('word1@word2#word3$word4');
```
```text
+------------------------------------+
| INITCAP('word1@word2#word3$word4') |
+------------------------------------+
| Word1@Word2#Word3$Word4            |
+------------------------------------+
```

7. UTF-8 multi-byte words
```sql
SELECT INITCAP('ṭṛì ḍḍumai hello');
```
```text
+--------------------------------------+
| INITCAP('ṭṛì ḍḍumai hello')          |
+--------------------------------------+
| Ṭṛì Ḍḍumai Hello                     |
+--------------------------------------+
```

8. Common name capitalization
```sql
SELECT INITCAP('john doe'), INITCAP('MARY JANE');
```
```text
+---------------------+----------------------+
| INITCAP('john doe') | INITCAP('MARY JANE') |
+---------------------+----------------------+
| John Doe            | Mary Jane            |
+---------------------+----------------------+
```

9. Sentences with mixed casing
```sql
SELECT INITCAP('the quick brown fox'), INITCAP('DATABASE management SYSTEM');
```
```text
+--------------------------------+---------------------------------------+
| INITCAP('the quick brown fox') | INITCAP('DATABASE management SYSTEM') |
+--------------------------------+---------------------------------------+
| The Quick Brown Fox            | Database Management System            |
+--------------------------------+---------------------------------------+
```

10. Multiple spaces and adjacent punctuation
```sql
SELECT INITCAP('word1   word2--word3'), INITCAP('hello, world! how are you?');
```
```text
+---------------------------------+---------------------------------------+
| INITCAP('word1   word2--word3') | INITCAP('hello, world! how are you?') |
+---------------------------------+---------------------------------------+
| Word1   Word2--Word3            | Hello, World! How Are You?            |
+---------------------------------+---------------------------------------+
```