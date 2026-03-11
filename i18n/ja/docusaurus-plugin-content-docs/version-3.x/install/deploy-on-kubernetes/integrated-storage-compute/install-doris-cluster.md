---
{
  "title": "Dorisクラスターのデプロイ | ストレージコンピュート統合",
  "language": "ja",
  "description": "Kubernetes上でDorisクラスターをデプロイするには、Doris Operatorがデプロイされていることを確認してください。",
  "sidebar_label": "Deploy Doris クラスター"
}
---
# Dorisクラスターのデプロイ

KubernetesにDorisクラスターをデプロイするには、[Doris Operatorがデプロイされている](install-doris-operator.md)ことを確認してください。  
Dorisクラスターのデプロイプロセスは3つのステップで構成されます：デプロイテンプレートのダウンロード、テンプレートのカスタマイズとクラスターのデプロイ、そしてクラスターステータスの確認です。
## ステップ1：Dorisデプロイテンプレートのダウンロード

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
## ステップ2: テンプレートをカスタマイズしてクラスターをデプロイする
[Config Doris to Deploy](./install-config-cluster.md)のドキュメントに従って、必要に応じてカスタマイズされた設定を実行します。設定が完了したら、以下のコマンドでデプロイします:

```shell
kubectl apply -f doriscluster-sample.yaml
```
## ステップ3: クラスターステータスの確認
podのステータスを確認してクラスターのステータスをチェックします:

```shell
kubectl get pods
```
期待される出力:

```shell
NAME                       READY   STATUS    RESTARTS   AGE
doriscluster-sample-fe-0   1/1     Running   0          2m
doriscluster-sample-be-0   1/1     Running   0          3m
```
デプロイされたリソースのステータスを確認してください：

```shell
kubectl get dcr -n doris
```
期待される出力:

```shell
NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
doriscluster-sample   available   available
```
