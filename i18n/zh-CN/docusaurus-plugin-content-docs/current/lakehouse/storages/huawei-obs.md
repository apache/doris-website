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

| 属性名称                            | 曾用名              | 描述                                    | 默认值    | 是否必须 |
|---------------------------------|------------------|---------------------------------------|--------|------|
| `s3.endpoint`                   | `obs.endpoint`   | OBS endpoint，指定华为云 OBS 的访问端点          |        | 是    |
| `s3.region`                     | `obs.region`     | OBS region，指定华为云 OBS 的区域              |        | 否    |
| `s3.access_key`                 | `obs.access_key` | OBS access key，用于身份验证的 OBS 访问密钥       |        | 是    |
| `s3.secret_key`                 | `obs.secret_key` | OBS secret key，与 access key 配合使用的访问密钥 |        | 是    |
| `s3.connection.maximum`         |                  | S3 最大连接数，指定与 OBS 服务建立的最大连接数           | `50`   | 否    |
| `s3.connection.request.timeout` |                  | S3 请求超时时间，单位为毫秒，指定连接 OBS 服务时的请求超时时间   | `3000` | 否    |
| `s3.connection.timeout`         |                  | S3 连接超时时间，单位为毫秒，指定与 OBS 服务建立连接时的超     | `1000` | 否 |

### 认证配置

访问华为云 OBS 时，需要提供华为云的 Access Key 和 Secret Key，即下列参数：

- `s3.access_key` （或 `obs.access_key`）
- `s3.secret_key` （或 `obs.secret_key`）

这两个参数用于身份验证，确保访问华为云 OBS 的权限。

### 配置示例

```plaintext:
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com"
"s3.region" = "cn-north-4"
```
