---
{
    "title": "IS_UUID",
    "language": "en"
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

```sql
+-------------------------------------------------+
| is_uuid("88a06b4a-732c-48bd-9984-fecb81285cc1") |
+-------------------------------------------------+
|                                               1 |
+-------------------------------------------------+
```

```sql
select is_uuid("{88a06b4a-732c-48bd-9984-fecb81285cc1}");
```

```sql
+-------------------------------------------------+
| is_uuid("88a06b4a-732c-48bd-9984-fecb81285cc1") |
+-------------------------------------------------+
|                                               1 |
+-------------------------------------------------+
```

```sql
select is_uuid("88a06b4a732c48bd9984fecb81285cc1");
```

```sql
+---------------------------------------------+
| is_uuid("88a06b4a732c48bd9984fecb81285cc1") |
+---------------------------------------------+
|                                           1 |
+---------------------------------------------+
```

```sql
select is_uuid("{88a06b4a732c48bd9984fecb81285cc1}");
```

```sql
+-----------------------------------------------+
| is_uuid("{88a06b4a732c48bd9984fecb81285cc1}") |
+-----------------------------------------------+
|                                             0 |
+-----------------------------------------------+
```