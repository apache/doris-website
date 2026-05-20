---
{
    "title": "CCR Syncer Operations Manual",
    "language": "en",
    "description": "Apache Doris CCR Syncer operations manual: covers deployment requirements, start and stop, task management APIs, upgrades, high availability, and performance tuning.",
    "keywords": [
        "Doris CCR",
        "CCR Syncer",
        "cross-cluster replication",
        "Cross Cluster Replication",
        "binlog replication",
        "Doris disaster recovery",
        "Doris primary-secondary replication",
        "ccr_syncer",
        "create_ccr",
        "enable_db_binlog",
        "Syncer high availability",
        "Syncer upgrade",
        "Doris data replication",
        "Doris backup restore"
    ]
}
---

<!-- Knowledge type: Operations manual / Configuration parameters / API reference -->
<!-- Applicable scenarios: Deploying and operating CCR Syncer / Managing cross-cluster replication tasks / Upgrade and tuning -->

This manual is intended for users who need to deploy and operate Apache Doris CCR Syncer in production environments. It covers pre-deployment environment checks, starting and stopping Syncer, HTTP API management of replication tasks, version upgrade procedures, and key points for high availability and performance tuning.

## Applicable Scenarios

| Scenario | Description |
|------|------|
| First-time Syncer deployment | Start Syncer after completing network, permission, version, and table property checks |
| Managing CCR tasks | Create, pause, resume, and delete replication tasks through HTTP APIs |
| Upgrading Syncer and Doris | Roll out upgrades in the order "Syncer first, then downstream, then upstream" |
| High availability deployment | Use MySQL as the metadata backend to enable automatic failover between Syncer instances |
| Tuning for large-scale database replication | Adjust FE/BE and MySQL parameters to support replication tasks with large numbers of tablets |

## Prerequisites

<!-- Knowledge type: Pre-deployment checks -->
<!-- Applicable scenarios: Environment acceptance / Pre-deployment confirmation -->

Before deploying Syncer, confirm that all of the following requirements are met. Otherwise, replication tasks may encounter connection failures, data errors, or task interruptions.

### Network Requirements

- The network between Syncer and the FE and BE nodes of both upstream and downstream clusters must be interconnected.
- The downstream BE and upstream BE must communicate directly through the IP used by the Doris BE process (the IP shown in `show frontends` / `show backends`).

### Permission Requirements

When Syncer performs replication, it requires the user to provide accounts for both upstream and downstream clusters. The account must have the following privileges:

- `Select_priv`: read-only privilege on databases and tables.
- `Load_priv`: write privilege on databases and tables, including Load, Insert, Delete, and so on.
- `Alter_priv`: privilege to modify databases and tables, including renaming databases/tables, adding/dropping/changing columns, and adding/dropping partitions.
- `Create_priv`: privilege to create databases, tables, and views.
- `Drop_priv`: privilege to drop databases, tables, and views.
- `Admin` privilege (to be removed later), used to detect the `enable binlog` configuration.

### Version Requirements

- Syncer version >= downstream Doris version >= upstream Doris version. Therefore, the upgrade order is: upgrade Syncer first, then downstream Doris, and finally upstream Doris.
- The minimum supported version for Doris 2.0 is 2.0.15, and the minimum supported version for Doris 2.1 is 2.1.6.
- Starting from Syncer 2.1.8 and 3.0.4, Syncer no longer supports Doris 2.0.

### Table Property and Cluster Configuration Requirements

**Table property requirements**

- `light_schema_change`: Syncer requires both upstream and downstream tables to have the `light_schema_change` property set. Otherwise, data replication will fail. The latest versions of Doris enable this property by default when creating tables. If you are using Doris 1.1 or earlier, or have upgraded from an older version, you must set the `light_schema_change` property on all existing OLAP tables before enabling Syncer replication.

**FE configuration requirements**

- `restore_reset_index_id`: If the tables to be replicated contain inverted indexes, this configuration must be set to `false` on the target cluster.
- `ignore_backup_tmp_partitions`: If the upstream creates tmp partitions, Doris will prohibit backups, causing Syncer replication to be interrupted. You can set `ignore_backup_tmp_partitions=true` on the FE to work around this issue.

