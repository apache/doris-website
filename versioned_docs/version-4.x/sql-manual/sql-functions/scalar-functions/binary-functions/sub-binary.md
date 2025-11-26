---
{
    "title": "SUB_BINARY",
    "language": "en"
}
---

## Description

The SUB_BINARY function extracts a binary subsequence from a VARBINARY value. You can specify the starting position and the length of bytes to extract. The first byte position in the binary is 1.

## Syntax

```sql
sub_binary(<bin>, <pos> [, <len>])
```

## Parameters

| Parameter | Description                                               |
| --------- | --------------------------------------------------------- |
| `<bin>`   | Source binary value. Type: VARBINARY                      |
| `<pos>`   | Starting byte position, can be negative. Type: INT        |
| `<len>`   | Optional parameter, number of bytes to extract. Type: INT |

## Return value

Returns VARBINARY type, representing the extracted binary subsequence.

Special cases:

- If any parameter is NULL, returns NULL.
- If pos is 0, returns an empty binary.
- If pos is negative, counts from the end of the binary backwards.
- If pos exceeds the binary length, returns an empty binary.
- If len is not specified, returns all bytes from pos to the end of the binary.

## Example

1. Basic usage (specify starting position)

```sql
SELECT sub_binary(x'61626331', 2);
```

```text
+--------------------------------------------------------+
| sub_binary(x'61626331', 2)                             |
+--------------------------------------------------------+
| 0x626331                                               |
+--------------------------------------------------------+
```

2. Using negative position

```sql
SELECT sub_binary(x'61626331', -2);
```

```text
+----------------------------------------------------------+
| sub_binary(x'61626331', -2)                              |
+----------------------------------------------------------+
| 0x6331                                                   |
+----------------------------------------------------------+
```

3. Case when position is 0

```sql
SELECT sub_binary(x'61626331', 0);
```

```text
+--------------------------------------------------------+
| sub_binary(x'61626331', 0)                             |
+--------------------------------------------------------+
| 0x                                                     |
+--------------------------------------------------------+
```

4. Position exceeds binary length

```sql
SELECT sub_binary(x'61626331', 5);
```

```text
+--------------------------------------------------------+
| sub_binary(x'61626331', 5)                             |
+--------------------------------------------------------+
| 0x                                                     |
+--------------------------------------------------------+
```

5. Specifying length parameter

```sql
SELECT sub_binary(x'61626331646566', 2, 2);
```

```text
+--------------------------------------------------------+
| sub_binary(x'61626331646566', 2, 2)                    |
+--------------------------------------------------------+
| 0x6263                                                 |
+--------------------------------------------------------+
```
