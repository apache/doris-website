---
{
    "title": "MINIO",
    "language": "en"
}
---

This document describes the parameters required to access MINIO, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses S3 Client to access MINIO through S3-compatible protocol.**

## Parameter Overview

Parameters are the same as [s3](./s3.md)

But need to add the following additional parameter:

```
"use_path_style" = "true"
```

### Configuration Example

```
"s3.endpoint" = "play.min.io:9000",  
"s3.region" = "us-east-1",
"s3.access_key" = "admin",
"s3.secret_key" = "password",
"use_path_style"
