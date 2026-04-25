---
{
    "title": "HEX",
    "language": "en",
    "description": "The HEX function converts input parameters to hexadecimal string representation."
}
---

## Description

The HEX function converts input parameters to hexadecimal string representation. This function is MySQL-compatible and supports both numeric and string input types with different conversion rules.

If the input parameter is a number (BIGINT type), returns the hexadecimal string representation of that number.

If the input parameter is a string, converts each character (by byte) to two hexadecimal characters, then concatenates all converted characters into the result string.

## Syntax

```sql
HEX(<expr>)
```

## Parameters

| Parameter | Description |
|-------|--------------|
| `<expr>` | Input parameter, can be BIGINT type number or VARCHAR type string |

## Return Value

Returns VARCHAR type, representing the hexadecimal representation of the input parameter.

Conversion rules:
- Numeric input: Converts to corresponding hexadecimal value (within BIGINT range)
- String input: Each byte converts to two uppercase hexadecimal characters
- Negative numbers are converted in two's complement binary form

Special cases:
- If parameter is NULL, returns NULL
- Number 0 converts to '0'
- Empty string converts to empty string
- Negative numbers convert to hexadecimal representation of 64-bit two's complement

## Examples

1. Basic number conversion
```sql
SELECT HEX(12), HEX(-1);
```
```text
+---------+------------------+
| HEX(12) | HEX(-1)          |
+---------+------------------+
| C       | FFFFFFFFFFFFFFFF |
+---------+------------------+
```

2. String conversion
```sql
SELECT HEX('1'), HEX('@'), HEX('12');
```
```text
+----------+----------+-----------+
| HEX('1') | HEX('@') | HEX('12') |
+----------+----------+-----------+
| 31       | 40       | 3132      |
+----------+----------+-----------+
```

3. Large integer conversion
```sql
SELECT HEX(255), HEX(65535), HEX(16777215);
```
```text
+----------+------------+----------------+
| HEX(255) | HEX(65535) | HEX(16777215)  |
+----------+------------+----------------+
| FF       | FFFF       | FFFFFF         |
+----------+------------+----------------+
```

4. NULL value handling
```sql
SELECT HEX(NULL);
```
```text
+-----------+
| HEX(NULL) |
+-----------+
| NULL      |
+-----------+
```

5. Zero and empty string
```sql
SELECT HEX(0), HEX('');
```
```text
+--------+--------+
| HEX(0) | HEX('') |
+--------+--------+
| 0      |        |
+--------+--------+
```