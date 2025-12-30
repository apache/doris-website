---
{
    "title": "Operation Manual",
    "language": "en",
    "description": "When Syncer synchronizes, the user needs to provide accounts for both upstream and downstream, which must have the following permissions:"
}
---

## Usage Requirements

### Network Requirements

- Syncer needs to be able to communicate with both upstream and downstream FE and BE.
- The downstream BE must have direct access to the IP used by the Doris BE process (as seen in `show frontends/backends`).

### Permission Requirements

When Syncer synchronizes, the user needs to provide accounts for both upstream and downstream, which must have the following permissions:

- Select_priv: Read-only permission for databases and tables.
- Load_priv: Write permission for databases and tables, including Load, Insert, Delete, etc.
- Alter_priv: Permission to modify databases and tables, including renaming databases/tables, adding/deleting/changing columns, adding/deleting partitions, etc.
- Create_priv: Permission to create databases, tables, and views.
- Drop_priv: Permission to delete databases, tables, and views.
- Admin permission (considered for removal later), used to check the enable binlog config.

### Version Requirements

- Syncer Version >= Downstream Doris Version >= Upstream Doris Version. Therefore, upgrade Syncer first, then upgrade downstream Doris, and finally upgrade upstream Doris.
- The minimum version for Doris 2.0 is 2.0.15, and the minimum version for Doris 2.1 is 2.1.6.
- Starting from Syncer version 2.1.8 and 3.0.4, Syncer no longer supports Doris 2.0.

### Configuration and Property Requirements

**Property Requirements**
- `light_schema_change`: Syncer requires both upstream and downstream tables to set the `light_schema_table` property; otherwise, data synchronization errors may occur. Note: The latest version of Doris sets the `light_schema_change` property by default when creating tables. If using Doris version 1.1 or earlier or upgraded from it, the `light_schema_change` property must be set for existing OLAP tables before enabling Syncer synchronization.

**Configuration Requirements**
- `restore_reset_index_id`: If the table to be synchronized has an inverted index, it must be configured as `false` on the target cluster.
- `ignore_backup_tmp_partitions`: If the upstream creates tmp partitions, Doris will prohibit backup, causing Syncer synchronization to be interrupted; setting `ignore_backup_tmp_partitions=true` in FE can avoid this issue.

## Enable binlog for all tables in the database

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

## Start Syncer

Assuming the environment variable ${SYNCER_HOME} is set to the working directory of Syncer. You can start Syncer using `bin/start_syncer.sh`.

| **Option** | **Description** | **Command Example** | **Default Value** |
|------------|-----------------|---------------------|--------------------|
| `--daemon` | Run Syncer in the background | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncer can use two types of databases to store metadata: `sqlite3` (local storage) and `mysql` (local or remote storage). When using `mysql` to store metadata, Syncer will create a database named `ccr` using `CREATE IF NOT EXISTS`, and the metadata table will be stored there. | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **Effective only when using `sqlite3`**; specifies the filename and path of the SQLite3 generated database file. | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **Effective only when using `mysql`**; used to set the host, port, user, and password for MySQL. | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host` and `db_port` default to example values; `db_user` and `db_password` default to empty. |
| `--log_dir` | Specify the log output path | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | Specify the log output level; the log format is as follows: `time level msg hooks`. The default value is `info` when running in the background; when running in the foreground, the default value is `trace`, and logs are saved to `log_dir` using `tee`. | `bin/start_syncer.sh --log_level info` | `info` (background)<br>`trace` (foreground) |
| `--host`<br>`--port` | Specify the `host` and `port` for Syncer. The `host` is used to distinguish instances of Syncer in the cluster and can be understood as the name of Syncer; the naming format for Syncer in the cluster is `host:port`. | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host` defaults to `127.0.0.1`<br>`port` defaults to `9190` |
| `--pid_dir` | Specify the path to save the PID file. The PID file is the credential for the `stop_syncer.sh` script to stop Syncer, saving the corresponding Syncer's process number. For ease of cluster management, you can customize the path. | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## Stop Syncer

You can stop Syncer using `bin/stop_syncer.sh` in three ways:

| **Method/Option** | **Description** | **Command Example** | **Default Value** |
|-------------------|-----------------|---------------------|--------------------|
| **Method 1** Stop a single Syncer | Specify the `host` and `port` of the Syncer to stop; note that it must match the `host` used when starting. | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | None |
| **Method 2** Batch stop Syncers | Specify the PID file names to stop, separated by spaces and enclosed in `"` quotes. | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | None |
| **Method 3** Stop all Syncers | By default, stops all Syncers corresponding to PID files in the `pid_dir` path. | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | None |

Options for Method 3:

