---
{
    "title": "Aliyun DLF",
    "language": "en",
    "description": "This document describes how to use the CREATE CATALOG statement to connect and access Alibaba Cloud Data Lake Formation (DLF) metadata service."
}
---

This document describes how to use the `CREATE CATALOG` statement to connect and access Alibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) metadata service.

## DLF Version Notes

- For DLF 1.0 version, Doris accesses DLF through DLF's Hive Metastore compatible interface. Supports Paimon Catalog and Hive Catalog.
- For DLF versions 2.5 and later, Doris accesses DLF through DLF's Rest interface. Only supports Paimon Catalog.

### DLF 1.0

| Parameter Name | Legacy Name | Description | Default Value | Required |
|----------------|-------------|-------------|---------------|----------|
| `dlf.endpoint` | - | DLF endpoint, see: [Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.region` | - | DLF region, see: [Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.uid` | - | Alibaba Cloud account ID. Can be viewed in personal information at the top right corner of the console. | None | Yes |
| `dlf.access_key` | - | Alibaba Cloud AccessKey for accessing DLF service. | None | Yes |
| `dlf.secret_key` | - | Alibaba Cloud SecretKey for accessing DLF service. | None | Yes |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID. Used to specify metadata catalog. If not set, the default catalog is used. | None | No |
| `warehouse` | - | Storage path of the Warehouse, only required for Paimon Catalog. Note that the object storage path must end with `/`. | None | No |

> Note:
>
> For versions before 3.1.0, please use the former names.

### DLF 2.5+ (Rest Catalog)

> Supported since version 3.1.0

| Parameter Name | Legacy Name | Description | Default Value | Required |
|----------------|-------------|-------------|---------------|----------|
| `uri` | - | DLF REST URI. Example: http://cn-beijing-vpc.dlf.aliyuncs.com | None | Yes |
| `warehouse` | - | Warehouse name. Note: directly fill in the name of the Catalog to connect to, not the Paimon table storage path | None | Yes |
| `paimon.rest.token.provider` | - | Token provider, fixed value `dlf` | None | Yes |
| `paimon.rest.dlf.access-key-id` | - | Alibaba Cloud AccessKey for accessing DLF service. | None | Yes |
| `paimon.rest.dlf.access-key-secret` | - | Alibaba Cloud SecretKey for accessing DLF service. | None | Yes |

DLF Rest Catalog does not require providing storage service (OSS) Endpoint and Region information. Doris will use DLF Rest Catalog's Vended Credential to obtain temporary credential information for accessing OSS.

## Examples

### DLF 1.0

Create a Hive Catalog with DLF as the metadata service:

```sql
CREATE CATALOG hive_dlf_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

Create a Paimon Catalog with DLF as the metadata service:

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.endpoint' = '<DLF_ENDPOINT>',
    'dlf.region' = '<DLF_REGION>',
    'dlf.uid' = '<YOUR_ALICLOUD_UID>',
    'dlf.access_key' = '<YOUR_ACCESS_KEY>',
    'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### DLF 2.5+ (Rest Catalog)

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'my_catalog_name',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = '<YOUR_ACCESS_KEY>',
    'paimon.rest.dlf.access-key-secret' = '<YOUR_SECRET_KEY>'
);
```
