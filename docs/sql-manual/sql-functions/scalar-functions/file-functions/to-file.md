---
{
    "title": "TO_FILE",
    "language": "en",
    "description": "Constructs a FILE type value from object storage URL and credentials, with automatic metadata extraction and object validation."
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

Constructs a [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) type value from an object storage URL and authentication credentials. This function is designed for query-time use — for example, to validate file accessibility or construct FILE values as part of query expressions.

:::caution Note
FILE type can only be used in [Fileset Tables](../../../sql-statements/table-and-view/table/CREATE-FILESET-TABLE.md) (ENGINE = fileset). You cannot INSERT `to_file()` results into regular OLAP tables. For bulk file listing, use a Fileset Table instead.
:::

For each input, the function:

1. Extracts metadata from the URL (file name, extension, MIME content type).
2. Validates that the object exists and is accessible via a HEAD request to the object storage service.
3. Retrieves the actual file size from the storage service.
4. Returns a FILE value containing the complete metadata.

## Syntax

```sql
TO_FILE(url, region, endpoint, ak, sk)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **url** | VARCHAR | The full object storage URL of the file (e.g., `s3://bucket/path/file.csv`). Supported URI schemes: `s3://`, `oss://`, `cos://`, `obs://` |
| **region** | VARCHAR | The cloud storage region (e.g., `us-east-1`, `cn-beijing`) |
| **endpoint** | VARCHAR | The object storage service endpoint URL (e.g., `https://s3.us-east-1.amazonaws.com`). The `http://` prefix will be added automatically if missing |
| **ak** | VARCHAR | The access key for authentication |
| **sk** | VARCHAR | The secret key for authentication |

## Return Value

Returns a value of [FILE](../../../basic-element/sql-data-types/semi-structured/FILE.md) type containing the following metadata:

- `uri`: Normalized object storage URI
- `file_name`: File name extracted from URL
- `content_type`: MIME type auto-detected from file extension
- `size`: Actual file size in bytes (retrieved from storage service)
- `region`: Storage region
- `endpoint`: Normalized endpoint URL
- `ak`: Access key
- `sk`: Secret key

Returns NULL if any input parameter is NULL (propagates nullability).

## Examples

### Basic usage

```sql
SELECT to_file(
    's3://my-bucket/data/report.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA',
    'wJalrXUtnFE'
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

### Using with OSS-compatible storage

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
Non-S3 URI schemes (`oss://`, `cos://`, `obs://`) are automatically normalized to `s3://` internally for S3 SDK compatibility.
:::

## Error Handling

The function returns an error in the following cases:

- **Object not accessible**: If the HEAD request to the storage service fails (e.g., object does not exist, insufficient permissions), the function returns an `InvalidArgument` error with details about the URL and the storage service error message.

- **Client creation failure**: If the S3 client cannot be created for the given endpoint (e.g., invalid endpoint URL), the function returns an `InternalError`.

```sql
-- This will fail if the object does not exist
SELECT to_file(
    's3://non-existent-bucket/file.csv',
    'us-east-1',
    'https://s3.us-east-1.amazonaws.com',
    'AKIA...',
    'wJa...'
);
-- ERROR: to_file: object 's3://non-existent-bucket/file.csv' is not accessible: ...
```

## Notes

1. The function makes a network request (HEAD) to the object storage service for **each row** processed. When processing large datasets, this may impact performance.

2. The endpoint URL must be accessible from the Doris BE nodes. Ensure network connectivity and firewall rules allow outbound access.

3. The `content_type` is determined by the file extension only. It does not inspect the actual file content.

4. For supported MIME type mappings, see the [FILE type documentation](../../../basic-element/sql-data-types/semi-structured/FILE.md#supported-mime-types).
