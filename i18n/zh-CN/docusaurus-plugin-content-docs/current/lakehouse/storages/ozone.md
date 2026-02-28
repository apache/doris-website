---
{
    "title": "Apache Ozone | Storages",
    "language": "zh-CN",
    "description": "自 4.0.4 版本起，Doris 支持通过 S3 Gateway 访问 Apache Ozone。",
    "sidebar_label": "Apache Ozone"
}
---

# Apache Ozone

自 4.0.4 版本起，Doris 支持通过 S3 Gateway 访问 Apache Ozone。

本文档介绍访问 Apache Ozone 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**如果要将 Ozone 作为独立存储类型使用，需要显式配置 `"fs.ozone.support" = "true"`。**

## 参数总览

| 属性名称 | 曾用名 | 描述 | 默认值 | 是否必须 |
| --- | --- | --- | --- | --- |
| ozone.endpoint | s3.endpoint | Ozone S3 Gateway 访问端点，例如 `http://ozone-s3g:9878` | 无 | 是 |
| ozone.region | s3.region | Ozone S3 Gateway 区域 | `us-east-1` | 否 |
| ozone.access_key | s3.access_key, s3.access-key-id | 用于认证的 Access Key | 无 | 否* |
| ozone.secret_key | s3.secret_key, s3.secret-access-key | 用于认证的 Secret Key | 无 | 否* |
| ozone.session_token | s3.session_token, s3.session-token | Session Token | 无 | 否 |
| ozone.connection.maximum | s3.connection.maximum | 最大连接数 | `100` | 否 |
| ozone.connection.request.timeout | s3.connection.request.timeout | 请求超时时间（毫秒） | `10000` | 否 |
| ozone.connection.timeout | s3.connection.timeout | 连接超时时间（毫秒） | `10000` | 否 |
| ozone.use_path_style | use_path_style, s3.path-style-access | 是否使用 path-style 访问 | `true` | 否 |
| ozone.force_parsing_by_standard_uri | force_parsing_by_standard_uri | 是否强制使用标准 URI 解析 | `false` | 否 |
| fs.ozone.support |  | 是否启用 Ozone 存储类型 | `false` | 是 |

说明：

- `ozone.access_key` 和 `ozone.secret_key` 需要成对配置。
- `fs.s3a.*` 参数不会被 Ozone 属性直接解析，请使用 `ozone.*` 或兼容的 `s3.*` 参数。
- Ozone 支持 `s3://`、`s3a://`、`s3n://` 三种 URI 协议。

## 配置示例

使用 `ozone.*` 参数：

```properties
"fs.ozone.support" = "true",
"ozone.endpoint" = "http://ozone-s3g:9878",
"ozone.access_key" = "hadoop",
"ozone.secret_key" = "hadoop",
"ozone.region" = "us-east-1",
"ozone.use_path_style" = "true"
```

使用兼容的 `s3.*` 参数：

```properties
"fs.ozone.support" = "true",
"s3.endpoint" = "http://ozone-s3g:9878",
"s3.access_key" = "hadoop",
"s3.secret_key" = "hadoop",
"s3.region" = "us-east-1",
"s3.path-style-access" = "true"
```
