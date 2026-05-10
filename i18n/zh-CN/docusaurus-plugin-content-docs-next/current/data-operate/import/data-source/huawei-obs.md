---
{
    "title": "华为云 OBS",
    "language": "zh-CN",
    "description": "通过 S3 Load 异步导入或 TVF 同步导入，将华为云 OBS 上的 CSV/Parquet 等文件高效加载到 Apache Doris。",
    "keywords": [
        "华为云 OBS",
        "Huawei Cloud OBS",
        "Doris 导入 OBS",
        "S3 Load OBS",
        "TVF S3",
        "对象存储导入",
        "OBS Endpoint",
        "obs.cn-north-1.myhuaweicloud.com"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 将华为云 OBS 上的数据文件导入 Apache Doris -->

Apache Doris 支持直接从华为云对象存储 OBS（Object Storage Service）导入数据文件，常用于离线数据迁移、历史数据回灌、数据湖文件入仓等场景。本文以 CSV 文件为例，说明两种导入方式的完整步骤。

## 方案选型

Doris 提供两种从华为云 OBS 导入文件的方式，可根据数据规模与时效性需求选择：

| 导入方式 | 类型 | 适用场景 | 参考文档 |
|---------|------|---------|---------|
| **S3 Load** | 异步导入 | 大批量数据导入，作业可后台执行、断点重试 | [Broker Load 手册](../import-way/broker-load-manual.md) |
| **TVF（Table Value Function）** | 同步导入 | 中小规模数据、即席查询、与 `INSERT INTO ... SELECT` 配合使用 | 本文 [使用 TVF 导入](#使用-tvf-导入) |

> 说明：两种方式均通过 S3 协议访问 OBS，需要使用 OBS 提供的 Endpoint、Region、Access Key 与 Secret Key。

## 前置准备

在开始导入前，请确认以下信息已准备就绪：

- 一个可访问的华为云 OBS 桶（Bucket），并已上传待导入的数据文件。
- OBS 的 **Endpoint**（如 `obs.cn-north-1.myhuaweicloud.com`）与对应的 **Region**（如 `cn-north-1`）。
- 具有读取该 Bucket 权限的 **Access Key（AK）** 与 **Secret Key（SK）**。
- 已部署的 Apache Doris 集群，且当前用户具有目标库表的 `LOAD_PRIV` 权限。

## 使用 S3 Load 导入

S3 Load 是异步导入方式，提交作业后由 Doris 后台调度执行，适合大数据量场景。详细参数与状态查询可参考 [Broker Load 手册](../import-way/broker-load-manual.md)。

### 第 1 步：准备数据

将 CSV 文件 `s3load_example.csv` 上传到华为云 OBS，文件内容如下：

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

在 Doris 中创建与文件结构对应的目标表：

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

提交 S3 Load 作业，将 OBS 上的 CSV 文件导入目标表：

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
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
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
| `DATA INFILE` | OBS 文件路径，使用 `s3://` 协议前缀 |
| `provider` | 必须固定为 `OBS`，标识对象存储类型为华为云 |
| `s3.endpoint` | OBS 服务的 Endpoint，按 Bucket 所在区域填写 |
| `s3.region` | OBS Bucket 所在 Region |
| `s3.access_key` / `s3.secret_key` | 用于鉴权的 AK/SK |
| `timeout` | 作业超时时间，单位秒 |

### 第 4 步：检查导入数据

导入完成后查询目标表，验证数据是否正确写入：

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

## 使用 TVF 导入

TVF（Table Value Function）将 OBS 上的文件作为表函数返回的虚拟表，可直接使用 `INSERT INTO ... SELECT` 完成同步导入，便于与 SQL 表达式结合做轻量 ETL。

### 第 1 步：准备数据

将与 S3 Load 相同的 CSV 文件 `s3load_example.csv` 上传到 OBS：

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

通过 `S3` 表函数读取 OBS 文件，并使用 `INSERT INTO ... SELECT` 写入目标表：

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `uri` | OBS 文件 URI，使用 `s3://` 协议前缀 |
| `format` | 文件格式，CSV 文件填写 `csv` |
| `provider` | 必须固定为 `OBS` |
| `s3.endpoint` / `s3.region` | OBS Endpoint 与 Region |
| `s3.access_key` / `s3.secret_key` | OBS 鉴权所需的 AK/SK |
| `column_separator` | 字段分隔符，CSV 默认 `,` |
| `csv_schema` | CSV 列类型定义，格式为 `列名:类型;列名:类型;...` |

### 第 4 步：检查导入数据

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

## FAQ

**Q1：S3 Load 与 TVF 应该如何选择？**

- 数据量大、希望异步执行并支持失败重试 → 选择 **S3 Load**。
- 数据量较小、希望立即返回结果，或需要在导入时配合 SQL 表达式做轻量转换 → 选择 **TVF**。

**Q2：`provider` 参数为什么必须填写 `OBS`？**

`provider` 用于标识底层对象存储的厂商类型。华为云 OBS 虽然兼容 S3 协议，但在签名等细节上有差异，需要显式声明为 `OBS`，Doris 才能使用对应的访问适配。

**Q3：如何查找 OBS 的 Endpoint 和 Region？**

可以在华为云 OBS 控制台的 Bucket 概览页面查看，常见 Endpoint 形如 `obs.<region>.myhuaweicloud.com`，例如 `cn-north-1` 区域对应 `obs.cn-north-1.myhuaweicloud.com`。

**Q4：除了 CSV，还支持哪些文件格式？**

S3 Load 与 TVF 均支持常见的 `csv`、`parquet`、`orc`、`json` 等格式，通过 `FORMAT AS` 或 `format` 参数指定。

## Troubleshooting

| 现象 | 可能原因 | 处理建议 |
|------|---------|---------|
| 报错 `Access Denied` 或 `403` | AK/SK 错误，或账号无该 Bucket 的读取权限 | 在华为云控制台核对 AK/SK，并为账号授予 OBS 桶的读取权限 |
| 报错 `endpoint is invalid` | Endpoint 拼写错误或区域不匹配 | 确认 Bucket 所在 Region，使用对应区域的 Endpoint |
| 导入作业卡在 `PENDING` 状态 | 集群繁忙或导入并发受限 | 通过 `SHOW LOAD` 查看作业状态，必要时调整并发或等待资源释放 |
| TVF 报错列数或类型不匹配 | `csv_schema` 与文件实际列结构不一致 | 核对文件列顺序、列数及数据类型，重新填写 `csv_schema` |
| 导入超时 | 文件较大，默认 `timeout` 不足 | 增大 `PROPERTIES` 中的 `timeout`（单位：秒） |

## 相关文档

- [Broker Load 手册](../import-way/broker-load-manual.md)
