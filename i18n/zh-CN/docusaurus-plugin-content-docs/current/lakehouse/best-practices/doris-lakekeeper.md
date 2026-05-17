---
{
    "title": "集成 Lakekeeper",
    "language": "zh-CN",
    "description": "本文将详细介绍如何将 Apache Doris 与 Lakekeeper 进行集成，实现对 Iceberg 数据的高效查询与管理。我们将一步步带你完成从环境准备到最终查询的全过程。"
}
---

[Lakekeeper](https://lakekeeper.io/) 是一个基于 Rust 实现的开源 Apache Iceberg REST Catalog 服务。它提供了轻量级、高性能的元数据管理服务，支持多种存储后端，包括 AWS S3、阿里云 OSS、MinIO 等。

本文将详细介绍如何将 Apache Doris 与 Lakekeeper 进行集成，实现对 Iceberg 数据的高效查询与管理。我们将一步步带你完成从环境准备到最终查询的全过程。

**通过本文档，你将可以快速了解：**

* **AWS 环境准备**：如何在 AWS 中创建并配置 S3 存储桶，以及为 Lakekeeper 准备必须的 IAM 角色和策略，使得 Lakekeeper 能够访问 S3，并能向 Doris 下发访问凭证。

* **Lakekeeper 部署与配置**：如何使用 Docker Compose 部署 Lakekeeper 服务，并在 Lakekeeper 中创建 Project 和 Warehouse，为 Doris 提供元数据访问端点。

* **Doris 连接 Lakekeeper**：使用 Doris 通过 Lakekeeper 访问 Iceberg 数据，进行读写操作。

## 1. AWS 环境准备

在开始之前，我们需要在 AWS 上准备好 S3 存储桶和相应的 IAM 角色，这是 Lakekeeper 管理数据和 Doris 访问数据的基础。

### 1.1 创建 S3 存储桶

首先，我们创建一个名为 `lakekeeper-doris-demo` 的 S3 Bucket，用于存放后续创建的 Iceberg 表数据。

```bash
# 创建 S3 存储桶
aws s3 mb s3://lakekeeper-doris-demo --region us-east-1
# 验证存储桶创建成功
aws s3 ls | grep lakekeeper-doris-demo
```

### 1.2 创建访问对象存储的 IAM Role

为了实现安全的凭证管理，我们需要创建一个 IAM 角色供 Lakekeeper 通过 STS AssumeRole 机制使用。这个设计遵循了最小权限原则和职责分离的安全最佳实践。

1. 创建信任策略文件

    创建 `lakekeeper-trust-policy.json` 文件：

    ```bash
    cat > lakekeeper-trust-policy.json << 'EOF'
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

    > 注意：请将 `YOUR_ACCOUNT_ID` 替换为您的实际 AWS 账户 ID，可通过 `aws sts get-caller-identity --query Account --output text` 获取。将 `YOUR_USER` 替换为实际的 IAM 用户名。

2. 创建 IAM Role

    ```bash
    aws iam create-role \
        --role-name lakekeeper-sts-role \
        --assume-role-policy-document file://lakekeeper-trust-policy.json \
        --description "IAM Role for Lakekeeper to access S3 storage"
    ```

3. 附加 S3 访问权限策略

    创建 `lakekeeper-s3-policy.json` 文件：

    ```bash
    cat > lakekeeper-s3-policy.json << 'EOF'
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
                "arn:aws:s3:::lakekeeper-doris-demo",
                "arn:aws:s3:::lakekeeper-doris-demo/*"
            ]
        }]
    }
    EOF
    ```

    附加策略到角色：

    ```bash
    aws iam put-role-policy \
        --role-name lakekeeper-sts-role \
        --policy-name lakekeeper-s3-access \
        --policy-document file://lakekeeper-s3-policy.json
    ```

4. 为用户授予 AssumeRole 权限

    ```bash
    cat > user-assume-policy.json << 'EOF'
    {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
        }]
    }
    EOF

    aws iam put-user-policy \
        --user-name YOUR_USER \
        --policy-name allow-assume-lakekeeper-role \
        --policy-document file://user-assume-policy.json
    ```

5. 验证创建结果

    ```bash
    aws iam get-role --role-name lakekeeper-sts-role
    aws iam list-role-policies --role-name lakekeeper-sts-role
    
    # 验证 AssumeRole 是否可用
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role \
        --role-session-name lakekeeper-test
    ```

## 2. Lakekeeper 部署与 Warehouse 创建

环境准备就绪后，我们开始部署 Lakekeeper 服务并配置 Warehouse。

### 2.1 使用 Docker Compose 部署 Lakekeeper

创建 `docker-compose.yml` 文件：

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -p 5432 -d postgres"]
      interval: 2s
      timeout: 10s
      retries: 10

  migrate:
    image: quay.io/lakekeeper/catalog:latest-main
    restart: "no"
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - RUST_LOG=info
    command: ["migrate"]
    depends_on:
      db:
        condition: service_healthy

  lakekeeper:
    image: quay.io/lakekeeper/catalog:latest-main
    environment:
      - LAKEKEEPER__PG_DATABASE_URL_READ=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_DATABASE_URL_WRITE=postgresql://postgres:postgres@db:5432/postgres
      - LAKEKEEPER__PG_ENCRYPTION_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
      - LAKEKEEPER__BASE_URI=http://YOUR_HOST_IP:8181
      - LAKEKEEPER__ENABLE_DEFAULT_PROJECT=true
      - RUST_LOG=info
    command: ["serve"]
    ports:
      - "8181:8181"
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy

volumes:
  pgdata:
```

**关键配置参数：**

