---
{
    "title": "RANDOM_BYTES",
    "language": "en"
}
---

## Description

The RANDOM_BYTES function is used to generate a random byte sequence of the specified length.

## Syntax

```sql
RANDOM_BYTES( <len> )
```

## Parameters

| Parameter | Description                                                                                                                                               |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<len>`   | This parameter specifies the length of the random byte sequence to be generated. This value must be greater than 0; otherwise, an error will be occurred. |

## Return Value

Returns a random byte sequence of the specified length, encoded in hexadecimal. Special cases:

- If any of the parameters is NULL, NULL will be returned.

## Examples

```sql
select random_bytes(7);
```

```text
+------------------+
| random_bytes(7)  |
+------------------+
| 0x869684a082ab4b |
+------------------+
```

```sql
select random_bytes(-1);
```

```text
(1105, 'errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.')
```
