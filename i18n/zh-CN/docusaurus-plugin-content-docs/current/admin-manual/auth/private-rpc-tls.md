---
{
    "title": "使用双向 TLS 加密内部 RPC",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 内部 RPC 双向 TLS 的完整部署流程，包括节点证书签发、FE/BE 配置、维护窗口切换、连接验证、证书轮换，以及协议覆盖范围、远端 Doris 兼容性和常见故障排查。",
    "keywords": ["Doris 内部 RPC", "双向 TLS", "mTLS", "FE BE 通信加密", "TLS 证书"],
    "doc_type": "feature"
}
---

<!-- Knowledge type: Deployment guide / Configuration reference -->
<!-- Applicable scenarios: Internal RPC encryption / Node certificate authentication -->

## 概述

双向 TLS（mTLS）为支持的内部 RPC 连接提供传输加密，并要求通信双方出示由集群信任的证书颁发机构（CA）签发的证书。开源内部 RPC provider 覆盖 gRPC/BRPC 和阻塞式 Thrift 连接，TLS 连接失败后不会回退到明文。

:::note 可用性
内部 RPC 双向 TLS 自 Apache Doris 5.0 起支持，本文适用于 5.0 及后续版本。
:::

### 协议覆盖范围

| 连接 | 使用本文配置后的行为 |
| --- | --- |
| FE gRPC 到 BE BRPC，包括 fragment 下发 | mTLS。FE 校验服务端证书链和目标主机名/IP。 |
| 集群内部原生 BRPC，包括 BE 之间的连接 | mTLS。原生 BRPC 校验 CA 证书链，不提供逐节点主机名或角色准入列表。 |
| Doris 节点间的阻塞式 Thrift，包括 backend/heartbeat RPC 和 BE 到 FE 的延迟 split 获取 | mTLS。客户端校验服务端证书链和目标主机名/IP。 |
| MySQL、HTTP/HTTPS、Arrow Flight、FE BDBJE 复制 | 被本文配置排除，需要单独配置对应协议的安全能力。 |
| Broker RPC、RPC 函数、远端 Doris 端点 | 保持原有外部连接策略。本地内部 RPC TLS 不会为这些端点开启加密。 |
| Cloud Meta Service/Recycler 及其他控制面通道 | 此 provider 不提供全面覆盖。 |

服务端允许属于所配置 CA 信任域的对端接入。应使用**集群专用 CA**：该 CA 签发的任何证书都是集群 RPC 凭据。TLS 保护传输中的数据，不会加密已存储数据或进程内存。读取加密 Iceberg 表还需要相应的 reader 支持和能力检查。

## 快速开始

### 前置条件

- 所有参与节点安装 Apache Doris 5.0 或后续版本的 FE、BE 安装包。
- 安排维护窗口。明文节点无法与 TLS 监听端通信，此 provider 不支持明文/TLS 混合滚动切换。
- 准备 PEM 格式的 CA 证书，以及每个节点独立的 PEM 证书和私钥。节点证书必须同时支持 `serverAuth`、`clientAuth`，DNS/IP Subject Alternative Name（SAN）必须覆盖其他节点实际使用的访问地址。如果 Doris 注册或连接节点时使用 IP，必须包含对应的 IP SAN。
- CA 私钥保留在 Doris 节点以外的签发系统。允许 Doris 服务账号读取自己的身份文件，并将私钥访问权限限制为该账号。
- FE 使用阻塞式 Thrift，推荐默认的 `THREAD_POOL`。此 TLS 实现不支持 `THREADED_SELECTOR`。

### 1. 准备节点证书

使用组织现有的证书签发流程。以下示例为一个示例 BE 创建私钥和证书签名请求（CSR），应在该节点新建的受保护目录中运行，并将示例域名和 IP 替换为节点的实际身份。对每个 FE、BE 重复此流程，使用不同的私钥和节点名称。

