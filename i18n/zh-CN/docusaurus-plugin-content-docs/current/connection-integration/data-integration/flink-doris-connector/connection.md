---
{
    "title": "连接配置与 TLS",
    "language": "zh-CN",
    "description": "Flink Doris Connector 连接 Doris 的通用配置项，以及如何为 HTTP、JDBC、Thrift 和 Arrow Flight SQL 连接启用 TLS。"
}
---

# 连接配置与 TLS

本页列出 Flink Doris Connector 连接 Doris 时的通用配置项，并说明如何启用 TLS。这些配置对 Source、Sink 和 Lookup Join 均适用。

## 通用配置项 {#common-options}

| Key                           | Default Value | Required | Comment                                                                               |
| ----------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------- |
| fenodes                       | --            | Y        | Doris FE http 地址，支持多个地址，使用逗号分隔                                        |
| benodes                       | --            | N        | Doris BE http 地址，支持多个地址，使用逗号分隔                                        |
| jdbc-url                      | --            | N        | jdbc 连接信息，如：`jdbc:mysql://127.0.0.1:9030`                                      |
| table.identifier              | --            | Y        | Doris 表名，如：`db.tbl`                                                              |
| username                      | --            | Y        | 访问 Doris 的用户名                                                                   |
| password                      | --            | Y        | 访问 Doris 的密码                                                                     |
| auto-redirect                 | TRUE          | N        | 是否重定向 Stream Load 请求。开启后 Stream Load 将通过 FE 写入，不再显示获取 BE 信息  |
| doris.request.retries         | 3             | N        | 向 Doris 发送请求的重试次数                                                           |
| doris.request.connect.timeout | 30s           | N        | 向 Doris 发送请求的连接超时时间                                                       |
| doris.request.read.timeout    | 30s           | N        | 向 Doris 发送请求的读取超时时间                                                       |
| doris.enable.tls              | FALSE         | N        | 是否为 Doris HTTP、MySQL/JDBC、BE Thrift 和 Arrow Flight SQL 连接启用 TLS             |
| doris.tls.ca-certificate-path | --            | N        | PEM CA 证书链的本地路径。为空时 Connector 不加载自定义 CA，使用对应客户端的默认信任库 |
| doris.tls.skip-hostname-verification | FALSE | N        | 是否在保留 CA 校验的同时跳过服务端 hostname 校验                                     |
| doris.tls.excluded-protocols  | --            | N        | 启用 TLS 时仍使用明文的协议列表，逗号分隔。支持 `http`、`mysql`、`thrift` 和 `arrowflight` |

## 启用 TLS {#tls}

Connector 可以对 Doris HTTP 和 Stream Load、MySQL/JDBC、BE Thrift 以及 Arrow Flight SQL 连接启用 TLS。TLS 默认关闭。Connector 会校验 Doris 服务端证书。

在 Doris Source、Sink 或 Catalog 配置中增加以下选项：

```sql
'doris.enable.tls' = 'true',
'doris.tls.ca-certificate-path' = '/etc/doris-tls/ca-chain.pem'
```

通过 `doris.tls.ca-certificate-path` 指定 CA 文件时，应使用 PEM 证书链，并确保所有需要连接 Doris 的 Flink 进程都能从本地文件系统读取该文件。未配置该路径时，Connector 不加载自定义 CA，使用对应客户端的默认信任库。生产环境应保持 hostname 校验开启。

如果 Doris 的某个协议有意保留明文连接，只排除该协议即可。支持的值为 `http`、`mysql`、`thrift` 和 `arrowflight`：

```sql
'doris.tls.excluded-protocols' = 'arrowflight'
```

Connector 不会探测协议，也不会在 TLS 失败后回退到明文连接。

启用 `doris.enable.tls` 后，Connector 会通过 JDBC 连接属性传入 TLS 配置，不会修改 `jdbc-url`。因此，`jdbc-url` 只需填写连接地址，无需添加 `sslMode`、`useSSL` 或 Trust Store 等 TLS 参数。

Arrow Flight SQL 支持 TLS，但不支持仅跳过 hostname 校验；如果将 `doris.tls.skip-hostname-verification` 设置为 `true`，需要通过 `doris.tls.excluded-protocols` 排除 `arrowflight`。

根据 Flink 部署模式分发 CA 文件：

- **Standalone**：将文件放在所有会连接 Doris 的 JobManager、TaskManager 和 SQL Gateway 主机上的相同路径。
- **YARN**：通过 `yarn.ship-files: /local/path/ca.pem` 分发文件，并将 `doris.tls.ca-certificate-path` 设置为容器内文件名，例如 `ca.pem`。
- **Kubernetes**：通过 ConfigMap 或 Secret 将 CA 挂载到相关 JobManager 和 TaskManager Pod 的相同路径。
