---
{
    "title": "AWS authentication and authorization",
    "language": "en"
}
---

Doris supports accessing AWS service resources through two authentication methods: ​​`IAM User`​​ and `​​Assumed Role`​​. This article explains how to configure security credentials for both methods and use Doris features to interact with AWS services.

# Authentication Methods Overview

## IAM User Authentication

Doris enables access to external data sources by configuring `AWS IAM User` credentials(equal to `access_key` and `secret_key`), below are the detailed configuration steps(for more information, refer to the AWS doc [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)):

### Step1 Create an IAM User and configure policies

1. Login to the `AWS Console` and create an `IAM User`​

![](/images/integrations/create_iam_user.png)

2. Enter the IAM User name and attach policies directly​

![](/images/integrations/iam_user_attach_policy1.png)

3. Define AWS resource policies in the policy editor​​, below are read/write policy templates for accessing an S3 bucket

![](/images/integrations/iam_user_attach_policy2.png)

S3 read policy template​,applies to Doris features requiring read/list access, e.g: S3 Load, TVF, External Catalog

**Notes:&#x20;**

1. **Replace `your-bucket` and `your-prefix` with actual values.**

2. **Avoid adding extra `/` separators.**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion",
            ],
            "Resource": "arn:aws:s3:::<your-bucket>/your-prefix/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>"
        }    
    ]
}
```

S3 write policy template​​ (Applies to Doris features requiring read/write access, e.g: Export, Storage Vault, Repository)

**Notes:&#x20;**

1. **Replace `your-bucket` and `your-prefix` with actual values.**

2. **Avoid adding extra `/` separators.**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>/<your-prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning",
                "s3:GetLifecycleConfiguration"
            ],
            "Resource": "arn:aws:s3:::<your-bucket>"
        }    
    ]
}
```

4. After successfully creating the IAM User, create access/secret key pair

![](/images/integrations/iam_user_create_ak_sk.png)

### Step2 Use doris features with access/secret key pair via SQL

After completing all configurations in Step 1, you will obtain `access_key` and `secret_key`. Use these credentials to access doris features as shown in the following examples:

#### S3 Load
```SQL
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key" = "<your-secrety-key>"
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

#### TVF
```SQL
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 's3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```

#### External Catalog
```SQL
  CREATE CATALOG iceberg_catalog PROPERTIES (
      'type' = 'iceberg',
      'iceberg.catalog.type' = 'hadoop',
      'warehouse' = 's3://your_bucket/dir/key',
      's3.endpoint' = 's3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  );
```

#### Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

#### Export
```SQL
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>",
)
```

#### Repository
```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

#### Resource
```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key"="<your-secret-key>"
);
```

You can specify different IAM User credentials (`access_key` and `secret_key`) across different business logic to implement access control for external data.

## Assumed Role Authentication

Assumed Role allows accessing external data sources by assuming an AWS IAM Role(for details, refer to AWS documentation [assume role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html)), the following diagram illustrates the configuration workflow:

![](/images/integrations/assumed_role_flow.png)

Terminology:

`Source Account`: The AWS account initiating the Assume Role action (where Doris FE/BE EC2 instances reside);

`Target Account`: The AWS account owning the target S3 bucket;

`ec2_role`: A role created in the source account, attached to EC2 instances running Doris FE/BE;

`bucket_role`: A role created in the target account with permissions to access the target bucket;

**Notes:&#x20;**

1. **The source and target accounts can be the same AWS account;**
2. **Ensure All EC2 instances which Doris FE/BE deployed have been attached on `ec_role​`​, especially during scaling operations.**

​​More detailed configuration steps are as follows:​

### Step1 Prerequisites

1. Ensure the source account has created an `ec2_role` and attached it to all `EC2 instances` running Doris FE/BE;

2. Ensure the target account has created a `bucket_role` and corresponding bucket;

After attaching `ec2_role` to `EC2 instances`, you can find the `role_arn` as shown below:

![](/images/integrations/ec2_instance.png)

### Step2 Configure Permissions for Source Account IAM Role (EC2 Instance Role)

1. Log in to the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home),navigate to ​​`Access management` > `Roles`；
2. Find the EC2 instance role and click its name;
3. On the role details page, go to the ​​`Permissions`​​ tab, click ​​`Add permissions`​​, then select `​​Create inline policy`​​;
4. In the ​​`Specify permissions​​ section`, switch to the `​​JSON`​​ tab, paste the following policy, and click ​​`Review policy`​​:

![](/images/integrations/source_role_permission.png)

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["sts:AssumeRole"],
            "Resource": "*"
        }
    ]
}
```

### Step3 Configure Trust Policy and Permissions for Target Account IAM Role

1. Log in [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home), navigate to ​​Access management > Roles​​, find the target role (bucket_role), and click its name;

2. Go to the `​​Trust relationships`​​ tab, click `​​Edit trust policy`​​, and paste the following JSON (replace <ec2_iam_role_arn> with your EC2 instance role ARN). Click ​​Update policy

![](/images/integrations/target_role_trust_policy.png)

