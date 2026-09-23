---
{
    "title": "Docker Compose 部署",
    "sidebar_label": "Docker Compose 部署",
    "language": "zh-CN",
    "description": "如何使用 Docker Compose 在单机上部署 DOG Stack？本文介绍如何启动 OpenTelemetry Collector、Apache Doris 与集成 Doris App 插件的 Grafana，支持内置 Doris 和接入已有 Doris 集群两种方式，并介绍验证、访问与清理方法。",
    "keywords": [
        "DOG Stack 部署",
        "Docker Compose",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Doris App 插件",
        "可观测性建设"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可观测性建设 / DOG Stack 单机部署 -->

本文介绍如何使用 Docker Compose 在单机上部署 DOG Stack。部署会启动 OpenTelemetry Collector、集成 Doris App 插件的 Grafana，以及可选的一体化 Doris，适用于本地测试、开发和 PoC。生产环境或 Kubernetes 环境请参见 [Kubernetes 部署](./kubernetes.md)。

:::tip
如果不使用 Docker 部署各组件，请参见 [Doris 部署文档](https://doris.apache.org/zh-CN/docs/4.x/install/preparation/env-checking)、[OpenTelemetry Collector 安装文档](https://opentelemetry.io/docs/collector/install/) 和 [Grafana 安装文档](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)。
:::

## 前提条件

- Docker Engine 20.10 及以上版本
- Docker Compose 2.0 及以上版本

## 部署

1. 克隆仓库：

   ```Bash
   git clone https://github.com/ai-observe/ai-observe-stack.git
   cd ai-observe-stack/docker
   ```

2. 启动服务，以下两种方式二选一。

   - **内置 Doris**：同时启动一体化 Doris、OpenTelemetry Collector 和 Grafana。

     ```Bash
     docker compose up -d
     ```

   - **接入已有 Doris**：只启动 OpenTelemetry Collector 和 Grafana，数据写入已有的 Doris 集群。先创建配置文件：

     ```Bash
     cp .env.example .env
     ```

     在 `.env` 中修改 Doris 连接配置：

     ```Bash
     DORIS_FE_HTTP_ENDPOINT=http://<DORIS_FE_HOST>:8030
     DORIS_FE_MYSQL_ENDPOINT=<DORIS_FE_HOST>:9030
     DORIS_USERNAME=root
     DORIS_PASSWORD=
     ```

     然后启动服务：

     ```Bash
     docker compose -f docker-compose-without-doris.yaml up -d
     ```

     该账号需要具有 `CREATE DATABASE` 权限。OpenTelemetry Collector 会自动创建 `otel` 数据库及其中的表。

     OpenTelemetry Collector 通过 Stream Load 写入数据：FE 会将每个请求重定向到 BE 在 Doris 中注册的地址（可通过 `SHOW BACKENDS` 查看）。因此，除了 FE 之外，OpenTelemetry Collector 容器还需要能够访问这些 BE 地址及 BE 的 HTTP 端口（默认 8040）。

3. 验证服务是否正在运行：

   ```Bash
   docker compose ps
   ```

   接入已有 Doris 时，需要加上 `-f docker-compose-without-doris.yaml`。所有服务的 `STATUS` 列应显示 `Up`。使用内置 Doris 时，OpenTelemetry Collector 会在 Doris 通过健康检查后才启动。

4. 打开 http://localhost:3000，使用 `admin` / `admin` 登录 Grafana。

## 服务端点

| 服务 | 地址 | 账号 |
| --- | --- | --- |
| Grafana | http://localhost:3000 | admin / admin |
| OTLP gRPC | localhost:4317 | - |
| OTLP HTTP | localhost:4318 | - |
| OpenTelemetry Collector 健康检查 | http://localhost:13133 | - |
| Doris FE Web UI（仅内置 Doris） | http://localhost:8030 | root / 空密码 |
| Doris MySQL 协议（仅内置 Doris） | localhost:9030 | root / 空密码 |

接入 OpenTelemetry SDK 的应用将数据发送到 `localhost:4317`（gRPC）或 `localhost:4318`（HTTP）。

## 停止和清理

停止服务并保留数据：

```Bash
docker compose down
```

停止服务并删除所有数据：

```Bash
docker compose down -v
```

接入已有 Doris 时，以上两条命令都需要加上 `-f docker-compose-without-doris.yaml`。已有 Doris 集群中的数据不会被删除。
