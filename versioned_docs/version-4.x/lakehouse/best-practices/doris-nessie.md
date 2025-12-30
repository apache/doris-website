---
{
    "title": "Integration with Nessie",
    "language": "en"
}
---

[Nessie](https://projectnessie.org/) is an open-source transactional catalog for data lakes, providing Git-like version control capabilities for your data. It implements the Iceberg REST Catalog specification and supports features like branching, tagging, and time travel across multiple table formats including Apache Iceberg.

This article will guide you through integrating Apache Doris with Nessie to achieve efficient querying and management of Iceberg data. We will take you through the entire process from environment preparation to final querying step by step.

**Through this document, you will learn:**

* **AWS Environment Preparation**: How to create and configure S3 storage buckets in AWS, and prepare necessary IAM roles and policies for Nessie, enabling Nessie to access S3 and distribute access credentials to Doris.

* **Nessie Deployment and Configuration**: How to deploy Nessie service using Docker Compose, and configure Warehouse to provide metadata access endpoints for Doris.

* **Doris Connection to Nessie**: How to use Doris to access Iceberg data through Nessie for read and write operations.

## 1. AWS Environment Preparation

Before we begin, we need to prepare S3 storage buckets and corresponding IAM roles on AWS, which forms the foundation for Nessie to manage data and Doris to access data.

### 1.1 Create S3 Storage Bucket

First, we create an S3 Bucket named `nessie-doris-demo` to store Iceberg table data that will be created later.

```bash
# Create S3 storage bucket
aws s3 mb s3://nessie-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep nessie-doris-demo
```

### 1.2 Create IAM Role for Object Storage Access (Optional)

If you plan to use Credential Vending mode, you need to create an IAM role for Nessie to use through the STS AssumeRole mechanism. This design follows the security best practices of least privilege principle and separation of duties.

1. Create trust policy file

    Create `nessie-trust-policy.json` file:

    ```bash
    cat > nessie-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USER"
            },
            "Action": "sts:AssumeRole"
        }
        ]
    }
    EOF
    ```

    > Note: Please replace YOUR\_ACCOUNT\_ID with your actual AWS Account ID, which can be obtained via `aws sts get-caller-identity --query Account --output text`. Replace YOUR\_USER with the actual IAM username.

2. Create IAM Role

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```

3. Attach S3 access permission policy

    Create `nessie-s3-policy.json` file:

    ```bash
    cat > nessie-s3-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListBucketMultipartUploads",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::nessie-doris-demo",
                "arn:aws:s3:::nessie-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    Attach the policy to the role:

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```

4. Grant AssumeRole permission to the user

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-nessie-role \
        --policy-document file://user-assume-policy.json
    ```

5. Verify creation results

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```

## 2. Nessie Deployment and Warehouse Configuration

After environment preparation is complete, we begin deploying the Nessie service and configuring the Warehouse.

### 2.1 Deploy Nessie Using Docker Compose (Credential Vending Mode)

This is the **most recommended** deployment approach, enhancing security through temporary credentials.

Create a `.env` file to store AWS credentials:

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie
        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse
        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.auth-type=APPLICATION_GLOBAL
        -Dnessie.catalog.service.s3.default-options.server-iam.enabled=true
        -Dnessie.catalog.service.s3.default-options.server-iam.assume-role=arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role
        -Dnessie.catalog.service.s3.default-options.server-iam.role-session-name=nessie-doris
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}

volumes:
  pgdata:
```

**Key Configuration Parameters for Credential Vending:**

| Parameter | Description |
| --------- | ----------- |
| `nessie.version.store.type` | Version store type, using JDBC2 for PostgreSQL backend. |
| `nessie.catalog.default-warehouse` | The default warehouse name. |
| `nessie.catalog.warehouses.<name>.location` | The S3 location for storing Iceberg table data. |
| `server-iam.enabled` | Set to `true` to enable Credential Vending. |
| `server-iam.assume-role` | The IAM Role ARN that Nessie will assume to access S3. |
| `server-iam.role-session-name` | Session name for the assumed role. |
| `auth-type` | Set to `APPLICATION_GLOBAL` for using application-level credentials. |

Start Nessie:

```bash
docker compose up -d
```

After starting, you can access the Nessie API at `http://YOUR_HOST_IP:19120`.

### 2.2 Deploy Nessie Using Docker Compose (Static Credentials Mode)

If you don't need Credential Vending, you can use static credentials mode for quick testing:

Create a `.env` file to store AWS credentials:

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie

        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse

        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.access-key=urn:nessie-secret:quarkus:my-secrets-default
        -Dmy-secrets-default.name=${AWS_ACCESS_KEY_ID}
        -Dmy-secrets-default.secret=${AWS_SECRET_ACCESS_KEY}

    env_file:
      - .env

volumes:
  pgdata:
```

**Key Configuration Parameters:**

| Parameter | Description |
| --------- | ----------- |
| `nessie.version.store.type` | Version store type, using JDBC2 for PostgreSQL backend. |
| `nessie.catalog.default-warehouse` | The default warehouse name. |
| `nessie.catalog.warehouses.<name>.location` | The S3 location for storing Iceberg table data. |
| `nessie.catalog.service.s3.default-options.region` | AWS region for S3 bucket. |

## 3. Doris Connection to Nessie

Now, we will create an Iceberg Catalog in Doris that connects to the Nessie service.

### Method 1: Temporary Storage Credentials (Credential Vending)

This is the **most recommended** approach. When needing to read/write data files on S3, Doris requests a temporary, minimally-privileged S3 access credential from Nessie.

```sql
CREATE CATALOG nessie_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

> Note: The Nessie REST Catalog URI format is `http://HOST:PORT/iceberg/{branch}`, where `main` is the default branch name.

### Method 2: Static Storage Credentials (AK/SK)

In this approach, Doris directly uses static AK/SK hardcoded in the configuration to access object storage. This method is simple to configure and suitable for quick testing, but has lower security.

```sql
CREATE CATALOG nessie_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 4. Verify Connection in Doris

Regardless of which method you used to create the Catalog, you can verify end-to-end connectivity through the following SQL.

```sql
-- Switch to the Catalog
USE nessie_vc;

-- Create a namespace (database)
CREATE DATABASE demo;
USE demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'alice'), (2, 'bob');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+-------+
-- | id   | name  |
-- +------+-------+
-- | 1    | alice |
-- | 2    | bob   |
-- +------+-------+
```

If all the above operations complete successfully, congratulations! You have successfully established the complete data lake pipeline: Doris -> Nessie -> S3.

For more information on using Doris to manage Iceberg tables, please visit:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
