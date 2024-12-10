---
{
    "title": "Loading Transaction and Atomicity",
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

## Use Cases

All loading tasks in Doris are atomic, which means that a loading job either succeeds completely or fails completely. There won't be a situation where only part of the data is load successfully. Additionally, Doris ensures atomicity for loading multiple tables within the same loading task. Moreover, Doris ensures data loading without loss or duplication through the use of labels. For simple loading tasks, no additional configuration or operations are required. For materialized views associated with tables, atomicity and consistency with the base table are also guaranteed. Doris provides additional transaction control for the following scenarios:

1. If a user needs to combine multiple `INSERT INTO` into a single transaction for the same target table, they can use the `BEGIN` and `COMMIT` commands.

2. If a user needs to combine multiple stream load into a single transaction, they can use the two-phase commit mode of Stream Load.

3. Atomicity of multi-table load with Broker Load.

## Basic Principles

In a Doris loading task, the Backend (BE) submits the Tablet IDs of the successful writes to the Frontend (FE). FE determines the success of the load based on the number of successful tablet replicas. If loading is successful, the transaction is committed and the data load becomes visible. If it fails, the transaction is rolled back and the corresponding tablets are cleaned up.

### Label Mechanism

Doris loading jobs can be assigned a label. This label is usually a user-defined string with certain business logic attributes.

The main purpose of the label is to uniquely identify a loading task and ensure that the same label is loaded successfully only once.

The label mechanism ensures that load data is not lost or duplicated. When combined with an upstream data source that guarantees At-Least-Once semantics, the label mechanism in Doris can ensure Exactly-Once semantics.

Labels are unique within a database. The default retention period for labels is 3 days. After 3 days, completed labels are automatically cleaned up and can be reused.

## Quick Start

### Insert Into

**1. Create Table**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)  NOT NULL COMMENT "User Name",
    age                INT                   COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

Create a table with the same schema for the failed example:

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**2. Successful Load Example**

```sql
BEGIN;

-- INSERT #1
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);

-- INSERT #2
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (6, "William", 69),
       (7, "Sophia", 32),
       (8, "James", 64),
       (9, "Emma", 37),
       (10, "Liam", 64);

COMMIT;
```

Load result: The loading task starts with the `PREPARE` status and becomes `VISIBLE` only after the COMMIT.

```JSON
// BEGIN
Query OK, 0 rows affected (0.001 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':''}

// INSERT #1
Query OK, 5 rows affected (0.017 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':'10060'}

// INSERT #2
Query OK, 5 rows affected (0.007 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'PREPARE', 'txnId':'10060'}

// COMMIT
Query OK, 0 rows affected (1.013 sec)
{'label':'txn_insert_2aeac5519bd549a1-a72fe4001c56e10c', 'status':'VISIBLE', 'txnId':'10060'}
```

Verify the data:

```JSON
MySQL [testdb]> SELECT * FROM testdb.test_table2;
Empty set (0.019 sec)
```


### Stream Load

**1. Enable two-phase commit by setting `two_phase_commit:true` in the HTTP Header.**

```shell
curl --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
{
    "TxnId": 18036,
    "Label": "55c8ffc9-1c40-4d51-b75e-f2265b3602ef",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 100,
    "NumberLoadedRows": 100,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 1031,
    "LoadTimeMs": 77,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 58,
    "CommitAndPublishTimeMs": 0
}
```

**2. Trigger the commit operation for a transaction (can be sent to FE or BE).**

- Specify the transaction using the Transaction ID:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/stream_load2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- Specify the transaction using the label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. Trigger the abort operation for a transaction (can be sent to FE or BE).**

- Specify the transaction using the Transaction ID:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/stream_load2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- Specify the transaction using the label:

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/stream_load2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

### Broker Load

All Broker Load tasks are atomic and ensure atomicity even when loading multiple tables within the same task. The Label mechanism can be used to ensure data load without loss or duplication.

The following example demonstrates loading data from HDFS by using wildcard patterns to match two sets of files and load them into two different tables.

```sql
LOAD LABEL example_db.label2
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
    INTO TABLE `my_table1`
    PARTITION (p1)
    COLUMNS TERMINATED BY ","
    (k1, tmp_k2, tmp_k3)
    SET (
        k2 = tmp_k2 + 1,
        k3 = tmp_k3 + 1
    )
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
    INTO TABLE `my_table2`
    COLUMNS TERMINATED BY ","
    (k1, k2, k3)
)
WITH BROKER hdfs
(
    "username"="hdfs_user",
    "password"="hdfs_password"
);
```

The wildcard pattern is used to match and load two sets of files, `file-10*` and `file-20*`, into `my_table1` and `my_table2` respectively. In the case of `my_table1`, the load is specified to the `p1` partition, and the values of thesecond and third columns in the source file are incremented by 1 before being loaded.

## Best Practices

Labels are typically set in the format of `business_logic+time`, such as `my_business1_20220330_125000`.

This label is commonly used to represent a batch of data generated by the business logic `my_business1` at `2022-03-30 12:50:00`. By setting this label, the business can query the loading task status using the label to determine whether the data batch at that specific time has been successfully load. If the load fails, the label can be used to retry the load.

INSERT INTO supports loading the result of a Doris query into another table. INSERT INTO is a synchronous load method that returns the load result after execution. The success or failure of the load can be determined based on the response. INSERT INTO ensures the atomicity of the loading task, either all succeed or all fail load.