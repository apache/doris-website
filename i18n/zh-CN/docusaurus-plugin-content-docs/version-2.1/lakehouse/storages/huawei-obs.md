---
{
  "title": "Huawei OBS",
  "language": "zh-CN"
}
---

本文档介绍访问华为云 OBS 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问华为云 OBS。**

## 参数总览

| 属性名称                            | 描述                                    | 默认值    | 是否必须 |
|---------------------------------|---------------------------------------|--------|------|
| `s3.endpoint`                   | OBS endpoint，指定华为云 OBS 的访问端点          |        | 是    |
| `s3.region`                     | OBS region，指定华为云 OBS 的区域              |        | 否    |
| `s3.access_key`                 | OBS access key，用于身份验证的 OBS 访问密钥       |        | 是    |
| `s3.secret_key`                 | OBS secret key，与 access key 配合使用的访问密钥 |        | 是    |

### 配置示例

```plaintext
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com"
"s3.region" = "cn-north-4"
```
