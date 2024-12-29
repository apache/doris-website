---
{
    "title": "User Manual",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

## Usage Requirements

### Network Requirements

- Syncer needs to be able to communicate with upstream and downstream FE and BE.

- The downstream BE must be directly accessible via the IP used by the Doris BE process (as seen in `show frontends/backends`).

### Permission Requirements

When Syncer synchronizes, the user needs to provide upstream and downstream accounts, which must have the following permissions:

- Select_priv: Read-only permission on databases and tables.
- Load_priv: Write permission on databases and tables, including Load, Insert, Delete, etc.
- Alter_priv: Permission to modify databases and tables, including renaming databases/tables, adding/deleting/changing columns, adding/deleting partitions, etc.
- Create_priv: Permission to create databases, tables, and views.
- Drop_priv: Permission to delete databases, tables, and views.
- Admin permission (considered for removal later), used to check the enable binlog config.

### Version Requirements

Minimum version requirement: v2.0.15

### Limitations
- Tables without lightweight SchemaChange enabled are not supported; the table name with `light_schema_change = true` in the output of `show create table` indicates that lightweight SchemaChange is enabled.

:::caution
**Starting from 2.1.8/3.0.4, the minimum Doris version supported by ccr syncer is 2.1, and version 2.0 will no longer be supported.**
:::

#### Recommended Versions to Avoid

Doris Versions
- 2.1.5/2.0.14: If upgraded from previous versions to these two versions, and the user has a drop partition operation, they may encounter NPE during upgrade or restart, as this version introduces a new field that older versions do not have, so the default value is null. This issue is fixed in 2.1.6/2.0.15.

## Enable binlog for all tables in the database

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

## Start Syncer

You can start Syncer using `bin/start_syncer.sh`.

| **Option** | **Description** | **Command Example** | **Default Value** |
|------------|-----------------|---------------------|-------------------|
| `--daemon` | Run Syncer in the background | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncer can use two types of databases to store metadata: `sqlite3` (local storage) and `mysql` (local or remote storage). When using `mysql` to store metadata, Syncer will create a database named `ccr` using `CREATE IF NOT EXISTS`, and the metadata table will be stored in it. | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **Effective only when using `sqlite3`**; specifies the filename and path of the SQLite3 generated database file. | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_OUTPUT_DIR/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **Effective only when using `mysql`**; used to set the host, port, user, and password for MySQL. | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host` and `db_port` default to example values; `db_user` and `db_password` default to empty. |
| `--log_dir` | Specify the log output path | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_OUTPUT_DIR/log/ccr_syncer.log` |
| `--log_level` | Specify the log output level; the log format is as follows: `time level msg hooks`. The default value is `info` when running in `--daemon`; when running in the foreground, the default value is `trace`, and logs are saved to `log_dir` using `tee`. | `bin/start_syncer.sh --log_level info` | `info` (background)<br>`trace` (foreground) |
| `--host`<br>`--port` | Specify the `host` and `port` for Syncer. `host` is used to distinguish instances of Syncer in the cluster and can be understood as the name of Syncer; the naming format for Syncer in the cluster is `host:port`. | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host` defaults to `127.0.0.1`<br>`port` defaults to `9190` |
| `--pid_dir` | Specify the path to save the PID file. The PID file is the credential for the `stop_syncer.sh` script to stop Syncer, saving the corresponding Syncer's process number. For ease of cluster management, the path can be customized. | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_OUTPUT_DIR/bin` |

## Stop Syncer

You can stop Syncer using `bin/stop_syncer.sh` in three ways:

| **Method/Option** | **Description** | **Command Example** | **Default Value** |
|-------------------|-----------------|---------------------|-------------------|
| **Method 1** Stop a single Syncer | Specify the `host` and `port` of the Syncer to stop; note that it must match the `host` used when starting. | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | None |
| **Method 2** Batch stop Syncers | Specify the PID filenames to stop, separated by spaces and enclosed in `"` quotes. | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | None |
| **Method 3** Stop all Syncers | By default, stops all Syncers corresponding to PID files in the `pid_dir` path. | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | None |

Options for Method 3 are as follows:

| **Option** | **Description** | **Command Example** | **Default Value** |
|------------|-----------------|---------------------|-------------------|
| `--pid_dir` | Specify the directory where the PID files are located; all three stop methods depend on this option to execute. | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_OUTPUT_DIR/bin` |
| `--host`<br>`--port` | Stop the Syncer corresponding to `host:port` in the `pid_dir` path. If only `host` is specified, it degrades to **Method 3**; if both `host` and `port` are not empty, it acts as **Method 1**. | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: empty |
| `--files` | Stop the Syncers corresponding to the specified PID filenames in the `pid_dir` path, separated by spaces and enclosed in `"` quotes. | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | None |

## Syncer Operation List

**General Template for Requests**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

json_body: Send the required information for the operation in JSON format.

operator: Corresponds to different operations of Syncer.

Thus, the interface returns JSON; if successful, the `success` field will be true, and if there is an error, it will be false, with an `ErrMsgs` field.

```JSON
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```

### Create Task

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

- name: The name of the CCR synchronization task, must be unique.

- host, port: Correspond to the host and MySQL (JDBC) port of the cluster master.

- thrift_port: Corresponds to the rpc_port of the FE.

- user, password: The identity under which Syncer opens transactions, pulls data, etc.

- database, table:

  - If it is database-level synchronization, fill in dbName, tableName is empty.

  - If it is table-level synchronization, both dbName and tableName need to be filled in.

### Check Synchronization Progress

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

job_name is the name created during create_ccr.

### Pause Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```

### Resume Task

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```

### Delete Task

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

### Check Task Status

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

### Get Task List

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```

## Syncer High Availability

Syncer high availability relies on MySQL. If MySQL is used as the backend storage, Syncer can discover other Syncers. If one crashes, others will take over its tasks.

## Usage Notes

:::caution

The `is_being_synced` attribute should be completely controlled by Syncer to be turned on or off under normal circumstances; users should not modify this attribute themselves.

:::
