---
{
    "title": "FILE | Semi Structured",
    "language": "en",
    "description": "The FILE type is a semantic data type that represents object storage file metadata, enabling Doris to handle file references with built-in metadata awareness.",
    "sidebar_label": "FILE"
}
---

# FILE

## Overview

The FILE type is a semantic first-class data type that represents object storage file metadata. It stores a fixed-schema struct describing a remote file (URI, name, content type, size, credentials, etc.).

FILE is designed to work with the [Fileset Table](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md) engine and the [`TO_FILE`](../../../sql-functions/scalar-functions/file-functions/to-file.md) function, enabling Doris to manage, query, and process files in object storage systems like S3, OSS, COS, and OBS.

## Internal Schema

Each FILE value is a JSONB object with the following fixed fields:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `uri` | VARCHAR(4096) | No | Normalized object storage URI (e.g., `s3://bucket/path/file.csv`) |
| `file_name` | VARCHAR(512) | No | File name extracted from the URI |
| `content_type` | VARCHAR(128) | No | MIME type auto-detected from file extension |
| `size` | BIGINT | No | File size in bytes |
| `region` | VARCHAR(64) | Yes | Cloud region (e.g., `us-east-1`) |
| `endpoint` | VARCHAR(256) | Yes | Object storage endpoint URL |
| `ak` | VARCHAR(256) | Yes | Access key for S3-compatible storage |
| `sk` | VARCHAR(256) | Yes | Secret key for S3-compatible storage |
| `role_arn` | VARCHAR(256) | Yes | AWS IAM role ARN for cross-account access |
| `external_id` | VARCHAR(256) | Yes | External ID for role assumption |

## Type Constraints

- FILE type can **only** be used in [Fileset Tables](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md) (tables with `ENGINE = fileset`). It **cannot** be used as a column in regular OLAP tables or other table engines.
- Fileset Tables are **read-only**. `INSERT`, `UPDATE`, and `DELETE` operations are **not supported**. FILE values are automatically materialized by the Fileset engine at query time.
- FILE type columns do **not** support the following operations:
  - `ORDER BY`
  - `GROUP BY`
  - `DISTINCT`
  - Aggregate functions (`MIN`, `MAX`, `COUNT`, `SUM`, etc.)
  - `JOIN` equality conditions
  - Window function `PARTITION BY` / `ORDER BY`
  - Index creation
- FILE type must be used with specific functions (e.g., `TO_FILE`, `AI Functions`) or in the context of a Fileset Table.

## Constructing FILE Values

### Using a Fileset Table (Primary Method)

A [Fileset Table](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md) automatically materializes FILE values by listing files in an object storage location. This is the primary way to work with FILE values:

```sql
CREATE TABLE my_files (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/data/*',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);

SELECT * FROM my_files;
```

### Using the TO_FILE function

Use the [`TO_FILE`](../../../sql-functions/scalar-functions/file-functions/to-file.md) function to construct FILE values in a query expression. This is useful for validating individual file references or inline construction:

```sql
SELECT to_file(
    's3://my-bucket/data/file.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA...',
    'wJa...'
) AS file_obj;
```

:::caution Note
The `to_file` function constructs FILE values for query-time use only. Since Fileset Tables are read-only, you cannot INSERT file values constructed by `to_file` into a Fileset Table.
:::

## Supported MIME Types

The FILE type automatically detects the MIME content type from the file extension. Supported mappings include:

| Extension | Content Type |
|-----------|-------------|
| `.csv` | `text/csv` |
| `.json` | `application/json` |
| `.jsonl` | `application/x-ndjson` |
| `.parquet` | `application/x-parquet` |
| `.orc` | `application/x-orc` |
| `.avro` | `application/avro` |
| `.txt`, `.log`, `.tbl` | `text/plain` |
| `.xml` | `application/xml` |
| `.html`, `.htm` | `text/html` |
| `.pdf` | `application/pdf` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.mp3` | `audio/mpeg` |
| `.mp4` | `video/mp4` |
| `.gz` | `application/gzip` |
| `.bz2` | `application/x-bzip2` |
| `.zst` | `application/zstd` |
| `.lz4` | `application/x-lz4` |
| `.zip` | `application/zip` |
| `.tar` | `application/x-tar` |
| Other | `application/octet-stream` |

## Notes

1. FILE type values are stored internally as JSONB binary format. The physical storage size per value depends on metadata content (typically 200–400 bytes).

2. The FILE type supports URI schemes including `s3://`, `oss://`, `cos://`, `obs://`, and `hdfs://`. Non-S3 schemes (`oss://`, `cos://`, `obs://`) are normalized to `s3://` internally for compatibility.

3. The `to_file` function validates object existence via a HEAD request to the object storage service, ensuring that the referenced file is accessible before constructing the FILE value.

## Using FILE with AI Functions

FILE type is designed to integrate with Doris AI functions for multimodal data processing. Examples:

```sql
-- Compute image embeddings
SELECT array_size(embed("qwen_mul_embed", file)) FROM my_fileset_table;

```
