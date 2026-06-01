---
{
    "title": "Huawei OBS",
    "language": "zh-CN",
    "description": "本文档介绍访问华为云 OBS 所需的参数，这些参数适用于以下场景："
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

| 属性名称                     | 曾用名                   | 描述                                                         | 默认值 | 是否必须 |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ | ------ | -------- |
| obs.endpoint                 | s3.endpoint              | OBS endpoint，指定华为云 OBS 的访问端点                      |        | 是       |
| obs.access_key               | s3.access_key            | OBS access key，用于身份验证的 OBS 访问密钥                  |        | 是       |
| obs.secret_key               | s3.secret_key            | OBS secret key，与 access key 配合使用的访问密钥             |        | 是       |
| obs.region                   | s3.region                | OBS region，指定华为云 OBS 的区域                            |        | 否       |
| obs.use_path_style           | s3.use_path_style        | 是否使用 path-style（路径风格）访问。兼容 MinIO/Ceph 等非 AWS S3 服务建议设置为 true | FALSE  | 否       |
| obs.connection.maximum       | s3.connection.maximum    | 最大连接数，指定与 OBS 服务建立的最大连接数                  | 50     | 否       |
| obs.connection.request.timeout | s3.connection.request.timeout | 请求超时时间，单位为毫秒，指定连接 OBS 服务时的请求超时时间  | 3000   | 否       |
| obs.connection.timeout       | s3.connection.timeout    | 连接超时时间，单位为毫秒，指定与 OBS 服务建立连接时的超时时间 | 1000   | 否       |

> 3.1 版本之前，请使用曾用名。

## 示例配置

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```

3.1 之前的版：

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```

## 使用建议

* 推荐使用 `obs.` 前缀配置参数，保证与华为云 OBS 的一致性和清晰度。
* 3.1 之前的版本，请使用曾用名 `s3.` 作为前缀。
* 配置 `obs.region` 能提升访问的准确性和性能，建议设置。
* 连接池参数可根据并发需求调整，避免连接阻塞。
