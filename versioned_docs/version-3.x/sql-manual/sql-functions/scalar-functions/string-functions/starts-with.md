---
{
    "title": "STARTS_WITH",
    "language": "en",
    "description": "The STARTSWITH function checks if a string starts with a specified prefix. Returns true if the string starts with the specified prefix;"
}
---

## Description

The STARTS_WITH function checks if a string starts with a specified prefix. Returns true if the string starts with the specified prefix; otherwise returns false.

## Syntax

```sql
STARTS_WITH(<str>, <prefix>)
```

## Parameters
| Parameter | Description                               |
| --------- | ----------------------------------------- |
| `<str>` | The string to check. Type: VARCHAR        |
| `<prefix>` | The prefix string to match. Type: VARCHAR |

## Return Value

Returns BOOLEAN type.

Special cases:
- Returns NULL if any argument is NULL

## Examples

1. Successful match
```sql
SELECT starts_with('hello world', 'hello');
```
```text
+-------------------------------------+
| starts_with('hello world', 'hello') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

2. Failed match
```sql
SELECT starts_with('hello world', 'world');
```
```text
+-------------------------------------+
| starts_with('hello world', 'world') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```