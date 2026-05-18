---
{
    "title": "AWS 认证和鉴权",
    "language": "zh-CN",
    "description": "介绍 Doris 访问 AWS S3 的四种认证方式：IAM User、Assumed Role、EKS IRSA/Pod Identity 与 Bucket Policy，含完整 IAM 策略与 SQL 示例。",
    "keywords": [
        "Doris AWS 认证",
        "Doris S3 鉴权",
        "AWS IAM User",
        "AWS Assumed Role",
        "AWS sts AssumeRole",
        "EKS IRSA",
        "EKS Pod Identity",
        "S3 Bucket Policy",
        "AWSCredentialsProviderChain",
        "access_key secret_key",
        "role_arn external_id",
        "S3 Load 认证",
        "TVF S3 认证",
        "External Catalog S3 鉴权",
        "Storage Vault S3"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 / 架构选型决策 -->
<!-- 适用场景: 配置 Doris 访问 AWS S3 / 跨账号访问 S3 / EKS 集群中的 Doris 凭证管理 -->

Doris 提供多种与 AWS 集成的认证、鉴权方式，可用于 S3 Load、TVF、External Catalog、Storage Vault、Export、Repository、Resource 等需要访问 AWS S3 资源的功能。本文介绍如何配置 AWS 安全凭证，并通过这些凭证在 Doris 中访问 AWS 服务资源。

## 适用场景

Doris 支持以下四种 AWS 认证、鉴权方式，可根据部署环境与安全合规要求选择：

| 认证方式                      | 适用场景                                                              | 优点                                              | 缺点                                       |
| :--------------------------- | :------------------------------------------------------------------- | :----------------------------------------------- | :---------------------------------------- |
| IAM User（AK/SK）            | 私有化部署安全性可控，或对接非 AWS S3 的兼容对象存储（导入/导出/Storage Vault 等） | 配置简单，兼容 AWS S3 协议的对象存储均可使用            | 存在密钥泄漏风险，需要手动轮换密钥           |
| Assumed Role（IAM Role）      | 部署在 AWS EC2 上、需要跨账户访问 S3 的高安全场景                            | 安全性高，自动轮换 AWS 凭证，权限集中管理              | Trust/Permission 策略配置流程相对复杂          |
| EKS IAM Role（IRSA / Pod Identity） | Doris 部署在 Amazon EKS 集群中                                       | 通过 Kubernetes ServiceAccount 自动注入凭证             | 需要熟悉 EKS / IAM 联动配置                  |
| Bucket Policy                | 部署在 AWS EC2 且 bucket 数量较少的导入/导出/Storage Vault 场景               | 遵循最小权限原则，Doris 自动探测 AWS 凭证             | 权限分散在各 bucket 上，集中管理较弱            |

## 前置条件

- Doris FE/BE 已正常部署并运行
- 已拥有目标 AWS 账户和待访问的 S3 Bucket
- 具备对应账户的 IAM 配置权限（创建 User / Role、修改策略）
- 如使用 Assumed Role 或 Bucket Policy，Doris FE/BE 须部署在 AWS EC2 上（或 EKS 集群中）

---

## IAM User 认证鉴权

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 私有化部署 / 兼容 S3 协议的对象存储 -->

Doris 支持通过配置 AWS IAM User 的 `access_key` 和 `secret_key` 访问外部数据源。更多背景信息可参考 AWS 官方文档 [IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)。

### Step 1：创建 IAM User 并配置策略

1. 登录 AWS 控制台，进入 IAM 服务，单击 `Create user`。

    ![](/images/integrations/create_iam_user.png)

2. 填写 IAM User 名称后，在 `Set permissions` 部分选择直接附加策略。

    ![](/images/integrations/iam_user_attach_policy1.png)

3. 在策略编辑器中填入对应的 AWS 资源策略。下文以访问 S3 Bucket 为例，列出读/写策略的常见模板。

    ![](/images/integrations/iam_user_attach_policy2.png)

    **注意：**

    - **替换对应的 bucket name 和 prefix 路径**
    - **不要添加多余的"/"分割符**

    S3 Bucket **读策略模板**，适用于只需读取和列出 bucket 中对象的 Doris 功能，比如 S3 Load、TVF、External Catalog 等：

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

    S3 Bucket **写策略模板**，适用于需要读取、列出和写入 bucket 对象的 Doris 功能，比如 Export、Storage Vault、Resource、Repository 等：

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

4. 创建 IAM User 成功后，为该用户创建 `access_key` 和 `secret_key` 访问密钥。

    ![](/images/integrations/iam_user_create_ak_sk.png)

### Step 2：在 Doris SQL 中使用访问密钥

完成 Step 1 后，可获得 `access_key` 和 `secret_key`。通过这一对访问密钥即可使用各类 Doris 功能。下面给出典型 SQL 示例，关键字段为：

```sql
"s3.access_key" = "<your-access-key>",
"s3.secret_key" = "<your-secret-key>"
```

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

可以在不同业务逻辑中指定不同 IAM User 的 `access_key` 和 `secret_key`，实现对外部数据的细粒度访问控制。

---

## Assumed Role 认证鉴权

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: AWS EC2 部署 / 跨账户访问 S3 / 自动凭证轮换 -->

Assumed Role 通过担任 AWS IAM Role 的方式实现对外部数据源的认证与鉴权，详细背景请参考 AWS 官方文档 [代入角色](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html)。下图展示了 Assumed Role 所需的整体配置流程：

![](/images/integrations/assumed_role_flow.png)

### 名词说明

| 名词                       | 含义                                                                                  |
| :------------------------ | :----------------------------------------------------------------------------------- |
| 源账户（Source Account）     | 发起 Assume Role 的 AWS 账户（本例中是 Doris FE/BE 所在 EC2 机器所属账户）                    |
| 目标账户（Target Account）   | 拥有目标 S3 Bucket 的 AWS 账户                                                          |
| `ec2_role`                | 源账户创建的 Role，需要绑定到每一台部署 Doris FE/BE 的 EC2 机器上                              |
| `bucket_role`             | 目标账户创建的 Role，需要关联目标 bucket 权限                                                |

**注意：**

1. **源账户和目标账户可以是同一个 AWS 账户。**
2. **请确保所有部署 Doris FE/BE 的 EC2 机器都绑定到了 `ec2_role` 上，尤其是在扩容时。**

操作演示 Demo 如下：

<a href="https://www.bilibili.com/video/BV1U3uezjEPW/?vd_source=20479f0462e74fcf98f1df731639610f">
  <img src="/images/iam-role-doris-demo.png" alt="AWS IAM Role" />
</a>

### Step 1：准备工作

1. 在源账户中创建 `ec2_role`，并将所有部署 Doris FE/BE 的 EC2 机器都绑定到该角色。
2. 在目标账户中创建 `bucket_role` 和对应的 S3 Bucket。

EC2 机器绑定 `ec2_role` 成功后，可在控制台查看到 `role_arn`，如下图所示：

![](/images/integrations/ec2_instance.png)

### Step 2：为源账户 IAM 角色添加权限策略

为绑定到 EC2 实例的源账户角色添加允许 `sts:AssumeRole` 的内联策略：

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles`。
2. 找到 EC2 实例关联的角色，单击角色名称。
3. 在角色详情页的 `Permissions` 区域，单击 `Add permissions` 并选择 `Create inline policy`。
4. 在 `Specify permissions` 步骤切换到 JSON 页签，填入如下策略，然后单击 `Review policy` 保存。

![](/images/integrations/source_role_permission.png)

```json
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

### Step 3：为目标账户 IAM 角色配置信任策略与权限策略

#### 3.1 配置信任策略（Trust Policy）

1. 登录 [AWS IAM 控制台](https://us-east-1.console.aws.amazon.com/iamv2/home#/home)，在左侧导航栏选择 `Access management > Roles`，找到 `Assumed Target Role`（即 `bucket_role`），单击角色名称进入详情页。
2. 切换到 `Trust relationships` 页签，单击 `Edit trust policy`。在编辑页面中填入如下 JSON，并将 `<ec2_iam_role_arn>` 替换为 EC2 实例关联角色的 ARN，最后单击 `Update policy`。

![](/images/integrations/target_role_trust_policy.png)

**注意：** `Condition` 中的 `ExternalId` 为可选字段，用于区分多个源用户 assume 同一个角色的场景。如果配置了 ExternalId，请在对应 Doris SQL 语句中也填入该值。关于 ExternalId 的详细说明，请参考 [AWS 官方文档](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html)。

```json
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

#### 3.2 配置权限策略（Permission Policy）

在角色详情页的 `Permissions` 区域，单击 `Add permissions` 并选择 `Create inline policy`。在 `Specify permissions` 步骤切换到 JSON 页签，输入下方策略后单击 `Review policy` 保存。

![](/images/integrations/target_role_permission2.png)

**注意：**

- **替换对应的 bucket name 和 prefix 路径**
- **不要添加多余的"/"分割符**

S3 Bucket **读策略模板**，适用于只需读取和 List bucket 中对象的 Doris 功能，比如 S3 Load、TVF、External Catalog 等：

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

S3 Bucket **写策略模板**，适用于需要往 bucket 中读取和写入对象的 Doris 功能，比如 Export、Storage Vault、Resource、Repository 等：

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

### Step 4：在 Doris SQL 中使用 `role_arn` 和 `external_id`

完成上述配置后，可获得目标账户的 `role_arn` 信息和（可选的）`external_id`。在各类 Doris SQL 中关注以下两个关键字段：

```sql
"s3.role_arn" = "<your-bucket-role-arn>",
"s3.external_id" = "<your-external-id>"      -- 可选参数
```

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

---

## EKS 集群中的 IAM Role 认证鉴权

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: Doris 部署在 Amazon EKS / Kubernetes 上 -->

对于在 Amazon EKS 集群中运行的 Apache Doris，要授予其 AWS Identity and Access Management（IAM）权限，Amazon EKS 提供以下两种主要方式：

1. **服务账户的 IAM 角色（IRSA，IAM Roles for Service Accounts）**
2. **EKS 容器组身份（Pod Identity）**

这两种方式均需在 EKS 集群中正确配置 IAM Role 及对应的信任策略和 IAM 策略，具体配置方法请参阅 AWS 官方文档：[Granting AWS Identity and Access Management permissions to workloads on Amazon Elastic Kubernetes Service clusters](https://docs.aws.amazon.com/eks/latest/userguide/service-accounts.html#service-accounts-iam)。

完成 EKS 侧配置后，Doris FE/BE 会自动通过 `AWSCredentialsProviderChain` 获取凭证，无需在 SQL 中显式指定 `access_key` / `secret_key` 或 `role_arn`。

---

## Bucket Policy 认证鉴权

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: AWS EC2 部署 / 限制只能从指定账户访问 S3 / 导入、导出、TVF -->

对于以 IAM Role 部署的 Doris 机器，导入、导出、TVF 等场景也支持使用 Amazon S3 Bucket Policy 来保护对 S3 中对象的访问。通过该方式可以限制只有 EC2 机器所属的账户才能访问对象存储桶。

### Step 1：为目标存储桶设置 Bucket Policy

请将下方策略中的 `arn:aws:iam::111122223333:root` 替换为 EC2 机器所绑定账户或 Role 的 ARN：

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

### Step 2：在 Doris SQL 中直接访问 S3（无需 AK/SK 或 ARN）

完成 Bucket Policy 设置后，在对应的 SQL 中无需填入 `access_key`、`secret_key` 或 `role_arn`，Doris FE/BE 会自动通过 `AWSCredentialsProviderChain` 获取凭证：

```sql
  SELECT * FROM S3 (
      "uri" = "s3://your_bucket/path/to/tvf_test/test.parquet",
      "format" = "parquet",
      "s3.endpoint" = "s3.us-east-1.amazonaws.com",
      "s3.region" = "us-east-1"
  )
```

参考文档：[Bucket Policy 示例](https://docs.aws.amazon.com/zh_cn/AmazonS3/latest/userguide/example-bucket-policies.html)

---

## 鉴权方式最佳实践

| 鉴权方式             | 适用场景                                                              | 优点                                              | 缺点                                       |
| :------------------ | :------------------------------------------------------------------- | :----------------------------------------------- | :---------------------------------------- |
| AK/SK 鉴权方式      | 私有化部署安全性可控，或非 AWS S3 对象存储的导入/导出/Storage Vault 场景        | 配置简单，兼容 AWS S3 协议的对象存储                  | 存在密钥泄漏风险，需手动轮换密钥             |
| IAM Role 鉴权方式   | AWS S3 公有云，安全性要求较高的导入/导出/Storage Vault 场景                  | 安全性高，自动轮换 AWS 凭证，权限配置集中             | 配置 Bucket Policy/Trust 流程复杂            |
| Bucket Policy 鉴权方式 | AWS S3 公有云，bucket 数量较少的导入/导出/Storage Vault 场景                | 配置复杂度适中，遵循最小权限原则，自动探测 AWS 凭证       | 权限配置分散在各 bucket policy 中            |

---

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: AWS 鉴权调试 / SDK 日志开启 -->

### Q: 如何开启 BE 和 Recycler 的 AWS SDK DEBUG 级别日志？

在 `be.conf` 和 `doris_cloud.conf` 中配置 `aws_log_level=5`，并重启进程生效。

`aws_log_level` 参数说明如下：

| 项目     | 说明                       |
| :------ | :------------------------ |
| 类型     | int32                     |
| 描述     | AWS SDK 的日志级别         |
| 默认值   | 2（Error）                 |

可选值：

```text
Off   = 0
Fatal = 1
Error = 2
Warn  = 3
Info  = 4
Debug = 5
Trace = 6
```

### Q: 开启 AWS SDK DEBUG 日志后，be.log / recycler.log 报 `OpenSSL SSL_connect: Connection reset by peer`？

错误示例：

```text
OpenSSL SSL_connect: Connection reset by peer in connection to sts.me-south-1.amazonaws.com:443
```

请检查 AWS VPC 网络配置或防火墙端口配置是否存在问题，导致无法访问对应 region 的 STS 服务。可通过以下命令确认：

```shell
telnet sts.<region>.amazonaws.com 443
```
