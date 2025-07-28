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

| 属性名称                             | 曾用名                 | 描述                                                                                      | 默认值   | 是否必须 |
|----------------------------------|---------------------|-------------------------------------------------------------------------------------------|----------|----------|
| `oss.endpoint`                   | `s3.endpoint`       | OSS endpoint，指定阿里云 OSS 的访问端点。注意，OSS 和 OSS HDFS 的 endpoint 不相同。                 | 无       | ✅ 是     |
| `oss.region`                     | `s3.region`         | OSS region，指定阿里云 OSS 的区域                                                          | 无       | 否       |
| `oss.access_key`                 | `s3.access_key`     | OSS Access Key，用于身份验证                                                                | 无       | ✅ 是     |
| `oss.secret_key`                 | `s3.secret_key`     | OSS Secret Key，与 Access Key 配合使用                                                    | 无       | ✅ 是     |
| `oss.use_path_style`             | `s3.use_path_style` | 是否使用 path-style（路径风格）访问。兼容 MinIO/Ceph 等非 AWS S3 服务建议设置为 true | `false` | 否    |
| `oss.connection.maximum`         |                     | 最大连接数，指定与 OSS 服务建立的最大连接数                                                  | `50`     | 否       |
| `oss.connection.request.timeout` |                     | 请求超时时间（毫秒），指定连接 OSS 服务时的请求超时时间                                     | `3000`   | 否       |
| `oss.connection.timeout`         |                     | 连接超时时间（毫秒），指定与 OSS 服务建立连接时的超时时间                                    | `1000`   | 否       |

---

## 1. 认证配置（必填）

访问阿里云 OSS 需要提供以下参数：

- `oss.access_key` （兼容曾用名 `s3.access_key`）
- `oss.secret_key` （兼容曾用名 `s3.secret_key`）

---

## 2. 示例配置

```properties
"oss.access_key" = "your-access-key"
"oss.secret_key" = "your-secret-key"
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com"
"oss.region" = "cn-beijing"
```

> ⚠️ 曾用名示例（兼容历史配置）：
> ```properties
> "s3.access_key" = "your-access-key"
> "s3.secret_key" = "your-secret-key"
> "s3.endpoint" = "oss-cn-beijing.aliyuncs.com"
> "s3.region" = "cn-beijing"
> ```

---

## 3. 连接及超时参数（可选）

| 参数                          | 说明                                 | 默认值   |
|-------------------------------|------------------------------------|----------|
| `oss.connection.maximum`       | 最大连接数                         | `50`     |
| `oss.connection.request.timeout` | 请求超时时间，单位毫秒             | `3000`   |
| `oss.connection.timeout`       | 连接超时时间，单位毫秒             | `1000`   |

---

## 4. 其他参数说明

目前 Doris 对以下参数暂未支持：

- `oss.sts_endpoint`
- `oss.sts_region`
- `oss.iam_role`
- `oss.external_id`

---

## 5. 使用建议

- **推荐使用 `oss.` 前缀配置参数**，保证与阿里云 OSS 的一致性和清晰度。
- 曾用名 `s3.` 仍然兼容，方便历史配置平滑迁移。
- 配置 `oss.region` 能提升访问的准确性和性能，建议设置。
- 连接池参数可根据并发需求调整，避免连接阻塞。

---

