---
{
  "title": "Hive Metastore",
  "language": "zh-CN"
}
---
# 使用 `CREATE CATALOG` 连接外部元数据服务的参数说明

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问外部元数据服务时支持的所有参数，当前支持 Hive、Iceberg 和 Paimon 三种 Catalog 类型。

## ✅ 当前支持的 Catalog 类型

| Catalog 类型 | 类型标识 (`type`)   | 描述                                |
|--------------|---------------------|-------------------------------------|
| Hive         | `hms`               | 对接 Hive Metastore 的 Catalog      |
| Iceberg      | `iceberg_hms` / `iceberg_rest` | 对接 Iceberg 表格式                |
| Paimon       | `paimon`            | 对接 Apache Paimon 表格式           |

---

# 一、Hive Catalog

Hive Catalog 用于连接 Hive Metastore，并读取 Hive 表信息。支持 Kerberos 认证。

## 📋 参数总揽

| 参数名称                             | 是否必须 | 默认值   | 简要描述                                                     |
|--------------------------------------|----------|----------|--------------------------------------------------------------|
| `type`                               | ✅ 是    | 无       | Catalog 类型，Hive 固定为 `hms`                              |
| `hive.metastore.uris`                | ✅ 是    | 无       | Hive Metastore 的 URI 地址                                   |
| `hive.conf.resources`                | 否       | 空       | hive-site.xml 配置文件相对路径                               |
| `hive.metastore.authentication.type` | 否       | simple   | Metastore 认证方式，支持 `simple` 或 `kerberos`              |
| `hive.metastore.service.principal`   | 否       | 空       | Kerberos 服务端 principal                                     |
| `hive.metastore.client.principal`    | 否       | 空       | Kerberos 客户端 principal                                     |
| `hive.metastore.client.keytab`       | 否       | 空       | Kerberos 客户端 keytab 文件路径                              |

## 📖 参数详细说明

### `type`
Catalog 类型，Hive 固定为 `hms`  
示例：`"type" = "hms"`

### `hive.metastore.uris`
Hive Metastore 的 URI 地址，支持多个逗号分隔  
示例：`"hive.metastore.uris" = "thrift://127.0.0.1:9083"`

### `hive.conf.resources`
hive-site.xml 配置文件路径，默认目录为 `/plugins/hadoop_conf/`  
示例：`"hive.conf.resources" = "hms-1/hive-site.xml"`

### `hive.metastore.authentication.type`
认证方式：`simple`（默认）或 `kerberos`  
示例：`"hive.metastore.authentication.type" = "kerberos"`

### `hive.metastore.service.principal`
Hive 服务端 principal，支持 `_HOST` 占位符  
示例：`"hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM"`

### `hive.metastore.client.principal`
客户端 principal（Kerberos 模式）  
示例：`"hive.metastore.client.principal" = "doris/_HOST@EXAMPLE.COM"`

### `hive.metastore.client.keytab`
keytab 文件路径，所有 FE 节点均需存在  
示例：`"hive.metastore.client.keytab" = "conf/doris.keytab"`

## ✅ 示例：Hive Catalog（Kerberos）

```
CREATE CATALOG hive_catalog WITH (
  "type" = "hms",
  "hive.metastore.uris" = "thrift://127.0.0.1:9083",
  "hive.metastore.authentication.type" = "kerberos",
  "hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM",
  "hive.metastore.client.principal" = "doris/_HOST@EXAMPLE.COM",
  "hive.metastore.client.keytab" = "conf/doris.keytab"
);
```

---

# 二、Iceberg Catalog

支持使用 Hive Metastore。

## 📋 参数总揽

| 参数名称                                 | 是否必须 | 默认值         | 简要描述                                    |
|--------------------------------------|----------|----------------|-----------------------------------------|
| `type`                               | ✅ 是    | 无             | Catalog 类型：固定为 `iceberg`                |
| `iceberg.catalog.type`               | ✅ 是    | 无             | Mestadata Catalog 类型，固定为 `hms`          |
| `warehouse`                          | ✅ 是    | 无             | Iceberg 仓库路径                            |
| `hive.metastore.uris`                | ✅ 是    | 无       | Hive Metastore 的 URI 地址                 |
| `hive.conf.resources`                | 否       | 空       | hive-site.xml 配置文件相对路径                  |
| `hive.metastore.authentication.type` | 否       | simple   | Metastore 认证方式，支持 `simple` 或 `kerberos` |
| `hive.metastore.service.principal`   | 否       | 空       | Kerberos 服务端 principal                  |
| `hive.metastore.client.principal`    | 否       | 空       | Kerberos 客户端 principal                  |
| `hive.metastore.client.keytab`       | 否       | 空       | Kerberos 客户端 keytab 文件路径                |


### `type`
Catalog 类型，Hive 固定为 `hms`  
示例：`"type" = "hms"`

### `hive.metastore.uris`
Hive Metastore 的 URI 地址，支持多个逗号分隔  
示例：`"hive.metastore.uris" = "thrift://127.0.0.1:9083"`

### `hive.conf.resources`
hive-site.xml 配置文件路径，默认目录为 `/plugins/hadoop_conf/`  
示例：`"hive.conf.resources" = "hms-1/hive-site.xml"`

### `hive.metastore.authentication.type`
认证方式：`simple`（默认）或 `kerberos`  
示例：`"hive.metastore.authentication.type" = "kerberos"`

### `hive.metastore.service.principal`
Hive 服务端 principal，支持 `_HOST` 占位符  
示例：`"hive.metastore.service.principal" = "hive/_HOST@EXAMPLE.COM"`

### `hive.metastore.client.principal`
客户端 principal（Kerberos 模式）  
示例：`"hive.metastore.client.principal" = "doris/_HOST@EXAMPLE.COM"`

### `hive.metastore.client.keytab`
keytab 文件路径，所有 FE 节点均需存在  
示例：`"hive.metastore.client.keytab" = "conf/doris.keytab"`

## ✅ 示例

```
CREATE CATALOG iceberg_catalog WITH (
  "type" = "iceberg_hms",
  "iceberg.hive.metastore.uris" = "thrift://127.0.0.1:9083",
  "warehouse" = "hdfs:///user/hive/warehouse"
  ----
  Standard Hive Metastore parameters
);
```


---

# 三、Paimon Catalog

补充中


---

# 四、常见问题 FAQ

**Q1:** hive-site.xml 是必须的吗？  
不是，仅当需要从中读取认证配置时使用。

**Q2:** keytab 文件是否必须每个节点都存在？  
是的，所有 FE 节点必须可访问指定路径。
