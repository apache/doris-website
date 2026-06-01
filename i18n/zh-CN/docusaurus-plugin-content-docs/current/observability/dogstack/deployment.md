---
{
    "title": "部署",
    "sidebar_label": "部署",
    "language": "zh-CN",
    "description": "如何在生产环境部署 DOG Stack？本文介绍 OpenTelemetry Collector、Apache Doris 与集成 Doris App 插件的 Grafana 三大核心组件的部署方式与选型建议。",
    "keywords": [
        "DOG Stack 部署",
        "OpenTelemetry Collector",
        "Apache Doris 部署",
        "Grafana 部署",
        "Doris App 插件",
        "Docker Compose",
        "Kubernetes",
        "可观测性建设"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可观测性建设 / DOG Stack 生产部署 -->

如架构图所示，DOG Stack 由四个组件组成：数据采集工具、OpenTelemetry Collector、Doris 和 集成 Doris应用的Grafana。本部署文档将重点介绍后三个组件，而数据采集文档将重点介绍第一个组件。

DOG Stack 为不同的环境和目的提供多种部署选项。



## Docker Compose

最适合本地测试、开发和 PoC。

### 依赖项

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)



### 部署

1. 克隆仓库：

   `git clone https://github.com/ai-observe/ai-observe-stack.git cd ai-observe-stack/docker`

   

2. 启动所有服务：

   `docker compose up -d`

   

3. 验证服务是否正在运行：

   `docker compose ps`

   所有服务应显示`running`状态。

   

4. 在 http://localhost:3000 访问 Grafana，使用默认用户密码`admin` / `admin`登录。



### 服务端点

| Service   | Endpoint              | Credentials   |
| --------- | --------------------- | ------------- |
| Grafana   | http://localhost:3000 | admin / admin |
| OTel gRPC | localhost:4317        | -             |
| OTel HTTP | localhost:4318        | -             |

### 停止和清理

在保留数据的同时停止服务：

```Bash
docker compose down
```

停止服务并删除所有数据：

```Bash
docker compose down -v
```



## Kubernetes

最适合生产部署、开发环境和可扩展的设置。

### 依赖项

- Kubernetes cluster (v1.20+)
- Helm (v3.0+)
- kubectl configured to access your cluster
- PersistentVolume provisioner (for data persistence)

### 部署

1. 添加DOG Stack 和Doris Helm仓库：
   
   `helm repo add dogstack https://charts.velodb.io helm repo update`
   
   
   
2. 为DOG Stack 创建一个命名空间 堆栈：
   
   `kubectl create namespace dogstack`
   
   
   
3. 安装 DOG Stack：
   
   如果您已有 Doris 集群，可以指定已有 Doris 集群的连接方式。
   
   `helm install my-dogstack dogstack/dogstack -n dogstack \  --set doris.mode=external \  --set doris.external.host=<DORIS_FE_HOST> \  --set doris.external.port=9030 \  --set doris.external.feHttpPort=8030 \  --set doris.internal.operator.enabled=false`
   
   
   
   如果您想使用新的 Doris 集群进行部署，只需直接安装，无需额外选项。
   
   `helm install my-dogstack dogstack/dogstack -n dogstack`
   
   
   
4. 验证所有 Pod 都在运行：
   
   `kubectl get pods -n dogstack`
   
   等待所有 Pod 显示`Running`状态。
   
   
   
5. 访问Grafana：
   
   `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack`
   
   打开 http://localhost:3000 并使用`admin` / `admin`登录。



### 服务端点

| Service     | Port-forward command                                         |
| ----------- | ------------------------------------------------------------ |
| Grafana     | `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack` |
| Doris FE UI | `kubectl port-forward svc/my-dogstack-doris-fe 8030:8030 -n dogstack` |
| Doris MySQL | `kubectl port-forward svc/my-dogstack-doris-fe 9030:9030 -n dogstack` |

### 卸载

```Bash
helm uninstall my-dogstack -n dogstack
kubectl delete namespace dogstack
```



## 手动部署

1. 按照 Doris [部署文档](https://doris.apache.org/docs/4.x/install/preparation/env-checking)部署 Doris 集群。如果已有 Doris 集群，则可跳过此步骤。

1. 按照 [OpenTelemetry部署文档](https://opentelemetry.io/docs/collector/install/) 部署 OpenTelemetry Collector。

1. 按照[ Grafana部署文档](https://grafana.com/docs/grafana/latest/setup-grafana/installation/) 部署 Grafana UI。

1. 浏览器打开 DOG Stack Web UI

访问 http://localhost:3000 以访问 DOG Stack 内的 Grafana UI。