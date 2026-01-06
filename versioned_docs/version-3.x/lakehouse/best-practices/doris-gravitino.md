---
{
    "title": "Integration with Apache Gravitino",
    "language": "en",
    "description": "With the rapid development of data lake technology, building a unified, secure,"
}
---

With the rapid development of data lake technology, building a unified, secure, and efficient lakehouse architecture has become a core challenge in enterprise digital transformation. Apache Gravitino, as a next-generation unified metadata management platform, provides a complete solution for data governance in multi-cloud and multi-engine environments. It not only supports unified management of various data sources and compute engines but also ensures security and controllability of data access through credential vending mechanisms.

This article will provide an in-depth introduction to how to deeply integrate Apache Doris with Apache Gravitino to build a modern lakehouse architecture based on Iceberg REST Catalog. Through Gravitino's unified metadata management and dynamic credential distribution capabilities, we can achieve efficient and secure access to Iceberg data on S3.

**Through this document, you will quickly understand:**

* **AWS Environment Preparation**: How to create S3 buckets and IAM roles in AWS, configure a secure credential management system for Gravitino, and implement dynamic distribution of temporary credentials.

* **Gravitino Deployment and Configuration**: How to quickly deploy Gravitino services, configure Iceberg REST Catalog, and enable vended-credentials functionality.

* **Doris Connection to Gravitino**: Detailed explanation of how Doris accesses Iceberg data through Gravitino's REST API.

## Hands-on Guide

### 1. AWS Environment Preparation

Before we begin, we need to prepare a complete infrastructure on AWS, including S3 buckets and a carefully designed IAM role system, which is the foundation for building a secure and reliable lakehouse architecture.

### 1.1 Create S3 Bucket

First, create a dedicated S3 bucket to store Iceberg data:

```bash
# Create S3 bucket
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep gravitino-iceberg-demo
```

### 1.2 Design IAM Role Architecture

To implement secure credential management, we need to create an IAM role for Gravitino to use through the STS AssumeRole mechanism. This design follows security best practices of least privilege and separation of duties.

**Create Data Access Role**

1. Create Trust Policy File

   Create the `gravitino-trust-policy.json` file:

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": [
                       "arn:aws:iam::YOUR_ACCOUNT_ID:root"
                   ]
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

2. Create IAM Role

   For demonstration simplicity, we'll use AWS managed policies directly. Production environments should use more fine-grained permission controls.

   ```bash
   # Create IAM role
   aws iam create-role \
       --role-name gravitino-iceberg-access \
       --assume-role-policy-document file://gravitino-trust-policy.json \
       --description "Gravitino Iceberg data access role"

   # Attach S3 full access permissions (for testing, use fine-grained permissions in production)
   aws iam attach-role-policy \
       --role-name gravitino-iceberg-access \
       --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

3. Verify IAM Configuration

    Verify that the role configuration is correct:

    ```bash
    # Test role assumption functionality
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```

    Successful response example:

    ```json
    {
        "Credentials": {
            "AccessKeyId": "ASIA***************",
            "SecretAccessKey": "***************************",
            "SessionToken": "IQoJb3JpZ2luX2VjEOj...",
            "Expiration": "2025-07-23T08:33:30+00:00"
        }
    }
    ```

## 2. Gravitino Deployment and Configuration

### 2.1 Download and Install Gravitino

We'll use Gravitino's pre-compiled version to quickly set up the environment:

```bash
# Create working directory
mkdir gravitino-deployment && cd gravitino-deployment

# Download Gravitino main program
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-0.9.1-bin.tar.gz

# Download Iceberg REST server component
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-iceberg-rest-server-0.9.1-bin.tar.gz

# Extract and install
tar -xzf gravitino-0.9.1-bin.tar.gz
cd gravitino-0.9.1-bin
tar -xzf ../gravitino-iceberg-rest-server-0.9.1-bin.tar.gz --strip-components=1
```

### 2.2 Install Required Dependencies

To support AWS S3 and credential management functionality, additional JAR packages need to be installed:

```bash
# Create necessary directory structure
mkdir -p catalogs/lakehouse-iceberg/libs
mkdir -p iceberg-rest-server/libs
mkdir -p logs
mkdir -p /tmp/gravitino

# Download Iceberg AWS bundle
wget https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-aws-bundle/1.6.1/iceberg-aws-bundle-1.6.1.jar \
  -P catalogs/lakehouse-iceberg/libs/

# Download Gravitino AWS support package (core for vended-credentials functionality)
wget https://repo1.maven.org/maven2/org/apache/gravitino/gravitino-aws/0.9.1/gravitino-aws-0.9.1.jar \
  -P iceberg-rest-server/libs/

