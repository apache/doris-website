---
{
    "title": "FORMAT_NUMBER",
    "language": "en"
}
---

## Description

Returns a formatted string using a unit symbol, UNITS: "K", "M", "B", "T", "Q"

## Syntax

```sql
FORMAT_NUMBER(<val>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<val>` | The value is to be calculated with unit |  

## Return Value  

The formatted string using a unit symbol. 

## Example

```sql
SELECT format_number(123456.0);
```

```text
+-----------------------------------------+
| format_number(cast(123456.0 as DOUBLE)) |
+-----------------------------------------+
| 123K                                    |
+-----------------------------------------+
```

```sql
SELECT format_number(1000000.00);
```

```text
+-------------------------------------------+
| format_number(cast(1000000.00 as DOUBLE)) |
+-------------------------------------------+
| 1M                                        |
+-------------------------------------------+
```

```sql
select format_number(-1000000000000000);
```

```text
+--------------------------------------------------+
| format_number(cast(-1000000000000000 as DOUBLE)) |
+--------------------------------------------------+
| -1Q                                              |
+--------------------------------------------------+
```
