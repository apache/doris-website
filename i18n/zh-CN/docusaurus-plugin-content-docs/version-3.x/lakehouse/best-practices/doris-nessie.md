---
{
    "title": "集成 Nessie",
    "language": "zh-CN"
}
---

[Nessie](https://projectnessie.org/) 是一个开源的数据湖事务目录，为您的数据提供类似 Git 的版本控制功能。它实现了 Iceberg REST Catalog 规范，支持跨多种表格式（包括 Apache Iceberg）的分支、标签和时间旅行等功能。

本文将带您了解如何将 Apache Doris 与 Nessie 集成，实现对 Iceberg 数据的高效查询和管理。我们将逐步带您完成从环境准备到最终查询的整个过程。

**通过本文档，您将学习：**

* **AWS 环境准备**：如何在 AWS 中创建和配置 S3 存储桶，并为 Nessie 准备必要的 IAM 角色和策略，使 Nessie 能够访问 S3 并向 Doris 分发访问凭证。

* **Nessie 部署和配置**：如何使用 Docker Compose 部署 Nessie 服务，并配置 Warehouse 为 Doris 提供元数据访问端点。

* **Doris 连接 Nessie**：如何使用 Doris 通过 Nessie 访问 Iceberg 数据进行读写操作。

## 1. AWS 环境准备

在开始之前，我们需要在 AWS 上准备 S3 存储桶和相应的 IAM 角色，这是 Nessie 管理数据和 Doris 访问数据的基础。

### 1.1 创建 S3 存储桶

首先，我们创建一个名为 `nessie-doris-demo` 的 S3 存储桶，用于存储稍后将创建的 Iceberg 表数据。

```bash
# 创建 S3 存储桶
aws s3 mb s3://nessie-doris-demo --region us-east-1
# 验证存储桶创建成功
aws s3 ls | grep nessie-doris-demo
```

### 1.2 创建用于对象存储访问的 IAM 角色（可选）

如果您计划使用 Credential Vending 模式，需要创建一个 IAM 角色供 Nessie 通过 STS AssumeRole 机制使用。这种设计遵循最小权限原则和职责分离的安全最佳实践。

1. 创建信任策略文件

    创建 `nessie-trust-policy.json` 文件：

    ```bash
    cat > nessie-trust-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USER"
            },
            "Action": "sts:AssumeRole"
        }
        ]
    }
    EOF
    ```

    > 注意：请将 YOUR\_ACCOUNT\_ID 替换为您的实际 AWS 账户 ID，可通过 `aws sts get-caller-identity --query Account --output text` 获取。将 YOUR\_USER 替换为实际的 IAM 用户名。

2. 创建 IAM 角色

    ```bash
    aws iam create-role \
        --role-name nessie-sts-role \
        --assume-role-policy-document file://nessie-trust-policy.json \
        --description "IAM Role for Nessie to access S3 storage"
    ```

3. 附加 S3 访问权限策略

    创建 `nessie-s3-policy.json` 文件：

    ```bash
    cat > nessie-s3-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:ListBucketMultipartUploads",
                "s3:ListMultipartUploadParts",
                "s3:AbortMultipartUpload",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::nessie-doris-demo",
                "arn:aws:s3:::nessie-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    将策略附加到角色：

    ```bash
    aws iam put-role-policy \
        --role-name nessie-sts-role \
        --policy-name nessie-s3-access \
        --policy-document file://nessie-s3-policy.json
    ```

4. 为用户授予 AssumeRole 权限

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-nessie-role \
        --policy-document file://user-assume-policy.json
    ```

5. 验证创建结果

    ```bash
    aws iam get-role --role-name nessie-sts-role
    aws iam list-role-policies --role-name nessie-sts-role
    
    # 验证 AssumeRole 可用
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role \
        --role-session-name nessie-test
    ```

## 2. Nessie 部署和 Warehouse 配置

环境准备完成后，我们开始部署 Nessie 服务并配置 Warehouse。

### 2.1 使用 Docker Compose 部署 Nessie（Credential Vending 模式）

这是**最推荐**的部署方式，通过临时凭证增强安全性。

创建 `.env` 文件存储 AWS 凭证：

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

创建 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie
        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse
        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.auth-type=APPLICATION_GLOBAL
        -Dnessie.catalog.service.s3.default-options.server-iam.enabled=true
        -Dnessie.catalog.service.s3.default-options.server-iam.assume-role=arn:aws:iam::YOUR_ACCOUNT_ID:role/nessie-sts-role
        -Dnessie.catalog.service.s3.default-options.server-iam.role-session-name=nessie-doris
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}

volumes:
  pgdata:
