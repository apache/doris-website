---
{
    "title": "文件路径模式",
    "language": "zh-CN",
    "description": "Doris 访问远程存储系统（如 S3、HDFS 和其他对象存储）中文件时支持的文件路径模式和通配符。"
}
---

## 描述

当访问远程存储系统（S3、HDFS 和其他 S3 兼容的对象存储）中的文件时，Doris 支持灵活的文件路径模式，包括通配符和范围表达式。本文档描述了支持的路径格式和模式匹配语法。

以下功能支持这些路径模式：
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- INSERT INTO SELECT（从 TVF 导入）

## 支持的 URI 格式

### S3 风格 URI

| 风格 | 格式 | 示例 |
|------|------|------|
| AWS Client 风格（Hadoop S3） | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| S3A 风格 | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| S3N 风格 | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| Virtual Host 风格 | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| Path 风格 | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### 其他云存储 URI

| 云服务商 | 协议 | 示例 |
|----------|------|------|
| 阿里云 OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| 腾讯云 COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| 百度云 BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| 华为云 OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### HDFS URI

| 风格 | 格式 | 示例 |
|------|------|------|
| 标准格式 | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| HA 模式 | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## 通配符模式

Doris 使用 glob 风格的模式匹配来匹配文件路径。支持以下通配符：

### 基本通配符

| 模式 | 说明 | 示例 | 匹配 |
|------|------|------|------|
| `*` | 匹配路径段内的零个或多个字符 | `*.csv` | `file.csv`、`data.csv`、`a.csv` |
| `?` | 匹配恰好一个字符 | `file?.csv` | `file1.csv`、`fileA.csv`，但不匹配 `file10.csv` |
| `[abc]` | 匹配括号内的任意单个字符 | `file[123].csv` | `file1.csv`、`file2.csv`、`file3.csv` |
| `[a-z]` | 匹配范围内的任意单个字符 | `file[a-c].csv` | `filea.csv`、`fileb.csv`、`filec.csv` |
| `[!abc]` | 匹配不在括号内的任意单个字符 | `file[!0-9].csv` | `filea.csv`、`fileb.csv`，但不匹配 `file1.csv` |

### 范围展开（花括号模式）

Doris 支持使用花括号模式 `{start..end}` 进行数字范围展开：

| 模式 | 展开结果 | 匹配 |
|------|----------|------|
| `{1..3}` | `{1,2,3}` | `1`、`2`、`3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`、`2`、`3`、`4`、`5`（前导零不会保留） |
| `{3..1}` | `{1,2,3}` | `1`、`2`、`3`（支持逆序范围） |
| `{a,b,c}` | `{a,b,c}` | `a`、`b`、`c`（枚举） |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | 混合范围和值 |

:::caution 注意
- Doris 尽量让能够导入的文件导入成功。花括号表达式中无效的部分会被静默跳过，有效部分仍会正常展开。例如，`file_{a..b,-1..3,4..5}` 会匹配到 `file_4` 和 `file_5`（无效的 `a..b` 和负数范围 `-1..3` 被跳过，但 `4..5` 正常展开）。
- 如果整个范围包含负数（如 `{-1..2}`），该范围会被跳过。如果与有效范围混用（如 `{-1..2,1..3}`），只有有效范围 `1..3` 会被展开。
- 使用逗号与范围混用时，只允许添加数字。例如 `{1..4,a}` 中，非数字的 `a` 会被忽略，结果为 `{1,2,3,4}`。
- 纯枚举模式如 `{a,b,c}`（不含 `..` 范围）会直接传递给 glob 匹配，可以正常工作。
:::

### 组合模式

可以在单个路径中组合多个模式：

```
s3://bucket/data_{1..3}/file_*.csv
```

这将匹配：
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- 等等

## 示例

### S3 TVF 示例

**匹配目录中的所有 CSV 文件：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**使用数字范围匹配文件：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**匹配日期分区目录中的文件：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

:::caution 零填充目录
对于零填充的目录名如 `month=01`、`month=02`，请使用通配符（`*`）而不是范围模式。模式 `{01..12}` 会展开为 `{1,2,...,12}`，无法匹配 `month=01`。
:::

**匹配编号的文件分片（如 Spark 输出）：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/output/part-{00000..00099}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

### Broker Load 示例

**加载匹配模式的所有 CSV 文件：**

```sql
LOAD LABEL db.label_wildcard
(
    DATA INFILE("s3://my-bucket/data/file_*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**使用数字范围展开加载文件：**

```sql
LOAD LABEL db.label_range
(
    DATA INFILE("s3://my-bucket/exports/data_{1..5}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**从 HDFS 加载，使用通配符：**

```sql
LOAD LABEL db.label_hdfs_wildcard
(
    DATA INFILE("hdfs://namenode:8020/user/data/2024-*/*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

**从 HDFS 加载，使用数字范围：**

```sql
LOAD LABEL db.label_hdfs_range
(
    DATA INFILE("hdfs://namenode:8020/data/file_{1..3,5,7..9}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```

### INSERT INTO SELECT 示例

**使用通配符从 S3 插入数据：**

```sql
INSERT INTO my_table (col1, col2, col3)
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/part-*.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

## 性能优化建议

### 使用具体的前缀

Doris 会从路径模式中提取最长的非通配符前缀，以优化 S3/HDFS 的列表操作。更具体的前缀可以加快文件发现速度。

```sql
-- 推荐：具体的前缀减少列表范围
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- 不推荐：在早期路径段使用广泛的通配符
"uri" = "s3://bucket/data/**/file.csv"
```

### 对已知序列优先使用范围模式

当您知道确切的文件编号时，使用范围模式而不是通配符：

```sql
-- 更好：显式范围
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- 较差：通配符匹配未知文件
"uri" = "s3://bucket/data/part-*.csv"
```

### 避免深层递归通配符

深层递归模式如 `**` 可能导致大型存储桶上的文件列表速度变慢：

```sql
-- 尽量避免
"uri" = "s3://bucket/**/*.csv"

-- 优先使用显式路径结构
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```

## 故障排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 未找到文件 | 模式不匹配任何文件 | 验证路径和模式语法；先用单个文件测试 |
| 文件列表缓慢 | 通配符范围太广或文件太多 | 使用更具体的前缀；限制通配符范围 |
| URI 无效错误 | 路径语法格式错误 | 检查 URI 协议和存储桶名称格式 |
| 访问被拒绝 | 凭证或权限问题 | 验证 S3/HDFS 凭证和存储桶策略 |

### 测试路径模式

在运行大型加载作业之前，先用有限的查询测试您的模式：

```sql
-- 测试文件是否存在并匹配模式
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```

使用 `DESC FUNCTION` 验证匹配文件的 schema：

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
