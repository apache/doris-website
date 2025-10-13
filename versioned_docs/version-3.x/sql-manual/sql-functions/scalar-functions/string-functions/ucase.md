---
{
    "title": "UCASE/UPPER",
    "language": "en"
}
---

## Description

Used to convert a string to uppercase letters

## Syntax

```sql
UCASE( <str> )
UPPER( <str> )
```

## Required Parameters
| Parameters | Description |
|------|------|
| `<str>` | The string to convert to uppercase

## Return Value

The value after converting the uppercase

## Example

```sql
SELECT UCASE("aBc123"),UPPER("aBc123");
```
```sql
+-----------------+-----------------+
| UCASE("aBc123") | UPPER("aBc123") |
+-----------------+-----------------+
| ABC123          | ABC123          |
+-----------------+-----------------+
```

```sql
SELECT UCASE("Кириллица"),UPPER("Бәйтерек");
```
```sql
+-----------------------------+---------------------------+
| UCASE("Кириллица")          | UPPER("Бәйтерек")         |
+-----------------------------+---------------------------+
| КИРИЛЛИЦА                   | БӘЙТЕРЕК                  |
+-----------------------------+---------------------------+
```