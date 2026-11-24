---
{
    "title": "Avro 导入 | 文件格式",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 开发版通过 Stream Load、Broker Load 和 TVF 导入 Avro 对象容器文件的方法，包含建表准备、完整命令、预期结果、压缩算法及文件格式限制，帮助选择适合的导入方式。",
    "sidebar_label": "Avro",
    "keywords": ["Avro 导入", "Avro Stream Load", "Avro Broker Load", "Avro TVF", "Avro OCF"],
    "doc_type": "feature"
}
---

# Avro

## 概述

Doris 支持导入完整的 Avro 对象容器文件（OCF）。本文要求使用 [Avro 文件格式](../../../lakehouse/file-formats/avro.md) 所述的开发版原生 Avro 能力，包括升级后的 FE/BE 节点和 FileScannerV2。以下文件导入示例不支持原始 Avro 消息。

| 方式 | 使用场景 |
| --- | --- |
| [Stream Load](../import-way/stream-load-manual.md) | 通过 HTTP 上传本地完整 Avro 文件。 |
| [Broker Load](../import-way/broker-load-manual.md) | 从对象存储或 HDFS 异步导入 Avro 文件。 |
| 使用 TVF 的 [INSERT INTO SELECT](../import-way/insert-into-manual.md) | 先查询、过滤或转换 Avro 文件内容，再写入目标表。 |
| 部署环境已提供的 COPY INTO | 通过 `"file.type" = "avro"` 从已配置的 Stage 导入完整 OCF 文件。 |

## 快速开始

使用 [Avro 文件格式](../../../lakehouse/file-formats/avro.md#快速开始) 中的 Python 示例生成 `example.avro`。文件包含字段 `id`、`label`，以及两条记录 `(1, 'alpha')` 和 `(2, NULL)`。

使用具备建库、建表和导入权限的账号执行：

```sql
CREATE DATABASE IF NOT EXISTS avro_example;

CREATE TABLE avro_example.example_table (
    id BIGINT,
    label STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

替换凭据和 FE 地址后上传文件：

```shell
curl --location-trusted -u '<user>:<password>' \
    -H 'Expect: 100-continue' \
    -H 'format: avro' \
    -H 'columns: id,label' \
    -T example.avro \
    'http://<fe-host>:<http-port>/api/avro_example/example_table/_stream_load'
```

检查返回结果包含 `Status: Success`、`NumberLoadedRows: 2` 和 `NumberFilteredRows: 0`，然后验证已写入的数据：

```sql
SELECT id, label FROM avro_example.example_table ORDER BY id;
```

```text
+----+-------+
| id | label |
+----+-------+
|  1 | alpha |
|  2 | NULL  |
+----+-------+
```

## 参数

| 入口 | 配置 | 类型 | 默认值 | 是否必需 | 作用 |
| --- | --- | --- | --- | --- | --- |
| Stream Load | `format: avro` | HTTP 请求头 | `csv` | 本例必需 | 将上传的完整文件按 Avro 解析。 |
| Broker Load | `FORMAT AS "avro"` | SQL 子句 | 省略时根据文件后缀推导 | 本例显式指定 | 选择 Avro 解码。 |
| TVF | `"format" = "avro"` | 字符串参数 | 不会默认选择 Avro | 是 | 为查询或插入推导文件 Schema。 |
| COPY INTO | `"file.type" = "avro"` | 字符串参数 | 未设置 | 显式选择 Avro 时指定 | 要求部署环境支持 COPY INTO，且已有配置好的 Stage。 |

压缩算法从 OCF 文件头自动选择，支持 `null`、`deflate`、`snappy` 和 `zstandard`；不要再使用其他压缩格式包装整个文件。存储凭据、列映射、错误过滤和事务选项沿用所选导入方式的规则。

## 示例

以下示例均从空目标表开始。若已执行快速开始示例，请在尝试另一种方式前清空表，避免产生重复行。

### 从 S3 执行 Broker Load

将同一 `example.avro` 上传到 Doris 可访问的 S3 兼容存储，并替换存储配置：

```sql
TRUNCATE TABLE avro_example.example_table;

LOAD LABEL avro_example.avro_broker_example
(
    DATA INFILE("s3://example-bucket/avro/example.avro")
    INTO TABLE example_table
    FORMAT AS "avro"
    (id, label)
)
WITH S3
(
    "AWS_ENDPOINT" = "https://s3.example.com",
    "AWS_ACCESS_KEY" = "<access-key>",
    "AWS_SECRET_KEY" = "<secret-key>",
    "AWS_REGION" = "us-east-1"
);

SHOW LOAD FROM avro_example WHERE LABEL = 'avro_broker_example';
```

等待 `State` 变为 `FINISHED` 后，执行快速开始中的验证查询，结果为相同的两行。再次提交任务时须使用新的导入 Label。HDFS 连接配置及其他选项请参阅 [Broker Load](../import-way/broker-load-manual.md)。

### 从 S3 TVF 执行 INSERT INTO SELECT

```sql
TRUNCATE TABLE avro_example.example_table;

INSERT INTO avro_example.example_table
SELECT id, label
FROM S3(
    "uri" = "s3://example-bucket/avro/example.avro",
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>",
    "format" = "avro"
);
```

插入成功后，验证查询应返回相同的两行。文件位于 HDFS 时可改用 [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs.md)。也可在 `SELECT` 中使用 `WHERE` 或表达式，先过滤或转换再插入。

## 限制

* 普通 Stream Load 接收完整上传的 Avro 文件，不支持实时 `http_stream` 输入；本能力也不会为 Routine Load 增加 Avro 解码。
* 仍不支持写出 Avro。将 Avro 导入 Doris 内表，不意味着 OUTFILE、EXPORT 或 Catalog 写入可以输出 Avro。
* 根类型须为 Record。不支持递归 Schema、多值 Union、表示绝对时间点的 `timestamp-nanos`、忽略大小写后存在歧义的字段名，以及嵌套空 Record。参阅 [Avro 类型映射与限制](../../../lakehouse/file-formats/avro.md#限制)。
* 原始 Kafka/Confluent Avro 消息须使用合适的连接器及反序列化器，例如 [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md)，不能直接套用这些 OCF 文件导入示例。
* 同时检查导入状态和过滤行数。仅 HTTP 请求成功，不能证明所有记录均已导入。

## 最佳实践

客户端已有完整文件时可使用 Stream Load；异步导入远端批量文件时使用 Broker Load；需要 SQL 转换时使用 TVF 插入。先查询有代表性的文件，再选择兼容的目标列类型，尤其注意二进制、Decimal、时间戳和嵌套类型。
