---
{
    "title": "LakeSoul Catalog",
    "language": "zh-CN"
}
---

Doris 支持通过存储在 PostgreSQL 中的元数据，访问并读取 LakeSoul 表数据。

[使用 Docker 快速体验 Apache Doris & LakeSoul](../best-practices/doris-lakesoul.md)

## 适用场景

| 场景 | 说明                 |
| ---- | ------------------------------------------------------ |
| 数据集成 | 读取 LakeSoul 数据并写入到 Doris 内表。或通过 Doris 计算引擎进行 ZeroETL 操作。 |
| 数据写回 | 不支持。                                                   |

## 配置 Catalog

### 语法

```sql
CREATE CATALOG lakesoul_catalog PROPERTIES (
    'type' = 'lakesoul',
    {LakeSoulProperties},
    {CommonProperties}
);
```

* `{LakeSoulProperties}`

  | 属性 | 说明 | 示例 |
    | --- | --- | --- |
    | `lakesoul.pg.username` | PG 源数据库的用户名 | |
    | `lakesoul.pg.password` | PG 源数据库的密码 | |
    | `lakesoul.pg.url` | PG 元数据库的 JDBC URL | `jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified` |

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。
  
如果 LakeSoul 的数据存储在 HDFS 上，需要将 `core-site.xml`，`hdfs-site.xml` 和 `hive-site.xml` 放到 FE 和 BE 的 `conf/` 目录下。优先读取 `conf/` 目录下的 hadoop 配置文件，再读取环境变量 `HADOOP_CONF_DIR` 的相关配置文件。

### 支持的 LakeSoul 版本

当前依赖的 LakeSoul 版本为 2.6.2。

### 支持的 LakeSoul 格式

- 支持 LakeSoul 的主键表、无主键表
- 支持 LakeSoul MOR 表读取。

## 列类型映射

| LakeSoul Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                            | boolean       |                                        |
| int8                            | tinyint       |                                        |
| int16                           | smallint      |                                        |
| int32                            | int           |                                        |
| int64                             | bigint        |                                        |
| float                              | float         |                                        |
| double                             | double        |                                        |
| decimal(P, S)                      | decimal(P, S) |                                        |
| string                            | string        |                                        |
| date                               | date          |                                        |
| timestamp(S)    						 | datetime(S)   | |
| list                              | array         |                                        |
| map                                | map           |                                        |
| row                                | struct        |                                        |
| other                              | UNSUPPORTED   |                                        |

## 基础示例

```sql
CREATE CATALOG lakesoul PROPERTIES (
    'type' = 'lakesoul',
    'lakesoul.pg.username' = 'lakesoul_test',
    'lakesoul.pg.password' = 'lakesoul_test',
    'lakesoul.pg.url' = 'jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified'
);
```

## 查询操作

### 基础查询

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

```sql
-- 1. switch to catalog, use database and query
SWITCH ls_ctl;
USE ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 2. use lakesoul database directly
USE ls_ctl.ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM ls_ctl.ls_db.ls_tbl LIMIT 10;
```


