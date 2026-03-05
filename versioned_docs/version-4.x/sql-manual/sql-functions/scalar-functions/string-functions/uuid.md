---
{
    "title": "UUID",
    "language": "en",
    "description": "The UUID function generates a random Universally Unique Identifier (UUID). The generated UUID conforms to RFC 4122 standard,"
}
---

## Description

The UUID function generates a random Universally Unique Identifier (UUID). The generated UUID conforms to RFC 4122 standard, with a format of 8-4-4-4-12 (36 characters including hyphens).

## Syntax

```sql
UUID()
```

## Parameters

No parameters.

## Return Value

Returns VARCHAR type, a randomly generated UUID string.

Special cases:
- Each call generates a different UUID
- UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Generated UUID is globally unique

## Examples

1. Basic usage: generate single UUID
```sql
SELECT UUID();
```
```text
+--------------------------------------+
| UUID()                               |
+--------------------------------------+
| 29077778-fc5e-4603-8368-6b5f8fd55c24 |
+--------------------------------------+
```

2. Multiple calls generate different UUIDs
```sql
SELECT UUID(), UUID();
```
```text
+--------------------------------------+--------------------------------------+
| UUID()                               | UUID()                               |
+--------------------------------------+--------------------------------------+
| a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6 | f7e8d9c0-b1a2-4938-8756-c4d3e2f1a0b9 |
+--------------------------------------+--------------------------------------+
```

### Keywords

    UUID