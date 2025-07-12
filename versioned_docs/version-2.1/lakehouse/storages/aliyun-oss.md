---
{
  "title": "Aliyun OSS",
  "language": "en"
}
---

This document describes the parameters required to access Aliyun OSS, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access Aliyun OSS through S3-compatible protocol.**

## Parameter Overview

| Property Name                   | Description                                                      | Default Value | Required |
|---------------------------------|------------------------------------------------------------------|---------------|----------|
| `s3.endpoint`                   | OSS endpoint, specifies the access endpoint for Aliyun OSS. Note that OSS and OSS HDFS endpoints are different. |               | Yes      |
| `s3.region`                     | OSS region, specifies the region for Aliyun OSS                |               | No       |
| `s3.access_key`                 | OSS access key, the OSS access key used for authentication     |               | Yes      |
| `s3.secret_key`                 | OSS secret key, the access key used in conjunction with access key |               | Yes      |

### Example Configuration

```plaintext
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```