## Enable Binlog for All Tables in a Database

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Preparation for database-level replication -->

Database-level replication requires binlog to be enabled for all tables in the source cluster. You can use the following script to enable it in bulk:

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

Parameter descriptions:

| Parameter | Description |
|------|------|
| `-h` | Host of the source cluster FE |
| `-p` | MySQL protocol port of the source cluster FE |
| `-u` | Username |
| `-P` | Password |
| `-d` | Name of the database for which binlog is to be enabled |

## Start Syncer

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Starting the Syncer process -->

Assuming the environment variable `${SYNCER_HOME}` is set to the Syncer working directory, you can use `bin/start_syncer.sh` to start Syncer. Common startup options are as follows:

| Option | Description | Command example | Default value |
|------|------|----------|--------|
| `--daemon` | Run Syncer in the background | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncer can use two types of databases to store metadata: `sqlite3` (local storage) and `mysql` (local or remote storage). When using `mysql` to store metadata, Syncer uses `CREATE IF NOT EXISTS` to create a database named `ccr`, in which the metadata tables are stored. | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **Effective only when the database uses `sqlite3`.** Specifies the file name and path of the SQLite3 database. | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br/>`--db_port`<br/>`--db_user`<br/>`--db_password` | **Effective only when the database uses `mysql`.** Used to set the MySQL host, port, user, and password. | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host` and `db_port` default to the example values; `db_user` and `db_password` default to empty. |
| `--log_dir` | Specifies the log output path | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | Specifies the log output level. The log format is: `time level msg hooks`. Under `--daemon`, the default value is `info`; when running in the foreground, the default value is `trace`, and logs are saved to `log_dir` through `tee`. | `bin/start_syncer.sh --log_level info` | `info` (background)<br/>`trace` (foreground) |
| `--host`<br/>`--port` | Specifies the `host` and `port` of Syncer. `host` is used to distinguish Syncer instances in a cluster and can be understood as the name of Syncer. The name format of Syncer in a cluster is `host:port`. | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host` defaults to `127.0.0.1`<br/>`port` defaults to `9190` |
| `--pid_dir` | Specifies the path where the PID file is saved. The PID file is the credential used by the `stop_syncer.sh` script to stop Syncer, and it stores the process ID of the corresponding Syncer. To facilitate cluster management, you can customize the path. | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## Stop Syncer

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Stopping a single or multiple Syncers -->

You can use `bin/stop_syncer.sh` to stop Syncer. Choose one of the following three methods based on the scenario:

| Method | Applicable scenario | Command example |
|------|----------|----------|
| **Method 1** Stop a single Syncer | The `host` and `port` of the Syncer to stop are known (must match those used at startup) | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` |
| **Method 2** Stop multiple Syncers in bulk | The PID file names of the Syncers to stop are known | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` |
| **Method 3** Stop all Syncers | Stop all Syncers corresponding to the PID files under the `pid_dir` path | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` |

The options of `bin/stop_syncer.sh` are as follows:

| Option | Description | Command example | Default value |
|------|------|----------|--------|
| `--pid_dir` | Specifies the directory where the PID files are located. All three stop methods above depend on this option. | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br/>`--port` | Stops the Syncer corresponding to `host:port` under the `pid_dir` path. When only `host` is specified, it falls back to **Method 3**; when both `host` and `port` are non-empty, it takes effect as **Method 1**. | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: `127.0.0.1`<br/>`port`: empty |
| `--files` | Stops the Syncers corresponding to the specified PID file names under the `pid_dir` path. File names are separated by spaces and wrapped as a whole in `"`. | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | None |

## Syncer Operation APIs

<!-- Knowledge type: API reference -->
<!-- Applicable scenarios: Managing CCR replication tasks through HTTP APIs -->

Syncer exposes replication task management capabilities through HTTP interfaces. The general template for all operation requests is as follows:

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

- `json_body`: Sends the information required for the operation in JSON format.
- `operator`: Corresponds to different Syncer operations (such as `create_ccr`, `pause`, `resume`, and so on).

