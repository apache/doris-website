---
{
    "title": "FQDN",
    "language": "zh-CN",
    "description": "本文介绍如何在 Apache Doris 中启用 FQDN（完全限定域名）模式，覆盖新集群启用、旧集群迁移、K8s 部署及服务器变更 IP 等场景。"
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 集群部署 / 节点变更 / Kubernetes 部署 -->

本文介绍如何启用基于 FQDN（Fully Qualified Domain Name，完全限定域名）的 Apache Doris 集群。FQDN 是 Internet 上特定计算机或主机的完整域名。

启用 FQDN 后，Doris 各节点之间的通信完全基于 FQDN。在添加节点时应直接指定 FQDN，例如添加 BE 节点的命令为：

```sql
ALTER SYSTEM ADD BACKEND "be_host:heartbeat_service_port";
```

其中 `be_host` 在 FQDN 模式下应填写 BE 节点的 FQDN，而非 IP 地址。

## 适用场景

<!-- 知识类型: 架构选型决策 -->

| 场景 | 说明 | 操作章节 |
| --- | --- | --- |
| 新部署集群 | 在搭建新集群时直接启用 FQDN，避免后续迁移 | [新集群启用 FQDN](#新集群启用-fqdn) |
| Kubernetes 部署 | Pod 重启后 IP 可能变化但域名不变，FQDN 可保证服务连续性 | [K8s 部署 Doris](#k8s-部署-doris) |
| 服务器变更 IP | 切换网卡或更换机器时无需修改 Doris 元数据 | [服务器变更 IP](#服务器变更-ip) |
| 存量集群迁移 | 将已基于 IP 运行的集群切换为 FQDN 模式 | [旧集群启用 FQDN](#旧集群启用-fqdn) |

## 前置条件

<!-- 知识类型: 部署前检查 -->

启用 FQDN 前需要满足以下条件：

- 在 `fe.conf` 中设置 `enable_fqdn_mode = true`。
- 集群中的所有机器都必须配置主机名（hostname）。
- 集群中每台机器的 `/etc/hosts` 文件中必须包含其他所有机器的 IP 地址与 FQDN 映射。
- `/etc/hosts` 文件中不允许出现重复的 IP 地址。

## 新集群启用 FQDN

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 新集群部署 -->

以部署 3 FE + 3 BE 集群为例，操作流程如下：

1. **准备机器**：根据规模准备机器（本例 6 台）。

2. **确认主机名唯一**：在每台机器上执行 `host` 命令，确保返回结果唯一。假设 6 台机器的主机名分别为 `fe1`、`fe2`、`fe3`、`be1`、`be2`、`be3`。

3. **配置 `/etc/hosts`**：在 6 台机器的 `/etc/hosts` 中配置全部 6 个 FQDN 对应的真实 IP：

    ```text
    172.22.0.1 fe1
    172.22.0.2 fe2
    172.22.0.3 fe3
    172.22.0.4 be1
    172.22.0.5 be2
    172.22.0.6 be3
    ```

4. **验证网络**：在任意节点（例如 `fe1`）上执行 `ping fe2`，能解析出正确 IP 并连通即代表网络环境可用。

5. **启用 FQDN 配置**：在每个 FE 节点的 `fe.conf` 中设置：

    ```text
    enable_fqdn_mode = true
    ```

6. **部署集群**：参考[手动部署](../../install/deploy-manually/integrated-storage-compute-deploy-manually)完成 FE / BE 部署。

7. **按需添加 Broker**：在所选机器上部署 Broker，并执行：

    ```sql
    ALTER SYSTEM ADD BROKER broker_name "fe1:8000","be1:8000",...;
    ```

## K8s 部署 Doris

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: Kubernetes 部署 -->

在 Kubernetes 环境下，Pod 意外重启后无法保证 IP 不变，但能保证域名不变。Doris 启用 FQDN 后，可以利用这一特性保证 Pod 重启后服务仍可正常访问。

K8s 部署 Doris 的完整方法请参考 [K8s 部署 Doris](../../install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster)。

## 服务器变更 IP

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 节点 IP 变更 / 网卡切换 / 机器替换 -->

按照"新集群启用 FQDN"完成部署后，若需要变更机器的 IP（例如切换网卡或更换机器），只需更新每台机器的 `/etc/hosts` 文件即可，无需修改 Doris 集群元数据。

## 旧集群启用 FQDN

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 存量集群迁移 -->

**前置版本要求**：当前 Doris 版本需要支持以下语法：

```sql
ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
```

如果当前版本不支持，需要先升级到支持该语法的版本。

:::caution
集群中至少需要有 3 台 Follower 节点才能进行如下操作，否则会导致集群无法正常启动。
:::

### FE 节点启用 FQDN

逐一对 Follower 与 Observer 节点执行以下操作，**最后再操作 Master 节点**：

1. **停止节点**：停止当前 FE 进程。

2. **检查节点状态**：通过 MySQL 客户端执行 `SHOW FRONTENDS`，确认该 FE 节点的 `Alive` 状态变为 `false`。

3. **设置 FQDN**：执行以下 SQL（停掉 Master 节点后会自动选举新的 Master，需通过新的 Master 执行该语句）：

    ```sql
    ALTER SYSTEM MODIFY FRONTEND "<fe_ip>:<edit_log_port>" HOSTNAME "<fe_hostname>";
    ```

4. **修改节点配置**：在已停止节点的 FE 根目录下编辑 `conf/fe.conf`，添加：

    ```text
    enable_fqdn_mode = true
    ```

    如果该节点添加配置后仍无法正常启动，请在**所有** FE 的 `fe.conf` 中添加 `enable_fqdn_mode = true`，然后再启动刚刚停止的 FE 节点。

5. **启动节点**：启动 FE 进程，使节点重新加入集群。

### BE 节点启用 FQDN

BE 节点启用 FQDN 无需重启，只需通过 MySQL 执行以下命令：

```sql
ALTER SYSTEM MODIFY BACKEND "<backend_ip>:<HeartbeatPort>" HOSTNAME "<be_hostname>";
```

如果不清楚 `HeartbeatPort` 端口号，可使用 `SHOW BACKENDS` 命令查询。

## 常见问题

<!-- 知识类型: 故障排查 -->

### Q: 配置项 `enable_fqdn_mode` 可以随意更改吗？

不能随意更改。如需将已经基于 IP 运行的集群切换为 FQDN 模式，必须按照[旧集群启用 FQDN](#旧集群启用-fqdn)的步骤操作。

### Q: Follower 节点少于 3 台时能否启用 FQDN？

不能。集群至少需要 3 台 Follower 节点才能执行旧集群迁移流程，否则会导致集群无法正常启动。

### Q: 服务器更换 IP 后是否需要修改 Doris 元数据？

不需要。只需在所有机器的 `/etc/hosts` 中更新 IP 与 FQDN 的映射关系即可。

### Q: 添加节点时 `be_host` 应填什么？

启用 FQDN 后，`be_host` 应填写 BE 节点的 FQDN，而非 IP 地址。
