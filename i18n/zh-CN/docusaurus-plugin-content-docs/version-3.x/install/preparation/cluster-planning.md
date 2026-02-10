---
{
    "title": "集群规划",
    "language": "zh-CN",
    "description": "在部署 Doris 时，可以根据业务选择存算一体或存算分离架构："
}
---

## 架构规划

在部署 Doris 时，可以根据业务选择存算一体或存算分离架构：

- [存算一体](../../gettingStarted/what-is-apache-doris.md#存算一体)：存算一体架构部署简单，性能优异，不依赖与外部的共享存储设备，适合不需要极致弹性扩缩容的业务场景；

- [存算分离](../../gettingStarted/what-is-apache-doris.md#存算分离)：存算分离架构依赖于共享存储，实现了计算资源的弹性伸缩，适合需要动态调整计算资源的业务场景。

## 端口规划

Doris 的各个实例通过网络进行通信，其正常运行需要网络环境提供以下端口。管理员可以根据实际环境自行调整 Doris 的端口配置：

| 实例名称 | 端口名称               | 默认端口 | 通信方向                   | 说明                                                  |
| -------- | ---------------------- | -------- | -------------------------- | ----------------------------------------------------- |
| BE       | be_port                | 9060     | FE -> BE                   | BE 上 Thrift Server 的端口，用于接收来自 FE 的请求    |
| BE       | webserver_port         | 8040     | BE <-> BE                  | BE 上的 HTTP Server 端口                              |
| BE       | heartbeat_service_port | 9050     | FE -> BE                   | BE 上的心跳服务端口（Thrift），用于接收来自 FE 的心跳 |
| BE       | brpc_port              | 8060     | FE <-> BE，BE <-> BE       | BE 上的 BRPC 端口，用于 BE 之间的通信                 |
| FE       | http_port              | 8030     | FE <-> FE，Client <-> FE   | FE 上的 HTTP Server 端口                              |
| FE       | rpc_port               | 9020     | BE -> FE，FE <-> FE        | FE 上的 Thrift Server 端口，每个 FE 的配置需保持一致  |
| FE       | query_port             | 9030     | Client <-> FE              | FE 上的 MySQL Server 端口                             |
| FE       | edit_log_port          | 9010     | FE <-> FE                  | FE 上的 bdbje 通信端口                                |

## 节点数量规划

### FE 节点数量

FE 节点主要负责用户请求的接入、查询解析规划、元数据管理及节点管理等工作。

对于生产集群，一般建议部署至少 3 个节点的 FE 以实现高可用环境。FE 节点分为以下两种角色：

- **Follower 节点**：参与选举操作，当 Master 节点宕机时，会选择一个可用的 Follower 节点成为新的 Master。
  
- **Observer 节点**：仅从 Leader 节点同步元数据，不参与选举，可用于横向扩展以提升元数据的读服务能力。

通常情况下，建议部署至少 3 个 Follower 节点。在高并发的场景中，可以通过增加 Observer 节点的数量来提高集群的连接数。

### BE 节点数量

BE 节点负责数据的存储与计算。在生产环境中，为了数据的可靠性和容错性，通常会使用 3 副本存储数据，因此建议部署至少 3 个 BE 节点。

BE 节点支持横向扩容，通过增加 BE 节点的数量，可以有效提升查询的性能和并发处理能力。

