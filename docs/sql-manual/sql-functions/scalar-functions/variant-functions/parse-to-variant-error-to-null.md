---
{
    "title": "PARSE_TO_VARIANT_ERROR_TO_NULL",
    "language": "en",
    "description": "Parses JSON text into a VARIANT value and returns SQL NULL for invalid input."
}
---

## Function

`PARSE_TO_VARIANT_ERROR_TO_NULL` parses JSON text into `VARIANT`. Invalid JSON returns SQL `NULL` instead of failing the query.

## Syntax

```sql
PARSE_TO_VARIANT_ERROR_TO_NULL(json_text)
```

## Parameters

- `json_text`: A `VARCHAR` expression containing one complete JSON value.

## Return Value

- Returns a nullable `VARIANT` value.
- SQL `NULL` input returns SQL `NULL`.
- Invalid JSON returns SQL `NULL`.
- Valid JSON `null` remains Variant/JSON `null`, distinct from SQL `NULL`.

## Experimental behavior

`ColumnVariantV2` is an experimental, compute-only execution path. It is disabled by default and selected for the current FE session with:

```sql
SET enable_variant_v2 = true;
```

The session variable changes the execution type of the expression result only. It does not change the physical `VARIANT` type used by table storage, readers, writers, or compaction.

## Examples

### Keep valid values and null invalid JSON

```sql
SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\": 1}') AS valid_value,
       PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value,
       PARSE_TO_VARIANT_ERROR_TO_NULL(NULL) AS sql_null_value;
```

The first expression returns a VARIANT object. The second and third expressions return SQL `NULL`.

### Parse arrays and access elements

```sql
SET enable_variant_v2 = true;

SELECT CAST(ELEMENT_AT(
           PARSE_TO_VARIANT_ERROR_TO_NULL('[10, 20, 30]'),
           0
       ) AS INT) AS first_item,
       CAST(ELEMENT_AT(
           PARSE_TO_VARIANT_ERROR_TO_NULL('[10, 20, 30]'),
           -1
       ) AS INT) AS last_item;
```

For `ColumnVariantV2`, non-negative array indexes are zero-based and negative indexes count from the end.

### Choose strict or tolerant parsing

Use [PARSE_TO_VARIANT](./parse-to-variant) when invalid JSON should stop the query and surface an error. Use this function when invalid JSON should become SQL `NULL` and the remaining rows should continue.
