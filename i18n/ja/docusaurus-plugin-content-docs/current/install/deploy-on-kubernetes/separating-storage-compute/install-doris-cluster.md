---
{
  "title": "Dorisクラスターのデプロイ | ストレージとコンピュートの分離",
  "language": "ja",
  "description": "Kubernetes上で機能的な分離ストレージ・コンピュートDorisクラスターをデプロイするには、4つの主要なステップが必要です：",
  "sidebar_label": "Deploy Doris クラスター"
}
---
# Doris クラスタのデプロイ

Kubernetes上で機能的な分離されたストレージとコンピュートDorisクラスタをデプロイするには、主に4つのステップが必要です：
1. 準備 – 主に、FoundationDBクラスタをインストールします。
2. Doris Operatorのデプロイ。
3. コンピュート・ストレージ分離クラスタのデプロイ。
4. Storage Backendの作成。

## ステップ1: 準備
Kubernetes上で分離クラスタをデプロイする前に、事前にFoundationDBをデプロイしておくことが重要です。
- （推奨）マシンへの直接デプロイ：
  FoundationDBがインストールされているマシンが、Kubernetesクラスタ内で実行されているサービスからアクセス可能であることを確認してください。マシンへの直接デプロイについては、分離デプロイメントドキュメントの[準備フェーズ](../../../compute-storage-decoupled/before-deployment)を参照してください。
- Kubernetes上でのデプロイ：
  Kubernetes上でFoundationDBをデプロイする場合は、[Kubernetes上でのFoundationDBのデプロイ](install-fdb.md)を参照してください。

## ステップ2: Doris Operatorのデプロイ
1. リソース定義を作成します：

    ```shell
    kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
    ```
非デカップルクラスターが既にデプロイされている場合、以下のコマンドを使用してCRD定義を作成してください：

    ```yaml
    kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
    ```
2. Doris Operatorとその関連するRBACルールをデプロイします:

    ```shell
    kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
    ```
デプロイ後、以下を使用してOperator Podのステータスを確認します：

    ```shell
    kubectl -n doris get pods
    NAME                              READY   STATUS    RESTARTS   AGE
    doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
    ```
## ステップ 3: compute-storage decoupled クラスターをデプロイする
1. Deployment サンプル をダウンロードする:

    ```shell
    curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
    ```
2. FoundationDB アクセス情報を設定します。
   Doris のコンピュート・ストレージ分離版では、メタデータの保存に FoundationDB を使用します。FoundationDB のアクセス詳細は、DorisDisaggregatedCluster の `spec.metaService.fdb` で 2 つの方法のいずれかで提供できます：アクセスアドレスを直接指定するか、アクセス情報を含む ConfigMap を使用する方法です。
    - 直接アクセスアドレス設定
      FoundationDB が Kubernetes 外部にデプロイされている場合は、そのアクセスアドレスを直接指定できます：

        ```yaml
        spec:
          metaService:
            fdb:
              address: ${fdbAddress}
        ```
ここで、${fdbAddress}はFoundationDBのクライアントアクセスアドレスを指します。Linux VMでは、これは通常`/etc/foundationdb/fdb.cluster`に保存されています。詳細については、FoundationDBの[cluster file documentation](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)を参照してください。

    - アクセス情報を含むConfigMapによる設定
      FoundationDBが[fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator)を使用してデプロイされている場合、operatorはデプロイメント名前空間内にアクセス情報を含む特定のConfigMapを生成します。
      生成されたConfigMapの名前は、FoundationDBリソース名に接尾辞"-config"を付けたものです。ConfigMapの名前と名前空間を取得した後、DorisDisaggregatedClusterリソースを以下のように設定します：

        ```yaml
        spec:
          metaService:
            fdb:
              configMapNamespaceName:
                name: ${foundationdbConfigMapName}
                namespace: ${namespace}
        ```
ここで、{foundationdbConfigMapName} は fdb-kubernetes-operator によって生成された ConfigMap の名前であり、{namespace} は ConfigMap が存在する namespace です。

3. DorisDisaggregatedCluster リソースの設定
   分離デプロイメントドキュメントに基づいて、以下を設定します：
    - metadata サービス（[metaService configuration](config-ms.md) で詳述）
    - FE クラスタの仕様（[FE cluster configuration](config-fe.md)）
    - compute group（[compute group configuration](config-cg.md)）

   設定完了後、以下のコマンドでリソースをデプロイします：

    ```shell
    kubectl apply -f ddc-sample.yaml
    ```
リソースが適用されたら、クラスターが完全に確立されるまで待ちます。以下のコマンドの期待される出力は次のとおりです：

    ```shell
    kubectl get ddc
    NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
    test-disaggregated-cluster   green           Ready     2         2                  2
    ```
## Step 4: Remote Storageバックエンドの作成
クラスタが正常に開始された後、SQLを使用して利用可能なオブジェクトストレージを永続ストレージバックエンド（DorisではVaultと呼ばれる）として設定します。

1. FE Service Access Addressの取得
   クラスタがデプロイされた後、以下のコマンドでDoris Operatorによって公開されているサービスを確認できます：

    ```shell
    kubectl get svc
    ```
出力例:

    ```shell
    NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
    test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
    test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
    test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
    test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
    test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
    ```
"-internal"サフィックスが付いていないServiceは、外部アクセス用です。

2. MySQLクライアントを使用して接続する
   Kubernetesクラスター内で、MySQLクライアントを含むPodを作成し、そのPodに入ります：

    ```shell
    kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
    ```
Pod内で、Service名を使用してDorisクラスターに直接接続します：

    ```shell
    mysql -uroot -P9030 -h test-disaggregated-cluster-fe 
    ```
3. Storage Backend(Vault)の作成
   SQLを使用して、VaultとしてS3プロトコルをサポートするオブジェクトストレージバックエンドを作成します。例：

      ```mysql
      CREATE STORAGE VAULT IF NOT EXISTS s3_vault
         PROPERTIES (
             "type"="S3",
             "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
             "s3.region" = "bj",
             "s3.bucket" = "bucket",
             "s3.root.path" = "big/data/prefix",
             "s3.access_key" = "your-ak",
             "s3.secret_key" = "your-sk",
             "provider" = "OSS" 
         );
      ```
他のストレージバックエンドの作成手順と各フィールドの詳細な説明については、分離デプロイメントドキュメントの[Managing Storage Vault](../../../compute-storage-decoupled/managing-storage-vault.md)セクションを参照してください。
   デフォルトのStorage Vaultを設定します。

   ```mysql
   SET {vaultName} AS DEFAULT STORAGE VAULT;
   ```
ここで、{vaultName}は使用したいVaultの名前です。例えば、上記の例で作成されたs3_vaultなどです。
