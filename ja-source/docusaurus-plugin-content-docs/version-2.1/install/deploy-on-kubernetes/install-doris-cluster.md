---
{
  "title": "Dorisクラスターのデプロイ",
  "language": "ja",
  "description": "KubernetesでDorisクラスターをデプロイするには、Doris Operatorがデプロイされていることを確認してください。"
}
---
Kubernetes上にDorisクラスターをデプロイするには、[Doris Operatorがデプロイされている](install-doris-operator.md)ことを確認してください。
Dorisクラスターのデプロイメントプロセスは3つのステップで構成されています：デプロイメントテンプレートのダウンロード、テンプレートのカスタマイズとクラスターのデプロイ、そしてクラスターステータスの確認です。
## ステップ1：Dorisデプロイメントテンプレートをダウンロードする

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```
## ステップ2: テンプレートをカスタマイズしてクラスターをデプロイする
[Config Doris to Deploy](./install-config-cluster.md)のドキュメントに従って、必要に応じてカスタマイズした設定を実行します。設定が完了したら、以下のコマンドでデプロイします：

```shell
kubectl apply -f doriscluster-sample.yaml
```
## Step 3: クラスターステータスの確認
- ポッドのステータスを確認してクラスターのステータスをチェックする

  ```shell
  kubectl get pods
  ```
期待される出力:

  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```
- デプロイされたリソースのステータスを確認する

  ```shell
  kubectl get dcr -n doris
  ```
期待される出力:

  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
