---
{
    "title": "Wide Table Storage Format V3",
    "language": "en",
    "description": "Starting from Doris 4.1.0, the V3 wide table storage format loads column metadata on demand, making wide-table Segment opening 16x faster and reducing memory usage by 60x.",
    "keywords": [
        "wide table storage format",
        "Storage Format V3",
        "VARIANT wide table query",
        "slow Segment opening",
        "slow wide table query",
        "high wide table memory usage",
        "on-demand column metadata loading",
        "object storage query latency"
    ]
}
---

<!-- Knowledge type: Feature introduction / Performance tuning / Configuration parameter -->
<!-- Applicable scenario: Wide table query tuning / VARIANT column performance tuning / Object storage cold query -->

:::tip
This feature is supported starting from Apache Doris 4.1.0. Set `"storage_format" = "V3"` in the `PROPERTIES` clause when creating a table to enable it.
:::

The **wide table storage format V3** restructures the Segment metadata layout for tables with a very large number of columns. By splitting column metadata out of the Footer and loading it on demand, V3 significantly reduces Segment opening latency and memory usage.

## Applicable Scenarios

If your queries show that **the "Segment opening" phase is very slow and memory usage is unusually high**, and your case matches any scenario in the table below, enabling the V3 storage format is recommended:

| User scenario                                  | Typical symptom                                                                  | V3 recommended? |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | --------------- |
| Wide tables (hundreds to thousands of columns) | Segment opening takes a lot of time and memory even when only a few columns are queried | Recommended     |
| Tables with `VARIANT` columns                  | After dynamic subcolumn expansion, the actual number of stored columns far exceeds the surface definition | Recommended     |
| Deployed on object storage / tiered storage    | Data resides on remote storage such as S3 or OSS, and cold query latency is sensitive | Recommended     |
| Regular tables (a few dozen columns or fewer)  | Segment opening overhead is negligible                                           | No need to switch |

> **Typical pain point example**: On a wide table with 7,000 columns and 10,000 Segments in total, opening the Segments takes about **65 seconds**, with peak memory usage reaching **60 GB** during the process. This overhead is unrelated to whether the query actually uses these columns; it is a pure "boarding cost".

## Root Cause

The old format packs the metadata of all columns (`ColumnMetaPB`) together at the end of the Segment file inside the Footer, which leads to:

1. **Full metadata loading**: Opening a Segment requires deserializing the entire Footer first. Even if the query only uses two columns, the full cost is paid.
2. **Footer size inflation**: When the column count reaches several thousand, the Footer itself can grow to several MB.
3. **Amplification effect on remote storage**: Network latency and high read costs on object storage further amplify the overhead above.

In other words, even if a SQL statement only queries 2 columns, Doris still has to read **the metadata of all columns** in the Segment into memory and deserialize it before scanning can begin. The more columns and the more Segments there are, the more dramatic this overhead becomes.

## Key V3 Optimizations

V3 restructures the storage format along three dimensions:

### Optimization 1: On-Demand Column Metadata Loading

V3 splits column metadata out of the Footer and places it in a separate region of the file. The Footer only keeps lightweight pointers to the metadata of each column.

![Wide table storage format - Segment file layout comparison](/images/variant/storage-format-v3-layout.png)

When opening a Segment, the system only reads a slim Footer; the metadata of the columns actually used is fetched only when needed. **This is the primary source of performance improvement in wide table scenarios**, and is especially noticeable on object storage.

### Optimization 2: Plain Encoding by Default for Numeric Types

V3 switches the default encoding for numeric types such as `INT` and `BIGINT` from BitShuffle to `PLAIN_ENCODING` (raw binary). Combined with LZ4 / ZSTD compression, this delivers faster reads and lower CPU overhead during large bulk scans.

### Optimization 3: More Compact Plain Encoding for Strings

For strings and JSONB, V3 introduces `BINARY_PLAIN_ENCODING_V2`, which uses a streaming layout of `[length(varuint)][raw data]`. It eliminates the trailing offset table required by the old encoding and is more compact in storage.

## Measured Results

Test conditions: a wide table with 7,000 columns and 10,000 Segments in total.

![Wide table storage format - Metadata opening efficiency](/images/variant/storage-format-v3-benchmark.png)

| Metric                       | Old format | V3 format | Improvement     |
| ---------------------------- | ---------: | --------: | --------------- |
| Segment opening time         |       65 s |       4 s | **16x faster**  |
| Memory usage when opening    |      60 GB |    < 1 GB | **60x lower**   |

## How to Enable

Explicitly specify `storage_format` as `V3` in the `PROPERTIES` clause of the CREATE TABLE statement:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    name VARCHAR(128),
    attrs VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## Recommendations

- **Recommended to enable**: wide tables with many columns (hundreds or more), tables with `VARIANT` columns, and tables deployed on object storage or tiered storage.
- **No need to switch**: regular tables with few columns (a few dozen or fewer); the old format is already sufficient.

## Related Documentation

- [Data Compression](./column-compression): learn about V3's coordinated optimizations of encoding and compression for numeric and string types.
