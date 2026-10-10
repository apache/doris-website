---
{
    "title": "Data Bucketing",
    "language": "en",
    "description": "Doris data bucketing guide: how to choose between Hash and Random bucketing, select bucket keys, and determine the number of buckets to improve query performance and avoid data skew.",
    "keywords": [
        "Doris data bucketing",
        "Hash bucketing",
        "distribution_hash_type",
        "Random bucketing",
        "bucket key selection",
        "bucket number",
        "tablet",
        "data skew"
    ]
}
---

<!-- Knowledge type: Architecture decision / Configuration parameter -->
<!-- Applicable scenarios: Table design / Performance tuning / Data skew handling -->

A partition can be further divided into multiple data buckets according to business requirements. Each bucket is stored as a physical data shard (Tablet). A reasonable bucketing strategy can effectively reduce the amount of data scanned at query time, improve query performance, and increase concurrent processing capability.

This document is organized along the decision path used during table creation: first choose the bucketing method, then select the bucket key, and finally determine the number of buckets and the subsequent maintenance approach.

## Quick Decision

When creating a table, you can complete the bucketing design in the following order:

| Step | Decision Item | Key Considerations |
|------|------|----------|
| 1 | Choose the bucketing method | Whether there are high-frequency filter columns, whether the data is evenly distributed, and the table model |
| 2 | Select the bucket key (Hash bucketing only) | Query filter conditions, column cardinality, query concurrency and throughput characteristics |
| 3 | Select the hash algorithm (Hash bucketing only) | Choose an appropriate hash algorithm based on the bucket key's data distribution and business logic |
| 4 | Determine the number of buckets | Data size per Tablet, number of BEs, number of disks |
| 5 | Plan the bucket maintenance strategy | Data growth trend, whether dynamic partitioning is used |

## 1. Choose the Bucketing Method

Doris supports two bucketing methods: **Hash bucketing** and **Random bucketing**. Their core differences are as follows:

| Comparison Item | Hash Bucketing | Random Bucketing |
|--------|----------|------------|
| Data distribution method | Divided by the Hash value of the bucket key | Randomly and evenly distributed |
| Whether a bucket key is required | Required | Not required |
| Whether bucket pruning is supported | Supported | Not supported |
| Applicable table models | DUPLICATE / UNIQUE / AGGREGATE | DUPLICATE only |
| Risk of data skew | Depends on the choice of bucket key | Lower |
| Applicable scenarios | Point queries that frequently filter by a specific column | Analysis on arbitrary dimensions, data prone to skew |

### 1. Hash Bucketing

When creating a table or adding a new partition, you need to choose one or more columns as the bucket key and explicitly specify the number of buckets. Within the same partition, the system performs a Hash calculation based on the bucket key and the number of buckets, and rows with the same Hash value are assigned to the same bucket.

For example, in the figure below, the `p250102` partition is divided into 3 buckets by the `region` column, and rows with the same Hash value are placed in the same bucket.

![hash-bucket](/images/table-desigin/hash-bucket.png)

**Recommended scenarios:**

- When the business frequently filters on a specific field, you can use that field as the bucket key and leverage bucket pruning to improve query efficiency.
- The data in the table is relatively evenly distributed and unlikely to be skewed.

**Example:** Create a table with Hash bucketing. For detailed syntax, see [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md).

The examples below qualify table names with the `demo` database; create it first if it doesn't exist on your cluster:

```sql
CREATE DATABASE IF NOT EXISTS demo;
```

```sql
CREATE TABLE demo.hash_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY HASH(region) BUCKETS 8;
```

In the example, `DISTRIBUTED BY HASH(region)` specifies the use of Hash bucketing and selects the `region` column as the bucket key. `BUCKETS 8` specifies the creation of 8 buckets.

### 2. Random Bucketing

Random bucketing randomly distributes data across the buckets within each partition, without relying on the Hash value of any field. This approach ensures that data is evenly spread out and avoids data skew caused by an inappropriate choice of bucket key.

When data is loaded, each batch in a single load job is randomly written to a Tablet, which guarantees an even data distribution. For example, in the figure below, 8 batches of data are randomly assigned to 3 buckets under the `p250102` partition.

![random-bucket](/images/table-desigin/random-bucket.png)

When using Random bucketing, you can enable single-tablet load mode (set `load_to_single_tablet` to `true`), so that the data of a single batch is written to only one data shard. This can:

- Improve the concurrency and throughput of large-scale data loads.
- Reduce write amplification caused by data loading and Compaction operations.
- Improve cluster stability.

**Recommended scenarios:**

- Analysis on arbitrary dimensions, where the business has no fixed filter or join columns.
- The data distribution of frequently queried columns or column combinations is highly uneven, and data skew must be avoided.