| **Option** | **Description** | **Command Example** | **Default Value** |
|------------|-----------------|---------------------|--------------------|
| `--pid_dir` | Specify the directory where the PID files are located; all three stopping methods depend on this option to execute. | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br>`--port` | Stop the Syncer corresponding to `host:port` in the `pid_dir` path. If only `host` is specified, it degrades to **Method 3**; if both `host` and `port` are not empty, it will be effective as **Method 1**. | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: empty |
| `--files` | Stop the Syncers corresponding to the specified PID file names in the `pid_dir` path, separated by spaces and enclosed in `"` quotes. | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | None |

## Syncer Operation List

**General Template for Requests**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

json_body: Send the required information for the operation in JSON format.

operator: Corresponds to different operations of Syncer.

Thus, the interface returns are all in JSON; if successful, the `success` field will be true, and if there is an error, it will be false, with the error message in the `ErrMsgs` field.

```JSON
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```

### Create Job

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

- name: The name of the CCR synchronization job, must be unique.

- host, port: Correspond to the host of the cluster master and the port of MySQL (jdbc).

- thrift_port: Corresponds to the rpc_port of FE.

- user, password: The identity under which Syncer opens transactions, pulls data, etc.

- database, table:

  - If it is a database-level synchronization, fill in dbName, leave tableName empty.

  - If it is table-level synchronization, fill in both dbName and tableName.

### View Synchronization Progress

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

job_name is the name created during create_ccr.

### Pause Job

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```

### Resume Job

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```

### Delete Job

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

### View Job Status

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

### End Synchronization

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/desync
```

### Get Job List

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```

## Syncer High Availability

Syncer high availability relies on MySQL. If MySQL is used as backend storage, Syncer can discover other Syncers; if one crashes, others will take over its jobs.

## Upgrade

### 1. Upgrade Syncer
Assuming the following environment variables are set:
- ${SYNCER_HOME}: Syncer's working directory.
- ${SYNCER_PACKAGE_DIR}: Directory containing the new Syncer.

Upgrade every Syncer by following these steps.

1.1. Save start commands

Save the output of the following command to a file.
```
ps -elf | grep ccr_syncer
```

1.2. Stop the current Syncer

```shell
sh bin/stop_syncer.sh --pid_dir ${SYNCER_HOME}/bin
```

1.3. Backup the existing MetaService binaries

```shell
mv ${SYNCER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
```

