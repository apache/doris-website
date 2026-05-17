---
{
    "title": "弹性扩缩容",
    "language": "zh-CN",
    "description": "Doris 支持在线弹性扩容，通过动态添加或移除节点，用户无需中断服务即可满足业务增长需求或降低空闲资源的浪费。扩缩容 BE 节点时，不影响集群可用性，但会涉及到数据搬迁，建议在业务闲时进行扩缩容操作。"
}
---

Doris 支持在线弹性扩容，通过动态添加或移除节点，用户无需中断服务即可满足业务增长需求或降低空闲资源的浪费。扩缩容 BE 节点时，不影响集群可用性，但会涉及到数据搬迁，建议在业务闲时进行扩缩容操作。

## 扩缩容 FE 集群

Doris 的 FE 节点分为以下三种角色，每一个 FE 节点都有全量的元数据信息：

* Master 节点：负责元数据的读写操作，当 Master 的元数据发生变化，会通过 BDB JE 协议同步到非 Master 节点中，同一集群中只能有一个 Master FE 节点；

* Follower 节点：负责元数据的读取操作，当 Master 节点发生故障时，Follower 节点会发起选主操作，选举出一个新的 Master 节点。在集群内，Master 与 Follower 节点总和建议为奇数个；

* Observer 节点：负责元数据的读取操作，不参与选主操作。用于扩展 FE 的读服务能力。

一般情况下，每台 FE 节点可以负责 10-20 台 BE 节点的负载操作，3 个 FE 节点可以满足大部分的业务需求。

### 扩容 FE 集群

:::info 提示：

在新添加 FE 节点时，需要注意以下事项：

* 新添加的 FE http_port 要与原集群中所有 FE 节点相同；

* 如果添加 Follower 节点，同一级群内 Master 与 Follower 节点数量总和建议为奇数个

* 通过 `show frontends` 命令可以看到当前集群内节点的端口及角色信息

:::

1. 启动 FE 节点：

  ```bash
  fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
  ```

  * 注册 FE 节点：

    * 将节点注册为 Follower FE：

      ```sql
      ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
      ```

    * 将节点注册为 Observer FE：

      ```sql
      ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
      ```

  * 查看新添加的 FE 节点状态：

    ```sql
    show frontends;
    ```

### 缩容 FE 集群

在缩容 FE 节点时，也要保证最终集群内 Master 与 Follower 节点总和为奇数个，通过以下命令可以缩容节点：

```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```
在缩容后，需要手动删除 FE 目录下的文件。

## 扩缩容 BE 集群

### 扩容 BE 集群

1. 启动 BE 进程：

   ```sql
   be/bin/start_be.sh
   ```

2. 注册 BE 节点：

   ```sql
   ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
   ```

### 缩容 BE 集群

在缩容 BE 节点时，可以选择 DROP 或 DECOMMISSION 两种方案：

|          | DROP              | DECOMMISSION                                |
| -------- | ----------------- | ------------------------------------------- |
| 下线原理     | 直接下线节点，删除掉 BE 节点。 | 发起命令后，会尝试将该 BE 数据迁移到其他节点上，当迁移完成后，BE 节点自动下线。 |
| 生效周期     | 执行后立即生效。          | 待数据搬迁完成后，删除命令生效。根据集群现有数据量，可能在小时到 1 天不等时间内。 |
| 一副本表处理方案 | 可能会造成数据丢失。        | 不会造成数据丢失。                                   |
| 同时下线多个节点 | 可能会造成数据丢失。        | 不会造成数据丢失。                                   |
| 生产推荐     | 不建议生产环境使用。        | 推荐在生产环境使用。                                  |

* 通过以下命令，可以使用 DROP 方式删除 BE 节点：

  ```sql
  ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
  ```

* 通过以下命令，可以使用 DECOMMISSION 方式删除 BE 节点：

  ```sql
  ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
  ```

DECOMMISSION 命令说明：

- DECOMMISSION 是一个异步操作。执行后，可以通过 SHOW backends; 看到该 BE 节点的 SystemDecommissioned 状态为 true。表示该节点正在进行下线；

- DECOMMISSION 命令可能会执行失败，如剩余 BE 存储空间不足以容纳下线 BE 上的数据，或者剩余机器数量不满足最小副本数时，该命令都无法完成，并且 BE 会一直处于 SystemDecommissioned 为 true 的状态；

- DECOMMISSION 的进度，可以通过 SHOW PROC '/backends'; 中的 TabletNum 查看，如果正在进行，TabletNum 将不断减少；

- 可以通过 CANCEL DECOMMISSION BACKEND "be_host:be_heartbeat_service_port"; 命令取消。取消后，该 BE 上的数据将维持当前剩余的数据量。后续 Doris 重新进行负载均衡；

- 可以调整 balance_slot_num_per_path 参数调整数据搬迁速率。
