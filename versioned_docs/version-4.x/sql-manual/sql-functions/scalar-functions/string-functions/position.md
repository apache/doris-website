---
{
    "title": "POSITION",
    "language": "en",
    "description": "The POSITION function is used to find the position of a substring in a main string, with positions counting from 1."
}
---

## Description

The POSITION function is used to find the position of a substring in a main string, with positions counting from 1.

## Syntax

```sql
POSITION(<substr> IN <str>)

POSITION(<substr>, <str> [, <pos>])
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------------- |
| `substr` | The substring to search for. Type: VARCHAR |
| `str`    | The main string to search within. Type: VARCHAR |
| `pos`    | Optional parameter specifying the starting position (from 1). If specified, search starts from this position |

## Return Value

Returns INT type, representing the position of the first occurrence of the substring in the main string.

Search rules:
- Returns position index starting from 1
- If substring is not found, returns 0
- If a starting position is specified, searches from that position
- Search is case-sensitive

Special cases:
- If any parameter is NULL, returns NULL
- If substring is an empty string, returns 1 (or the starting position)
- If starting position exceeds string length, returns 0
- If starting position is negative, searches from the beginning of the string

## Examples

1. Basic search (two syntax forms)
```sql
SELECT POSITION('bar' IN 'foobarbar'), POSITION('bar', 'foobarbar');
```
```text
+----------------------------------+--------------------------------+
| POSITION('bar' IN 'foobarbar')   | POSITION('bar', 'foobarbar')   |
+----------------------------------+--------------------------------+
|                                4 |                              4 |
+----------------------------------+--------------------------------+
```

2. Search with starting position
```sql
SELECT POSITION('bar', 'foobarbar', 5), POSITION('xbar', 'foobar');
```
```text
+-----------------------------------+----------------------------------+
| POSITION('bar', 'foobarbar', 5)   | POSITION('xbar', 'foobar')       |
+-----------------------------------+----------------------------------+
|                                 7 |                                0 |
+-----------------------------------+----------------------------------+
```

3. NULL value handling
```sql
SELECT POSITION('test' IN NULL), POSITION(NULL, 'test');
```
```text
+--------------------------+------------------------+
| POSITION('test' IN NULL) | POSITION(NULL, 'test') |
+--------------------------+------------------------+
| NULL                     | NULL                   |
+--------------------------+------------------------+
```

4. Empty string handling
```sql
SELECT POSITION('' IN 'hello'), POSITION('world' IN '');
```
```text
+------------------------+------------------------+
| POSITION('' IN 'hello') | POSITION('world' IN '') |
+------------------------+------------------------+
|                      1 |                      0 |
+------------------------+------------------------+
```

5. Case-sensitive search
```sql
SELECT POSITION('World' IN 'Hello World'), POSITION('world' IN 'Hello World');
```
```text
+----------------------------------+----------------------------------+
| POSITION('World' IN 'Hello World') | POSITION('world' IN 'Hello World') |
+----------------------------------+----------------------------------+
|                                7 |                                0 |
+----------------------------------+----------------------------------+
```

6. Search from different positions
```sql
SELECT POSITION('a', 'banana', 1), POSITION('a', 'banana', 3);
```
```text
+-----------------------------+-----------------------------+
| POSITION('a', 'banana', 1)  | POSITION('a', 'banana', 3)  |
+-----------------------------+-----------------------------+
|                           2 |                           4 |
+-----------------------------+-----------------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT POSITION('ḍḍumai' IN 'ṭṛì ḍḍumai hello'), POSITION('hello', 'ṭṛì ḍḍumai hello', 8);
```
```text
+--------------------------------------+-------------------------------------------+
| POSITION('ḍḍumai' IN 'ṭṛì ḍḍumai hello') | POSITION('hello', 'ṭṛì ḍḍumai hello', 8) |
+--------------------------------------+-------------------------------------------+
|                                    5 |                                        13 |
+--------------------------------------+-------------------------------------------+
```

8. Special character search
```sql
SELECT POSITION('@' IN 'user@domain.com'), POSITION('.', 'user@domain.com', 10);
```
```text
+----------------------------------+--------------------------------------+
| POSITION('@' IN 'user@domain.com') | POSITION('.', 'user@domain.com', 10) |
+----------------------------------+--------------------------------------+
|                                5 |                                   12 |
+----------------------------------+--------------------------------------+
```

9. Starting position beyond bounds
```sql
SELECT POSITION('test', 'hello world', 20), POSITION('test', 'hello world', 0);
```
```text
+--------------------------------------+-------------------------------------+
| POSITION('test', 'hello world', 20)  | POSITION('test', 'hello world', 0)  |
+--------------------------------------+-------------------------------------+
|                                   0 |                                   0 |
+--------------------------------------+-------------------------------------+
```

10. Search in numbers and symbols
```sql
SELECT POSITION('123' IN '456123789'), POSITION('-', 'phone: 123-456-7890', 11);
```
```text
+------------------------------+-------------------------------------------+
| POSITION('123' IN '456123789') | POSITION('-', 'phone: 123-456-7890', 11) |
+------------------------------+-------------------------------------------+
|                            4 |                                        11 |
+------------------------------+-------------------------------------------+
```

## Description

The POSITION function is used to find the position of a substring within a string (counting from 1).  

If the substring is not found, the function returns 0.

## Syntax

```sql
POSITION ( <substr> IN <str> )

POSITION ( <substr>, <str> [, <pos>] )
```

## Parameters

| Parameter | Description                                                                                |
| --------- | ------------------------------------------------------------------------------------------ |
| `substr`  | The substring to search for                                                                |
| `str`     | The string to be searched                                                                  |
| `pos`     | If this parameter is specified, the position of substr is searched from the string starting with the pos subscript |

## Return value

The position of substr in str (counting from 1).
If substr is not found, returns 0.

```sql
SELECT POSITION('bar' IN 'foobarbar'), 
       POSITION('bar', 'foobarbar'),
       POSITION('bar', 'foobarbar', 5),
       POSITION('xbar', 'foobar');
```

```text

+----------------------------------+--------------------------------+-----------------------------------+----------------------------------+
| position('bar' in 'foobarbar')   | position('bar', 'foobarbar')   | position('bar', 'foobarbar', 5)   | position('xbar', 'foobar')       |
+----------------------------------+--------------------------------+-----------------------------------+----------------------------------+
|                                4 |                              4 |                                 7 |                                0 |
+----------------------------------+--------------------------------+-----------------------------------+----------------------------------+
```