```bash
umask 077
cat > node.cnf <<'EOF'
[req]
prompt = no
distinguished_name = dn
req_extensions = node_cert
[dn]
CN = be1.example.com
[node_cert]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth,clientAuth
subjectAltName = @names
[names]
DNS.1 = be1.example.com
IP.1 = 192.0.2.10
EOF
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out node-key.pem
openssl req -new -key node-key.pem -out node.csr -config node.cnf
```

预期结果：生成未加密的 PKCS#8 PEM 私钥 `node-key.pem` 和 CSR `node.csr`。只将 CSR 和所需的证书扩展交给 CA 管理员，不发送节点私钥。

如果 CA 管理员使用 OpenSSL，可在 **CA 签发系统**上参考以下命令签发：

```bash
openssl x509 -req -in node.csr -CA cluster-ca.pem -CAkey cluster-ca-key.pem \
    -CAcreateserial -out node-cert.pem -days 365 -sha256 \
    -extfile node.cnf -extensions node_cert
```

证书有效期和序列号应遵循现有 PKI 策略。预期结果：生成由集群专用 CA 签发的 `node-cert.pem`，包含所需的 SAN 和两种扩展密钥用途。将节点证书及 CA 公共证书返回节点；使用中间 CA 时，提供所需的证书链和信任证书包。CA 私钥始终保留在签发系统。

### 2. 配置 FE

