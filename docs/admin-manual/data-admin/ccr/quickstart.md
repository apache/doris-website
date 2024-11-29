---
{
    "title": "QuickStart",
    "language": "en"
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

The usage of CCR is straightforward. Simply start the syncer service and send a command, and the Syncer will take care of the rest.

## Step 1. Deploy the source Doris cluster
## Step 2. Deploy the target Doris cluster
## Step 3. Enable binlog in both the source and target clusters

Both the source and target clusters need to enable binlog. Configure the following information in the fe.conf and be.conf files of the source and target clusters:

```SQL
enable_feature_binlog=true
```

## Step 4. Deploy Syncer

​Build CCR Syncer

```shell
git clone https://github.com/selectdb/ccr-syncer
cd ccr-syncer   
bash build.sh <-j NUM_OF_THREAD> <--output SYNCER_OUTPUT_DIR>
cd SYNCER_OUTPUT_DIR# Contact the Doris community for a free CCR binary package
```


Start and stop Syncer


```shell
# Start
cd bin && sh start_syncer.sh --daemon

# Stop
sh stop_syncer.sh
```

## Step 5. Enable binlog in the source db or table

```shell
-- If you want to synchronize the entire database, you can execute the following script:
vim shell/enable_db_binlog.sh
Modify host, port, user, password, and db in the source cluster
Or ./enable_db_binlog.sh --host $host --port $port --user $user --password $password --db $db

-- If you want to synchronize a single table, you can execute the following script and enable binlog for the target table:
ALTER TABLE enable_binlog SET ("binlog.enable" = "true");
```

## Step 6. Launch a synchronization task to the Syncer

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

Parameter description:

```shell
name: name of the CCR synchronization task, should be unique
host, port: host and mysql(jdbc) port for the master FE for the corresponding cluster
user, password: the credentials used by the Syncer to initiate transactions, fetch data, etc.
If it is synchronization at the database level, specify your_db_name and leave your_table_name empty
If it is synchronization at the table level, specify both your_db_name and your_table_name
The synchronization task name can only be used once.
```
