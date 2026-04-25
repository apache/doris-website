---
{
    "title": "Integration with Apache Polaris",
    "language": "en",
    "description": "As data lake technologies continue to evolve, efficiently and securely managing massive amounts of data on object storage (such as AWS S3) while "
}
---

As data lake technologies continue to evolve, efficiently and securely managing massive amounts of data on object storage (such as AWS S3) while providing a unified access point for upstream analytical engines (such as Apache Doris) has become a core challenge in modern data architecture. Apache Polaris, as Iceberg's open and standardized REST Catalog service, provides the perfect solution for this challenge. It not only handles centralized metadata management but also greatly enhances the security and manageability of data lakes through fine-grained access controls and flexible credential management mechanisms.

This article will provide a detailed introduction on how to integrate Apache Doris with Polaris to achieve efficient querying and management of Iceberg data on S3. We will guide you through the entire process from environment preparation to final querying step by step.

**Through this document, you will quickly learn:**

* **AWS Environment Preparation**: How to create and configure S3 storage buckets in AWS, and prepare necessary IAM roles and policies for both Polaris and Doris, enabling Polaris to access S3 itself and distribute access credentials to Doris.

* **Polaris Deployment and Configuration**: How to download and start the Polaris service on a server, and create Iceberg Catalog, Namespace, and corresponding Principal/Role/permissions in Polaris to provide secure metadata access endpoints for Doris.

* **Doris Connection to Polaris**: Explains how Doris obtains metadata access tokens from Polaris through OAuth2, and demonstrates two core underlying storage access methods:

  1. Temporary AK/SK issued by Polaris (Credential Vending mechanism)
  2. Doris directly using static AK/SK to access S3

> Require Doris version 3.1+

## 1. AWS Environment Preparation

Before we begin, we need to prepare S3 storage buckets and corresponding IAM roles on AWS, which forms the foundation for Polaris to manage data and Doris to access data.

### 1.1 Create S3 Storage Bucket

First, we create an S3 Bucket named `polaris-doris-demo` to store Iceberg table data that will be created later.

```bash
# Create S3 storage bucket
aws s3 mb s3://polaris-doris-demo --region us-west-2
# Verify bucket creation success
aws s3 ls | grep polaris-doris-demo
```

### 1.2 Create IAM Role for Object Storage Access

To implement secure credential management, we need to create an IAM role for Polaris to use through the STS AssumeRole mechanism. This design follows the security best practices of least privilege principle and separation of duties.

1. Create trust policy file

    Create `polaris-trust-policy.json` file:

    ```bash
    cat > polaris-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
            "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
            "StringEquals": {
                "sts:ExternalId": "polaris-doris-demo"
            }
            }
        }
        ]
    }
    EOF
    ```

    > Note: Please replace YOUR_ACCOUNT_ID with your actual AWS Account ID, which can be obtained via `aws sts get-caller-identity --query Account --output text`.

2. Create IAM Role

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```

3. Attach S3 access permission policy

    ```bash
    aws iam attach-role-policy \
        --role-name polaris-doris-demo \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. Verify creation results

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```

### 1.3 Bind IAM Role to EC2 Instance (Optional)

> If this step is not performed, you need to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY before starting Polaris

If your Polaris service will run on an EC2 instance, the best practice is to bind an IAM role to that EC2 instance rather than using access keys. This avoids hardcoding credentials in code and improves security.

1. Create trust policy for EC2 instance role

    First create a trust policy file that allows the EC2 service to assume this role:

    ```json
    cat > ec2-trust-policy.json << 'EOF'
    {
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
        }
    ]
    }
    EOF
    ```

2. Create EC2 instance role

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```

3. Attach S3 access permission policy

    ```bash
    # Attach AmazonS3FullAccess managed policy
    aws iam attach-role-policy \
        --role-name polaris-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. Create instance profile

    ```bash
    # Create instance profile
    aws iam create-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile

    # Add role to instance profile
    aws iam add-role-to-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile \
        --role-name polaris-ec2-role
    ```

5. Attach instance profile to EC2 instance

    ```bash
    # If it's a newly created EC2 instance, specify during launch
    aws ec2 run-instances \
        --image-id ami-xxxxxxxxx \
        --instance-type t3.medium \
        --iam-instance-profile Name=polaris-ec2-instance-profile \
        --other-parameters...

    # If it's an existing EC2 instance, associate instance profile
    aws ec2 associate-iam-instance-profile \
        --instance-id i-xxxxxxxxx \
        --iam-instance-profile Name=polaris-ec2-instance-profile
    ```

## 2. Polaris Deployment and Catalog Creation

After environment preparation is complete, we begin deploying the Polaris service and configuring the Catalog.

> This document uses the source code quick start method. For more deployment options, refer to: https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/

### 2.1 Clone Source Code and Start Polaris

1. Clone Polaris repository and switch to specific version

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```

