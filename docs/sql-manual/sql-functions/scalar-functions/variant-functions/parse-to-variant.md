---
{
    "title": "PARSE_TO_VARIANT",
    "language": "en",
    "description": "Parses JSON text into a VARIANT value."
}
---

## Function

`PARSE_TO_VARIANT` parses one complete JSON value from a `VARCHAR` expression and returns it as `VARIANT`. JSON objects, arrays, strings, numbers, booleans, and the JSON literal `null` are supported.

## Syntax

```sql
PARSE_TO_VARIANT(json_text)
```

## Parameters

- `json_text`: A `VARCHAR` expression containing one complete JSON value.

## Return Value

- Returns a `VARIANT` value.
- SQL `NULL` input returns SQL `NULL`.
- JSON `null` returns Variant/JSON `null`, which is distinct from SQL `NULL`.

## Experimental behavior

`ColumnVariantV2` is an experimental, compute-only execution path. It is disabled by default and selected for the current FE session with:

```sql
SET enable_variant_v2 = true;
```

The session variable changes the execution type of the expression result only. It does not change the physical `VARIANT` type used by table storage, readers, writers, or compaction.

## Errors

Invalid JSON causes `PARSE_TO_VARIANT` to return an error. Use [PARSE_TO_VARIANT_ERROR_TO_NULL](./parse-to-variant-error-to-null) when invalid input should become SQL `NULL` instead.

## Examples

### Parse JSON values

```sql
SELECT PARSE_TO_VARIANT('{\"id\": 42, \"tags\": [\"doris\", \"sql\"]}');
SELECT PARSE_TO_VARIANT('[10, 20, 30]');
SELECT PARSE_TO_VARIANT('42');
SELECT PARSE_TO_VARIANT('true');
SELECT PARSE_TO_VARIANT('\"doris\"');
SELECT PARSE_TO_VARIANT('null');
```

### Extract and cast a value

```sql
SET enable_variant_v2 = true;

SELECT CAST(
           PARSE_TO_VARIANT('{\"user\": {\"id\": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;

SELECT CAST(ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), 0) AS INT) AS first_item,
       CAST(ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), -1) AS INT) AS last_item;
```

For `ColumnVariantV2`, non-negative indexes into a VARIANT array are zero-based (`0` is the first element) and negative indexes count from the end. See [ELEMENT_AT](./element-at) for access rules.

### Distinguish JSON parsing from string casting

```sql
-- Parses the JSON object into a structured VARIANT value.
SELECT PARSE_TO_VARIANT('{\"a\": 1}');

-- Creates a typed VARIANT string; it does not parse the string as JSON.
SELECT CAST('{\"a\": 1}' AS VARIANT);
```

### Invalid input

```sql
-- Returns an error because the JSON object is incomplete.
SELECT PARSE_TO_VARIANT('{\"id\":');
```
