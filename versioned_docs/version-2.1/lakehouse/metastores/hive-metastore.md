---
{
  "title": "Hive Metastore",
  "language": "en"
}
---

This document describes the supported parameters when connecting to and accessing Hive Metastore through the `CREATE CATALOG` statement.

## Parameter Overview

| Property Name                        | Former Name | Description                                                                                                                                                                                                                                 | Default Value | Required |
|--------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|----------|
| `hive.metastore.uris`                |             | The URI address of Hive Metastore. Supports specifying multiple URIs separated by commas. Uses the first URI by default, and tries others when the first URI is unavailable. For example: `thrift://172.0.0.1:9083` or `thrift://172.0.0.1:9083,thrift://172.0.0.2:9083` | None          | Yes      |

## Kerberos Authentication Related Parameters

```plaintext
"hadoop.authentication.type" = "kerberos",
"hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM",
"hadoop.kerberos.principal" = "doris/_HOST@EXAMPLE.COM",
"hadoop.kerberos.keytab" = "etc/doris/conf/doris.keytab"
```

> Note: In the current version, Hive's Kerberos authentication parameters are shared with HDFS's
