---
{
    "title": "LPAD",
    "language": "en",
    "description": "The LPAD function (Left Padding) pads a string on the left side with specified characters until it reaches the specified length."
}
---

## Description

The LPAD function (Left Padding) pads a string on the left side with specified characters until it reaches the specified length. If the target length is less than the original string length, the string is truncated.

## Syntax

```sql
LPAD(<str>, <len>, <pad>)
```

## Parameters

| Parameter | Description |
|---------|------------------------------|
| `<str>` | The source string to be padded. Type: VARCHAR |
| `<len>` | Target string character length (not byte length). Type: INT |
| `<pad>` | The string used for padding. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the padded or truncated string.

Padding rules:
- If len > original string length: Repeatedly pad on the left with pad string until total length reaches len
- If len = original string length: Return original string
- If len < original string length: Truncate string, return only first len characters
- Calculated by character length, supports UTF-8 multi-byte characters

Special cases:
- If any parameter is NULL, returns NULL
- If pad is empty string and len > str length, returns empty string
- If len is 0, returns empty string
- If len is negative, returns NULL

## Examples

1. Basic left padding
```sql
SELECT LPAD('hi', 5, 'xy'), LPAD('hello', 8, '*');
```
```text
+---------------------+-----------------------+
| LPAD('hi', 5, 'xy') | LPAD('hello', 8, '*') |
+---------------------+-----------------------+
| xyxhi               | ***hello              |
+---------------------+-----------------------+
```

2. String truncation
```sql
SELECT LPAD('hi', 1, 'xy'), LPAD('hello world', 5, 'x');
```
```text
+---------------------+------------------------------+
| LPAD('hi', 1, 'xy') | LPAD('hello world', 5, 'x')  |
+---------------------+------------------------------+
| h                   | hello                        |
+---------------------+------------------------------+
```

3. NULL value handling
```sql
SELECT LPAD(NULL, 5, 'x'), LPAD('hi', NULL, 'x'), LPAD('hi', 5, NULL);
```
```text
+---------------------+------------------------+----------------------+
| LPAD(NULL, 5, 'x')  | LPAD('hi', NULL, 'x')  | LPAD('hi', 5, NULL)  |
+---------------------+------------------------+----------------------+
| NULL                | NULL                   | NULL                 |
+---------------------+------------------------+----------------------+
```