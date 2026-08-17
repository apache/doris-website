---
{
    "title": "CREATE FILESET TABLE",
    "language": "en",
    "description": "Create a Fileset Table that represents a set of files in object storage. Each Fileset Table has exactly one column of FILE type and dynamically lists files from a storage location at query time."
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

## Description

A Fileset Table is a virtual table that represents a set of files stored in object storage (S3, OSS, COS, OBS, HDFS, etc.). It has exactly **one column of [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) type** and dynamically lists files from a storage location at query time.

When queried, Doris lists the files in the specified storage location, filters them by the given pattern, and materializes the results as FILE type values — each containing the file's URI, name, content type, size, and storage credentials.

Fileset Tables are **read-only** — `INSERT`, `UPDATE`, and `DELETE` operations are not supported. The file list is dynamically generated on every query.

## Syntax

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

## Parameters

### Column Definition

A Fileset Table must have exactly **one column** of [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) type. No other columns can be defined.

### PROPERTIES

#### Required Properties

| Property | Description |
|----------|-------------|
| `location` | The storage URI including a file pattern. Format: `scheme://bucket/path/pattern`. The pattern is everything after the last `/`. |

#### Location Pattern

The file pattern (after the last `/`) supports POSIX fnmatch glob syntax:

| Pattern | Description | Example |
|---------|-------------|---------|
| `*` | Match all files | `s3://bucket/data/*` |
| `*.ext` | Match by extension | `s3://bucket/images/*.jpg` |
| `prefix*` | Match by prefix | `s3://bucket/logs/2024*` |
| `file.csv` | Exact match | `s3://bucket/data/file.csv` |
| `data_[0-9]*` | Character class | `s3://bucket/data/data_[0-9]*` |

#### Storage Properties

Storage properties depend on the URI scheme. Common S3-compatible properties:

| Property | Description |
|----------|-------------|
| `s3.region` | Storage region (e.g., `us-east-1`) |
| `s3.endpoint` | Service endpoint URL |
| `s3.access_key` | Access key for authentication |
| `s3.secret_key` | Secret key for authentication |

##### Authentication via IAM Role

As an alternative to access key / secret key, you can authenticate using IAM Role assumption:

| Property | Description |
|----------|-------------|
| `s3.region` | Storage region (e.g., `us-east-1`) |
| `s3.endpoint` | Service endpoint URL |
| `s3.role_arn` | IAM role ARN for cross-account access (e.g., `arn:aws:iam::123456789012:role/MyRole`) |
| `s3.external_id` | External ID for role trust policy (optional) |

For other storage systems (OSS, COS, OBS), use corresponding property prefixes (e.g., `oss.region`, `cos.endpoint`).

## Supported Storage Systems

| URI Scheme | Storage System |
|------------|---------------|
| `s3://` | Amazon S3 / S3-compatible |
| `oss://` | Alibaba Cloud OSS |
| `cos://` | Tencent Cloud COS |
| `obs://` | Huawei Cloud OBS |
| `hdfs://` | Apache HDFS |

## Examples

### List all files in an S3 directory

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

### List only CSV files

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

### List files in OSS

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

### Match a single specific file

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

### Authenticate using IAM Role

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

### Use with AI functions

Fileset Tables are particularly powerful when combined with AI functions. For example, you can compute embeddings for images stored in object storage:

```sql
-- Create a fileset table for images
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

-- Compute image embeddings using a multimodal embedding model
SELECT array_size(embed("qwen_mul_embed", file)) FROM test_jpg;

```

## Execution Model

When a Fileset Table is queried: Each file is materialized as a FILE type value containing the complete metadata.

## Notes

1. Fileset Tables are **dynamic**: the file list is refreshed on every query. Adding or removing files from the storage location is reflected automatically.

2. The `location` property must contain a file pattern after the last `/`. If no pattern is specified (e.g., `s3://bucket/path/`), it defaults to `*` (match all files).

3. Only **flat directory listing** is performed — subdirectories are not traversed recursively.

4. Each FILE value includes the storage credentials (`ak`, `sk`) specified in the table properties. Ensure appropriate security measures when sharing query results.

5. Fileset Tables are internal tables (not external catalogs). They are created and managed within the Doris internal catalog.
