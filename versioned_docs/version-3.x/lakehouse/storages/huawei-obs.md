---
{
    "title": "Huawei OBS",
    "language": "en",
    "description": "This document describes the parameters required to access Huawei Cloud OBS, which are applicable to the following scenarios:"
}
---

This document describes the parameters required to access Huawei Cloud OBS, which are applicable to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access Huawei Cloud OBS through S3-compatible protocol.**

## Parameter Overview

| Property Name                | Former Name              | Description                                                  | Default Value | Required |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| obs.endpoint                 | s3.endpoint              | OBS endpoint, specifies the access endpoint for Huawei Cloud OBS |               | Yes      |
| obs.access_key               | s3.access_key            | OBS access key, used for authentication                     |               | Yes      |
| obs.secret_key               | s3.secret_key            | OBS secret key, used together with access key for authentication |               | Yes      |
| obs.region                   | s3.region                | OBS region, specifies the region of Huawei Cloud OBS        |               | No       |
| obs.use_path_style           | s3.use_path_style        | Whether to use path-style access. Recommended to set to true for compatibility with non-AWS S3 services like MinIO/Ceph | FALSE         | No       |
| obs.connection.maximum       | s3.connection.maximum    | Maximum number of connections to OBS service                | 50            | No       |
| obs.connection.request.timeout | s3.connection.request.timeout | Request timeout in milliseconds for connecting to OBS service | 3000          | No       |
| obs.connection.timeout       | s3.connection.timeout    | Connection timeout in milliseconds for establishing connection to OBS service | 1000          | No       |

> Before version 3.1, use legacy name

## Example Configuration

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```

For versions before 3.1:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```

## Usage Recommendations

* It is recommended to use the `obs.` prefix for configuration parameters to ensure consistency and clarity with Huawei Cloud OBS.
* For versions before 3.1, please use the former name with `s3.` prefix.
* Configuring `obs.region` can improve access accuracy and performance, it is recommended to set it.
* Connection pool parameters can be adjusted according to concurrency requirements to avoid connection blocking.