```

**Credential Vending 关键配置参数：**

| 参数 | 描述 |
| ---- | ---- |
| `nessie.version.store.type` | 版本存储类型，使用 JDBC2 作为 PostgreSQL 后端。|
| `nessie.catalog.default-warehouse` | 默认 Warehouse 名称。|
| `nessie.catalog.warehouses.<name>.location` | 存储 Iceberg 表数据的 S3 位置。|
| `server-iam.enabled` | 设置为 `true` 以启用 Credential Vending。|
| `server-iam.assume-role` | Nessie 将用于访问 S3 的 IAM 角色 ARN。|
| `server-iam.role-session-name` | 角色会话名称。|
| `auth-type` | 设置为 `APPLICATION_GLOBAL` 以使用应用程序级别凭证。|

启动 Nessie：

```bash
docker compose up -d
```

启动后，您可以通过 `http://YOUR_HOST_IP:19120` 访问 Nessie API。

### 2.2 使用 Docker Compose 部署 Nessie（静态凭证模式）

如果您不需要 Credential Vending，可以使用静态凭证模式进行快速测试：

创建 `.env` 文件存储 AWS 凭证：

```bash
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
```

创建 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: nessie
      POSTGRES_USER: nessie
      POSTGRES_PASSWORD: nessie
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  nessie:
    image: ghcr.io/projectnessie/nessie:0.106.0-java
    depends_on:
      - postgres
    ports:
      - "19120:19120"
    environment:
      JAVA_OPTS_APPEND: >-
        -Dnessie.version.store.type=JDBC2
        -Dnessie.version.store.persist.jdbc.datasource=postgresql
        -Dquarkus.datasource.postgresql.jdbc.url=jdbc:postgresql://postgres:5432/nessie
        -Dquarkus.datasource.postgresql.username=nessie
        -Dquarkus.datasource.postgresql.password=nessie

        -Dnessie.catalog.default-warehouse=nessie-warehouse
        -Dnessie.catalog.warehouses.nessie-warehouse.location=s3://nessie-doris-demo/warehouse

        -Dnessie.catalog.service.s3.default-options.region=us-east-1
        -Dnessie.catalog.service.s3.default-options.access-key=urn:nessie-secret:quarkus:my-secrets-default
        -Dmy-secrets-default.name=${AWS_ACCESS_KEY_ID}
        -Dmy-secrets-default.secret=${AWS_SECRET_ACCESS_KEY}

    env_file:
      - .env

volumes:
  pgdata:
```

**关键配置参数：**

| 参数 | 描述 |
| ---- | ---- |
| `nessie.version.store.type` | 版本存储类型，使用 JDBC2 作为 PostgreSQL 后端。|
| `nessie.catalog.default-warehouse` | 默认 Warehouse 名称。|
| `nessie.catalog.warehouses.<name>.location` | 存储 Iceberg 表数据的 S3 位置。|
| `nessie.catalog.service.s3.default-options.region` | S3 存储桶的 AWS 区域。|

## 3. Doris 连接 Nessie

现在，我们将在 Doris 中创建一个连接到 Nessie 服务的 Iceberg Catalog。

### 方式一：临时存储凭证（Credential Vending）

这是**最推荐**的方式。当需要在 S3 上读写数据文件时，Doris 会从 Nessie 请求一个临时的、最小权限的 S3 访问凭证。

```sql
CREATE CATALOG nessie_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    -- 启用 credential vending
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

> 注意：Nessie REST Catalog URI 格式为 `http://HOST:PORT/iceberg/{branch}`，其中 `main` 是默认分支名称。

### 方式二：静态存储凭证（AK/SK）

在这种方式中，Doris 直接使用配置中硬编码的静态 AK/SK 访问对象存储。这种方法配置简单，适合快速测试，但安全性较低。

```sql
CREATE CATALOG nessie_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_NESSIE_HOST:19120/iceberg/main',
    'warehouse' = 'nessie-warehouse',
    -- 直接提供 S3 访问密钥
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 4. 在 Doris 中验证连接

无论您使用哪种方式创建 Catalog，都可以通过以下 SQL 验证端到端连接。

```sql
-- 切换到 Catalog
USE nessie_vc;

-- 创建命名空间（数据库）
CREATE DATABASE demo;
USE demo;

-- 创建 Iceberg 表
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- 插入数据
INSERT INTO my_iceberg_table VALUES (1, 'alice'), (2, 'bob');

-- 查询数据
SELECT * FROM my_iceberg_table;
-- 预期结果：
-- +------+-------+
-- | id   | name  |
-- +------+-------+
-- | 1    | alice |
-- | 2    | bob   |
-- +------+-------+
```

如果以上所有操作都成功完成，恭喜您！您已成功建立完整的数据湖管道：Doris -> Nessie -> S3。

有关使用 Doris 管理 Iceberg 表的更多信息，请访问：

https://doris.apache.org/zh-CN/docs/lakehouse/catalogs/iceberg-catalog
