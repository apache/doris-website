---
{
    "title": "Local Disk Tiered Storage",
    "language": "en",
    "description": "Introduction to Doris SSD and HDD tiered storage: keep hot data on SSD and automatically migrate cold data to HDD based on dynamic partitions, balancing query performance and storage cost.",
    "keywords": [
        "Doris tiered storage",
        "SSD HDD hot-cold separation",
        "dynamic partition",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "hot-cold data migration"
    ]
}
---

<!-- Knowledge type: Feature introduction + Configuration parameters + Operation steps -->
<!-- Applicable scenarios: Hot-cold data separation / Storage cost optimization / Query performance assurance -->

Doris supports tiered storage between SSD and HDD. Combined with dynamic partitions, the system can keep hot data on SSD and automatically migrate cold data to HDD based on the hot-cold characteristics of the data, ensuring high-performance read and write of hot data while reducing overall storage cost.

## Applicable Scenarios

This document applies to the following scenarios:

- Table data is partitioned by time and exhibits clear hot-cold access characteristics.
- The cluster has both SSD and HDD storage media.
- You want to use SSD to accelerate queries on recent hot data and HDD to save cost on historical cold data.
- You want dynamic partitions to automatically manage the data lifecycle, avoiding manual migration.

## Quick Navigation

- [Core Concepts](#core-concepts): the relationship between dynamic partitions and tiered storage.
- [Parameter Reference](#parameter-reference): how to use `hot_partition_num` and `storage_medium`.
- [Usage Example](#usage-example): table creation SQL and partition distribution verification.
- [FAQ](#faq): common questions during use.
- [Troubleshooting](#troubleshooting): handling exceptions such as partition creation failures.

## Core Concepts

<!-- Knowledge type: Feature introduction -->

Tiered storage is implemented based on dynamic partitions. Doris automatically chooses the storage medium according to how active a partition is, and migrates data to the target medium once the cooldown time is reached.

### Hot Partitions and Cold Partitions

| Type           | Description                                          | Storage Medium | Performance Characteristics |
| -------------- | ---------------------------------------------------- | -------------- | --------------------------- |
| Hot partition  | Recently active, frequently accessed partition       | SSD            | High IOPS, low latency      |
| Cold partition | Historical data, accessed less frequently            | HDD            | Large capacity, low cost    |

### How It Works

The execution flow of tiered storage is as follows:

1. Enable dynamic partitions when creating the table, and set `dynamic_partition.storage_medium = HDD`.
2. Use `dynamic_partition.hot_partition_num` to designate the most recent N partitions as hot partitions, stored on SSD.
3. The system sets a `storage_cooldown_time` for each hot partition.
4. Once the cooldown time is reached, partition data is automatically migrated from SSD to HDD.

For more about dynamic partitions, see [Data Partitioning - Dynamic Partition](../../table-design/data-partitioning/dynamic-partitioning).

## Parameter Reference

<!-- Knowledge type: Configuration parameters -->

Tiered storage relies on the following two dynamic partition parameters:

| Parameter                              | Purpose                                                                  | Default | Notes                                                            |
| -------------------------------------- | ------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------- |
| `dynamic_partition.hot_partition_num`  | Specifies how many of the most recent partitions are hot, stored on SSD  | None    | Must be used together with `storage_medium = HDD`                |
| `dynamic_partition.storage_medium`     | Specifies the final storage medium for dynamic partitions                | HDD     | When set to SSD, `hot_partition_num` no longer takes effect      |

### dynamic_partition.hot_partition_num

- **Function**: Specifies the most recent N partitions as hot partitions. These partitions are stored on SSD, while the remaining partitions are stored on HDD.
- **Conditions for use**:
    - You must also set `dynamic_partition.storage_medium = HDD`. Otherwise this parameter does not take effect.
    - An SSD device must exist under the storage path. Otherwise partition creation fails.

**Example**:

Assume the current date is **2021-05-20**, partitions are by day, and the dynamic partition configuration is as follows:

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

The system automatically creates the following partitions, with the corresponding storage medium and cooldown time:

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

### dynamic_partition.storage_medium

- **Function**: Specifies the final storage medium for dynamic partitions. Valid values are `HDD` (default) or `SSD`.
- **Notes**:
    - When set to `SSD`, the `hot_partition_num` parameter is ignored.
    - In this case all partitions use SSD storage, and the cooldown time is uniformly set to `9999-12-31 23:59:59`, meaning no migration occurs.

## Usage Example

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Verifying storage medium distribution -->

The following steps show how to create a table that supports tiered storage and verify the storage medium distribution of the partitions.

### Step 1: Create a Tiered Storage Table

Goal: Create a table with SSD/HDD tiered storage enabled, where the most recent 2 partitions use SSD and the rest use HDD.

```sql
CREATE TABLE tiered_table (k DATE)
PARTITION BY RANGE(k)()
DISTRIBUTED BY HASH (k) BUCKETS 5
PROPERTIES
(
    "dynamic_partition.storage_medium" = "hdd",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = "2",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "5",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.start" = "-3"
);
```

### Step 2: Check the Partition Storage Medium

Goal: Confirm that partitions are assigned to SSD and HDD as expected.

```sql
SHOW PARTITIONS FROM tiered_table;
```

Expected output: 7 partitions in total, of which 5 use SSD and 2 use HDD.

```Plain
p20210517: ["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518: ["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519: ["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520: ["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521: ["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522: ["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523: ["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

## FAQ

<!-- Knowledge type: FAQ -->

### Q1: What if `hot_partition_num` does not take effect?

Verify that `dynamic_partition.storage_medium = HDD` is also set. The hot partition configuration only takes effect when the final medium is HDD.

### Q2: Can I use SSD storage only?

Yes. Set `dynamic_partition.storage_medium` to `SSD`, and all partitions use SSD with no cooldown migration. In this case there is no need to configure `hot_partition_num`.

### Q3: How is data migrated after the cooldown time is reached?

When a partition's `storage_cooldown_time` is reached, the system automatically migrates the partition data from SSD to HDD without manual intervention.

### Q4: What is the difference between tiered storage and hot-cold data archiving (such as object storage)?

SSD/HDD tiered storage is used for data movement between different local disk media, suitable for short-term to mid-term hot-cold separation. To archive historical data to object storage (S3, HDFS, and so on), see the documentation on hot-cold tiered storage.

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Table creation failure / Partition creation failure -->

| Error Symptom                                  | Possible Cause                              | Solution                                                                          |
| ---------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| Partition creation fails                       | No SSD device under the storage path        | Configure an SSD storage path on the BE node, or switch to HDD-only storage       |
| `hot_partition_num` does not take effect       | `storage_medium = HDD` is not set           | Also configure `dynamic_partition.storage_medium = HDD`                           |
| All partitions are SSD, no cooldown to HDD     | `storage_medium` is set to `SSD`            | Change `storage_medium` to `HDD` and configure `hot_partition_num`                |
| Data is not migrated to HDD as expected        | `storage_cooldown_time` has not been reached | Wait for the cooldown time to be reached, or check that the time setting is correct |
