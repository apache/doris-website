---
{
  "title": "Aliyun OSS",
  "language": "en"
}
---

This document introduces the parameters required to access Aliyun OSS, applicable to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses the S3 Client to access Aliyun OSS through the S3 compatible protocol.**

## Parameter Overview

| Property Name                     | Former Name      | Description                                                      | Default | Required |
|-----------------------------------|------------------|------------------------------------------------------------------|---------|----------|
| `s3.endpoint`                     | `oss.endpoint`   | OSS endpoint, specifies the access endpoint for Aliyun OSS. Note that the endpoints for OSS and OSS HDFS are different. |         | Yes      |
| `s3.region`                       | `oss.region`     | OSS region, specifies the region for Aliyun OSS                  |         | No       |
| `s3.access_key`                   | `oss.access_key` | OSS access key, the access key for authentication with OSS       |         | Yes      |
| `s3.secret_key`                   | `oss.secret_key` | OSS secret key, the secret key used in conjunction with the access key |         | Yes      |
| `s3.connection.maximum`           |                  | Maximum number of S3 connections, specifies the maximum number of connections established with the OSS service | `50`    | No       |
| `s3.connection.request.timeout`   |                  | S3 request timeout, in milliseconds, specifies the request timeout when connecting to the OSS service | `3000`  | No       |
| `s3.connection.timeout`           |                  | S3 connection timeout, in milliseconds, specifies the timeout when establishing a connection with the OSS service | `1000`  | No       |
| `s3.sts_endpoint`                 |                  | Not yet supported                                                |         | No       |
| `s3.sts_region`                   |                  | Not yet supported                                                |         | No       |
| `s3.iam_role`                     |                  | Not yet supported                                                |         | No       |
| `s3.external_id`                  |                  | Not yet supported                                                |         | No       |

### Authentication Configuration
When accessing Aliyun OSS, you need to provide Aliyun's Access Key and Secret Key, which are the following parameters:

- `s3.access_key` (or `oss.access_key`)
- `s3.secret_key` (or `oss.secret_key`)

### Example Configuration

```plaintext
"oss.access_key" = "ak",
"oss.secret_key" = "sk",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

