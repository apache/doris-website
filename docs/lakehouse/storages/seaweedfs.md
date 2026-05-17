---
{
    "title": "SeaweedFS | Storages",
    "language": "en",
    "description": "This document describes the parameters required to access SeaweedFS, which apply to the following scenarios:",
    "sidebar_label": "SeaweedFS"
}
---

# SeaweedFS

This document describes the parameters required to access [SeaweedFS](https://seaweedfs.com/), which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**Doris uses the S3 Client to access SeaweedFS through the S3-compatible protocol.** This page covers SeaweedFS S3 (normal) buckets. For Iceberg tables stored in SeaweedFS S3 Table Buckets (REST Catalog + S3 served from the same `weed` process), see [Integration with SeaweedFS](../best-practices/doris-seaweedfs.md).

## Quick start with `weed mini`

`weed mini` brings up a SeaweedFS S3 endpoint in a single process, seeding credentials and a pre-created bucket from environment variables:

```bash
AWS_ACCESS_KEY_ID=admin \
AWS_SECRET_ACCESS_KEY=secret \
S3_BUCKET=my-bucket \
weed mini -dir=/data
```

The S3 endpoint is then reachable at `http://localhost:8333` with `my-bucket` already created and `admin` / `secret` as valid credentials. See [Quick Start with `weed mini`](https://github.com/seaweedfs/seaweedfs/wiki/Quick-Start-with-weed-mini) for Docker, custom ports, multiple buckets, and reverse-proxy options.

## Parameter Overview

SeaweedFS is accessed via the S3-compatible protocol, so it uses the same `s3.*` properties as AWS S3.

| Property Name                   | Description                                                                                          | Default | Required |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | -------- |
| s3.endpoint                     | SeaweedFS S3 gateway endpoint, for example `http://seaweedfs.example.com:8333`                        |         | Yes      |
| s3.access_key                   | Access key configured in the SeaweedFS S3 IAM config                                                  |         | Yes      |
| s3.secret_key                   | Secret key paired with `s3.access_key`                                                                |         | Yes      |
| s3.region                       | Region. SeaweedFS does not validate the value but the AWS S3 SDK requires one, e.g. `us-east-1`       |         | Yes      |
| s3.use_path_style               | Set to `true`. SeaweedFS serves objects under `http://<endpoint>/<bucket>/<key>`                       | FALSE   | No       |
| s3.connection.maximum           | Maximum number of connections to the SeaweedFS S3 gateway                                              | 50      | No       |
| s3.connection.request.timeout   | Request timeout in milliseconds                                                                        | 3000    | No       |
| s3.connection.timeout           | Connection establishment timeout in milliseconds                                                       | 1000    | No       |

### Using path-style access

SeaweedFS uses path-style addressing (`http://<endpoint>/<bucket>/<key>`) and does not provision per-bucket DNS subdomains, so set `s3.use_path_style = true` for every connection.

## Example Configuration

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://seaweedfs.example.com:8333",
"s3.region" = "us-east-1",
"s3.use_path_style" = "true"
```

## Usage Recommendations

* Set `s3.use_path_style = true`. SeaweedFS does not use per-bucket DNS subdomains.
* `s3.region` is required by the AWS S3 SDK but ignored by SeaweedFS — any non-empty value works.
* For HTTPS, terminate TLS at a reverse proxy and start `weed` with `-s3.externalUrl=https://<proxy>` so S3 signature verification works.
* For Iceberg tables in SeaweedFS S3 Table Buckets, see [Integration with SeaweedFS](../best-practices/doris-seaweedfs.md).
