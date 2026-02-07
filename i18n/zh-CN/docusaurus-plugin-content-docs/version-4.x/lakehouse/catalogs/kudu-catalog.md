---
{
    "title": "Kudu Catalog",
    "language": "zh-CN",
    "description": "Apache Doris Kudu Catalog 使用指南：通过 Trino Connector 框架连接 Kudu 数据库，实现 Kudu 表数据的查询和集成。支持 Kerberos 认证、多种数据类型映射，快速完成 Kudu 与 Doris 的数据集成。"
}
---

## 概述

Kudu Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Trino Kudu Connector 来访问 Kudu 表。

:::note
- 该功能为实验功能，自 3.0.1 版本开始支持。
:::

:::note
- 该功能不依赖 Trino 集群环境，仅使用 Trino 兼容插件。
:::

### 适用场景

| 场景     | 支持情况                           |
| -------- | ---------------------------------- |
| 数据集成 | 读取 Kudu 数据并写入到 Doris 内表 |
| 数据写回 | 不支持                            |

### 版本兼容性

- **Doris 版本**：3.0.1 及以上
- **Trino Connector 版本**：435
- **Kudu 版本**：具体支持的版本请参考 [Trino 文档](https://trino.io/docs/435/connector/kudu.html)

## 快速开始

### 步骤 1：准备 Connector 插件

你可以选择以下两种方式之一来获取 Kudu Connector 插件：

**方式一：使用预编译包（推荐）**

直接下载预编译的插件包并解压：

```shell
wget https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz
tar -xzf trino-kudu-435-20240724.tar.gz
```

**方式二：手动编译**

如果需要自定义编译，按照以下步骤操作（需要 JDK 17）：

```shell
git clone https://github.com/apache/doris-thirdparty.git
cd doris-thirdparty
git checkout trino-435
cd plugin/trino-kudu
mvn clean package -Dmaven.test.skip=true
```

完成编译后，会在 `trino/plugin/trino-kudu/target/` 下得到 `trino-kudu-435/` 目录。

### 步骤 2：部署插件

1. 将 `trino-kudu-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下（如果没有该目录，请手动创建）：

   ```text
   ├── bin
   ├── conf
   ├── connectors
   │   ├── trino-kudu-435
   ...
   ```

2. 重启所有 FE 和 BE 节点，以确保 Connector 被正确加载。

### 步骤 3：创建 Catalog

**基础配置（无认证）**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'NONE'
);
```

**Kerberos 认证配置**

```sql
CREATE CATALOG kudu_catalog PROPERTIES (
    'type' = 'trino-connector',
    'trino.connector.name' = 'kudu',
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3:port3',
    'trino.kudu.authentication.type' = 'KERBEROS',
    'trino.kudu.authentication.client.principal' = 'user@DOMAIN.COM',
    'trino.kudu.authentication.client.keytab' = '/path/to/kudu.keytab',
    'trino.kudu.authentication.config' = '/etc/krb5.conf',
    'trino.kudu.authentication.server.principal.primary' = 'kudu'
);
```

### 步骤 4：查询数据

创建 Catalog 后，可以通过以下三种方式查询 Kudu 表数据：

```sql
-- 方式 1：切换到 Catalog 后查询
SWITCH kudu_catalog;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 方式 2：使用两级路径
USE kudu_catalog.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 方式 3：使用全限定名
SELECT * FROM kudu_catalog.kudu_db.kudu_tbl LIMIT 10;
```

## 配置说明

### Catalog 配置参数

创建 Kudu Catalog 的基本语法如下：

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector',          -- 必填，固定值
    'trino.connector.name' = 'kudu',     -- 必填，固定值
    {TrinoProperties},                   -- Trino Connector 相关属性
    {CommonProperties}                   -- 通用属性
);
```

#### TrinoProperties 参数

TrinoProperties 用于配置 Trino Kudu Connector 的专有属性，这些属性以 `trino.` 为前缀。常用参数包括：

| 参数名称                                              | 必填 | 默认值 | 说明                        |
| ----------------------------------------------------- | ---- | ------ | --------------------------- |
| `trino.kudu.client.master-addresses`                  | 是   | -      | Kudu Master 节点地址列表    |
| `trino.kudu.authentication.type`                      | 否   | NONE   | 认证类型：NONE 或 KERBEROS  |
| `trino.kudu.authentication.client.principal`          | 否   | -      | Kerberos 客户端 principal   |
| `trino.kudu.authentication.client.keytab`             | 否   | -      | Kerberos keytab 文件路径    |
| `trino.kudu.authentication.config`                    | 否   | -      | Kerberos 配置文件路径       |
| `trino.kudu.authentication.server.principal.primary`  | 否   | -      | Kudu 服务端 principal 前缀  |

更多 Kudu Connector 配置参数请参考 [Trino 官方文档](https://trino.io/docs/435/connector/kudu.html)。

#### CommonProperties 参数

CommonProperties 用于配置 Catalog 的通用属性，例如元数据刷新策略、权限控制等。详细说明请参阅[数据目录概述](../catalog-overview.md)中「通用属性」部分。

## 数据类型映射

在使用 Kudu Catalog 时，数据类型会按照以下规则进行映射：

| Kudu Type        | Trino Type    | Doris Type    | 说明                                                     |
| ---------------- | ------------- | ------------- | -------------------------------------------------------- |
| boolean          | boolean       | boolean       |                                                          |
| int8             | tinyint       | tinyint       |                                                          |
| int16            | smallint      | smallint      |                                                          |
| int32            | integer       | int           |                                                          |
| int64            | bigint        | bigint        |                                                          |
| float            | real          | float         |                                                          |
| double           | double        | double        |                                                          |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                                          |
| binary           | varbinary     | string        | 需要使用 `HEX(col)` 函数查询，才能得到与 Trino 一致的显示结果 |
| string           | varchar       | string        |                                                          |
| date             | date          | date          |                                                          |
| unixtime_micros  | timestamp(3)  | datetime(3)   |                                                          |
| other            | UNSUPPORTED   | -             | 不支持的类型                                             |

:::tip
对于 `binary` 类型，如果需要以十六进制格式显示，请使用 `HEX()` 函数包裹列名，例如：`SELECT HEX(binary_col) FROM table`。
:::

