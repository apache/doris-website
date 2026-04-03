---
{
  "title": "Doris Operatorをデプロイする",
  "language": "ja",
  "description": "Doris Operatorのデプロイには3つのステップが含まれます：CustomResourceDefinitionsのインストール、Operatorサービスのデプロイ、デプロイメントステータスの確認。"
}
---
Doris Operatorのデプロイには3つのステップが含まれます：CustomResourceDefinitionsのインストール、Operatorサービスのデプロイ、デプロイメントステータスの確認。

## ステップ1：CustomResourceDefinitionsのインストール
以下のコマンドを使用してDoris Operatorのカスタムリソース（CRD）を追加します：

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```
## ステップ2: Doris OperatorとRBACルールのインストール
以下のコマンドを使用してDoris Operatorをインストールします：

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
## ステップ3: Doris Operatorのステータスを確認する
以下のコマンドを使用してDoris Operatorのデプロイメントステータスを確認します：

```shell
kubectl get pods -n doris
```
期待される出力:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
