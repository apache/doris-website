---
{
    "title": "从 Google Cloud Storage (GCS) 导入数据",
    "language": "zh-CN",
    "description": "如何从 Google Cloud Storage 导入数据到 Apache Doris：通过 S3 Load 异步导入，或通过 S3 TVF 同步导入。",
    "keywords": [
        "Google Cloud Storage 导入",
        "GCS 导入 Doris",
        "S3 Load GCP",
        "S3 TVF GCS",
        "Doris 对象存储导入",
        "GCP provider"
    ],
    "sidebar_label": "Google Cloud Storage"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 从 Google Cloud Storage 导入数据到 Apache Doris -->

Apache Doris 支持从 Google Cloud Storage（GCS）导入文件，通过 S3 兼容协议访问 GCS 桶。本文介绍两种导入方式及其完整操作步骤。

## 方案选型

Doris 提供两种从 Google Cloud Storage 导入文件的方式，可根据数据规模与时效要求选择：

| 导入方式 | 执行模式 | 适用场景 | 参考文档 |
|---------|---------|---------|---------|
| S3 Load | 异步 | 大批量数据导入、长时间运行的任务 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| S3 TVF（表函数） | 同步 | 小批量数据导入、即席查询、快速验证 | 本文档 |

选择建议：

- 数据量较大或需要后台运行时，推荐使用 **S3 Load**。
- 需要立即得到结果或与 `INSERT INTO ... SELECT` 配合使用时，推荐使用 **S3 TVF**。

## 前置准备

在执行导入前，请准备以下信息：

- Google Cloud Storage 桶名称（`your_bucket_name`）。
- 访问凭证：Access Key 与 Secret Key。
- GCS Endpoint 与 Region（例如 `storage.us-west2.rep.googleapis.com` 与 `US-WEST2`）。
- 已部署并可访问的 Apache Doris 集群。

## 方式一：使用 S3 Load 导入（异步）

S3 Load 适用于大批量数据的异步导入。详细参数与高级用法可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

创建 CSV 文件 `s3load_example.csv`，并上传至 Google Cloud Storage，内容如下：

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
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
|------|------|
| `provider` | 对象存储服务商，GCS 固定为 `GCP` |
| `s3.endpoint` | GCS S3 兼容访问端点 |
| `s3.region` | GCS 桶所在区域 |
| `s3.access_key` | GCS 访问密钥 ID |
| `s3.secret_key` | GCS 访问密钥 |
| `timeout` | 导入超时时间，单位秒 |

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

S3 表函数（TVF）适用于同步导入与即席查询，可直接配合 `INSERT INTO ... SELECT` 使用。

### 第 1 步：准备数据

创建 CSV 文件 `s3load_example.csv`，并上传至 Google Cloud Storage，内容如下：

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `uri` | 对象存储中文件的 S3 URI |
| `format` | 文件格式，例如 `csv`、`parquet`、`orc` |
| `provider` | 对象存储服务商，GCS 固定为 `GCP` |
| `s3.endpoint` | GCS S3 兼容访问端点 |
| `s3.region` | GCS 桶所在区域 |
| `s3.access_key` | GCS 访问密钥 ID |
| `s3.secret_key` | GCS 访问密钥 |
| `column_separator` | 列分隔符 |
| `csv_schema` | CSV 列定义，格式为 `列名:类型;列名:类型` |

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

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

**Q1：`provider` 参数应该填什么？**

从 Google Cloud Storage 导入时，`provider` 必须设置为 `GCP`，以便 Doris 使用 GCS 的 S3 兼容协议进行访问。

**Q2：S3 Load 与 S3 TVF 应如何选择？**

- 数据量大、需要后台异步执行：选择 **S3 Load**。
- 数据量小、需要立即返回结果或与 SQL 查询配合：选择 **S3 TVF**。

**Q3：如何获取 GCS 的 Access Key 与 Secret Key？**

可在 Google Cloud Console 的 **Cloud Storage → Settings → Interoperability** 页面创建并管理 HMAC 密钥（Access Key / Secret Key），用于 S3 兼容访问。

**Q4：Endpoint 与 Region 如何确定？**

Endpoint 与 Region 取决于桶所在区域。例如，`US-WEST2` 区域对应的端点为 `storage.us-west2.rep.googleapis.com`。请根据实际桶位置进行替换。

**Q5：导入失败提示超时怎么办？**

可调大 `PROPERTIES` 中的 `timeout` 参数（单位为秒），默认即 `3600`。对于超大文件或慢速网络，可适当延长。
