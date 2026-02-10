---
{
    "title": "部署 Doris Operator",
    "language": "zh-CN",
    "description": "部署 Doris Operator 的过程分为安装 CRD、部署 Operator 服务以及检查部署状态三个步骤。"
}
---

部署 Doris Operator 的过程分为安装 CRD、部署 Operator 服务以及检查部署状态三个步骤。

## 第 1 步：安装 Doris Operator CRD

通过以下命令添加 Doris Operator 的自定义资源（CRD）：

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

## 第 2 步：部署 Doris Operator

通过以下命令安装 Doris Operator：

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

期望输出结果：

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

## 第 3 步：检查 Doris Operator 状态

通过以下命令检查 Doris Operator 的部署状态：

```shell
kubectl get pods -n doris
```

期望输出结果：

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