在每个 FE 的 `conf/fe.conf` 中添加以下配置。将占位路径替换为 FE 服务账号可读取的绝对路径，并使用该 FE 自己的证书和私钥。

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_certificate_path=/path/to/fe-cert.pem
tls_private_key_path=/path/to/fe-key.pem
tls_ca_certificate_path=/path/to/cluster-ca.pem
tls_cert_refresh_interval_seconds=0
tls_excluded_protocols=http,mysql,arrowflight,bdbje
thrift_server_type=THREAD_POOL
thrift_rpc_connect_timeout_ms=10000
```

`tls_peer_cert_required_san_dns` 保持为空。本例使用未加密私钥；对于受支持的加密 PEM 私钥，FE 也支持现有的 `tls_private_key_password` 配置。

### 3. 配置 BE

在每个 BE 的 `conf/be.conf` 中添加以下配置，使用该 BE 自己的证书和私钥：

```properties
enable_tls=true
tls_verify_mode=verify_fail_if_no_peer_cert
tls_certificate_path=/path/to/be-cert.pem
tls_private_key_path=/path/to/be-key.pem
tls_ca_certificate_path=/path/to/cluster-ca.pem
tls_cert_refresh_interval_seconds=0
tls_excluded_protocols=http,arrowflight
thrift_server_type_of_fe=THREAD_POOL
thrift_connect_timeout_seconds=3
```

BE 必须使用**未加密的 PEM 私钥**，`tls_private_key_password`、`tls_peer_cert_required_san_dns` 均保持为空。BE 的 `thrift_server_type_of_fe` 必须与 FE 的 Thrift 服务模式一致。

对于仅开启内部 RPC TLS 的部署，以上协议排除列表是必要配置：统一框架会选择所有未被明确排除的协议。除非已有对应协议可用的 TLS 实现和部署方案，否则不要移除这些排除项。

### 4. 切换并验证

1. 在维护窗口内停止提交新负载，等待或停止正在执行的任务，备份原有节点配置。
2. 向所有参与的 FE、BE 节点部署身份文件和 TLS 配置。停止旧进程，再按现有集群管理流程启动使用新配置的集群。不要让明文对端继续连接 TLS 监听端。
3. 通过原有 SQL 端点连接，执行 `SHOW FRONTENDS;`、`SHOW BACKENDS;`。预期结果：相关节点恢复存活状态，心跳恢复正常。
4. 执行会下发到 BE 的代表性查询、包含跨 BE exchange 的查询，以及导入操作。预期结果：操作成功，且没有 TLS/认证错误。仅执行 `SELECT 1` 无法验证这些内部通道。
5. 执行[示例](#示例)中的证书和连接检查。证书拒绝测试应使用独立探测客户端，不要替换运行中节点的身份。

## 参数配置

[TLS 框架参考](./tls-framework.md)介绍共享配置契约。下表说明此开源内部 RPC 实现的额外约束，“空”表示空字符串。TLS 身份配置在进程启动时生效，修改文件或配置后需要重启。

| 配置项 | 类型 / 组件 | 默认值 | 本部署要求或作用 |
| --- | --- | --- | --- |
| `enable_tls` | Boolean / FE、BE | `false` | 所有参与节点均设为 `true`。 |
| `tls_verify_mode` | String / FE、BE | `verify_peer` | 必须为 `verify_fail_if_no_peer_cert`，可选客户端证书或跳过校验的模式会被拒绝。 |
| `tls_certificate_path` | String / FE、BE | 空 | 必填，PEM 节点证书及必要证书链。 |
| `tls_private_key_path` | String / FE、BE | 空 | 必填，与证书匹配的 PEM 私钥。 |
| `tls_ca_certificate_path` | String / FE、BE | 空 | 必填，PEM 集群 CA 证书或信任证书包，不能依赖系统/JDK 默认信任库。 |
| `tls_private_key_password` | String / FE、BE | 空 | BE 必须为空；FE 对受支持的加密 PEM 私钥支持现有密码配置。 |
| `tls_cert_refresh_interval_seconds` | Integer / FE、BE | `3600` | 必须显式设为 `0`，不支持自动证书重载。 |
| `tls_excluded_protocols` | String / FE、BE | 空 | FE：`http,mysql,arrowflight,bdbje`；BE：`http,arrowflight`。本文内部通道要求保留 `brpc`、`thrift`，不能将其排除。 |
| `tls_peer_cert_required_san_dns` | String / FE、BE | 空 | 必须为空，此 provider 不实现框架的 DNS SAN 准入列表。 |
| `thrift_server_type` | String / FE | `THREAD_POOL` | 使用阻塞式 `THREAD_POOL` 或 `SIMPLE`，不能使用 `THREADED_SELECTOR`。 |
| `thrift_server_type_of_fe` | String / BE | `THREAD_POOL` | 与 FE 的 Thrift 模式一致。 |
| `thrift_rpc_connect_timeout_ms` | Integer / FE | `10000` | 必须大于零，即使普通 RPC 读取没有超时，也会限制 Thrift TLS 认证耗时。 |
| `thrift_connect_timeout_seconds` | Integer / BE | `3` | 必须大于零，且转换为毫秒后可表示，用于限制 Thrift TLS 认证耗时。 |

`tls_cert_based_auth_ignore_password` 与节点 RPC 认证无关，应保留默认值 `false`。开启内部 mTLS 不会改变 SQL 用户认证方式。

## 示例

### 检查已签发的证书

部署前检查 CA 证书链、两种用途以及节点访问地址：

```bash
openssl verify -CAfile cluster-ca.pem -purpose sslserver node-cert.pem
openssl verify -CAfile cluster-ca.pem -purpose sslclient node-cert.pem
openssl x509 -in node-cert.pem -noout -checkhost be1.example.com
openssl x509 -in node-cert.pem -noout -checkip 192.0.2.10
```

预期结果：两条证书校验命令均输出 `node-cert.pem: OK`，主机名/IP 检查均报告匹配。根据申请的 SAN 调整检查内容；使用中间 CA 时，按 PKI 要求提供中间证书链。

### 探测 Thrift TLS 监听端

从持有自身集群证书的授权节点或诊断主机探测 FE Thrift 端点。示例使用默认 FE `rpc_port`：`9020`，请替换为实际配置的主机名和端口。

```bash
openssl s_client -connect fe1.example.com:9020 -servername fe1.example.com \
    -CAfile cluster-ca.pem -cert node-cert.pem -key node-key.pem \
    -verify_hostname fe1.example.com -verify_return_error -brief < /dev/null
