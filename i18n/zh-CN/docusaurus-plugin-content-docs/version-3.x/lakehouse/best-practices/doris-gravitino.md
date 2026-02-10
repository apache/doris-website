---
{
    "title": "集成 Apache Gravitino",
    "language": "zh-CN",
    "description": "随着数据湖技术的快速发展，如何构建统一、安全、高效的湖仓一体化数据架构成为企业数字化转型的核心挑战。Apache Gravitino 作为新一代统一元数据管理平台，为多云、多引擎环境下的数据治理提供了完整的解决方案。它不仅支持多种数据源和计算引擎的统一管理，"
}
---

随着数据湖技术的快速发展，如何构建统一、安全、高效的湖仓一体化数据架构成为企业数字化转型的核心挑战。Apache Gravitino 作为新一代统一元数据管理平台，为多云、多引擎环境下的数据治理提供了完整的解决方案。它不仅支持多种数据源和计算引擎的统一管理，还通过凭证管理机制（Credential Vending）确保了数据访问的安全性和可控性。

本文将深入介绍如何将 Apache Doris 与 Apache Gravitino 进行深度集成，构建基于 Iceberg REST Catalog 的现代化湖仓架构。通过 Gravitino 的统一元数据管理和动态凭证分发能力，实现对 S3 上 Iceberg 数据的高效、安全访问。

**通过本文档，你将可以快速了解：**

* **AWS 环境准备**：如何在 AWS 中创建 S3 存储桶和 IAM 角色，为 Gravitino 配置安全的凭证管理体系，实现临时凭证的动态分发机制。

* **Gravitino 部署与配置**：如何快速部署 Gravitino 服务，配置 Iceberg REST Catalog，并启用 vended-credentials 功能。

* **Doris 连接 Gravitino**：详细说明 Doris 如何通过 Gravitino 的 REST API 访问 Iceberg 数据。

## Hands-on Guide

### 1. AWS 环境准备

在开始之前，我们需要在 AWS 上准备好完整的基础设施，包括 S3 存储桶和精心设计的 IAM 角色体系，这是构建安全可靠的湖仓架构的基石。

### 1.1 创建 S3 存储桶

首先创建一个专用的 S3 存储桶来存放 Iceberg 数据：

```bash
# 创建 S3 存储桶
aws s3 mb s3://gravitino-iceberg-demo --region us-west-2
# 验证存储桶创建成功
aws s3 ls | grep gravitino-iceberg-demo
```

### 1.2 设计 IAM 角色架构

为了实现安全的凭证管理，我们需要创建一个 IAM 角色供 Gravitino 通过 STS AssumeRole 机制使用。这个设计遵循了最小权限原则和职责分离的安全最佳实践。

**创建数据访问角色**

1. 创建信任策略文件

   创建 `gravitino-trust-policy.json` 文件：

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": [
                       "arn:aws:iam::YOUR_ACCOUNT_ID:root"
                   ]
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

2. 创建 IAM 角色

   为简化演示，我们直接使用 AWS 管理策略。生产环境建议创建更精细的权限控制。

   ```bash
   # 创建 IAM 角色
   aws iam create-role \
       --role-name gravitino-iceberg-access \
       --assume-role-policy-document file://gravitino-trust-policy.json \
       --description "Gravitino Iceberg data access role"

   # 附加 S3 完整访问权限（测试用，生产环境请使用精细化权限）
   aws iam attach-role-policy \
       --role-name gravitino-iceberg-access \
       --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

3. 验证 IAM 配置

    验证角色配置是否正确：

    ```bash
    # 测试角色承担功能
    aws sts assume-role \
        --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access \
        --role-session-name gravitino-test
    ```

    成功响应示例：

    ```json
    {
        "Credentials": {
            "AccessKeyId": "ASIA***************",
            "SecretAccessKey": "***************************",
            "SessionToken": "IQoJb3JpZ2luX2VjEOj...",
            "Expiration": "2025-07-23T08:33:30+00:00"
        }
    }
    ```

## 2. Gravitino 部署与配置

### 2.1 下载和安装 Gravitino

我们使用 Gravitino 的预编译版本来快速搭建环境：

```bash
# 创建工作目录
mkdir gravitino-deployment && cd gravitino-deployment

# 下载 Gravitino 主程序
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-0.9.1-bin.tar.gz

# 下载 Iceberg REST 服务器组件
wget https://github.com/apache/gravitino/releases/download/v0.9.1/gravitino-iceberg-rest-server-0.9.1-bin.tar.gz

# 解压安装
tar -xzf gravitino-0.9.1-bin.tar.gz
cd gravitino-0.9.1-bin
tar -xzf ../gravitino-iceberg-rest-server-0.9.1-bin.tar.gz --strip-components=1
```

### 2.2 安装必要的依赖组件

为了支持 AWS S3 和凭证管理功能，需要安装额外的 JAR 包：

```bash
# 创建必要的目录结构
mkdir -p catalogs/lakehouse-iceberg/libs
mkdir -p iceberg-rest-server/libs
mkdir -p logs
mkdir -p /tmp/gravitino

# 下载 Iceberg AWS bundle
wget https://repo1.maven.org/maven2/org/apache/iceberg/iceberg-aws-bundle/1.6.1/iceberg-aws-bundle-1.6.1.jar \
  -P catalogs/lakehouse-iceberg/libs/

# 下载 Gravitino AWS 支持包（vended-credentials 功能核心）
wget https://repo1.maven.org/maven2/org/apache/gravitino/gravitino-aws/0.9.1/gravitino-aws-0.9.1.jar \
  -P iceberg-rest-server/libs/

# 分发 JAR 包到各个目录
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar iceberg-rest-server/libs/
cp catalogs/lakehouse-iceberg/libs/iceberg-aws-bundle-1.6.1.jar libs/
cp iceberg-rest-server/libs/gravitino-aws-0.9.1.jar libs/
```

### 2.3 配置 Gravitino 服务

1. 主服务配置

    创建或编辑 `conf/gravitino.conf` 文件：

    ```properties
    # Gravitino 服务器基础配置
    gravitino.server.webserver.host = 0.0.0.0
    gravitino.server.webserver.httpPort = 8090

    # 元数据存储配置（生产环境建议使用 PostgreSQL/MySQL）
    gravitino.entity.store = relational
    gravitino.entity.store.relational = JDBCBackend
    gravitino.entity.store.relational.jdbcUrl = jdbc:h2:file:/tmp/gravitino/gravitino.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.entity.store.relational.jdbcDriver = org.h2.Driver
    gravitino.entity.store.relational.jdbcUser = gravitino
    gravitino.entity.store.relational.jdbcPassword = gravitino

    # 启用 Iceberg REST 服务
    gravitino.auxService.names = iceberg-rest

    # Iceberg REST 服务详细配置
    gravitino.iceberg-rest.classpath = iceberg-rest-server/libs, iceberg-rest-server/conf
    gravitino.iceberg-rest.host = 0.0.0.0
    gravitino.iceberg-rest.httpPort = 9001

    # Iceberg catalog 后端配置
    gravitino.iceberg-rest.catalog-backend = jdbc
    gravitino.iceberg-rest.uri = jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL
    gravitino.iceberg-rest.jdbc-driver = org.h2.Driver
    gravitino.iceberg-rest.jdbc-user = iceberg
    gravitino.iceberg-rest.jdbc-password = iceberg123
    gravitino.iceberg-rest.jdbc-initialize = true
    gravitino.iceberg-rest.warehouse = s3://gravitino-iceberg-demo/warehouse
    gravitino.iceberg-rest.io-impl = org.apache.iceberg.aws.s3.S3FileIO
    gravitino.iceberg-rest.s3-region = us-west-2

    # 启用 Vended-Credentials 功能
    # 说明：Gravitino 使用这些 AK/SK 调用 STS AssumeRole，获取临时凭证分发给客户端
    gravitino.iceberg-rest.credential-providers = s3-token
    gravitino.iceberg-rest.s3-access-key-id = YOUR_AWS_ACCESS_KEY_ID
    gravitino.iceberg-rest.s3-secret-access-key = YOUR_AWS_SECRET_ACCESS_KEY
    gravitino.iceberg-rest.s3-role-arn = arn:aws:iam::YOUR_ACCOUNT_ID:role/gravitino-iceberg-access
    gravitino.iceberg-rest.s3-region = us-west-2
    gravitino.iceberg-rest.s3-token-expire-in-secs = 3600
    ```

2. 启动服务

    ```bash
    # 启动 Gravitino 服务
    ./bin/gravitino.sh start

    # 检查服务状态
    ./bin/gravitino.sh status

    # 查看日志
    tail -f logs/gravitino-server.log
    ```

3. 验证服务状态

    ```bash
    # 验证主服务
    curl -v http://localhost:8090/api/version

    # 验证 Iceberg REST 服务
    curl -v http://localhost:9001/iceberg/v1/config
    ```

### 2.4 创建 Gravitino 元数据结构

通过 REST API 创建必要的元数据结构：

```bash
# 创建 MetaLake
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lakehouse",
    "comment": "Gravitino lakehouse for Doris integration",
    "properties": {}
  }' http://localhost:8090/api/metalakes

# 创建 Iceberg Catalog
curl -X POST -H "Accept: application/vnd.gravitino.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iceberg_catalog",
    "type": "RELATIONAL",
    "provider": "lakehouse-iceberg",
    "comment": "Iceberg catalog with S3 storage and vended credentials",
    "properties": {
      "catalog-backend": "jdbc",
      "uri": "jdbc:h2:file:/tmp/gravitino/catalog_iceberg.db;DB_CLOSE_DELAY=-1;MODE=MYSQL",
      "jdbc-user": "iceberg",
      "jdbc-password": "iceberg123",
      "jdbc-driver": "org.h2.Driver",
      "jdbc-initialize": "true",
      "warehouse": "s3://gravitino-iceberg-demo/warehouse",
      "io-impl": "org.apache.iceberg.aws.s3.S3FileIO",
      "s3-region": "us-west-2"
    }
  }' http://localhost:8090/api/metalakes/lakehouse/catalogs
```

## 3. Doris 连接 Gravitino

### 3.1 使用 Vended Credentials

Gravitino 会动态生成临时凭证并分发给 Doris：

```sql
-- 创建动态凭证模式的 Catalog
CREATE CATALOG gravitino_vending PROPERTIES (
    'type' = 'iceberg',
    'warehouse' = 'warehouse',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
    'iceberg.rest.vended-credentials-enabled' = 'true'
);
```

### 3.2 验证连接和数据操作

```sql
-- 验证连接
SHOW DATABASES FROM gravitino_vending;

-- 切换到 vended credentials catalog
SWITCH gravitino_vending;

-- 创建数据库和表
CREATE DATABASE demo;
USE gravitino_vending.demo;

CREATE TABLE gravitino_table (
    id INT,
    name STRING
)
PROPERTIES (
    'write-format' = 'parquet'
);

-- 插入测试数据
INSERT INTO gravitino_table VALUES (1, 'Doris'), (2, 'Gravitino');

-- 查询验证
SELECT * FROM gravitino_table;
```

## 总结

通过本指南，你应该能够成功构建一个基于 Gravitino 和 Doris 的现代化湖仓架构。这个架构不仅具备高性能和高可用性，还通过先进的安全机制确保了数据访问的安全性和合规性。随着数据规模的增长和业务需求的变化，这个架构可以灵活扩展以满足企业级的各种需求。
