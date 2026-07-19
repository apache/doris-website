---
{
    "title": "Disk Capacity Management",
    "language": "en",
    "description": "Covers the Doris BE disk watermark mechanism (high watermark, flood stage), the related FE/BE parameters, and the emergency procedures for releasing space and recovering after a disk fills up.",
    "keywords": [
        "disk capacity management",
        "disk watermark",
        "high watermark",
        "flood stage",
        "Flood Stage",
        "High Watermark",
        "storage_root_path",
        "BE disk full",
        "disk usage",
        "ADMIN CLEAN TRASH",
        "recycle bin cleanup",
        "disk space reclamation",
        "Doris operations",
        "tablet deletion",
        "replica modification"
    ]
}
---

<!-- Knowledge type: Operations / Configuration parameters / Troubleshooting -->
<!-- Applicable scenarios: BE disk usage too high, BE process failure caused by a full disk, need to proactively control disk watermarks -->

This document covers the system parameters and handling strategies related to disk storage space in Doris. It helps operations engineers understand the disk watermark mechanism, configure reasonable thresholds, and quickly recover the cluster when disks are under pressure or even full.

If the data disks in Doris are not controlled, the BE process exits abnormally once a disk fills up. Doris monitors the usage and remaining space of each disk and sets different warning watermarks to restrict operations in the system, which avoids filling up the disks as much as possible.

## Applicable Scenarios

<!-- Knowledge type: Scenario description -->

| Scenario | Focus |
| --- | --- |
| Day-to-day capacity planning | Understand the FE/BE watermark mechanism and warn early |
| Disk usage approaches the high watermark | Adjust FE thresholds and avoid letting balancing or recovery consume more space |
| Disk usage reaches the flood stage | Investigate why writes are blocked and proactively release space |
| BE cannot start because the disk is full | Delete temporary files and recover the process urgently |
| Rapid cost reduction with multi-replica tables | Temporarily lower the replica count and raise it back after recovery |

## Terminology

- **Data Dir**: each data directory specified in `storage_root_path` in the BE configuration file `be.conf`. Typically each data directory corresponds to one disk, so **disk** below also refers to a data directory.
- **High Watermark**: the lower threshold on the FE side. When usage exceeds this threshold, certain operations (such as balancing) are restricted.
- **Flood Stage**: the higher threshold present on both the FE and BE sides. When usage exceeds this threshold, critical operations such as writes are forbidden as a self-protection measure.

## Basic Principles

<!-- Knowledge type: How it works -->

1. BE reports the disk usage to FE about once every minute.
2. Based on the reported statistics, FE restricts different operations:
    - When usage exceeds the **high watermark**, balancing, decommission, and similar operations are restricted.
    - When usage exceeds the **flood stage**, write operations such as load and restore are forbidden.
3. Because FE cannot sense BE disk state fully in real time and cannot control BE internal tasks such as compaction, the **flood stage** is also set on BE, where BE actively rejects and stops certain operations as a self-protection measure.

## FE Parameters

<!-- Knowledge type: Configuration parameters -->

The FE side configures two threshold levels: **high watermark** and **flood stage**. Each level includes two conditions: "usage percentage" and "remaining capacity."

### High Watermark

```text
storage_high_watermark_usage_percent defaults to 85 (85%).
storage_min_left_capacity_bytes defaults to 2GB.
```

Trigger condition: disk usage is **greater than** `storage_high_watermark_usage_percent`, **or** remaining disk capacity is **less than** `storage_min_left_capacity_bytes`.

Once triggered, the disk is no longer used as the destination path for the following operations:

- Tablet balancing (Balance)
- Redistribution of data shards for Colocation tables (Relocation)
- Decommission

### Flood Stage

```text
storage_flood_stage_usage_percent defaults to 95 (95%).
storage_flood_stage_left_capacity_bytes defaults to 1GB.
```

Trigger condition: disk usage is **greater than** `storage_flood_stage_usage_percent`, **and** remaining disk capacity is **less than** `storage_flood_stage_left_capacity_bytes`.

Once triggered, the disk is no longer used as a destination path, and the following operations are forbidden:

- Tablet balancing (Balance)
- Redistribution of data shards for Colocation tables (Relocation)
- Replica supplementation
- Restore operations
- Data load (Load/Insert)

### FE Parameter Summary

| Parameter | Default | Description |
| --- | --- | --- |
| `storage_high_watermark_usage_percent` | 85 (85%) | FE high-watermark usage threshold |
| `storage_min_left_capacity_bytes` | 2 GB | FE high-watermark remaining-capacity threshold |
| `storage_flood_stage_usage_percent` | 95 (95%) | FE flood-stage usage threshold |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | FE flood-stage remaining-capacity threshold |

## BE Parameters

<!-- Knowledge type: Configuration parameters -->

The BE side configures only the **flood stage**, used for self-protection when FE detection lags or cannot control BE internal tasks.

```text
storage_flood_stage_usage_percent defaults to 90 (90%).
storage_flood_stage_left_capacity_bytes defaults to 1GB.
```

Trigger condition: disk usage is **greater than** `storage_flood_stage_usage_percent`, **and** remaining disk capacity is **less than** `storage_flood_stage_left_capacity_bytes`.

Once triggered, the following operations on the disk are forbidden:

- Base/Cumulative Compaction
- Data writes (including all load operations)
- Clone Task: typically happens during replica repair or balancing
- Push Task: happens during the Loading phase of Hadoop load, when files are downloaded
- Alter Task: Schema Change or Rollup tasks
- Download Task: the Downloading phase of restore operations

### BE Parameter Summary

