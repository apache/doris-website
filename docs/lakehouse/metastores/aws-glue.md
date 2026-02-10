---
{
    "title": "AWS Glue",
    "language": "en",
    "description": "This document describes the parameter configuration when using AWS Glue Catalog to access Iceberg tables or Hive tables through CREATE CATALOG."
}
---

This document describes the parameter configuration when using **AWS Glue Catalog** to access **Iceberg tables** or **Hive tables** through `CREATE CATALOG`.

## Supported Glue Catalog Types

AWS Glue Catalog currently supports three types of Catalogs:

| Catalog Type | Type Identifier (`type`) | Description                                    |
|-------------|-------------------------|------------------------------------------------|
| Hive        | glue                    | Catalog for connecting to Hive Metastore      |
| Iceberg     | glue                    | Catalog for connecting to Iceberg table format |
| Iceberg     | rest                    | Catalog for connecting to Iceberg table format via Glue Rest Catalog |

This documentation provides detailed parameter descriptions for each type to facilitate user configuration.

## Common Parameters Overview
| Parameter Name            | Description                                                   | Required | Default Value |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `glue.region`            | AWS Glue region, e.g., `us-east-1`                          | Yes      | None          |
| `glue.endpoint`          | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`        | AWS Access Key ID                                            | Yes      | Empty         |
| `glue.secret_key`        | AWS Secret Access Key                                        | Yes      | Empty         |
| `glue.catalog_id`        | Glue Catalog ID (not supported yet)                         | No       | Empty         |
| `glue.role_arn`          | IAM Role ARN for accessing Glue (supported since 3.1.2+)   | No       | Empty         |
| `glue.external_id`       | IAM External ID for accessing Glue (supported since 3.1.2+) | No       | Empty         |

### Authentication Parameters

Accessing Glue requires authentication information, supporting the following two methods:

1. Access Key Authentication

   Authenticate access to Glue through Access Key provided by `glue.access_key` and `glue.secret_key`.

2. IAM Role Authentication (supported since 3.1.2+)

   Authenticate access to Glue through IAM Role provided by `glue.role_arn`.

   This method requires Doris to be deployed on AWS EC2, and the EC2 instance needs to be bound to an IAM Role that has permission to access Glue.

   If access through External ID is required, you need to configure `glue.external_id` as well.

Notes:

- At least one of the two methods must be configured. If both methods are configured, Access Key authentication takes priority.

Example:

    ```sql
    CREATE CATALOG hive_glue_catalog PROPERTIES (
      'type' = 'hms',
      'hive.metastore.type' = 'glue',
      'glue.region' = 'us-east-1',
      'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
      -- Using Access Key authentication
      'glue.access_key' = '<YOUR_ACCESS_KEY>',
      'glue.secret_key' = '<YOUR_SECRET_KEY>'
      -- Or using IAM Role authentication
      -- 'glue.role_arn' = '<YOUR_ROLE_ARN>',
      -- 'glue.external_id' = '<YOUR_EXTERNAL_ID>'
    );
    ```

For instructions on AWS authentication and authorization configuration, please refer to the document [aws-authentication-and-authorization](../../admin-manual/auth/integrations/aws-authentication-and-authorization.md)

### Hive Glue Catalog

Hive Glue Catalog is used to access Hive tables through AWS Glue's Hive Metastore compatible interface. Configuration as follows:

| Parameter Name            | Description                                                   | Required | Default Value |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `type`                   | Fixed as `hms`                                               | Yes      | None          |
| `hive.metastore.type`    | Fixed as `glue`                                              | Yes      | None          |
| `glue.region`            | AWS Glue region, e.g., `us-east-1`                          | Yes      | None          |
| `glue.endpoint`          | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`        | AWS Access Key ID                                            | No       | Empty         |
| `glue.secret_key`        | AWS Secret Access Key                                        | No       | Empty         |
| `glue.catalog_id`        | Glue Catalog ID (not supported yet)                         | No       | Empty         |
| `glue.role_arn`          | IAM Role ARN for accessing Glue                             | No       | Empty         |
| `glue.external_id`       | IAM External ID for accessing Glue                          | No       | Empty         |

