---
{
    "title": "LAST_QUERY_ID",
    "language": "en"
}
---

## Description

Get the query id of the current user's last query.

## Syntax

```sql
LAST_QUERY_ID()
```

## Return Value

Returns the query id of the current user's last query;

## Examples

```sql
select last_query_id();
```

```text
+-----------------------------------+
| last_query_id()                   |
+-----------------------------------+
| 128f913c3ec84a1e-b834bd0262cc090a |
+-----------------------------------+
```