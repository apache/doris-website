---
{
    "title": "FORMAT_NUMBER",
    "language": "en",
    "description": "The FORMATNUMBER function formats numerical values into strings with unit symbols. Supported units are: K (thousand), M (million), B (billion),"
}
---

## Description

The FORMAT_NUMBER function formats numerical values into strings with unit symbols. Supported units are: K (thousand), M (million), B (billion), T (trillion), Q (quadrillion).

## Syntax

```sql
FORMAT_NUMBER(<val>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<val>` | The numerical value to be formatted. Type: DOUBLE |

## Return Value

Returns VARCHAR type, representing the formatted string with unit symbol.

Special cases:
- If the parameter is NULL, returns NULL
- Numbers less than 1000 are returned directly without units
- Unit conversion rules:
  - K: thousand (1,000)
  - M: million (1,000,000)
  - B: billion (1,000,000,000)
  - T: trillion (1,000,000,000,000)
  - Q: quadrillion (1,000,000,000,000,000)

## Examples

1. Basic usage: thousand (K)
```sql
SELECT format_number(1500);
```
```text
+---------------------+
| format_number(1500) |
+---------------------+
| 1.50K               |
+---------------------+
```

2. Million (M)
```sql
SELECT format_number(5000000);
```
```text
+------------------------+
| format_number(5000000) |
+------------------------+
| 5.00M                  |
+------------------------+
```

3. Numbers less than thousand
```sql
SELECT format_number(999);
```
```text
+----------------------------------+
| format_number(cast(999 as DOUBLE))|
+----------------------------------+
| 999                              |
+----------------------------------+
```

4. NULL value handling
```sql
SELECT format_number(NULL);
```
```text
+---------------------+
| format_number(NULL) |
+---------------------+
| NULL                |
+---------------------+
```
