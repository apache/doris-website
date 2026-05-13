---
{
    "title": "Deploy Prometheus and Grafana",
    "language": "en",
    "description": "Detailed walkthrough of deploying the Prometheus and Grafana on Kubernetes for the monitor of a Doris compute-storage decoupled cluster.",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "Prometheus", "Grafana", "metric", "K8s", "monitor"]
}
---

Prometheus and Grafana are widely used and excellent monitoring components. We utilize them in the decoupled compute‑storage architecture of Doris to monitor the cluster.

We need helm tool to help us deploy Prometheus and Grafana. It integrates Prometheus, Grafana and other components. So it's convenient for us to monitor the cluster.

## Deploy Prometheus and Grafana on Kubernetes

We have 3 steps:

1. Deploy the helm/Prometheus/Grafana on Kubernetes.
2. Configure the Prometheus.
3. Configure the Grafana.

### Step 1: Deploy the helm/Prometheus/Grafana on Kubernetes

1. Download the helm on Kubernetes with the following commands:

```shell
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

2. Update the helm:

```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-chartshelm repo update
```

3. Execute deployment：

```shell
# create name space
kubectl create namespace monitoring

# deploy
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

4. Check the pods of the name space:
```shell
kubectl get pods -n monitoring
```
the result will be like:
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


### Step 2: Configure the Prometheus

1. You can refer to the yaml file directly:
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

2. Then apply this yaml file:
```shell
kubectl apply -f doris-monitor.yaml
```

3. Last, enter the URL(your_ip:9090) at the browser, check if the prometheus is working.


### Step 3: Configure the Grafana
1. First, visit the Grafana at the browser(your_ip:3000);

2. When you login for the first time, you should enter a username and password. Username is admin, and you can get password from this command:
```shell
kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

3. Then please download this file and import the file to Grafana:
[dashboard](https://selectdb-doris.oss-cn-beijing.aliyuncs.com/docs/Doris-Dashboard-Cloud.json)

4. Copy the Grafana URL, add the &var-cluster_id=doris-cluster after the URL, like this:
```shell
http://your_ip:3000/d/3fFiWJ4mz456/doris-cloud-dashboard-overview?orgId=1&var-cluster_id=doris-cluster&refresh=5s
```
Then you can see the dashboard.

5. What you should notice is that there is no host monitor in the demo json file. But you can use the demo which is offered by grafana itself.

    - Import Dashboard
   ![image-for-grafana-import-dashboard](/ja-build/assets/images/image-for-grafana-import-dashboard.png)

    - Then enter the 1860 at grafana
   ![image-for-grafana-demo-1860](/ja-build/assets/images/image-for-grafana-demo-1860.png)

    - Last you can see the node metrics
    ![image-for-node-metrics](/ja-build/assets/images/image-for-node-metrics.png)



