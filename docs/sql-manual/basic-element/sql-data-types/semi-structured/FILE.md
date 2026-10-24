---
{
    "title": "FILE | Semi Structured",
    "language": "en",
    "description": "FILE fields, constraints, construction, and field access.",
    "sidebar_label": "FILE"
}
---

# FILE

## Type Description

- `FILE` represents a file in a query: it can store the file location or hold its binary contents directly.
- A FILE value can also carry information such as size and content type. Its six fields have fixed names and types, and all allow NULL.
- It can be nested in ARRAY, STRUCT, and MAP values.

```sql
FILE
```

| Field | Type | Description |
| --- | --- | --- |
| uri | VARCHAR(65533) | File location, preserved as supplied. |
| offset | BIGINT | Starting byte offset; NULL or a nonnegative value. A non-NULL offset requires size. |
| size | BIGINT | Declared content length in bytes; NULL or a nonnegative value, including 0. |
| content_type | VARCHAR(1024) | NULL or a valid, nonempty MIME media type, such as `image/png`. |
| checksum | VARCHAR(1024) | NULL or a nonempty `algorithm:digest` declaration. |
| inline | VARBINARY | NULL or binary content, including empty bytes, subject to the VARBINARY value length limit. |

- For a non-NULL FILE, uri or inline must be non-NULL. When inline is present, the other five fields may all be NULL. Inline can also coexist with metadata; any supplied fields must satisfy their own constraints.
- URI strings are stored without syntax validation, encoding, or decoding. Constructing FILE with CAST does not access the referenced object. Doris does not check whether inline matches the URI, size, or checksum.
- When offset is NULL, a supplied size describes the range starting at 0. When both are present, the range is `[offset, offset + size)`; their sum must not exceed the BIGINT maximum, `9223372036854775807`.
- Checksum declarations use `ETAG`, `MD5`, `CRC32`, `CRC32C`, or `SHA-256` for known algorithms. ETAG is an opaque nonempty value; MD5, CRC32/CRC32C, and SHA-256 require 32, 8, and 64 lowercase hexadecimal digits respectively. Other algorithm names and digests must both be nonempty. Doris validates the declaration without calculating or verifying the content digest.
- MySQL query results display FILE as a six-field JSON object, with inline encoded as Base64.

## Type Constraints

- FILE is available in query expressions. FILE columns cannot be declared in internal tables or external catalogs, including FILE nested in containers.
- Whole FILE values and containers containing FILE cannot be used for comparison, sorting, hashing, grouping, DISTINCT, or MAP keys. Extract an ordinary scalar field for these operations.
- FILE supports explicit conversion from STRUCT, including nested STRUCT values. Casting FILE to other types is unsupported. There is no implicit conversion between FILE and STRUCT; use CAST. See [FILE Type Conversion](../conversion/file-conversion.md).
- FILE arguments, return values, and aggregate intermediate types are unsupported in UDFs, including nested FILE.

## Obtaining FILE Values

### Construct from metadata

Use an explicit CAST to construct FILE from a six-field STRUCT value. Fields whose values are NULL must still be included. This conversion does not access remote storage.

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

An inline-only FILE is also valid:

```sql
SELECT CAST(NAMED_STRUCT(
    'uri', NULL, 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f;
```
```text
+--------------------------------------------------------------------------------------------+
| f                                                                                          |
+--------------------------------------------------------------------------------------------+
| {"uri":null,"offset":null,"size":null,"content_type":null,"checksum":null,"inline":"YWJj"} |
+--------------------------------------------------------------------------------------------+
```

### Obtain remote object metadata

Use [TO_FILE](../../../sql-functions/scalar-functions/to-file.md) with an existing S3 resource to obtain one object's metadata. The result contains the URI, size, content type, and checksum derived from ETag; offset and inline are NULL.

```sql
SELECT TO_FILE('file_test_s3_resource', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg') AS f;
```
```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| f                                                                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

### Obtain FILE values from a directory listing

[LIST_FILES](../../../sql-functions/table-valued-functions/list-file.md) returns path, size, and file. It recursively lists files by default; with `recursive=false`, it includes immediate subdirectories with size=0 and file=NULL. Listing obtains metadata without downloading contents.

```sql
SELECT path, file
FROM LIST_FILES(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "false"
)
WHERE file IS NOT NULL;
```
```text
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                     | file                                                                                                                                                                                        |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

The resource setup and access requirements are described in the respective function documents.

## Element Access

Use [FL_GET_BINARY](../../../sql-functions/scalar-functions/fl-get-binary.md) to read the stored binary contents. A NULL FILE or NULL `inline` field returns NULL.

Read `uri`, `offset`, `size`, `content_type`, or `checksum` with `ELEMENT_AT(f, 'field_name')` or the equivalent bracket syntax `f['field_name']`. The field name must be a non-NULL constant string and is case-insensitive. The `inline` selector, unknown field names, dynamic selectors, and numeric indexes produce errors. Accessing a NULL FILE or a NULL metadata field returns NULL.

```sql
SELECT ELEMENT_AT(f, 'uri') AS uri,
       f['size'] AS size,
       FROM_BINARY(FL_GET_BINARY(f)) AS inline_hex
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://bucket/picture.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-------------------------+------+------------+
| uri                     | size | inline_hex |
+-------------------------+------+------------+
| s3://bucket/picture.jpg |    3 | 616263     |
+-------------------------+------+------------+
```
