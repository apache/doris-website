---
{
    "title": "TRIM",
    "language": "en",
    "description": "The TRIM function is used to remove consecutive spaces or specified strings from both ends of a string. If the second parameter is not specified,"
}
---

## Description

The TRIM function is used to remove consecutive spaces or specified strings from both ends of a string. If the second parameter is not specified, leading and trailing spaces are removed; if specified, the function removes the specified complete string from both ends.

## Syntax

```sql
TRIM(<str>[, <rhs>])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<str>` | The string to be processed. Type: VARCHAR |
| `<rhs>` | Optional parameter, characters to be trimmed from both ends. Type: VARCHAR |

## Return Value

Returns a value of type VARCHAR.

Special cases:
- If any parameter is NULL, NULL is returned
- If rhs is not specified, removes leading and trailing spaces
- If rhs is specified, removes the complete rhs string from both ends (not character-by-character)

## Examples

1. Remove leading and trailing spaces
```sql
SELECT trim('   ab d   ') str;
```
```text
+------+
| str  |
+------+
| ab d |
+------+
```

2. Remove specified strings from both ends
```sql
SELECT trim('ababccaab', 'ab') str;
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
SELECT trim('   ṭṛì ḍḍumai   ');
```
```text
+------------------------------+
| trim('   ṭṛì ḍḍumai   ')     |
+------------------------------+
| ṭṛì ḍḍumai                   |
+------------------------------+
```

4. No matching prefix/suffix, return original string
```sql
SELECT trim('Hello World', 'xyz');
```
```text
+--------------------------------+
| trim('Hello World', 'xyz')     |
+--------------------------------+
| Hello World                    |
+--------------------------------+
```

5. NULL value handling
```sql
SELECT trim(NULL), trim('Hello', NULL);
```
```text
+------------+-----------------------+
| trim(NULL) | trim('Hello', NULL)   |
+------------+-----------------------+
| NULL       | NULL                  |
+------------+-----------------------+
```

6. Empty string handling
```sql
SELECT trim(''), trim('abc', '');
```
```text
+----------+------------------+
| trim('') | trim('abc', '')  |
+----------+------------------+
|          | abc              |
+----------+------------------+
```

7. Repeated pattern removal from both ends
```sql
SELECT trim('abcabcabc', 'abc');
```
```text
+------------------------------+
| trim('abcabcabc', 'abc')     |
+------------------------------+
|                              |
+------------------------------+
```

8. Asymmetric removal
```sql
SELECT trim('abcHelloabc', 'abc');
```
```text
+--------------------------------+
| trim('abcHelloabc', 'abc')     |
+--------------------------------+
| Hello                          |
+--------------------------------+
```

### Keywords

    TRIM
