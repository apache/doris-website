---
{
    "title": "01 Doris Operator のデプロイ",
    "language": "ja",
    "description": "Kubernetes 上に Apache Doris Operator をインストールするための包括的なガイドです。CRD のインストール、Operator のデプロイ、状態の確認を扱います。",
    "keywords": ["Doris Operator", "Kubernetes", "K8s", "CRD", "Operator のデプロイ", "ストレージ・コンピュート一体型"]
}
---

Doris Operator のデプロイは、CRD のインストール、Operator サービスのデプロイ、デプロイ状態の確認という三つのステップで行います。

## ステップ 1: Doris Operator の CRD をインストールする

次のコマンドで Doris Operator のカスタムリソース定義（CRD）を追加します。

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```

## ステップ 2: Doris Operator をデプロイする

次のコマンドで Doris Operator をインストールします。

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/operator.yaml
```

期待される出力:

```shell
namespace/doris created
role.rbac.authorization.k8s.io/leader-election-role created
rolebinding.rbac.authorization.k8s.io/leader-election-rolebinding created
clusterrole.rbac.authorization.k8s.io/doris-operator created
clusterrolebinding.rbac.authorization.k8s.io/doris-operator-rolebinding created
serviceaccount/doris-operator created
deployment.apps/doris-operator created
```

## ステップ 3: Doris Operator の状態を確認する

次のコマンドで Doris Operator のデプロイ状態を確認します。

```shell
kubectl get pods -n doris
```

期待される出力:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
