---
{
  "title": "Aliyun OSS",
  "language": "en"
}
---

This document describes the parameters required to access Alibaba Cloud OSS, which are applicable to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access Alibaba Cloud OSS through S3-compatible protocol.**

## Parameter Overview

| Property Name                  | Legacy Name                  | Description                                                  | Default Value |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | OSS endpoint, specifies the access endpoint for Alibaba Cloud OSS. Note that OSS and OSS HDFS have different endpoints. | None          |
| oss.access_key                 | s3.access_key                | OSS Access Key for authentication                            | None          |
| oss.secret_key                 | s3.secret_key                | OSS Secret Key, used together with Access Key               | None          |
| oss.region                     | s3.region                    | OSS region, specifies the region of Alibaba Cloud OSS       | None          |
| oss.use_path_style             | s3.use_path_style            | Whether to use path-style access. Recommended to set to true for compatibility with MinIO and other non-AWS S3 services | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | Maximum number of connections, specifies the maximum number of connections established with OSS service | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| Request timeout (milliseconds), specifies the request timeout when connecting to OSS service | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | Connection timeout (milliseconds), specifies the timeout when establishing connection with OSS service | 1000          |

> Before version 3.1, use legacy name

## Example Configuration

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

For versions before 3.1:

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

## Usage Recommendations

* It is recommended to use the `oss.` prefix for configuration parameters to ensure consistency and clarity with Alibaba Cloud OSS.
* For versions before 3.1, please use the legacy name `s3.` as the prefix.
* Configuring `oss.region` can improve access accuracy and performance, recommended to set.
* Connection pool parameters can be adjusted according to concurrency requirements to avoid connection blocking.
