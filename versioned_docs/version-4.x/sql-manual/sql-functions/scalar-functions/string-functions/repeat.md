---
{
    "title": "REPEAT",
    "language": "en"
}
---

## Description

The REPEAT function is used to repeat a specified string a specified number of times to generate a new string. This function is commonly used for generating padding characters, creating separators, or generating test data.

## Syntax

```sql
REPEAT(<str>, <count>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The source string to repeat. Type: VARCHAR |
| `<count>` | The number of times to repeat, must be a non-negative integer. Type: INT |

## Return Value

Returns VARCHAR type, representing the string repeated the specified number of times.

Repeat rules:
- When count is greater than 0, returns the result of str repeated count times
- When count equals 0, returns an empty string
- When count is less than 0, returns an empty string
- If the resulting string is too long, it may be subject to string length limitations

Special cases:
- If any parameter is NULL, returns NULL
- If str is an empty string, returns an empty string regardless of count
- If count is 0, returns an empty string
- If count is negative, returns an empty string

## Examples

1. Basic character repetition
```sql
SELECT REPEAT('a', 3);
```
```text
+----------------+
| REPEAT('a', 3) |
+----------------+
| aaa            |
+----------------+
```

2. Multi-character string repetition
```sql
SELECT REPEAT('hello', 2);
```
```text
+--------------------+
| REPEAT('hello', 2) |
+--------------------+
| hellohello         |
+--------------------+
```

3. Zero repetitions
```sql
SELECT REPEAT('test', 0);
```
```text
+-------------------+
| REPEAT('test', 0) |
+-------------------+
|                   |
+-------------------+
```

4. Negative repetitions
```sql
SELECT REPEAT('a', -1);
```
```text
+-----------------+
| REPEAT('a', -1) |
+-----------------+
|                 |
+-----------------+
```

5. NULL value handling
```sql
SELECT REPEAT(NULL, 3), REPEAT('a', NULL);
```
```text
+------------------+-------------------+
| REPEAT(NULL, 3)  | REPEAT('a', NULL) |
+------------------+-------------------+
| NULL             | NULL              |
+------------------+-------------------+
```

6. Empty string repetition
```sql
SELECT REPEAT('', 5);
```
```text
+----------------+
| REPEAT('', 5)  |
+----------------+
|                |
+----------------+
```

7. Special character repetition
```sql
SELECT REPEAT('-', 10), REPEAT('*', 5);
```
```text
+------------------+-----------------+
| REPEAT('-', 10)  | REPEAT('*', 5)  |
+------------------+-----------------+
| ----------       | *****           |
+------------------+-----------------+
```

8. UTF-8 character repetition
```sql
SELECT REPEAT('ṭṛì', 3), REPEAT('ḍḍu', 2);
```
```text
+-------------------+-------------------+
| REPEAT('ṭṛì', 3)  | REPEAT('ḍḍu', 2)  |
+-------------------+-------------------+
| ṭṛìṭṛìṭṛì          | ḍḍuḍḍu            |
+-------------------+-------------------+
```

9. Mixed numbers and symbols
```sql
SELECT REPEAT('123', 3), REPEAT('@#', 4);
```
```text
+-------------------+------------------+
| REPEAT('123', 3)  | REPEAT('@#', 4)  |
+-------------------+------------------+
| 123123123         | @#@#@#@#         |
+-------------------+------------------+
```

10. UTF-8 character repetition
```sql
SELECT REPEAT('ṭṛìṭṛì', 3);
```
```text
+--------------------------------------------------+
| REPEAT('ṭṛìṭṛì', 3)                              |
+--------------------------------------------------+
| ṭṛìṭṛìṭṛìṭṛìṭṛìṭṛì                               |
+--------------------------------------------------+
```

## Description

The REPEAT function is used to repeat a string a specified number of times.

## Syntax

```sql
REPEAT( <str>, <count> )
```

## Parameters

| Parameter | Description                                                                                                               |
|-----------|---------------------------------------------------------------------------------------------------------------------------|
| `<str>`   | The string to be repeated.                                                                                                |
| `<count>` | The number of times to repeat. It must be a non-negative integer. If it is less than 1, an empty string will be returned. |

## Return Value

Returns the string repeated the specified number of times. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT repeat("a", 3);
```

```text
+----------------+
| repeat('a', 3) |
+----------------+
| aaa            |
+----------------+
```

```sql
SELECT repeat("a", -1);
```

```text
+-----------------+
| repeat('a', -1) |
+-----------------+
|                 |
+-----------------+
```
