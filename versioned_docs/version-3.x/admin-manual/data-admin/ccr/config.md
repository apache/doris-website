---
{
    "title": "ConfigurationInstructions",
    "language": "en",
    "description": "This document provides the configurations that need to be adjusted or paid attention to when using CCR."
}
---

This document provides the configurations that need to be adjusted or paid attention to when using CCR.

## FE Configuration

Configured in `fe.conf`, for example, `restore_reset_index_id = true`.

| **Name**|**Description**|**Default Value**| **Version** |
|---|---|---|---|
|`restore_reset_index_id`|If inverted index or bitmap index is used in the synchronized table, it should be set to `false`.| false| Starting from 2.1.8 and 3.0.4. |
|`ignore_backup_tmp_partitions`|To avoid synchronization interruption caused by upstream creating `tmp partition`, it should be set to `true`.|false| Starting from 2.1.8 and 3.0.4. |
|`max_backup_restore_job_num_per_db`|Limit on the number of backup/restore jobs per DB in memory, it is recommended to set it to 2.|10 | All versions.|
|`label_num_threshold`|Controls the number of TXN Labels to prevent transaction recovery from being too fast; too large may occupy more memory, too small may cause data duplication in exceptional situations, the default value is sufficient in most cases.| 2000 | Starting from 2.1. |
|`restore_job_compressed_serialization`| It is recommended to configure as true when the number of tablets exceeds 100,000.<br /> Before downgrading, turn off the configuration and ensure FE completes a checkpoint.<br /> When upgrading from 2.1 to 3.0, at least upgrade to 3.0.3.|false| Starting from 2.1.8 and 3.0.3.|
|`backup_job_compressed_serialization`| It is recommended to configure as true when the number of tablets exceeds 100,000.<br /> Before downgrading, turn off the configuration and ensure FE completes a checkpoint.<br /> When upgrading from 2.1 to 3.0, at least upgrade to 3.0.3.|false| Starting from 2.1.8 and 3.0.3.|
|`backup_job_default_timeout_ms`|Timeout for backup/restore tasks, both source and target cluster FE need to be configured.|None|Set according to requirements|
|`enable_restore_snapshot_rpc_compression`|Enable snapshot info compression to reduce RPC message size, it is recommended to set it to true.| true | Starting from 2.1.8 and 3.0.3. |


## BE

Configured in `be.conf`, for example, `thrift_max_message_size = 2000000000`.

| **Name**|**Description**|**Default Value**| **Version** |
|---|---|---|---|
|`thrift_max_message_size`|BE thrift server single RPC packet limit, it is recommended to set to 2000000000 when the number of tablets involved in CCR tasks is large.|100MB| All versions |
|`be_thrift_max_pkg_bytes`|BE Thrift RPC message package size limit.|20MB| Specific to 2.0.| All versions |
|`max_download_speed_kbps`|Download speed limit for each download worker in downstream BE, default is 50MB/s per thread.|50MB/s| All versions |
|`download_worker_count`|Number of threads for download tasks, set according to network card, disk, and load.| 1 | All versions |

## Table Attributes

Set in `Create Table` or `Alter Table`.

| **Name**|**Description**|**Default Value**| **Version** |
|---|---|---|---|
|`binlog.max_bytes`|Maximum memory usage for binlog, it is recommended to keep at least 4GB.|Unlimited| All versions |
|`binlog.ttl_seconds`|Retention time for binlog.| Unlimited before 2.0.5, starting from 2.0.5 it is 1 day (86400)| All versions |
