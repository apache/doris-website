---
{
    "title": "腾讯云 COS",
    "language": "zh-CN",
    "description": "如何将腾讯云 COS 数据导入 Apache Doris：S3 Load 异步导入与 TVF 同步导入两种方案的完整步骤与示例。",
    "keywords": [
        "腾讯云 COS",
        "Tencent COS",
        "S3 Load",
        "TVF",
        "对象存储导入",
        "Doris 导入",
        "COS 导入 Doris",
        "S3 协议"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 将腾讯云 COS 上的数据文件导入到 Apache Doris -->

Apache Doris 通过兼容 S3 协议的方式访问腾讯云对象存储 COS，支持以下两种导入模式，可根据数据规模和实时性要求选择合适方案。

## 方案选型

| 导入方式 | 模式 | 适用场景 | 参考手册 |
| --- | --- | --- | --- |
| S3 Load | 异步 | 离线、大批量数据导入；导入任务可后台运行并查看状态 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| TVF（Table Value Function） | 同步 | 即时查询或小批量导入；通过 `INSERT INTO ... SELECT` 直接读取 COS 文件 | - |

## 准备工作

在执行导入前，请准备好以下信息：

- 腾讯云 COS 的 Bucket 名称及对象路径（例如 `s3://your_bucket_name/s3load_example.csv`）
- COS 对应的 Endpoint（如 `cos.ap-beijing.myqcloud.com`）和 Region（如 `ap-beijing`）
- 具有访问该 Bucket 权限的 AccessKey（`access_key`）和 SecretKey（`secret_key`）
- 一个可正常访问的 Apache Doris 集群

本文示例统一使用以下 CSV 数据文件 `s3load_example.csv`：

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

以及如下目标表 `test_s3load`：

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

## 方式一：使用 S3 Load 异步导入

S3 Load 是一种异步导入方式，适合离线或大数据量场景。详细机制可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

将上文中的 `s3load_example.csv` 上传到腾讯云 COS 的指定 Bucket 中。

### 第 2 步：在 Doris 中创建表

执行 [准备工作](#准备工作) 中的 `CREATE TABLE` 语句创建目标表 `test_s3load`。

### 第 3 步：提交 S3 Load 导入任务

使用如下 SQL 提交导入任务，将 `<your-ak>`、`<your-sk>` 替换为实际凭据，`your_bucket_name` 替换为实际 Bucket 名称：

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
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_s3load;
```

返回结果示例：

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

## 方式二：使用 TVF 同步导入

TVF（Table Value Function）通过 `S3` 函数将 COS 文件作为表来读取，配合 `INSERT INTO ... SELECT` 完成同步导入，适合小批量或即时查询场景。

### 第 1 步：准备数据

将上文中的 `s3load_example.csv` 上传到腾讯云 COS 的指定 Bucket 中。

### 第 2 步：在 Doris 中创建表

执行 [准备工作](#准备工作) 中的 `CREATE TABLE` 语句创建目标表 `test_s3load`。

### 第 3 步：使用 TVF 导入数据

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

### 第 4 步：检查导入结果

```sql
SELECT * FROM test_s3load;
```

返回结果示例：

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

下表列出导入腾讯云 COS 数据时常用的参数：

| 参数 | 说明 | 示例值 |
| --- | --- | --- |
| `provider` | 对象存储提供方，腾讯云 COS 固定为 `COS` | `COS` |
| `s3.endpoint` | COS Endpoint，与 Bucket 所在地域对应 | `cos.ap-beijing.myqcloud.com` |
| `s3.region` | COS Region | `ap-beijing` |
| `s3.access_key` | 腾讯云访问密钥 ID | `<your-ak>` |
| `s3.secret_key` | 腾讯云访问密钥 Secret | `<your-sk>` |
| `uri` / `DATA INFILE` | COS 文件路径，统一使用 `s3://` 前缀 | `s3://your_bucket_name/s3load_example.csv` |
| `format` / `FORMAT AS` | 文件格式（CSV、Parquet、ORC 等） | `csv` |
| `column_separator` / `COLUMNS TERMINATED BY` | 列分隔符 | `,` |
| `csv_schema` | TVF 模式下声明 CSV 列结构 | `user_id:int;name:string;age:int` |
| `timeout` | S3 Load 任务超时时间（秒） | `3600` |

## 常见问题（FAQ）

<!-- 知识类型: 故障排查 -->

**Q1：S3 Load 与 TVF 导入应该如何选择？**

- 大数据量、可后台异步执行：选择 **S3 Load**。
- 小数据量、需要立即获取结果，或需要在 SELECT 查询中使用 COS 文件：选择 **TVF**。

**Q2：`s3.endpoint` 应该如何获取？**

根据 Bucket 所在地域填写对应的 COS 公网/内网域名，例如北京区为 `cos.ap-beijing.myqcloud.com`，上海区为 `cos.ap-shanghai.myqcloud.com`，详见腾讯云 COS 官方文档。

**Q3：URI 必须以 `s3://` 开头吗？**

是的。Doris 通过 S3 协议访问 COS，无论是 S3 Load 的 `DATA INFILE` 还是 TVF 的 `uri`，都需要使用 `s3://bucket_name/path` 格式。

**Q4：导入返回结果的行序为什么和源文件不一致？**

Doris 表为分布式表，数据按分桶键 `HASH(user_id)` 分布到多个 Tablet 中，`SELECT *` 不保证返回顺序。如需顺序输出，请显式使用 `ORDER BY`。

**Q5：导入失败如何排查？**

- 检查 `access_key` / `secret_key` 是否具备目标 Bucket 的读取权限。
- 确认 `s3.endpoint` 与 `s3.region` 与 Bucket 所在地域一致。
- 对 S3 Load 任务执行 `SHOW LOAD WHERE LABEL = 's3_load_2022_04_01';` 查看错误详情。
