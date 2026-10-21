---
{
    "title": "Cast to/from FILE",
    "language": "en",
    "description": "Explicit conversions between FILE and STRUCT, including NULL handling."
}
---

# Cast to/from FILE

:::note
Since 4.2.0
:::

FILE supports explicit conversion to and from STRUCT. **Implicit conversion between FILE and STRUCT is unsupported; use CAST.** Conversion does not access remote storage. Field definitions and value constraints are described in [FILE](../semi-structured/FILE.md).

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

## Cast from FILE

### TO STRUCT

The target STRUCT must contain all six fields, matched by name case-insensitively. All fields must be nullable: uri, content_type, and checksum use string-like types; offset and size use BIGINT; inline uses VARBINARY. The conversion preserves binary inline content.

```sql
SELECT CAST(f AS STRUCT<uri:STRING, offset:BIGINT, size:BIGINT,
    content_type:STRING, checksum:STRING, inline:VARBINARY>) AS s
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+------------------------------------------------------------------------------------------------------------------+
| s                                                                                                                |
+------------------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg", "offset":null, "size":3, "content_type":null, "checksum":null, "inline":0x616263} |
+------------------------------------------------------------------------------------------------------------------+
```

## NULL Handling and TRY_CAST

A NULL FILE remains NULL when converted to STRUCT. For a non-NULL FILE, uri or inline must be non-NULL, and supplied fields must meet the FILE value constraints. Invalid FILE values cause CAST errors even when `enable_strict_cast=false`.

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

The same explicit conversions apply to ARRAY elements, STRUCT fields, and MAP values. Convert individual values before constructing a container, or cast between matching container types. FILE children hidden by a NULL parent are not validated.

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
