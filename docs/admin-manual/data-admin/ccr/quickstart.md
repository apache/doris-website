---
{
    "title": "Quick Start",
    "language": "en",
    "description": "Set up Doris CCR cross-cluster data synchronization in four steps: enable binlog, deploy Syncer, configure database/table binlog, and submit a sync task to Syncer.",
    "keywords": [
        "CCR Quick Start",
        "CCR Syncer Deployment",
        "Doris Cross-Cluster Replication",
        "enable_feature_binlog",
        "binlog.enable",
        "create_ccr",
        "Cross Cluster Replication",
        "Database-level Sync",
        "Table-level Sync"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: First-time CCR deployment / getting started with cross-cluster data synchronization -->

This document describes how to quickly set up CCR (Cross Cluster Replication) in Apache Doris for cross-cluster data synchronization. It covers the full workflow from enabling binlog to submitting a sync task. After completing the four steps in order, you can establish a database-level or table-level synchronization link between a source cluster and a target cluster.

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| Database-level sync | Synchronize all tables in a database from the source cluster to the target cluster. |
| Table-level sync | Synchronize only one specific table from the source cluster to the target cluster. |
| Disaster recovery, read/write separation | Keep a real-time replica on the standby cluster through CCR. See [Cross-Cluster Replication Overview](../ccr/overview). |

## Prerequisites

- A reachable source cluster and target cluster are deployed, and the Syncer has network connectivity to the upstream and downstream FE and BE.
- You have available accounts on both the source cluster and the target cluster (used by Syncer to start transactions and pull data). For permission requirements, see the [Operations Manual](../ccr/manual).
- The Doris version meets the CCR requirements (2.0.15 / 2.1.6 or later is recommended).

## Workflow Overview

1. Enable the binlog master switch on both the source cluster and the target cluster.
2. Download and deploy CCR Syncer.
3. Enable binlog on the database or table to be synchronized in the source cluster.
4. Submit a sync task to Syncer through the HTTP interface.

## 1. Enable Binlog on the Source and Target Clusters

<!-- Knowledge type: Configuration parameter -->

Configure the following setting in `fe.conf` and `be.conf` on both the source cluster and the target cluster:

```sql
enable_feature_binlog=true
```

After modification, restart the corresponding FE and BE processes for the configuration to take effect.

## 2. Deploy Syncer

<!-- Knowledge type: Procedure -->

### 2.1 Download the Syncer Installation Package

Download the latest package from the following link:

`https://download.selectdb.com/ccr-release/ccr-syncer-3.0.6-rc07-x64.tar.xz`

### 2.2 Start and Stop Syncer

```shell
# Start
cd bin && sh start_syncer.sh --daemon

# Stop
sh stop_syncer.sh
```

After startup, Syncer listens on port `9190` by default to receive sync task management requests.

## 3. Enable Binlog on the Source Database / Table to Be Synchronized

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Database-level sync / Table-level sync -->

Choose the enabling method based on the synchronization granularity:

- **Whole-database sync**: Run the script in Syncer's `bin` directory to enable `binlog.enable` for all tables in the specified database.

    ```shell
    ./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db
    ```

- **Single-table sync**: Run `ALTER TABLE` on the target table in the source cluster to enable `binlog.enable` for that table.

    ```sql
    ALTER TABLE enable_binlog SET ("binlog.enable" = "true");
    ```

## 4. Submit a Sync Task to Syncer

<!-- Knowledge type: Procedure -->

Submit a sync task to Syncer through the HTTP interface:

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
      "host": "localhost",
      "port": "9030",
      "thrift_port": "9020",
      "user": "root",
      "password": "",
      "database": "your_db_name",
      "table": "your_table_name"
    },
    "dest": {
      "host": "localhost",
      "port": "9030",
      "thrift_port": "9020",
      "user": "root",
      "password": "",
      "database": "your_db_name",
      "table": "your_table_name"
    }
}' http://127.0.0.1:9190/create_ccr
```

### Sync Task Parameters

| Parameter | Description |
| --- | --- |
| `name` | Name of the CCR sync task. Must be unique; the same `name` can only be created once. |
| `host`, `port` | Host and MySQL (JDBC) port of the Master FE of the corresponding cluster. |
| `thrift_port` | Thrift port of the FE of the corresponding cluster. |
| `user`, `password` | The identity Syncer uses to start transactions, pull data, and so on. |
| `database`, `table` | For database-level sync, fill in `your_db_name` and leave `your_table_name` empty. For table-level sync, fill in both `your_db_name` and `your_table_name`. |

## FAQ

### Q: What if `enable_feature_binlog=true` does not take effect after modification?

Confirm that both FE and BE on the source cluster and the target cluster have been restarted.

### Q: What if some tables are not synchronized during whole-database sync?

Confirm that `enable_db_binlog.sh` has successfully enabled `binlog.enable` on every table in that database.

### Q: What if creating a task with a duplicate `name` returns an error?

A `name` can only be used once. Use a different task name and try again.

### Q: How can I learn more about configuration options and the feature matrix?

See [Configuration](../ccr/config) and [Feature Details](../ccr/feature).
