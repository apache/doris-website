---
{
  "title": "Huawei OBS",
  "language": "en"
}
---

This document describes the parameters required to access Huawei Cloud OBS, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access Huawei Cloud OBS through S3-compatible protocol.**

## Parameter Overview

| Property Name                   | Description                                           | Default Value | Required |
|---------------------------------|-------------------------------------------------------|---------------|----------|
| `s3.endpoint`                   | OBS endpoint, specifies the access endpoint for Huawei Cloud OBS |               | Yes      |
| `s3.region`                     | OBS region, specifies the region for Huawei Cloud OBS |               | No       |
| `s3.access_key`                 | OBS access key, the OBS access key used for authentication |               | Yes      |
| `s3.secret_key`                 | OBS secret key, the access key used in conjunction with access key |               | Yes      |

### Configuration Example

```plaintext
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com"
"s3.region" = "cn-north-4"
```
