---
{
    "title": "Lance | File Formats",
    "language": "en",
    "description": "This document introduces the support for reading Lance file formats in Doris.",
    "sidebar_label": "Lance"
}
---

# Lance

:::tip
Lance format support is an **experimental feature** available since Apache Doris **5.0.0**.
:::

[Lance](https://lancedb.github.io/lance/) is a modern columnar data format designed for AI/ML workloads, with native support for vector search, multimodal data (images, embeddings), and fast random access.

Doris supports reading Lance format files through Table Valued Functions (TVF).

## Supported Features

| Feature | Support |
|---------|---------|
| Reading data via Table Valued Function (`s3`, `local`) | Yes |
| Automatic schema inference | Yes |
| Column projection | Yes |
| `WHERE` filter, `LIMIT`, `COUNT(*)`, aggregation | Yes |
| Multi-fragment datasets | Yes |
| Reading from Catalog | Not supported |
| Writing data (Outfile/Export/INSERT INTO TVF) | Not supported |
| Vector ANN search / Full-text search pushdown | Not supported |
| Doris Data Cache integration | Not supported |

## Dataset Layout

A Lance dataset is a **directory** with the following typical structure:

```
my_dataset.lance/
├── _transactions/
├── _versions/
└── data/
    ├── fragment-0.lance
    ├── fragment-1.lance
    └── ...
```

When querying via TVF, the `uri` / `file_path` must point to a single `.lance` data file inside the `data/` subdirectory of the dataset. Doris automatically resolves the dataset root from this path and reads all fragments belonging to the dataset.

## Usage Examples

### Read from S3

```sql
SELECT * FROM s3(
    "uri" = "s3://bucket/path/to/my_dataset.lance/data/fragment.lance",
    "format" = "lance",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com"
) ORDER BY id LIMIT 10;
```

### Read from Local Disk

```sql
-- Get backend_id via: SHOW BACKENDS;
SELECT * FROM local(
    "file_path" = "data/my_dataset.lance/data/fragment.lance",
    "backend_id" = "<backend_id>",
    "format" = "lance"
) ORDER BY id LIMIT 10;
```

### Aggregation over a Multi-Fragment Dataset

```sql
SELECT count(*), min(id), max(id) FROM s3(
    "uri" = "s3://bucket/path/to/large.lance/data/fragment.lance",
    "format" = "lance",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com"
);
```

## Limitations

- **TVF only**: Only the `s3` and `local` TVFs are supported. `CREATE CATALOG` is not supported yet.
- **Single data file per glob**: The `file_path` / `uri` must match exactly one `.lance` data file per dataset. If a glob matches multiple `.lance` files within the same multi-fragment dataset, each scan range will reopen the full dataset and produce duplicate rows.
- **No data cache**: Lance reads bypass Doris's `BlockFileCache`; S3 reads are not cached on the local disk.
- **No predicate / vector pushdown**: `WHERE` filters, vector search, and full-text search are not pushed down to the Lance reader.
- **Read-only**: Writing Lance files via `OUTFILE`, `EXPORT`, or `INSERT INTO` TVF is not supported.

## References

- [Lance Format Documentation](https://lancedb.github.io/lance/)
