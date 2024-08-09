---
{
    "title": "Group Commit",
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

# Group Commit

Group commit load does not introduce a new data import method, but an extension of `INSERT INTO tbl VALUS(...)`, `Stream Load` and `Http Stream`. It is a way to improve the write performance of Doris with high-concurrency and small-data writes. Your application can directly use JDBC to do high-concurrency insert operation into Doris, at the same time, combining PreparedStatement can get even higher performance. In logging scenarios, you can also do high-concurrency Stream Load or Http Stream into Doris. 

## Group Commit Mode

Group Commit provides 3 modes:

* `off_mode`

Disable group commit, keep the original behavior for `INSERT INTO VALUES`, `Stream Load` and `Http Stream`.

* `sync_mode`

Doris groups multiple loads into one transaction commit based on the `group_commit_interval` table property. The load is returned after the transaction commit. This mode is suitable for high-concurrency writing scenarios and requires immediate data visibility after the load is finished.

* `async_mode`

Doris writes data to the Write Ahead Log (WAL) firstly, then the load is returned. Doris groups multiple loads into one transaction commit based on the `group_commit_interval` table property, and the data is visible after the commit. To prevent excessive disk space usage by the WAL, it automatically switches to `sync_mode`. This is suitable for latency-sensitive and high-frequency writing.

## Basic operations

If the table schema is:
```sql
CREATE TABLE `dt` (
    `id` int(11) NOT NULL,
    `name` varchar(50) NULL,
    `score` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

### Use `JDBC`

To reduce the CPU cost of SQL parsing and query planning, we provide the `PreparedStatement` in the FE. When using `PreparedStatement`, the SQL and its plan will be cached in the session level memory cache and will be reused later on, which reduces the CPU cost of FE. The following is an example of using PreparedStatement in JDBC:

1. Setup JDBC url and enable server side prepared statement

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true
```

2. Set `group_commit` session variable, there are two ways to do it:

* Add `sessionVariables=group_commit=async_mode` in JDBC url

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&sessionVariables=group_commit=async_mode
```

* Use `SET group_commit = async_mode;` command

```
try (Statement statement = conn.createStatement()) {
    statement.execute("SET group_commit = async_mode;");
}
```

3. Using `PreparedStatement`

```java
private static final String JDBC_DRIVER = "com.mysql.jdbc.Driver";
private static final String URL_PATTERN = "jdbc:mysql://%s:%d/%s?useServerPrepStmts=true";
private static final String HOST = "127.0.0.1";
private static final int PORT = 9087;
private static final String DB = "db";
private static final String TBL = "dt";
private static final String USER = "root";
private static final String PASSWD = "";
private static final int INSERT_BATCH_SIZE = 10;

private static void groupCommitInsert() throws Exception {
    Class.forName(JDBC_DRIVER);
    try (Connection conn = DriverManager.getConnection(String.format(URL_PATTERN, HOST, PORT, DB), USER, PASSWD)) {
        // set session variable 'group_commit'
        try (Statement statement = conn.createStatement()) {
            statement.execute("SET group_commit = async_mode;");
        }

        String query = "insert into " + TBL + " values(?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(query)) {
            for (int i = 0; i < INSERT_BATCH_SIZE; i++) {
                stmt.setInt(1, i);
                stmt.setString(2, "name" + i);
                stmt.setInt(3, i + 10);
                int result = stmt.executeUpdate();
                System.out.println("rows: " + result);
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}   

private static void groupCommitInsertBatch() throws Exception {
    Class.forName(JDBC_DRIVER);
    // add rewriteBatchedStatements=true and cachePrepStmts=true in JDBC url
    // set session variables by sessionVariables=group_commit=async_mode in JDBC url
    try (Connection conn = DriverManager.getConnection(
            String.format(URL_PATTERN + "&rewriteBatchedStatements=true&cachePrepStmts=true&sessionVariables=group_commit=async_mode", HOST, PORT, DB), USER, PASSWD)) {

        String query = "insert into " + TBL + " values(?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(query)) {
            for (int j = 0; j < 5; j++) {
                // 10 rows per insert
                for (int i = 0; i < INSERT_BATCH_SIZE; i++) {
                    stmt.setInt(1, i);
                    stmt.setString(2, "name" + i);
                    stmt.setInt(3, i + 10);
                    stmt.addBatch();
                }
                int[] result = stmt.executeBatch();
            }
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

Note: Due to the high frequency of INSERT INTO statements, a large number of audit logs will be printed, which can impact performance. This can be controlled by setting a session variable to determine whether to print audit logs for prepared statements.

```sql
# Configure the session variable to disable the printing of prepared statement audit logs. By default, it is true, which means audit logs for prepared statements are enabled.
SET enable_prepared_stmt_audit_log = false;
```

See [Synchronize Data Using Insert Method](../../data-operate/import/insert-into-manual) for more details about **JDBC**.

### INSERT INTO VALUES

* async_mode
```sql
# Config session variable to enable the async group commit, the default value is off_mode
mysql> set group_commit = async_mode;

# The retured label is start with 'group_commit', which is the label of the real load job
mysql> insert into dt values(1, 'Bob', 90), (2, 'Alice', 99);
Query OK, 2 rows affected (0.05 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# The returned label and txn_id are the same as the above, which means they are handled in on load job  
mysql> insert into dt(id, name) values(3, 'John');
Query OK, 1 row affected (0.01 sec)
{'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

# The data is not visible
mysql> select * from dt;
Empty set (0.01 sec)

# After about 10 seconds, the data is visible
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
+------+-------+-------+
3 rows in set (0.02 sec)
```

* sync_mode
```sql
# Config session variable to enable the sync group commit
mysql> set group_commit = sync_mode;

# The retured label is start with 'group_commit', which is the label of the real load job. 
# The insert costs at least the group_commit_interval_ms of table property.
mysql> insert into dt values(4, 'Bob', 90), (5, 'Alice', 99);
Query OK, 2 rows affected (10.06 sec)
{'label':'group_commit_d84ab96c09b60587_ec455a33cb0e9e87', 'status':'PREPARE', 'txnId':'3007', 'query_id':'fc6b94085d704a94-a69bfc9a202e66e2'}

# The data is visible after the insert is returned
mysql> select * from dt;
+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Bob   |    90 |
|    2 | Alice |    99 |
|    3 | John  |  NULL |
|    4 | Bob   |    90 |
|    5 | Alice |    99 |
+------+-------+-------+
5 rows in set (0.03 sec)
```

* off_mode
```sql
mysql> set group_commit = off_mode;
```

### Stream Load

If the content of `data.csv` is:
```sql
6,Amy,60
7,Ross,98
```

* async_mode
```sql
# Add 'group_commit:async_mode' configuration in the http header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:async_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 7009,
    "Label": "group_commit_c84d2099208436ab_96e33fda01eddba8",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 35,
    "StreamLoadPutTimeMs": 5,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 26
}

# The returned 'GroupCommit' is 'true', which means this is a group commit load
# The retured label is start with 'group_commit', which is the label of the real load job
```

* sync_mode
```sql
# Add 'group_commit:sync_mode' configuration in the http header

curl --location-trusted -u {user}:{passwd} -T data.csv -H "group_commit:sync_mode"  -H "column_separator:,"  http://{fe_host}:{http_port}/api/db/dt/_stream_load
{
    "TxnId": 3009,
    "Label": "group_commit_d941bf17f6efcc80_ccf4afdde9881293",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 10044,
    "StreamLoadPutTimeMs": 4,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 10038
}

# The returned 'GroupCommit' is 'true', which means this is a group commit load
# The retured label is start with 'group_commit', which is the label of the real load job
```

See [Stream Load](stream-load-manual.md) for more detailed syntax used by **Stream Load**.

### Http Stream

* async_mode
```sql
# Add 'group_commit:async_mode' configuration in the http header

curl --location-trusted -u {user}:{passwd} -T data.csv  -H "group_commit:async_mode" -H "sql:insert into db.dt select * from http_stream('column_separator'=',', 'format' = 'CSV')"  http://{fe_host}:{http_port}/api/_http_stream
{
    "TxnId": 7011,
    "Label": "group_commit_3b45c5750d5f15e5_703428e462e1ebb0",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 65,
    "StreamLoadPutTimeMs": 41,
    "ReadDataTimeMs": 47,
    "WriteDataTimeMs": 23
}

# The returned 'GroupCommit' is 'true', which means this is a group commit load
# The retured label is start with 'group_commit', which is the label of the real load job
```

* sync_mode
```sql
# Add 'group_commit:sync_mode' configuration in the http header

curl --location-trusted -u {user}:{passwd} -T data.csv  -H "group_commit:sync_mode" -H "sql:insert into db.dt select * from http_stream('column_separator'=',', 'format' = 'CSV')"  http://{fe_host}:{http_port}/api/_http_stream
{
    "TxnId": 3011,
    "Label": "group_commit_fe470e6752aadbe6_a8f3ac328b02ea91",
    "Comment": "",
    "GroupCommit": true,
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 2,
    "NumberLoadedRows": 2,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 19,
    "LoadTimeMs": 10066,
    "StreamLoadPutTimeMs": 31,
    "ReadDataTimeMs": 32,
    "WriteDataTimeMs": 10034
}

# The returned 'GroupCommit' is 'true', which means this is a group commit load
# The retured label is start with 'group_commit', which is the label of the real load job
```

See [Stream Load](stream-load-manual.md) for more detailed syntax used by **Http Stream**.

## Group commit condition

The data will be automatically committed either when the time interval (default is 10 seconds) or the data size (default is 64 MB) conditions meet.

### Modify the time interval condition

The default group commit interval is 10 seconds. Users can modify the configuration of the table:

```sql
# Modify the group commit interval to 2 seconds
ALTER TABLE dt SET ("group_commit_interval_ms" = "2000");
```

### Modify the data size condition

The default group commit data size is 64 MB. Users can modify the configuration of the table:

```sql
# Modify the group commit data size to 128MB
ALTER TABLE dt SET ("group_commit_data_bytes" = "134217728");
```

## Limitations

* When the group commit is enabled, some `INSERT INTO VALUES` sqls are not executed in the group commit way if they meet the following conditions:

  * Transaction insert, such as `BEGIN`, `INSERT INTO VALUES`, `COMMIT`

  * Specify the label, such as `INSERT INTO dt WITH LABEL {label} VALUES`

  * Expressions within VALUES, such as `INSERT INTO dt VALUES (1 + 100)`

  * Column update

  * Tables that do not support light schema changes

* When the group commit is enabled, some `Stream Load` and `Http Stream` are not executed in the group commit way if they meet the following conditions:

  * Two phase commit

  * Specify the label  by set header `-H "label:my_label"`

  * Column update

  * Tables that do not support light schema changes

* For unique table, because the group commit can not guarantee the commit order, users can use sequence column to ensure the data consistency.

* The limit of `max_filter_ratio`

  * For non group commit load, filter_ratio is calculated by the failed rows and total rows when load is finished. If the filter_ratio does not match, the transaction will not commit

  * In the group commit mode, multiple user loads are executed by one internal load. The internal load will commit all user loads.

  * Currently, group commit supports a certain degree of max_filter_ratio semantics. When the total number of rows does not exceed group_commit_memory_rows_for_max_filter_ratio (configured in `be.conf`, defaulting to `10000` rows), max_filter_ratio will work.

* The limit of WAL

  * For async_mode group commit, data is written to the Write Ahead Log (WAL). If the internal load succeeds, the WAL is immediately deleted. If the internal load fails, data is recovery by importing the WAL.

  * Currently, WAL files are stored only on one disk of one BE. If the BE's disk is damaged or the file is mistakenly deleted, it may result in data loss.

  * When decommissioning a BE node, please use the [`DECOMMISSION`](../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DECOMMISSION-BACKEND) command to safely decommission the node. This prevents potential data loss if the WAL files are not processed before the node is taken offline.

  * For async_mode group commit writes, to protect disk space, it switches to sync_mode under the following conditions:

    * For an import with large amount of data: exceeding 80% of the disk space of a WAL directory. 

    * Chunked stream loads with an unknown data amount.

    * Insufficient disk space, even with it is an import with small amount of data.

  * During hard weight schema changes (adding or dropping columns, modifying varchar length, and renaming columns are lightweight schema changes, others are hard weight), to ensure WAL file is compatibility with the table's schema, the final stage of metadata modification in FE will reject group commit writes. Clients get `insert table ${table_name} is blocked on schema change` exception and can retry the import.

## Relevant system configuration

### BE configuration

#### `group_commit_wal_path`

* The `WAL` directory of group commit.
* Default: A directory named `wal` is created under each directory of the `storage_root_path`. Configuration examples:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

#### `group_commit_memory_rows_for_max_filter_ratio`

* Description: The `max_filter_ratio` limit can only work if the total rows of `group commit` is less than this value.
* Default: 10000

## Performance

We have separately tested the write performance of group commit in high-concurrency scenarios with small data volumes using `Stream Load` and `JDBC` (in `async mode`).

### Stream Load

#### Environment

* 1 Front End (FE) server: Alibaba Cloud with 8-core CPU, 16GB RAM, and one 100GB ESSD PL1 SSD.

* 3 Backend (BE) servers: Alibaba Cloud with 16-core CPU, 64GB RAM, and one 1TB ESSD PL1 SSD.

* 1 Test Client: Alibaba Cloud with 16-core CPU, 64GB RAM, and one 100GB ESSD PL1 SSD.

* The version for testing is Doris-3.0.1.

#### DataSet

* `httplogs`, 31 GB, 247249096 (247 million) rows

#### Test Tool

* [doris-streamloader](../../ecosystem/doris-streamloader)

#### Test Method

* Setting different single-concurrency data size and concurrency num between `non group_commit` and `group_commit` modes.

#### Test Result

| Load Way           | Single-concurrency Data Size | Concurrency | Cost Seconds | Rows / Seconds | MB / Seconds |
|--------------------|------------------------------|-------------|--------------------|----------------|--------------|
| `group_commit` | 10 KB   | 10   | 2204      | 112,181   | 14.8 |
| `group_commit` | 10 KB   | 30   | 2176      | 113,625   | 15.0 |
| `group_commit` | 100 KB  | 10   | 283       | 873,671  | 115.1 |
| `group_commit` | 100 KB  | 30   | 244       | 1,013,315  | 133.5 |
| `group_commit` | 500 KB  | 10   | 125       | 1,977,992  | 260.6 |
| `group_commit` | 500 KB  | 30   | 122       | 2,026,631  | 267.1 |
| `group_commit` | 1 MB    | 30   | 119       | 2,077,723  | 273.8 |
| `group_commit` | 1 MB    | 30   | 119       | 2,077,723  | 273.8 |
| `group_commit` | 10 MB   | 10   | 118       | 2,095,331  | 276.1 |
| `non group_commit` | 1 MB    | 10   | 1883  | 131,305 | 17.3|
| `non group_commit` | 10 MB   | 10   | 965       | 256,216  | 33.8 |
| `non group_commit` | 10 MB   | 30   | 118  | 2095331 | 276.1|

In the above test, the CPU usage of BE fluctuates between 10-40%.

The `group_commit` effectively enhances import performance while reducing the number of versions, thereby alleviating the pressure on compaction.

### JDBC

#### Environment

1 Front End (FE) server: Alibaba Cloud with an 8-core CPU, 16GB RAM, and one 100GB ESSD PL1 SSD.

1 Backend (BE) server: Alibaba Cloud with a 16-core CPU, 64GB RAM, and one 500GB ESSD PL1 SSD.

1 Test Client: Alibaba Cloud with a 16-core CPU, 64GB RAM, and one 100GB ESSD PL1 SSD.

The testing version is Doris-3.0.1.

Disable the printing of prepared statement audit logs to enhance performance.

#### DataSet

* The data of tpch sf10 `lineitem` table, 20 files, 14 GB, 120 million rows

#### Test Method

* [DataX](https://github.com/alibaba/DataX)

#### Test Method

* Use `txtfilereader` wtite data to `mysqlwriter`, config different concurrenncy and rows for per `INSERT` sql.

#### Test Result


| Rows per insert | Concurrency | Rows / Second | MB / Second |
|-----------------|-------------|---------------|-------------|
| 100 | 10  | 160,758    | 17.21 |
| 100 | 20  | 210,476    | 22.19 |
| 100 | 30  | 214,323    | 22.92 |

In the above test, the CPU usage of BE fluctuates between 10-20%, FE fluctuates between 60-70%.


### Insert into Sync Mode Small Batch Data

**Machine Configuration**

* 1 Front-End (FE): Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 500GB ESSD PL1 cloud disk
* 5 Back-End (BE) nodes: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 1TB ESSD PL1 cloud disk. Note: Tests were conducted using 1, 3, and 5 BE nodes respectively.
* 1 Testing Client: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 100GB ESSD PL1 cloud disk
* Test version: Doris-3.0.1

**Dataset**

* Simple insert into statement: `insert into tbl values(1,1);`

**Testing Tool**

* [Jemeter](https://jmeter.apache.org/)

**Testing Methodology**

* Data was written to `Doris` using `Jemeter`.

**Test Results**

* Data unit: rows per second.
* The following tests were divided into two groups: new optimizer and old optimizer.

**30 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 834.1      | new: 916.5      | new: 930.2      | new: 907.1      | new: 925.7      | new: 946.2      |
|                       | old: 822.9      | old: 913.4      | old: 917.0      | old: 925.2      | old: 940.6      | old: 932.3      |
| 20ms                  | new: 657.3      | new: 656.3      | new: 691.9      | new: 695.5      | new: 715.0      | new: 717.2      |
|                       | old: 649.4      | old: 658.6      | old: 691.5      | old: 711.4      | old: 715.0      | old: 709.3      |
| 50ms                  | new: 400.2      | new: 392.0      | new: 402.0      | new: 409.3      | new: 413.7      | new: 415.1      |
|                       | old: 387.4      | old: 387.1      | old: 411.9      | old: 415.8      | old: 415.8      | old: 414.1      |
| 100ms                 | new: 235.9      | new: 243.2      | new: 238.4      | new: 243.5      | new: 245.0      | new: 245.1      |
|                       | old: 236.7      | old: 243.5      | old: 239.9      | old: 244.3      | old: 245.0      | old: 244.1      |

**100 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 2321.1    | new: 2393.6    | new: 2760.3    | new: 2632.7    | new: 2614.8    | new: 2661.7    |
|                       | old: 2437.4    | old: 2423.8    | old: 2709.2    | old: 2637.7    | old: 2718.4    | old: 2827.8    |
| 20ms                  | new: 1889.2    | new: 1914.2    | new: 2098.7    | new: 2071.5    | new: 2043.9    | new: 2073.0    |
|                       | old: 1969.1    | old: 2016.7    | old: 2058.3    | old: 2090.8    | old: 2189.6    | old: 2177.5    |
| 50ms                  | new: 1222.7    | new: 1226.9    | new: 1215.3    | new: 1261.1    | new: 1268.8    | new: 1282.0    |
|                       | old: 1227.7    | old: 1263.7    | old: 1278.1    | old: 1270.9    | old: 1290.3    | old: 1319.0    |
| 100ms                 | new: 756.8     | new: 759.2     | new: 758.2     | new: 777.5     | new: 777.2     | new: 783.8     |
|                       | old: 767.9     | old: 769.1     | old: 780.7     | old: 784.1     | old: 794.1     | old: 804.3     |

**500 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 5315.2    | new: 5333.8    | new: 5374.0    | new: 6456.4    | new: 6735.3    | new: 4816.5    |
|                       | old: 7001.3    | old: 7747.4    | old: 8181.5    | old: 7830.2    | old: 8493.9    | old: 8022.3    |
| 20ms                  | new: 5243.2    | new: 5301.8    | new: 5487.7    | new: 6776.9    | new: 6825.0    | new: 3917.8    |
|                       | old: 7756.7    | old: 7996.6    | old: 7852.4    | old: 7852.1    | old: 7990.5    | old: 7902.5    |
| 50ms                  | new: 4944.2    | new: 4978.9    | new: 5054.9    | new: 4944.0    | new: 4975.2    | new: 3843.6    |
|                       | old: 5730.1    | old: 5746.9    | old: 5709.9    | old: 5916.3    | old: 6024.7    | old: 6024.0    |
| 100ms                 | new: 3350.9    | new: 3353.5    | new: 3372.7    | new: 3307.6    | new: 3341.2    | new: 3120.5    |
|                       | old: 3715.0    | old: 3682.8    | old: 3717.9    | old: 3755.7    | old: 3820.8    | old: 3832.8    |

### Insert into Sync Mode Large Batch Data

**Machine Configuration**

* 1 Front-End (FE): Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 500GB ESSD PL1 cloud disk

* 5 Back-End (BE) nodes: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 1TB ESSD PL1 cloud disk. Note: Tests were conducted using 1, 3, and 5 BE nodes respectively.

* 1 Testing Client: Alibaba Cloud, 16-core CPU, 64GB RAM, 1 x 100GB ESSD PL1 cloud disk

* Test version: Doris-3.0.1

**Dataset**

* Insert into statement for 1000 rows: `insert into tbl values(1,1)...` (1000 rows omitted)

**Testing Tool**

* [Jemeter](https://jmeter.apache.org/)

**Testing Methodology**

* Data was written to `Doris` using `Jemeter`.

**Test Results**

* Data unit: rows per second.

* The following tests were divided into two groups: new optimizer and old optimizer.

**30 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 33.7K | new: 33.0K      | new: 33.4K      | new: 39.4K      | new: 32.2K      | new: 34.2K      |
|                       | old: 501.4K | old: 505.3K      | old: 512.6K      | old: 37K        | old: 35.8K      | old: 297.8K     |
| 20ms                  | new: 35.0K      | new: 32.9K      | new: 35.5K      | new: 35.4K      | new: 39.4K      | new: 35.6K      |
|                       | old: 415.1K     | old: 425.0K     | old: 430.5K     | old: 144.4K     | old: 285.2K     | old: 287.8K     |
| 50ms                  | new: 41.4K      | new: 42.5K      | new: 40.4K      | new: 39.6K      | new: 41.1K      | new: 39.4K      |
|                       | old: 301.7K     | old: 312.9K     | old: 295.4K     | old: 138.1K     | old: 252.3K     | old: 255.1K     |
| 100ms                 | new: 37.3K      | new: 38.1K      | new: 39.2K      | new: 37.3K      | new: 38.4K      | new: 40.2K      |
|                       | old: 202.5K     | old: 202.4K     | old: 200.8K     | old: 128.2K     | old: 200.8K     | old: 201.2K     |

**100 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 37.0K      | new: 37.1K      | new: 36.9K      | new: 37.7K      | new: 37.4K      | new: 37.2K      |
|                       | old: 585.5K     | old: 594.6K     | old: 599.2K     | old: 587K       | old: 594.6K     | old: 468.8K     |
| 20ms                  | new: 37.4K      | new: 37.3K      | new: 37.2K      | new: 37.7K      | new: 37.7K      | new: 37.2K      |
|                       | old: 594.0K     | old: 595.9K     | old: 608.7K     | old: 591.7K     | old: 599.5K     | old: 467.4K     |
| 50ms                  | new: 38.3K      | new: 37.1K      | new: 36.9K      | new: 38.5K      | new: 38.4K      | new: 36.3K      |
|                       | old: 563.9K     | old: 572K       | old: 576.6K     | old: 563.3K     | old: 565.5K     | old: 454.5K     |
| 100ms                 | new: 36.4K      | new: 37.7K      | new: 36.6K      | new: 36.4K      | new: 39.1K      | new: 36.3K      |
|                       | old: 500.3K     | old: 505.5K     | old: 509K       | old: 504.3K     | old: 506.7K     | old: 403.5K     |

**500 Concurrent Sync Mode Performance Test**

| Group commit internal | 1FE 5BE 5 replica | 1FE 5BE 3 replica | 1FE 5BE 1 replica | 1FE 3BE 3 replica | 1FE 3BE 1 replica | 1FE 1BE 1 replica |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | new: 23.2K      | new: 24K        | new: 23.6K      | new: 28.9K      | new: 24.9K      | new: 177.2K     |
|                       | old: 421.9K     | old: 412.7K     | old: 414.1K     | old: 117.1K     | old: 414.1K     | old: 418.4K     |
| 20ms                  | new: 23.9K      | new: 24.4K      | new: 23.3K      | new: 26.2K      | new: 24.9K      | new: 10.4K      |
|                       | old: 416.4K     | old: 409.9K     | old: 401.3K     | old: 402.1K     | old: 405K       | old: 411.7K     |
| 50ms                  | new: 24K        | new: 23.8K      | new: 22.8K      | new: 20.2K      | new: 23.7K      | new: 3.9K       |
|                       | old: 405.9K     | old: 407.4K     | old: 402.8K     | old: 6.6K       | old: 402.1K     | old: 411.1K     |
| 100ms                 | new: 23.5K      | new: 23.2K      | new: 22.7K      | new: 21.5K      | new: 24.4K      | new: 20.2K      |
|                       | old: 399.8K     | old: 406.3K     | old: 407.1K     | old: 409.9K     | old: 402.4K     | old: 395.9K     |
