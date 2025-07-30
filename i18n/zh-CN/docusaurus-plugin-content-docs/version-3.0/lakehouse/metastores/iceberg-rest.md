---
{
    "title": "Iceberg Rest Catalog API",
    "language": "zh-CN"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问支持 Iceberg Rest Catalog 接口的元数据服务时所支持的参数。

| 属性名称                       | 曾用名 | 描述                                          | 默认值  | 是否必须       |
| -------------------------- | --- | ------------------------------------------- | ---- | ---------- |
| `iceberg.rest.uri`           | uri | Rest Catalog 连接地址。示例：`http://172.21.0.1:8181` |      | 是          |
