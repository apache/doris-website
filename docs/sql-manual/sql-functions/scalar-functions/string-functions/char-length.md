---
{
    "title": "CHAR_LENGTH",
    "language": "en"
}
---

## Description

Calculates the length of a string. For multi-byte characters, returns the number of characters.

Currently only supports `utf8` encoding

## Alias

- CHARACTER_LENGTH

## Syntax

```sql
CHAR_LENGTH ( <str> )
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<str>`   | The string to calculate the length of |

## Return value

The length of the string <str>.

## Example

```sql
select CHAR_LENGTH("abc"),CHAR_LENGTH("中国")
```

```text
+-------------------------+----------------------------+
| character_length('abc') | character_length('中国')   |
+-------------------------+----------------------------+
|                       3 |                          2 |
+-------------------------+----------------------------+
```