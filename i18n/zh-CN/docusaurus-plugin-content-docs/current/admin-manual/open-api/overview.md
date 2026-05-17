---
{
    "title": "总览",
    "language": "zh-CN",
    "description": "OPEN API 作为 Apache Doris 运维管理操作的补充，主要用于数据库管理人员进行一些管理操作。"
}
---

OPEN API 作为 Apache Doris 运维管理操作的补充，主要用于数据库管理人员进行一些管理操作。

:::note
OPEN API 目前都是 unstable 的，仅建议开发人员测试和使用。我们可能会在后续版本对接口行为进行变更。
在生产环境中，建议使用 SQL 命令完成操作。
:::

## 安全认证

通过以下配置，可以开启 FE BE API 的安全认证：

| 配置名称 | 配置文件 | 默认值 | 说明 |  
| --- | --- | --- | --- |  
| `enable_all_http_auth` | `be.conf` | `false` | 开启 BE HTTP 端口（默认 8040）的认证。开启后，访问 BE 的 HTTP API 需要 ADMIN 用户登录。 |  
| `enable_brpc_builtin_services` | `be.conf` | `true` | 是否对外开启 brpc 内置服务（默认 8060）。关闭后，将不能访问 HTTP 协议的 8060 端口。（自 2.1.7 版本支持） |  
| `enable_all_http_auth` | `fe.conf` | `false` | 开启 FE HTTP 端口（默认 8030）的认证。开启后，访问 FE 的 HTTP API 需要对应的用户权限。 |

:::info NOTE
FE 和 BE 的 HTTP API 的权限要求，各个版本不尽相同，具体请参阅对应的 API 文档。
:::

