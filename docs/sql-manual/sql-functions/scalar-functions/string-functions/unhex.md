---
{
    "title": "UNHEX",
    "language": "en",
    "description": "The UNHEX function converts a hexadecimal string back to the original string, serving as the inverse operation of the HEX function."
}
---

## Description

The UNHEX function converts a hexadecimal string back to the original string, serving as the inverse operation of the HEX function. This function converts every two hexadecimal characters (0-9, A-F, a-f) into one byte. The UNHEX_NULL function works identically but returns NULL instead of an empty string when encountering invalid input. These functions are useful when handling binary data, encrypted data, or data requiring hexadecimal representation.

:::tip
This function is supported since version 3.0.6.
:::

## Syntax

```sql
UNHEX(<str>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The hexadecimal character string |

## Return Value

Returns VARCHAR type, representing the decoded original string from hexadecimal.

Decoding rules:
- Accepts character range: 0-9, a-f, A-F
- Every two hexadecimal characters convert to one byte
- Result may contain unprintable characters

Special cases (UNHEX):
- If input is NULL, returns empty string
- If string length is 0 or odd, returns empty string
- If contains non-hexadecimal characters, returns empty string

Special cases (UNHEX_NULL):
- If input is NULL, returns NULL
- If string length is 0 or odd, returns NULL
- If contains non-hexadecimal characters, returns NULL

## Examples

```sql
select unhex('@');
```

```text
+------------+
| unhex('@') |
+------------+
|            |
+------------+
```

```sql
select unhex_null('@');
```

```text
+-----------------+
| unhex_null('@') |
+-----------------+
| NULL            |
+-----------------+
```

```sql
select unhex('41');
```

```text
+-------------+
| unhex('41') |
+-------------+
| A           |
+-------------+
```

```sql
select unhex('4142'), unhex('48656C6C6F');
```

```text
+---------------+----------------------+
| unhex('4142') | unhex('48656C6C6F')  |
+---------------+----------------------+
| AB            | Hello                |
+---------------+----------------------+
```

5. NULL handling comparison
```sql
SELECT UNHEX(NULL), UNHEX_NULL(NULL);
```
```text
+-------------+-----------------+
| UNHEX(NULL) | UNHEX_NULL(NULL) |
+-------------+-----------------+
|             | NULL            |
+-------------+-----------------+
```

6. UTF-8 character decoding
```sql
SELECT UNHEX('E4B8AD'), UNHEX('E69687');
```
```text
+-----------------+-----------------+
| UNHEX('E4B8AD') | UNHEX('E69687') |
+-----------------+-----------------+
| 中              | 文              |
+-----------------+-----------------+
```

7. Hexadecimal encoding-decoding cycle verification
```sql
SELECT UNHEX(HEX('Hello')), UNHEX(HEX('Test123'));
```
```text
+---------------------+------------------------+
| UNHEX(HEX('Hello')) | UNHEX(HEX('Test123'))  |
+---------------------+------------------------+
| Hello               | Test123                |
+---------------------+------------------------+
```

### Keywords

    UNHEX, UNHEX_NULL, HEX
