---
{
    "title": "从 MinIO 导入数据",
    "language": "zh-CN",
    "description": "如何将 MinIO 对象存储中的 CSV、Parquet 等文件导入 Doris？支持 S3 Load 异步与 TVF 同步两种方式。",
    "keywords": [
        "MinIO 导入",
        "Doris MinIO",
        "S3 Load",
        "S3 TVF",
        "对象存储导入",
        "use_path_style",
        "MinIO endpoint"
    ],
    "sidebar_label": "MinIO"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 将 MinIO 对象存储中的文件导入 Doris -->

[MinIO](https://min.io/) 是兼容 S3 协议的对象存储。Doris 提供两种方式从 MinIO 导入文件，可根据数据规模与时效性需求选择：

| 导入方式 | 执行模式 | 适用场景 | 文档参考 |
|----------|----------|----------|----------|
| S3 Load   | 异步 | 大批量数据导入、需要后台运行的任务 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| TVF（Table Value Function）| 同步 | 小批量、即席（Ad-hoc）查询导入；与 `INSERT INTO ... SELECT` 配合使用 | 本文示例 |

## 前置准备

在使用任意一种方式导入 MinIO 数据前，请确认以下条件：

- 已部署 Doris 集群，并能正常访问 MinIO 服务
- 已获取 MinIO 的 endpoint、region、access key、secret key
- 待导入的 CSV/Parquet 等文件已上传到 MinIO bucket

:::caution 重要：MinIO 连接配置注意事项
使用 S3 Load 或 TVF 导入 MinIO 数据时，请注意以下两点：

- **Endpoint 协议前缀**：如果 MinIO 部署在本地网络且未启用 TLS，需要在 `endpoint` 中显式添加 `http://`，例如 `"s3.endpoint" = "http://localhost:9000"`。
- **路径访问风格**：S3 SDK 默认使用 virtual-hosted style，但 MinIO 默认未开启该访问方式。需添加 `"use_path_style" = "true"` 强制使用 path style。
:::

## 方式一：使用 S3 Load 导入（异步）

S3 Load 适用于将 MinIO 上的文件以异步任务的方式导入 Doris，详细步骤可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

创建 CSV 文件 `s3load_example.csv` 并上传至 MinIO，其内容如下：

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

执行以下 SQL 提交 S3 Load 任务：

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
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### 第 4 步：检查导入数据

执行查询验证数据是否导入成功：

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

## 方式二：使用 TVF 导入（同步）

TVF（Table Value Function）方式通过 `S3()` 函数将 MinIO 文件作为虚拟表读取，配合 `INSERT INTO ... SELECT` 即可同步完成导入，适合小批量或即席场景。

### 第 1 步：准备数据

创建 CSV 文件 `s3load_example.csv` 并上传至 MinIO，其内容如下：

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

执行以下 SQL 同步导入数据：

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

### 第 4 步：检查导入数据

执行查询验证数据是否导入成功：

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

## 关键参数说明

<!-- 知识类型: 配置参数 -->

下列参数在 S3 Load 与 TVF 中均需正确配置：

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `provider` | 对象存储提供方，使用 MinIO 时填写 `S3` | `S3` |
| `s3.endpoint` | MinIO 服务地址，未启用 TLS 时需带 `http://` 前缀 | `http://localhost:9000` |
| `s3.region` | MinIO 部署所在 region，可任意填写但需保持一致 | `us-east-1` |
| `s3.access_key` | MinIO 访问密钥 ID | `myminioadmin` |
| `s3.secret_key` | MinIO 访问密钥 Secret | `minio-secret-key-change-me` |
| `use_path_style` | 是否使用 path style 访问，MinIO 必须设置为 `true` | `true` |

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 故障排查 / 连接配置 -->

### Q1：S3 Load 与 TVF 应该如何选择？

- **S3 Load**：异步执行，适合大批量数据导入，提交后由 Doris 在后台调度执行，可通过 `SHOW LOAD` 查询任务状态。
- **TVF**：同步执行，适合小批量、即席分析或与 `INSERT INTO ... SELECT` 链路结合的场景，立即返回结果。

### Q2：连接 MinIO 时报 endpoint 相关错误怎么办？

确认 endpoint 是否带正确的协议前缀：

- 未启用 TLS：必须带 `http://`，如 `http://localhost:9000`
- 启用 TLS：使用 `https://` 前缀

### Q3：访问报 bucket 解析错误或 404 怎么办？

MinIO 默认不支持 virtual-hosted style 访问，需要在导入参数中显式添加：

```text
"use_path_style" = "true"
```

### Q4：是否支持 Parquet/ORC 等其他格式？

支持。将 `FORMAT AS "CSV"`（或 TVF 中的 `"format" = "csv"`）替换为 `parquet`、`orc` 等对应格式即可，详见 [Broker Load 手册](../import-way/broker-load-manual.md)。
