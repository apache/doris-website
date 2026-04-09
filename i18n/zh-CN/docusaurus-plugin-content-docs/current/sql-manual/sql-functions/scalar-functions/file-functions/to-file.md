---
{
    "title": "TO_FILE",
    "language": "zh-CN",
    "description": "根据对象存储 URL 和凭证构造 FILE 类型的值，自动提取元数据并验证对象的可访问性。"
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

根据对象存储 URL 和认证凭证构造一个 [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) 类型的值。对于每条输入数据，该函数会：

1. 从 URL 中提取元数据（文件名、扩展名、MIME 内容类型）。
2. 通过向对象存储服务发送 HEAD 请求来验证对象是否存在且可访问。
3. 从存储服务获取实际文件大小。
4. 返回包含完整元数据的 FILE 值。

## 语法

```sql
TO_FILE(url, region, endpoint, ak, sk)
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| **url** | VARCHAR | 文件的完整对象存储 URL（如 `s3://bucket/path/file.csv`）。支持的 URI 协议：`s3://`、`oss://`、`cos://`、`obs://` |
| **region** | VARCHAR | 云存储区域（如 `us-east-1`、`cn-beijing`） |
| **endpoint** | VARCHAR | 对象存储服务端点 URL（如 `https://s3.us-east-1.amazonaws.com`）。如果缺少 `http://` 前缀会自动添加 |
| **ak** | VARCHAR | 认证访问密钥 |
| **sk** | VARCHAR | 认证密钥 |

## 返回值

返回一个 [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) 类型的值，包含以下元数据：

- `uri`：规范化的对象存储 URI
- `file_name`：从 URL 中提取的文件名
- `content_type`：根据文件扩展名自动检测的 MIME 类型
- `size`：实际文件大小（字节），从存储服务获取
- `region`：存储区域
- `endpoint`：规范化的端点 URL
- `ak`：访问密钥
- `sk`：密钥

如果任何输入参数为 NULL，则返回 NULL。

## 示例

### 基本用法

```sql
SELECT to_file(
    's3://my-bucket/data/report.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA',
    'wJalr'
);
```

```text
+--------------------------------------------------------------+
| to_file(...)                                                 |
+--------------------------------------------------------------+
| {"uri":"s3://my-bucket/data/report.csv","file_name":         |
|  "report.csv","content_type":"text/csv","size":1024000,      |
|  "region":"us-east-1","endpoint":"https://s3.us-east-1.      |
|  amazonaws.com","ak":"AKIA...","sk":"wJa...",                |
|  "role_arn":null,"external_id":null}                         |
+--------------------------------------------------------------+
```

### 使用 OSS 兼容存储

```sql
SELECT to_file(
    'oss://my-bucket/images/photo.jpg',
    'cn-beijing',
    'https://oss-cn-beijing.aliyuncs.com',
    'your_access_key',
    'your_secret_key'
);
```

:::tip
非 S3 的 URI 协议（`oss://`、`cos://`、`obs://`）在内部会自动规范化为 `s3://`，以兼容 S3 SDK。
:::

## 错误处理

该函数在以下情况会返回错误：

- **对象不可访问**：如果向存储服务发送的 HEAD 请求失败（例如对象不存在、权限不足），函数返回 `InvalidArgument` 错误，包含 URL 和存储服务的错误信息。

- **客户端创建失败**：如果无法为指定的端点创建 S3 客户端（例如无效的端点 URL），函数返回 `InternalError`。

```sql
-- 如果对象不存在，此操作将失败
SELECT to_file(
    's3://non-existent-bucket/file.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA...',
    'wJa...'
);
-- ERROR: to_file: object 's3://non-existent-bucket/file.csv' is not accessible: ...
```

## 注意事项

1. 该函数会为**每行**处理的数据向对象存储服务发送一个网络请求（HEAD）。处理大数据集时，这可能会影响性能。

2. 端点 URL 必须从 Doris BE 节点可访问。请确保网络连接和防火墙规则允许出站访问。

3. `content_type` 仅根据文件扩展名确定，不会检查实际文件内容。

4. 有关支持的 MIME 类型映射，请参阅 [FILE 类型文档](../../../basic-element/sql-data-types/semi-structured/FILE.md#支持的-mime-类型)。
