---
{
    "title": "部署 Prometheus 和 Grafana",
    "language": "zh-CN",
    "description": "详细讲解如何在 Kubernetes 上部署 Prometheus 和 Grafana，用于监控 Doris 存算分离集群",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "Prometheus", "Grafana", "metric", "K8s", "monitor"]
}
---


Prometheus 和 Grafana 是应用广泛、性能优异的监控组件。我们在 Doris 存算分离架构中使用二者对集群进行监控。
部署 Prometheus 和 Grafana 需要借助 Helm 工具，它整合了 Prometheus、Grafana 等相关组件，能够便捷地实现集群监控。

## 在Kubernetes上部署 Prometheus 和 Grafana

需要三个步骤：

1. 在Kubernetes上部署 helm/Prometheus/Grafana
2. 配置Prometheus.
3. 配置Grafana.

### Step 1: 在 Kubernetes 上部署 helm/Prometheus/Grafana

1. 可以通过如下命令在Kubernetes上下载helm工具：

```shell
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

2. 更新helm:

```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-chartshelm repo update
```

3. 执行部署：

```shell
# create name space
kubectl create namespace monitoring

# deploy
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

4. 检查pod状态:
```shell
kubectl get pods -n monitoring
```
其结果应该类似如下:
```shell
NAME                                                     READY   STATUS    RESTARTS         AGE
alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   8 (5h28m ago)    4d23h
prometheus-grafana-7994c77c7-8nk7j                       3/3     Running   12 (5h28m ago)   5d
prometheus-kube-prometheus-operator-5576477887-dgp8h     1/1     Running   4 (5h28m ago)    5d
prometheus-kube-state-metrics-77885ddddc-hldlw           1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   0                4h11m
prometheus-prometheus-node-exporter-2tl9s                1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-node-exporter-b58rd                1/1     Running   4 (5h28m ago)    4d23h
prometheus-prometheus-node-exporter-fqp6v                1/1     Running   4 (5h28m ago)    4d23h
```


### Step 2: 配置 Prometheus

1. 你可以直接参考下面这个yaml文件:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: doris-disaggregated-monitor
  namespace: monitoring
  labels:
    release: prometheus
spec:
  namespaceSelector:
    matchNames:
    - default
  selector:
    matchLabels:
      app.doris.disaggregated.cluster: test-disaggregated-cluster
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
    relabelings:
    # 1. Set a unified job name.
    - action: replace
      targetLabel: job
      replacement: doris-cluster
    # 2. map：-cg1 -> be, -fe -> fe, -ms -> meta_service
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-cg1
      replacement: be
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-fe
      replacement: fe
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-ms
      replacement: meta_service
      targetLabel: group

  - port: brpc-port
    path: /brpc_metrics
    interval: 15s
    relabelings:
    # 1. Set a unified job name.
    - action: replace
      targetLabel: job
      replacement: doris-cluster
    # 2. map：-cg1 -> be, -fe -> fe, -ms -> meta_service
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-cg1
      replacement: be
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-fe
      replacement: fe
      targetLabel: group
    - sourceLabels: [__meta_kubernetes_service_name]
      regex: .*-ms
      replacement: meta_service
      targetLabel: group
```

2. 应用这个yaml文件:
```shell
kubectl apply -f doris-monitor.yaml
```

3. 在浏览器上输入(your_ip:9090)，检查Prometheus是否在正常工作


### Step 3: 配置 Grafana
1. 首先在浏览器上访问Grafana(your_ip:3000);

2. 首次登录时，请输入用户名和密码。用户名为 admin，可通过以下命令获取密码：

```shell
kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

3. 下载如下Dashboard文件并将其导入Grafana:
[dashboard](https://selectdb-doris.oss-cn-beijing.aliyuncs.com/docs/Doris-Dashboard-Cloud.json)

4. 复制Grafana的URL, 将 &var-cluster_id=doris-cluster 加到URL后面, 类似如下URL链接:
```shell
http://your_ip:3000/d/3fFiWJ4mz456/doris-cloud-dashboard-overview?orgId=1&var-cluster_id=doris-cluster&refresh=5s
```
你就能看到对应的Dashboard了。

5. 需要注意的是，示例 JSON 文件中未包含主机监控面板，但你可以使用 Grafana 官方自带的监控模板。

    - 导入Dashboard
   ![image-for-grafana-import-dashboard](/ja-build/assets/images/image-for-grafana-import-dashboard.png)

    - 在Grafana中选1860这套模板
   ![image-for-grafana-demo-1860](/ja-build/assets/images/image-for-grafana-demo-1860.png)

    - 最后就可以看到metric信息了
   ![image-for-node-metrics](/ja-build/assets/images/image-for-node-metrics.png)


