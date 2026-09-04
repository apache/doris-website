---
{
    "title": "Data Compression",
    "language": "en",
    "description": "Doris supports table-level and per-column compression with algorithms such as LZ4, ZSTD, Snappy, and Zlib, allowing flexible trade-offs between storage cost and query performance.",
    "keywords": [
        "Doris data compression",
        "columnar storage compression",
        "LZ4",
        "ZSTD",
        "Snappy",
        "Zlib",
        "per-column compression",
        "compression level",
        "compression algorithm selection",
        "storage efficiency optimization"
    ]
}
---

<!-- Knowledge type: Capability definition + Configuration parameters + Selection decision -->
<!-- Applicable scenarios: Compression selection during table creation / Storage cost optimization / Query performance tuning -->

Doris organizes and stores data using a **columnar storage** model, which is especially well-suited for analytical workloads. Because data within the same column typically shares similar distribution characteristics, columnar storage offers a natural advantage for compression. Doris ships with several built-in compression algorithms, and you can choose the most appropriate one when creating a table to balance storage cost against query performance based on your workload.

## Quick Selection Guide

Different workloads have different compression requirements. The following table lists recommended choices for common scenarios:

| User scenario                                            | Recommended algorithm | Reason                                                              |
| -------------------------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| High-performance real-time analytics, high-concurrency queries | **LZ4**, Snappy       | Extremely fast decompression with low CPU overhead                  |
| Balance of storage cost and query performance            | **ZSTD**, LZ4F        | High compression ratio while still providing fast decompression     |
| Storage efficiency first, query latency not sensitive    | **ZSTD**, Zlib        | Highest compression ratio, saves disk space                         |
| Archival and cold data storage                           | **Zlib**, LZ4HC       | Maximum compression ratio, suitable for rarely accessed data        |

> The default recommendation is **ZSTD**: in most scenarios it delivers both a good compression ratio and fast decompression speed.

## Why Compression Is Needed

In Doris, data compression serves two main goals:

1. **Reduce storage cost**: Lowering the disk space required to store data, so the same physical resources can hold more data.
2. **Improve query performance**: Compressed data takes less space, which means fewer I/O operations during queries. Modern compression algorithms decompress extremely quickly, so they save storage while also speeding up query response.

## Supported Compression Algorithms

Doris supports the following compression algorithms. Each algorithm offers a different trade-off between compression ratio and decompression speed:

| Compression type     | Characteristics                                                                                                | Applicable scenarios                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **No compression**   | Data is not compressed.                                                                                        | Data has already been compressed, or scenarios where storage space is not a bottleneck. |
| **LZ4**              | Extremely fast compression and decompression speed, with a moderate compression ratio.                         | Real-time queries, high-concurrency workloads, and other scenarios that require fast decompression. |
| **LZ4F**             | An extended version of LZ4 that supports more flexible compression configuration; fast with a moderate compression ratio. | Scenarios that need fast compression with fine-grained control over configuration. |
| **LZ4HC**            | Higher compression ratio than LZ4 but slower compression speed; decompression speed is comparable to LZ4.      | Scenarios that care about decompression speed but require a higher compression ratio. |
| **ZSTD** (Zstandard) | High compression ratio with flexible compression-level tuning; decompression remains fast even at high compression ratios. | Scenarios that demand high storage efficiency while also needing good query performance. |
| **Snappy**           | Designed primarily for fast decompression, with a moderate compression ratio.                                  | Scenarios that require fast decompression and have limited CPU resources.       |
| **Zlib**             | Provides a good balance between compression ratio and speed; compression and decompression are slower, but the compression ratio is higher. | Archival, cold data storage, and other scenarios that are not sensitive to decompression speed. |

## How Compression Works

Compression in Doris is implemented by the coordinated effort of several layers:

### Per-Column Compression

Because Doris uses columnar storage, it compresses each column in a table independently. Data within the same column typically shares similar distribution characteristics, so per-column compression achieves higher compression efficiency than per-row compression.

### Encoding Before Compression

Before performing compression, Doris first encodes the column data, transforming it into a form that is better suited for compression and further improving the compression ratio. Common encoding methods include:

- **Dictionary encoding**: Replaces repeated strings with shorter dictionary IDs.
- **Run-length encoding (RLE)**: Represents consecutive repeated values as "value + repeat count".

### Per-Page Compression

Doris uses a **page-level** compression strategy:

1. The data of each column is divided into multiple pages.
2. Data within each page is compressed independently.
3. At query time, only the target pages are decompressed on demand, avoiding full-column scans.

Per-page compression can efficiently handle large-scale datasets while maintaining a good balance between compression ratio and decompression performance.

### Storage Format V3 Optimization

Starting from Doris storage format V3, the encoding strategy for numeric types has been further optimized:

- Integer types use `PLAIN_ENCODING` by default.
- When combined with LZ4 or ZSTD compression, this provides higher read throughput and lower CPU overhead.

For details, see [Storage Format V3](./storage-format).

### Configurable Compression Strategy

You can specify the compression algorithm when creating a table, choosing the best trade-off between compression efficiency and query performance based on your specific workload.

## Factors That Affect Compression

Compression effectiveness depends not only on the chosen algorithm but also on the characteristics of the data itself:

