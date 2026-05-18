---
{
    "title": "Configuration Reference",
    "language": "en",
    "description": "Configuration reference for Doris CCR (Cross-Cluster Replication) across FE, BE, and database/table properties, including default values, applicable versions, and common tuning combinations.",
    "keywords": [
        "Doris CCR",
        "Cross-Cluster Replication",
        "Cross Cluster Replication",
        "CCR configuration",
        "FE configuration",
        "BE configuration",
        "binlog configuration",
        "restore_reset_index_id",
        "thrift_max_message_size",
        "binlog.ttl_seconds",
        "backup restore timeout",
        "CCR sync interruption",
        "high tablet count",
        "snapshot compression"
    ]
}
---

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Deploying CCR / Sync pipeline tuning / Failure avoidance -->

This document is for operators and developers who use Doris **CCR (Cross-Cluster Replication)**. It collects the configuration items at the FE, BE, and database/table levels that require attention or adjustment, and provides default values and applicable versions so you can quickly cross-check them during setup and operation.

## Applicable Scenarios

| Scenario | Configuration area to focus on |
| --- | --- |
| Initial setup of a CCR sync pipeline | FE basic parameters, database/table binlog properties |
| Synced tables contain inverted indexes or bitmap indexes | `restore_reset_index_id` |
| Upstream frequently creates temporary partitions, causing sync interruptions | `ignore_backup_tmp_partitions` |
| A single table has more than 100,000 tablets | `restore_job_compressed_serialization`, `backup_job_compressed_serialization` |
| Network bandwidth is ample and you want to speed up incremental sync | BE download-related parameters |
| Backup/restore jobs are large in scale and long-running | `backup_job_default_timeout_ms`, `thrift_max_message_size` |

## Prerequisites

- Two Doris clusters (upstream and downstream) have been deployed, and the CCR Syncer has been installed and connected.
- You have permission to modify the FE and BE configuration files `fe.conf` / `be.conf` of both upstream and downstream clusters.
- The current cluster version is known, so you can determine whether each configuration item takes effect.

## Configuration Workflow Overview

1. Modify `fe.conf` on the FE nodes of both upstream and downstream clusters, and restart or apply dynamically as needed.
2. Modify `be.conf` on the BE nodes of both upstream and downstream clusters, and restart or apply dynamically as needed.
3. Set database/table binlog properties through `CREATE TABLE` / `ALTER TABLE`.
4. Start or restart the CCR sync task, observe its running state, and tune the parameters as needed.

## FE Configuration

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Tuning CCR behavior on the FE side -->

Configure in `fe.conf`, for example:

```shell
restore_reset_index_id = true
```

| Name | Description | Default value | Version |
| --- | --- | --- | --- |
| `restore_reset_index_id` | If synced tables use inverted indexes or bitmap indexes, set this to `false`. | false | Starting from 2.1.8 and 3.0.4. |
| `ignore_backup_tmp_partitions` | To avoid sync interruptions caused by upstream creating `tmp partition`, set this to `true`. | false | Starting from 2.1.8 and 3.0.4. |
| `max_backup_restore_job_num_per_db` | The limit on the number of in-memory backup/restore jobs per DB. The recommended value is 2. | 10 | All versions. |
| `label_num_threshold` | Controls the number of TXN Labels to prevent transactions from being recycled too quickly. A value that is too large consumes more memory; a value that is too small may cause data duplication under abnormal conditions. The default value is sufficient in most cases. | 2000 | Starting from 2.1. |
| `restore_job_compressed_serialization` | Recommended to set to true when the tablet count exceeds 100,000.<br /> Before downgrading, disable this configuration and ensure the FE completes a checkpoint.<br /> When upgrading from 2.1 to 3.0, upgrade to at least 3.0.3. | false | Starting from 2.1.8 and 3.0.3. |
| `backup_job_compressed_serialization` | Recommended to set to true when the tablet count exceeds 100,000.<br /> Before downgrading, disable this configuration and ensure the FE completes a checkpoint.<br /> When upgrading from 2.1 to 3.0, upgrade to at least 3.0.3. | false | Starting from 2.1.8 and 3.0.3. |
| `backup_job_default_timeout_ms` | Timeout for backup/restore jobs. Must be configured on the FE of both the source and target clusters. | None | Set as needed |
| `enable_restore_snapshot_rpc_compression` | Enables snapshot info compression to reduce RPC message size. Recommended to set to true. | true | Starting from 2.1.8 and 3.0.3. |

