---
{
    "title": "AWS 认证和鉴权",
    "language": "zh-CN"
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

Doris 支持两种 AWS 认证、鉴权方式访问 AWS 服务，`IAM User`和`Assumed Role`，本文介绍如何配置这两种认证、鉴权方式的 AWS 安全凭证并通过安全凭证使用Doris相关的功能来访问AWS的服务资源。

# 认证方式介绍

## IAM User 认证鉴权

Doris 支持通过 配置`AWS IAM User`的方式来实现对外部数据源的访问（即`access_key`和`secret_key`密钥的方式），详细的配置步骤如下(更详细的介绍请参见 AWS 官网文档 [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html))：

### Step1 登录AWS控制台创建IAM User并配置IAM策略

1. 登录 `AWS控制台` 选择 `Create user` 按钮

![](/images/integrations/create_iam_user.png)

2. 填写好IAM user名字后，在`Set pemissions`部分选择直接附加策略

![](/images/integrations/iam_user_attach_policy1.png)

3. 在策略编辑器中填入对应的AWS资源策略，下文以访问S3 Bucket资源为例列出了读/写策略的常见模板

![](/images/integrations/iam_user_attach_policy2.png)

S3 Bucket读策略模版，适用于只需读取和列出bucket中对象的Doris功能，比如S3 Load， TVF，External Catalog等

**注意:&#x20;**

1. **替换对应的bucket name和prefix路径**

2. **不要添加多余的“/”分割符**

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

S3 Bucket写策略模板, 适用于需要读取、列出和写入bucket对象的Doris功能，比如Export， Storage Vault， Resource，Repository等

**注意:&#x20;**

1. **替换对应的bucket name和prefix路径**

2. **不要添加多余的“/”分割符**

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

4. 创建IAM User成功后，创建access/secret key密钥

![](/images/integrations/iam_user_create_ak_sk.png)

### Step2 通过访问密钥和SQL语句使用Doris对应功能

完成上述Step1中的所有配置后，可获得`access_key`和`secret_key`访问密钥，通过访问密钥可以使用Doris对应的功能，具体例子如下：

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


您可以在不同业务逻辑里指定不同的 IAM User 的 `access_key` 和 `secret_key`，从而实现外部数据的访问控制。

## Assumed Role 认证鉴权

Assumed Role 支持通过担任 AWS IAM Role 来实现对外部数据源的访问认证和鉴权(详细的介绍请参见 AWS 官网文档 [代入角色](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html))，下图列出了Assumed Role所需要配置的简要流程:

![](/images/integrations/assumed_role_flow.png)

名词介绍:

`源账户(Source Account)`​: 发起 Assume Role 的 AWS 账户(本例中是Doris FE/BE EC2机器所属账户);

`目标账户(Target Account)`​: 拥有目标 S3 Bucket 的 AWS 账户;

`ec2_role`:  源账户创建的Role，并且需要绑定到每一个部署Doris FE/BE 部署EC2机器上;

`bucket_role`: 目标账户创建的Role，并且需要关联目标bucket权限;

**注意:&#x20;**

1. **源账户和目标账户可以是同一个AWS账户;**
2. **请确保所有Doris FE/BE 部署所在的 EC2机器都绑定到了`ec_role`上，尤其是扩容的时候。**

更详细的配置步骤如下：

### Step1 准备工作

1. 请确保源账户创建了一个`ec2_role`，Doris FE/BE 部署的EC2机器都绑定到了新创建的`ec2_role`;

2. 请确保目标账户创建了一个`bucket_role`和对应的bucket;

EC2机器绑定`ec2_role`成功后， `role_arn`查询如下图所示:

![](/images/integrations/ec2_instance.png)

### Step2 配置源账户IAM角色( EC2 实例关联角色) 权限策略

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles`;
2. 找到 `EC2` 实例关联角色，单击角色名称；
3. 在角色详情页的 `Permissions`  区域, 单击 `Add permissions` 并选择 `Create inline policy`；
4. 在 `Specify permissions` 步骤， 单击 JSON 页签，然后填入如下策略，最后，单击 `Review policy`；

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

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles` 找到 `Assumed Target Role`，单击角色名称 在角色详情页上;
2. 单击 `Trust relationships` 页签，然后在 `Trust relationships` 页签上单击 `Edit trust policy`。在 `Edit trust policy` 页面中填入如下JSON。最后，单击 `Update policy`(需要把下面策略中的 `<ec2_iam_role_arn>` 替换为 EC2 实例关联角色的 ARN);

![](/images/integrations/target_role_trust_policy.png)

**注意: Condition部分中的ExternalId是可选的字符串配置，用于区分需要使用多个源用户assume 同一个role的情况，如果配置了请在对应doris sql语句中填入该配置，关于ExternalId 的详细介绍，请参照[aws 官方文档](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)**

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

3. 在角色详情页的 `Permissions` 区域，单击 `Add permissions` 并选择 `Create inline policy`,在 Specify permissions 步骤, 单击 JSON 页签，输入如下JSON策略配置; 最后，单击 Review policy;

![](/images/integrations/target_role_permission2.png)

S3 Bucket读策略模版，适用于只需读取和List bucket中对象的Doris功能，比如S3 Load， TVF，External Catalog等

**注意:&#x20;**

1. **替换对应的bucket name和prefix路径**

2. **不要添加多余的“/”分割符**

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

S3 Bucket写策略模板, 适用于需要往bucket中读取和写入对象的Doris功能，比如Export， Storage Vault， Resource，Repository等

**注意:&#x20;**

1. **替换对应的bucket name和prefix路径**

2. **不要添加多余的“/”分割符**

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

### Step4 通过`role_arn`和`external_id`字段使用Doris对应SQL功能

通过上述配置步骤完成assume role需要的权限配置后，可得到一个目标账户的`role_arn`信息和`external_id` (如有)，

接下来分别介绍如何通过`arn_role`和`external_id`字段使用Doris对应功能的sql语法， 主要关注如下两个字段：

```sql
"s3.role_arn" = "<your-target-role-arn>",
"s3.external_id" = "<your-external-id>"      -- 可选参数
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
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- 可选参数
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
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- 可选参数
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
      "s3.role_arn" = "<your-target-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- 可选参数
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
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- 可选参数
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
    "s3.role_arn" = "<your-target-role-arn>",
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
    "s3.role_arn" = "<your-target-role-arn>",
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
    "s3.role_arn" = "<your-target-role-arn>",
    "s3.external_id" = "<your-external-id>"
);
```

