---
{
    "title": "集群规划",
    "language": "zh-CN",
    "description": "部署 Doris 前，需选择架构模式、规划端口与节点数量。"
}
---

<!-- 知识类型: 架构选型 + 配置参考（Reference）-->
<!-- 适用场景: 部署规划 / 架构选型 / 容量规划-->

## 架构规划

<!-- 知识类型: 架构选型决策 -->

根据业务需求选择架构模式：

| 架构模式 | 适用场景 | 依赖 |
| -------- | -------- | ---- |
| [存算一体](../../features-architecture/system-architecture#coupled-architecture) | 不需要极致弹性扩缩容 | 无需共享存储 |
| [存算分离](../../features-architecture/system-architecture#decoupled-architecture) | 需要动态调整计算资源 | 依赖共享存储 |

## 端口规划

<!-- 知识类型: 网络配置参数 -->

Doris 实例间通过网络通信，管理员可根据环境调整端口配置：

| 实例 | 端口名称 | 默认端口 | 通信方向 | 说明 |
| ---- | -------- | -------- | -------- | ---- |
| BE | be_port | 9060 | FE → BE | Thrift Server，接收 FE 请求 |
| BE | webserver_port | 8040 | BE ↔ BE | HTTP Server |
| BE | heartbeat_service_port | 9050 | FE → BE | 心跳服务（Thrift） |
| BE | brpc_port | 8060 | FE ↔ BE，BE ↔ BE | BRPC 通信 |
| FE | http_port | 8030 | FE ↔ FE，Client ↔ FE | HTTP Server |
| FE | rpc_port | 9020 | BE → FE，FE ↔ FE | Thrift Server，各 FE 需一致 |
| FE | query_port | 9030 | Client ↔ FE | MySQL Server |
| FE | edit_log_port | 9010 | FE ↔ FE | bdbje 通信 |

## 节点数量规划

<!-- 知识类型: 节点容量规划 -->

### FE 节点数量

FE 负责用户请求接入、查询规划、元数据管理及节点管理。

| 节点类型 | 作用 | 生产环境建议 |
| -------- | ---- | ------------ |
| Follower | 参与选举，Master 宕机时接替 | ≥ 3 个 |
| Observer | 仅同步元数据，扩展读服务能力 | 按需增加 |

### BE 节点数量

BE 负责数据存储与计算。生产环境使用 3 副本保证可靠性。

| 建议 | 说明 |
| ---- | ---- |
| ≥ 3 个 BE | 保证 3 副本可靠存储（存算一体模式。存算分离模式下，可以是 0 个或多个 BE。）|
| 支持横向扩容 | 增加节点可提升查询性能与并发 |

