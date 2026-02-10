---
{
    "title": "Integration with Lakekeeper",
    "language": "en"
}
---

[Lakekeeper](https://lakekeeper.io/) is an open-source Apache Iceberg REST Catalog implementation written in Rust. It provides a lightweight, high-performance metadata management service that supports multiple storage backends including AWS S3, Alibaba Cloud OSS, and MinIO.

This article will guide you through integrating Apache Doris with Lakekeeper to achieve efficient querying and management of Iceberg data. We will take you through the entire process from environment preparation to final querying step by step.

**Through this document, you will learn:**

* **AWS Environment Preparation**: How to create and configure S3 storage buckets in AWS, and prepare necessary IAM roles and policies for Lakekeeper, enabling Lakekeeper to access S3 and distribute access credentials to Doris.

* **Lakekeeper Deployment and Configuration**: How to deploy Lakekeeper service using Docker Compose, and create Project and Warehouse in Lakekeeper to provide metadata access endpoints for Doris.

* **Doris Connection to Lakekeeper**: How to use Doris to access Iceberg data through Lakekeeper for read and write operations.

## 1. AWS Environment Preparation

Before we begin, we need to prepare S3 storage buckets and corresponding IAM roles on AWS, which forms the foundation for Lakekeeper to manage data and Doris to access data.

### 1.1 Create S3 Storage Bucket

First, we create an S3 Bucket named `lakekeeper-doris-demo` to store Iceberg table data that will be created later.

```bash
# Create S3 storage bucket
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# Verify bucket creation success
aws s3 ls | grep lakekeeper-doris-demo
```

### 1.2 Create IAM Role for Object Storage Access

To implement secure credential management, we need to create an IAM role for Lakekeeper to use through the STS AssumeRole mechanism. This design follows the security best practices of least privilege principle and separation of duties.

1. Create trust policy file

    Create `lakekeeper-trust-policy.json` file:

    ```bash
    cat > lakekeeper-trust-policy.json << 'EOF'
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
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```

3. Attach S3 access permission policy

    Create `lakekeeper-s3-policy.json` file:

    ```bash
    cat > lakekeeper-s3-policy.json << 'EOF'
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
                "arn:aws:s3:::lakekeeper-doris-demo",
                "arn:aws:s3:::lakekeeper-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    Attach the policy to the role:

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```

4. Grant AssumeRole permission to the user

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-lakekeeper-role \
        --policy-document file://user-assume-policy.json
    ```

5. Verify creation results

    ```bash
    aws iam get-role --role-name lakekeeper-sts-role
    aws iam list-role-policies --role-name lakekeeper-sts-role
    
    # Verify AssumeRole is available
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role \
        --role-session-name lakekeeper-test
    ```

## 2. Lakekeeper Deployment and Warehouse Creation

After environment preparation is complete, we begin deploying the Lakekeeper service and configuring the Warehouse.

### 2.1 Deploy Lakekeeper Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -p 5432 -d postgres"]
      interval: 2s
      timeout: 10s
      retries: 10

  migrate:
    image: quay.io/lakekeeper/catalog:latest-main
    restart: "no"
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - RUST_LOG=info
    command: ["migrate"]
    depends_on:
      db:
        condition: service_healthy

  lakekeeper:
    image: quay.io/lakekeeper/catalog:latest-main
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - LAKEKEEPER__BASE_URI=http://YOUR_HOST_IP:8181
      - LAKEKEEPER__ENABLE_DEFAULT_PROJECT=true
      - RUST_LOG=info
    command: ["serve"]
    ports:
      - "8181:8181"
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy

volumes:
  pgdata:
```

**Key Configuration Parameters:**

| Parameter | Description |
| --------- | ----------- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | Used to encrypt sensitive secrets stored in Postgres when using the default Postgres secret backend. Should be set to a sufficiently long random string. |
| `LAKEKEEPER__BASE_URI` | The base URI of the Lakekeeper service. Replace `YOUR_HOST_IP` with your actual host IP address. |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | When set to `true`, enables the default project feature. |

Start Lakekeeper:

```bash
docker compose up -d
```

After starting, you can access the following endpoints:

* Swagger UI: `http://YOUR_HOST_IP:8181/swagger-ui/`
* Web UI: `http://YOUR_HOST_IP:8181/ui`

### 2.2 Create Project and Warehouse

1. Create Project

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```

    Verify:

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```

    Note the `project-id` from the response, which will be used as `PROJECT_ID` in subsequent steps.

2. Create Warehouse (Credential Vending Mode)

    If you need to use Credential Vending mode, create the warehouse configuration file `create-warehouse-vc.json`:

    ```bash
    cat > create-warehouse-vc.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-vc-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse-vc",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": true,
        "flavor": "aws",
        "assume-role-arn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    * `sts-enabled`: Set to `true` to enable Credential Vending.
    * `assume-role-arn`: The IAM Role ARN that Lakekeeper will assume to access S3.

    Create the warehouse:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```

3. Create Warehouse (Static Credentials Mode)

    Create the warehouse configuration file `create-warehouse-static.json`:

    ```bash
    cat > create-warehouse-static.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": false,
        "flavor": "aws"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    Create the warehouse:

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```

4. Verify Warehouse Creation

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```

5. Create Namespace

    Note the `warehouse-id` from the previous step's response, which will be used to create the Namespace:

    ```bash
    curl -sS -X POST \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      "http://localhost:8181/catalog/v1/$WAREHOUSE_ID/namespaces" \
      -d '{
        "namespace": ["demo"],
        "properties": {}
      }'
    ```

    This creates a Namespace (database) named `demo` under the Warehouse.

At this point, all Lakekeeper-side configuration is complete.

## 3. Doris Connection to Lakekeeper

Now, we will create an Iceberg Catalog in Doris that connects to the newly configured Lakekeeper service.

### Method 1: Temporary Storage Credentials (Credential Vending)

This is the **most recommended** approach. When needing to read/write data files on S3, Doris requests a temporary, minimally-privileged S3 access credential from Lakekeeper.

```sql
CREATE CATALOG lakekeeper_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-vc-warehouse',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### Method 2: Static Storage Credentials (AK/SK)

In this approach, Doris directly uses static AK/SK hardcoded in the configuration to access object storage. This method is simple to configure and suitable for quick testing, but has lower security.

```sql
CREATE CATALOG lakekeeper_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-warehouse',
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
-- Switch to the Catalog and Namespace configured in Lakekeeper
USE lakekeeper_static.demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Lakekeeper');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+------------+
-- | id   | name       |
-- +------+------------+
-- | 1    | Doris      |
-- | 2    | Lakekeeper |
-- +------+------------+
```

If all the above operations complete successfully, congratulations! You have successfully established the complete data lake pipeline: Doris -> Lakekeeper -> S3.

For more information on using Doris to manage Iceberg tables, please visit:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