1.4. Deploy the new package

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```

1.5. Start the new Syncer

Start the new Syncer using the command saved in 1.1.

### 2. Upgrade downstream Doris (If Necessary)

Upgrade the upstream system by following the instructions in the [Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md) guide.

### 3. Upgrade upstream Doris (If Necessary)

Upgrade the upstream system by following the instructions in the [Upgrade Doris](../../../admin-manual/cluster-management/upgrade.md) guide.

## Usage Notes

:::caution

The `is_being_synced` attribute should be fully controlled by Syncer to turn on or off under normal circumstances; users should not modify this attribute themselves.

:::

### Important Notes

- During CCR synchronization, backup/restore jobs and binlogs are all in FE memory, so it is recommended to allocate at least 4GB or more heap memory for each CCR job in FE (both source and target clusters), and also modify the following configurations to reduce the memory consumption of unrelated jobs:
    - Modify the FE configuration `max_backup_restore_job_num_per_db`:
        Records the number of backup/restore jobs for each DB in memory. The default value is 10; setting it to 2 is sufficient.
    - Modify the source cluster db/table property to set the binlog retention limit:
        - `binlog.max_bytes`: Maximum memory occupied by binlog; it is recommended to retain at least 4GB (default is unlimited).
        - `binlog.ttl_seconds`: Binlog retention time; before version 2.0.5, the default was unlimited; after that, the default value is one day (86400).
        For example, to modify the binlog ttl seconds to retain for one hour: `ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`.
- The correctness of CCR also relies on the transaction state of the target cluster, so it is necessary to ensure that transactions are not reclaimed too quickly during synchronization; the following configurations need to be increased:
    - `label_num_threshold`: Used to control the number of TXN Labels.
    - `stream_load_default_timeout_second`: Used to control the TXN timeout duration.
    - `label_keep_max_second`: Used to control the retention time after TXN ends.
    - `streaming_label_keep_max_second`: Same as above.
- If it is a database synchronization and the source cluster has a large number of tablets, the resulting CCR job may be very large, requiring modifications to several FE configurations:
    - `max_backup_tablets_per_job`:
        The upper limit of tablets involved in a single backup job; it needs to be adjusted based on the number of tablets (default value is 300,000; too many tablets may risk FE OOM, prioritize reducing the number of tablets).
    - `thrift_max_message_size`:
        The maximum single RPC packet size allowed by the FE thrift server; the default is 100MB. If the number of tablets is too large, causing the snapshot info size to exceed 100MB, this limit needs to be adjusted, with a maximum of 2GB.
        - The snapshot info size can be found in the ccr syncer logs, with the keywords: `snapshot response meta size: %d, job info size: %d`; the snapshot info size is approximately meta size + job info size.
    - `fe_thrift_max_pkg_bytes`:
        Same as above, an additional parameter that needs to be adjusted in version 2.0, with a default value of 20MB.
    - `restore_download_job_num_per_be`:
        The upper limit of download jobs sent to each BE; the default is 3, which is too small for restore jobs and needs to be adjusted to 0 (i.e., disable this limit); this configuration is no longer needed starting from versions 2.1.8 and 3.0.4.
    - `backup_upload_job_num_per_be`:
        The upper limit of upload jobs sent to each BE; the default is 3, which is too small for backup jobs and needs to be adjusted to 0 (i.e., disable this limit); this configuration is no longer needed starting from versions 2.1.8 and 3.0.4.
    - In addition to the above FE configurations, if the CCR job's db type is MySQL, some MySQL configurations also need to be adjusted:
        - The MySQL server will limit the size of the data packets returned/inserted in a single select/insert. Increase the following configurations to relax this limit, for example, adjust to the upper limit of 1GB:
        ```
        [mysqld]
        max_allowed_packet = 1024MB
        ```
        - The MySQL client will also have this limit; in ccr syncer versions 2.1.6/2.0.15 and earlier, the upper limit is 128MB; later versions can adjust this through the parameter `--mysql_max_allowed_packet` (in bytes), with a default value of 1024MB.
        > Note: In versions 2.1.8 and 3.0.4 and later, ccr syncer no longer stores snapshot info in the database, so the default data packet size is sufficient.
- Similarly, the BE side also needs to modify several configurations:
    - `thrift_max_message_size`: The maximum single RPC packet size allowed by the BE thrift server; the default is 100MB. If the number of tablets is too large, causing the agent job size to exceed 100MB, this limit needs to be adjusted, with a maximum of 2GB.
    - `be_thrift_max_pkg_bytes`: Same as above, only needs to be adjusted in version 2.0, with a default value of 20MB.
- Even if the above configurations are modified, if the number of tablets continues to rise, the resulting snapshot size may exceed 2GB, which is the threshold for Doris FE edit log and RPC message size, causing synchronization to fail. Starting from versions 2.1.8 and 3.0.4, Doris can further increase the number of tablets supported for backup and recovery by compressing snapshots. This can be enabled through the following parameters:
    - `restore_job_compressed_serialization`: Enable compression for restore jobs (affects metadata compatibility, default is off).
    - `backup_job_compressed_serialization`: Enable compression for backup jobs (affects metadata compatibility, default is off).
    - `enable_restore_snapshot_rpc_compression`: Enable compression for snapshot info, mainly affecting RPC (default is on).
    > Note: Since identifying whether backup/restore jobs are compressed requires additional code, and the code before versions 2.1.8 and 3.0.4 does not contain related code, once a backup/restore job is generated, it cannot revert to an earlier Doris version. There are two exceptions: backup/restore jobs that have already been canceled or finished will not be compressed, so waiting for the backup/restore job to complete or actively canceling the job before reverting can ensure safe rollback.
- CCR internally uses db/table names as labels for some internal jobs, so if the CCR job encounters labels exceeding the limit, the FE parameter `label_regex_length` can be adjusted to relax this limit (default value is 128).
- Since backup does not currently support backing up tables with cooldown tablets, encountering this will cause synchronization to terminate, so it is necessary to check whether any tables have the `storage_policy` property set before creating the CCR job.
### Performance-Related Parameters
- If the user's data volume is very large, the time required to complete backup and recovery may exceed one day (default value), so the following parameters need to be adjusted as needed:
    - `backup_job_default_timeout_ms`: Timeout duration for backup/restore jobs; both source and target clusters' FE need to configure this.
    - The upstream modifies the binlog retention time: `ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`.
- Downstream BE download speed is slow:
    - `max_download_speed_kbps`: The download speed limit for a single download thread in a single downstream BE, default is 50MB/s.
    - `download_worker_count`: The number of threads executing download jobs in the downstream; it should be adjusted based on the customer's machine type, maximizing without affecting normal read/write operations; if this parameter is adjusted, there is no need to adjust `max_download_speed_kbps`.
        - For example, if the customer's machine network card provides a maximum bandwidth of 1GB, and the maximum allowed download thread utilizes 200MB of bandwidth, then without changing `max_download_speed_kbps`, `download_worker_count` should be configured to 4.
- Limit the download speed of binlogs from the downstream BE:
    BE-side configuration parameter:
    ```shell
    download_binlog_rate_limit_kbs=1024 # Limit the speed of a single BE node pulling Binlog (including Local Snapshot) from the source cluster to 1 MB/s.
    ```
    Detailed parameters and explanations:
    1. The `download_binlog_rate_limit_kbs` parameter is configured on the source cluster BE node, and by setting this parameter, the data pulling speed can be effectively limited.
    2. The `download_binlog_rate_limit_kbs` parameter is mainly used to set the speed of a single BE node; to calculate the overall speed of the cluster, the parameter value needs to be multiplied by the number of nodes in the cluster.