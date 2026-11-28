---
{
    "title": "01 部署 Doris Operator",
    "language": "zh-CN",
    "description": "以 Doris Operator 26.0.1 为例，介绍在 Kubernetes 上安装 Apache Doris Operator：以 server-side apply 安装 CRD，固定 Operator 镜像版本，等待控制器就绪，并说明在同一集群中同时运行存算一体和存算分离集群的方法。",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator 部署", "存算一体", "server-side apply"]
}
---

本页以 Doris Operator 26.0.1 为例介绍 Doris Operator 的安装，分为安装 CRD、部署 Operator 和等待 Operator 就绪三步。Operator 和后续创建的 Doris 集群都位于 `doris` 命名空间中。开始前请完成[部署前准备](../doris-operator/preparation.mdx)。

本页命令可以重复执行。CRD、部署清单和 Operator 镜像使用同一版本，避免拉取到 `master` 分支或 `latest` 镜像中尚未发布的变更。

## 第 1 步：安装 CRD

```shell
DORIS_OPERATOR_VERSION=26.0.1
kubectl apply --server-side -f https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/crd/bases/crds.yaml
kubectl wait --for=condition=Established --timeout=60s \
  crd/dorisclusters.doris.selectdb.com \
  crd/dorisdisaggregatedclusters.disaggregated.cluster.doris.com
```

期望输出：

```text
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com serverside-applied
customresourcedefinition.apiextensions.k8s.io/dorisclusters.doris.selectdb.com condition met
customresourcedefinition.apiextensions.k8s.io/dorisdisaggregatedclusters.disaggregated.cluster.doris.com condition met
```

`crds.yaml` 同时包含存算一体使用的 `DorisCluster` 和存算分离使用的 `DorisDisaggregatedCluster`。CRD 文件超过 1MB，必须使用 `--server-side`：普通的 `kubectl apply` 会因 `last-applied-configuration` 注解超出大小限制而失败，`kubectl create` 在重复执行时会报 `AlreadyExists`。

## 第 2 步：部署 Operator

下载同一版本的部署清单，并将其中的镜像固定为 `apache/doris:operator-26.0.1`：

```shell
DORIS_OPERATOR_VERSION=26.0.1
curl -fsSL -o doris-operator.yaml \
  https://raw.githubusercontent.com/apache/doris-operator/${DORIS_OPERATOR_VERSION}/config/operator/operator.yaml
sed -i.bak "s#apache/doris:operator-latest#apache/doris:operator-${DORIS_OPERATOR_VERSION}#" doris-operator.yaml
grep 'image:' doris-operator.yaml
```

期望输出：

```text
          image: apache/doris:operator-26.0.1
```

`26.0.1` tag 中的部署清单仍引用 `apache/doris:operator-latest`，`sed` 命令将其替换为固定版本。`-i.bak` 的写法同时兼容 Linux 和 macOS，原文件备份为 `doris-operator.yaml.bak`。

确认镜像版本后部署 Operator：

```shell
kubectl apply -f doris-operator.yaml
```

期望输出：

```text
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
validatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-validate-webhook created
mutatingwebhookconfiguration.admissionregistration.k8s.io/doris-operator-mutate-webhook created
secret/doris-operator-secret-cert created
service/doris-operator-service created
deployment.apps/doris-operator created
```

清单会创建 `doris` 命名空间，后续的 Doris 集群也部署在该命名空间中。重复执行时，输出中的 `created` 会变为 `unchanged` 或 `configured`。

:::tip 提示
如果同一个 Kubernetes 集群中还会部署存算分离集群，请将上面的 `operator.yaml` 换成 `disaggregated-operator.yaml`，详见[在同一集群中同时运行两种模式](#run-both-modes)。
:::

## 第 3 步：等待 Operator 就绪

```shell
kubectl -n doris rollout status deployment/doris-operator --timeout=300s
kubectl -n doris get pods
```

期望输出：

```text
deployment "doris-operator" successfully rolled out
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-5665bb679c-ttdh5   1/1     Running   0          20s
```

`rollout status` 返回成功、Pod 为 `1/1 Running` 后，即可[部署 Doris 集群](install-doris-cluster.md)。

如果等待超时，按以下方法排查：

```shell
kubectl -n doris describe pod -l control-plane=doris-operator
kubectl -n doris logs deployment/doris-operator -c dorisoperator --tail=100
```

| 现象 | 常见原因 |
| --- | --- |
| `Pending` | 节点可分配资源不足。Operator 的 requests 为 1 CPU / 2Gi |
| `ImagePullBackOff` 或 `ErrImagePull` | 节点无法访问 Docker Hub，或镜像名写错。请在 `describe` 输出的 Events 中查看具体错误 |
| `CrashLoopBackOff` | 查看 Operator 日志。常见原因是 CRD 未安装或版本不匹配，请重新执行第 1 步 |

## 在同一集群中同时运行两种模式 {#run-both-modes}

存算一体和存算分离集群可以运行在同一个 Kubernetes 集群中，共用一套 CRD 和一个 Operator：

- **CRD**：`crds.yaml` 已包含两种模式的 CRD，安装一次即可。存算分离教程中的 CRD 安装命令与第 1 步相同，重复执行不会报错。
- **Operator**：`operator.yaml` 与 `disaggregated-operator.yaml` 创建的是同一组资源（`doris` 命名空间中的 `doris-operator` Deployment、ServiceAccount，以及集群级的 `doris-operator` ClusterRole 等），两者都会同时启动存算一体和存算分离的控制器。区别在于 `disaggregated-operator.yaml` 额外授予 Pod 的 `update`、`delete` 权限和 `pods/exec` 的 `create` 权限，供存算分离控制器使用。

需要同时运行两种模式时，按第 2 步的方法下载 `disaggregated-operator.yaml`，固定镜像版本后执行 `kubectl apply`。它会原地更新已存在的同名资源，已部署的集群不受影响。之后请不要再对该集群执行 `operator.yaml`，否则额外的权限会被移除。
