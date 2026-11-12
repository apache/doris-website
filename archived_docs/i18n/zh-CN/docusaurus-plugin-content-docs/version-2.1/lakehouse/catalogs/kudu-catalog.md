---
{
    "title": "Kudu Catalog",
    "language": "zh-CN",
    "description": "Kudu Catalog 通过 Trino Connector 兼容框架，使用 Trino Kudu Connector 来访问 Kudu 表。"
}
---

Kudu Catalog 通过 [Trino Connector](https://doris.apache.org/zh-CN/community/how-to-contribute/trino-connector-developer-guide/) 兼容框架，使用 Trino Kudu Connector 来访问 Kudu 表。

:::note
该功能为实验功能，自 3.0.1 版本开始支持。
:::

## 适用场景

| 场景 | 说明 |
| ---- | ---------------------------- |
| 数据集成 | 读取 Kudu 数据并写入到 Doris 内表。 |
| 数据写回 | 不支持。                         |

## 环境准备

### 编译 Kudu Connector 插件

> 需要 JDK 17 版本。

```shell
$ git clone https://github.com/apache/doris-thirdparty.git
$ cd doris-thirdparty
$ git checkout trino-435
$ cd plugin/trino-kudu
$ mvn clean package -Dmaven.test.skip=true
```

完成编译后，会在 `trino/plugin/trino-kudu/target/` 下得到 `trino-kudu-435/` 目录。

也可以直接下载预编译的 [trino-kudu-435-20240724.tar.gz](https://github.com/apache/doris-thirdparty/releases/download/trino-435-20240724/trino-kudu-435-20240724.tar.gz) 并解压。

### 部署 Kudu Connector

将 `trino-kudu-435/` 目录放到所有 FE 和 BE 部署路径的 `connectors/` 目录下。（如果没有，可以手动创建）。

```text
├── bin
├── conf
├── connectors
│   ├── trino-kudu-435
...
```

部署完成后，建议重启 FE、BE 节点以确保 Connector 可以被正确加载。

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'trino-connector', -- required
    'trino.connector.name' = 'kudu', -- required
    {TrinoProperties},
    {CommonProperties}
);
```

* `{TrinoProperties}`

  TrinoProperties 部分用于填写将传递给 Trino Connector 的属性，这些属性以`trino.`为前缀。理论上，Trino 支持的属性这里都支持，更多有关 Kudu 的属性可以参考 [Trino 文档](https://trino.io/docs/current/connector/kudu.html)。

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 Kudu 版本

更多有关 Kudu 的信息可以参考 [Trino 文档](https://trino.io/docs/current/connector/kudu.html)。

### 支持的元数据服务

更多有关 Kudu 的信息可以参考 [Trino 文档](https://trino.io/docs/current/connector/kudu.html)。

### 支持的存储系统

更多有关 Kudu 的信息可以参考 [Trino 文档](https://trino.io/docs/current/connector/kudu.html)。

## 列类型映射

| Kudu Type        | Trino Type    | Doris Type    | Comment                                 |
| ---------------- | ------------- | ------------- | --------------------------------------- |
| boolean          | boolean       | boolean       |                                         |
| int8             | tinyint       | tinyint       |                                         |
| int16            | smallint      | smallint      |                                         |
| int32            | integer       | int           |                                         |
| int64            | bigint        | bigint        |                                         |
| float            | real          | float         |                                         |
| double           | double        | double        |                                         |
| decimal(P, S)    | decimal(P, S) | decimal(P, S) |                                         |
| binary           | varbinary     | string        | 需要适用 HEX(col) 删除查询，才能返回和 Trino 一样的显示结果。 |
| string           | varchar       | string        |                                         |
| date             | date          | date          |                                         |
| unixtime_micros | timestamp(3)  | datetime(3)   |                                         |
| other            | UNSUPPORTED   |               |                                         |

## 基础示例

```sql
CREATE CATALOG kudu_catalog PROPERTIES (  
    'type' = 'trino-connector',  
    'trino.connector.name' = 'kudu', 
    'trino.kudu.client.master-addresses' = 'ip1:port1,ip2:port2,ip3,port3', 
    'trino.kudu.authentication.type' = 'NONE' 
);
```

## 查询操作

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH kudu_ctl;
USE kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 2. use kudu database directly
USE kudu_ctl.kudu_db;
SELECT * FROM kudu_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM kudu_ctl.kudu_db.kudu_tbl LIMIT 10;
```

