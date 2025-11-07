---
{
    "title": "LOCATE",
    "language": "en"
}
---

## Description

The LOCATE function returns the position of the first occurrence of substring substr in string str (counting starts from 1). If an optional third parameter pos is specified, the search starts from the specified position in string str. This is a MySQL-compatible function commonly used for string matching and position finding.

## Syntax

```sql
LOCATE(<substr>, <str> [, <pos>])
```

## Parameters

| Parameter | Description |
|----------|-----------------|
| `<substr>` | The target substring to find. Type: VARCHAR |
| `<str>`    | The source string to search in. Type: VARCHAR |
| `<pos>`    | Optional parameter, the starting position for the search (counting from 1). Type: INT |

## Return Value

Returns INT type, representing the position of the first occurrence of substr in str (counting from 1).

Search rules:
- Position counting starts from 1 (not from 0)
- Returns the position of the first match
- If pos is specified, search starts from that position, but the returned position is still the absolute position relative to the string beginning
- Search is case-sensitive

Special cases:
- If no match is found, returns 0
- If any parameter is NULL, returns NULL
- If substr is an empty string, returns 1 (or the value of pos if pos is specified and pos > 1)
- If str is empty but substr is not, returns 0
- If pos is less than 1, returns 0
- If pos is greater than the length of str, returns 0

## Examples

1. Basic search
```sql
SELECT LOCATE('bar', 'foobarbar'), LOCATE('xbar', 'foobar'), LOCATE('bar', 'foobarbar', 5);
```
```text
+----------------------------+--------------------------+-------------------------------+
| LOCATE('bar', 'foobarbar') | LOCATE('xbar', 'foobar') | LOCATE('bar', 'foobarbar', 5) |
+----------------------------+--------------------------+-------------------------------+
|                          4 |                        0 |                             7 |
+----------------------------+--------------------------+-------------------------------+
```

2. Finding first character
```sql
SELECT LOCATE('f', 'foobar'), LOCATE('r', 'foobar');
```
```text
+-----------------------+-----------------------+
| LOCATE('f', 'foobar') | LOCATE('r', 'foobar') |
+-----------------------+-----------------------+
|                     1 |                     6 |
+-----------------------+-----------------------+
```

3. No match found
```sql
SELECT LOCATE('xyz', 'foobar'), LOCATE('FOO', 'foobar');
```
```text
+-------------------------+-------------------------+
| LOCATE('xyz', 'foobar') | LOCATE('FOO', 'foobar') |
+-------------------------+-------------------------+
|                       0 |                       0 |
+-------------------------+-------------------------+
```