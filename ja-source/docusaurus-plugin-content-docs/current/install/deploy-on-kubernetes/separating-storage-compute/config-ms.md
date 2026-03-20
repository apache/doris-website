---
{
  "title": "Config MetaService",
  "language": "ja",
  "description": "MetaServiceは、Dorisの分離型ストレージ・コンピュートクラスターのメタデータ管理コンポーネントです。"
}
---
MetaServiceは、Dorisの分離されたストレージと計算クラスターのメタデータ管理コンポーネントです。外部に公開されることはなく、内部目的でのみ使用されます。MetaServiceはステートレスサービスであり、通常はプライマリ・セカンダリ構成でデプロイされます。以下のドキュメントでは、`DorisDisaggregatedCluster`リソース内でMetaServiceを設定する方法について説明します。
## FoundationDBアクセスの設定
FoundationDBアクセスを設定する方法は、デプロイメント環境によって異なります：
- ConfigMapを使用したFoundationDBアクセスの設定  
  FoundationDBクラスターがfdb-kubernetes-operatorでデプロイされている場合、アクセス可能なFoundationDBアドレスを含むオペレーターによって生成されたConfigMapを直接使用できます。例：

    ```yaml
    spec:
      metaService:
        fdb:
          configMapNamespaceName:
            name: ${foundationdbConfigMapName}
            namespace: ${namespace}
    ```
ここで、`${foundationdbConfigMapName}`はConfigMapの名前で、`${namespace}`はFoundationDBがデプロイされているnamespaceです。fdb-kubernetes-operatorによって生成されたConfigMapの特定に関する詳細については、[FoundationDBアクセス情報を含むConfigMapを取得する](./install-fdb.md#retrieve-the-configmap-containing-foundationdb-access-information)の「FoundationDBのデプロイ」セクションを参照してください。

- FoundationDBアクセスアドレスの直接設定  
  FoundationDBが物理マシンに直接デプロイされている場合、MetaServiceの設定でアクセスアドレスを指定できます：

    ```yaml
    spec:
      metaService:
        fdb:
          address: ${fdbEndpoint}
    ```
ここで、`${fdbEndpoint}`はFoundationDBのアクセス可能なアドレス情報を表します。物理マシンでのデプロイメントについては、[fdb_cluster詳細を取得するためのMetaServiceデプロイメント](../../../compute-storage-decoupled/compilation-and-deployment.md#31-configuration)のセクションを参照してください。

## Imageの設定
デプロイメントサンプルでは、MetaService imageが最新バージョンでない場合があります。imageをカスタマイズする際は、以下のように設定してください：

```yaml
spec:
  metaService:
    image: ${msImage}
```
ここで、`${msImage}` は MetaService にデプロイしたいイメージです。Doris が提供する公式の [MetaService image](https://hub.docker.com/r/apache/doris) を使用することを推奨します（イメージタグには "ms" というプレフィックスを含める必要があります）。

## リソースの設定
Kubernetes のリソース制限を使用して、MetaService に適切なコンピューティングリソースを割り当てることができます。例えば、MetaService を 4 CPU コアと 4Gi のメモリに制限するには、以下のように設定します：

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
対応する[DorisDisaggregatedCluster resource](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster)でこの設定を更新してください。

## 起動設定のカスタマイズ
Doris-OperatorはConfigMapを使用して、コンポーネントの起動設定ファイルをマウントします。operatorは自動的にMetaServiceの起動設定に関連するFoundationDB情報を設定するため、設定をカスタマイズする際にこれらの詳細を含める必要はありません。
1. カスタムConfigMapの作成
   起動設定を含むConfigMapを作成します。起動設定ファイルはdoris_cloud.confという名前である必要があります。例：

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
2. カスタム起動設定をマウントする
   DorisDisaggregatedClusterリソースで、以下のように`metaService.configMaps`を介してConfigMapをマウントします：

    ```yaml
    spec:
      metaService:
        configMaps:
        - name: ${msConfigMapName}
          mountPath: /etc/doris
    ```
ここで、`${msConfigMapName}` は MetaService 起動設定を含む ConfigMap の名前です。デプロイ予定の [DorisDisaggregatedCluster リソース](./install-doris-cluster.md#step-3-deploy-the-compute-storage-decoupled-cluster) でこの設定を更新してください。マウントパスは `/etc/doris` である必要があります。

:::tip Tip
Kubernetes デプロイメントで MetaService 起動設定をカスタマイズする際は、fdb_cluster 設定を含めないでください。Doris Operator が自動的に処理します。
:::

## Service Probe タイムアウトの設定
Doris Operator は、ストレージとコンピュート分離サービス用に2つのタイムアウトパラメータを提供します：liveness probe タイムアウトと startup タイムアウトです。

### Liveness Probe タイムアウト設定
liveness probe はサービスの動作状況を監視します。指定された閾値を超えてプローブが失敗した場合、サービスは強制的に再起動されます。デフォルトのタイムアウトは180秒です。30秒に設定するには、以下の設定を使用してください：

```yaml
spec:
  metaService:
    liveTimeout: 30
```
### Startup Timeout設定
startup timeoutは、サービスの開始に時間がかかりすぎるシナリオに対処します。サービスの起動時間が指定された閾値を超える場合、サービスは強制的に再起動されます。デフォルトのstartup timeoutは300秒です。120秒に設定するには、以下の設定を使用してください：

```yaml
spec:
  metaService:
    startTimeout: 120
```
