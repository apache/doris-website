---
{
    "title": "LOCATE",
    "language": "en"
}
---

## Description

Returns the position of substr in str (counting from 1). If the third parameter pos is specified, the position of substr is searched from the string starting with the pos subscript. If not found, 0 is returned

## Syntax

```sql
LOCATE ( <substr> , <str> [, <pos> ] )
```

## Parameters

| Parameter | Description |
|-----------|-----------------|
| `substr`  | The substring to be searched |
| `str`     | The string to be searched |
| `pos`     | If this parameter is specified, the position of substr is searched from the string starting with the pos subscript|

## Return value

The position of substr in str (counting from 1)

## Example

```sql
SELECT LOCATE('bar', 'foobarbar'),LOCATE('xbar', 'foobar'),LOCATE('bar', 'foobarbar', 5)
```

```text
+----------------------------+--------------------------+-------------------------------+
| locate('bar', 'foobarbar') | locate('xbar', 'foobar') | locate('bar', 'foobarbar', 5) |
+----------------------------+--------------------------+-------------------------------+
|                          4 |                        0 |                             7 |
+----------------------------+--------------------------+-------------------------------+
```