**Unsuitable scenarios:**

- Point query scenarios: Random bucketing cannot perform pruning based on the bucket key, so it scans all data in the matched partitions.
- UNIQUE and AGGREGATE tables: only DUPLICATE tables support Random bucketing.

**Example:** Create a table with Random bucketing. For detailed syntax, see [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md).

```sql
CREATE TABLE demo.random_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY RANDOM BUCKETS 8;
```

In the example, `DISTRIBUTED BY RANDOM` specifies the use of Random bucketing and does not require selecting a bucket key. `BUCKETS 8` specifies the creation of 8 buckets.

## 2. Select the Bucket Key

:::tip Tip

Only Hash bucketing requires selecting a bucket key. Random bucketing does not.

:::

The bucket key can consist of one or more columns. Different table models impose the following restrictions on the bucket key:

| Table Model | Eligible Bucket Keys |
|--------|----------|
| DUPLICATE | Any Key column or Value column |
| AGGREGATE / UNIQUE | Must be Key columns (to ensure correct data aggregation) |

### Selection Principles

Based on business query characteristics, you can refer to the following principles when selecting a bucket key:

| Principle | Description | Benefit |
|------|------|------|
| Leverage query filter conditions | Choose columns that frequently appear as filters in queries as the bucket key | Supports bucket pruning and reduces the amount of data scanned |
| Leverage high-cardinality columns | Choose columns with many distinct values as the bucket key | Data is evenly distributed and skew is avoided |
| High-concurrency point query scenarios | Choose a single column or a small number of columns as the bucket key | A single query triggers a scan of only one bucket, reducing IO interference between queries |
| High-throughput query scenarios | Choose multiple columns as the bucket key | Data is more evenly distributed; when the query conditions cannot fully match the equality conditions, overall throughput is improved |

## 3. Select the Hash Algorithm

Hash-bucketed tables use the `distribution_hash_type` table property to specify how bucket-key values map to buckets. The property supports the following values:

| Value | Default | Mapping | Recommended Use |
|---|---|---|---|
| `crc32` | Yes | Update one running CRC32 with each bucket-key value's encoded bytes in declared column order, then take modulo of the bucket count. | General-purpose Hash bucketing. |
| `identity` | No | Interpret each column's encoded bytes separately as an unsigned little-endian integer, combine columns in declared order with earlier columns occupying higher positions, and take modulo of the bucket count during calculation. | Workloads where the bucket distribution can be derived directly from the original data, such as data already bucketed by the bucket key. |

Consider this bucketing definition:

```sql
DISTRIBUTED BY HASH(col1, col2, ...) BUCKETS bucket_num
```

For each row, encode each column value using its type-specific byte representation. Primes distinguish the bytes of `col2`:

```text
col1 → B1 = [b1,  b2,  ..., bn ]   n bytes
col2 → B2 = [b1', b2', ..., bm']   m bytes
```

Each `b` is a byte in `0…255`. `n` and `m` are the encoded byte lengths: fixed-width types determine the length (for example, 4 bytes for `INT`), strings use their actual byte lengths, and NULL uses four zero bytes. These are Doris-defined type encodings, not uniformly displayed text or raw memory layouts; for example, legacy DATE/DATETIME uses formatted text bytes.

`bucket_num` is the bucket count, and bucket numbers start at `0`.

### CRC32

With `distribution_hash_type = "crc32"`, feed the byte sequences into one running CRC32 calculation in declared column order:

```text
h0 = 0
h1 = CRC32_UPDATE(h0, [b1,  b2,  ..., bn ])
h2 = CRC32_UPDATE(h1, [b1', b2', ..., bm'])
...
bucket = hash after the final column % bucket_num
```

`CRC32_UPDATE(h, B)` continues the zlib CRC32 calculation from the existing result `h` using byte sequence `B`.

**Caveats:** Mixing bytes can improve some patterned distributions, but distinct hashes can still land in the same bucket after modulo. Rehashing already balanced bucket-key values may concentrate them into fewer buckets, so `bucket_num` distinct values are not guaranteed to occupy all `bucket_num` buckets.

### IDENTITY

With `distribution_hash_type = "identity"`, first interpret each column's bytes as an unsigned little-endian integer, with the first byte having the lowest weight:

```text
u1 = b1  + b2  * 256 + ... + bn  * 256^(n-1)
u2 = b1' + b2' * 256 + ... + bm' * 256^(m-1)
```

Combine columns in declared order. For each new column, shift the preceding result left by that column's byte length, add its integer value, and take modulo:

```text
r0 = 0
r1 = (r0 * 256^n + u1) % bucket_num = u1 % bucket_num
r2 = (r1 * 256^m + u2) % bucket_num
...
bucket = remainder after the final column
```

