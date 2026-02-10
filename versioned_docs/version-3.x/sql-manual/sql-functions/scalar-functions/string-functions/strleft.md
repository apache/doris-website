---
{
    "title": "STRLEFT",
    "language": "en",
    "description": "The STRLEFT function returns a specified number of characters from the left side of a string. The length is measured in UTF8 characters."
}
---

## Description

The STRLEFT function returns a specified number of characters from the left side of a string. The length is measured in UTF8 characters.

## Alias

LEFT

## Syntax

```sql
STRLEFT(<str>, <len>)
```

## Parameters
| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| `<str>` | The string to extract from. Type: VARCHAR     |
| `<len>` | The number of characters to return. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- Returns NULL if any argument is NULL
- Returns empty string "" if len is less than or equal to 0
- Returns the entire string if len is greater than the string length

## Examples

1. Basic usage
```sql
SELECT strleft('Hello doris', 5);
```
```text
+---------------------------+
| strleft('Hello doris', 5) |
+---------------------------+
| Hello                     |
+---------------------------+
```

2. Handling negative length
```sql
SELECT strleft('Hello doris', -5);
```
```text
+----------------------------+
| strleft('Hello doris', -5) |
+----------------------------+
|                            |
+----------------------------+
```

3. Handling NULL parameter
```sql
SELECT strleft('Hello doris', NULL);
```
```text
+------------------------------+
| strleft('Hello doris', NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
```

4. Handling NULL string
```sql
SELECT strleft(NULL, 3);
```
```text
+------------------+
| strleft(NULL, 3) |
+------------------+
| NULL             |
+------------------+
```