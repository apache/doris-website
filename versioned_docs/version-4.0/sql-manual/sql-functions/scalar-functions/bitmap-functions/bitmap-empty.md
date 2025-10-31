---
{
    "title": "BITMAP_EMPTY",
    "language": "en"
}
---

## Description

Construct an empty BITMAP. Mainly used to fill default values during insert or stream load. For example:

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```

## Syntax

```sql
BITMAP_EMPTY()
```

## Return Value

Returns an empty array with no elements

## Examples

```sql
select bitmap_to_string(bitmap_empty());
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_count(bitmap_empty());
```

```text
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```