#### Example

```sql
CREATE CATALOG hive_glue_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

### Iceberg Glue Catalog

Iceberg Glue Catalog accesses Glue through Glue Client. Configuration as follows:

| Parameter Name          | Description                                                      | Required | Default Value |
|------------------------|------------------------------------------------------------------|----------|---------------|
| `type`                 | Fixed as `iceberg`                                               | Yes      | None          |
| `iceberg.catalog.type` | Fixed as `glue`                                                  | Yes      | None          |
| `warehouse`            | Iceberg data warehouse path, e.g., `s3://my-bucket/iceberg-warehouse/` | Yes      | s3://doris    |
| `glue.region`          | AWS Glue region, e.g., `us-east-1`                             | Yes      | None          |
| `glue.endpoint`        | AWS Glue endpoint, e.g., `https://glue.us-east-1.amazonaws.com` | Yes      | None          |
| `glue.access_key`      | AWS Access Key ID                                               | No       | Empty         |
| `glue.secret_key`      | AWS Secret Access Key                                           | No       | Empty         |
| `glue.catalog_id`      | Glue Catalog ID (not supported yet)                            | No       | Empty         |
| `glue.role_arn`        | IAM Role ARN for accessing Glue (not supported yet)            | No       | Empty         |
| `glue.external_id`     | IAM External ID for accessing Glue (not supported yet)         | No       | Empty         |

#### Example

```sql
CREATE CATALOG iceberg_glue_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### Iceberg Glue Rest Catalog

Iceberg Glue Rest Catalog accesses Glue through Glue Rest Catalog interface. Currently only supports Iceberg tables stored in AWS S3 Table Bucket. Configuration as follows:

| Parameter Name                   | Description                                                       | Required | Default Value |
|----------------------------------|-------------------------------------------------------------------|----------|---------------|
| `type`                           | Fixed as `iceberg`                                                | Yes      | None          |
| `iceberg.catalog.type`           | Fixed as `rest`                                                   | Yes      | None          |
| `iceberg.rest.uri`               | Glue Rest service endpoint, e.g., `https://glue.ap-east-1.amazonaws.com/iceberg` | Yes      | None          |
| `warehouse`                      | Iceberg data warehouse path, e.g., `<account_id>:s3tablescatalog/<bucket_name>` | Yes      | None          |
| `iceberg.rest.sigv4-enabled`     | Enable V4 signature format, fixed as `true`                      | Yes      | None          |
| `iceberg.rest.signing-name`      | Signature type, fixed as `glue`                                  | Yes      | Empty         |
| `iceberg.rest.access-key-id`     | Access Key for accessing Glue (also used for accessing S3 Bucket) | Yes      | Empty         |
| `iceberg.rest.secret-access-key` | Secret Key for accessing Glue (also used for accessing S3 Bucket) | Yes      | Empty         |
| `iceberg.rest.signing-region`    | AWS Glue region, e.g., `us-east-1`                              | Yes      | Empty         |

#### Example

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


## Permission Policies

Depending on usage scenarios, they can be divided into **read-only** and **read-write** policies.

### 1. Read-Only Permissions

Only allows reading database and table information from Glue Catalog.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadOnly",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 2. Read-Write Permissions

Based on read-only permissions, allows creating/modifying/deleting databases and tables.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadWrite",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:DeleteTable"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### Notes

1. Placeholder Replacement

    - `<region>` → Your AWS region (e.g., `us-east-1`).
    - `<account-id>` → Your AWS account ID (12-digit number).

2. Principle of Least Privilege

    - If only querying, do not grant write permissions.
    - Can replace `*` with specific database/table ARNs to further restrict permissions.

3. S3 Permissions

    - The above policies only involve Glue Catalog.
    - If you need to read data files, additional S3 permissions are required (such as `s3:GetObject`, `s3:ListBucket`, etc.).