---
{
    "title": "弹性扩缩容",
    "language": "zh-CN",
    "description": "Apache Doris 弹性扩缩容操作指南：在线添加或下线 FE/BE 节点，支持 DROP 与 DECOMMISSION 两种缩容方式，业务无中断。",
    "keywords": [
        "Doris 弹性扩缩容",
        "Doris 在线扩容",
        "Doris 缩容",
        "FE 扩容",
        "BE 扩容",
        "FE 缩容",
        "BE 缩容",
        "ALTER SYSTEM ADD FOLLOWER",
        "ALTER SYSTEM ADD OBSERVER",
        "ALTER SYSTEM ADD BACKEND",
        "ALTER SYSTEM DROP BACKEND",
        "ALTER SYSTEM DECOMMISSION BACKEND",
        "DECOMMISSION",
        "数据搬迁",
        "节点上下线",
        "集群扩容"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群扩容 / 集群缩容 / 节点上下线 -->

Apache Doris 支持在线弹性扩缩容：通过动态添加或移除节点，在不中断业务的前提下满足业务增长，或回收闲置资源。扩缩容 BE 节点不会影响集群可用性，但会触发数据搬迁，建议在业务低峰期执行。

## 适用场景

| 场景 | 推荐操作 | 说明 |
| --- | --- | --- |
| FE 读服务能力不足 | 扩容 Observer FE | Observer 不参与选主，专用于提升元数据读吞吐 |
| FE 高可用不足 | 扩容 Follower FE | Master 与 Follower 总数保持奇数，建议 3 或 5 个 |
| BE 存储或算力不足 | 扩容 BE | 添加 BE 后系统自动负载均衡，数据逐步均匀 |
| 下线指定 BE 节点 | 缩容 BE（DECOMMISSION） | 先迁移数据再下线，生产环境推荐 |
| 节点已损坏需立即剔除 | 缩容 BE（DROP） | 立即下线，可能造成数据丢失，仅在异常场景使用 |

## 前置条件

- 拥有集群管理员权限，能够执行 `ALTER SYSTEM` 类操作。
- 已规划好节点的 IP、端口和角色（Follower / Observer / BE）。
- 新加入的 FE 节点 `http_port` 与现有集群所有 FE 节点保持一致。
- BE 缩容操作建议在业务低峰期执行，并预留足够磁盘空间承接搬迁数据。

## 扩缩容 FE 集群

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: FE 节点扩容 / FE 节点缩容 -->

### FE 角色说明

Doris 的 FE 节点分为以下三种角色，每一个 FE 节点都持有全量的元数据信息：

| 角色 | 是否参与选主 | 元数据读写能力 | 用途 |
| --- | --- | --- | --- |
| Master | 是（唯一） | 读 + 写 | 负责元数据读写。Master 元数据变化通过 BDB JE 协议同步到其他节点，同一集群只能有一个 Master |
| Follower | 是 | 读 | 负责元数据读取；Master 故障时发起选主，选出新的 Master。Master 与 Follower 总数建议为奇数 |
| Observer | 否 | 读 | 负责元数据读取，不参与选主，用于扩展 FE 的读服务能力 |

一般情况下，每台 FE 节点可承载 10 ～ 20 台 BE 节点的负载，3 个 FE 节点即可满足大部分业务需求。

### 扩容 FE 集群

:::info 提示
在新添加 FE 节点时，需要注意以下事项：

- 新添加的 FE `http_port` 要与原集群中所有 FE 节点相同。
- 如果添加 Follower 节点，同一集群内 Master 与 Follower 节点数量总和建议为奇数个。
- 通过 `show frontends` 命令可以看到当前集群内节点的端口及角色信息。
:::

1. 启动 FE 节点：

    ```shell
    fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
    ```

2. 注册 FE 节点。

    将节点注册为 Follower FE：

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```

    或将节点注册为 Observer FE：

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```

3. 查看新添加的 FE 节点状态：

    ```sql
    show frontends;
    ```

### 缩容 FE 集群

缩容时需保证最终集群内 Master 与 Follower 节点总和仍为奇数个。通过以下命令缩容节点：

```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```

缩容后，需要手动删除该 FE 节点对应目录下的文件。

## 扩缩容 BE 集群

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BE 节点扩容 / BE 节点缩容 / 数据搬迁 -->

### 扩容 BE 集群

1. 启动 BE 进程：

    ```shell
    be/bin/start_be.sh
    ```

2. 注册 BE 节点：

    ```sql
    ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
    ```

注册完成后，新的 BE 会自动加入集群，Doris 会逐步将已有数据均衡到新节点上。

### 缩容 BE 集群

缩容 BE 节点时，可以选择 DROP 或 DECOMMISSION 两种方式，二者区别如下：

| 对比项 | DROP | DECOMMISSION |
| --- | --- | --- |
| 下线原理 | 直接下线节点，删除掉 BE 节点 | 发起命令后，会尝试将该 BE 数据迁移到其他节点上，迁移完成后 BE 节点自动下线 |
| 生效周期 | 执行后立即生效 | 待数据搬迁完成后，删除命令生效。根据集群现有数据量，可能在小时到 1 天不等时间内 |
| 一副本表处理方案 | 可能会造成数据丢失 | 不会造成数据丢失 |
| 同时下线多个节点 | 可能会造成数据丢失 | 不会造成数据丢失 |
| 生产推荐 | 不建议生产环境使用 | 推荐在生产环境使用 |

#### 使用 DROP 方式删除 BE 节点

适用于节点已损坏或测试环境，需要立即剔除节点的场景：

```sql
ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
```

#### 使用 DECOMMISSION 方式删除 BE 节点

生产环境推荐使用 DECOMMISSION，先迁移数据再下线：

```sql
ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
```

DECOMMISSION 命令说明：

- DECOMMISSION 是一个异步操作。执行后，可以通过 `SHOW backends;` 看到该 BE 节点的 `SystemDecommissioned` 状态为 `true`，表示该节点正在进行下线。
- DECOMMISSION 命令可能会执行失败，例如剩余 BE 存储空间不足以容纳下线 BE 上的数据，或剩余机器数量不满足最小副本数时，该命令都无法完成，并且 BE 会一直处于 `SystemDecommissioned` 为 `true` 的状态。
- DECOMMISSION 的进度可以通过 `SHOW PROC '/backends';` 中的 `TabletNum` 查看，如果正在进行，`TabletNum` 将不断减少。
- 可以通过 `CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";` 命令取消。取消后，该 BE 上的数据将维持当前剩余的数据量，后续 Doris 重新进行负载均衡。
- 可以调整 `balance_slot_num_per_path` 参数调整数据搬迁速率。

## 常见问题

### Q: 新加入的 FE 节点无法启动？

`http_port` 与现有 FE 不一致，或未使用 `--helper` 指定 Leader FE。检查 `fe.conf` 中 `http_port` 配置；首次启动使用 `--helper <leader_fe_host>:<edit_log_port>`。

### Q: `ALTER SYSTEM ADD FOLLOWER` 后集群仍未识别新节点？

节点未启动或网络不通；端口被防火墙拦截。通过 `show frontends` 检查节点状态，确认 `edit_log_port` 端口连通。

### Q: DECOMMISSION 长时间不结束？

剩余 BE 存储空间不足或剩余节点数 < 最小副本数。扩容更多 BE 或先扩容再下线；通过 `SHOW PROC '/backends';` 查看 `TabletNum` 是否仍在下降。

### Q: DECOMMISSION 中途想取消？

执行 `CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";`，Doris 会重新负载均衡。

### Q: 数据搬迁速度过慢？

默认搬迁并发较低，调整 `balance_slot_num_per_path` 参数提升搬迁速率。

### Q: FE 缩容后磁盘空间未释放？

缩容命令成功后需手动清理，删除该 FE 节点对应的部署目录。
