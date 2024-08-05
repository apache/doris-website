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


### Insert into sync 模式小批量数据

**机器配置**

* 1 台 FE：阿里云 16 核 CPU、64GB 内存、1 块 500GB ESSD PL1 云磁盘

* 5 台 BE：阿里云 16 核 CPU、64GB 内存、1 块 1TB ESSD PL1 云磁盘。注：测试中分别用了1台，3台，5台BE进行测试。

* 1 台测试客户端：阿里云 16 核 CPU、64GB 内存、1 块 100GB ESSD PL1 云磁盘

* 测试版本为Doris-3.0.1

**数据集**

* 简单的insert into语句。insert into tbl values(1,1);

**测试工具**

* [Jemeter](https://jmeter.apache.org/)

**测试方法**

* 通过 `Jemeter` 向`Doris`写数据。

**测试结果**

* 数据单位为行每秒。

* 以下测试分为新优化器和旧优化器两组数据。

**30并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 834.1      | 新: 916.5      | 新: 930.2      | 新: 907.1      | 新: 925.7      | 新: 946.2      |
|                       | 旧: 822.9      | 旧: 913.4      | 旧: 917.0      | 旧: 925.2      | 旧: 940.6      | 旧: 932.3      |
| 20ms                  | 新: 657.3      | 新: 656.3      | 新: 691.9      | 新: 695.5      | 新: 715.0      | 新: 717.2      |
|                       | 旧: 649.4      | 旧: 658.6      | 旧: 691.5      | 旧: 711.4      | 旧: 715.0      | 旧: 709.3      |
| 50ms                  | 新: 400.2      | 新: 392.0      | 新: 402.0      | 新: 409.3      | 新: 413.7      | 新: 415.1      |
|                       | 旧: 387.4      | 旧: 387.1      | 旧: 411.9      | 旧: 415.8      | 旧: 415.8      | 旧: 414.1      |
| 100ms                 | 新: 235.9      | 新: 243.2      | 新: 238.4      | 新: 243.5      | 新: 245.0      | 新: 245.1      |
|                       | 旧: 236.7      | 旧: 243.5      | 旧: 239.9      | 旧: 244.3      | 旧: 245.0      | 旧: 244.1      |

**100并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 2321.1    | 新: 2393.6    | 新: 2760.3    | 新: 2632.7    | 新: 2614.8    | 新: 2661.7    |
|                       | 旧: 2437.4    | 旧: 2423.8    | 旧: 2709.2    | 旧: 2637.7    | 旧: 2718.4    | 旧: 2827.8    |
| 20ms                  | 新: 1889.2    | 新: 1914.2    | 新: 2098.7    | 新: 2071.5    | 新: 2043.9    | 新: 2073.0    |
|                       | 旧: 1969.1    | 旧: 2016.7    | 旧: 2058.3    | 旧: 2090.8    | 旧: 2189.6    | 旧: 2177.5    |
| 50ms                  | 新: 1222.7    | 新: 1226.9    | 新: 1215.3    | 新: 1261.1    | 新: 1268.8    | 新: 1282.0    |
|                       | 旧: 1227.7    | 旧: 1263.7    | 旧: 1278.1    | 旧: 1270.9    | 旧: 1290.3    | 旧: 1319.0    |
| 100ms                 | 新: 756.8     | 新: 759.2     | 新: 758.2     | 新: 777.5     | 新: 777.2     | 新: 783.8     |
|                       | 旧: 767.9     | 旧: 769.1     | 旧: 780.7     | 旧: 784.1     | 旧: 794.1     | 旧: 804.3     |

**500并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 5315.2    | 新: 5333.8    | 新: 5374.0    | 新: 6456.4    | 新: 6735.3    | 新: 4816.5    |
|                       | 旧: 7001.3    | 旧: 7747.4    | 旧: 8181.5    | 旧: 7830.2    | 旧: 8493.9    | 旧: 8022.3    |
| 20ms                  | 新: 5243.2    | 新: 5301.8    | 新: 5487.7    | 新: 6776.9    | 新: 6825.0    | 新: 3917.8    |
|                       | 旧: 7756.7    | 旧: 7996.6    | 旧: 7852.4    | 旧: 7852.1    | 旧: 7990.5    | 旧: 7902.5    |
| 50ms                  | 新: 4944.2    | 新: 4978.9    | 新: 5054.9    | 新: 4944.0    | 新: 4975.2    | 新: 3843.6    |
|                       | 旧: 5730.1    | 旧: 5746.9    | 旧: 5709.9    | 旧: 5916.3    | 旧: 6024.7    | 旧: 6024.0    |
| 100ms                 | 新: 3350.9    | 新: 3353.5    | 新: 3372.7    | 新: 3307.6    | 新: 3341.2    | 新: 3120.5    |
|                       | 旧: 3715.0    | 旧: 3682.8    | 旧: 3717.9    | 旧: 3755.7    | 旧: 3820.8    | 旧: 3832.8    |

### Insert into sync 模式大批量数据

**机器配置**

* 1 台 FE：阿里云 16 核 CPU、64GB 内存、1 块 500GB ESSD PL1 云磁盘

* 5 台 BE：阿里云 16 核 CPU、64GB 内存、1 块 1TB ESSD PL1 云磁盘。注：测试中分别用了1台，3台，5台BE进行测试。

* 1 台测试客户端：阿里云 16 核 CPU、64GB 内存、1 块 100GB ESSD PL1 云磁盘

* 测试版本为Doris-3.0.1

**数据集**

* 1000条数据的insert into语句。insert into tbl values(1,1)...省略1000条数据;

**测试工具**

* [Jemeter](https://jmeter.apache.org/)

**测试方法**

* 通过 `Jemeter` 向`Doris`写数据。

**测试结果**

* 数据单位为行每秒。

* 以下测试分为新优化器和旧优化器两组数据。

**30并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 33.7K | 新: 33.0K      | 新: 33.4K      | 新: 39.4K      | 新: 32.2K      | 新: 34.2K      |
|                       | 旧: 501.4K | 旧: 505.3K      | 旧: 512.6K      | 旧: 37K        | 旧: 35.8K      | 旧: 297.8K     |
| 20ms                  | 新: 35.0K      | 新: 32.9K      | 新: 35.5K      | 新: 35.4K      | 新: 39.4K      | 新: 35.6K      |
|                       | 旧: 415.1K     | 旧: 425.0K     | 旧: 430.5K     | 旧: 144.4K     | 旧: 285.2K     | 旧: 287.8K     |
| 50ms                  | 新: 41.4K      | 新: 42.5K      | 新: 40.4K      | 新: 39.6K      | 新: 41.1K      | 新: 39.4K      |
|                       | 旧: 301.7K     | 旧: 312.9K     | 旧: 295.4K     | 旧: 138.1K     | 旧: 252.3K     | 旧: 255.1K     |
| 100ms                 | 新: 37.3K      | 新: 38.1K      | 新: 39.2K      | 新: 37.3K      | 新: 38.4K      | 新: 40.2K      |
|                       | 旧: 202.5K     | 旧: 202.4K     | 旧: 200.8K     | 旧: 128.2K     | 旧: 200.8K     | 旧: 201.2K     |

**100并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 37.0K      | 新: 37.1K      | 新: 36.9K      | 新: 37.7K      | 新: 37.4K      | 新: 37.2K      |
|                       | 旧: 585.5K     | 旧: 594.6K     | 旧: 599.2K     | 旧: 587K       | 旧: 594.6K     | 旧: 468.8K     |
| 20ms                  | 新: 37.4K      | 新: 37.3K      | 新: 37.2K      | 新: 37.7K      | 新: 37.7K      | 新: 37.2K      |
|                       | 旧: 594.0K     | 旧: 595.9K     | 旧: 608.7K     | 旧: 591.7K     | 旧: 599.5K     | 旧: 467.4K     |
| 50ms                  | 新: 38.3K      | 新: 37.1K      | 新: 36.9K      | 新: 38.5K      | 新: 38.4K      | 新: 36.3K      |
|                       | 旧: 563.9K     | 旧: 572K       | 旧: 576.6K     | 旧: 563.3K     | 旧: 565.5K     | 旧: 454.5K     |
| 100ms                 | 新: 36.4K      | 新: 37.7K      | 新: 36.6K      | 新: 36.4K      | 新: 39.1K      | 新: 36.3K      |
|                       | 旧: 500.3K     | 旧: 505.5K     | 旧: 509K       | 旧: 504.3K     | 旧: 506.7K     | 旧: 403.5K     |

**500并发sync模式性能测试**

| Group commit internal | 1FE 5BE 5副本 | 1FE 5BE 3副本 | 1FE 5BE 1副本 | 1FE 3BE 3副本 | 1FE 3BE 1副本 | 1FE 1BE 1副本 |
|-----------------------|---------------|---------------|---------------|---------------|---------------|---------------|
| 10ms                  | 新: 23.2K      | 新: 24K        | 新: 23.6K      | 新: 28.9K      | 新: 24.9K      | 新: 177.2K     |
|                       | 旧: 421.9K     | 旧: 412.7K     | 旧: 414.1K     | 旧: 117.1K     | 旧: 414.1K     | 旧: 418.4K     |
| 20ms                  | 新: 23.9K      | 新: 24.4K      | 新: 23.3K      | 新: 26.2K      | 新: 24.9K      | 新: 10.4K      |
|                       | 旧: 416.4K     | 旧: 409.9K     | 旧: 401.3K     | 旧: 402.1K     | 旧: 405K       | 旧: 411.7K     |
| 50ms                  | 新: 24K        | 新: 23.8K      | 新: 22.8K      | 新: 20.2K      | 新: 23.7K      | 新: 3.9K       |
|                       | 旧: 405.9K     | 旧: 407.4K     | 旧: 402.8K     | 旧: 6.6K       | 旧: 402.1K     | 旧: 411.1K     |
| 100ms                 | 新: 23.5K      | 新: 23.2K      | 新: 22.7K      | 新: 21.5K      | 新: 24.4K      | 新: 20.2K      |
|                       | 旧: 399.8K     | 旧: 406.3K     | 旧: 407.1K     | 旧: 409.9K     | 旧: 402.4K     | 旧: 395.9K     |
