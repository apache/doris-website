---
{
    "title": "Group Commit",
    "language": "zh-CN"
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


Group Commit 不是一种新的导入方式，而是对`INSERT INTO tbl VALUES(...)`、`Stream Load`、`Http Stream`的扩展，大幅提升了高并发小写入的性能。您的应用程序可以直接使用 JDBC 将数据高频写入 Doris，同时通过使用 PreparedStatement 可以获得更高的性能。在日志场景下，您也可以利用 Stream Load 或者 Http Stream 将数据高频写入 Doris。

## Group Commit 模式

Group Commit 写入有三种模式，分别是：

* 关闭模式（`off_mode`）

    不开启 Group Commit，保持以上三种导入方式的默认行为。

* 同步模式（`sync_mode`）

    Doris 根据负载和表的 `group_commit_interval`属性将多个导入在一个事务提交，事务提交后导入返回。这适用于高并发写入场景，且在导入完成后要求数据立即可见。

* 异步模式（`async_mode`）

    Doris 首先将数据写入 WAL (`Write Ahead Log`)，然后导入立即返回。Doris 会根据负载和表的`group_commit_interval`属性异步提交数据，提交之后数据可见。为了防止 WAL 占用较大的磁盘空间，单次导入数据量较大时，会自动切换为`sync_mode`。这适用于写入延迟敏感以及高频写入的场景。

## Group Commit 使用方式

假如表的结构为：
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

### 使用 JDBC

当用户使用 JDBC `insert into values`方式写入时，为了减少 SQL 解析和生成规划的开销，我们在 FE 端支持了 MySQL 协议的 `PreparedStatement` 特性。当使用 `PreparedStatement` 时，SQL 和其导入规划将被缓存到 Session 级别的内存缓存中，后续的导入直接使用缓存对象，降低了 FE 的 CPU 压力。下面是在 JDBC 中使用 `PreparedStatement` 的例子：

**1. 设置 JDBC URL 并在 Server 端开启 Prepared Statement**

```
url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true
```

**2. 配置 `group_commit` session 变量，有如下两种方式：**

* 通过 JDBC url 设置，增加`sessionVariables=group_commit=async_mode`

    ```
    url = jdbc:mysql://127.0.0.1:9030/db?useServerPrepStmts=true&sessionVariables=group_commit=async_mode
    ```

* 通过执行 SQL 设置

    ```
    try (Statement statement = conn.createStatement()) {
        statement.execute("SET group_commit = async_mode;");
    }
    ```

**3. 使用 `PreparedStatement`**

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

关于 **JDBC** 的更多用法，参考[使用 Insert 方式同步数据](./insert-into-manual.md)。

### INSERT INTO VALUES

* 异步模式

    ```sql
    # 配置 session 变量开启 group commit (默认为 off_mode),开启异步模式
    mysql> set group_commit = async_mode;

    # 这里返回的 label 是 group_commit 开头的，可以区分出是否使用了 group commit
    mysql> insert into dt values(1, 'Bob', 90), (2, 'Alice', 99);
    Query OK, 2 rows affected (0.05 sec)
    {'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

    # 可以看出这个 label, txn_id 和上一个相同，说明是攒到了同一个导入任务中
    mysql> insert into dt(id, name) values(3, 'John');
    Query OK, 1 row affected (0.01 sec)
    {'label':'group_commit_a145ce07f1c972fc-bd2c54597052a9ad', 'status':'PREPARE', 'txnId':'181508'}

    # 不能立刻查询到
    mysql> select * from dt;
    Empty set (0.01 sec)

    # 10 秒后可以查询到，可以通过表属性 group_commit_interval 控制数据可见延迟。
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

* 同步模式

    ```sql
    # 配置 session 变量开启 group commit (默认为 off_mode),开启同步模式
    mysql> set group_commit = sync_mode;

    # 这里返回的 label 是 group_commit 开头的，可以区分出是否谁用了 group commit，导入耗时至少是表属性 group_commit_interval。
    mysql> insert into dt values(4, 'Bob', 90), (5, 'Alice', 99);
    Query OK, 2 rows affected (10.06 sec)
    {'label':'group_commit_d84ab96c09b60587_ec455a33cb0e9e87', 'status':'PREPARE', 'txnId':'3007', 'query_id':'fc6b94085d704a94-a69bfc9a202e66e2'}

    # 数据可以立刻读出
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

* 关闭模式

    ```sql
    mysql> set group_commit = off_mode;
    ```

### Stream Load

假如`data.csv`的内容为：

```sql
6,Amy,60
7,Ross,98
```

* 异步模式

    ```sql
    # 导入时在 header 中增加"group_commit:async_mode"配置

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

    # 返回的 GroupCommit 为 true，说明进入了 group commit 的流程
    # 返回的 Label 是 group_commit 开头的，是真正消费数据的导入关联的 label
    ```

* 同步模式

    ```sql
    # 导入时在 header 中增加"group_commit:sync_mode"配置

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

    # 返回的 GroupCommit 为 true，说明进入了 group commit 的流程
    # 返回的 Label 是 group_commit 开头的，是真正消费数据的导入关联的 label
    ```

    关于 Stream Load 使用的更多详细语法及最佳实践，请参阅 [Stream Load](./stream-load-manual)。

### Http Stream

* 异步模式

    ```sql
    # 导入时在 header 中增加"group_commit:async_mode"配置

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

    # 返回的 GroupCommit 为 true，说明进入了 group commit 的流程
    # 返回的 Label 是 group_commit 开头的，是真正消费数据的导入关联的 label
    ```

* 同步模式

    ```sql
    # 导入时在 header 中增加"group_commit:sync_mode"配置

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

    # 返回的 GroupCommit 为 true，说明进入了 group commit 的流程
    # 返回的 Label 是 group_commit 开头的，是真正消费数据的导入关联的 label
    ```

    关于 Http Stream 使用的更多详细语法及最佳实践，请参阅 [Stream Load](./stream-load-manual.md#tvf-在-stream-load-中的应用---http_stream-模式)。

## 自动提交条件

当满足时间间隔 (默认为 10 秒) 或数据量 (默认为 64 MB) 其中一个条件时，会自动提交数据。

### 修改提交间隔

默认提交间隔为 10 秒，用户可以通过修改表的配置调整：

```sql
# 修改提交间隔为 2 秒
ALTER TABLE dt SET ("group_commit_interval_ms" = "2000");
```

### 修改提交数据量

Group Commit 的默认提交数据量为 64 MB，用户可以通过修改表的配置调整：

```sql
# 修改提交数据量为 128MB
ALTER TABLE dt SET ("group_commit_data_bytes" = "134217728");
```

## 使用限制

* 当开启了 Group Commit 模式，系统会判断用户发起的`INSERT INTO VALUES`语句是否符合 Group Commit 的条件，如果符合，该语句的执行会进入到 Group Commit 写入中。符合以下条件会自动退化为非 Group Commit 方式：

  + 事务写入，即`Begin`; `INSERT INTO VALUES`; `COMMIT`方式

  + 指定 Label，即`INSERT INTO dt WITH LABEL {label} VALUES`

  + VALUES 中包含表达式，即`INSERT INTO dt VALUES (1 + 100)`

  + 列更新写入

  + 表不支持 light schema change

* 当开启了 Group Commit 模式，系统会判断用户发起的`Stream Load`和`Http Stream`是否符合 Group Commit 的条件，如果符合，该导入的执行会进入到 Group Commit 写入中。符合以下条件的会自动退化为非 Group Commit 方式：

  + 两阶段提交

  + 指定 Label，即通过 `-H "label:my_label"`设置

  + 列更新写入

  + 表不支持 light schema change

+ 对于 Unique 模型，由于 Group Commit 不能保证提交顺序，用户可以配合 Sequence 列使用来保证数据一致性

* 对`max_filter_ratio`语义的支持

  * 在默认的导入中，`filter_ratio`是导入完成后，通过失败的行数和总行数计算，决定是否提交本次写入

  * 在 Group Commit 模式下，由于多个用户发起的导入会被一个内部导入执行，虽然可以计算出每个导入的`filter_ratio`，但是数据一旦进入内部导入，就只能 commit transaction

  * Group Commit 模式支持了一定程度的`max_filter_ratio`语义，当导入的总行数不高于`group_commit_memory_rows_for_max_filter_ratio`(配置在`be.conf`中，默认为`10000`行)，`max_filter_ratio` 工作

* WAL 限制

  * 对于`async_mode`的 Group Commit 写入，会把数据写入 WAL。如果内部导入成功，则 WAL 被立刻删除；如果内部导入失败，通过导入 WAL 的方法来恢复数据

  * 目前 WAL 文件只存储在一个 BE 上，如果这个 BE 磁盘损坏或文件误删等，可能导入丢失部分数据

  * 当下线 BE 节点时，请使用[`DECOMMISSION`](../../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DECOMMISSION-BACKEND)命令，安全下线节点，防止该节点下线前 WAL 文件还没有全部处理完成，导致部分数据丢失

  * 对于`async_mode`的 Group Commit 写入，为了保护磁盘空间，当遇到以下情况时，会切换成`sync_mode`

    * 导入数据量过大，即超过 WAL 单目录的 80% 空间

    * 不知道数据量的 chunked stream load

    * 导入数据量不大，但磁盘可用空间不足

  * 当发生重量级 Schema Change（目前加减列、修改 varchar 长度和重命名列是轻量级 Schema Change，其它的是重量级 Schema Change）时，为了保证 WAL 能够适配表的 Schema，在 Schema Change 最后的 FE 修改元数据阶段，会拒绝 Group Commit 写入，客户端收到 `insert table ${table_name} is blocked on schema change` 异常，客户端重试即可

## 相关系统配置

### BE 配置

1. `group_commit_wal_path`

* 描述：group commit 存放 WAL 文件的目录

* 默认值：默认在用户配置的`storage_root_path`的各个目录下创建一个名为`wal`的目录。配置示例：
  
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

2. `group_commit_memory_rows_for_max_filter_ratio`**

* 描述：当 group commit 导入的总行数不高于该值，`max_filter_ratio` 正常工作，否则不工作

* 默认值：10000

## 性能

我们分别测试了使用`Stream Load`和`JDBC`在高并发小数据量场景下`group commit`(使用`async mode`) 的写入性能。

### Stream Load 日志场景测试

**机器配置**

* 1 台 FE：8 核 CPU、16GB 内存、1 块 200GB 通用性 SSD 云磁盘

* 3 台 BE：16 核 CPU、64GB 内存、1 块 2TB 通用性 SSD 云磁盘

* 1 台测试客户端：16 核 CPU、64GB 内存、1 块 100GB 通用型 SSD 云磁盘

**数据集**

* `httplogs` 数据集，总共 31GB、2.47 亿条

**测试工具**

* [doris-streamloader](/ecosystem/doris-streamloader.md)

**测试方法**

* 对比 `非 group_commit` 和 `group_commit `的 `async_mode` 模式下，设置不同的单并发数据量和并发数，导入 `247249096` 行数据

**测试结果**

| 导入方式    | 单并发数据量  | 并发数  | 耗时 (秒)     | 导入速率 (行/秒) | 导入吞吐 (MB/秒) |
|----------------|---------|------|-----------|----------|-----------|
| `group_commit` | 10 KB   | 10   | 3707      | 66,697   | 8.56 |
| `group_commit` | 10 KB   | 30   | 3385      | 73,042   | 9.38 |
| `group_commit` | 100 KB  | 10   | 473       | 522,725  | 67.11 |
| `group_commit` | 100 KB  | 30   | 390       | 633,972  | 81.39 |
| `group_commit` | 500 KB  | 10   | 323       | 765,477  | 98.28 |
| `group_commit` | 500 KB  | 30   | 309       | 800,158  | 102.56 |
| `group_commit` | 1 MB    | 10   | 304       | 813,319  | 104.24 |
| `group_commit` | 1 MB    | 30   | 286       | 864,507  | 110.88 |
| `group_commit` | 10 MB   | 10   | 290       | 852,583  | 109.28 |
| `非group_commit` | 1 MB    | 10   | 导入报错 -235  |  | |
| `非group_commit` | 10 MB   | 10   | 519       | 476,395  | 61.12 |
| `非group_commit` | 10 MB   | 30   | 导入报错 -235  |  | |

在上面的`group_commit`测试中，BE 的 CPU 使用率在 10-40% 之间。

可以看出，`group_commit` 模式在小数据量并发导入的场景下，能有效的提升导入性能，同时减少版本数，降低系统合并数据的压力。

### JDBC

**机器配置**

* 1 台 FE：8 核 CPU、16 GB 内存、1 块 200 GB 通用性 SSD 云磁盘

* 1 台 BE：16 核 CPU、64 GB 内存、1 块 2 TB 通用性 SSD 云磁盘

* 1 台测试客户端：16 核 CPU、64GB 内存、1 块 100 GB 通用型 SSD 云磁盘

**数据集**

* tpch sf10 `lineitem` 表数据集，30 个文件，总共约 22 GB，1.8 亿行

**测试工具**

* [DataX](https://github.com/alibaba/DataX)

**测试方法**

* 通过 `txtfilereader` 向 `mysqlwriter` 写入数据，配置不同并发数和单个 `INSERT` 的行数

**测试结果**

| 单个 insert 的行数 | 并发数 | 导入速率 (行/秒) | 导入吞吐 (MB/秒) |
|-------------|-----|-----------|----------|
| 100 | 20  | 106931    | 11.46 |

在上面的测试中，FE 的 CPU 使用率在 60-70% 左右，BE 的 CPU 使用率在 10-20% 左右。
