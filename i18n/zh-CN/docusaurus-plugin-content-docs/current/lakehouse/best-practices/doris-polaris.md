---
{
    "title": "集成 Apache Polaris",
    "language": "zh-CN",
    "description": "随着数据湖技术的不断演进，如何高效、安全地管理位于对象存储（如 AWS S3）之上的海量数据，并为上层分析引擎（如 Apache Doris）提供统一的访问入口，已成为现代数据架构的核心挑战。Apache Polaris 作为 Iceberg 的开放、标准化的 REST Catalog 服务，"
}
---

随着数据湖技术的不断演进，如何高效、安全地管理位于对象存储（如 AWS S3）之上的海量数据，并为上层分析引擎（如 Apache Doris）提供统一的访问入口，已成为现代数据架构的核心挑战。Apache Polaris 作为 Iceberg 的开放、标准化的 REST Catalog 服务，为此提供了完美的解决方案。它不仅负责元数据的集中管理，还通过精细化的权限控制和灵活的凭证管理机制，极大地增强了数据湖的安全性与可管理性。

本文将详细介绍如何将 Apache Doris 与 Polaris 进行集成，实现对 S3 上 Iceberg 数据的高效查询与管理。我们将一步步带你完成从环境准备到最终查询的全过程。

**通过本文档，你将可以快速了解：**

* **AWS 环境准备**：如何在 AWS 中创建并配置 S3 存储桶，以及为 Polaris 和 Doris 分别准备必须的 IAM 角色和策略，使得 Polaris 能够自身访问 S3，并能向 Doris 下发访问凭证。

* **Polaris 部署与配置**：如何在服务器上下载并启动 Polaris 服务，并在 Polaris 中创建 Iceberg Catalog、Namespace 及相应的 Principal/Role/权限，为 Doris 提供安全的元数据访问端点。

* **Doris 连接 Polaris**：说明 Doris 如何通过 OAuth2 向 Polaris 获取元数据访问令牌，并演示两种核心的底层存储访问方式：

  1. 由 Polaris 发放临时 AK/SK（凭证发放机制，Credential Vending）
  2. Doris 直接使用静态 AK/SK 访问 S3

* **连接方案对比**：通过文字与流程图对比不同方案在元数据与存储层的工作链路、适用场景及安全性，为你提供选型参考。

* **附录**：对文中出现的关键术语（如 Role, Policy, Principal 等）进行简要说明。

## 1. AWS 环境准备

在开始之前，我们需要在 AWS 上准备好 S3 存储桶和相应的 IAM 角色，这是 Polaris 管理数据和 Doris 访问数据的基础。

### 1.1 创建 S3 存储桶

首先，我们创建一个名为 `polaris-doris-demo` 的 S3 Bucket，用于存放后续创建的 Iceberg 表数据。

```bash
# 创建 S3 存储桶
aws s3 mb s3://polaris-doris-demo --region us-west-2
# 验证存储桶创建成功
aws s3 ls | grep polaris-doris-demo
```

### 1.2 创建访问对象存储的 IAM Role

为了实现安全的凭证管理，我们需要创建一个 IAM 角色供 Polaris 通过 STS AssumeRole 机制使用。这个设计遵循了最小权限原则和职责分离的安全最佳实践。

1. 创建信任策略文件

    创建 `polaris-trust-policy.json `文件：

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

    > 注意：请将 YOUR\_ACCOUNT\_ID 替换为您的实际 AWS 账户 ID，可通过`aws sts get-caller-identity --query Account --output text`获取。

2. 创建 IAM Role

    ```bash
    aws iam create-role \
        --role-name polaris-doris-demo \
        --assume-role-policy-document file:///path/to/polaris-trust-policy.json \
        --description "IAM Role for Polaris to access S3 storage"
    ```

3. 附加 S3 访问权限策略

4. 验证创建结果

    ```bash
    aws iam get-role --role-name polaris-doris-demo
    aws iam list-attached-role-policies --role-name polaris-doris-demo
    ```

### 1.3 为 EC2 实例绑定 IAM Role（可选）

> 如不执行此步骤，则需要在 polaris 启动前设置 AWS\_ACCESS\_KEY\_ID 与 AWS\_SECRET\_ACCESS\_KEY

