---
{
    "title": "本地文件",
    "language": "zh-CN",
    "description": "Doris 本地文件导入指南：通过 Stream Load、Streamloader、MySQL Load 三种方式将 CSV、JSON、Parquet、ORC 等本地文件导入 Doris。",
    "keywords": [
        "Doris 本地文件导入",
        "Stream Load",
        "Streamloader",
        "MySQL Load",
        "LOAD DATA LOCAL INFILE",
        "CSV 导入",
        "本地数据导入"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 将本地文件或客户端本地数据导入 Apache Doris -->

本文介绍如何将本地文件中的数据导入 Apache Doris。Doris 提供三种本地文件导入方式，可根据数据规模、文件数量与客户端环境选择合适方案。

## 方案选型

下表对比三种本地导入方式的特性与适用场景，帮助快速选型：

| 导入方式 | 协议/底层 | 同步/异步 | 支持格式 | 典型场景 | 参考文档 |
|---------|----------|----------|---------|---------|---------|
| **Stream Load** | HTTP | 同步 | CSV、JSON、Parquet、ORC | 单文件、脚本化导入 | [Stream Load](../import-way/stream-load-manual.md) |
| **Streamloader** | 基于 Stream Load | 同步 | CSV、JSON、Parquet、ORC | 多文件、并发导入大数据量 | [Streamloader](../../../connection-integration/data-integration/doris-streamloader) |
| **MySQL Load** | MySQL 协议 | 同步 | CSV | MySQL 客户端本地 CSV 文件 | [MySQL Load](../import-way/mysql-load-manual.md) |

各方式简要说明：

- **Stream Load**：通过 HTTP 协议将本地文件或数据流导入 Doris；执行后直接返回导入结果，可通过返回值判断是否成功。
- **Streamloader**：Doris 官方专用客户端工具，底层基于 Stream Load 实现，支持多文件、多并发导入，可显著降低大数据量导入耗时。
- **MySQL Load**：兼容 MySQL 标准的 [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 语法，主要适用于通过 MySQL 客户端导入本地 CSV 文件。

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

在 Doris 中创建目标表，语法如下：

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

Stream Load 是一种同步导入方式，导入结果会直接返回给用户：

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

创建 CSV 文件 `streamloader_example.csv`，具体内容如下：

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

### 第 3 步：使用 Streamloader 工具导入数据

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

创建名为 `client_local.csv` 的文件，样例数据如下：

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### 第 2 步：在库中创建表

在执行 `LOAD DATA` 命令前，需要先连接 MySQL 客户端：

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

为了正常执行 MySQL Load，连接时必须使用以下选项：

1. 使用 MySQL 客户端连接时，必须加上 `--local-infile` 选项，否则可能会报错。
2. 通过 JDBC 连接时，需要在 URL 中指定配置 `allowLoadLocalInfile=true`。

随后在 Doris 中创建目标表：

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### 第 3 步：使用 MySQL Load 导入数据

连接 MySQL Client 后，创建导入作业，命令如下：

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
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 本地文件导入失败时的排查 -->

**Q1：如何在三种导入方式之间选择？**

- 单个文件、脚本化场景：选择 Stream Load。
- 多个文件且数据量较大、希望并发提速：选择 Streamloader。
- 已有 MySQL 客户端环境、需要导入本地 CSV：选择 MySQL Load。

**Q2：执行 MySQL Load 时报错 `The used command is not allowed with this MySQL version`？**

需要确认两点：

1. 使用 MySQL 命令行连接时是否加了 `--local-infile` 选项。
2. 通过 JDBC 连接时是否在 URL 中加了 `allowLoadLocalInfile=true`。

**Q3：Stream Load 支持哪些数据格式？**

支持 CSV、JSON、Parquet、ORC 四种格式，可通过 HTTP Header 指定 `format` 参数。

**Q4：如何判断 Stream Load 是否导入成功？**

查看返回结果的 `Status` 字段：值为 `Success` 表示成功；同时可结合 `NumberLoadedRows`、`NumberFilteredRows` 等字段确认导入行数与过滤行数。