All interfaces return JSON. On success, the `success` field is `true`; on failure, the `success` field is `false`, and the `ErrMsgs` field is present:

```json
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```

### Create a Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "demo",
    "table": "example_tbl"
    },
    "dest": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "ccrt",
    "table": "copy"
    }
}' http://127.0.0.1:9190/create_ccr
```

Field descriptions:

| Field | Description |
|------|------|
| `name` | Name of the CCR replication task. Must be unique. |
| `host`, `port` | Host and MySQL (JDBC) port of the corresponding cluster master |
| `thrift_port` | The `rpc_port` of the corresponding FE |
| `user`, `password` | The identity under which Syncer opens transactions, pulls data, and so on |
| `database`, `table` | For database-level replication, fill in `database` and leave `table` empty. For table-level replication, fill in both `database` and `table`. |

### View Replication Progress

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

`job_name` is the `name` created with `create_ccr`.

### Pause a Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```

### Resume a Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```

### Delete a Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/delete
```

### Get Version

```shell
curl http://ccr_syncer_host:ccr_syncer_port/version

# > return
{"version": "2.0.1"}
```

### View Task Status

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/job_status

{
"success": true,
"status": {
    "name": "ccr_db_table_alias",
    "state": "running",
    "progress_state": "TableIncrementalSync"
}
}
```

### End Replication

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/desync
```

### Get Task List

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```

## Syncer High Availability

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Multi-instance disaster recovery deployment -->

Syncer high availability depends on MySQL. When MySQL is used as the backend storage, Syncer instances can discover one another. When a Syncer instance crashes, the other instances take over its tasks.

## Upgrade Procedure

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Rolling upgrade of Syncer and Doris clusters -->

The upgrade order must follow the principle of "Syncer first, then downstream Doris, then upstream Doris" to ensure version compatibility.

### 1. Upgrade Syncer

Assume the following environment variables are set:

- `${SYNCER_HOME}`: Working directory of Syncer.
- `${SYNCER_PACKAGE_DIR}`: Directory containing the new Syncer.

Upgrade each Syncer through the following steps.

#### 1.1 Save the Startup Command

Save the output of the following command to a file so that you can start the upgraded Syncer with the same parameters:

```shell
ps -elf | grep ccr_syncer
```

#### 1.2 Stop the Current Syncer

```shell
sh bin/stop_syncer.sh --pid_dir ${SYNCER_HOME}/bin
```

#### 1.3 Back Up the Existing MetaService Binary

```shell
mv ${SYNCER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
```