如果您的 Polaris 服务将运行在 EC2 实例上，最佳实践是为该 EC2 实例绑定 IAM 角色，而不是使用访问密钥。这样可以避免在代码中硬编码凭证，提高安全性。

1. 创建 EC2 实例角色的信任策略

    首先创建允许 EC2 服务承担此角色的信任策略文件：

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

2. 创建 EC2 实例角色

    ```bash
    aws iam create-role \
        --role-name polaris-ec2-role \
        --assume-role-policy-document file:///path/to/ec2-trust-policy.json \
        --description "IAM Role for EC2 instance running Polaris service"
    ```

3. 附加 S3 访问权限策略

    ```bash
    # 附加 AmazonS3FullAccess 托管策略
    aws iam attach-role-policy \
        --role-name polaris-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
    ```

4. 创建实例配置文件

    ```bash
    # 创建实例配置文件
    aws iam create-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile

    # 将角色添加到实例配置文件
    aws iam add-role-to-instance-profile \
        --instance-profile-name polaris-ec2-instance-profile \
        --role-name polaris-ec2-role
    ```

5. 将实例配置文件附加到 EC2 实例

    ```bash
    # 如果是新创建的 EC2 实例，在启动时指定
    aws ec2 run-instances \
        --image-id ami-xxxxxxxxx \
        --instance-type t3.medium \
        --iam-instance-profile Name=polaris-ec2-instance-profile \
        --other-parameters...

    # 如果是已存在的 EC2 实例，需要关联实例配置文件
    aws ec2 associate-iam-instance-profile \
        --instance-id i-xxxxxxxxx \
        --iam-instance-profile Name=polaris-ec2-instance-profile
    ```

## 2. Polaris 部署与 Catalog 创建

环境准备就绪后，我们开始部署 Polaris 服务并配置 Catalog。

> 本文档采用源码快速启动的方式，更多部署方式参考：https://polaris.apache.org/releases/1.0.1/getting-started/deploying-polaris/

### 2.1 克隆源码并启动 Polaris

1. 克隆 Polaris 仓库并切换到特定版本

    ```bash
    git clone https://github.com/apache/polaris.git
    cd polaris
    # Recommend using a released stable version
    git checkout apache-polaris-1.0.1-incubating
    ```

2. 设置 AWS 凭证（可选）

    如果你不在 EC2 上运行 Polaris，或者 EC2 没有绑定相应的 IAM Role，你需要通过环境变量为 Polaris 提供一个有权代入 `polaris-doris-demo` 角色的 AK/SK。

    ```bash
    export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    ```

3. 编译并运行 Polaris

    确保你已安装 Java 21+ 和 Docker 27+。

    ```bash
    ./gradlew run -Dpolaris.bootstrap.credentials=POLARIS,root,secret
    ```

* `POLARIS` is the realm
* `root` is the `CLIENT_ID`
* `secret` is the `CLIENT_SECRET`
* If credentials are not set, it will use preset credentials `POLARIS,root,s3cr3t`

此命令会启动 Polaris 服务，默认监听 `8181` 端口。

### 2.2 在 Polaris 中创建 Catalog 与 Namespace

1. **导出 ROOT 凭证**

    ```bash
    export CLIENT_ID=root
    export CLIENT_SECRET=secret
    ```

2. 创建 Catalog (指向 S3 存储)

    ```bash
    ./polaris catalogs create \
    --storage-type s3 \
    --default-base-location s3://polaris-doris-test/polaris1 \
    --role-arn arn:aws:iam::<account_id>:role/polaris-doris-test \
    --external-id polaris-doris-test \
    doris_catalog
    ```

    * `--storage-type s3`: 指定底层存储为 S3。
    * `--default-base-location`: Iceberg 表数据的默认根路径。
    * `--role-arn`: Polaris 服务用于代入以访问 S3 的 IAM Role。
    * `--external-id`: 代入角色时使用的外部 ID，与 IAM Role 信任策略中的配置保持一致。

3. 创建 Namespace

    ```bash
    ./polaris namespaces create --catalog doris_catalog doris_demo
    ```

这会在 `doris_catalog` 下创建一个名为 `doris_demo` 的数据库（Namespace）。

### 2.3 Polaris 安全角色与权限配置

为了让 Doris 能够以非 `root` 用户的身份访问，我们需要创建一个新的用户和角色，并授予其适当的权限。