| 参数 | 说明 |
| --- | --- |
| `LAKEKEEPER__PG_ENCRYPTION_KEY` | 当使用默认的 Postgres secret backend 时，用于加密存储在 Postgres 中的敏感信息。需要设置为足够长的随机字符串。 |
| `LAKEKEEPER__BASE_URI` | Lakekeeper 服务的基础 URI。请将 `YOUR_HOST_IP` 替换为实际的主机 IP 地址。 |
| `LAKEKEEPER__ENABLE_DEFAULT_PROJECT` | 设置为 `true` 时启用默认项目功能。 |

启动 Lakekeeper：

```bash
docker compose up -d
```

启动后，可以访问以下端点：

* Swagger UI:`http://YOUR_HOST_IP:8181/swagger-ui/`
* Web UI:`http://YOUR_HOST_IP:8181/ui`

### 2.2 创建 Project 和 Warehouse

1. 创建 Project

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/project" \
      -H "Content-Type: application/json" \
      --data '{"project-name":"default"}'
    ```

    验证：

    ```bash
    curl -s "http://localhost:8181/management/v1/project-list"
    ```

    记录返回结果中的 `project-id`，后续步骤中将用作 `PROJECT_ID`。

2. 创建 Warehouse（Credential Vending 模式）

    如果需要使用 Credential Vending 模式，创建 warehouse 配置文件 `create-warehouse-vc.json`：

    ```bash
    cat > create-warehouse-vc.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-vc-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse-vc",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": true,
        "flavor": "aws",
        "assume-role-arn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lakekeeper-sts-role"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    * `sts-enabled`: 设置为 `true` 启用 Credential Vending。
    * `assume-role-arn`: Lakekeeper 用于代入以访问 S3 的 IAM Role ARN。

    创建 warehouse：

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-vc.json
    ```

3. 创建 Warehouse（静态凭证模式）

    创建 warehouse 配置文件 `create-warehouse-static.json`：

    ```bash
    cat > create-warehouse-static.json <<'JSON'
    {
      "warehouse-name": "lakekeeper-warehouse",
      "storage-profile": {
        "type": "s3",
        "bucket": "lakekeeper-doris-demo",
        "key-prefix": "warehouse",
        "region": "us-east-1",
        "endpoint": "https://s3.us-east-1.amazonaws.com",
        "sts-enabled": false,
        "flavor": "aws"
      },
      "storage-credential": {
        "type": "s3",
        "credential-type": "access-key",
        "aws-access-key-id": "YOUR_ACCESS_KEY",
        "aws-secret-access-key": "YOUR_SECRET_KEY"
      }
    }
    JSON
    ```

    创建 warehouse：

    ```bash
    curl -i -X POST "http://localhost:8181/management/v1/warehouse" \
      -H "Content-Type: application/json" \
      -H "x-project-id: $PROJECT_ID" \
      --data @create-warehouse-static.json
    ```

4. 验证 Warehouse 创建

    ```bash
    curl -s "http://localhost:8181/management/v1/warehouse" \
      -H "x-project-id: $PROJECT_ID"
    ```

5. 创建 Namespace

    记录上一步返回结果中的 `warehouse-id`，用于创建 Namespace：

    ```bash
    curl -sS -X POST \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      "http://localhost:8181/catalog/v1/$WAREHOUSE_ID/namespaces" \
      -d '{
        "namespace": ["demo"],
        "properties": {}
      }'
    ```

    这会在 Warehouse 下创建一个名为 `demo` 的 Namespace（数据库）。

至此，Lakekeeper 端的配置全部完成。

## 3. Doris 连接 Lakekeeper

现在，我们将在 Doris 中创建一个 Iceberg Catalog，连接到刚刚配置好的 Lakekeeper 服务。

### 方式一：临时存储凭证 (Credential Vending)

这是**最推荐**的方式。当需要读写 S3 上的数据文件时，Doris 会向 Lakekeeper 请求一个临时的、具有最小权限的 S3 访问凭证。

```sql
CREATE CATALOG lakekeeper_vc PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-vc-warehouse',
    -- 开启凭证发放
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 方式二：静态存储凭证 (AK/SK)

这种方式下，Doris 直接使用配置中写死的静态 AK/SK 访问对象存储。这种方式配置简单，适合快速测试，但安全性较低。

```sql
CREATE CATALOG lakekeeper_static PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://YOUR_LAKEKEEPER_HOST:8181/catalog',
    'warehouse' = 'lakekeeper-warehouse',
    -- 直接提供 S3 访问密钥
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 4. 在 Doris 中验证连接

无论使用哪种方式创建 Catalog，你都可以通过以下 SQL 来验证端到端的连通性。

```sql
-- 切换到你创建的 Catalog 和在 Lakekeeper 中配置的 Namespace
USE lakekeeper_static.demo;

-- 创建一张 Iceberg 表
CREATE TABLE my_iceberg_table (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format'='parquet'
);

-- 插入数据
INSERT INTO my_iceberg_table VALUES (1, 'Doris'), (2, 'Lakekeeper');

-- 查询数据
SELECT * FROM my_iceberg_table;
-- 预期结果：
-- +------+------------+
-- | id   | name       |
-- +------+------------+
-- | 1    | Doris      |
-- | 2    | Lakekeeper |
-- +------+------------+
```

如果上述操作均能成功，恭喜你！你已经成功打通了 Doris -> Lakekeeper -> Iceberg(S3) 的完整数据湖链路。

有关使用 Doris 管理 Iceberg 表的更多信息，请访问：

https://doris.apache.org/zh-CN/docs/lakehouse/catalogs/iceberg-catalog
