---
{
    "title": "MaxCompute",
    "language": "en"
}
---

MaxCompute (previously known as ODPS) is a data warehousing solution that can process terabytes or petabytes of data.

> [What is MaxCompute](https://www.alibabacloud.com/help/en/maxcompute/product-overview/what-is-maxcompute)

## Connect to MaxCompute

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.region" = "cn-beijing",
  "mc.default.project" = "your-project",
  "mc.access_key" = "ak",
  "mc.secret_key" = "sk"
);
```

* `mc.region`: MaxCompute Region. Can Get the Region From [Endpoints](https://www.alibabacloud.com/help/en/maxcompute/user-guide/endpoints).
* `mc.default.project`: MaxCompute Project. See Your [MaxCompute Projects](https://maxcompute.console.aliyun.com/cn-beijing/project-list).
* `mc.access_key`: AccessKey, which you can create and manage on the [Alibaba Cloud console](https://ram.console.aliyun.com/manage/ak).
* `mc.secret_key`: SecretKey, which you can create and manage on the [Alibaba Cloud console](https://ram.console.aliyun.com/manage/ak).
* `mc.public_access`: You can enable public network access for test, when set `"mc.public_access"="true"`.

## Quotas

Pay-as-you-go quota has limited concurrency and usage. For additional resources, please refer to the documentation. See [Manage quotas](https://www.alibabacloud.com/help/en/maxcompute/user-guide/manage-quotas-in-the-new-maxcompute-console).

## Column type mapping

Consistent with Hive Catalog, please refer to the **column type mapping** section in [Hive Catalog](../datalake/hive).

## User-defined service address

The region property is specified to generate a default endpoint of public network.

In addition to default endpoint addresses, MaxCompute Catalog also supports custom service addresses in properties.

Use the following properties:
* `mc.odps_endpoint`：MaxCompute Endpoint。
* `mc.tunnel_endpoint`: Tunnel Endpoint，MaxCompute Catalog uses the Tunnel SDK to obtain data.

For more information about MaxCompute Endpoint and Tunnel Endpoint that are used in different regions and network connection modes, see [Endpoint](https://www.alibabacloud.com/help/en/maxcompute/user-guide/endpoints)

For example:

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.region" = "cn-beijing",
  "mc.default.project" = "your-project",
  "mc.access_key" = "ak",
  "mc.secret_key" = "sk"
  "mc.odps_endpoint" = "http://service.cn-beijing.maxcompute.aliyun-inc.com/api",
  "mc.tunnel_endpoint" = "http://dt.cn-beijing.maxcompute.aliyun-inc.com"
);
```

