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

Doris 支持两种 AWS 认证和鉴权方式访问 AWS 服务，IAM User和Assumed Role， 本文介绍如何配置这两种认证和鉴权方式的 AWS 安全凭证。

# 认证方式介绍

## IAM User 认证鉴权

Doris 支持通过 AWS IAM User 来实现对外部数据源的访问认证和鉴权, 即access_key和secret_key密钥的方式，具体配置步骤如下(详细的介绍请参见 AWS 官网文档 [IAM USER](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html))：

### Step1 登录AWS控制台创建IAM User并配置IAM策略

1. 登录AWS控制台选择Create user按钮

![](/images/integrations/create_iam_user.png)

2. 选择直接附加策略

![](/images/integrations/iam_user_attach_policy1.png)

3. 在策略编辑器中填入对应的AWS资源策略，下文S3 Bucket为例列出了读/写策略的常见模板

![](/images/integrations/iam_user_attach_policy2.png)

S3 Bucket读策略模版(注意替换对应的bucket name和prefix路径)
```JSON
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
            "Condition": {
                "StringLike": {
                    "s3:prefix": [
                        "<prefix>/*"
                    ]
                }
            }
        }
    ]
}
```

S3 Bucket写策略模板
```JSON
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
            "Resource": "arn:aws:s3:::<bucket>",
            "Condition": {
                "StringLike": {
                    "s3:prefix": [
                        "<prefix>/*"
                    ]
                }
            }
        }
    ]
}
```

4. 创建IAM User成功后，创建访问密钥

![](/images/integrations/iam_user_create_ak_sk.png)

### Step2 通过访问密钥和SQL语句使用Doris对应功能

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
      "s3.access_key" = "<your-ak>",
      "s3.secret_key" = "<your-sk>"
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
      's3.access_key' = '<your-ak>',
      's3.secret_key'='<your-sk>'
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
      's3.access_key' = '<your-ak>',
      's3.secret_key' = '<your-sk>'
  );
```
......

您可以在不同 业务逻辑 里指定不同的 IAM User 的 Access Key 和 Secret Key，从而实现外部数据的访问控制。

## Assumed Role 认证鉴权

Assumed Role 支持通过担任 AWS IAM Role 来实现对外部数据源的访问认证和鉴权，配置图示如下图，详细步骤如下文(参见 AWS 官网文档[代入角色](https://docs.aws.amazon.com/zh_cn/awscloudtrail/latest/userguide/cloudtrail-sharing-logs-assume-role.html)):

![](/images/integrations/assumed_role_flow.png)

### Step1 准备工作

源账户（Source Account）​：发起 Assume Role 的 AWS 账户（本例中是Doris FE/BE EC2机器所属账户）。
目标账户（Target Account）​：拥有目标 S3 Bucket 的 AWS 账户。

注意：源账户和目标账户可以是同一个AWS账户

1. 请确保源账户创建了一个ec2_role，Doris FE/BE 部署EC2机器都绑定到新创建的ec2_role
2. 请确保目标账户创建了一个bucket_role和对应的bucket

![](/images/integrations/ec2_instance.png)

### Step2 配置源账户IAM角色( EC2 实例关联角色) 权限策略

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 Access management > Roles；
2. 找到 EC2 实例关联角色，单击角色名称；
3. 在角色详情页的 Permissions  区域，单击 Add permissions 并选择 Create inline policy；
4. 在 Specify permissions 步骤， 单击 JSON 页签，然后填入如下策略，最后，单击 Review policy；

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

### Step3 配置目标账户IAM角色信任策略和权限策略

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 Access management > Roles 找到 Assumed Target Role，单击角色名称 在角色详情页上；
2. 单击 Trust relationships 页签，然后在 Trust relationships 页签上单击 Edit trust policy。在 Edit trust policy 页面中填入如下JSON。最后，单击 Update policy（需要把下面策略中的 `<ec2_iam_role_arn>` 替换为 EC2 实例关联角色的 ARN）；

![](/images/integrations/target_role_trust_policy.png)

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

3. 在角色详情页的 Permissions 区域，单击 Add permissions 并选择 Create inline policy，在 Specify permissions 步骤， 单击 JSON 页签，输入如下JSON策略配置，最后，单击 Review policy。

![](/images/integrations/target_role_permission2.png)

S3 Bucket读策略模版(注意替换对应的bucket name和prefix路径)
```JSON
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
            "Condition": {
                "StringLike": {
                    "s3:prefix": [
                        "<prefix>/*"
                    ]
                }
            }
        }
    ]
}
```

S3 Bucket写策略模板
```JSON
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
            "Resource": "arn:aws:s3:::<bucket>",
            "Condition": {
                "StringLike": {
                    "s3:prefix": [
                        "<prefix>/*"
                    ]
                }
            }
        }
    ]
}
```

### Step4 通过role_arn和SQL语句使用Doris对应功能

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
      "s3.external_id" = "<your-external-id>"      -- 可选参数
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
      "s3.external_id" = "<your-external-id>"      -- 可选参数
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
      "s3.external_id" = "<your-external-id>"      -- 可选参数
  );
```

Storage Vault
```SQL
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- 可选参数
    "s3.region" = "us-east-1",
    "s3.root.path" = "s3_demo_vault_prefix",
    "s3.bucket" = "xxxxxx",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

Export
```SQL
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
    "column_separator"="\\x07", 
    "line_delimiter" = "\\x07"
) WITH S3 (
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>",
)
```

Repository
```SQL
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>", 
);
```

Resource
```SQL
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "bucket4",
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>",
);
```

