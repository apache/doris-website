---
{
    "title": "ELT",
    "language": "en"
}
---

## Description

Returns a string at the specified index. Special cases:

- If there is no string at the specified index, NULL is returned.

## Syntax

```sql
ELT ( <pos> , <str> [ , <str> ] )
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<pos>`   | Specified index value |
| `<str>`   | String to be indexed |

## Return value

Parameter `<str>` String to be indexed. Special cases:

- If there is no string at the specified index, NULL is returned.

## Example

```sql
SELECT ELT(1, 'aaa', 'bbb'),ELT(2, 'aaa', 'bbb'), ELT(0, 'aaa', 'bbb'),ELT(2, 'aaa', 'bbb')
```

```text
+----------------------+----------------------+----------------------+----------------------+
| elt(1, 'aaa', 'bbb') | elt(2, 'aaa', 'bbb') | elt(0, 'aaa', 'bbb') | elt(2, 'aaa', 'bbb') |
+----------------------+----------------------+----------------------+----------------------+
| aaa                  | bbb                  | NULL                 | bbb                  |
+----------------------+----------------------+----------------------+----------------------+
```