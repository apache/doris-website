---
{
    "title": "MaxCompute Catalog",
    "language": "zh-CN",
    "description": "MaxCompute 是阿里云上的企业级 SaaS（Software as a Service）模式云数据仓库。通过 MaxCompute 提供的开放存储 SDK，Doris 可以获取 MaxCompute 的表信息并进行查询。"
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) 是阿里云上的企业级 SaaS（Software as a Service）模式云数据仓库。通过 MaxCompute 提供的开放存储 SDK，Doris 可以获取 MaxCompute 的表信息并进行查询。

## 适用场景

| 场景 | 说明                 |
| ---- | ------------------------------------------------------ |
| 数据集成 | 读取 MaxCompute 数据并写入到 Doris 内表。 |
| 数据写回 | 不支持。                           |

## 使用须知

1. 自 2.1.7 版本开始，MaxCompute Catalog 基于 [开放存储 SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) 开发，在这之前，基于 Tunnel API 进行开发。

2. 开放存储 SDK 的使用有一定的限制，请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) 中 `使用限制` 的章节。

3. 在 Doris 3.1.3 版本之前，MaxCompute 中的 Project 相当于 Doris 中的 Database。3.1.3 版本中，可以通过 `mc.enable.namespace.schema` 参数引入 MaxCompute 的 schema 层级。

## 配置 Catalog

### 语法

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McRequiredProperties}`

  | 属性名                | 说明                                                                                                                 | 支持的 Doris 版本 |
  | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------ |
  | `mc.default.project` | 想要访问的 MaxCompute 项目名称。可以在 [MaxCompute 项目列表](https://maxcompute.console.aliyun.com/cn-beijing/project-list) 中创建和管理。 |              |
  | `mc.access_key`     | AccessKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。                                           |              |
  | `mc.secret_key`     | SecretKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。                                           |              |
  | `mc.region`          | MaxCompute 开通的地域。可以从 Endpoint 中找到对应的 Region                                                                        | 2.1.7（不含）之前 |
  | `mc.endpoint`       | MaxCompute 开通的地域。请参照下文的如何获取 Endpoint 和 Quota 来配置。                                                                    | 2.1.7（含）之后  |

* `{McOptionalProperties}`

  | 属性名                        | 默认值           | 说明                                                                         | 支持的 Doris 版本 |
  | -------------------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
  | `mc.tunnel_endpoint`        | 无             | 参考附录中的`自定义服务地址 `。                                                          | 2.1.7（不含）之前 |
  | `mc.odps_endpoint`          | 无             | 参考附录中的`自定义服务地址 `。                                                          | 2.1.7（不含）之前 |
  | `mc.quota`                   | `pay-as-you-go` | Quota 名称。请参照下文的 如何获取 Endpoint 和 Quota 来配置                                    | 2.1.7（含）之后  |
  | `mc.split_strategy`         | `byte_size`    | 设置 split 的划分方式，可设置为按照字节大小划分 `byte_size` 和按照数据行数划分 `row_count`                 | 2.1.7（含）之后  |
  | `mc.split_byte_size`       | `268435456`     | 每个 split 读取的文件大小，单位为字节，默认为 256MB，当且仅当 `"mc.split_strategy" = "byte_size"` 时生效 | 2.1.7（含）之后  |
  | `mc.split_row_count`       | `1048576`       | 每个 split 读多少行，当且仅当 `"mc.split_strategy" = "row_count"` 时生效                   | 2.1.7（含）之后  |
  | `mc.split_cross_partition` | `false`         | 生成的 split 是否跨分区                                                             | 2.1.8（含）之后  |
  | `mc.connect_timeout`        | `10s`           | 连接 maxcompute 的超时时间                                                          | 2.1.8（含）之后  |
  | `mc.read_timeout`           | `120s`          | 读取 maxcompute 的超时时间                                                          | 2.1.8（含）之后  |
  | `mc.retry_count`            | `4`             | 超时后的重试次数                                                                   | 2.1.8（含）之后  |
  | `mc.datetime_predicate_push_down` | `true`             | 是否允许下推 `timestamp/timestamp_ntz` 类型的谓词条件。Doris 对这两个类型的同步会丢失精度（9 -> 6）。因此如果原数据精度高于 6 位，则条件下推可能导致结果不准确。         | 2.1.9/3.0.5（含）之后  |
  | `mc.account_format` | `name`             | 阿里云国际站和中国站的账号系统不一致，对于国际站用户，如出现如 `user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account` 的错误，可指定该参数为 `id`。 | 3.0.9/3.1.1（含）之后  |
  | `mc.enable.namespace.schema` | `false`             | 是否支持 MaxCompute 的 schema 层级。详见：https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3（含）之后  |

* `[CommonProperties]`

  CommonProperties 部分用于填写通用属性。请参阅[ 数据目录概述 ](../catalog-overview.md)中【通用属性】部分。

### 支持的 MaxCompute 版本

仅支持公有云版本的 MaxCompute。私有云版本支持请联系 Doris 社区支持。

### 支持的 MaxCompute 表

* 支持读取分区表、聚簇表、物化视图。

* 不支持读取 MaxCompute 的外部表、逻辑视图、Delta Table。

## 层级映射

- `mc.enable.namespace.schema` 为 false

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | N/A        |
  | Database | Project    |
  | Table    | Table      |

- `mc.enable.namespace.schema` 为 true

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | Project    |
  | Database | Schema     |
  | Table    | Table      |

## 列类型映射

| MaxCompute Type | Doris Type    | Comment                                                                      |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| bolean           | boolean       |                                                                              |
| tiny             | tinyint       |                                                                              |
| tinyint          | tinyint       |                                                                              |
| smallint         | smallint      |                                                                              |
| int              | int           |                                                                              |
| bigint           | bigint        |                                                                              |
| float            | float         |                                                                              |
| double           | double        |                                                                              |
| decimal(P, S)    | decimal(P, S) |                                                                              |
| char(N)          | char(N)       |                                                                              |
| varchar(N)       | varchar(N)    |                                                                              |
| string           | string        |                                                                              |
| date             | date          |                                                                              |
| datetime         | datetime(3)   | 固定映射到精度 3。可以通过 `SET [GLOBAL] time_zone = 'Asia/Shanghai'` 来指定时区                |
| timestamp_ntz   | datetime(6)   | MaxCompute 的 `timestamp_ntz` 精度为 9, Doris 的 DATETIME 最大精度只有 6，故读取数据时会将多的部分直接截断。 |
| timestamp   | datetime(6)   | 自 2.1.9/3.0.5 支持。MaxCompute 的 `timestamp` 精度为 9, Doris 的 DATETIME 最大精度只有 6，故读取数据时会将多的部分直接截断。 |
| array            | array         |                                                                              |
| map              | map           |                                                                              |
| struct           | struct        |                                                                              |
| other            | UNSUPPORTED   |                                                                              |

## 基础示例

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```

