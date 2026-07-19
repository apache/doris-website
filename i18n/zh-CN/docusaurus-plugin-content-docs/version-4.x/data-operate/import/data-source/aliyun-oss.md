---
{
    "title": "阿里云 OSS",
    "language": "zh-CN",
    "description": "本文介绍如何通过 S3 Load 与 TVF 两种方式，将阿里云 OSS 上的 CSV 等文件高效导入到 Apache Doris。",
    "keywords": [
        "阿里云 OSS",
        "Aliyun OSS",
        "Doris 导入 OSS",
        "S3 Load",
        "Table Value Function",
        "TVF 导入",
        "对象存储导入",
        "Broker Load",
        "OSS endpoint"
    ]
}
---

<!-- 知识类型: 操作步骤 / 数据导入 -->
<!-- 适用场景: 从阿里云 OSS 加载数据到 Doris -->

Apache Doris 支持从阿里云 OSS（Object Storage Service）导入文件，覆盖批量异步导入与即席同步导入两种典型场景。本文给出两种方式的对比、操作步骤与常见问题排查。

## 方案选型

在选择导入方式前，可参考下表选择适合自己场景的方式：

| 导入方式  | 触发命令                       | 同步/异步 | 适用场景                                   | 参考文档                                                          |
| --------- | ------------------------------ | --------- | ------------------------------------------ | ----------------------------------------------------------------- |
| S3 Load   | `LOAD LABEL ...`               | 异步      | 大批量数据导入、需要任务管理与失败重试     | [Broker Load 手册](../import-way/broker-load-manual.md)           |
| TVF 导入  | `INSERT INTO ... SELECT FROM S3(...)` | 同步      | 即席查询、轻量数据导入、需要即时返回结果   | -                                                                 |

## 前置准备

在开始之前，请确认以下信息已经准备就绪：

- 阿里云 OSS 的 `bucket` 名称与目标文件路径
- 访问凭证：`AccessKey`（AK）与 `SecretKey`（SK）
- OSS Endpoint 与 Region 信息
- Doris 集群可访问 OSS（公网或内网均可）

:::caution 关于 Endpoint 选择
阿里云 OSS 公网与内网的 Endpoint 不同。若 Doris 集群与 OSS 在同一 Region，建议使用内网 Endpoint，可获得更低延迟与更稳定带宽，并避免公网流量费用。

- 内网 Endpoint：`oss-cn-hangzhou-internal.aliyuncs.com`
- 公网 Endpoint：`oss-cn-hangzhou.aliyuncs.com`
:::

## 使用 S3 Load 导入（异步）

S3 Load 是基于 Broker Load 的异步导入方式，适合批量数据加载，详细机制可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

在阿里云 OSS 上创建 CSV 文件 `s3load_example.csv`，内容如下：

```text
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

### 第 2 步：在 Doris 中创建表

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：执行 S3 Load 导入

```sql
LOAD LABEL s3_load_2022_04_01
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

关键参数说明：

| 参数              | 说明                                                  |
| ----------------- | ----------------------------------------------------- |
| `provider`        | 对象存储类型，阿里云 OSS 固定为 `OSS`                 |
| `s3.endpoint`     | OSS 服务端 Endpoint，按所在 Region 与网络环境选择     |
| `s3.region`       | OSS Region 名称，例如 `oss-cn-hangzhou`               |
| `s3.access_key`   | 阿里云账号的 AccessKey ID                             |
| `s3.secret_key`   | 阿里云账号的 AccessKey Secret                         |
| `timeout`         | 任务超时时间，单位为秒                                |

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_s3load;
```

预期输出：

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 使用 TVF 导入（同步）

TVF（Table Value Function）支持以表值函数的形式直接读取对象存储文件，并通过 `INSERT INTO ... SELECT` 同步写入目标表，适合即席数据导入或小批量加载。

### 第 1 步：准备数据

在阿里云 OSS 上创建 CSV 文件 `s3load_example.csv`，内容如下：

```text
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

### 第 2 步：在 Doris 中创建表

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：执行 TVF 导入

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数                | 说明                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `uri`               | OSS 文件地址，使用 `s3://` 协议前缀                                  |
| `format`            | 文件格式，例如 `csv`、`parquet`、`orc` 等                            |
| `provider`          | 对象存储类型，阿里云 OSS 固定为 `OSS`                                |
| `s3.endpoint`       | OSS 服务端 Endpoint                                                  |
| `s3.region`         | OSS Region 名称                                                      |
| `s3.access_key`     | 阿里云账号的 AccessKey ID                                            |
| `s3.secret_key`     | 阿里云账号的 AccessKey Secret                                        |
| `column_separator`  | CSV 列分隔符                                                         |
| `csv_schema`        | CSV 列定义，格式为 `列名:类型;列名:类型;...`                         |

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_s3load;
```

预期输出：

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

<!-- 知识类型: FAQ / 故障排查 -->

## 常见问题（FAQ）

### Q1：S3 Load 与 TVF 导入应该如何选择？

- 数据量较大、需要异步执行并依赖任务调度与重试机制时，使用 **S3 Load**。
- 需要即席查询或同步写入、对返回结果有即时性要求时，使用 **TVF 导入**。

### Q2：内网 Endpoint 与公网 Endpoint 有什么区别？

- 当 Doris 集群与 OSS 处于相同 Region 时，使用 **内网 Endpoint**（如 `oss-cn-hangzhou-internal.aliyuncs.com`）可获得更低延迟与更稳定带宽，且不产生公网流量费用。
- 跨 Region 或集群部署在阿里云外部时，需使用 **公网 Endpoint**（如 `oss-cn-hangzhou.aliyuncs.com`）。

### Q3：`provider` 参数为什么必须设置为 `OSS`？

`provider` 用于告知 Doris 后端对象存储类型，以便适配阿里云 OSS 的鉴权与协议细节。导入阿里云 OSS 文件时必须显式设置为 `OSS`。

### Q4：S3 Load 任务卡住或超时怎么办？

- 增大 `PROPERTIES` 中的 `timeout` 值（单位：秒）。
- 检查网络连通性，优先使用内网 Endpoint。
- 通过 `SHOW LOAD` 查看任务状态与失败原因，详见 [Broker Load 手册](../import-way/broker-load-manual.md)。

### Q5：TVF 导入是否支持 CSV 以外的格式？

支持。可通过 `format` 参数指定 `csv`、`parquet`、`orc` 等格式；非 CSV 格式时无需指定 `column_separator` 与 `csv_schema`。
