---
{
    "title": "LCASE/LOWER",
    "language": "en",
    "description": "Convert all strings in the parameter to lowercase."
}
---

## Description

Convert all strings in the parameter to lowercase.

## Alias

- LOWER

## Syntax

```sql
LCASE ( <str> )
LOWER ( <str> )
```

## Parameters

| Parameter | Description |
|-----------|--------------|
| `<str>`   | String to be converted to lowercase |

## Return Value

Parameter `<str>` String converted to lowercase

## Example

```sql
SELECT LCASE("AbC123"),LOWER("AbC123")
```

```text
+-----------------+-----------------+
| lower('AbC123') | lower('AbC123') |
+-----------------+-----------------+
| abc123          | abc123          |
+-----------------+-----------------+
```

```sql
SELECT LOWER("ҚAZAҚ123"),LCASE("ҒАРЫШ");
```

```text
+---------------------+---------------------+
| LOWER("ҚAZAҚ123")   | LCASE("ҒАРЫШ")      |
+---------------------+---------------------+
| қazaқ123            | ғарыш               |
+---------------------+---------------------+
```
