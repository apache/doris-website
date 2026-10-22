---
{
    "title": "Cast to FILE",
    "language": "en",
    "description": "Explicit STRUCT to FILE conversion, including nested values and NULL handling."
}
---

# Cast to FILE

:::note
Since 4.2
:::

FILE supports explicit conversion from STRUCT. CAST and TRY_CAST reject conversion from FILE to other types, including STRUCT. **Implicit conversion between FILE and STRUCT is unsupported; use CAST.** Conversion does not access remote storage. Field definitions and value constraints are described in [FILE](../semi-structured/FILE.md).

## Cast to FILE

### FROM STRUCT

The source STRUCT must contain all six fields. Fields are matched by name, case-insensitively, and can appear in any order. Offset and size must be BIGINT or NULL, inline must be VARBINARY or NULL, and the text fields must be CHAR/VARCHAR/STRING or NULL. Unknown, missing, duplicate, or incompatible fields are rejected.

```sql
SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| f                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### FROM NULL

SQL NULL can be explicitly converted to NULL FILE.

```sql
SELECT CAST(NULL AS FILE) AS f;
```
```text
+------+
| f    |
+------+
| NULL |
+------+
```

## NULL Handling and TRY_CAST

A NULL STRUCT converts to NULL FILE. For a non-NULL STRUCT, uri or inline must be non-NULL, and supplied fields must meet the FILE value constraints. Invalid FILE values cause CAST errors even when `enable_strict_cast=false`.

TRY_CAST follows the existing conversion rules. In strict mode, a failed conversion returns NULL for the entire target value of that row. Type and STRUCT schema checks still occur during analysis.

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(-1 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', NULL
) AS FILE) AS f;
```
```text
+------+
| f    |
+------+
| NULL |
+------+
```

## Nested Conversions

STRUCT to FILE conversion also applies to ARRAY elements, STRUCT fields, and MAP values. Convert individual values before constructing a container, or cast between matching container types. Converting nested FILE values to other types is unsupported. FILE children hidden by a NULL parent are not validated.

```sql
SELECT CAST(ARRAY(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
)) AS ARRAY<FILE>) AS files;
```
```text
+-------------------------------------------------------------------------------------------------------------+
| files                                                                                                       |
+-------------------------------------------------------------------------------------------------------------+
| [{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}] |
+-------------------------------------------------------------------------------------------------------------+
```
