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

# 配置 AWS 认证信息

Doris 支持两种 AWS 认证和鉴权方式访问 AWS 服务：IAM User、 Assumed Role 本文介绍如何配置这两种认证和鉴权方式的 AWS 安全凭证。

## 认证方式介绍

### IAM User 认证鉴权

IAM User 支持通过 AWS IAM User 来实现对外部数据源的访问认证和鉴权。参见 AWS 官网文档 [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)。

  举例: S3 Load
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
        "s3.endpoint" = "s3.us-west-2.amazonaws.com",  
        "s3.region" = "us-west-2",
        "s3.access_key" = "<your-ak>",
        "s3.secret_key" = "<your-sk>"
    )
    PROPERTIES
    (
        "timeout" = "3600"
    );
  ```

  举例: TVF
  ```SQL
    SELECT * FROM S3 (
        'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
        'format' = 'parquet',
        's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
        's3.region' = 'us-east-1',
        's3.access_key' = '<your-ak>',
        's3.secret_key'='<your-sk>'
    )
  ```

  举例: 外表
  ```SQL
    CREATE CATALOG iceberg_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hadoop',
        'warehouse' = 's3://bucket/dir/key',
        's3.endpoint' = 's3.us-east-1.amazonaws.com',
        's3.region' = 'us-east-1',
        's3.access_key' = '<your-ak>',
        's3.secret_key' = '<your-sk>'
    );
  ```

<!--您可以在不同 业务逻辑 里指定不同的 IAM User 的 Access Key 和 Secret Key，从而实现外部数据的访问控制。-->

### Assumed Role 认证鉴权

Assumed Role 支持通过担任 AWS IAM Role 来实现对外部数据源的访问认证和鉴权。参见 AWS 官网文档[代入角色](https://docs.aws.amazon.com/zh_cn/awscloudtrail/latest/userguide/cloudtrail-sharing-logs-assume-role.html)。

#### 准备工作

​源账户（Source Account）​：发起 Assume Role 的 AWS 账户（本例中是Doris FE/BE EC2机器所属账户）。

​目标账户（Target Account）​：拥有 S3 Bucket 的 AWS 账户。


首先，找到 Doris 集群所在 EC2 实例所关联的 IAM 角色（以下简称“EC2 实例关联角色”），并获取该角色的 ARN 。

    在EC2 实例上执行如下命令:
    ```
    aws ec2 describe-instances --instance-ids <your-instance-id>
    ```

    结果输出:
    ```
    "IamInstanceProfile": {
        "Arn": "arn:aws:iam::123456789012:instance-profile/YourRoleName",
        "Id": "AIPAIEXAMPLE"
    }
    ```

#### 在目标账户中创建 IAM 角色并添加信任策略

请按如下步骤在目标账户中创建并配置 IAM 角色：

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)。
2. 在左侧导航栏选择 **Access management** > **Roles**。
3. 找到 Assumed Role，单击角色名称。
4. 在角色详情页上，单击 **Trust relationships** 页签，然后在 **Trust relationships** 页签上单击 **Edit trust policy**。
5. 在 **Edit trust policy** 页面上，删掉当前的 JSON 格式策略，然后拷贝并粘贴如下策略。注意您需要把下面策略中的 `<ec2_iam_role_arn>` 替换为 EC2 实例关联角色的 ARN。最后，单击 **Update policy**。

   ```JSON
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": "<ec2_iam_role_arn>"
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

#### 配置目标账户下 S3 Bucket 策略

根据使用到的Doris功能, 配置目标账户bucket的 **只读** 或者 **读写** bucket策略

读写bucket策略例子:

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
                    "s3:DeleteObjectVersion"
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

只读bucket策略例子:

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

#### 配置源账户( EC2 实例关联角色) 策略

请按如下步骤配置 EC2 实例关联角色(源账户)：

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)。
2. 在左侧导航栏选择 **Access management** > **Roles**。
3. 找到 EC2 实例关联角色，单击角色名称。
4. 在角色详情页的 **Permissions policies** 区域，单击 **Add permissions** 并选择 **Create inline policy**。
5. 在 **Specify permissions** 步骤， 单击 **JSON** 页签，删掉当前的 JSON 格式策略，然后拷贝并粘贴如下策略。最后，单击 **Review policy**。

   ```JSON
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": ["sts:AssumeRole"],
               "Resource": "arn:aws:iam::<目标账户ID>:role/<目标角色名称>"
           }
       ]
   }
   ```

完成如上配置后，可通过role arn的方式使用Doris对应功能

  举例: S3 Load
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
        's3.region' = 'us-east-1',
        "s3.role_arn" = "xxxx",
        "s3.external_id" = "xxxx"      -- 可选参数
    )
    PROPERTIES
    (
        "timeout" = "3600"
    );
  ```

  举例: TVF
  ```SQL
    SELECT * FROM S3 (
        'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
        'format' = 'parquet',
        's3.region' = 'us-east-1',
        "s3.role_arn" = "xxxx",
        "s3.external_id" = "xxxx"      -- 可选参数
    )
  ```

  举例: 外表
  ```SQL
    CREATE CATALOG iceberg_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hadoop',
        'warehouse' = 's3://bucket/dir/key',
        's3.region' = 'us-east-1',
        "s3.role_arn" = "xxxx",
        "s3.external_id" = "xxxx"      -- 可选参数

    );
  ```


