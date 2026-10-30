---
{
    "title": "LIST_FILES",
    "language": "en",
    "description": "List S3 files and directories with path, size, and FILE metadata."
}
---

## Description

Lists S3 files using an existing resource and returns metadata without reading file contents. By default, it recursively lists files in all subdirectories. With `recursive=false`, it returns immediate files and subdirectories; directory rows have `size=0` and `file=NULL`.

## Syntax

```sql
LIST_FILES(
    "resource" = "<resource_name>",
    "uri" = "s3://<bucket>/<directory>/"
    [, "recursive" = "<true_or_false>"]
)
```

## Parameters

| Parameter | Description |
| --- | --- |
| resource | Required nonempty string naming an existing S3 resource. Requires USAGE privilege. |
| uri | Required string; an `s3://bucket/directory/` or path-style `http(s)://host/bucket/directory/` URI. Its bucket comes from the URI and need not match the resource bucket. The directory prefix is passed through without encoding or decoding. |
| recursive | Optional string, default `true`. `true` lists files at every depth and omits directories, including empty directory marker objects. `false` lists only immediate files and subdirectories. Only true/false are accepted, case-insensitively. |

Property names are case-insensitive. Unknown properties produce errors. Use Doris's named-property TVF syntax, `"name" = "value"`.

## Return Value

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| path | STRING | No | S3 path constructed from the bucket and raw object key, without URI escaping. Directory paths end in `/`. |
| size | BIGINT | No | File size in bytes; `0` for directories. |
| file | FILE | Yes | NULL for directories. For files: uri=path, size=object length, inferred content_type; checksum is `ETAG:<etag>` when the listing ETag is nonempty after removing surrounding quotes, otherwise NULL; offset/inline are NULL. |

Objects whose keys end in `/` are directory markers. The marker for the directory being listed is omitted. An empty directory has no recursive results, while its parent includes it in a non-recursive listing. Ordinary zero-byte files are returned in both modes with a non-NULL `file` value.

## Example

Use an existing S3 resource named `file_test_s3_resource` with USAGE privilege; see [TO_FILE](../scalar-functions/to-file.md) for configuration. Suppose `s3://bucket/a/` contains the zero-byte file `empty.txt`, the three-byte file `b/c.png`, and the empty directory marker `empty/`.

List immediate entries:

```sql
SELECT path, size, file IS NULL AS is_directory
FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/", "recursive"="false")
ORDER BY path;
```

```text
path                     size  is_directory
s3://bucket/a/b/          0     1
s3://bucket/a/empty.txt   0     0
s3://bucket/a/empty/      0     1
```

List files recursively using the default:

```sql
SELECT path, size, file IS NULL AS is_directory
FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/")
ORDER BY path;
```

```text
path                     size  is_directory
s3://bucket/a/b/c.png     3     0
s3://bucket/a/empty.txt   0     0
```

List an empty directory:

```sql
SELECT * FROM LIST_FILES("resource"="file_test_s3_resource", "uri"="s3://bucket/a/empty/");
```

```text
Empty set (0 rows)
```
