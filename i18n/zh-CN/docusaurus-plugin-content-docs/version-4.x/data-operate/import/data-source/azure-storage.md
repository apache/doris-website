---
{
    "title": "Azure Storage",
    "language": "zh-CN",
    "description": "如何从 Azure Storage 导入数据到 Apache Doris：使用 S3 Load 异步导入或 TVF 同步导入，含完整步骤与示例。",
    "keywords": [
        "Azure Storage 导入",
        "Doris Azure Blob",
        "S3 Load Azure",
        "TVF Azure",
        "Doris 数据导入",
        "s3_client_http_scheme",
        "Azure Blob 导入 Doris"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 从 Azure Storage 导入数据到 Apache Doris -->

Apache Doris 支持从 Azure Storage（Azure Blob Storage）导入文件。本文介绍两种典型的导入方式，您可以根据数据规模和实时性要求选择合适的方案。

## 方案选型

下表对比了两种导入方式的核心差异，便于您快速选型：

| 导入方式 | 执行模式 | 适用场景 | 参考文档 |
|----------|----------|----------|----------|
| S3 Load | 异步 | 大批量数据导入、需要后台调度 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| TVF（Table-Valued Function） | 同步 | 即席查询、小批量数据导入、快速验证 |  |

## 前置条件

在使用任意一种方式从 Azure Storage 导入数据前，请确认以下配置：

- **HTTPS 传输**：Azure Storage 默认要求 HTTPS 传输（对应存储账户配置为 `需要安全传输：已启用`），必须在 Doris `be.conf` 中设置 `s3_client_http_scheme = https`，否则无法正常访问。
- **Region 可省略**：Azure 兼容 S3 协议的 properties 中，`s3.region` 参数可以省略。
- **访问凭证**：准备 Azure Storage 账户的 Access Key（AK）和 Secret Key（SK）。
- **Endpoint 格式**：使用形如 `<StorageAccount>.blob.core.windows.net` 的 Endpoint 地址。

:::caution Caution
若未在 BE 配置中启用 HTTPS，导入时会因协议不匹配而失败。请在执行导入操作前完成上述配置。
:::

## 方式一：使用 S3 Load 导入（异步）

S3 Load 是异步的批量导入方式，适合大规模数据从 Azure Storage 导入到 Doris。完整步骤如下。

### 第 1 步：准备数据

在 Azure Storage 上创建 CSV 文件 `s3load_example.csv`，内容如下：

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

执行以下 SQL 提交一个 S3 Load 任务：

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
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
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
| `provider` | 必须设置为 `AZURE`，标识对象存储提供方 |
| `s3.endpoint` | Azure Blob 服务地址，格式为 `<StorageAccount>.blob.core.windows.net` |
| `s3.region` | Azure 场景下可省略 |
| `s3.access_key` | Azure Storage 账户的 Access Key |
| `s3.secret_key` | Azure Storage 账户的 Secret Key |
| `timeout` | 导入任务超时时间（秒） |

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

TVF（Table-Valued Function，表值函数）是同步导入方式，可以在一条 SQL 中读取并写入数据，适合小批量数据或即席场景。

### 第 1 步：准备数据

在 Azure Storage 上创建 CSV 文件 `s3load_example.csv`，内容如下：

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

通过 `INSERT INTO ... SELECT FROM S3(...)` 直接导入：

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `uri` | Azure Storage 上的对象路径，格式为 `s3://<bucket>/<object>` |
| `format` | 文件格式，例如 `csv`、`parquet`、`orc` 等 |
| `provider` | 必须设置为 `AZURE` |
| `s3.endpoint` | Azure Blob 服务地址 |
| `s3.region` | Azure 场景下可省略 |
| `s3.access_key` / `s3.secret_key` | Azure Storage 访问凭证 |
| `column_separator` | 列分隔符（CSV 适用） |
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

## FAQ

### Q1：S3 Load 与 TVF 应该如何选择？

- **S3 Load**：异步执行，适合大批量数据、需要按 Label 跟踪导入状态、可作为周期性任务调度的场景。
- **TVF**：同步执行，适合小批量数据、即席查询、快速验证文件内容，或需要在 SELECT 中对数据做转换后再写入的场景。

### Q2：为什么访问 Azure Storage 时报错或连接失败？

请确认：

1. BE 节点的 `be.conf` 中已设置 `s3_client_http_scheme = https`，并已重启 BE 生效。
2. Azure Storage 账户的 `需要安全传输` 处于启用状态时，必须使用 HTTPS。
3. `s3.endpoint` 的格式正确：`<StorageAccount>.blob.core.windows.net`，不要包含协议前缀。
4. AK/SK 有效，且具备目标 Bucket 的读取权限。

### Q3：`s3.region` 必须填写吗？

不必。在 Azure 场景下 `s3.region` 可以省略；如果填写，也不会影响导入流程。

### Q4：URI 应使用什么格式？

无论是 S3 Load 的 `DATA INFILE` 还是 TVF 的 `uri`，均使用 `s3://<bucket_name>/<object_path>` 的形式访问 Azure Storage 上的对象。

## Troubleshooting

| 现象 | 可能原因 | 解决方案 |
|------|----------|----------|
| 导入任务报连接错误 | BE 未启用 HTTPS | 在 `be.conf` 中设置 `s3_client_http_scheme = https` 并重启 BE |
| 报权限或鉴权失败 | AK/SK 错误或权限不足 | 检查 Access Key 与 Secret Key 是否正确，并确认对目标容器有读取权限 |
| Endpoint 无法解析 | Endpoint 包含协议前缀或拼写错误 | 使用 `<StorageAccount>.blob.core.windows.net`，不要带 `https://` 等前缀 |
| 导入任务超时 | 数据量较大或网络较慢 | 调大 `PROPERTIES` 中的 `timeout` 值 |

## 相关文档

- [Broker Load 手册](../import-way/broker-load-manual.md)