## BE Configuration

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Tuning CCR transfer and download on the BE side -->

Configure in `be.conf`, for example:

```shell
thrift_max_message_size = 2000000000
```

| Name | Description | Default value | Version |
| --- | --- | --- | --- |
| `thrift_max_message_size` | Maximum size of a single RPC packet on the BE thrift server. When the CCR job involves a large number of tablets, set this to 2000000000. | 100MB | All versions |
| `be_thrift_max_pkg_bytes` | Maximum size of BE Thrift RPC message packets. | 20MB | Specific to 2.0. |
| `max_download_speed_kbps` | Download rate limit per download worker on the downstream BE. Default is 50MB/s per thread. | 50MB/s | All versions |
| `download_worker_count` | Number of threads for download tasks. Set according to the network card, disk, and workload. | 1 | All versions |

## Database/Table Properties

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Controlling database/table binlog behavior via DDL -->

Set through `CREATE TABLE` or `ALTER TABLE` to control binlog behavior at the database/table level.

| Name | Description | Default value | Version |
| --- | --- | --- | --- |
| `binlog.max_bytes` | Maximum memory footprint of the binlog. Recommended to reserve at least 4GB. | Unlimited | All versions |
| `binlog.ttl_seconds` | Binlog retention time. | Unlimited before 2.0.5; 1 day (86400) starting from 2.0.5 | All versions |

## Common Tuning Combinations

The table below summarizes common configuration combinations chosen based on runtime behavior, so you can apply them quickly as needed:

| Symptom / Goal | Recommended configuration |
| --- | --- |
| Synced tables contain inverted index / bitmap index | FE: `restore_reset_index_id = false` |
| Upstream frequently creates temporary partitions, causing sync interruptions | FE: `ignore_backup_tmp_partitions = true` |
| Backup/restore jobs pile up on a single DB and FE memory is tight | FE: `max_backup_restore_job_num_per_db = 2` |
| A single table has more than 100,000 tablets | FE: `restore_job_compressed_serialization = true`, `backup_job_compressed_serialization = true`; also enable `enable_restore_snapshot_rpc_compression = true` |
| Backup/restore jobs are very large and the default timeout is insufficient | FE: increase `backup_job_default_timeout_ms` as needed (must be configured on both source and target clusters) |
| RPC packets are too large, causing backup/restore failures | BE: `thrift_max_message_size = 2000000000` |
| Downstream download speed is limited and incremental sync is slow | BE: increase `download_worker_count`, and adjust `max_download_speed_kbps` as needed |
| Control the binlog size of a single table to prevent memory bloat | Database/table: set `binlog.max_bytes` (recommended to reserve at least 4GB) and `binlog.ttl_seconds` |

## Notes on Version Upgrades and Downgrades

- After enabling `restore_job_compressed_serialization` or `backup_job_compressed_serialization`, if you need to downgrade, disable the corresponding configuration first and ensure the FE completes a checkpoint before performing the downgrade.
- When upgrading from 2.1 to 3.0, the target version must be at least 3.0.3 to match the implementation of the compressed serialization configurations.
- `binlog.ttl_seconds` defaulted to unlimited before 2.0.5 and defaults to 1 day (86400 seconds) starting from 2.0.5. After upgrading from an older version, set it explicitly according to your storage and replay requirements.
