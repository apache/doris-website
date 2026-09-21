---
{
    "title": "TO_UUID_OR_ZERO",
    "language": "en",
    "description": "Converts a string to UUID; returns the all-zero UUID for invalid text and `NULL` for `NULL` input."
}
---

## Description

Converts a string to UUID; returns the all-zero UUID for invalid text and `NULL` for `NULL` input.

## Alias

`toUUIDOrZero`.

## Usage Notes

Failure handling for the input string is independent of `enable_strict_cast`.

## Syntax

```sql
TO_UUID_OR_ZERO(<string>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<string>` | A CHAR, VARCHAR, or STRING value. Accepts 36-character canonical text with hyphens or 32 hexadecimal digits, in either case. Braces, surrounding whitespace, and other hyphen placements are invalid. |

## Return Value

Returns the `UUID` type. Returns `NULL` only for `NULL` input. The all-zero UUID is a valid value distinct from `NULL`.

## Example

```sql
SELECT TO_UUID_OR_ZERO('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_ZERO('bad') AS invalid,
       TO_UUID_OR_ZERO(NULL) AS null_input;
```

```text
+--------------------------------------+--------------------------------------+------------+
| parsed                               | invalid                              | null_input |
+--------------------------------------+--------------------------------------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | 00000000-0000-0000-0000-000000000000 | NULL       |
+--------------------------------------+--------------------------------------+------------+
```

```sql
SELECT TO_UUID_OR_ZERO('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_ZERO(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------------------------------------+--------------------------------------+
| braces                               | leading_space                        |
+--------------------------------------+--------------------------------------+
| 00000000-0000-0000-0000-000000000000 | 00000000-0000-0000-0000-000000000000 |
+--------------------------------------+--------------------------------------+
```
