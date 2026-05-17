---
{
    "title": "File Path Pattern",
    "language": "en",
    "description": "File path patterns and wildcards supported by Doris for accessing files in remote storage systems like S3, HDFS, and other object storage."
}
---

## Description

When accessing files from remote storage systems (S3, HDFS, and other S3-compatible object storage), Doris supports flexible file path patterns including wildcards and range expressions. This document describes the supported path formats and pattern matching syntax.

These path patterns are supported by:
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- INSERT INTO SELECT from TVF

## Supported URI Formats

### S3-Style URIs

| Style | Format | Example |
|-------|--------|---------|
| AWS Client Style (Hadoop S3) | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| S3A Style | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| S3N Style | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| Virtual Host Style | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| Path Style | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### Other Cloud Storage URIs

| Provider | Scheme | Example |
|----------|--------|---------|
| Alibaba Cloud OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| Tencent Cloud COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| Baidu Cloud BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| Huawei Cloud OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### HDFS URIs

| Style | Format | Example |
|-------|--------|---------|
| Standard | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| HA Mode | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## Wildcard Patterns

Doris uses glob-style pattern matching for file paths. The following wildcards are supported:

### Basic Wildcards

| Pattern | Description | Example | Matches |
|---------|-------------|---------|---------|
| `*` | Matches zero or more characters within a path segment | `*.csv` | `file.csv`, `data.csv`, `a.csv` |
| `?` | Matches exactly one character | `file?.csv` | `file1.csv`, `fileA.csv`, but not `file10.csv` |
| `[abc]` | Matches any single character in brackets | `file[123].csv` | `file1.csv`, `file2.csv`, `file3.csv` |
| `[a-z]` | Matches any single character in the range | `file[a-c].csv` | `filea.csv`, `fileb.csv`, `filec.csv` |
| `[!abc]` | Matches any single character NOT in brackets | `file[!0-9].csv` | `filea.csv`, `fileb.csv`, but not `file1.csv` |

### Range Expansion (Brace Patterns)

Doris supports numeric range expansion using brace patterns `{start..end}`:

| Pattern | Expansion | Matches |
|---------|-----------|---------|
| `{1..3}` | `{1,2,3}` | `1`, `2`, `3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`, `2`, `3`, `4`, `5` (leading zeros are NOT preserved) |
| `{3..1}` | `{1,2,3}` | `1`, `2`, `3` (reverse ranges supported) |
| `{a,b,c}` | `{a,b,c}` | `a`, `b`, `c` (enumeration) |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | Mixed ranges and values |

:::caution Note
- Doris tries to match as many files as possible. Invalid parts in brace expressions are silently skipped, and valid parts are still expanded. For example, `file_{a..b,-1..3,4..5}` will match `file_4` and `file_5` (the invalid `a..b` and negative range `-1..3` are skipped, but `4..5` is expanded normally).
- If the entire range is negative (e.g., `{-1..2}`), the range is skipped. If mixed with valid ranges (e.g., `{-1..2,1..3}`), only the valid range `1..3` is expanded.
- When using comma-separated values with ranges, only numbers are allowed. For example, in `{1..4,a}`, the non-numeric `a` will be ignored, resulting in `{1,2,3,4}`.
- Pure enumeration patterns like `{a,b,c}` (without `..` ranges) are passed directly to glob matching and work as expected.
:::

### Combining Patterns

Multiple patterns can be combined in a single path:

```
s3://bucket/data_{1..3}/file_*.csv
```

This matches:
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- ... and so on

## Examples

### S3 TVF Examples

**Match all CSV files in a directory:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**Match files with numeric range:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**Match files in date-partitioned directories:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

:::caution Zero-Padded Directories
For zero-padded directory names like `month=01`, `month=02`, use wildcards (`*`) instead of range patterns. The pattern `{01..12}` expands to `{1,2,...,12}` which won't match `month=01`.
:::

**Match numbered file splits (e.g., Spark output):**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/output/part-{00000..00099}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

### Broker Load Examples

**Load all CSV files matching a pattern:**

```sql
LOAD LABEL db.label_wildcard
(
    DATA INFILE("s3://my-bucket/data/file_*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**Load files using numeric range expansion:**

```sql
LOAD LABEL db.label_range
(
    DATA INFILE("s3://my-bucket/exports/data_{1..5}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**Load from HDFS with wildcards:**

```sql
LOAD LABEL db.label_hdfs_wildcard
(
    DATA INFILE("hdfs://namenode:8020/user/data/2024-*/*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

**Load from HDFS with numeric range:**

```sql
LOAD LABEL db.label_hdfs_range
(
    DATA INFILE("hdfs://namenode:8020/data/file_{1..3,5,7..9}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

### INSERT INTO SELECT Examples

**Insert from S3 with wildcards:**

```sql
INSERT INTO my_table (col1, col2, col3)
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/part-*.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

## Performance Considerations

### Use Specific Prefixes

Doris extracts the longest non-wildcard prefix from your path pattern to optimize S3/HDFS listing operations. More specific prefixes result in faster file discovery.

```sql
-- Good: specific prefix reduces listing scope
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- Less optimal: broad wildcard at early path segment
"uri" = "s3://bucket/data/**/file.csv"
```

### Prefer Range Patterns for Known Sequences

When you know the exact file numbering, use range patterns instead of wildcards:

```sql
-- Better: explicit range
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- Less optimal: wildcard matches unknown files
"uri" = "s3://bucket/data/part-*.csv"
```

### Avoid Deep Recursive Wildcards

Deep recursive patterns like `**` can cause slow file listing on large buckets:

```sql
-- Avoid when possible
"uri" = "s3://bucket/**/*.csv"

-- Prefer explicit path structure
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No files found | Pattern doesn't match any files | Verify the path and pattern syntax; test with a single file first |
| Slow file listing | Wildcard too broad or too many files | Use more specific prefix; limit wildcard scope |
| Invalid URI error | Malformed path syntax | Check URI scheme and bucket name format |
| Access denied | Credentials or permissions issue | Verify S3/HDFS credentials and bucket policies |

### Testing Path Patterns

Before running a large load job, test your pattern with a limited query:

```sql
-- Test if files exist and match pattern
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```

Use `DESC FUNCTION` to verify the schema of matched files:

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