**Note: The `ExternalId` in the `Condition` section is an optional string parameter used to distinguish scenarios where multiple source users need to assume the same role. If configured, include it in the corresponding Doris SQL statements. For a detailed explanation of ExternalId, refer to [aws doc](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)**

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "<ec2_iam_role_arn>"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "1001"
                }
            }
        }
    ]
}
```

3. On the role details page, go to the ​​`Permissions`​​ tab, click `​​Add permissions`​​, then select `​​Create inline policy`​​. In the `​​JSON`​​ tab, paste one of the following policies based on your requirements;

![](/images/integrations/target_role_permission2.png)

S3 read policy template​,applies to Doris features requiring read/list access, e.g: S3 Load, TVF, External Catalog

**Notes:&#x20;**

1. **Replace `your-bucket` and `your-prefix` with actual values.**

2. **Avoid adding extra `/` separators.**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

S3 write policy template​​ (Applies to Doris features requiring read/write access, e.g: Export, Storage Vault, Repository)

**Notes:&#x20;**

1. **Replace `your-bucket` and `your-prefix` with actual values.**

2. **Avoid adding extra `/` separators.**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:DeleteObject",
              "s3:DeleteObjectVersion",
              "s3:AbortMultipartUpload",      
              "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>"
        }
    ]
}
```

### Step4 Use doris features with Assumed Role via SQL, according to `role_arn` and `external_id` fields

After completing the above configurations, obtain the target account's `role_arn` and `external_id` (if applicable). 
Use these parameters in doris SQL statements as shown below:

Common important key parameters:​​
```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- option parameter
```

#### S3 Load
```SQL
  LOAD LABEL s3_load_2022_04_01
  (
      DATA INFILE("s3://your_bucket_name/s3load_example.csv")
      INTO TABLE test_s3load
      COLUMNS TERMINATED BY ","
      FORMAT AS "CSV"
      (user_id, name, age)
  )
  WITH S3
  (
      "provider" = "S3",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

#### TVF
```SQL
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
```

#### External Catalog
```SQL
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  );
```

#### Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- option parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

#### Export
```SQL
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```

#### Repository
```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

#### Resource
```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

### AWS EKS Cluster IAM Role Authentication and Authorization

For applications (such as Apache Doris) running in an Amazon EKS cluster that need to be granted AWS Identity and Access Management (IAM) permissions, Amazon EKS provides the following two primary methods:

**1.IAM Roles for Service Accounts (IRSA)​**

**2. EKS Pod Identity​**

Both methods require correct configuration of the IAM Role, corresponding trust policy, and IAM policy in the EKS cluster. For specific configuration methods, please refer to the AWS official documentation:

[Granting AWS Identity and Access Management permissions to workloads on Amazon Elastic Kubernetes Service clusters](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)

Doris FE/BE supports automatically detecting and obtaining credentials via the `AWSCredentialsProviderChain` method.

### Bucket Policy Authentication and Authorization

For Doris machines deployed using IAM Roles, import, export, and TVF scenarios also support using Amazon S3 bucket policies to control access to objects in AWS S3 buckets. This allows restricting access to the object bucket only to users associated with the EC2 machine. The specific steps are as follows:

1、Set the Bucket Policy for the target bucket.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": "arn:aws:s3:::<bucket>/<prefix>/*"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::111122223333:root"
                ]
            },
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::<bucket>",
        }
    ]
}
```

Please replace `arn:aws:iam::111122223333:root` with the ARN of the account or Role bound to the EC2 machine.

2、Use the corresponding SQL syntax for data access. Authentication credentials are automatically detected, no manual AK/SK or ARN configuration required.

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

Doris FE/BE supports automatically detecting and obtaining credentials via the `AWSCredentialsProviderChain` method.

Reference documentation: [Bucket Policy](https://docs.aws.amazon.com/zh_cn/AmazonS3/latest/userguide/example-bucket-policies.html)

### Best Practices for Authentication Methods
| Authentication Method                                       | Applicable Scenarios                                   | Advantages | Disadvantages |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| AK/SK Authentication | Import/Export/StorageVault scenarios with privately deployed, security-controlled storage or non-AWS S3 object storage. | Simple configuration, supports object storage compatible with AWS S3. | Risk of secret key leakage; manual key rotation required.     |
| IAM Role Authentication | Import/Export/StorageVault scenarios on AWS S3 public cloud with high-security requirements. | High security, automatic AWS credential rotation, centralized permission configuration. | Complex Bucket Policy/Trust configuration process. |
| Bucket Policy Authentication | Import/Export/StorageVault scenarios on AWS S3 public cloud with a small number of buckets | Moderate configuration complexity, adheres to the principle of least privilege, automatically detects AWS credentials. | Permission configuration is scattered across various bucket policies.     |

### FAQ

#### 1. How to set AWS SDK DEBUG level logs for BE and Recycler?
Configure aws_log_level=5 in be.conf and doris_cloud.conf, then restart the processes to apply the changes.
* Type: int32
* Description: Log level for AWS SDK
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* Default value: 2

#### 2.After setting AWS SDK DEBUG level logs, the following error appears in be.log/recycler.log:
`OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443 `

Check whether the AWS VPC network configuration or firewall port settings have issues preventing access to the STS service in the corresponding AWS region (verify connectivity via telnet host:port).

