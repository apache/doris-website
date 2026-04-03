---
{
  "title": "Dorisクラスターのデプロイ | ストレージとコンピュートの分離",
  "language": "ja",
  "description": "Kubernetes上で機能的な分離されたストレージとコンピュートDorisクラスターをデプロイするには、4つの主要なステップがあります：",
  "sidebar_label": "Deploy Doris クラスター"
}
---
# Dorisクラスターのデプロイ

Kubernetes上で機能的な分離ストレージとコンピュートDorisクラスターをデプロイするには、4つの主要なステップがあります：
1. 準備 – 主に、FoundationDBクラスターをインストールします。
2. Doris Operatorのデプロイ。
3. コンピュート・ストレージ分離クラスターのデプロイ。
4. Storage Backendの作成。

## ステップ1: 準備
Kubernetes上で分離クラスターをデプロイする前に、事前にFoundationDBをデプロイしておくことが必須です。
- （推奨）マシン上への直接デプロイ：
    FoundationDBがインストールされているマシンが、Kubernetesクラスター内で実行されているサービスからアクセス可能であることを確認してください。マシンへの直接デプロイについては、分離デプロイドキュメントの[Preparation Phase](../../../compute-storage-decoupled/before-deployment)を参照してください。
- Kubernetes上でのデプロイ：
    Kubernetes上でのFoundationDBのデプロイについては、[Deploying FoundationDB on Kubernetes](install-fdb.md)を参照してください。

## ステップ2: Doris Operatorのデプロイ
1. リソース定義を作成します：

    ```shell
    kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
    ```
非結合クラスターがすでにデプロイされている場合は、以下のコマンドを使用してCRD定義を作成してください：

    ```yaml
    kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
    ```
2. Doris Operatorとその関連するRBACルールをデプロイします：

    ```shell
    kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
    ```
デプロイ後、以下を使用してOperator Podのステータスを確認してください:

    ```shell
    kubectl -n doris get pods
    NAME                              READY   STATUS    RESTARTS   AGE
    doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
    ```
## ステップ3: コンピュート・ストレージ分離クラスターをデプロイする
1. デプロイメントサンプルをダウンロードする:

    ```shell
    curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
    ```
2. FoundationDB アクセス情報を設定します。
    Doris のコンピュート・ストレージ分離バージョンは、メタデータを格納するために FoundationDB を使用します。FoundationDB のアクセス詳細は、DorisDisaggregatedCluster の `spec.metaService.fdb` 以下で 2 つの方法のいずれかで提供できます：アクセスアドレスを直接指定するか、アクセス情報を含む ConfigMap を使用します。
    - 直接アクセスアドレス設定
        FoundationDB が Kubernetes 外部にデプロイされている場合、そのアクセスアドレスを直接指定できます：

        ```yaml
        spec:
          metaService:
            fdb:
              address: ${fdbAddress}
        ```
ここで、${fdbAddress} は FoundationDB のクライアントアクセスアドレスを指します。Linux VM では、これは通常 `/etc/foundationdb/fdb.cluster` に格納されています。詳細については、FoundationDB の [cluster file documentation](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file) を参照してください。

    - アクセス情報を含む ConfigMap による設定
        FoundationDB が [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) を使用してデプロイされている場合、オペレーターはデプロイメント名前空間内にアクセス情報を含む特定の ConfigMap を生成します。
        生成される ConfigMap の名前は、FoundationDB リソース名に接尾辞 "-config" を付けたものです。ConfigMap の名前と名前空間を取得した後、DorisDisaggregatedCluster リソースを以下のように設定します：

        ```yaml
        spec:
          metaService:
            fdb:
              configMapNamespaceName:
                name: ${foundationdbConfigMapName}
                namespace: ${namespace}
        ```
ここで、{foundationdbConfigMapName} は fdb-kubernetes-operator によって生成される ConfigMap の名前であり、{namespace} は ConfigMap が存在する namespace です。

3. DorisDisaggregatedCluster Resource の設定
    分離デプロイメントドキュメントに基づいて、以下を設定します：
    - metadata サービス（[metaService configuration](config-ms.md) で詳述）
    - FE クラスター仕様（[FE cluster configuration](config-fe.md)）
    - compute groups（[compute group configuration](config-cg.md)）

    設定完了後、以下のコマンドでリソースをデプロイします：

    ```shell
    kubectl apply -f ddc-sample.yaml
    ```
リソースが適用されたら、クラスターが完全に確立されるまで待機してください。以下のコマンドの期待される出力は次のとおりです：

    ```shell
    kubectl get ddc
    NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
    test-disaggregated-cluster   green           Ready     2         2                  2
    ```
## ステップ 4: リモートストレージバックエンドの作成
クラスタが正常に開始された後、SQLを使用して利用可能なオブジェクトストレージを永続ストレージバックエンド（Dorisではvaultと呼ばれます）として設定します。

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
"-internal" サフィックスが付いていないServiceは外部アクセス用です。

2. MySQLクライアントを使用した接続
    Kubernetesクラスター内で、MySQLクライアントを含むPodを作成し、そのPodに入ります：

    ```shell
    kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
    ```
Pod内では、Service名を使用してDorisクラスターに直接接続します：

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
   デフォルトStorage Vaultを設定します。

   ```mysql
   SET {vaultName} AS DEFAULT STORAGE VAULT;
   ```
ここで、{vaultName}は使用したいVaultの名前です。例えば、上記の例で作成したs3_vaultなどです。