# Distribute JAR packages to various directories
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar iceberg-rest-server/libs/
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar libs/
cp iceberg-rest-server/libs/gravitino-aws-0.9.1.jar libs/
```

### 2.3 Configure Gravitino Service

1. Main Service Configuration

    Create or edit the `conf/gravitino.conf` file:

    ```properties
    # Gravitino server basic configuration
    gravitino.server.webserver.host = 0.0.0.0
    gravitino.server.webserver.httpPort = 8090

    # Metadata store configuration (PostgreSQL/MySQL recommended for production)
    gravitino.entity.store = relational
    gravitino.entity.store.relational = JDBCBackend
    gravitino.entity.store.relational.jdbcUrl = jdbc:h2:file:/tmp/gravitino/gravitino.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.entity.store.relational.jdbcDriver = org.h2.Driver
    gravitino.entity.store.relational.jdbcUser = gravitino
    gravitino.entity.store.relational.jdbcPassword = gravitino

    # Enable Iceberg REST service
    gravitino.auxService.names = iceberg-rest

    # Iceberg REST service detailed configuration
    gravitino.iceberg-rest.classpath = iceberg-rest-server/libs, iceberg-rest-server/conf
    gravitino.iceberg-rest.host = 0.0.0.0
    gravitino.iceberg-rest.httpPort = 9001

    # Iceberg catalog backend configuration
    gravitino.iceberg-rest.catalog-backend = jdbc
    gravitino.iceberg-rest.uri = jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.iceberg-rest.jdbc-driver = org.h2.Driver
    gravitino.iceberg-rest.jdbc-user = iceberg
    gravitino.iceberg-rest.jdbc-password = iceberg123
    gravitino.iceberg-rest.jdbc-initialize = true
    gravitino.iceberg-rest.warehouse = s3://gravitino-iceberg-demo/warehouse
    gravitino.iceberg-rest.io-impl = org.apache.iceberg.aws.s3.S3FileIO
    gravitino.iceberg-rest.s3-region = us-west-2

    # Enable Vended-Credentials functionality
    # Note: Gravitino uses these AK/SK to call STS AssumeRole and obtain temporary credentials for distribution to clients
    gravitino.iceberg-rest.credential-providers = s3-token
    gravitino.iceberg-rest.s3-access-key-id = YOUR_AWS_ACCESS_KEY_ID
    gravitino.iceberg-rest.s3-secret-access-key = YOUR_AWS_SECRET_ACCESS_KEY
    gravitino.iceberg-rest.s3-role-arn = arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access
    gravitino.iceberg-rest.s3-region = us-west-2
    gravitino.iceberg-rest.s3-token-expire-in-secs = 3600
    ```

2. Start Service

    ```bash
    # Start Gravitino service
    ./bin/gravitino.sh start

    # Check service status
    ./bin/gravitino.sh status

    # View logs
    tail -f logs/gravitino-server.log
    ```

3. Verify Service Status

    ```bash
    # Verify main service
    curl -v http://localhost:8090/api/version

    # Verify Iceberg REST service
    curl -v http://localhost:9001/iceberg/v1/config
    ```

### 2.4 Create Gravitino Metadata Structure

Create necessary metadata structures through REST API:

```bash
# Create MetaLake
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lakehouse",
    "comment": "Gravitino lakehouse for Doris integration",
    "properties": {}
  }' http://localhost:8090/api/metalakes

# Create Iceberg Catalog
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iceberg_catalog",
    "type": "RELATIONAL",
    "provider": "lakehouse-iceberg",
    "comment": "Iceberg catalog with S3 storage and vended credentials",
    "properties": {
      "catalog-backend": "jdbc",
      "uri": "jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL",
      "jdbc-user": "iceberg",
      "jdbc-password": "iceberg123",
      "jdbc-driver": "org.h2.Driver",
      "jdbc-initialize": "true",
      "warehouse": "s3://gravitino-iceberg-demo/warehouse",
      "io-impl": "org.apache.iceberg.aws.s3.S3FileIO",
      "s3-region": "us-west-2"
    }
  }' http://localhost:8090/api/metalakes/lakehouse/catalogs
```

## 3. Doris Connection to Gravitino

### 3.1 Using Vended Credentials

Gravitino will dynamically generate and distribute temporary credentials to Doris:

```sql
-- Create dynamic credential mode Catalog
CREATE CATALOG gravitino_vending PROPERTIES (
    'type' = 'iceberg',
    'warehouse' = 'warehouse',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 3.2 Verify Connection and Data Operations

```sql
-- Verify connection
SHOW DATABASES FROM gravitino_vending;

-- Switch to vended credentials catalog
SWITCH gravitino_vending;

-- Create database and table
CREATE DATABASE demo;
USE gravitino_vending.demo;

CREATE TABLE gravitino_table (
    id INT,
    name STRING
)
PROPERTIES (
    'write-format' = 'parquet'
);

-- Insert test data
INSERT INTO gravitino_table VALUES (1, 'Doris'), (2, 'Gravitino');

-- Query verification
SELECT * FROM gravitino_table;
```

## Summary

Through this guide, you should be able to successfully build a modern lakehouse architecture based on Gravitino and Doris. This architecture not only provides high performance and high availability but also ensures security and compliance of data access through advanced security mechanisms. As data scales grow and business requirements change, this architecture can flexibly scale to meet various enterprise-level needs.
