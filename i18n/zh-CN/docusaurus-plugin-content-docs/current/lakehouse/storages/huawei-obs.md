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

| 属性名称                             | 曾用名           | 描述                                           | 默认值 | 是否必须 |
|----------------------------------|----------------|----------------------------------------------|-------|----------|
| `obs.endpoint`                   | `s3.endpoint`  | OBS endpoint，指定华为云 OBS 的访问端点                 |       | 是       |
| `obs.region`                     | `s3.region`    | OBS region，指定华为云 OBS 的区域                       |       | 否       |
| `obs.access_key`                 | `s3.access_key`| OBS access key，用于身份验证的 OBS 访问密钥                |       | 是       |
| `obs.secret_key`                 | `s3.secret_key`| OBS secret key，与 access key 配合使用的访问密钥           |       | 是       |
| `obs.use_path_style`             | `s3.use_path_style` | 是否使用 path-style（路径风格）访问。兼容 MinIO/Ceph 等非 AWS S3 服务建议设置为 true | `false` | 否    |
| `obs.connection.maximum`         |                | 最大连接数，指定与 OBS 服务建立的最大连接数                   | `50`  | 否       |
| `obs.connection.request.timeout` |          | 请求超时时间，单位为毫秒，指定连接 OBS 服务时的请求超时时间       | `3000`| 否       |
| `obs.connection.timeout`         |                | 连接超时时间，单位为毫秒，指定与 OBS 服务建立连接时的超时时间       | `1000`| 否       |
---

## 认证配置

访问华为云 OBS 时，需要提供华为云的 Access Key 和 Secret Key 进行身份验证。  
除了传统的 Access Key/Secret Key 外，Doris 也支持通过 Assume Role 的方式访问 OBS，方便临时授权和跨账号访问。

### Access Key / Secret Key 认证

必须提供以下参数：

- `obs.access_key` （曾用名：`s3.access_key`）
- `obs.secret_key` （曾用名：`s3.secret_key`）

这两个参数用于身份验证，确保访问华为云 OBS 的权限。



## 配置示例

```properties
# 传统 Access Key / Secret Key 模式
"obs.access_key" = "your-access-key"
"obs.secret_key" = "your-secret-key"
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com"
"obs.region" = "cn-north-4"
"obs.connection.maximum" = "50"
"obs.connection.request.timeout" = "3000"
"obs.connection.timeout" = "1000"
```

---

## 参数说明细节

- `obs.endpoint`  
  指定 OBS 服务的访问地址，不同区域和环境的 endpoint 不同。

- `obs.region`  
  华为云区域标识，比如 `cn-north-4`，可选参数。

- `obs.access_key` / `obs.secret_key`  
  传统的访问凭证，必填。

- `obs.connection.maximum`  
  最大连接数，默认 50。

- `obs.connection.request.timeout`  
  请求超时时间，单位毫秒，默认 3000。

- `obs.connection.timeout`  
  连接超时时间，单位毫秒，默认 1000。

- `obs.role_arn` / `obs.external_id`  
  Assume Role 相关参数，非必填。

---
