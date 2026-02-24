---
{
    "title": "Quick Start | CCR",
    "language": "en-US",
    "description": "Configure the following information in the fe.conf and be.conf of both the source and target clusters:",
    "sidebar_label": "Quick Start"
}
---

## 1. Open the binlog configuration for the source and target clusters

Configure the following information in the fe.conf and be.conf of both the source and target clusters:

```sql
enable_feature_binlog=true
```

## 2. Deploy Syncer

2.1. Download the latest package from the following link:

`https://download.velodb.io/ccr-release/ccr-syncer-3.0.6-rc05-x64.tar.xz`

2.2. Start and stop Syncer

```shell
# Start
cd bin && sh start_syncer.sh --daemon
```
```shell
# Stop
sh stop_syncer.sh
```

## Step 3. Open the Binlog for the synchronized database/table in the source cluster

```shell
-- If synchronizing the entire database, execute the following script to enable binlog for all tables in that database
./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db

-- If synchronizing a single table, only enable the binlog for that table by executing:
ALTER TABLE your_table_name ENABLE BINLOG SET ("binlog.enable" = "true");
```

## Step 4. Initiate a synchronization job to Syncer

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

Explanation of the parameters for the synchronization task:

```shell
name: The name of the CCR synchronization task, must be unique
host, port: Correspond to the host and MySQL (JDBC) port of the cluster Master FE
user, password: The identity used by Syncer to start transactions and pull data
database, table:
If synchronizing at the database level, fill in your_db_name, and leave your_table_name empty
If synchronizing at the table level, fill in both your_db_name and your_table_name
The name used to initiate the synchronization task can only be used once
```

