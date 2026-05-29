---
{
    "title": "HAMMING_DISTANCE",
    "language": "en",
    "description": "The HAMMING_DISTANCE function returns the number of positions at which two strings of equal length differ."
}
---

::: note
Since 4.1.2
:::

## Description

The `HAMMING_DISTANCE` function returns the number of positions at which two strings differ.

This function compares strings by UTF-8 characters rather than bytes. The two input strings must have the same number of UTF-8 characters. The comparison is case-sensitive.

## Syntax

```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str1>` | The first string to compare. |
| `<str2>` | The second string to compare. |

## Return Value

Returns a BIGINT value representing the number of differing character positions.

Special cases:

- If either argument is NULL, returns NULL.
- If both arguments are empty strings, returns 0.
- If the two strings have different UTF-8 character lengths, an error is returned.

## Examples

1. Compare two ASCII strings of the same length.

```sql
SELECT hamming_distance('karolin', 'kathrin');
```

```text
+-----------------------------------------+
| hamming_distance('karolin', 'kathrin')  |
+-----------------------------------------+
|                                       3 |
+-----------------------------------------+
```

2. Compare two UTF-8 strings. The strings have the same character length, and only one character is different.

```sql
SELECT hamming_distance('数据库', '数据仓');
```

```text
+---------------------------------------+
| hamming_distance('数据库', '数据仓')  |
+---------------------------------------+
|                                     1 |
+---------------------------------------+
```

3. Compare strings that differ only by letter case.

```sql
SELECT hamming_distance('Doris', 'doris');
```

```text
+-------------------------------------+
| hamming_distance('Doris', 'doris')  |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

4. NULL input returns NULL.

```sql
SELECT hamming_distance(NULL, 'abc');
```

```text
+-------------------------------+
| hamming_distance(NULL, 'abc') |
+-------------------------------+
|                          NULL |
+-------------------------------+
```
