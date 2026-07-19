---
{
    "title": "HTTP 安全传输",
    "language": "zh-CN",
    "description": "为 Doris FE 接口开启 HTTPS/SSL 加密：配置证书路径、密码、类型、别名等参数，保障 FE 通信安全。",
    "keywords": [
        "Doris HTTPS",
        "Doris SSL",
        "FE 证书配置",
        "enable_https",
        "key_store_path",
        "key_store_password",
        "key_store_type",
        "key_store_alias",
        "JKS keystore",
        "FE HTTPS 加密",
        "自签名证书",
        "CA 证书"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: FE 接口启用 HTTPS 加密传输 / 证书部署 -->

本文介绍如何为 Doris FE 接口开启 HTTPS（SSL）加密传输，通过配置 SSL 密钥证书，保障客户端与 FE 之间通信的机密性与完整性。

:::tip

从 2.0 版本开始，Doris 支持 SSL 密钥和证书配置。

:::

## 适用场景

| 场景 | 是否适用 |
| --- | --- |
| 生产环境需要对 FE HTTP 接口加密 | 适用，建议使用 CA 颁发的证书 |
| 内部测试或开发环境验证 HTTPS 流程 | 适用，可使用自签名证书 |
| 仅集群内部通信、无外部访问需求 | 可选 |

## 前置条件

- Doris 版本 ≥ 2.0
- 已具备一份可用的 SSL 证书（JKS 等 keystore 格式），或具备生成自签名证书的环境
- 拥有 FE 节点的文件系统访问权限，可放置证书并修改 `conf/fe.conf`

## 配置流程总览

1. 准备 SSL 证书（购买或自签名生成）
2. 将证书复制到 FE 的指定路径
3. 修改 FE 配置文件 `conf/fe.conf` 并启用 HTTPS
4. 重启 FE 使配置生效

## 操作步骤

### 第一步：准备 SSL 证书

购买或生成自签名 SSL 证书。生产环境建议使用 CA 颁发的证书，以避免客户端出现证书不受信任的提示。

### 第二步：放置证书文件

将 SSL 证书复制到指定路径，默认路径为 `${DORIS_HOME}/conf/ssl/`，用户也可以自己指定路径。

### 第三步：修改 FE 配置

修改 FE 配置文件 `conf/fe.conf`，注意以下参数需与购买或生成的 SSL 证书保持一致：

- 设置 `enable_https = true` 开启 HTTPS 功能，默认为 `false`
- 设置证书路径 `key_store_path`，默认为 `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`
- 设置证书密码 `key_store_password`，默认为空
- 设置证书类型 `key_store_type`，默认为 `JKS`
- 设置证书别名 `key_store_alias`，默认为 `doris_ssl_certificate`

### 第四步：重启 FE

修改配置后需重启 FE 节点，配置才能生效。

## 配置参数说明

<!-- 知识类型: 配置参数 -->

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `enable_https` | `false` | 是否开启 FE 的 HTTPS 功能，设置为 `true` 启用 |
| `key_store_path` | `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore` | SSL 证书文件路径，需与实际存放位置一致 |
| `key_store_password` | 空 | SSL 证书密码，需与证书生成时设置的密码一致 |
| `key_store_type` | `JKS` | 证书类型，需与证书实际类型保持一致 |
| `key_store_alias` | `doris_ssl_certificate` | 证书别名，需与证书中定义的别名保持一致 |

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: HTTPS 启用失败排查 -->

### Q: 启用 HTTPS 后 FE 启动失败？

`key_store_path` 指向的文件不存在，或路径权限不足。检查证书路径是否正确，确认 FE 进程对该路径有读取权限。

### Q: 启动报错提示证书加载失败？

`key_store_password`、`key_store_type` 或 `key_store_alias` 与证书实际信息不一致。核对证书生成时使用的密码、类型与别名，并与 `fe.conf` 中配置保持一致。

### Q: 浏览器访问提示证书不受信任？

使用了自签名证书。生产环境改用 CA 颁发的证书，或在客户端手动信任该证书。

### Q: 修改配置后 HTTPS 仍未生效？

FE 未重启或仅部分 FE 节点修改了配置。确认所有 FE 节点配置一致并完成重启。
