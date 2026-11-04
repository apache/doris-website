---
{
    "title": "FILE Type Conversion",
    "language": "en",
    "description": "FILE conversion restrictions and NULL handling."
}
---

# FILE Type Conversion

:::note
Since 4.2
:::

CAST and TRY_CAST do not support conversion between FILE and other types, including STRUCT, STRING, JSON, and VARIANT. This restriction also applies to ARRAY, STRUCT, and MAP types containing FILE. Unsupported conversions fail during analysis, including TRY_CAST.

Obtain FILE values with [TO_FILE](../../../sql-functions/scalar-functions/to-file.md) or [LIST_FILES](../../../sql-functions/table-valued-functions/list-file.md). Use [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md) to serialize FILE values as JSON.

## NULL and Identity Casts

SQL NULL can be cast to FILE. Casting a value to its existing type also remains supported.

```sql
SELECT CAST(NULL AS FILE) AS f;
```

```text
f
NULL
```
