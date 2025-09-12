---
{
    "title": "AWS Glue",
    "language": "en"
}
---

This document describes the parameter configuration when using **AWS Glue Catalog** to access **Iceberg tables** or **Hive tables** through `CREATE CATALOG`.

## Supported Glue Catalog Types

AWS Glue Catalog currently supports three types of Catalogs:

| Catalog Type | Type Identifier (`type`) | Description                                        |
|--------------|-------------------------|----------------------------------------------------|
| Hive         | glue                    | Catalog for connecting to Hive Metastore          |
| Iceberg      | glue                    | Catalog for connecting to Iceberg table format    |
| Iceberg      | rest                    | Catalog for connecting to Iceberg via Glue Rest   |

This document provides detailed descriptions of the parameters for each type to help users with configuration.

## Hive Glue Catalog

Hive Glue Catalog is used to access Hive tables through AWS Glue's Hive Metastore compatible interface. Configuration parameters are as follows:

| Parameter Name            | Description                                                          | Required | Default Value |
|---------------------------|----------------------------------------------------------------------|----------|---------------|
| `type`                    | Fixed value `hms`                                                    | Yes      | None          |
| `hive.metastore.type`     | Fixed value `glue`                                                   | Yes      | None          |
| `glue.region`             | AWS Glue region, e.g., `us-east-1`                                  | Yes      | None          |
| `glue.endpoint`           | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com`     | Yes      | None          |
| `glue.access_key`         | AWS Access Key ID                                                    | Yes      | Empty         |
| `glue.secret_key`         | AWS Secret Access Key                                                | Yes      | Empty         |
| `glue.catalog_id`         | Glue Catalog ID (not yet supported)                                 | No       | Empty         |
| `glue.role_arn`           | IAM Role ARN for accessing Glue (not yet supported)                 | No       | Empty         |
| `glue.external_id`        | IAM External ID for accessing Glue (not yet supported)              | No       | Empty         |

### Example

```sql
CREATE CATALOG hive_glue_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

## Iceberg Glue Catalog

Iceberg Glue Catalog accesses Glue through the Glue Client. Configuration parameters are as follows:

| Parameter Name          | Description                                                                 | Required | Default Value |
|-------------------------|-----------------------------------------------------------------------------|----------|---------------|
| `type`                  | Fixed value `iceberg`                                                       | Yes      | None          |
| `iceberg.catalog.type`  | Fixed value `glue`                                                          | Yes      | None          |
| `warehouse`             | Iceberg warehouse path, e.g., `s3://my-bucket/iceberg-warehouse/`          | Yes      | s3://doris    |
| `glue.region`           | AWS Glue region, e.g., `us-east-1`                                         | Yes      | None          |
| `glue.endpoint`         | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com`            | Yes      | None          |
| `glue.access_key`       | AWS Access Key ID                                                           | Yes      | Empty         |
| `glue.secret_key`       | AWS Secret Access Key                                                       | Yes      | Empty         |
| `glue.catalog_id`       | Glue Catalog ID (not yet supported)                                        | No       | Empty         |
| `glue.role_arn`         | IAM Role ARN for accessing Glue (not yet supported)                        | No       | Empty         |
| `glue.external_id`      | IAM External ID for accessing Glue (not yet supported)                     | No       | Empty         |

### Example

```sql
CREATE CATALOG iceberg_glue_catalog WITH (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

## Iceberg Glue Rest Catalog

Iceberg Glue Rest Catalog accesses Glue through the Glue Rest Catalog interface. Currently only supports Iceberg tables stored in AWS S3 Table Bucket. Configuration parameters are as follows:

| Parameter Name                   | Description                                                                     | Required | Default Value |
|----------------------------------|---------------------------------------------------------------------------------|----------|---------------|
| `type`                           | Fixed value `iceberg`                                                           | Yes      | None          |
| `iceberg.catalog.type`           | Fixed value `rest`                                                              | Yes      | None          |
| `iceberg.rest.uri`               | Glue Rest service endpoint, e.g., `https://glue.ap-east-1.amazonaws.com/iceberg` | Yes      | None          |
| `warehouse`                      | Iceberg warehouse path, e.g., `<account_id>:s3tablescatalog/<bucket_name>`     | Yes      | None          |
| `iceberg.rest.sigv4-enabled`     | Enable V4 signature format, fixed value `true`                                 | Yes      | None          |
| `iceberg.rest.signing-name`      | Signature type, fixed value `glue`                                             | Yes      | Empty         |
| `iceberg.rest.access-key-id`     | Access Key for accessing Glue (also used for S3 Bucket access)                | Yes      | Empty         |
| `iceberg.rest.secret-access-key` | Secret Key for accessing Glue (also used for S3 Bucket access)                | Yes      | Empty         |
| `iceberg.rest.signing-region`    | AWS Glue region, e.g., `us-east-1`                                             | Yes      | Empty         |

### Example

```sql
CREATE CATALOG glue_s3 PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'rest',
  'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
  'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
  'iceberg.rest.sigv4-enabled' = 'true',
  'iceberg.rest.signing-name' = 'glue',
  'iceberg.rest.access-key-id' = '<ak>',
  'iceberg.rest.secret-access-key' = '<sk>',
  'iceberg.rest.signing-region' = '<region>'
);
```
