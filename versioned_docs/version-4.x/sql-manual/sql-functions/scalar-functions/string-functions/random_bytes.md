---
{
    "title": "RANDOM_BYTES",
    "language": "en"
}
---

## Description

The RANDOM_BYTES function generates a random byte sequence of specified length. The returned byte sequence is represented as a hexadecimal string.

## Syntax

```sql
RANDOM_BYTES(<len>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<len>` | Number of random bytes to generate. Type: INT |

## Return Value

Returns VARCHAR type, a hexadecimal-encoded random byte sequence (prefixed with `0x`).

Special cases:
- `<len>` must be greater than 0, otherwise returns error
- If parameter is NULL, returns NULL
- Each invocation generates a random result

## Examples

1. Basic usage: Generate 8-byte random sequence
```sql
SELECT random_bytes(8);
```
```text
+--------------------+
| random_bytes(8)    |
+--------------------+
| 0x1a2b3c4d5e6f7089 |
+--------------------+
```

2. Generate short sequence
```sql
SELECT random_bytes(4);
```
```text
+----------------+
| random_bytes(4) |
+----------------+
| 0xab12cd34     |
+----------------+
```

3. Invalid parameter: Negative number
```sql
SELECT random_bytes(-1);
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.
```

4. NULL value handling
```sql
SELECT random_bytes(NULL);
```
```text
+--------------------+
| random_bytes(NULL) |
+--------------------+
| NULL               |
+--------------------+
```

5. Generate longer sequence (16 bytes)
```sql
SELECT random_bytes(16);
```
```text
+------------------------------------+
| random_bytes(16)                   |
+------------------------------------+
| 0x1a2b3c4d5e6f708192a3b4c5d6e7f809 |
+------------------------------------+
```

### Keywords

    RANDOM_BYTES
