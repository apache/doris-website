---
{
  "title": "Doris Operatorをデプロイする",
  "language": "ja",
  "description": "Doris Operatorのデプロイには3つのステップが含まれます：CustomResourceDefinitionsのインストール、Operatorサービスのデプロイ、デプロイ状況の確認。"
}
---
Doris Operatorのデプロイには3つのステップが含まれます：CustomResourceDefinitionsのインストール、Operatorサービスのデプロイ、デプロイメントステータスの確認。

## Step 1: CustomResourceDefinitionsのインストール
以下のコマンドを使用してDoris Operatorのカスタムリソース（CRD）を追加します：

```shell
kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
```
## Step 2: Doris Operator と RBAC ルールのインストール
以下のコマンドを使用して Doris Operator をインストールします：

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
## ステップ3：Doris Operatorのステータスを確認する
以下のコマンドを使用してDoris Operatorのデプロイメントステータスを確認してください：

```shell
kubectl get pods -n doris
```
期待される出力:

```shell
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-7f578c86cb-nz6jn   1/1     Running   0          19m
```