```

预期结果：TLS 协商成功，证书校验报告 `OK`。该命令检查 TLS 认证，不发送 Thrift 业务请求。使用对应节点名称，继续检查 BE backend 和 heartbeat Thrift 监听端，默认端口分别为 `9060`、`9050`。

如果通过 IP 访问目标，将 `-verify_hostname fe1.example.com` 替换为 `-verify_ip` 及对应 IP，证书必须包含匹配的 IP SAN。

使用独立客户端，不提供客户端证书，或提供由无关 CA 签发的证书时，认证必须失败。对执行主机名校验的客户端，即使证书受信任，目标主机名/IP 不匹配时也必须拒绝连接。原生 BRPC 校验 CA 信任域，不执行后一种主机名检查。

### 保留远端 Doris 读取能力

使用远端 Doris Catalog 时，保留 Catalog 属性 `use_arrow_flight=true`（默认值）。远端结果进入本地 worker，使查询 exchange 和执行状态上报留在本地 TLS 集群。开启内部 BRPC 或 Thrift TLS 后，`use_arrow_flight=false` 中将 worker 分配到远端集群的执行图会在下发前被拒绝，包括带有反向回调的纯远端执行图。

远端元数据访问和由本地 worker 执行的 tablet 写入保持外部连接策略。文件密钥描述符不能通过这些远端明文通道发送。本地内部 TLS 不会为独立远端集群建立信任或配置 TLS。

## 错误处理

| 现象 | 检查与处理 |
| --- | --- |
| 启动提示需要 TLS module | 确认 FE、BE 均包含内部 RPC 实现，并检查协议排除列表；内置 provider 不实现所有公共协议。 |
| 配置因双向认证要求而被拒绝 | 设置 `tls_verify_mode=verify_fail_if_no_peer_cert`，并提供可读取的证书、匹配私钥及 CA 文件。 |
| 配置因静态身份或 CA 信任域要求而被拒绝 | 将重载周期设为 `0`，清空 `tls_peer_cert_required_san_dns`，并清空 BE 私钥密码。 |
| Thrift 无法启动 | 使用受支持的阻塞式服务模式，保证 FE/BE Thrift 模式配置一致，连接超时大于零。 |
| 切换后心跳、下发或查询失败 | 检查是否存在明文节点、CA 信任证书包不一致、证书过期、缺少客户端/服务端用途、主机名/IP SAN 不匹配、文件不可读或证书私钥不匹配。 |
| 建连超时 | 检查网络可达性及对端 TLS 配置。Thrift 认证有超时限制，TCP 端口开放不代表认证成功。 |
| 替换证书文件后未生效 | 重启相关进程，此 provider 不支持自动重载。 |
| 远端 Doris 直接执行被拒绝 | 保留默认 Arrow Flight Catalog 模式；本地 TLS 身份无法认证独立调度的远端 worker。 |

## 最佳实践

- 每个节点独立生成私钥，并由集群专用 CA 签发对应证书，不与无关服务共享 CA。CA 信任域定义集群成员凭据的信任边界，不提供逐节点角色策略。
- 将私钥文件访问权限限制为 Doris 服务账号。节点只接收 CA 公共证书，不接收 CA 私钥。
- 监控证书有效期。同一受信任 CA 下续签时，安装新节点身份，并按现有高可用运维流程重启相关进程，重启后重新验证内部 RPC。
- 更换 CA 时，先部署同时包含新旧 CA 的信任证书包并重启相关节点；再替换节点身份并重启，验证连接后移除旧 CA 并再次重启。整个过程中，每条通信路径都必须保持双向信任。
- 如需恢复明文，安排新的维护窗口，在所有参与节点上一致关闭 TLS，不存在自动明文回退。
- 单独保护进程内存和崩溃产物。内部传输加密不会消除使用密钥的进程中的明文秘密。
