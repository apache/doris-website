---
{
    "title": "AWS 认证和鉴权",
    "language": "zh-CN",
    "description": "Doris 支持两种 AWS 认证、鉴权方式访问 AWS 服务，IAM User和Assumed Role，本文介绍如何配置这两种认证、鉴权方式的 AWS 安全凭证并通过安全凭证使用 Doris 相关的功能来访问 AWS 的服务资源。"
}
---

Doris 支持两种 AWS 认证、鉴权方式访问 AWS 服务，`IAM User`和`Assumed Role`，本文介绍如何配置这两种认证、鉴权方式的 AWS 安全凭证并通过安全凭证使用 Doris 相关的功能来访问 AWS 的服务资源。

## 认证方式介绍

### IAM User 认证鉴权

Doris 支持通过 配置`AWS IAM User`的方式来实现对外部数据源的访问（即`access_key`和`secret_key`密钥的方式），详细的配置步骤如下 (更详细的介绍请参见 AWS 官网文档 [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html))：

#### Step1 登录 AWS 控制台创建 IAM User 并配置 IAM 策略

1. 登录 `AWS控制台` 选择 `Create user` 按钮

![](/images/integrations/create_iam_user.png)

2. 填写好 IAM user 名字后，在`Set pemissions`部分选择直接附加策略

![](/images/integrations/iam_user_attach_policy1.png)

3. 在策略编辑器中填入对应的 AWS 资源策略，下文以访问 S3 Bucket 资源为例列出了读/写策略的常见模板

![](/images/integrations/iam_user_attach_policy2.png)

S3 Bucket 读策略模版，适用于只需读取和列出 bucket 中对象的 Doris 功能，比如 S3 Load，TVF，External Catalog 等

**注意:&#x20;**

1. **替换对应的 bucket name 和 prefix 路径**

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

S3 Bucket 写策略模板，适用于需要读取、列出和写入 bucket 对象的 Doris 功能，比如 Export，Storage Vault，Resource，Repository 等

**注意:&#x20;**

1. **替换对应的 bucket name 和 prefix 路径**

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

4. 创建 IAM User 成功后，创建 access/secret key 密钥

![](/images/integrations/iam_user_create_ak_sk.png)

#### Step2 通过访问密钥和 SQL 语句使用 Doris 对应功能

完成上述 Step1 中的所有配置后，可获得`access_key`和`secret_key`访问密钥，通过访问密钥可以使用 Doris 对应的功能，具体例子如下：

**S3 Load**

```sql
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

**TVF**

```sql
  SELECT * FROM S3 (
      'uri' = 's3://your_bucket/path/to/tvf_test/test.parquet',
      'format' = 'parquet',
      's3.endpoint' = 's3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      "s3.access_key" = "<your-access-key>",
      "s3.secret_key"="<your-secret-key>"
  )
```

**External Catalog**

```sql
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

**Storage Vault**

```sql
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

**Export**

```sql
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

**Repository**

```sql
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

**Resource**

```sql
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

### Assumed Role 认证鉴权

Assumed Role 支持通过担任 AWS IAM Role 来实现对外部数据源的访问认证和鉴权 (详细的介绍请参见 AWS 官网文档 [代入角色](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html))，下图列出了 Assumed Role 所需要配置的简要流程：

![](/images/integrations/assumed_role_flow.png)

名词介绍：

`源账户(Source Account)`: 发起 Assume Role 的 AWS 账户 (本例中是 Doris FE/BE EC2 机器所属账户);

`目标账户(Target Account)`: 拥有目标 S3 Bucket 的 AWS 账户;

`ec2_role`:  源账户创建的 Role，并且需要绑定到每一个部署 Doris FE/BE 部署 EC2 机器上;

`bucket_role`: 目标账户创建的 Role，并且需要关联目标 bucket 权限;

**注意:&#x20;**

1. **源账户和目标账户可以是同一个 AWS 账户;**
2. **请确保所有 Doris FE/BE 部署所在的 EC2 机器都绑定到了`ec_role`上，尤其是扩容的时候。**

操作演示 Demo 如下：

<a href="https://www.bilibili.com/video/BV1U3uezjEPW/?vd_source=20479f0462e74fcf98f1df731639610f">
  <img src="/zh-CN/images/iam-role-doris-demo.png" alt="AWS IAM Role" />
</a>

更详细的配置步骤如下：

#### Step1 准备工作

1. 请确保源账户创建了一个`ec2_role`，Doris FE/BE 部署的 EC2 机器都绑定到了新创建的`ec2_role`;

2. 请确保目标账户创建了一个`bucket_role`和对应的 bucket;

EC2 机器绑定`ec2_role`成功后， `role_arn`查询如下图所示：

![](/images/integrations/ec2_instance.png)

#### Step2 配置源账户 IAM 角色 ( EC2 实例关联角色) 权限策略

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles`;
2. 找到 `EC2` 实例关联角色，单击角色名称；
3. 在角色详情页的 `Permissions`  区域，单击 `Add permissions` 并选择 `Create inline policy`；
4. 在 `Specify permissions` 步骤，单击 JSON 页签，然后填入如下策略，最后，单击 `Review policy`；

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

#### Step3 配置目标账户 IAM 角色信任策略和权限策略

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles` 找到 `Assumed Target Role`，单击角色名称 在角色详情页上;
2. 单击 `Trust relationships` 页签，然后在 `Trust relationships` 页签上单击 `Edit trust policy`。在 `Edit trust policy` 页面中填入如下 JSON。最后，单击 `Update policy`(需要把下面策略中的 `<ec2_iam_role_arn>` 替换为 EC2 实例关联角色的 ARN);