Here, `^` denotes exponentiation. Each column is interpreted little-endian internally, but earlier columns occupy the more significant positions when combined. The implementation takes modulo incrementally without constructing the full large integer. For a single non-negative integer, `u1` is the original value, simplifying the calculation to `bucket = value % bucket_num`.

**Caveats:** Except for a single non-negative integer, `identity` is not simply modulo of the displayed value. Consecutive displayed values do not imply consecutive encoded remainders; the result depends on the type's encoding, as shown below. Bytes are shown in hexadecimal, and examples use a single bucket column unless multiple columns are specified.

| Key Type | Encoding Rules | Calculation and Result |
|---|---|---|
| Negative integers | Preserve the two's-complement bit pattern at the type's width, then interpret it as unsigned; do not take modulo of the negative value directly. | `INT` value `-1` → `FF FF FF FF` → unsigned integer `4294967295` (`2^32 - 1`). With ten buckets, `4294967295 % 10 = 5`, reaching bucket 5. |
| DECIMAL V3 | Convert to an unscaled integer according to the scale, then interpret its storage-width encoding as unsigned. Legacy DECIMALV2 uses a different encoding and does not follow this rule. | `DECIMAL(9,2)` value `1.00` → integer `100` → `64 00 00 00`. With eight buckets, `100 % 8 = 4`, reaching bucket 4. |
| Strings | Interpret the actual bytes as little-endian without parsing numeric parts or suffixes. | `'user1'` → `75 73 65 72 31` → `117 + 115×256 + 101×256^2 + 114×256^3 + 49×256^4`. Since 8 divides 256, all terms except the first have remainder 0, giving `117 % 8 = 5`. `'user2'` through `'user8'` also reach bucket 5. |
| Date/time | Uses type-specific encodings, not a uniform epoch timestamp. The lowest 20 bits of DATETIMEV2 hold the microsecond component. | Whole-second DATETIMEV2 values have a zero microsecond component, so their encoded integers are multiples of `2^20`. With eight buckets, all have remainder 0 and reach bucket 0. This conclusion does not apply to every date/time type. |
| NULL | Always encodes as four zero bytes, regardless of the declared type's width. | A single-column NULL → `00 00 00 00` → `0`, reaching bucket 0. With multiple columns, it updates the existing remainder `r` to `(r × 256^4) % bucket_num`, which is not necessarily 0. |
| Empty strings | Encoded length is 0; no bytes are appended. | A single-column empty string retains the initial value `0`, reaching bucket 0. With multiple columns, it leaves the existing remainder `r` unchanged, unlike NULL. |
| Multiple columns | Interpret each column internally as little-endian; earlier columns occupy higher positions when combined, shifted according to the next column's encoded length. | For two non-NULL `INT` columns encoded as `u1` and `u2`, eight buckets give `(u1 × 256^4 + u2) % 8 = u2 % 8`. Only the last column's low three bits matter, so even a high-cardinality composite key can be skewed. |

:::caution Compatibility and immutability

- `crc32` is the default and preserves the bucket layout of existing tables. If the property is omitted, `SHOW CREATE TABLE` does not display it.
- The hash algorithm is fixed when the table is created and cannot be changed later. New partitions automatically inherit the table's hash algorithm, even when `ADD PARTITION` specifies a different bucket number.
- Every table in the same Colocation Group must use the same `distribution_hash_type`; Doris rejects a table whose algorithm differs from the group.

:::

**Best practices:**

1. **Evaluate `identity` first when bucket-key modulo is balanced:** For a single non-negative integer, check the data volume per bucket for `value % bucket_num`. `identity` can avoid disrupting an existing distribution with extra hashing. When the greatest common divisor of a fixed step and `bucket_num` is greater than 1, only some buckets may be occupied.
2. **Evaluate `crc32` first for unbalanced modulo, non-integer keys, or multiple columns:** Using `identity` in these cases requires understanding the type encodings and combination rules. Consecutive displayed values or high-cardinality composite keys do not guarantee balance. `crc32` combines all bucket columns into its hash calculation, which can improve some patterned distributions and works well with non-integer and multi-column keys.
3. **Validate with actual data:** Use representative data and the target bucket count; compare per-bucket row counts, data sizes, and hotspots within each partition after loading. Re-evaluate when new partitions use a different bucket count. Counting distinct keys or taking modulo of displayed text is insufficient. Neither algorithm can split hotspots caused by identical complete bucket keys; address these through bucket-key design.
4. **Choose before creating the table:** The algorithm is immutable; switching requires a new table and rewriting the data. New partitions inherit the table's algorithm, and tables in the same Colocation Group must use the same algorithm.

