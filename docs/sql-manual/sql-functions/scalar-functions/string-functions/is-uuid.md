---
{
    "title": "IS_UUID",
    "language": "en",
    "description": "If the parameter is a valid UUID, return 1. If it is an invalid UUID, return 0. If the parameter is NULL, return NULL."
}
---

## Description

If the parameter is a valid UUID, return 1. If it is an invalid UUID, return 0. If the parameter is NULL, return NULL.

A UUID is considered valid if its length is correct and it contains only permitted characters (hexadecimal digits in any case, along with optional hyphens and curly brackets). It can be summarised as one of the following three formats:
```text
aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
aaaaaaaabbbbccccddddeeeeeeeeeeee
{aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee}
```

This function uses different text validation rules from the native [UUID type](../../../basic-element/sql-data-types/uuid.md): it accepts canonical UUIDs enclosed in braces, while the native parser rejects them. To validate text for a native UUID column, use [TO_UUID_OR_NULL](../uuid-functions/to-uuid-or-null.md) or `TRY_CAST(<str> AS UUID)`.

## Syntax

```sql
IS_UUID ( <str> )
```

## Parameters
| Parameter  | Description |
|------------|-----------------|
| `<str>` | a string |


## Return Value

`<str>` is a valid UUID, returns 1; otherwise returns 0.

Special cases:
- If the parameter is NULL, returns NULL.

## Examples


```sql
select is_uuid("88a06b4a-732c-48bd-9984-fecb81285cc1");
```

```text
+-------------------------------------------------+
| is_uuid("88a06b4a-732c-48bd-9984-fecb81285cc1") |
+-------------------------------------------------+
|                                               1 |
+-------------------------------------------------+
```

```sql
select is_uuid("{88a06b4a-732c-48bd-9984-fecb81285cc1}");
```

```text
+-------------------------------------------------+
| is_uuid("88a06b4a-732c-48bd-9984-fecb81285cc1") |
+-------------------------------------------------+
|                                               1 |
+-------------------------------------------------+
```

```sql
select is_uuid("88a06b4a732c48bd9984fecb81285cc1");
```

```text
+---------------------------------------------+
| is_uuid("88a06b4a732c48bd9984fecb81285cc1") |
+---------------------------------------------+
|                                           1 |
+---------------------------------------------+
```

```sql
select is_uuid("{88a06b4a732c48bd9984fecb81285cc1}");
```

```text
+-----------------------------------------------+
| is_uuid("{88a06b4a732c48bd9984fecb81285cc1}") |
+-----------------------------------------------+
|                                             0 |
+-----------------------------------------------+
```

```sql
select is_uuid(NULL);
```

```text
+---------------+
| is_uuid(NULL) |
+---------------+
|          NULL |
+---------------+
```