1. 创建 Principal Role 和 Catalog Role

    ```bash
    # 创建一个 Principal Role，用于聚合权限
    ./polaris principal-roles create doris_pr_role

    # 在 doris_catalog 下创建一个 Catalog Role
    ./polaris catalog-roles create --catalog doris_catalog doris_catalog_role
    ```

2. 为 Catalog Role 授权

    ```bash
    # 授予 doris_catalog_role 管理该 Catalog 内容的权限
    ./polaris privileges catalog grant \
        --catalog doris_catalog \
        --catalog-role doris_catalog_role \
        CATALOG_MANAGE_CONTENT
    ```

3. 关联 Principal Role 和 Catalog Role

    ```bash
    # 将 doris_catalog_role 赋予 doris_pr_role
    ./polaris catalog-roles grant \
    --catalog doris_catalog \
    --principal-role doris_pr_role \
    doris_catalog_role
    ```

4. 创建新的 Principal (用户) 并绑定 Role

    ```bash
    # 创建一个名为 doris_user 的新用户（Principal）
    ./polaris principals create doris_user
    # 输出示例： {"clientId": "6e155b128dc06c13", "clientSecret": "ce9fbb4cc91c43ff2955f2c6545239d7"}
    # 请记下这对新的 client_id 和 client_secret，Doris 将使用它进行连接。

    # 将 doris_user 绑定到 doris_pr_role
    ./polaris principal-roles grant \
    doris_pr_role \
    --principal doris_user
    ```

至此，Polaris 端的配置全部完成。我们创建了一个名为 `doris_user` 的用户，它通过 `doris_pr_role` 获得了管理 `doris_catalog` 的权限。

## 3. Doris 连接 Polaris

现在，我们将在 Doris 中创建一个 Iceberg Catalog，连接到刚刚配置好的 Polaris 服务。Doris 支持多种灵活的认证组合。

> **注意：** 此示例中我们使用 OAuth2 认证的 credential 来连接 Polaris 的 rest 服务，除此之外 Doris 还支持使用 `iceberg.rest.oauth2.token` 直接提供预先获取的 Bearer Token

### 方式一：OAuth2 + 临时存储凭证 (Credential Vending)

这是**最推荐**的方式。Doris 使用 OAuth2 凭证向 Polaris 认证并获取元数据，当需要读写 S3 上的数据文件时，Doris 会向 Polaris 请求一个临时的、具有最小权限的 S3 访问凭证。

使用你为 `doris_user` 生成的 `clientId` 和 `clientSecret`。

```sql
CREATE CATALOG polaris_vended PROPERTIES (
    'type' = 'iceberg',
    -- Polaris 中的 Catalog 名称
    'warehouse' = 'doris_catalog',
    'iceberg.catalog.type' = 'rest',
    -- Polaris 服务地址
    'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
    -- 元数据认证方式
    'iceberg.rest.security.type' = 'oauth2',
    -- 替换为 doris_user 的 client_id:client_secret
    'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
    'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
    -- 开启凭证发放
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 方式二：OAuth2 + 静态存储凭证 (AK/SK)

这种方式下，Doris 同样使用 OAuth2 访问 Polaris 元数据，但访问 S3 数据时，使用的是在 Doris Catalog 配置中写死的静态 AK/SK。这种方式配置简单，适合快速测试，但安全性较低。

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
    -- 直接提供 S3 访问密钥
    's3.access_key' = 'YOUR_S3_ACCESS_KEY',
    's3.secret_key' = 'YOUR_S3_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
    's3.region' = 'us-west-2'
);
```

## 4. 在 Doris 中验证连接

无论使用哪种方式创建 Catalog，你都可以通过以下 SQL 来验证端到端的连通性。

```sql
-- 切换到你创建的 Catalog 和在 Polaris 中配置的 Namespace
USE polaris_vended.doris_demo;

-- 创建一张 Iceberg 表
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- 插入数据
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Polaris');

-- 查询数据
SELECT * FROM my_iceberg_table;
-- 预期结果：
-- +------+---------+
-- | id   | name    |
-- +------+---------+
-- | 1    | Doris   |
-- | 2    | Polaris |
-- +------+---------+
```

如果上述操作均能成功，恭喜你！你已经成功打通了 Doris -> Polaris -> S3 的完整数据湖链路。

有关使用 Doris 管理 Iceberg 表的更多信息，请访问：

https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog
