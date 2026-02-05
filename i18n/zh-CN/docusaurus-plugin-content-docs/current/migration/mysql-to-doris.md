---
{
    "title": "MySQL 迁移到 Doris",
    "language": "zh-CN",
    "description": "从 MySQL 迁移数据到 Apache Doris 的完整指南"
}
---

本指南介绍如何将数据从 MySQL 迁移到 Apache Doris。MySQL 是最常见的迁移源之一，Doris 对 MySQL 协议有很好的兼容性，使迁移变得简单。

## 注意事项

1. **协议兼容**：Doris 兼容 MySQL 协议，因此现有的 MySQL 客户端和工具可以与 Doris 配合使用。

2. **实时需求**：如果需要实时同步，推荐使用 Flink CDC，支持自动建表和 Schema 变更。

3. **全库同步**：Flink Doris Connector 支持同步整个 MySQL 数据库，包括 DDL 操作。

## 数据类型映射

| MySQL 类型 | Doris 类型 | 说明 |
|------------|------------|------|
| BOOLEAN / TINYINT(1) | BOOLEAN | |
| TINYINT | TINYINT | |
| SMALLINT | SMALLINT | |
| MEDIUMINT | INT | |
| INT / INTEGER | INT | |
| BIGINT | BIGINT | |
| FLOAT | FLOAT | |
| DOUBLE | DOUBLE | |
| DECIMAL(P, S) | DECIMAL(P, S) | |
| DATE | DATE | |
| DATETIME | DATETIME | |
| TIMESTAMP | DATETIME | 以 UTC 存储，读取时转换 |
| TIME | STRING | Doris 不支持 TIME 类型 |
| YEAR | INT | |
| CHAR(N) | CHAR(N) | |
| VARCHAR(N) | VARCHAR(N) | |
| TEXT / MEDIUMTEXT / LONGTEXT | STRING | |
| BINARY / VARBINARY | STRING | |
| BLOB / MEDIUMBLOB / LONGBLOB | STRING | |
| JSON | JSON | |
| ENUM | STRING | |
| SET | STRING | |
| BIT | BOOLEAN / BIGINT | BIT(1) 映射为 BOOLEAN |

## 迁移选项

### 选项 1：Flink CDC（推荐用于实时同步）

Flink CDC 捕获 MySQL binlog 变更并流式传输到 Doris。这是以下场景的推荐方法：

- 实时数据同步
- 自动建表的全库迁移
- 支持 Schema 演进的持续同步

#### 前提条件

- MySQL 5.7+ 或 8.0+，启用 binlog
- Flink 1.15+ 配合 Flink CDC 3.x 和 Flink Doris Connector

#### 步骤 1：配置 MySQL Binlog

确保 MySQL 中有以下设置：

```ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
expire_logs_days = 7
```

创建 CDC 用户：

```sql
CREATE USER 'flink_cdc'@'%' IDENTIFIED BY 'password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'flink_cdc'@'%';
FLUSH PRIVILEGES;
```

#### 步骤 2：使用 Flink SQL 单表同步

```sql
-- 源：MySQL CDC
CREATE TABLE mysql_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at TIMESTAMP(3),
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql-host',
    'port' = '3306',
    'username' = 'flink_cdc',
    'password' = 'password',
    'database-name' = 'source_db',
    'table-name' = 'orders',
    'server-time-zone' = 'UTC'
);

-- 目标：Doris
CREATE TABLE doris_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at DATETIME
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'target_db.orders',
    'username' = 'doris_user',
    'password' = 'doris_password',
    'sink.enable-2pc' = 'true',
    'sink.label-prefix' = 'mysql_orders_sync'
);

-- 开始同步
INSERT INTO doris_orders SELECT * FROM mysql_orders;
```

#### 步骤 3：使用 Flink Doris Connector 全库同步

Flink Doris Connector 提供强大的整库同步功能：

```shell
<FLINK_HOME>/bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    flink-doris-connector-1.18-25.1.0.jar \
    mysql-sync-database \
    --database source_db \
    --mysql-conf hostname=mysql-host \
    --mysql-conf port=3306 \
    --mysql-conf username=flink_cdc \
    --mysql-conf password=password \
    --mysql-conf database-name=source_db \
    --doris-conf fenodes=doris-fe:8030 \
    --doris-conf username=doris_user \
    --doris-conf password=doris_password \
    --doris-conf jdbc-url=jdbc:mysql://doris-fe:9030 \
    --table-conf replication_num=3 \
    --including-tables "orders|customers|products"
```

关键选项：

| 参数 | 说明 |
|------|------|
| `--including-tables` | 要包含的表的正则表达式 |
| `--excluding-tables` | 要排除的表的正则表达式 |
| `--multi-to-one-origin` | 多源表映射到一个目标表 |
| `--create-table-only` | 仅创建表不同步数据 |

