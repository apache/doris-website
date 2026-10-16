---
{
    "title": "03 Doris クラスターのデプロイ",
    "language": "ja",
    "description": "Doris Operator を使用して Kubernetes 上に Apache Doris クラスターをデプロイするための包括的なガイドです。デプロイ用テンプレートのダウンロード、クラスターの設定、クラスターの状態確認について説明します。",
    "keywords": ["Doris クラスターのデプロイ", "Kubernetes", "K8s", "DorisCluster", "ストレージ・コンピュート一体型", "クイックデプロイ"]
}
---

Kubernetes 上に Doris クラスターをデプロイする前に、[Doris Operator をデプロイ](install-doris-operator.md)してください。

Doris クラスターのデプロイは、Doris デプロイ用テンプレートのダウンロード、要件に合わせたテンプレートの設定と適用、クラスターの状態確認の三つのステップで行います。

## ステップ 1: Doris デプロイ用テンプレートをダウンロード

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/doriscluster-sample.yaml
```

## ステップ 2: 設定したデプロイ用テンプレートを適用

[クラスターの設定](./install-config-cluster.md)に従って必要な設定を行い、次のコマンドでデプロイします。

```shell
kubectl apply -f doriscluster-sample.yaml
```

## ステップ 3: クラスターのデプロイ状態を確認

1. **Pod の状態を確認**:

  ```shell
  kubectl get pods
  ```

  期待される結果:

  ```shell
  NAME                       READY   STATUS    RESTARTS   AGE
  doriscluster-sample-fe-0   1/1     Running   0          2m
  doriscluster-sample-be-0   1/1     Running   0          3m
  ```

2. **デプロイしたリソースの状態を確認**:

  ```shell
  kubectl get dcr -n doris
  ```

  期待される結果:

  ```shell
  NAME                  FESTATUS    BESTATUS    CNSTATUS   BROKERSTATUS
  doriscluster-sample   available   available
  ```
