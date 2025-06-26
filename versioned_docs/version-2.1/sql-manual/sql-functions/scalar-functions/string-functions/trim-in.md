---
{
    "title": "TRIM_IN",
    "language": "en"
}
---

## Description


When there is no `rhs` parameter, this function removes the leading and trailing spaces from the `str` string. When the `rhs` parameter is provided, it removes any characters from both ends of the string that are found in the `rhs` character set (order does not matter).

## Syntax

```sql

TRIM_IN( <str> [ , <rhs>])
```
## Required Parameters

| Parameters | Description |
|------|------|
| `<str>` | Delete spaces at both ends of the string |


## Optional Parameters

| Parameters | Description |
|------|------|
| `<rhs>` | Remove the specified character |

## Return Value
Delete spaces at both ends or the string after the specified character


Returns VARCHAR type, representing the processed string.

Special cases:
- If str is NULL, returns NULL
- If rhs is not specified, removes all leading and trailing spaces
- If rhs is specified, removes all characters from both ends that appear in rhs until encountering the first character not in rhs

## Examples

1. Remove spaces from both ends:
```sql

SELECT trim_in('   ab d   ') str;
```

```sql

+------+
| str  |
+------+
|  ab d|
+------+
```

```sql
SELECT trim_in('ababccaab','ab') str;
```

```sql

+------+
| str  |
+------+
| cc   |
+------+


```