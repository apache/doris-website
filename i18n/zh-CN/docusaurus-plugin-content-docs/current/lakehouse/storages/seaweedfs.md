---
{
    "title": "SeaweedFS | Storages",
    "language": "zh-CN",
    "description": "本文档介绍访问 SeaweedFS 所需的参数，这些参数适用于以下场景：",
    "sidebar_label": "SeaweedFS"
}
---

# SeaweedFS

本文档介绍访问 [SeaweedFS](https://seaweedfs.com/) 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

**Doris 使用 S3 Client，通过 S3 兼容协议访问 SeaweedFS。** 本文针对 SeaweedFS S3（普通）Bucket 的使用场景。如需将 Iceberg 表存储在 SeaweedFS 的 S3 Table Bucket 中（由同一 `weed` 进程同时提供 REST Catalog 与 S3），请参见 [Integration with SeaweedFS](../best-practices/doris-seaweedfs.md)。

## 使用 `weed mini` 快速启动

`weed mini` 会在单一进程内启动 SeaweedFS S3 服务，并通过环境变量注入凭证及预创建 Bucket：

```bash
AWS_ACCESS_KEY_ID=admin \
AWS_SECRET_ACCESS_KEY=secret \
S3_BUCKET=my-bucket \
weed mini -dir=/data
```

启动后 S3 服务可通过 `http://localhost:8333` 访问，`my-bucket` 已创建，凭证为 `admin` / `secret`。Docker、自定义端口、多桶、反向代理等更多用法请参见 [Quick Start with `weed mini`](https://github.com/seaweedfs/seaweedfs/wiki/Quick-Start-with-weed-mini)。

## 参数总览

由于 SeaweedFS 通过 S3 兼容协议访问，所以使用与 AWS S3 相同的 `s3.*` 参数。

| 属性名称                          | 描述                                                                                       | 默认值 | 是否必须 |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------ | -------- |
| s3.endpoint                       | SeaweedFS S3 网关地址，例如 `http://seaweedfs.example.com:8333`                              |        | 是       |
| s3.access_key                     | 在 SeaweedFS S3 IAM 配置中创建的 Access Key                                                  |        | 是       |
| s3.secret_key                     | 与 `s3.access_key` 配对使用的 Secret Key                                                     |        | 是       |
| s3.region                         | 区域。SeaweedFS 不会校验取值，但 AWS S3 SDK 要求必须设置，例如 `us-east-1`                    |        | 是       |
| s3.use_path_style                 | 建议设置为 `true`。SeaweedFS 通过 `http://<endpoint>/<bucket>/<key>` 形式提供对象访问         | FALSE  | 否       |
| s3.connection.maximum             | 与 SeaweedFS S3 网关之间的最大连接数                                                          | 50     | 否       |
| s3.connection.request.timeout     | 请求超时时间，单位为毫秒                                                                       | 3000   | 否       |
| s3.connection.timeout             | 建立连接的超时时间，单位为毫秒                                                                 | 1000   | 否       |

### 使用 Path-style 访问

SeaweedFS 使用 path-style 地址（`http://<endpoint>/<bucket>/<key>`），不为每个 bucket 分配独立的 DNS 子域名，因此请将 `s3.use_path_style` 设置为 `true`。

## 示例配置

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://seaweedfs.example.com:8333",
"s3.region" = "us-east-1",
"s3.use_path_style" = "true"
```

## 使用建议

* 将 `s3.use_path_style` 设置为 `true`，SeaweedFS 不使用 per-bucket DNS 子域名。
* `s3.region` 是 AWS S3 SDK 的必填项，SeaweedFS 本身不会校验该值，填入任意非空字符串即可。
* 如需 HTTPS，可在反向代理上终止 TLS，并使用 `-s3.externalUrl=https://<proxy>` 启动 `weed`，以便 S3 签名校验通过。
* 如需将 Iceberg 表存储在 SeaweedFS 的 S3 Table Bucket 中，详见 [Integration with SeaweedFS](../best-practices/doris-seaweedfs.md)。
