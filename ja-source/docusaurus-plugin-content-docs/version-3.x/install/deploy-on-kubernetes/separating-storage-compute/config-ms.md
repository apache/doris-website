---
{
  "title": "Config MetaService",
  "language": "ja",
  "description": "MetaServiceは、Dorisの分離型ストレージ・コンピュートクラスターのメタデータ管理コンポーネントです。"
}
---
MetaServiceは、Dorisの分離されたストレージとコンピュートクラスターのメタデータ管理コンポーネントです。これは外部に公開されず、内部目的でのみ使用されます。MetaServiceはステートレスなサービスで、通常はプライマリ・セカンダリ構成でデプロイされます。以下のドキュメントでは、`DorisDisaggregatedCluster`リソース内でMetaServiceを設定する方法について説明します。
## FoundationDBアクセスの設定
FoundationDBアクセスを設定する方法は、デプロイ環境によって異なります。
- ConfigMapを使用したFoundationDBアクセスの設定  
    FoundationDBクラスターがfdb-kubernetes-operatorでデプロイされている場合、アクセス可能なFoundationDBアドレスを含む、operatorによって生成されたConfigMapを直接使用できます。例：

    ```yaml
    spec:
      metaService:
        fdb:
          configMapNamespaceName:
            name: ${foundationdbConfigMapName}
            namespace: ${namespace}
    ```
ここで、`${foundationdbConfigMapName}` は ConfigMap の名前で、`${namespace}` は FoundationDB がデプロイされている namespace です。fdb-kubernetes-operator によって生成された ConfigMap の場所を特定する詳細については、[FoundationDB のアクセス情報を含む ConfigMap を取得する](./install-fdb.md#retrieve-the-configmap-containing-foundationdb-access-information) の「FoundationDB のデプロイ」セクションを参照してください。

- FoundationDB のアクセスアドレスを直接設定する  
    FoundationDB が物理マシン上に直接デプロイされている場合、MetaService の設定でアクセスアドレスを指定できます：

    ```yaml
    spec:
      metaService:
        fdb:
          address: ${fdbEndpoint}
    ```
ここで、`${fdbEndpoint}`はFoundationDBのアクセス可能なアドレス情報を表します。物理マシンでのデプロイメントについては、[fdb_clusterの詳細を取得するためのMetaServiceデプロイメント](../../../compute-storage-decoupled/compilation-and-deployment.md#31-configuration)のセクションを参照してください。

## イメージの設定
デプロイメントサンプルでは、MetaServiceイメージが最新バージョンではない可能性があります。イメージをカスタマイズする際は、以下のように設定してください：

```yaml
spec:
  metaService:
    image: ${msImage}
```
ここで、`${msImage}` はMetaService用にデプロイしたいイメージです。Dorisが提供する公式の[MetaServiceイメージ](https://hub.docker.com/r/apache/doris)を使用することを推奨します（イメージタグには「ms」のプレフィックスを含める必要があります）。

## リソースの設定
Kubernetesリソース制限を使用して、MetaServiceに適切なコンピューティングリソースを割り当てることができます。例えば、MetaServiceを4 CPUコアと4Giのメモリに制限するには、以下のように設定します：

```yaml
spec:
  metaService:
    requests:
      cpu: 4
      memory: 4Gi
    limits:
      cpu: 4
      memory: 4Gi
```
対応する [DorisDisaggregatedCluster resource](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster) でこの設定を更新してください。

## 起動設定のカスタマイズ
Doris-Operator は ConfigMap を使用してコンポーネント用の起動設定ファイルをマウントします。オペレータは自動的に MetaService 起動設定に関連する FoundationDB 情報を投入するため、設定をカスタマイズする際にこれらの詳細を含める必要はありません。
1. カスタム ConfigMap を作成
    起動設定を含む ConfigMap を作成します。起動設定ファイルは doris_cloud.conf という名前にする必要があります。例：

    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: doris-metaservice
      namespace: default
    data:
      doris_cloud.conf: |
        # // meta_service
        brpc_listen_port = 5000
        brpc_num_threads = -1
        brpc_idle_timeout_sec = 30
        http_token = greedisgood9999

        # // doris txn config
        label_keep_max_second = 259200
        expired_txn_scan_key_nums = 1000

        # // logging
        log_dir = ./log/
        # info, warn, error
        log_level = info
        log_size_mb = 1024
        log_filenum_quota = 10
        log_immediate_flush = false
        # log_verbose_modules = *

        # // max stage num
        max_num_stages = 40
    ```
2. カスタムスタートアップ設定をマウントする
    DorisDisaggregatedClusterリソースで、以下のように`metaService.configMaps`を介してConfigMapをマウントします：

    ```yaml
    spec:
      metaService:
        configMaps:
        - name: ${msConfigMapName}
          mountPath: /etc/doris
    ```
ここで、`${msConfigMapName}` は MetaService 起動設定を含む ConfigMap の名前です。デプロイする予定の [DorisDisaggregatedCluster リソース](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster) でこの設定を更新してください。マウントパスは `/etc/doris` である必要があります。

:::tip Tip
Kubernetes デプロイメントで MetaService 起動設定をカスタマイズする際は、fdb_cluster 設定を含めないでください。Doris Operator が自動的に処理します。
:::

## Service Probe タイムアウトの設定
Doris Operator は、分離されたストレージとコンピュートサービス向けに2つのタイムアウトパラメータを提供します：liveness probe タイムアウトと起動タイムアウトです。

### Liveness Probe タイムアウト設定
liveness probe はサービスの運用状況を監視します。指定された閾値を超えて probe が失敗した場合、サービスは強制的に再起動されます。デフォルトのタイムアウトは180秒です。30秒に設定するには、以下の設定を使用してください：

```yaml
spec:
  metaService:
    liveTimeout: 30
```
### Startup Timeout設定
startup timeoutは、サービスの起動に時間がかかりすぎるシナリオに対処します。サービスの起動時間が指定された閾値を超えた場合、サービスは強制的に再起動されます。デフォルトのstartup timeoutは300秒です。120秒に設定するには、以下の設定を使用してください：

```yaml
spec:
  metaService:
    startTimeout: 120
```
