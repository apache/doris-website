---
{
    "title": "RTRIM",
    "language": "en",
    "description": "The RTRIM function is used to remove consecutive spaces or specified strings from the right side (trailing) of a string."
}
---

## Description

The RTRIM function is used to remove consecutive spaces or specified strings from the right side (trailing) of a string. If the second parameter is not specified, trailing spaces are removed; if specified, the function removes the specified complete string from the right side.

## Syntax

```sql
RTRIM(<str>[, <rhs>])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<str>` | The string to be processed. Type: VARCHAR |
| `<rhs>` | Optional parameter, trailing characters to be trimmed. Type: VARCHAR |

## Return Value

Returns a value of type VARCHAR.

Special cases:
- If any parameter is NULL, NULL is returned
- If rhs is not specified, removes trailing spaces
- If rhs is specified, removes the complete rhs string (not character-by-character)

## Examples

1. Remove trailing spaces
```sql
SELECT rtrim('ab d   ') str;
```
```text
+------+
| str  |
+------+
| ab d |
+------+
```

2. Remove specified trailing string
```sql
SELECT rtrim('ababccaab', 'ab') str;
```
```text
+---------+
| str     |
+---------+
| ababcca |
+---------+
```

3. UTF-8 character support
```sql
SELECT rtrim('ṭṛì ḍḍumai   ');
```
```text
+---------------------------+
| rtrim('ṭṛì ḍḍumai   ')    |
+---------------------------+
| ṭṛì ḍḍumai                |
+---------------------------+
```

4. No matching suffix, return original string
```sql
SELECT rtrim('Hello World', 'xyz');
```
```text
+---------------------------------+
| rtrim('Hello World', 'xyz')     |
+---------------------------------+
| Hello World                     |
+---------------------------------+
```

5. NULL value handling
```sql
SELECT rtrim(NULL), rtrim('Hello', NULL);
```
```text
+-------------+------------------------+
| rtrim(NULL) | rtrim('Hello', NULL)   |
+-------------+------------------------+
| NULL        | NULL                   |
+-------------+------------------------+
```

6. Empty string handling
```sql
SELECT rtrim(''), rtrim('abc', '');
```
```text
+-----------+-------------------+
| rtrim('') | rtrim('abc', '')  |
+-----------+-------------------+
|           | abc               |
+-----------+-------------------+
```

7. Repeated trailing pattern removal
```sql
SELECT rtrim('abcabcabc', 'abc');
```
```text
+-------------------------------+
| rtrim('abcabcabc', 'abc')     |
+-------------------------------+
|                               |
+-------------------------------+
```

8. Multiple occurrences, remove only trailing match
```sql
SELECT rtrim('HelloHelloWorld', 'Hello');
```
```text
+---------------------------------------+
| rtrim('HelloHelloWorld', 'Hello')     |
+---------------------------------------+
| HelloHelloWorld                       |
+---------------------------------------+
```

### Keywords

    RTRIM
