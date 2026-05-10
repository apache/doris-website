---
{
    "title": "S3 兼容存储",
    "language": "zh-CN",
    "description": "如何将 MinIO、Ceph 等 S3 兼容存储中的数据导入 Apache Doris：通过 S3 Load 异步导入或 TVF 同步导入。",
    "keywords": [
        "S3 兼容存储",
        "MinIO 导入 Doris",
        "Ceph 导入 Doris",
        "S3 Load",
        "S3 TVF",
        "Broker Load",
        "对象存储导入",
        "use_path_style",
        "virtual-hosted style",
        "path style"
    ]
}
---

<!-- 知识类型: 操作步骤 / 数据导入 -->
<!-- 适用场景: 从 S3 兼容存储（MinIO、Ceph 等）导入数据到 Doris -->

Apache Doris 支持从各类兼容 S3 协议的对象存储（如 MinIO、Ceph、华为云 OBS、腾讯云 COS 等）中导入数据。本文介绍两种导入方式的适用场景与完整操作步骤。

## 方案选型

根据数据规模与处理模式选择合适的导入方式：

| 导入方式 | 模式 | 适用场景 | 参考文档 |
| --- | --- | --- | --- |
| **S3 Load** | 异步 | 大批量数据导入、需要任务管理与重试机制 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| **TVF（Table Value Function）** | 同步 | 即席查询、小批量数据导入、需要在 SQL 中直接消费数据 | - |

:::caution 注意
S3 SDK 默认使用 **virtual-hosted style** 方式访问对象存储。若目标存储系统未开启或不支持该方式，可通过添加参数 `"use_path_style" = "true"` 强制使用 **path style** 方式。
:::

## 使用 S3 Load 导入（异步）

S3 Load 适合大规模数据的批量导入场景，导入任务以异步方式提交并由 Doris 在后台调度执行。详细机制请参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

在 S3 兼容存储上创建 CSV 文件 `s3load_example.csv`，内容如下：

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

### 第 2 步：在 Doris 中创建目标表

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：提交 S3 Load 导入任务

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
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

关键参数说明：

| 参数 | 说明 |
| --- | --- |
| `provider` | 对象存储提供商类型，S3 兼容存储统一填写 `S3` |
| `s3.endpoint` | S3 兼容存储的访问端点（不带协议前缀） |
| `s3.region` | 存储桶所在的区域 |
| `s3.access_key` | 访问密钥 AK |
| `s3.secret_key` | 访问密钥 SK |
| `use_path_style` | 是否使用 path style 访问方式，MinIO 等通常需要设为 `true` |
| `timeout` | 导入任务超时时间（秒） |

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

TVF 将 S3 兼容存储中的文件作为表来查询，可与 `INSERT INTO ... SELECT` 结合实现同步导入，适合即席分析与小批量数据加载。

### 第 1 步：准备数据

在 S3 兼容存储上创建 CSV 文件 `s3load_example.csv`，内容如下：

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

### 第 2 步：在 Doris 中创建目标表

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 第 3 步：通过 TVF 同步导入

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

关键参数说明：

| 参数 | 说明 |
| --- | --- |
| `uri` | 文件在 S3 兼容存储上的完整路径 |
| `format` | 文件格式，如 `csv`、`parquet`、`orc` 等 |
| `provider` | 对象存储提供商类型，S3 兼容存储统一填写 `S3` |
| `s3.endpoint` | S3 兼容存储的访问端点 |
| `s3.region` | 存储桶所在的区域 |
| `s3.access_key` | 访问密钥 AK |
| `s3.secret_key` | 访问密钥 SK |
| `column_separator` | 列分隔符 |
| `csv_schema` | CSV 文件的列定义，格式为 `字段名:类型` |
| `use_path_style` | 是否使用 path style 访问方式 |

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

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

### 1. 访问 MinIO 等存储时报错 bucket 不存在或无法解析？

S3 SDK 默认按 virtual-hosted style 拼接域名（如 `bucket.endpoint`），而 MinIO、Ceph 等通常使用 path style（如 `endpoint/bucket`）。在导入参数中添加 `"use_path_style" = "true"` 即可解决。

### 2. `s3.endpoint` 是否需要包含 `http://` 或 `https://` 前缀？

不需要。`s3.endpoint` 仅填写主机名和端口（如 `play.min.io:9000`）。

### 3. S3 Load 与 TVF 应该如何选择？

- 数据量大、希望异步执行并保留任务历史时，使用 **S3 Load**。
- 需要在一条 SQL 中读取 S3 文件并配合 `INSERT INTO ... SELECT` 同步写入时，使用 **TVF**。

### 4. 导入任务超时怎么办？

调大 S3 Load 的 `timeout` 属性（单位：秒），或将大文件拆分为多个小文件以提升并发度。
