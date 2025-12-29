---
{
    "title": "Tencent COS",
    "language": "zh-CN",
    "description": "本文档介绍访问腾讯云 COS 所需的参数，这些参数适用于以下场景："
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

| 属性名称                       | 曾用名                   | 描述                                                     | 默认值 | 是否必须 |
| ------------------------------ | ------------------------ | -------------------------------------------------------- | ------ | -------- |
| cos.endpoint                   | s3.endpoint              | COS endpoint，指定腾讯云 COS 的访问端点                  |        | 是       |
| cos.access_key                 | s3.access_key            | COS access key，用于身份验证的 COS 访问密钥              |        | 是       |
| cos.secret_key                 | s3.secret_key            | COS secret key，与 access key 配合使用的访问密钥         |        | 是       |
| cos.region                     | s3.region                | COS region，指定腾讯云 COS 的区域                        |        | 否       |
| cos.connection.maximum         | s3.connection.maximum    | S3 最大连接数，指定与 COS 服务建立的最大连接数            | 50     | 否       |
| cos.connection.request.timeout | s3.connection.timeout    | S3 请求超时时间，单位为毫秒，指定连接 COS 服务时的请求超时时间 | 3000   | 否       |
| cos.connection.timeout         | s3.connection.timeout    | S3 连接超时时间，单位为毫秒，指定与 COS 服务建立连接时的超时时间 | 1000   | 否       | 

> 3.1 版本之前，请使用曾用名。

## 示例配置

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

3.1 之前的版：

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```

## 使用建议

* 推荐使用 `cos.` 前缀配置参数，保证与腾讯云 COS 的一致性和清晰度。
* 3.1 之前的版本，请使用曾用名 `s3.` 作为前缀。
* 配置 `cos.region` 能提升访问的准确性和性能，建议设置。
* 连接池参数可根据并发需求调整，避免连接阻塞。
