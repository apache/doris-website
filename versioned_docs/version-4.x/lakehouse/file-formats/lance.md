---
{
    "title": "Lance | File Formats",
    "language": "en",
    "description": "This document introduces Apache Doris support for reading the Lance file format.",
    "sidebar_label": "Lance"
}
---

# Lance

:::note
Lance support is available starting from Apache Doris 4.2.
:::

[Lance](https://docs.lancedb.com/lance) is a columnar data format designed for analytics and AI workloads. Doris can read Lance datasets through a Lance Catalog or through the `s3()` and `local()` table-valued functions (TVFs).

## Supported Features

| Feature | Support |
|---|---|
| Lance Catalog | Supports Filesystem Catalog and REST Catalog |
| File TVFs | Supports `s3()` and `local()` |
| Schema inference and column pruning | Supported |
| Parallel Fragment scans | Supported by Catalog queries and S3 TVFs |
| Predicate pushdown | Supports compatible scalar predicates |
| Vector search | Supports Lance vector indexes and Flat Search through `vector_search()` |
| Writing to Lance | Not supported |
| Time Travel | Not supported |
| Full-Text Search / Hybrid Search | Not supported |

For Catalog configuration, type mapping, predicate pushdown, and vector search details, see [Lance Catalog](../catalogs/lance-catalog.mdx).

## Query a Lance Dataset with a File TVF

The `uri` or `file_path` must point directly to the **root directory of one Lance dataset**, rather than an internal file such as `data/*.lance`.

The following example reads a Lance dataset from S3-compatible object storage:

```sql
SELECT user_id, name
FROM s3(
    "uri" = "s3://my-bucket/lance/user_profiles.lance",
    "s3.endpoint" = "http://127.0.0.1:9000",
    "s3.access_key" = "admin",
    "s3.secret_key" = "password",
    "s3.region" = "us-east-1",
    "use_path_style" = "true",
    "format" = "lance"
)
WHERE user_id > 100;
```

To read a local dataset, use `local()` and specify the dataset root with `file_path` and the target BE with `backend_id`. Doris passes `file_path` directly to the Lance Reader and does not prepend `user_files_secure_path` or expand the path as a Glob. An absolute path is recommended.

## Limitations

- Lance access is read-only. Creating, writing, updating, or deleting Lance tables is not supported.
- Only `s3()` and `local()` support the Lance format. Other file TVFs, such as HDFS and HTTP, are not supported.
- One TVF path can represent only one Lance dataset, and `path_partition_keys` is not supported.
- Queries read the current dataset version. SQL cannot select a Version or perform Time Travel.
- Local TVF Schema discovery and execution open the latest dataset version independently. Avoid modifying the dataset while a Local TVF query is being analyzed and executed.

## References

- [Lance Catalog](../catalogs/lance-catalog.mdx)
- [Lance Format Documentation](https://docs.lancedb.com/lance)