如使用 2.1.7（不含）之前的版本，请使用如下语句。（建议升级到 2.1.8 后使用）

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk'
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```

支持 Schema：

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk'
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```

## 查询操作

### 基础查询

```sql
-- 1. switch to catalog, use database and query
SWITCH mc_ctl;
USE mc_ctl;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

## 附录

### 如何获取 Endpoint 和 Quota(适用于 Doris 2.1.7 之后)

1. 如果使用数据传输服务独享资源组

	请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts) 中【使用独享数据服务资源组】章节中的【2.授权】来开启相应的权限，并在【配额（Quota）管理】列表中，查看并复制对应的 `QuotaName`，指定 `"mc.quota" = "QuotaName"`。此时您可以选择 VPC 或公网来访问 MaxCompute，但是走 VPC 的带宽有保障，公网带宽资源小。

2. 如果使用按量付费

	请参照该 [文档](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) 中【使用开放存储（按量付费）】的章节，来开启开放存储 (Storage API) 开关，并给 Ak,SK 对应的用户赋予权限。此时 `mc.quota` 为默认值 `pay-as-you-go`，不需要额外指定该值。按量付费情况下，只能使用 VPC 来访问 MaxCompute，无法通过公网访问。只有预付费用户才能通过公网访问 MaxCompute。

3. 根据 [阿里云 Endpoints 文档](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints) 中的【地域 Endpoint 对照表】来配置 `mc.endpoint`

  使用 VPC 访问的用户，需要根据【各地域 Endpoint 对照表（阿里云 VPC 网络连接方式）】表中的【VPC 网络 Endpoint】列来配置 `mc.endpoint` 。使用公网访问的用户，可以选择【各地域 Endpoint 对照表（阿里云经典网络连接方式）】表中的【经典网络 Endpoint】列、或者选择【各地域 Endpoint 对照表（外网连接方式)】表中的【外网 Endpoint 列来配置 `mc.endpoint`。

### 自定义服务地址 (适用于 Doris 2.1.7 之前)

在 Doris 2.1.7 之前的版本中，使用 Tunnel SDK 与 MaxCompute 交互，因此需要使用以下两个 endpoint 属性：

* `mc.odps_endpoint`：MaxCompute Endpoint，用于获取 MaxCompute 元数据（库表信息）。

* `mc.tunnel_endpoint`: Tunnel Endpoint，用于读取 MaxCompute 数据。

默认情况下，MaxCompute Catalog 根据 `mc.region` 和  `mc.public_access` 去生成 endpoint。

生成后的格式如下：

| `mc.public_access`  | `mc.odps_endpoint`                                       | `mc.tunnel_endpoint`                            |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| false               | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| true                | `http://service.{mc.region}.maxcompute.aliyun.com/api`     | `http://dt.{mc.region}.maxcompute.aliyun.com`     |

用户也可以单独指定`mc.odps_endpoint` 和 `mc.tunnel_endpoint` 来自定义服务地址，适用于一些私有部署的 MaxCompute 环境。

MaxCompute Endpoint 和 Tunnel Endpoint 的配置请参见[各地域及不同网络连接方式下的 Endpoint](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)。



