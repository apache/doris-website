---
{
    "title": "Apache Ozone",
    "language": "en",
    "description": "Starting from version 4.0.4, Doris supports accessing Apache Ozone through the S3 Gateway.",
    "sidebar_label": "Apache Ozone"
}
---

# Apache Ozone

Starting from version 4.0.4, Doris supports accessing Apache Ozone through the S3 Gateway.

This document describes the parameters required to access Apache Ozone. These parameters apply to:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**To use Ozone as a dedicated storage type, configure `"fs.ozone.support" = "true"` explicitly.**

## Parameter Overview

| Property Name | Legacy Name | Description | Default Value | Required |
| --- | --- | --- | --- | --- |
| ozone.endpoint | s3.endpoint | Ozone S3 Gateway endpoint, for example `http://ozone-s3g:9878` | None | Yes |
| ozone.region | s3.region | Region of Ozone S3 Gateway | `us-east-1` | No |
| ozone.access_key | s3.access_key, s3.access-key-id | Access key used for authentication | None | No* |
| ozone.secret_key | s3.secret_key, s3.secret-access-key | Secret key used for authentication | None | No* |
| ozone.session_token | s3.session_token, s3.session-token | Session token | None | No |
| ozone.connection.maximum | s3.connection.maximum | Maximum number of connections | `100` | No |
| ozone.connection.request.timeout | s3.connection.request.timeout | Request timeout in milliseconds | `10000` | No |
| ozone.connection.timeout | s3.connection.timeout | Connection timeout in milliseconds | `10000` | No |
| ozone.use_path_style | use_path_style, s3.path-style-access | Whether to use path-style access | `true` | No |
| ozone.force_parsing_by_standard_uri | force_parsing_by_standard_uri | Whether to force standard URI parsing | `false` | No |
| fs.ozone.support |  | Whether to enable Ozone as storage type | `false` | Yes |

Notes:

- `ozone.access_key` and `ozone.secret_key` must be configured together.
- `fs.s3a.*` keys are not parsed directly by Ozone properties. Use `ozone.*` or compatible `s3.*` keys.
- Ozone supports `s3://`, `s3a://`, and `s3n://` URI schemas.
- Setting `ozone.endpoint` (or `s3.endpoint`) alone does not enable Ozone. You must set `fs.ozone.support=true`.

## Example Configuration

Using `ozone.*` keys:

```properties
"fs.ozone.support" = "true",
"ozone.endpoint" = "http://ozone-s3g:9878",
"ozone.access_key" = "hadoop",
"ozone.secret_key" = "hadoop",
"ozone.region" = "us-east-1",
"ozone.use_path_style" = "true"
```

Using compatible `s3.*` aliases:

```properties
"fs.ozone.support" = "true",
"s3.endpoint" = "http://ozone-s3g:9878",
"s3.access_key" = "hadoop",
"s3.secret_key" = "hadoop",
"s3.region" = "us-east-1",
"s3.path-style-access" = "true"
```
