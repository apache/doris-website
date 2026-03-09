---
{
  "title": "Dorisクラスターのデプロイ | ストレージ・コンピュート統合型",
  "language": "ja",
  "description": "KubernetesでDorisクラスターをデプロイするには、Doris Operatorがデプロイされていることを確認してください。",
  "sidebar_label": "Deploy Doris Cluster"
}
---
# Doris Cluster のデプロイ

Kubernetes 上で Doris cluster をデプロイするには、[Doris Operator がデプロイされている](install-doris-operator.md)ことを確認してください。  
Doris cluster のデプロイプロセスは3つのステップで構成されています：デプロイテンプレートのダウンロード、テンプレートのカスタマイズとクラスターのデプロイ、クラスターステータスの確認です。
## Step 1: Doris デプロイテンプレートのダウンロード

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
## Step 2: テンプレートをカスタマイズしてクラスターをデプロイ
[Config Doris to Deploy](./install-config-cluster.md)のドキュメントに従って、必要に応じてカスタマイズした設定を実行します。設定完了後、以下のコマンドでデプロイします：

```shell
kubectl apply -f doriscluster-sample.yaml
```
## ステップ 3: クラスターのステータスを確認する
pod のステータスを確認してクラスターのステータスをチェックします：

```shell
kubectl get pods
```
期待される出力:

```shell
NAME                       READY   STATUS    RESTARTS   AGE
doriscluster-sample-fe-0   1/1     Running   0          2m
doriscluster-sample-be-0   1/1     Running   0          3m
```
デプロイされたリソースのステータスを確認します：

```shell
kubectl get dcr -n doris
```
期待される出力:

```shell
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```
