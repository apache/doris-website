---
{
    "title": "FILE Type Conversion",
    "language": "en",
    "description": "FILE type conversion restrictions for CAST and TRY_CAST."
}
---

# FILE Type Conversion

:::note
Since 4.2
:::


`CAST` and `TRY_CAST` do not support conversion to or from `FILE` (including `STRUCT`, `STRING`, `JSON`, `VARIANT`, `NULL`, and identity casts to `FILE`). This restriction also applies to `ARRAY`, `STRUCT`, and `MAP` types containing `FILE`. Unsupported conversions fail during analysis, including `TRY_CAST`.

Use [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md) to serialize `FILE` values as `JSONB`. To access metadata fields or inline binary contents from a `FILE` value, use [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md), [FL_GET_BINARY](../../../sql-functions/scalar-functions/fl-get-binary.md), or [EXPLODE_FILE](../../../sql-functions/table-functions/explode-file.md).

## Restriction Examples

All `CAST` and `TRY_CAST` expressions involving `FILE` or nested `FILE` types are rejected during analysis:

```sql
SELECT CAST(NULL AS FILE);
SELECT TRY_CAST(NULL AS FILE);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type NULL to target type=FILE
```
