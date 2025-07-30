---
{
    "title": "Aliyun DLF",
    "language": "zh-CN"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问阿里云 DLF 时所支持的参数。

| 属性名称            | 曾用名            | 描述                                                                                     | 默认值 | 是否必须 |
| --------------- | -------------- | -------------------------------------------------------------------------------------- | --- | ---- |
| `dlf.endpoint`    |                | DLF endpoint，参阅：https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints |     | 是    |
| `dlf.region`      |                | DLF region，参阅：https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints   |     | 是    |
| `dlf.uid`         |                | 阿里云账号。即阿里云控制台右上角个人信息的“云账号 ID”。                                                         |     | 是    |
| `dlf.access_key` |                | DLF access key。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。          |     | 是    |
| `dlf.secret_key` |                | DLF secret key。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。          |     | 是    |
| `dlf.catalog_id` | dlf.catalog.id | Catalog Id。用于指定数据目录，如果不填，使用默认的 Catalog ID。                                             |     | 否    |

