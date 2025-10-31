---
{
    "title": "STRRIGHT",
    "language": "en"
}
---

## Description

The STRRIGHT function returns a specified number of characters from the right side of a string. The length is measured in UTF8 characters.

## Alias

RIGHT

## Syntax

```sql
STRRIGHT(<str>, <len>)
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
- If len is negative, returns the substring starting from the abs(len)th character from the right
- Returns the entire string if len is greater than the string length

## Examples

1. Basic usage
```sql
SELECT strright('Hello doris', 5);
```
```text
+----------------------------+
| strright('Hello doris', 5) |
+----------------------------+
| doris                      |
+----------------------------+
```

2. Handling negative length
```sql
SELECT strright('Hello doris', -7);
```
```text
+-----------------------------+
| strright('Hello doris', -7) |
+-----------------------------+
| doris                       |
+-----------------------------+
```

3. Handling NULL parameter
```sql
SELECT strright('Hello doris', NULL);
```
```text
+-------------------------------+
| strright('Hello doris', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```

4. Handling NULL string
```sql
SELECT strright(NULL, 5);
```
```text
+-------------------+
| strright(NULL, 5) |
+-------------------+
| NULL              |
+-------------------+
```