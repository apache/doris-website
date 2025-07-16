---
{
    "title": "Iceberg Rest Catalog API",
    "language": "en"
}
---

This document is used to introduce the parameters supported when connecting and accessing the metadata service that supports the Iceberg Rest Catalog interface through the `CREATE CATALOG` statement.

| Property Name                | Former Name | Description                                      | Default Value | Required       |
| -------------------------- | --- | ------------------------------------------- | ---- | ---------- |
| `iceberg.rest.uri`           | uri | Rest Catalog connection address. Example: `http://172.21.0.1:8181` |      | Yes          |
| `iceberg.rest.security.type` |     | Security authentication method for Rest Catalog. Supports `none` or `oauth2`     | `none` | `oauth2` not yet supported |
| `iceberg.rest.prefix`        |     |                                             |      | Not yet supported       |
| `iceberg.rest.oauth2.xxx`    |     | Information related to oauth2 authentication                               |      | Not yet supported       |

