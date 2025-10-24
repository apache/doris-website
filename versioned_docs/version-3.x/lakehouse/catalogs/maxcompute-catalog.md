---
{
    "title": "MaxCompute Catalog",
    "language": "en"
}
---

[MaxCompute](https://help.aliyun.com/zh/maxcompute/) is an enterprise-level SaaS (Software as a Service) cloud data warehouse on Alibaba Cloud. Through the open storage SDK provided by MaxCompute, Doris can access MaxCompute table information and perform queries.

## Applicable Scenarios

| Scenario | Description                 |
| ---- | ------------------------------------------------------ |
| Data Integration | Read MaxCompute data and write it to Doris internal tables. |
| Data Write-back | Not supported.                           |

## Notes

1. Starting from version 2.1.7, the MaxCompute Catalog is developed based on the [open storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1). Before this, it was developed based on the Tunnel API.

2. There are certain restrictions on the use of the open storage SDK. Please refer to the `Usage Restrictions` section in this [document](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1).

3. Before Doris version 3.1.3, a `Project` in MaxCompute is equivalent to a `Database` in Doris. After 3.1.3, You can use the `mc.enable.namespace.schema` parameter to introduce the MaxCompute schema level.

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```

* `{McRequiredProperties}`

  | Property Name        | Description                                                                                                         | Supported Doris Version |
  | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
  | `mc.default.project` | The name of the MaxCompute project you want to access. You can create and manage it in the [MaxCompute Project List](https://maxcompute.console.aliyun.com/cn-beijing/project-list). |                         |
  | `mc.access_key`     | AccessKey. You can create and manage it in the [Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak).                                          |                         |
  | `mc.secret_key`     | SecretKey. You can create and manage it in the [Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak).                                          |                         |
  | `mc.region`          | The region where MaxCompute is enabled. You can find the corresponding region from the Endpoint.                                                        | Before 2.1.7            |
  | `mc.endpoint`       | The region where MaxCompute is enabled. Please refer to the section below on how to obtain Endpoint and Quota for configuration.                         | 2.1.7 and later         |

* `{McOptionalProperties}`

  | Property Name              | Default Value   | Description                                                                 | Supported Doris Version |
  | -------------------------- | --------------- | --------------------------------------------------------------------------- | ----------------------- |
  | `mc.tunnel_endpoint`        | None            | Refer to the appendix on `Custom Service Address`.                          | Before 2.1.7            |
  | `mc.odps_endpoint`          | None            | Refer to the appendix on `Custom Service Address`.                          | Before 2.1.7            |
  | `mc.quota`                  | `pay-as-you-go` | Quota name. Please refer to the section on how to obtain Endpoint and Quota for configuration. | 2.1.7 and later         |
  | `mc.split_strategy`         | `byte_size`     | Sets the split strategy. Can be set to `byte_size` (split by byte size) or `row_count` (split by number of rows). | 2.1.7 and later         |
  | `mc.split_byte_size`        | `268435456`     | The file size (in bytes) read by each split. Default is 256 MB. Effective only when `"mc.split_strategy" = "byte_size"`. | 2.1.7 and later         |
  | `mc.split_row_count`        | `1048576`       | The number of rows read by each split. Effective only when `"mc.split_strategy" = "row_count"`. | 2.1.7 and later         |
  | `mc.split_cross_partition`  | `false`         | Whether the generated split crosses partitions.                             | 2.1.8 and later         |
  | `mc.connect_timeout`        | `10s`           | Timeout for connecting to MaxCompute.                                       | 2.1.8 and later         |
  | `mc.read_timeout`           | `120s`          | Timeout for reading from MaxCompute.                                        | 2.1.8 and later         |
  | `mc.retry_count`            | `4`             | Number of retries after a timeout.                                          | 2.1.8 and later         |
  | `mc.datetime_predicate_push_down` | `true`  | Whether to allow pushdown of predicate conditions of `timestamp/timestamp_ntz` types. Doris will lose precision (9 -> 6) when synchronizing these two types. Therefore, if the original data has a precision higher than 6 digits, condition pushdown may lead to inaccurate results. | 2.1.9/3.0.5 and later  |
  | `mc.enable.namespace.schema` | `false`             | Whether MaxCompute's schema level is supported. For details, see: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 and later  |
  
* `[CommonProperties]`

The CommonProperties section is used to fill in common properties. Please refer to the Catalog Overview section on [Common Properties](../catalog-overview.md).

### Supported MaxCompute Versions

Only the public cloud version of MaxCompute is supported. For support with the private cloud version, please contact the Doris community.

### Supported MaxCompute Formats

* Supports reading partitioned tables, clustered tables, and materialized views.

* Does not support reading MaxCompute external tables, logical views, or Delta Tables.

## Hierarchical Mapping

- `mc.enable.namespace.schema` is false

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | N/A        |
  | Database | Project    |
  | Table    | Table      |

- `mc.enable.namespace.schema` is true

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | Project    |
  | Database | Schema     |
  | Table    | Table      |

## Column Type Mapping

| MaxCompute Type  | Doris Type    | Comment                                                                      |
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
| datetime         | datetime(3)   | Fixed mapping to precision 3. You can specify the time zone using `SET [GLOBAL] time_zone = 'Asia/Shanghai'`. |
| timestamp_ntz    | datetime(6)   | The precision of MaxCompute's `timestamp_ntz` is 9, but Doris' DATETIME supports a maximum precision of 6. Therefore, the extra part will be directly truncated when reading data. |
| timestamp        | datetime(6)   | Since 2.1.9 & 3.0.5. The precision of MaxCompute's `timestamp` is 9, but Doris' DATETIME supports a maximum precision of 6. Therefore, the extra part will be directly truncated when reading data. |
| array            | array         |                                                                              |
| map              | map           |                                                                              |
| struct           | struct        |                                                                              |
| other            | UNSUPPORTED   |                                                                              |

## Examples

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```

If you are using a version earlier than 2.1.7 (exclusive), please use the following statements. (It is recommended to upgrade to 2.1.8 or later for usage)

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

Support Schema:

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

## Query Operations

### Basic Query

```sql
-- 1. Switch to catalog, use database, and query
SWITCH mc_ctl;
USE mc_ctl;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. Use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. Use fully qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```

## Appendix

### How to Obtain Endpoint and Quota (For Doris 2.1.7 and Later)

1. If using a dedicated resource group for Data Transmission Service (DTS)  

	Refer to the [documentation](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts) under the section **"Use Dedicated Data Service Resource Groups"**, specifically **"2. Authorization"**, to enable the required permissions. Then, navigate to the **"Quota Management"** list to view and copy the corresponding `QuotaName`, and specify it using `"mc.quota" = "QuotaName"`. At this point, you can choose to access MaxCompute via VPC or public network. However, VPC provides guaranteed bandwidth, while public network bandwidth is limited.

2. If using `pay-as-you-go`
 
   Refer to the [documentation](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1) under the section **"Using Open Storage (Pay-As-You-Go)"** to enable the Open Storage (Storage API) switch and grant permissions to the user corresponding to the Ak and SK. In this case, `mc.quota` defaults to `pay-as-you-go`, and no additional value needs to be specified. When using the pay-as-you-go model, MaxCompute can only be accessed via VPC, and public network access is not available. Only prepaid users can access MaxCompute via the public network.

3. Configure `mc.endpoint` based on the [Alibaba Cloud Endpoints Documentation](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)  
   
   For users accessing via VPC, refer to the **"VPC Network Endpoint"** column in the **"Regional Endpoint Table (Alibaba Cloud VPC Network Connection Method)"** to configure `mc.endpoint`.
   
   For users accessing via the public network, you can choose from the **"Classic Network Endpoint"** column in the **"Regional Endpoint Table (Alibaba Cloud Classic Network Connection Method)"**, or the **"External Network Endpoint"** column in the **"Regional Endpoint Table (External Network Connection Method)"** to configure `mc.endpoint`.
   
### Custom Service Address (For Doris Versions before 2.1.7)

In Doris versions before 2.1.7, the **Tunnel SDK** is used to interact with MaxCompute. Therefore, the following two endpoint properties need to be configured:

- `mc.odps_endpoint`: MaxCompute Endpoint, used to retrieve MaxCompute metadata (e.g., database and table information).
- `mc.tunnel_endpoint`: Tunnel Endpoint, used to read MaxCompute data.

By default, the MaxCompute Catalog generates endpoints based on the values of `mc.region` and `mc.public_access`.

The generated endpoint formats are as follows:

| `mc.public_access`  | `mc.odps_endpoint`                                       | `mc.tunnel_endpoint`                            |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `false`             | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true`              | `http://service.{mc.region}.maxcompute.aliyun.com/api`     | `http://dt.{mc.region}.maxcompute.aliyun.com`     |

Users can also manually specify `mc.odps_endpoint` and `mc.tunnel_endpoint` to customize the service addresses. This is particularly useful for private deployments of MaxCompute environments.

For details on configuring MaxCompute Endpoint and Tunnel Endpoint, refer to the documentation on [Endpoints for Different Regions and Network Connection Methods](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints).
