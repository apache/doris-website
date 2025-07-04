---
{
    "title": "LPAD",
    "language": "en"
}
---

## Description

Returns a string of length len (starting from the first letter) in str.

If len is greater than the length of str, pad characters are added to the front of str until the length of the string reaches len.

If len is less than the length of str, this function is equivalent to truncating the str string and returning only a string of length len. len refers to the character length rather than the byte length.

Special cases:

- In addition to containing NULL values, if pad is empty, the return value is an empty string.

## Syntax

```sql
LPAD ( <str> , <len> , <pad>)
```

## Parameters

| Parameters | Description |
|------------|------------------------------|
| `<str>`    | The string to be padded |
| `<len>`    | The length of the string to be padded, which refers to the length of characters rather than bytes |
| `<pad>`    | The string to be padded on the left of the original string |

## Return value

The padded string. Special cases:

- If pad is empty, the return value is an empty string, except when it contains NULL values.

## Example

```sql
SELECT LPAD("hi", 5, "xy"),LPAD("hi", 1, "xy"),LPAD("", 0, "")
```

```text
+---------------------+---------------------+-----------------+
| lpad('hi', 5, 'xy') | lpad('hi', 1, 'xy') | lpad('', 0, '') |
+---------------------+---------------------+-----------------+
| xyxhi               | h                   |                 |
+---------------------+---------------------+-----------------+
```