#### 1.4 Deploy the New Package

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```

#### 1.5 Start the New Syncer

Use the command saved in 1.1 to start the new Syncer.

### 2. Upgrade Downstream Doris (If Necessary)

Follow the instructions in the [Upgrade Doris](../../cluster-management/upgrade) guide to upgrade the downstream cluster.

### 3. Upgrade Upstream Doris (If Necessary)

Follow the instructions in the [Upgrade Doris](../../cluster-management/upgrade) guide to upgrade the upstream cluster.

## Usage Notes

<!-- Knowledge type: Notes / Performance tuning -->
<!-- Applicable scenarios: Production operations / Tuning for large-scale replication -->

:::caution

When there are no anomalies, the `is_being_synced` property should be controlled entirely by Syncer for enabling or disabling. Users must not modify this property themselves.

:::

### Notes

- During CCR replication, backup/restore jobs and binlogs are kept in FE memory. Therefore, it is recommended to reserve at least 4 GB of heap memory in the FE for each CCR job (on both source and target clusters). At the same time, modify the following configurations to reduce memory consumption by unrelated jobs:
    - Modify the FE configuration `max_backup_restore_job_num_per_db`: the number of backup/restore jobs recorded in memory for each DB. The default value is 10. Setting it to 2 is sufficient.
    - Modify the source cluster db/table property to set binlog retention limits:
        - `binlog.max_bytes`: the maximum memory occupied by binlog. It is recommended to reserve at least 4 GB (no limit by default).
        - `binlog.ttl_seconds`: binlog retention time. In versions before 2.0.5, there is no limit by default; in later versions, the default value is one day (86400).
        - For example, to change the binlog ttl seconds to retain for one hour: `ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`.
- CCR correctness also depends on the transaction state of the target cluster. To ensure that transactions are not recycled too quickly during replication, increase the following configurations:
    - `label_num_threshold`: used to control the number of TXN Labels.
    - `stream_load_default_timeout_second`: used to control the TXN timeout.
    - `label_keep_max_second`: used to control how long TXNs are retained after they end.
    - `streaming_label_keep_max_second`: same as above.
- If you are doing database replication and the source cluster has a large number of tablets, the resulting CCR job may be very large. You need to modify the following FE configurations:
    - `max_backup_tablets_per_job`: the upper limit on the number of tablets involved in a single backup task. Adjust it based on the tablet count (the default value is 300,000; an excessive tablet count risks FE OOM, so consider whether the tablet count can be reduced first).
    - `thrift_max_message_size`: the upper limit for a single RPC packet allowed by the FE thrift server. The default value is 100 MB. If the snapshot info size exceeds 100 MB due to too many tablets, you need to adjust this limit, up to a maximum of 2 GB.
        - The snapshot info size can be found in the CCR Syncer logs, with the keyword: `snapshot response meta size: %d, job info size: %d`. The snapshot info size is approximately equal to `meta size + job info size`.
    - `fe_thrift_max_pkg_bytes`: same as above, an additional parameter that needs to be adjusted in 2.0. The default value is 20 MB.
    - `restore_download_task_num_per_be`: the upper limit on the number of download tasks sent to each BE. The default value is 3, which is too small for restore jobs. It needs to be adjusted to 0 (which disables this limit). This configuration is no longer required starting from 2.1.8 and 3.0.4.
    - `backup_upload_task_num_per_be`: the upper limit on the number of upload tasks sent to each BE. The default value is 3, which is too small for backup jobs. It needs to be adjusted to 0 (which disables this limit). This configuration is no longer required starting from 2.1.8 and 3.0.4.
    - In addition to the FE configurations above, if the db type of the CCR job is mysql, you also need to adjust some MySQL configurations:
        - The MySQL server limits the packet size returned or inserted in a single select/insert. Add the following configuration to relax this limit, for example, raising it to the upper limit of 1 GB:

            ```text
            [mysqld]
            max_allowed_packet = 1024MB
            ```

        - The MySQL client also has this limit. In CCR Syncer versions 2.1.6 / 2.0.15 and earlier, the upper limit is 128 MB; in later versions, it can be adjusted through the parameter `--mysql_max_allowed_packet` (unit: bytes), with a default value of 1024 MB.

        > Note: After 2.1.8 and 3.0.4, CCR Syncer no longer stores snapshot info in the db, so the default packet size is sufficient.
- Similarly, several configurations need to be modified on the BE side:
    - `thrift_max_message_size`: the upper limit for a single RPC packet allowed by the BE thrift server. The default value is 100 MB. If the agent task size exceeds 100 MB due to too many tablets, you need to adjust this limit, up to a maximum of 2 GB.
    - `be_thrift_max_pkg_bytes`: same as above, a parameter that needs to be adjusted only in 2.0. The default value is 20 MB.
- Even with the configurations above modified, as the tablet count continues to grow, the generated snapshot size may exceed 2 GB, which is the threshold for Doris FE edit log and RPC message size, causing replication to fail. Starting from 2.1.8 and 3.0.4, Doris can further increase the number of tablets supported by backup and restore by compressing snapshots. You can enable compression through the following parameters:
    - `restore_job_compressed_serialization`: enables compression for restore jobs (affects metadata compatibility, disabled by default).
    - `backup_job_compressed_serialization`: enables compression for backup jobs (affects metadata compatibility, disabled by default).
    - `enable_restore_snapshot_rpc_compression`: enables compression for snapshot info, mainly affecting RPC (enabled by default).

    > Note: Because identifying whether a backup/restore job is compressed requires additional code, and the code before 2.1.8 and 3.0.4 does not include the relevant code, once a backup/restore job is generated, you cannot roll back to an earlier Doris version. There are two exceptions: backup/restore jobs that have already been canceled or finished are not compressed, so you can safely roll back after waiting for backup/restore jobs to complete or actively canceling them.
- CCR uses db/table names as labels for some internal jobs. Therefore, if a CCR job runs into the label length limit, you can adjust the FE parameter `label_regex_length` to relax this limit (the default value is 128).
- Because backup does not currently support backing up tables with cooldown tablets, encountering such tables causes replication to be interrupted. Therefore, before creating a CCR job, check whether any table has the `storage_policy` property set.

### Performance-Related Parameters

If your data volume is very large and the time required for backup and restore execution may exceed one day (the default value), you need to adjust the following parameters as needed:

- `backup_job_default_timeout_ms`: the timeout for backup/restore tasks. The FEs of both the source and target clusters need to configure this.
- Modify the binlog retention time on the upstream: `ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`.

When the download speed of the downstream BE is slow, you can adjust the following parameters:

- `max_download_speed_kbps`: the download speed limit of a single download thread on a single downstream BE. The default value is 50 MB/s.
- `download_worker_count`: the number of threads on the downstream that execute download tasks. The default value is 1. Adjust it according to the client machine type, and raise it to the maximum value without affecting the client's normal reads and writes. If you adjust this parameter, you do not need to adjust `max_download_speed_kbps`.
    - For example, if the client machine's NIC provides a maximum bandwidth of 1 GB and currently allows the download threads to use up to 200 MB of bandwidth, then without changing `max_download_speed_kbps`, `download_worker_count` should be configured as 4.

To limit the speed at which the downstream BE downloads binlog, configure the following parameter on the BE side:

```shell
download_binlog_rate_limit_kbs=1024 # Limit the speed at which a single BE node pulls Binlog (including Local Snapshot) from the source cluster to 1 MB/s
```

Detailed description:

1. The `download_binlog_rate_limit_kbs` parameter is configured on the source cluster BE nodes. Setting this parameter can effectively limit the data pull speed.
2. The `download_binlog_rate_limit_kbs` parameter is mainly used to set the speed of a single BE node. To calculate the overall cluster rate, you generally need to multiply the parameter value by the number of cluster nodes.

## FAQ

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Replication exception troubleshooting -->

### Q: How do I troubleshoot replication errors or data errors?

This is usually because the `light_schema_change` property is not set on the upstream and downstream tables. Explicitly set the `light_schema_change` property on existing tables and retry.

### Q: What should I do if a table with inverted indexes fails to replicate?

The target cluster has not disabled `restore_reset_index_id`. Set `restore_reset_index_id=false` on the target cluster FE.

### Q: What should I do if backup is prohibited because the upstream has tmp partitions?

By default, the FE prohibits backups on databases that contain tmp partitions. Set `ignore_backup_tmp_partitions=true` on the source cluster FE.

### Q: How do I handle Syncer version mismatch with Doris version?

The upgrade order is incorrect, or Syncer 2.1.8 / 3.0.4 no longer supports Doris 2.0. Strictly follow the upgrade order "Syncer first, then downstream, then upstream".

### Q: What should I do if FE encounters OOM?

There are too many backup/restore jobs for a single DB, or the number of tablets is too large. Decrease `max_backup_restore_job_num_per_db`, and adjust parameters such as `max_backup_tablets_per_job` and `thrift_max_message_size` as needed.

### Q: What should I do if replication fails because the snapshot size exceeds 2 GB?

In large-scale tablet scenarios, the RPC / edit log exceeds the threshold. Upgrade to 2.1.8 / 3.0.4 or later, and enable compression parameters such as `restore_job_compressed_serialization` and `backup_job_compressed_serialization`.

### Q: What should I do if the replication task fails because the label is too long?

The internal job label length exceeds the limit. Increase the FE parameter `label_regex_length` (default 128).

### Q: How do I handle replication interruption for tables with `storage_policy`?

Backup does not currently support tables containing cooldown tablets. Before creating a CCR job, check and avoid replicating tables that have the `storage_policy` property set.

### Q: How do I optimize the slow download speed of the downstream BE?

Single-threaded download with a low default speed limit. Increase `download_worker_count`, or adjust `max_download_speed_kbps`.
