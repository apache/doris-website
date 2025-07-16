---
{
  "title": "Tencent COS",
  "language": "en"
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

| Property Name                   | Description                                           | Default Value | Required |
|---------------------------------|-------------------------------------------------------|---------------|----------|
| `s3.endpoint`                   | COS endpoint, specifies the access endpoint for Tencent Cloud COS |               | Yes      |
| `s3.region`                     | COS region, specifies the region for Tencent Cloud COS |               | No       |
| `s3.access_key`                 | COS access key, the COS access key used for authentication |               | Yes      |
| `s3.secret_key`                 | COS secret key, the access key used in conjunction with access key |               | Yes      |


### Configuration Example

```plaintext
"cos.access_key" = "ak",
"cos.secret_key" = "sk",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```
