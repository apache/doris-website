---
{
    "title": "部署 Doris 集群",
    "language": "zh-CN",
    "description": "在 Kubernetes 上部署 Doris 集群时，请提前部署 Doris Operator。"
}
---

在 Kubernetes 上部署 Doris 集群时，请提前[部署 Doris Operator](install-doris-operator.md)。

部署 Doris 集群的过程分为三个步骤：下载 Doris 部署模板、配置并安装自定义部署模板、检查集群状态。

## 第 1 步：下载 Doris 部署模板

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```

## 第 2 步：安装自定义部署模板

根据[集群配置章节](./install-config-cluster.md)按需进行定制化配置，配置完成后通过如下命令部署：

```shell
kubectl apply -f doriscluster-sample.yaml
```

## 第 3 步：检查集群部署状态

1. **查看 pods 的状态**：

  ```shell
  kubectl get pods
  ```

  期望结果：
  
  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```
  
2. **查看部署资源的状态**：

  ```shell
  kubectl get dcr -n doris
  ```

  期望结果：
  
  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
