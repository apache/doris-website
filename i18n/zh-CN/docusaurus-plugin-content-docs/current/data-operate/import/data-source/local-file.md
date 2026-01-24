---
{
    "title": "本地文件",
    "language": "zh-CN",
    "description": "Doris 提供多种方式从本地数据导入："
}
---

Doris 提供多种方式从本地数据导入：

- **Stream Load**

Stream Load 是通过 HTTP 协议将本地文件或数据流导入到 Doris 中。Stream Load 是一个同步导入方式，执行导入后返回导入结果，可以通过请求的返回判断导入是否成功。支持导入 CSV、JSON、Parquet 与 ORC 格式的数据。更多文档参考[stream load](../import-way/stream-load-manual.md)。

- **streamloader**

Streamloader 工具是一款用于将数据导入 Doris 数据库的专用客户端工具，底层基于 Stream Load 实现，可以提供多文件，多并发导入的功能，降低大数据量导入的耗时。更多文档参考[Streamloader](../../../ecosystem/doris-streamloader)。

- **MySQL Load**

Doris 兼容 MySQL 协议，可以使用 MySQL 标准的 [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 语法导入本地文件。MySQL Load 是一种同步导入方式，执行导入后即返回导入结果，主要适用于导入客户端本地 CSV 文件。更多文档参考[MySQL Load](../import-way/mysql-load-manual.md)。

## 使用 Stream Load 导入

### 第 1 步：准备数据

创建 CSV 文件 `streamload_example.csv`，内容如下：

```SQL
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 第 2 步：在库中创建表

在 Doris 中创建表，语法如下：

```SQL
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "用户 ID",
    name               VARCHAR(20)           COMMENT "用户姓名",
    age                INT                   COMMENT "用户年龄"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：使用 Stream Load 导入数据

使用 `curl` 提交 Stream Load 导入作业：

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Stream Load 是一种同步导入方式，导入结果会直接返回给用户。

```SQL
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```

### 第 4 步：检查导入数据

```SQL
select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## 使用 Streamloader 工具导入

### 第 1 步：准备数据

创建 csv 文件 streamloader_example.csv 文件。具体内容如下

```SQL
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 第 2 步：在库中创建表

在 Doris 中创建被导入的表，具体语法如下：

```SQL
CREATE TABLE testdb.test_streamloader(
    user_id            BIGINT       NOT NULL COMMENT "用户 ID",
    name               VARCHAR(20)           COMMENT "用户姓名",
    age                INT                   COMMENT "用户年龄"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：使用 stream loader 工具导入数据

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamloader"
```

这是一种同步导入方式，导入结果会直接返回给用户：

```SQL
Load Result: {
        "Status": "Success",
        "TotalRows": 10,
        "FailLoadRows": 0,
        "LoadedRows": 10,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 118,
        "LoadTimeMs": 623,
        "LoadFiles": [
                "streamloader_example.csv"
        ]
}
```

### 第 4 步：检查导入数据

```SQL
select count(*) from testdb.test_streamloader;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## 使用 MySQL Load 从本地数据导入

### 第 1 步：准备数据

创建名为 client_local.csv 的文件，样例数据如下：

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### 第 2 步：在库中创建表

在执行 LOAD DATA 命令前，需要先链接 mysql 客户端。

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

执行 MySQL Load，在连接时需要使用指定参数选项：

1. 在链接 mysql 客户端时，必须使用 `--local-infile` 选项，否则可能会报错。
2. 通过 JDBC 链接，需要在 URL 中指定配置 `allowLoadLocalInfile=true`

在 Doris 中创建以下表：

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### 第 3 步：使用 Mysql Load 导入数据

链接 MySQL Client 后，创建导入作业，命令如下：

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 第 4 步：检查导入数据

MySQL Load 是一种同步的导入方式，导入后结果会在命令行中返回给用户。如果导入执行失败，会展示具体的报错信息。

如下是导入成功的结果显示，会返回导入的行数：

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```