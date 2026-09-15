---
{
    "title": "UUID_VERSION",
    "language": "en",
    "description": "Extract the four-bit version field of a native UUID as TINYINT, including NULL, all-zero, and all-one UUID behavior."
}
---

## Description

Extracts the four-bit version field of a UUID; returns `NULL` for `NULL` input.

## Syntax

```sql
UUID_VERSION(<uuid>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<uuid>` | A value of type UUID. |

## Return Value

Returns a `TINYINT` in the range 0–15. It reads the version bits without validating the variant or conformance to a UUID version specification. The all-zero UUID returns 0 and the all-one UUID returns 15. `NULL` input returns `NULL`.

## Example

```sql
SELECT UUID_VERSION(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS v4,
       UUID_VERSION(CAST('018f0f59-1010-7abc-9234-001122334455' AS UUID)) AS v7,
       UUID_VERSION(CAST('00000000-0000-0000-0000-000000000000' AS UUID)) AS zero_version,
       UUID_VERSION(CAST('ffffffff-ffff-ffff-ffff-ffffffffffff' AS UUID)) AS max_version,
       UUID_VERSION(CAST(NULL AS UUID)) AS null_version;
```

```text
+----+----+--------------+-------------+--------------+
| v4 | v7 | zero_version | max_version | null_version |
+----+----+--------------+-------------+--------------+
| 4  | 7  | 0            | 15          | NULL         |
+----+----+--------------+-------------+--------------+
```
