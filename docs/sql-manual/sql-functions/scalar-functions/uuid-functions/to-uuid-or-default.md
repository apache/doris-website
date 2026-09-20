---
{
    "title": "TO_UUID_OR_DEFAULT",
    "language": "en",
    "description": "Converts a string to UUID; returns the fallback UUID for invalid text or `NULL` input, or the all-zero UUID if no fallback is specified."
}
---

## Description

Converts a string to UUID; returns the fallback UUID for invalid text or `NULL` input, or the all-zero UUID if no fallback is specified.

## Alias

`toUUIDOrDefault`.

## Usage Notes

Failure handling for the input string is independent of `enable_strict_cast`. Errors in the optional fallback expression itself can still fail the query.

## Syntax

```sql
TO_UUID_OR_DEFAULT(<string>, <default>)
TO_UUID_OR_DEFAULT(<string>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<string>` | A CHAR, VARCHAR, or STRING value. Accepts 36-character canonical text with hyphens or 32 hexadecimal digits, in either case. Braces, surrounding whitespace, and other hyphen placements are invalid. |
| `<default>` | Optional fallback of type UUID, including a per-row expression or `NULL`. Defaults to the all-zero UUID when omitted. Explicitly cast string fallbacks to UUID. |

## Return Value

Returns the `UUID` type. Valid input always returns the parsed UUID, even if the fallback is `NULL`. Returns `NULL` only when the input is invalid or `NULL` and the explicitly supplied fallback is `NULL`.

## Example

```sql
SELECT TO_UUID_OR_DEFAULT('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_DEFAULT('bad') AS invalid,
       TO_UUID_OR_DEFAULT(NULL) AS null_input;
```

```text
+--------------------------------------+--------------------------------------+--------------------------------------+
| parsed                               | invalid                              | null_input                           |
+--------------------------------------+--------------------------------------+--------------------------------------+
| 550e8400-e29b-41d4-a716-446655440000 | 00000000-0000-0000-0000-000000000000 | 00000000-0000-0000-0000-000000000000 |
+--------------------------------------+--------------------------------------+--------------------------------------+
```

```sql
SELECT TO_UUID_OR_DEFAULT('bad', CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS fallback,
       TO_UUID_OR_DEFAULT(NULL, CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS null_input,
       TO_UUID_OR_DEFAULT('bad', CAST(NULL AS UUID)) AS null_fallback;
```

```text
+--------------------------------------+--------------------------------------+---------------+
| fallback                             | null_input                           | null_fallback |
+--------------------------------------+--------------------------------------+---------------+
| 550e8400-e29b-41d4-a716-446655440000 | 550e8400-e29b-41d4-a716-446655440000 | NULL          |
+--------------------------------------+--------------------------------------+---------------+
```

```sql
SELECT TO_UUID_OR_DEFAULT('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_DEFAULT(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------------------------------------+--------------------------------------+
| braces                               | leading_space                        |
+--------------------------------------+--------------------------------------+
| 00000000-0000-0000-0000-000000000000 | 00000000-0000-0000-0000-000000000000 |
+--------------------------------------+--------------------------------------+
```
