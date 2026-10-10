---
{
    "title": "TLS 框架配置",
    "language": "zh-CN",
    "description": "Apache Doris TLS 框架配置契约说明，包括固定配置项、默认值、组件范围以及扩展实现要求。",
    "keywords": [
        "Doris TLS 框架",
        "enable_tls",
        "tls_verify_mode",
        "mTLS",
        "TLS 配置"
    ]
}
---

<!-- 知识类型: 配置参数 / 扩展契约 -->
<!-- 适用场景: TLS 模块集成 / 配置兼容 -->

本文档说明 Apache Doris TLS 框架的配置契约。

开源 Doris 包含 TLS 和证书鉴权相关的框架、配置项、解析支持和扩展点，但不包含覆盖所有协议的完整 TLS 运行时实现。在开源默认构建中，如果为未提供 TLS 模块实现的协议开启 TLS，启动或连接创建会失败，并提示需要 TLS module。

下表中的配置名称、默认值和语义由框架固定。如果你提供自己的 TLS module 实现，需要使用这套框架和这些配置项，以保证配置兼容。证书加载、TLS context 创建、握手行为、证书重载、协议级对端校验等细节可以由 TLS module 自行实现。

## 配置项参考

| 配置项 | 适用组件 | 默认值 | 说明 | 备注 |
| --- | --- | --- | --- | --- |
| `enable_tls` | FE、BE、Cloud | `false` | 是否为当前进程启用统一 TLS 框架。 | 设置为 `true` 后，未被 `tls_excluded_protocols` 排除的协议预期由 TLS module 提供 TLS 实现。相关 Doris 组件需要使用兼容的 TLS 配置。 |
| `tls_verify_mode` | FE、BE、Cloud | `verify_peer` | 控制证书校验行为。可选值为 `verify_none`、`verify_peer`、`verify_fail_if_no_peer_cert`。 | 参见 [TLS 校验模式](#tls-校验模式)。 |
| `tls_certificate_path` | FE、BE、Cloud | 空 | 当前组件作为 TLS 服务端或客户端时使用的证书路径。 | 框架契约预期使用 PEM 证书。TLS module 可以支持单张 leaf 证书或 full chain PEM 文件。 |
| `tls_private_key_path` | FE、BE、Cloud | 空 | 与 `tls_certificate_path` 配套使用的私钥路径。 | 框架契约预期使用 PEM 私钥。 |
| `tls_private_key_password` | FE、BE、Cloud | 空 | 私钥文件密码。 | 使用明文密码字符串，不是 Base64 编码值。 |
| `tls_ca_certificate_path` | FE、BE、Cloud | 空 | 用于校验对端证书的 CA 证书或 CA bundle 路径。 | 框架契约预期使用 PEM CA 证书。在该值为空且场景允许时，TLS module 也可以使用系统或 JDK 默认 trust store。 |
| `tls_cert_refresh_interval_seconds` | FE、BE、Cloud | `3600` | 检查证书文件是否需要重载的周期，单位为秒。 | 框架暴露该周期，具体证书重载行为由 TLS module 实现。 |
| `tls_excluded_protocols` | FE、BE、Cloud | 空 | 指定不使用 TLS 的协议列表，用英文逗号分隔，大小写不敏感。 | 可用协议名取决于组件和 TLS module。开源框架预留了 `thrift`、`mysql`、`http`、`arrowflight`、`brpc`、`bdbje` 等 selector；只应使用你的实现支持的 selector。 |
| `tls_peer_cert_required_san_dns` | FE、BE、Cloud | 空 | 为部分私有协议配置对端证书 DNS Subject Alternative Name 准入 allowlist。 | 语法为 `<protocol>=<dns1>,<dns2>;...`。该配置是为需要对端证书准入控制的 TLS module 预留的框架契约。 |
| `tls_cert_based_auth_ignore_password` | FE | `false` | 证书鉴权成功后是否允许跳过密码校验。 | 该配置只影响 FE 用户认证流程。开启后会削弱密码保护，只应在 TLS module 已提供所需证书鉴权行为的部署中使用。 |

## TLS 校验模式

| 模式 | 客户端角色 | 服务端角色 | 使用场景 |
| --- | --- | --- | --- |
| `verify_none` | 不校验服务端证书。 | 不校验客户端证书。 | 需要 TLS 加密但不做证书校验的部署。 |
| `verify_peer` | 校验服务端证书。 | 不要求客户端证书。 | 单向 TLS 校验。该值不表示要求 mTLS。 |
| `verify_fail_if_no_peer_cert` | 校验服务端证书。 | 要求并校验客户端证书。 | 需要双向证书校验的 mTLS 部署。 |

## 开源默认构建中的框架行为

开源框架提供配置定义和扩展点。当 `enable_tls` 为 `false` 时，默认 provider 保持已有明文行为。

当 `enable_tls` 为 `true` 时，协议启动或 channel 创建会进入 TLS 框架。如果没有提供对应 TLS module，开源默认实现会拒绝该协议的 TLS 启动，并提示需要 TLS module。

因此，上面的配置表是兼容性契约，不是开源默认包中直接启用 TLS 的完整操作手册。

## 实现建议

如果你实现自定义 TLS module，请遵循以下规则：

- 使用本文档中的配置名称和语义，不要为相同 TLS 行为引入不同配置名。
- 对 FE、BE、Cloud 中共有的配置项保持一致语义。
- 遵循 `tls_excluded_protocols`，让用户能够选择哪些协议交给 TLS module 处理。
- 对服务端和客户端角色一致实现 `tls_verify_mode`。
- 如果支持证书重载，使用 `tls_cert_refresh_interval_seconds` 作为检查周期。
- 如果支持对端证书 DNS SAN 准入控制，使用表格中描述的 `tls_peer_cert_required_san_dns` 语法。
- 如果支持证书鉴权，需要通过框架扩展点提供运行时鉴权实现。没有自定义实现时，开源默认服务是 no-op。