| Parameter | Default | Description |
| --- | --- | --- |
| `storage_flood_stage_usage_percent` | 90 (90%) | BE flood-stage usage threshold |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | BE flood-stage remaining-capacity threshold |

## Releasing Disk Space

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: disk above the high watermark or flood stage, need to recover the cluster quickly -->

When disk usage rises above the high watermark or even the flood stage, many operations are forbidden. You can try the following approaches to reduce disk usage and recover the system. Prefer lower-risk methods first, and only consider deleting data files directly as a last resort.

| Priority | Operation | Applicable scenario | Risk |
| --- | --- | --- | --- |
| 1 | Drop a table or partition | Historical data is available for cleanup | Not recoverable, but the scope is controlled |
| 2 | Scale out BE | Resources permit and you can wait hours to days | Low |
| 3 | Modify the replica count of a table or partition | Temporary cost reduction in emergencies | Data reliability decreases |
| 4 | Delete extra files (log/snapshot/trash) | BE cannot start because the disk is full | Affects recycle-bin recovery |
| 5 | Delete data files | All of the above failed; last resort | **May cause data loss** |

### Drop a Table or Partition

Dropping a table or partition quickly reduces disk usage and restores the cluster.

> **Note**: Only `DROP` reduces disk usage quickly; `DELETE` does not.

```text
DROP TABLE tbl;
ALTER TABLE tbl DROP PARTITION p1;
```

### Scale Out BE

After scale-out, data shards are automatically balanced to BE nodes with lower disk usage. Depending on the data volume and the number of nodes, the cluster reaches a balanced state in hours or days.

### Modify the Replica Count of a Table or Partition

You can lower the replica count of a table or partition. For example, the default 3 replicas can be reduced to 2. This method lowers data reliability, but it quickly reduces disk usage and restores the cluster to normal, and is typically used for emergency recovery. After recovery, reduce disk usage by scaling out or deleting data, and then restore the replica count to 3.

The replica modification takes effect immediately, and extra replicas are deleted asynchronously in the background.

```text
ALTER TABLE tbl MODIFY PARTITION p1 SET("replication_num" = "2");
```

### Delete Extra Files

When the BE process has already crashed because of a full disk and cannot start (this may happen when FE or BE detection lags), you can delete temporary files under the data directory to ensure the BE process can start. Files in the following directories can be deleted directly:

- `log/`: log files in the log directory.
- `snapshot/`: snapshot files in the snapshot directory.
- `trash/`: files in the recycle bin.

> **Note**: This operation affects [restoring data from the BE recycle bin](../data-admin/recyclebin).

If BE can still start, use the following command to actively clean up temporary files. The command cleans up **all** trash files and expired snapshot files, **which affects restoring data from the recycle bin**:

```text
ADMIN CLEAN TRASH ON(BackendHost:BackendHeartBeatPort);
```

If you do not run `ADMIN CLEAN TRASH` manually, the system still runs the cleanup automatically within a few minutes to tens of minutes. There are two cases:

- If disk usage **has not reached** 90% of the flood stage: only expired trash files and expired snapshot files are cleaned, recent files are kept, and data recovery is not affected.
- If disk usage **has reached** 90% of the flood stage: **all** trash files and expired snapshot files are cleaned, and **at this point recovery from the recycle bin is affected**.

The interval for the automatic cleanup can be changed through the configuration items `max_garbage_sweep_interval` and `min_garbage_sweep_interval`.

When recovery fails because trash files are missing, the result may look like:

```text
{"status": "Fail","msg": "can find tablet path in trash"}
```

### Delete Data Files (Dangerous!!!)

When none of the operations above can release space, you have to release space by deleting data files directly. Data files are located under the `data/` directory of the specified data directory.

> **Warning**: Before deleting a data shard (Tablet), make sure at least one replica of the Tablet is healthy. Otherwise, **deleting the only replica causes data loss**.

Suppose you want to delete the Tablet with id `12345`. The steps are as follows:

1. Find the directory of the Tablet, usually located under `data/shard_id/tablet_id/`. For example:

    ```text
    data/0/12345/
    ```

2. Record the tablet id and the schema hash. The schema hash is the next-level directory name under the previous step's directory. For example, `352781111`:

    ```text
    data/0/12345/352781111
    ```

3. Delete the data directory:

    ```shell
    rm -rf data/0/12345/
    ```

4. Delete the Tablet metadata (see [Tablet Metadata Management Tool](../trouble-shooting/tablet-meta-tool) for details):

    ```shell
    ./lib/meta_tool --operation=delete_header --root_path=/path/to/root_path --tablet_id=12345 --schema_hash=352781111
    ```

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q: A load task is rejected with an error. What should I do?

Disk usage has exceeded the FE or BE flood stage. See the "Releasing Disk Space" section, and prefer `DROP` on historical partitions or scaling out.

### Q: Replica balancing does not converge for a long time. What should I do?

Some disks are above the high watermark and cannot be used as balancing destinations. Release space on the disks above the high watermark or scale out BE, and then wait for automatic balancing.

### Q: The BE process fails to start and the disk is full. What should I do?

The disk holding `data/` is full. First delete `log/`, `snapshot/`, and `trash/` to release space, and then start BE.

### Q: After running `ADMIN CLEAN TRASH`, data cannot be restored. What should I do?

The trash files have been cleaned. This operation is irreversible. Assess the impact before recovery.

### Q: Automatic cleanup returns `can find tablet path in trash`. What should I do?

The disk has reached 90% of the flood stage and trash has been fully cleaned. Check the watermark status and try again after disk space is recovered.
