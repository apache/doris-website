---
{
    "title": "Integration with SeaweedFS",
    "language": "en"
}
---

[SeaweedFS](https://seaweedfs.com/) is a distributed storage system that exposes both an S3-compatible object API and an Apache Iceberg REST Catalog from the same `weed` process. Parquet data and Iceberg metadata are served by one executable, authenticated by one S3 credential pair.

This page shows the minimal configuration that turns SeaweedFS into a Doris-backed Iceberg lakehouse. The same end-to-end path is exercised by the [`TestDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris) integration test in the SeaweedFS repository, which boots a SeaweedFS mini cluster, registers a Doris Iceberg catalog against it, writes rows with PyIceberg, and reads them back from `apache/doris:doris-all-in-one-2.1.0`.

## Why SeaweedFS for an Iceberg lakehouse

A typical lakehouse stack today stitches together three layers:

* Object storage (S3 or compatible)
* A standalone Iceberg catalog (Hive Metastore, Glue, Polaris, Lakekeeper, Nessie, ...)
* A query engine (Doris, Spark, Trino, ...)

SeaweedFS collapses the first two into one process. The same `weed` executable is both:

* the S3-compatible object store that holds the parquet files, and
* the Iceberg REST Catalog that holds the table metadata.

So Doris talks to one system instead of two. The practical implications:

* **Fewer moving parts.** No Hive Metastore, no Glue, no Postgres backing a separate catalog, no STS role to provision.
* **Simpler deployment.** One executable, one IAM config, one S3 credential pair shared by Doris's Iceberg REST client and its S3 reader.
* **Local or on-prem friendly.** Nothing in the path requires a cloud-native service. The same setup runs on a laptop, a single VM, or a Kubernetes cluster.
* **Lower latency on the metadata path.** Catalog state lives in the same SeaweedFS filer that serves the data, so namespace and table lookups don't cross a separate service boundary.
* **S3-native on disk.** Tables are stored as standard Iceberg directories in S3 buckets. Any S3 client (rclone, `aws s3`, Spark, Trino, Dremio, RisingWave) can read or replicate them alongside Doris.

Architecturally:

```text
Doris
  |
  v
Iceberg tables
  |
  v
SeaweedFS  (S3 storage + REST catalog)
```

For smaller teams or internal platforms, this is a clean way to build a lakehouse without depending on a separate metastore service.

## 1. Start SeaweedFS

Build or install `weed` from [github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs).

Create an IAM config that grants an access key full S3 access. The same key is also used as the OAuth2 client for the Iceberg REST endpoint:

```json
{
  "identities": [
    {
      "name": "doris",
      "credentials": [
        {
          "accessKey": "AKIAIOSFODNN7EXAMPLE",
          "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
      ],
      "actions": ["Admin"]
    }
  ]
}
```

Start a single-process cluster with the Iceberg REST endpoint and a pre-created table bucket:

```bash
weed mini \
  -ip $(hostname -I | awk '{print $1}') \
  -dir /var/lib/seaweedfs \
  -s3.config /etc/seaweedfs/iam_config.json \
  -tableBucket iceberg-tables
```

`weed mini` runs master, volume, filer, S3, and the Iceberg REST catalog in one process. Default ports:

| Component | Port | Override flag |
| --------- | ---- | ------------- |
| Master HTTP | 9333 | `-master.port` |
| Filer HTTP | 8888 | `-filer.port` |
| S3 | 8333 | `-s3.port` |
| Iceberg REST | 8181 | `-s3.port.iceberg` |

`-tableBucket iceberg-tables` creates the S3 Tables bucket on startup, which is the Iceberg-aware bucket type Doris will write into.

To verify the catalog is reachable:

```bash
curl -s http://SEAWEED_HOST:8181/v1/config | jq .
```

## 2. Register the Iceberg catalog in Doris

```sql
CREATE CATALOG seaweedfs PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://SEAWEED_HOST:8181",
    "warehouse" = "s3://iceberg-tables",
    "credential" = "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.endpoint" = "http://SEAWEED_HOST:8333",
    "s3.access_key" = "AKIAIOSFODNN7EXAMPLE",
    "s3.secret_key" = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.region" = "us-west-2",
    "use_path_style" = "true"
);
```

Notes:

* `credential = "<access_key>:<secret_key>"` is forwarded by Doris's Iceberg REST client as OAuth2 client credentials. SeaweedFS validates them against the same IAM config that secures the S3 endpoint.
* The `s3.*` properties are used by Doris's own parquet reader and writer. They point at the same `weed` process — same host, same key pair.
* `use_path_style = "true"` is required because SeaweedFS serves S3 in path-style by default.
* The integration test uses these exact properties; see [`createDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3tables/catalog_doris/doris_catalog_test.go) for the canonical form.

If you create namespaces or tables outside Doris (for example with PyIceberg) before the catalog is registered, refresh the metadata cache:

```sql
REFRESH CATALOG seaweedfs;
```

## 3. Use the catalog

```sql
USE seaweedfs;

CREATE DATABASE IF NOT EXISTS demo;

USE seaweedfs.demo;

CREATE TABLE iceberg_smoke (
  id BIGINT,
  label STRING
);

INSERT INTO iceberg_smoke VALUES (1, 'one'), (2, 'two'), (3, 'three');

SELECT id, label FROM iceberg_smoke ORDER BY id;
```

Expected output:

```text
+----+-------+
| id | label |
+----+-------+
|  1 | one   |
|  2 | two   |
|  3 | three |
+----+-------+
```

This is the same path the SeaweedFS integration test exercises: namespace and table created through the Iceberg REST catalog, rows appended via PyIceberg, and reads served by Doris through the standard S3 plus Iceberg metadata flow.

## Production notes

* For a production cluster, replace `weed mini` with `weed master`, `weed volume`, `weed filer`, and `weed s3 -iceberg.port=8181` (or use the SeaweedFS Helm chart). The Doris-side configuration is identical — only the host and ports change.
* The OAuth2 credential is the S3 access key. To rotate Doris's catalog access, rotate the IAM identity that holds it, the same way you rotate any S3 user.
* Iceberg table maintenance (compaction, snapshot expiration, orphan removal, manifest rewriting) is built into SeaweedFS and runs against the same bucket. See the [SeaweedFS Iceberg Catalog wiki](https://github.com/seaweedfs/seaweedfs/wiki/SeaweedFS-Iceberg-Catalog) for details.

## References

* [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
* [Doris Iceberg integration test in SeaweedFS](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris)
* [Doris Iceberg Catalog reference](https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog)
