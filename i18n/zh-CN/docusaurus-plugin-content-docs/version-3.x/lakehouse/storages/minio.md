---
{
    "title": "MinIO",
    "language": "zh-CN",
    "description": "本文档介绍访问 MinIO 所需的参数，这些参数适用于以下场景："
}
---

本文档介绍访问 MinIO 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问 MinIO。**

## 参数总览

| 属性名称                       | 曾用名                   | 描述                                                         | 默认值 | 是否必须 |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------ | -------- |
| minio.endpoint                 | s3.endpoint              | Minio endpoint，Minio 的访问端点                             |        | 是       |
| minio.access_key               | s3.access_key            | Minio access key，用于身份验证的 Minio 访问密钥              |        | 是       |
| minio.secret_key               | s3.secret_key            | Minio secret key，与 access key 配合使用的访问密钥           |        | 是       |
| minio.connection.maximum       | s3.connection.maximum    | S3 最大连接数，指定与 Minio 服务建立的最大连接数              | 50     | 否       |
| minio.connection.request.timeout | s3.connection.timeout    | S3 请求超时时间，单位为毫秒，指定连接 Minio 服务时的请求超时时间 | 3000   | 否       |
| minio.connection.timeout       | s3.connection.timeout    | S3 连接超时时间，单位为毫秒，指定与 Minio 服务建立连接时的超时时间 | 1000   | 否       |
| minio.use_path_style           | s3.use_path_style        | 是否使用 path-style（路径风格）访问。兼容 MinIO 等非 AWS S3 服务建议设置为 true | FALSE  | 否       |

### 使用 Path-style 访问

Minio 默认使用 Host-style 访问方式，但也支持 Path-style 访问。可以通过设置 `minio.use_path_style` 参数来切换。

- Host-style 访问（默认）: https://bucket.minio.example.com
- Path-style 访问（开启后）: https://minio.example.com/bucket

## 示例配置

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```

3.1 之前的版本：

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```

## 使用建议

* 推荐使用 `minio.` 前缀配置参数，保证与 MinIO 的一致性和清晰度。
* 3.1 之前的版本，请使用曾用名 `s3.` 作为前缀。
* 连接池参数可根据并发需求调整，避免连接阻塞。
