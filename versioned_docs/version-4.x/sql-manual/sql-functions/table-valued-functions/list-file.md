---
{
    "title": "LIST_FILE",
    "language": "en",
    "description": "List S3 objects and return path and FILE metadata."
}
---

## Description

Lists S3 directory objects using an existing resource, with one row per file. It can list only the current directory or recurse into subdirectories. This TVF returns metadata rather than reading file contents. An empty directory returns zero rows.

:::note
Since 4.2.0
:::

## Syntax

```sql
LIST_FILE(
    "resource" = "<resource_name>",
    "uri" = "s3://<bucket>/<directory>/"
    [, "recursive" = "<true_or_false>"]
)
```

## Parameters

| Parameter | Description |
| --- | --- |
| resource | Required nonempty string property naming an existing S3 resource. Requires USAGE privilege. |
| uri | Required string property; an `s3://bucket/directory/` or path-style `http(s)://host/bucket/directory/` URI. Its bucket comes from the URI and need not match the resource bucket. The directory prefix is passed through without encoding or decoding. |
| recursive | Optional string property, default `false`. `true` lists descendants; `false` lists the current directory only. Only true/false are accepted, case-insensitively. |

Property names are case-insensitive. Unknown properties produce errors. `"name" = "value"` is Doris's named-property TVF syntax, as in S3/HDFS TVFs; it is not a positional argument or SQL filter.

## Return Value

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| path | STRING | No | S3 object path constructed from the bucket and raw object key; no URI escaping. |
| file | FILE | No | uri=path, size=object length, inferred content_type; checksum is `ETAG:<etag>` when the listing ETag is nonempty after removing surrounding quotes, otherwise NULL; offset/inline are NULL. |

Returns only `path` and `file`. Use `ELEMENT_AT(file, 'size')` to retrieve the object size.

## Example

Use the existing `file_test_s3_resource`; the caller needs USAGE privilege. See [TO_FILE](../scalar-functions/to-file.md) for resource configuration. The outputs show two files in the test directory. Actual row order and metadata depend on the storage service; checksum is NULL when no ETag is returned.

Non-recursive: list files in the current directory only.

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "false"
);
```

```text
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                     | file                                                                                                                                                                                        |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

Recursive: include files in subdirectories.

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "true"
);
```

```text
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                          | file                                                                                                                                                                                            |
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg      | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null}     |
| s3://linrrzqqq/doris-file-type-test/recursive-test/fltest.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/recursive-test/fltest.jpg","offset":null,"size":46050,"content_type":"image/jpeg","checksum":"ETAG:CF413A96214E07F3E7CCB82A8B19F792","inline":null} |
+---------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

If `doris-file-type-test/empty/` contains no objects, zero rows are returned:

```sql
SELECT *
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/empty/"
);
```

```text
Empty set (0 rows)
```