2. Set AWS credentials (Optional)

    If you're not running Polaris on EC2, or the EC2 doesn't have the appropriate IAM Role bound, you need to provide Polaris with an AK/SK that has permission to assume the `polaris-doris-demo` role through environment variables.

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```

3. Compile and run Polaris

    Ensure you have Java 21+ and Docker 27+ installed.

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```

* `POLARIS` is the realm
* `root` is the `CLIENT_ID`
* `secret` is the `CLIENT_SECRET`
* If credentials are not set, it will use preset credentials `POLARIS,root,s3cr3t`

This command will start the Polaris service, listening on port `8181` by default.

### 2.2 Create Catalog and Namespace in Polaris

1. **Export ROOT credentials**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```

2. Create Catalog (pointing to S3 storage)

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```

    * `--storage-type s3`: Specifies underlying storage as S3.
    * `--default-base-location`: Default root path for Iceberg table data.
    * `--role-arn`: IAM Role used by Polaris service to assume for S3 access.
    * `--external-id`: External ID used when assuming the role, consistent with the configuration in the IAM Role trust policy.

3. Create Namespace

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```

This creates a database (Namespace) named `doris_demo` under `doris_catalog`.

### 2.3 Polaris Security Role and Permission Configuration

To allow Doris to access as a non-`root` user, we need to create a new user and role, and grant appropriate permissions.

1. Create Principal Role and Catalog Role

    ```bash
    # Create a Principal Role for aggregating permissions
    ./polaris principal-roles create doris_pr_role

    # Create a Catalog Role under doris_catalog
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```

2. Grant permissions to Catalog Role

    ```bash
    # Grant doris_catalog_role permission to manage content within this Catalog
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```

3. Associate Principal Role and Catalog Role

    ```bash
    # Assign doris_catalog_role to doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```

4. Create new Principal (user) and bind Role

    ```bash
    # Create a new user (Principal) named doris_user
    ./polaris principals create doris_user
    # Example output: {"clientId": "6e155b128dc06c13", "clientSecret": "ce9fbb4cc91c43ff2955f2c6545239d7"}
    # Please note down this new client_id and client_secret pair, as Doris will use it for connection.

    # Bind doris_user to doris_pr_role
    ./polaris principal-roles grant \
    doris_pr_role \
    --principal doris_user
    ```

At this point, all Polaris-side configuration is complete. We have created a user named `doris_user` that obtains permission to manage `doris_catalog` through `doris_pr_role`.

## 3. Doris Connection to Polaris

Now, we will create an Iceberg Catalog in Doris that connects to the newly configured Polaris service. Doris supports multiple flexible authentication combinations.

> **Note:** In this example, we use OAuth2 authentication credentials to connect to Polaris's rest service. Additionally, Doris also supports using `iceberg.rest.oauth2.token` to directly provide a pre-obtained Bearer Token.

### Method 1: OAuth2 + Temporary Storage Credentials (Credential Vending)

This is the **most recommended** approach. Doris uses OAuth2 credentials to authenticate with Polaris and obtain metadata. When needing to read/write data files on S3, Doris requests a temporary, minimally-privileged S3 access credential from Polaris.

Use the `clientId` and `clientSecret` generated for `doris_user`.

```sql
CREATE CATALOG polaris_vended PROPERTIES (
    'type' = 'iceberg',
    -- Catalog name in Polaris
    'warehouse' = 'doris_catalog',
    'iceberg.catalog.type' = 'rest',
    -- Polaris service address
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    -- Metadata authentication method
    'iceberg.rest.security.type' = 'oauth2',
    -- Replace with doris_user's client_id:client_secret
    'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Enable credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### Method 2: OAuth2 + Static Storage Credentials (AK/SK)

In this approach, Doris still uses OAuth2 to access Polaris metadata, but when accessing S3 data, it uses static AK/SK hardcoded in the Doris Catalog configuration. This method is simple to configure and suitable for quick testing, but has lower security.

```sql
CREATE CATALOG polaris_aksk PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    'iceberg.rest.warehouse' = 'doris_catalog',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '6e155b128dc06c13:ce9fbb4cc91c43ff2955f2c6545239d7',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- Directly provide S3 access keys
    's3.access_key' = 'YOUR_S3_ACCESS_KEY',
    's3.secret_key' = 'YOUR_S3_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
    's3.region' = 'us-west-2'
);
```

## 4. Verify Connection in Doris

Regardless of which method you used to create the Catalog, you can verify end-to-end connectivity through the following SQL.

```sql
-- Switch to the Catalog you created and the Namespace configured in Polaris
USE polaris_vended.doris_demo;

-- Create an Iceberg table
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- Insert data
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Polaris');

-- Query data
SELECT * FROM my_iceberg_table;
-- Expected result:
-- +------+---------+
-- | id   | name    |
-- +------+---------+
-- | 1    | Doris   |
-- | 2    | Polaris |
-- +------+---------+
```

If all the above operations can be completed successfully, congratulations! You have successfully established the complete data lake pipeline: Doris -> Polaris -> S3.

For more information on using Doris to manage Iceberg tables, please visit:

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
