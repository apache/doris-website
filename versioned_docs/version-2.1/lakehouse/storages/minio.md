---
{
    "title": "MinIO | Storages",
    "language": "en",
    "description": "This document describes the parameters required to access MinIO, which apply to the following scenarios:",
    "sidebar_label": "MinIO"
}
---

# MinIO

This document describes the parameters required to access MinIO, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access MinIO through S3-compatible protocol.**

## Parameter Overview

| Property Name                  | Legacy Name              | Description                                                  | Default Value | Required |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| minio.endpoint                 | s3.endpoint              | MinIO endpoint, the access endpoint for MinIO               |               | Yes      |
| minio.access_key               | s3.access_key            | MinIO access key, the MinIO access key used for authentication |               | Yes      |
| minio.secret_key               | s3.secret_key            | MinIO secret key, the secret key used together with access key |               | Yes      |
| minio.connection.maximum       | s3.connection.maximum    | S3 maximum connections, specifies the maximum number of connections established with MinIO service | 50            | No       |
| minio.connection.request.timeout | s3.connection.timeout    | S3 request timeout, in milliseconds, specifies the request timeout when connecting to MinIO service | 3000          | No       |
| minio.connection.timeout       | s3.connection.timeout    | S3 connection timeout, in milliseconds, specifies the timeout when establishing connection with MinIO service | 1000          | No       |
| minio.use_path_style           | s3.use_path_style        | Whether to use path-style access. Recommended to set to true for compatibility with MinIO and other non-AWS S3 services | FALSE         | No       |

### Using Path-style Access

MinIO uses Host-style access by default, but also supports Path-style access. You can switch by setting the `minio.use_path_style` parameter.

- Host-style access (default): https://bucket.minio.example.com
- Path-style access (when enabled): https://minio.example.com/bucket

## Example Configuration

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```

For versions before 3.1:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```

## Usage Recommendations

* It is recommended to use the `minio.` prefix for configuration parameters to ensure consistency and clarity with MinIO.
* For versions before 3.1, please use the legacy name `s3.` as the prefix.
* Connection pool parameters can be adjusted according to concurrency requirements to avoid connection

