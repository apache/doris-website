---
{
    "title": "Cast to/from FILE",
    "language": "en",
    "description": "Explicit conversions to and from FILE, including STRUCT, JSON, VARIANT, and NULL handling."
}
---

# Cast to/from FILE

:::note
Since 4.2.0
:::

FILE supports explicit conversion to and from STRUCT, JSON, and VARIANT. **Implicit conversion between FILE and these types is unsupported; use CAST.** Conversion does not access remote storage. Field definitions and value constraints are described in [FILE](../semi-structured/FILE.md).

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

### FROM JSON

The JSON object must contain exactly six lowercase keys: uri, offset, size, content_type, checksum, and inline. Offset and size accept BIGINT-range JSON integers or null. Inline accepts a standard, padded Base64 string or null; an empty string represents empty bytes.

```sql
SELECT CAST(JSON_PARSE(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}'
) AS FILE) AS f;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| f                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### FROM VARIANT

An object-valued VARIANT uses the same field names, types, and Base64 representation as JSON.

```sql
SELECT CAST(PARSE_TO_VARIANT(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}'
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

SQL NULL and JSON null can be explicitly converted to NULL FILE.

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

### TO JSON

The result is an object containing all six lowercase keys. Inline becomes a Base64 string or null.

```sql
SELECT CAST(f AS JSON) AS j
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| j                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### TO VARIANT

The result uses the same six-field object representation as JSON, including Base64 inline.

```sql
SELECT CAST(f AS VARIANT) AS v
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| v                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"checksum":null,"content_type":null,"inline":"YWJj","offset":null,"size":3,"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg"} |
+-----------------------------------------------------------------------------------------------------------+
```

## NULL Handling and TRY_CAST

A NULL FILE remains NULL when converted to STRUCT, JSON, or VARIANT. For a non-NULL FILE, uri or inline must be non-NULL, and supplied fields must meet the FILE value constraints. Invalid FILE values cause CAST errors even when `enable_strict_cast=false`.

TRY_CAST follows the existing conversion rules. In strict mode, a failed conversion returns NULL for the entire target value of that row. Type and STRUCT schema checks still occur during analysis.

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST(JSON_PARSE(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":-1,"content_type":null,"checksum":null,"inline":null}'
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

Direct whole-value conversions from STRING to a container containing FILE, or between VARIANT and such a container, are unsupported. Element-wise conversions between `ARRAY<VARIANT>` and `ARRAY<FILE>` remain supported.

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
