---
{
    "title": "AWS authentication and authorization",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris supports accessing AWS service resources through two authentication methods: ​​`IAM User`​​ and `​​Assumed Role`​​. This article explains how to configure security credentials for both methods and use Doris features to interact with AWS services.

# Authentication Methods Overview

## IAM User Authentication

Doris enables access to external data sources by configuring `AWS IAM User` credentials(equal to `access_key` and `secret_key`), below are the detailed configuration steps(for more information, refer to the AWS doc [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)):

### Step1 create an IAM User and configure policies

1. Login to the `AWS Console` and create an `IAM User`​

![](/images/integrations/create_iam_user.png)

2. Enter the IAM User name and attach policies directly​

![](/images/integrations/iam_user_attach_policy1.png)

3. Define AWS resource policies in the policy editor​​, below are read/write policy templates for accessing an S3 bucket

![](/images/integrations/iam_user_attach_policy2.png)

S3 read policy template​，applies to Doris features requiring read/list access, e.g: S3 Load, TVF, External Catalog

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

S3 Load
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

TVF
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

External Catalog
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

Storage Vault
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

Export
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

Repository
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

Resource
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

**Note: The source and target accounts can be the same AWS account**

`ec2_role`: A role created in the source account, attached to EC2 instances running Doris FE/BE;

`bucket_role`: A role created in the target account with permissions to access the target bucket;

​​More detailed configuration steps are as follows:​

### Step1 Prerequisites

1. Ensure the source account has created an `ec2_role` and attached it to all `EC2 instances` running Doris FE/BE;

2. Ensure the target account has created a `bucket_role` and corresponding bucket;

After attaching `ec2_role` to `EC2 instances`, you can find the `role_arn` as shown below:

![](/images/integrations/ec2_instance.png)

### Step2 Configure Permissions for Source Account IAM Role (EC2 Instance Role)

1. Log in to the [AWS IAM Console](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，navigate to ​​`Access management` > `Roles`；
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

S3 read policy template​，applies to Doris features requiring read/list access, e.g: S3 Load, TVF, External Catalog

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

#### Step4 Use doris features with Assumed Role via SQL, according to `role_arn` and `external_id` fields;

After completing the above configurations, obtain the target account's `role_arn` and `external_id` (if applicable). 
Use these parameters in doris SQL statements as shown below:

Common important key parameters:​​
```sql
"s3.role_arn" = "<your-target-role-arn>",
"s3.external_id" = "<your-external-id>"      -- option parameter
```

S3 Load
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
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

TVF
```SQL
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  )
```

External Catalog
```SQL
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- option parameter
  );
```

Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- option parameter
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

Export
```SQL
EXPORT TABLE s3_test TO "s3://your_bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>"
)
```

Repository
```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://your_bucket/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

Resource
```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```