![](/images/integrations/target_role_trust_policy.png)

**注意：Condition 部分中的 ExternalId 是可选的字符串配置，用于区分需要使用多个源用户 assume 同一个 role 的情况，如果配置了请在对应 doris sql 语句中填入该配置，关于 ExternalId 的详细介绍，请参照[aws 官方文档](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)**

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

3. 在角色详情页的 `Permissions` 区域，单击 `Add permissions` 并选择 `Create inline policy`,在 Specify permissions 步骤，单击 JSON 页签，输入如下 JSON 策略配置; 最后，单击 Review policy;

![](/images/integrations/target_role_permission2.png)

S3 Bucket 读策略模版，适用于只需读取和 List bucket 中对象的 Doris 功能，比如 S3 Load，TVF，External Catalog 等

**注意:&#x20;**

1. **替换对应的 bucket name 和 prefix 路径**

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

S3 Bucket 写策略模板，适用于需要往 bucket 中读取和写入对象的 Doris 功能，比如 Export，Storage Vault，Resource，Repository 等

**注意:&#x20;**

1. **替换对应的 bucket name 和 prefix 路径**

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

#### Step4 通过`role_arn`和`external_id`字段使用 Doris 对应 SQL 功能

通过上述配置步骤完成 assume role 需要的权限配置后，可得到一个目标账户的`role_arn`信息和`external_id` (如有)，

接下来分别介绍如何通过`arn_role`和`external_id`字段使用 Doris 对应功能的 sql 语法，主要关注如下两个字段：

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- 可选参数
```

#### S3 Load
```sql
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
      "s3.external_id" = "<your-external-id>"      -- 可选参数
  )
  PROPERTIES
  (
      "timeout" = "3600"
  );
```

**TVF**

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- 可选参数
  )
```

**External Catalog**

```sql
  CREATE CATALOG iceberg_catalog PROPERTIES (
      "type" = "iceberg",
      "iceberg.catalog.type" = "hadoop",
      "warehouse" = "s3://your_bucket/dir/key",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1",
      "s3.role_arn" = "<your-bucket-role-arn>",
      "s3.external_id" = "<your-external-id>"      -- 可选参数
  );
```

**Storage Vault**

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.bucket" = "<your-bucket>",
    "s3.role_arn" = "<your-bucket-role-arn>",
    "s3.external_id" = "<your-external-id>",            -- 可选参数
    "s3.root.path" = "s3_demo_vault_prefix",
    "provider" = "S3",
    "use_path_style" = "false"
);
```

**Export**

```sql
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

**Repository**

```sql
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

**Resource**

```sql
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

### AWS EKS集群中IAM Role认证鉴权

对于在 Amazon EKS 集群中运行的应用（例如 Apache Doris），要授予其 AWS Identity and Access Management（IAM）权限，Amazon EKS 提供了以下两种主要方式：

**1. 服务账户的 IAM 角色 （IRSA）**

**2. EKS 容器组身份 (Pod Identity)**

这两种方式均需在 EKS 集群中正确配置IAM Role和对应的信任策略、IAM策略, 具体配置方法请参阅AWS官方文档：

[Granting AWS Identity and Access Management permissions to workloads on Amazon Elastic Kubernetes Service clusters](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)

Doris FE/BE自动通过`AWSCredentialsProviderChain`获取凭证

### Bucket Policy 认证鉴权

对于IAM Role部署的Doris机器，导入、导出、TVF的场景也支持使用 Amazon S3 存储桶策略来保护对AWS S3存储桶中的对象进行访问，
这样可以限制只有EC2机器所属用户才能访问对象存储桶，具体步骤如下：

1、设置目标存储桶的Bucket Policy

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

请将`arn:aws:iam::111122223333:root` 替换为ec2机器所绑定的账户或者Role的ARN

2、使用对应功能的SQL语法进行数据访问，不需要ak/sk，arn等信息

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

Doris FE/BE自动通过`AWSCredentialsProviderChain`获取凭证

参考文档：[Bucket Policy](https://docs.aws.amazon.com/zh_cn/AmazonS3/latest/userguide/example-bucket-policies.html)

### 鉴权方式最佳实践
| 鉴权方式                                       | 适用场景                                   | 优 点 | 缺 点 |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| AK/SK 鉴权方式 | 私有化部署安全性可控或非AWS S3的对象存储的导入/导出/StorageVault场景 | 配置简单，支持兼容AWS S3的对象存储 | 存在密钥泄漏风险，需要手动进行密钥轮换     |
| IAM Role 鉴权方式 | AWS S3公有云安全性要求较高的导入/导出/StorageVault场景 | 安全性高,自动轮换AWS凭证, 权限配置集中| 配置Bucket Policy/Trust流程复杂 |
| Bucket Policy 鉴权方式 | AWS S3公有云，bucket数量较少的导入/导出/StorageVault场景 | 配置流程复杂度适中，遵循最小权限原则，自动探测AWS凭证 | 权限配置分散在各个bucket policy中     |

### FAQ

#### 1. 如何设置`BE`和`Recycler`的Aws Sdk DEBUG级别日志?
be.conf和doris_cloud.conf配置aws_log_level=5,并重启进程生效
* 类型：int32
* 描述：AWS SDK 的日志级别
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* 默认值：2

#### 2.设置Aws Sdk DEBUG级别日志后，be.log/recycler.log报如下错误：
`OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443 `

请检查aws vpc网络配置或者防火墙端口配置是否存在问题，导致无法访问aws对应region的sts服务(可通过telnet host:port确认)