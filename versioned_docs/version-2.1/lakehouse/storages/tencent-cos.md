---
{
    "title": "Tencent COS",
    "language": "en",
    "description": "This document describes the parameters required to access Tencent Cloud COS, which apply to the following scenarios:"
}
---

This document describes the parameters required to access Tencent Cloud COS, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access Tencent Cloud COS through S3-compatible protocol.**

## Parameter Overview

| Property Name                  | Legacy Name              | Description                                                  | Default Value | Required |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| cos.endpoint                   | s3.endpoint              | COS endpoint, specifies the access endpoint for Tencent Cloud COS |               | Yes      |
| cos.access_key                 | s3.access_key            | COS access key, used for authentication to access COS       |               | Yes      |
| cos.secret_key                 | s3.secret_key            | COS secret key, used together with access key for authentication |               | Yes      |
| cos.region                     | s3.region                | COS region, specifies the region of Tencent Cloud COS       |               | No       |
| cos.connection.maximum         | s3.connection.maximum    | S3 maximum connections, specifies the maximum number of connections to COS service | 50            | No       |
| cos.connection.request.timeout | s3.connection.timeout    | S3 request timeout in milliseconds, specifies the request timeout when connecting to COS service | 3000          | No       |
| cos.connection.timeout         | s3.connection.timeout    | S3 connection timeout in milliseconds, specifies the timeout when establishing connection to COS service | 1000          | No       |

> Before version 3.1, use legacy name

## Configuration Examples

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

For versions before 3.1:

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```

## Usage Recommendations

* It is recommended to use the `cos.` prefix for configuration parameters to ensure consistency and clarity with Tencent Cloud COS.
* For versions before 3.1, please use the legacy `s3.` prefix.
* Configuring `cos.region` can improve access accuracy and performance, and it is recommended to set it.
* Connection pool parameters can be adjusted according to concurrency requirements to avoid connection blocking.
