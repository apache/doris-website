---
{
    "title": "JuiceFS | Storages",
    "language": "zh-CN",
    "description": "本文档用于介绍访问 JuiceFS 时所需的参数。这些参数适用于：",
    "sidebar_label": "JuiceFS"
}
---

# JuiceFS

:::tip 版本支持
Doris 4.0.2 起支持
:::

[JuiceFS](https://juicefs.com) 是一款开源的、高性能的云原生分布式文件系统，完全兼容 HDFS API。Doris 将 `jfs://` 协议视为 HDFS 兼容协议，因此你可以使用与 HDFS 相同的方式访问存储在 JuiceFS 中的数据。

本文档用于介绍访问 JuiceFS 时所需的参数。这些参数适用于：

* Catalog 属性。
* Table Valued Function 属性。
* Broker Load 属性。
* Export 属性。
* Outfile 属性。

## 前提条件

访问 JuiceFS 依赖 `juicefs-hadoop` 客户端 jar 包。从 Doris 4.0.2 起，构建系统会自动下载并打包该 jar 包，存放位置如下：

- FE：`fe/lib/juicefs/`
- BE：`be/lib/java_extensions/juicefs/`

如果手动部署，请从 [Maven Central](https://repo1.maven.org/maven2/io/juicefs/juicefs-hadoop/) 下载 `juicefs-hadoop-<version>.jar`，并放置到上述目录中。

## 参数总览

由于 JuiceFS 兼容 HDFS，因此与 HDFS 共享相同的认证参数。此外，还需配置以下 JuiceFS 特有的参数：

| 属性名称 | 描述 | 是否必须 |
| --- | --- | --- |
| fs.defaultFS | 默认文件系统 URI，例如 `jfs://cluster`。 | 是 |
| fs.jfs.impl | Hadoop FileSystem 实现类，必须设置为 `io.juicefs.JuiceFileSystem`。 | 是 |
| juicefs.\<cluster\>.meta | JuiceFS 元数据引擎端点，例如 `redis://127.0.0.1:6379/1` 或 `mysql://user:pwd@(host:port)/db`。其中 `<cluster>` 需替换为 `fs.defaultFS` URI 中的集群名称。 | 是 |

关于 HDFS 认证参数（Simple 或 Kerberos），请参考 [HDFS](./hdfs.md) 文档。

所有以 `juicefs.` 为前缀的属性会透传给底层 JuiceFS Hadoop 客户端。

## 配置示例

### 配合 Hive Metastore 创建 Catalog

```sql
CREATE CATALOG jfs_hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<hms_host>:9083',
    'fs.defaultFS' = 'jfs://cluster',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'juicefs.cluster.meta' = 'redis://127.0.0.1:6379/1',
    'hadoop.username' = 'doris'
);
```

### Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("jfs://cluster/path/to/data/*")
    INTO TABLE `my_table`
)
WITH BROKER
(
    "fs.defaultFS" = "jfs://cluster",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1",
    "hadoop.username" = "doris"
);
```

### Table Valued Function

```sql
SELECT * FROM TABLE(
    "uri" = "jfs://cluster/path/to/file.parquet",
    "format" = "parquet",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1"
);
```

## 使用建议

* 确保 `juicefs-hadoop` jar 包部署在**所有** FE 和 BE 节点上。
* `juicefs.<cluster>.meta` 属性中的集群名称必须与 `jfs://` URI 中的集群名称一致。例如，如果 `fs.defaultFS = jfs://mycluster`，则元数据属性应为 `juicefs.mycluster.meta`。
* JuiceFS 支持多种元数据引擎（Redis、MySQL、TiKV、SQLite 等），请根据规模和可用性需求选择。
* HDFS 的 Kerberos 认证、HA Nameservice 配置以及 Hadoop 配置文件等，均与 JuiceFS 兼容。