### 选项 2：JDBC Catalog

JDBC Catalog 允许从 MySQL 直接查询和批量迁移。

#### 步骤 1：下载 MySQL JDBC 驱动

```bash
wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.33/mysql-connector-java-8.0.33.jar
cp mysql-connector-java-8.0.33.jar $DORIS_HOME/fe/jdbc_drivers/
cp mysql-connector-java-8.0.33.jar $DORIS_HOME/be/jdbc_drivers/
```

#### 步骤 2：创建 MySQL Catalog

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'mysql_user',
    'password' = 'mysql_password',
    'jdbc_url' = 'jdbc:mysql://mysql-host:3306/source_db',
    'driver_url' = 'mysql-connector-java-8.0.33.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

#### 步骤 3：查询和迁移

```sql
-- 探索源数据
SWITCH mysql_catalog;
SHOW DATABASES;
USE source_db;
SHOW TABLES;
SELECT * FROM orders LIMIT 10;

-- 在 Doris 中创建目标表
SWITCH internal;
CREATE TABLE target_db.orders (
    order_id INT,
    customer_id INT,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(32)
)
UNIQUE KEY(order_id, order_date)
PARTITION BY RANGE(order_date) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "replication_num" = "3"
);

-- 迁移数据
INSERT INTO internal.target_db.orders
SELECT order_id, customer_id, order_date, total_amount, status
FROM mysql_catalog.source_db.orders;
```

### 选项 3：DataX

[DataX](https://github.com/alibaba/DataX) 是一个广泛使用的数据同步工具，支持 MySQL 到 Doris 的迁移。

#### DataX 任务配置

```json
{
    "job": {
        "setting": {
            "speed": {
                "channel": 4
            }
        },
        "content": [{
            "reader": {
                "name": "mysqlreader",
                "parameter": {
                    "username": "mysql_user",
                    "password": "mysql_password",
                    "connection": [{
                        "querySql": ["SELECT order_id, customer_id, order_date, total_amount, status FROM orders"],
                        "jdbcUrl": ["jdbc:mysql://mysql-host:3306/source_db"]
                    }]
                }
            },
            "writer": {
                "name": "doriswriter",
                "parameter": {
                    "feLoadUrl": ["doris-fe:8030"],
                    "jdbcUrl": "jdbc:mysql://doris-fe:9030/",
                    "database": "target_db",
                    "table": "orders",
                    "username": "doris_user",
                    "password": "doris_password",
                    "loadProps": {
                        "format": "json",
                        "strip_outer_array": true
                    }
                }
            }
        }]
    }
}
```

运行任务：

```bash
python datax.py mysql_to_doris.json
```

## 处理常见问题

### 自增列

MySQL AUTO_INCREMENT 列应映射到 Doris 的自增功能：

```sql
-- 带自增的 Doris 表
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT,
    username VARCHAR(64),
    email VARCHAR(128)
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8;
```

迁移时，您可能希望保留原始 ID：

```sql
-- 迁移时保留原 ID
INSERT INTO users (user_id, username, email)
SELECT user_id, username, email
FROM mysql_catalog.source_db.users;
```

### 处理 ENUM 和 SET 类型

MySQL ENUM 和 SET 类型在 Doris 中作为 STRING 迁移：

```sql
-- MySQL 源表
CREATE TABLE products (
    id INT,
    status ENUM('active', 'inactive', 'pending'),
    tags SET('featured', 'sale', 'new')
);

-- Doris 目标表
CREATE TABLE products (
    id INT,
    status VARCHAR(32),
    tags VARCHAR(128)
)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

### 大表迁移性能

对于数十亿行的表：

1. **增加 Flink 并行度**：
```sql
SET 'parallelism.default' = '8';
```

2. **调整 Doris 写缓冲**：
```sql
-- 在 Flink sink 配置中
'sink.buffer-size' = '1048576',
'sink.buffer-count' = '3'
```

## 验证

迁移后，验证数据完整性：

```sql
-- 行数比较
SELECT
    'mysql' as source,
    COUNT(*) as cnt
FROM mysql_catalog.source_db.orders
UNION ALL
SELECT
    'doris' as source,
    COUNT(*) as cnt
FROM internal.target_db.orders;

-- 校验和验证（示例）
SELECT
    SUM(order_id) as id_sum,
    SUM(total_amount) as amount_sum,
    COUNT(DISTINCT customer_id) as unique_customers
FROM internal.target_db.orders;
```

## 下一步

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - 详细的连接器文档
- [数据导入](../data-operate/import/load-manual.md) - 其他导入方法
- [数据模型](../table-design/data-model/overview.md) - 选择正确的表模型
