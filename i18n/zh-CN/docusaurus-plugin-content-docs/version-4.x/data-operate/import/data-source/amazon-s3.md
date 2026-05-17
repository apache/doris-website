---
{
    "title": "Amazon S3",
    "language": "zh-CN",
    "description": "如何从 Amazon S3 导入数据到 Doris：使用 S3 Load 异步导入与 TVF 同步导入的完整步骤、参数与示例。",
    "keywords": [
        "Amazon S3 导入",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 数据导入",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- 知识类型: 操作步骤 / 数据导入 -->
<!-- 适用场景: 从 AWS S3 将文件导入 Doris -->

Doris 提供两种方式从 AWS S3 导入文件，分别适用于异步与同步两类场景：

| 方式 | 类型 | 适用场景 |
| --- | --- | --- |
| **S3 Load** | 异步导入 | 大批量数据导入、定时任务、对吞吐与稳定性要求较高的离线导入 |
| **TVF（Table Value Function）** | 同步导入 | 即席查询、ETL 加工、配合 `INSERT INTO ... SELECT` 的同步写入 |

> 提示：S3 Load 基于 Broker Load 实现，详细行为可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

## 方式一：使用 S3 Load 导入（异步） {#load-with-tvf}
<!-- 知识类型: 操作步骤 -->

S3 Load 是一种异步导入方式，提交后立即返回，由后台执行。适合数据量较大或需要后台批处理的场景。

### 第 1 步：准备数据

在 S3 上创建 CSV 文件 `s3load_example.csv`，其内容如下：

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

### 第 3 步：使用 S3 Load 导入数据

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
    "provider" = "S3",
    "s3.endpoint" = "s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

关键参数说明：

| 参数 | 说明 |
| --- | --- |
| `DATA INFILE` | S3 上待导入文件的 URI，格式为 `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | CSV 列分隔符 |
| `FORMAT AS` | 文件格式，例如 `CSV` |
| `provider` | 对象存储提供商，AWS S3 填写 `S3` |
| `s3.endpoint` | S3 服务的 Endpoint，例如 `s3.us-west-2.amazonaws.com` |
| `s3.region` | S3 Bucket 所在的 Region |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | 导入任务超时时间，单位秒 |

### 第 4 步：检查导入数据

```sql
SELECT * FROM test_s3load;
```

预期结果：

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

## 方式二：使用 TVF 导入（同步）

<!-- 知识类型: 操作步骤 -->

TVF（Table Value Function）将 S3 上的文件视为一张表，可直接通过 `SELECT` 查询，并配合 `INSERT INTO` 同步写入 Doris 表中。适合对结果可见性要求较高、数据量适中的场景。

### 第 1 步：准备数据

在 S3 上创建 CSV 文件 `s3load_example.csv`，其内容如下：

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

### 第 3 步：使用 TVF 导入数据

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "s3.endpoint" = "s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数 | 说明 |
| --- | --- |
| `uri` | S3 上待读取文件的 URI |
| `format` | 文件格式，例如 `csv` |
| `s3.endpoint` | S3 服务的 Endpoint |
| `s3.region` | S3 Bucket 所在的 Region |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | 列分隔符 |
| `csv_schema` | CSV 文件的 Schema 定义，格式为 `列名:类型;...` |

### 第 4 步：检查导入数据

```sql
SELECT * FROM test_s3load;
```

预期结果：

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

## 使用 AWS Assume Role 鉴权

<!-- 知识类型: 配置参数 / 鉴权 -->

除了使用 Access Key / Secret Key，Doris 也支持通过 `AWS Assume Role` 的方式使用 S3 Load 与 TVF 进行鉴权，适合企业内对密钥下发受限的场景。详细配置请参考 [AWS 集成 - Assumed Role 认证](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)。

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：S3 Load 与 TVF 应该如何选择？**

- 大批量、离线、定时任务：优先使用 **S3 Load**（异步、可后台执行、支持超时控制）。
- 即席查询、需要在 SQL 中加工后写入：优先使用 **TVF**（同步、可与 `SELECT`/`INSERT` 组合）。

**Q2：如何指定 S3 文件的 Region 与 Endpoint？**

- 通过 `s3.region` 指定 Bucket 所在 Region，例如 `us-west-2`。
- 通过 `s3.endpoint` 指定服务地址，例如 `s3.us-west-2.amazonaws.com`。
- 两者需保持一致，否则可能出现连接失败或重定向错误。

**Q3：TVF 导入时是否必须提供 `csv_schema`？**

当源文件为 CSV 时，建议显式提供 `csv_schema`，明确每列的名称与类型，避免类型推断带来的不确定性。

**Q4：S3 Load 任务执行时间过长怎么办？**

可以适当调大 `PROPERTIES` 中的 `timeout`（单位秒），示例中为 `3600`，可根据数据规模调整。

## Troubleshooting

<!-- 知识类型: 故障排查 -->

| 现象 | 可能原因 | 处理建议 |
| --- | --- | --- |
| 连接 S3 失败 / 超时 | `s3.endpoint` 与 `s3.region` 不匹配，或网络不通 | 校对 Endpoint 与 Region；确认 Doris BE 节点可访问 S3 |
| 鉴权失败（403） | Access Key / Secret Key 错误，或权限不足 | 检查 AK/SK 是否正确；确认对应 Bucket 与 Object 的读权限 |
| 文件未找到 | `DATA INFILE` / `uri` 路径错误 | 确认 Bucket 名称、Key 路径以及大小写 |
| CSV 解析错误 | 分隔符或 Schema 不匹配 | 检查 `COLUMNS TERMINATED BY` / `column_separator` 与 `csv_schema` |
| 任务超时 | 数据量大或网络较慢 | 增大 `timeout`；或拆分文件并行导入 |

## 相关文档

- [Broker Load 手册](../import-way/broker-load-manual.md)
- [AWS 集成 - Assumed Role 认证](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)
