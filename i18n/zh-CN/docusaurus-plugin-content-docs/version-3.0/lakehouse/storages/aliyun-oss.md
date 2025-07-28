---
{
  "title": "Aliyun OSS",
  "language": "zh-CN"
}
---

本文档介绍访问阿里云 OSS 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问阿里云 OSS。**

## 参数总览

| 属性名称                            | 描述                                                             | 默认值    | 是否必须 |
|---------------------------------|----------------------------------------------------------------|--------|------|
| `s3.endpoint`                   | OSS endpoint，指定阿里云 OSS 的访问端点。注意，OSS 和 OSS HDFS 的 endpoint 不相同。 |        | 是    |
| `s3.region`                     | OSS region，指定阿里云 OSS 的区域                                       |        | 否    |
| `s3.access_key`                 | OSS access key，用于身份验证的 OSS 访问密钥                                |        | 是    |
| `s3.secret_key`                 | OSS secret key，与 access key 配合使用的访问密钥                          |        | 是    |

### 示例配置

```plaintext
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

