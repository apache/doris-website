---
{
    "title": "UCASE",
    "language": "en"
}
---

## Description

Used to convert a string to uppercase letters
## Alias

- UPPER

## Syntax

```sql
UCASE( <str> )
```

## Required Parameters
| Parameters | Description |
|------|------|
| `<str>` | The string to convert to uppercase

## Return Value

The value after converting the uppercase

## Example

```sql
SELECT ucase("aBc123");
```
```sql
+-----------------+
| ucase('aBc123') |
+-----------------+
| ABC123          |
+-----------------+
```
