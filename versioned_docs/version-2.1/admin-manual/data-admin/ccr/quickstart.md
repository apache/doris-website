---
{
    "title": "Quick Start",
    "language": "en-US"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 1. Open the binlog configuration for the source and target clusters

Configure the following information in the fe.conf and be.conf of both the source and target clusters:

```sql
enable_feature_binlog=true
```

## 2. Deploy Syncer

2.1. Download the latest package from the following link:

`https://apache-doris-releases.oss-accelerate.aliyuncs.com/ccr-syncer-2.1.4-x64.tar.xz`

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

Explanation of the parameters for the synchronization job:

```shell
name: The name of the CCR synchronization job, must be unique
host, port: Correspond to the host and MySQL (JDBC) port of the cluster Master FE
user, password: The identity used by Syncer to start transactions and pull data
database, table:
If synchronizing at the database level, fill in your_db_name, and leave your_table_name empty
If synchronizing at the table level, fill in both your_db_name and your_table_name
The name used to initiate the synchronization job can only be used once
```
