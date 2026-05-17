---
{
    "title": "SUBSTRING",
    "language": "en",
    "description": "The SUBSTRING function is used to extract a substring from a string. You can specify the starting position and length,"
}
---

## Description

The SUBSTRING function is used to extract a substring from a string. You can specify the starting position and length, supporting both forward and backward extraction. The position of the first character in the string is 1.

## Alias

SUBSTR

MID

## Syntax

```sql
SUBSTRING(<str>, <pos> [, <len>])

SUBSTRING(<str> FROM <pos> [FOR <len>])
```

## Parameters
| Parameter | Description                                      |
| --------- | ------------------------------------------------ |
| `<str>` | Source string. Type: VARCHAR                     |
| `<pos>` | Starting position, can be negative. Type: INT    |
| `<len>` | Optional parameter, length to extract. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- If any parameter is NULL, returns NULL
- If pos is 0, returns an empty string
- If pos is negative, counts from the end of the string backwards
- If pos exceeds the string length, returns an empty string
- If len is not specified, returns all characters from pos to the end of the string

## Examples

1. Basic usage (specify starting position)
```sql
SELECT substring('abc1', 2);
```
```text
+-----------------------------+
| substring('abc1', 2)        |
+-----------------------------+
| bc1                         |
+-----------------------------+
```

2. Using negative position
```sql
SELECT substring('abc1', -2);
```
```text
+-----------------------------+
| substring('abc1', -2)       |
+-----------------------------+
| c1                          |
+-----------------------------+
```

3. Case when position is 0
```sql
SELECT substring('abc1', 0);
```
```text
+----------------------+
| substring('abc1', 0) |
+----------------------+
|                      |
+----------------------+
```

4. Position exceeds string length
```sql
SELECT substring('abc1', 5);
```
```text
+-----------------------------+
| substring('abc1', 5)        |
+-----------------------------+
|                             |
+-----------------------------+
```

5. Specifying length parameter
```sql
SELECT substring('abc1def', 2, 2);
```
```text
+-----------------------------+
| substring('abc1def', 2, 2)  |
+-----------------------------+
| bc                          |
+-----------------------------+
```

6. Using from and for
```sql
SELECT substring('foobarbar' FROM 4 FOR 3);
```
```text
+-------------------------------------+
| substring('foobarbar' FROM 4 FOR 3) |
+-------------------------------------+
| bar                                 |
+-------------------------------------+
```

7. Using from
```sql
SELECT substring('foobarbar' FROM 4);
```
```text
+-------------------------------+
| substring('foobarbar' FROM 4) |
+-------------------------------+
| barbar                        |
+-------------------------------+
```

8. NULL example with alias MID
```sql
SELECT MID(NULL, 2);
```
```text
+--------------+
| MID(NULL, 2) |
+--------------+
| NULL         |
+--------------+
```

9. Using alias SUBSTR
```sql
SELECT SUBSTR('Hello World', 7, 5);
```
```text
+------------------------------+
| SUBSTR('Hello World', 7, 5)  |
+------------------------------+
| World                        |
+------------------------------+
```

10. UTF-8 multi-byte characters
```sql
SELECT SUBSTRING('ṭṛì ḍḍumai hello', 5, 6);
```
```text
+--------------------------------------+
| SUBSTRING('ṭṛì ḍḍumai hello', 5, 6)  |
+--------------------------------------+
| ḍḍumai                               |
+--------------------------------------+
```

### Keywords

    SUBSTRING, SUBSTR, MID