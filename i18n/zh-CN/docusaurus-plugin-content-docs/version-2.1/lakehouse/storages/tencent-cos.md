---
{
  "title": "Tencent COS",
  "language": "zh-CN"
}
---

本文档介绍访问腾讯云 COS 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问腾讯云 COS。**

## 参数总览

| 属性名称                            | 描述                                    | 默认值    | 是否必须 |
|---------------------------------|---------------------------------------|--------|------|
| `s3.endpoint`                   | COS endpoint，指定腾讯云 COS 的访问端点          |        | 是    |
| `s3.region`                     | COS region，指定腾讯云 COS 的区域              |        | 否    |
| `s3.access_key`                 | COS access key，用于身份验证的 COS 访问密钥       |        | 是    |
| `s3.secret_key`                 | COS secret key，与 access key 配合使用的访问密钥 |        | 是    |


### 示例配置

```plaintext
"cos.access_key" = "ak",
"cos.secret_key" = "sk",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

