---
{
    "title": "FILE | Semi Structured",
    "language": "zh-CN",
    "description": "FILE 类型是一种语义化的数据类型，用于表示对象存储中的文件元数据，使 Doris 能够原生感知和管理文件引用。",
    "sidebar_label": "FILE"
}
---

# FILE

## 概述

FILE 类型是一种语义化的数据类型，用于表示对象存储中的文件元数据。它将描述远程文件的固定结构（URI、文件名、内容类型、大小、凭证等）。

FILE 类型设计用于与 [Fileset 表](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md)引擎和 [`TO_FILE`](../../../sql-functions/scalar-functions/file-functions/to-file.md) 函数配合使用，使 Doris 能够管理、查询和处理 S3、OSS、COS、OBS等对象存储系统中的文件。

## 内部结构

每个 FILE 值都是一个包含以下固定字段的 JSONB 对象：

| 字段 | 类型 | 可空 | 描述 |
|------|------|------|------|
| `uri` | VARCHAR(4096) | 否 | 规范化的对象存储 URI（如 `s3://bucket/path/file.csv`） |
| `file_name` | VARCHAR(512) | 否 | 从 URI 中提取的文件名 |
| `content_type` | VARCHAR(128) | 否 | 根据文件扩展名自动检测的 MIME 类型 |
| `size` | BIGINT | 否 | 文件大小（字节） |
| `region` | VARCHAR(64) | 是 | 云存储区域（如 `us-east-1`） |
| `endpoint` | VARCHAR(256) | 是 | 对象存储服务端点 URL |
| `ak` | VARCHAR(256) | 是 | S3 兼容存储的访问密钥 |
| `sk` | VARCHAR(256) | 是 | S3 兼容存储的密钥 |
| `role_arn` | VARCHAR(256) | 是 | AWS IAM 角色 ARN，用于跨账户访问 |
| `external_id` | VARCHAR(256) | 是 | 角色信任关系中的外部 ID |

## 类型约束

- FILE 类型**只能**在 [Fileset 表](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md)（`ENGINE = fileset` 的表）中使用，**不能**在常规 OLAP 表或其他表引擎中作为列使用。
- Fileset 表是**只读的**，**不支持** `INSERT`、`UPDATE` 和 `DELETE` 操作。FILE 值在查询时由 Fileset 引擎自动生成。
- FILE 类型列**不支持**以下操作：
  - `ORDER BY`
  - `GROUP BY`
  - `DISTINCT`
  - 聚合函数（`MIN`、`MAX`、`COUNT`、`SUM` 等）
  - `JOIN` 等值条件
  - 窗口函数的 `PARTITION BY` / `ORDER BY`
  - 创建索引
- FILE 类型必须与特定函数（如 `TO_FILE` 或 `AI 函数`）配合使用，或在 Fileset 表的场景中使用。

## 构造 FILE 值

### 使用 Fileset 表（主要方式）

[Fileset 表](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md)通过列举对象存储位置中的文件来自动生成 FILE 值。这是使用 FILE 值的主要方式：

```sql
CREATE TABLE my_files (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/data/*',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);

SELECT * FROM my_files;
```

### 使用 TO_FILE 函数

使用 [`TO_FILE`](../../../sql-functions/scalar-functions/file-functions/to-file.md) 函数在查询表达式中构造 FILE 值。适用于验证单个文件引用或内联构造场景：

```sql
SELECT to_file(
    's3://my-bucket/data/file.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA...',
    'wJa...'
) AS file_obj;
```

:::caution 注意
`to_file` 函数构造的 FILE 值仅用于查询时使用。由于 Fileset 表是只读的，不能将 `to_file` 构造的 FILE 值通过 INSERT 插入到 Fileset 表中。
:::

## 支持的 MIME 类型

FILE 类型根据文件扩展名自动检测 MIME 内容类型。支持的映射关系如下：

| 扩展名 | 内容类型 |
|--------|---------|
| `.csv` | `text/csv` |
| `.json` | `application/json` |
| `.jsonl` | `application/x-ndjson` |
| `.parquet` | `application/x-parquet` |
| `.orc` | `application/x-orc` |
| `.avro` | `application/avro` |
| `.txt`、`.log`、`.tbl` | `text/plain` |
| `.xml` | `application/xml` |
| `.html`、`.htm` | `text/html` |
| `.pdf` | `application/pdf` |
| `.jpg`、`.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.mp3` | `audio/mpeg` |
| `.mp4` | `video/mp4` |
| `.gz` | `application/gzip` |
| `.bz2` | `application/x-bzip2` |
| `.zst` | `application/zstd` |
| `.lz4` | `application/x-lz4` |
| `.zip` | `application/zip` |
| `.tar` | `application/x-tar` |
| 其他 | `application/octet-stream` |

## 注意事项

1. FILE 类型的值在内部以 JSONB 二进制格式存储，每个值的物理存储大小取决于元数据内容（通常为 200–400 字节）。

2. FILE 类型支持的 URI 协议包括 `s3://`、`oss://`、`cos://`、`obs://` 和 `hdfs://`。非 S3 协议（`oss://`、`cos://`、`obs://`）在内部会被规范化为 `s3://` 以保证兼容性。

3. `to_file` 函数通过向对象存储服务发送 HEAD 请求来验证对象是否存在，确保引用的文件在构造 FILE 值之前是可访问的。

## 结合 AI 函数使用

FILE 类型旨在与 Doris 的 AI 函数集成，实现多模态数据处理。示例：

```sql
-- 计算图片的向量嵌入
SELECT array_size(embed("qwen_mul_embed", file)) FROM my_fileset_table;

```
