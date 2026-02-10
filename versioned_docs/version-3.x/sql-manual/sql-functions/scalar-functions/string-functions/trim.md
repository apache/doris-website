---
{
    "title": "TRIM",
    "language": "en",
    "description": "This command is used to delete Spaces or specified characters at both ends of the string. If no rhs parameter is specified,"
}
---

## Description

This command is used to delete Spaces or specified characters at both ends of the string. If no rhs parameter is specified, delete the Spaces that appear continuously at the beginning of the right and left parts of str. Otherwise, delete rhs

## Syntax

```sql
TRIM( <str> [ , <rhs>])
```

## Required Parameters

| Parameters | Description |
|------|------|
| `<str>` | Deletes the Spaces  at both ends of the string


## Optional Parameters

| Parameters | Description |
|------|------|
| `<rhs>` | removes the specified character |

## Return Value

Deletes Spaces at both ends or the string after a specified character


## Example

```sql
SELECT trim('   ab d   ') str;
```

```sql
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT trim('ababccaab','ab') str;
```

```sql
+------+
| str  |
+------+
| cc   |
+------+
```