| Factor                  | Description                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Data sequentiality**  | The more regular the order of the data (such as timestamps or consecutive numeric values), the easier it is for the compression algorithm to identify repeating patterns, and the higher the compression ratio. |
| **Data redundancy**     | The more repeated values in a column, the better the compression effect; dictionary encoding is especially effective for highly redundant data. |
| **Data type**           | Numeric types (integers, floating-point numbers) are usually easier to compress than string types; the wider the value range, the more compression is affected. |
| **Column length**       | Shorter columns are usually easier to compress than longer ones, because compression algorithms can find repeating patterns more efficiently in shorter data blocks. |
| **NULL value ratio**    | When the proportion of NULL values is high, the compression algorithm can encode them as a special pattern, further reducing storage space. |

## Configure Table-Level Compression

When creating a table, use the `compression` property to set the default compression algorithm for all columns:

```sql
CREATE TABLE example_table (
    id INT,
    name STRING,
    age INT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "compression" = "zstd"
);
```

Supported values for `compression` are: `none`, `lz4`, `lz4f`, `lz4hc`, `zstd`, `snappy`, and `zlib`. If not specified explicitly, Doris uses the default compression algorithm `ZSTD` (controlled by the FE configuration `default_compression_type`).

## Configure Per-Column Compression

You can override the table-level compression algorithm for individual columns of an OLAP table. This is useful when a table contains columns with different data characteristics. For example, you can use fast LZ4F compression for most columns and a higher ZSTD compression level for a large text column. Per-column compression is supported in both cloud and non-cloud deployments.

### Syntax

Add the `COMPRESSION` clause to a column definition in `CREATE TABLE`:

```sql
<column_name> <data_type> [column_attributes]
    COMPRESSION <algorithm> [ (<level>) ]
```

- `<algorithm>` is an SQL keyword and is case-insensitive.
- `<level>` is optional. If it is omitted, Doris uses the default level of the selected algorithm.
- A column without a `COMPRESSION` clause inherits the table-level `compression` property.
- If the column also has a `COMMENT` clause, place `COMPRESSION` before `COMMENT`.

### Parameters

| Parameter | Required | Default | Description |
| --------- | -------- | ------- | ----------- |
| `<algorithm>` | Yes | None | Compression algorithm for this column. The value is case-insensitive and must be one of the algorithms listed below. |
| `<level>` | No | Codec default | Compression level. It can be specified only for `ZSTD` and `LZ4HC`. |

### Supported Algorithms and Levels

| Algorithm | Compression level | Description |
| --------- | ----------------- | ----------- |
| `NO_COMPRESSION` | Not supported | Disables compression for the column. |
| `LZ4` | Not supported | Uses the LZ4 codec. |
| `LZ4F` | Not supported | Uses the LZ4 frame codec. |
| `LZ4HC` | Optional, `1` to `12` | Uses LZ4 high-compression mode. A higher level generally increases compression time and compression ratio. |
| `ZSTD` | Optional, `1` to `22` | Uses Zstandard. A higher level generally increases compression time and compression ratio. |
| `SNAPPY` | Not supported | Uses the Snappy codec. |
| `ZLIB` | Not supported | Uses the Zlib codec. |

Specifying a level for any algorithm other than `ZSTD` or `LZ4HC` causes the DDL statement to fail.

### Example

The following example uses LZ4F as the table default and overrides the `event_body` column with ZSTD level 9:

```sql
CREATE TABLE compression_example (
    event_id BIGINT,
    event_type VARCHAR(32),
    event_body STRING COMPRESSION ZSTD(9)
)
DUPLICATE KEY(event_id)
DISTRIBUTED BY HASH(event_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "compression" = "lz4f"
);

INSERT INTO compression_example VALUES
    (1, 'login', '{"user":"alice","result":"success"}'),
    (2, 'query', '{"sql":"SELECT COUNT(*) FROM orders"}');

SELECT event_id, event_type FROM compression_example ORDER BY event_id;
```

```text
+----------+------------+
| event_id | event_type |
+----------+------------+
|        1 | login      |
|        2 | query      |
+----------+------------+
```

In this table, `event_id` and `event_type` use the table-level LZ4F codec, while `event_body` uses ZSTD level 9.

### Limitations

- Per-column compression is supported only for OLAP tables.
- You can specify per-column compression only when creating a table. `ALTER TABLE ADD COLUMN` and `ALTER TABLE MODIFY COLUMN` do not support the `COMPRESSION` clause.
- The `COMPRESSION` clause does not support `ARRAY`, `MAP`, `STRUCT`, `VARIANT`, or `AGG_STATE` columns.
- An unsupported algorithm, an invalid level syntax, or a level outside the supported range causes the DDL statement to fail.

### Best Practices

- Start with one table-level algorithm, and add per-column overrides only for columns whose size or access pattern justifies a different trade-off.
- Use ZSTD or LZ4HC levels selectively on large, compressible columns. Higher levels increase write-time CPU consumption and do not always produce a meaningful storage reduction.
- Benchmark representative load and query workloads before applying different codecs broadly. Compression results depend on value distribution, repetition, encoding, and page size.
- Because per-column compression cannot be added or changed through schema change, choose the policy during table design. To change it later, create a new table with the desired definitions and migrate the data.
