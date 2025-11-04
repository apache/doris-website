---
{
    "title": "POSITION",
    "language": "en"
}
---

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