## 4. Determine the Number of Buckets

In Doris, each Bucket is stored as a physical file (Tablet). The total number of Tablets in a table equals:

```text
Total Tablets = partition_num × bucket_num
```

:::caution Caution

Once the number of buckets for a Partition is specified, it cannot be changed. When determining the number of buckets, plan ahead for future machine scaling.

:::

Starting from version 2.0, Doris supports automatically setting the number of buckets in a partition based on machine resources and cluster information. You can choose between manual and automatic methods according to how precise the business requires the estimation to be.

### 1. Manually Set the Number of Buckets

Specify the number of buckets through the `DISTRIBUTED` clause:

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```

#### Decision Principles

When determining the number of buckets, follow the two principles below. When they conflict, **prioritize the size principle**:

1. **Size principle**: The compressed data size of each Tablet (excluding indexes) is recommended to stay between **1 GB and 20 GB**, and no more than **10 GB** for Unique Key tables.
    - Tablets that are too small: aggregation is less effective, and metadata management overhead increases.
    - Tablets that are too large: replica migration and recovery become difficult, and the cost of retrying a failed Schema Change increases.
    - You can use `SHOW TABLETS FROM your_table` to check the actual Tablet sizes.

2. **Quantity principle**: Without considering scaling, the number of Tablets in a table is recommended to be slightly larger than the total number of disks in the cluster.

In addition, note the following:

- The number of buckets should be an integer multiple of the number of BEs to ensure even data distribution.
- The number of buckets in a single partition should generally not exceed **128**. If you need more, partition the table first.

#### Recommended Configuration Examples

Suppose the cluster has 10 BE machines, each with one disk. You can refer to the table below to set the number of buckets:

| Compressed Partition Data Size | Recommended Number of Buckets |
|-----------------|-----------------|
| < 1 GB | 1 bucket |
| 1 - 10 GB | 10 buckets |
| 10 - 200 GB | 10 - 20 buckets |
| > 200 GB | Partition the table first |

:::tip Tip

You can check the data size of a table with the `SHOW DATA` command. The result must be divided by the number of replicas to obtain the actual data size of the table.

:::

### 2. Automatically Set the Number of Buckets

The automatic bucket inference feature predicts future partition sizes based on the partition sizes over a recent period and determines the number of buckets accordingly.

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY RANDOM BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```

The `estimate_partition_size` property is used to adjust the initial estimate of the partition size:

- This parameter is optional. If not specified, the default value is `10GB`.
- This parameter only affects the initial estimate and is independent of the future partition size that the system later infers from historical partition data.

The computed bucket number is clamped between the FE configurations `autobucket_min_buckets` and `autobucket_max_buckets`:

| FE configuration | Default | Description |
|---|---|---|
| `autobucket_min_buckets` | 3 | Lower bound of the auto bucketing result. **The default changed from `1` to `3` in 4.0.8 for the 4.0 series and in 4.1.4 for the 4.1 series** |
| `autobucket_max_buckets` | 128 | Upper bound of the auto bucketing result |

:::caution Behavior change (4.0.8 / 4.1.4)

The default of `autobucket_min_buckets` changed from `1` to `3` in 4.0.8 (the 4.0 series) and in 4.1.4 (the 4.1 series). Previously a small partition could be computed down to a single bucket, giving insufficient parallelism and data distribution. After the change, auto bucketing never produces fewer than 3 buckets.

The change only affects partitions **created after** the upgrade; the bucket number of existing partitions is unchanged. Set `autobucket_min_buckets` back to `1` explicitly to keep the old behavior.

:::

## 5. Maintain Data Bucketing

:::tip Tip

Currently, Doris only supports modifying the number of buckets for newly added partitions. The following operations are not supported:

1. Modifying the bucketing type is not supported.
2. Modifying the bucket key is not supported.
3. Modifying the hash algorithm (`distribution_hash_type`) is not supported.
4. Modifying the number of buckets for already-created buckets is not supported.

:::

When creating a table, the number of buckets for each partition is uniformly specified through the `DISTRIBUTED` clause. To handle data growth or shrinkage, you can specify the number of buckets for a new partition individually when dynamically adding partitions.

The following examples show how to modify the number of buckets for newly added partitions through the `ALTER TABLE` command:

```sql
-- Modify hash bucket table
ALTER TABLE demo.hash_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY HASH(region) BUCKETS 16;

-- Modify random bucket table
ALTER TABLE demo.random_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY RANDOM BUCKETS 16;

-- Modify dynamic partition table
ALTER TABLE demo.dynamic_partition_tbl
SET ("dynamic_partition.buckets"="16");
```

After modifying the number of buckets, you can check the result with the `SHOW PARTITION` command.
