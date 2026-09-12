---
{
    "title": "TO_UUID_OR_NULL",
    "language": "en",
    "description": "Convert canonical or compact hexadecimal strings to native UUID, returning NULL for invalid text or NULL input regardless of strict cast mode."
}
---

## Description

Converts a string to UUID; returns `NULL` for invalid text or `NULL` input.

## Alias

`toUUIDOrNull`.

## Usage Notes

Failure handling for the input string is independent of `enable_strict_cast`.

## Syntax

```sql
TO_UUID_OR_NULL(<string>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<string>` | A CHAR, VARCHAR, or STRING value. Accepts 36-character canonical text with hyphens or 32 hexadecimal digits, in either case. Braces, surrounding whitespace, and other hyphen placements are invalid. |

## Return Value

Returns the `UUID` type. Returns `NULL` for invalid text or `NULL` input.

## Example

```sql
SELECT TO_UUID_OR_NULL('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_NULL('bad') AS invalid,
       TO_UUID_OR_NULL(NULL) AS null_input;
```

```text
+--------------------------------------+---------+------------+
| parsed                               | invalid | null_input |
+--------------------------------------+---------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | NULL    | NULL       |
+--------------------------------------+---------+------------+
```

```sql
SELECT TO_UUID_OR_NULL('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_NULL(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------+---------------+
| braces | leading_space |
+--------+---------------+
| NULL   | NULL          |
+--------+---------------+
```
