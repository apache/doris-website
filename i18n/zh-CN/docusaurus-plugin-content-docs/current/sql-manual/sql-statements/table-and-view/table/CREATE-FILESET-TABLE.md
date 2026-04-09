---
{
    "title": "CREATE FILESET TABLE",
    "language": "zh-CN",
    "description": "创建 Fileset 表，用于表示对象存储中的一组文件。每个 Fileset 表只有一个 FILE 类型的列，在查询时动态列举存储位置中的文件。"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

Fileset 表是一种虚拟表，用于表示存储在对象存储（S3、OSS、COS、OBS等）中的一组文件。它只有**一个 [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) 类型的列**，在查询时动态列举存储位置中的文件。

当查询 Fileset 表时，Doris 会列举指定存储位置中的文件，按给定模式过滤，并将结果生成为 FILE 类型的值 — 每个值包含文件的 URI、名称、内容类型、大小和存储凭证。

Fileset 表是**只读的** — 不支持 `INSERT`、`UPDATE` 和 `DELETE` 操作。文件列表在每次查询时动态生成。

## 语法

```sql
CREATE TABLE [IF NOT EXISTS] <table_name>
(
    <column_name> FILE NULL
)
ENGINE = fileset
PROPERTIES (
    'location' = '<storage_uri_with_pattern>',
    '<storage_property_key>' = '<storage_property_value>'
    [, ...]
);
```

## 参数

### 列定义

Fileset 表必须且只能有**一个** [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) 类型的列，不能定义其他列。

### PROPERTIES

#### 必需属性

| 属性 | 描述 |
|------|------|
| `location` | 包含文件匹配模式的存储 URI。格式：`scheme://bucket/path/pattern`。匹配模式为最后一个 `/` 之后的部分。 |

#### 位置匹配模式

文件匹配模式（最后一个 `/` 之后的部分）支持 POSIX fnmatch 通配符语法：

| 模式 | 描述 | 示例 |
|------|------|------|
| `*` | 匹配所有文件 | `s3://bucket/data/*` |
| `*.ext` | 按扩展名匹配 | `s3://bucket/images/*.jpg` |
| `prefix*` | 按前缀匹配 | `s3://bucket/logs/2024*` |
| `file.csv` | 精确匹配 | `s3://bucket/data/file.csv` |
| `data_[0-9]*` | 字符类匹配 | `s3://bucket/data/data_[0-9]*` |

#### 存储属性

存储属性取决于 URI 协议。常用的 S3 兼容属性如下：

| 属性 | 描述 |
|------|------|
| `s3.region` | 存储区域（如 `us-east-1`） |
| `s3.endpoint` | 服务端点 URL |
| `s3.access_key` | 认证访问密钥 |
| `s3.secret_key` | 认证密钥 |

##### 通过 IAM 角色认证

除了 access key / secret key 方式外，还可以通过 IAM 角色来认证：

| 属性 | 描述 |
|------|------|
| `s3.region` | 存储区域（如 `us-east-1`） |
| `s3.endpoint` | 服务端点 URL |
| `s3.role_arn` | 用于跨账户访问的 IAM 角色 ARN（如 `arn:aws:iam::123456789012:role/MyRole`） |
| `s3.external_id` | 角色信任策略中的外部 ID（可选） |

对于其他存储系统（OSS、COS、OBS），使用对应的属性前缀（如 `oss.region`、`cos.endpoint`）。

## 支持的存储系统

| URI 协议 | 存储系统 |
|----------|---------|
| `s3://` | Amazon S3 / S3 兼容存储 |
| `oss://` | 阿里云 OSS |
| `cos://` | 腾讯云 COS |
| `obs://` | 华为云 OBS |
| `hdfs://` | Apache HDFS |

## 示例

### 列举 S3 目录中的所有文件

```sql
CREATE TABLE s3_files (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/data/*',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);

SELECT * FROM s3_files;
```

### 仅列举 CSV 文件

```sql
CREATE TABLE csv_files (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/exports/*.csv',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);

SELECT * FROM csv_files;
```

### 列举 OSS 中的文件

```sql
CREATE TABLE oss_images (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 'oss://my-bucket/images/*.jpg',
    'oss.region' = 'cn-beijing',
    'oss.endpoint' = 'https://oss-cn-beijing.aliyuncs.com',
    'oss.access_key' = 'your_ak',
    'oss.secret_key' = 'your_sk'
);

SELECT * FROM oss_images;
```

### 匹配单个特定文件

```sql
CREATE TABLE single_file (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/config/settings.json',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);
```

### 通过 IAM 角色认证

```sql
CREATE TABLE role_files (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://cross-account-bucket/data/*',
    's3.region' = 'us-east-1',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.role_arn' = 'arn:aws:iam::123456789012:role/CrossAccountRole',
    's3.external_id' = 'my-external-id'
);
```

### 结合 AI 函数使用

Fileset 表与 AI 函数结合使用时非常强大。例如，可以对存储在对象存储中的图片计算向量嵌入：

```sql
-- 为图片创建 fileset 表
CREATE TABLE test_jpg (
    `file` FILE NULL
) ENGINE = fileset
PROPERTIES (
    'location' = 's3://my-bucket/images/*.jpg',
    's3.region' = 'cn-beijing',
    's3.endpoint' = 'https://oss-cn-beijing.aliyuncs.com',
    's3.access_key' = 'AKIA...',
    's3.secret_key' = 'wJa...'
);

-- 使用多模态嵌入模型计算图片的向量嵌入
SELECT array_size(embed("qwen_mul_embed", file)) FROM test_jpg;

```

## 执行模型

当查询 Fileset 表时：每个文件被生成为一个包含完整元数据的 FILE 类型值。

## 注意事项

1. Fileset 表是**动态的**：文件列表在每次查询时刷新。添加或删除存储位置中的文件会自动反映在查询结果中。

2. `location` 属性必须在最后一个 `/` 之后包含文件匹配模式。如果未指定模式（如 `s3://bucket/path/`），默认使用 `*`（匹配所有文件）。

3. 仅执行**平级目录列举** — 不会递归遍历子目录。

4. 每个 FILE 值包含表属性中指定的存储凭证（`ak`、`sk`）。共享查询结果时请确保采取适当的安全措施。

5. Fileset 表是内部表（不是外部 Catalog），在 Doris Internal Catalog 中创建和管理。
