---
{
    "title": "MetaService の設定",
    "language": "ja",
    "description": "メタデータ管理コンポーネント MetaService の設定方法を詳しく説明します。FoundationDB へのアクセス、イメージ、リソース、起動パラメーター、サービスのプローブのタイムアウトを扱います。",
    "keywords": ["Doris", "Storage-Compute Decoupled", "Kubernetes", "MetaService", "FoundationDB", "Metadata", "Configuration"]
}
---

FDB へのアクセスを設定する前に、MetaService のビルドに、FDB サーバーの系列と互換性のあるクライアントが含まれていることを確認してください。Operator クライアントをインストールしても、MetaService は更新されません。バージョンを固定したインストール方法と互換性に関する選択肢については、[FoundationDB のデプロイ](install-fdb.md)を参照してください。個々の Doris クラスターを削除する際は、共有 FDB を残してください。

## この章で学ぶこと {#what-you-will-learn-in-this-chapter}

- MetaService が FoundationDB にアクセスするための接続情報を設定する
- MetaService のイメージのバージョンを変更する
- MetaService に適切なコンピュートリソースを割り当てる
- ConfigMap を使って MetaService の起動パラメーターを変更する
- MetaService の存活プローブのタイムアウトと起動タイムアウトを設定する

## 概要 {#overview}

MetaService は、Doris のストレージ・コンピュート分離型クラスターにおけるメタデータ管理コンポーネントです。クラスター内部でのみ使用され、外部には公開されません。ステートレスなサービスで、通常はアクティブ・スタンバイ構成でデプロイされます。この章では、`DorisDisaggregatedCluster` リソースで MetaService を設定する方法を説明します。

設定項目の一覧を以下に示します。

| 設定する内容 | 設定フィールド | 必須かどうか | 適用する場合 |
|----------|----------|----------|----------|
| FoundationDB への接続 | `fdb.configMapNamespaceName` または `fdb.address` | 必須 | すべての場合 |
| イメージの変更 | `image` | 任意 | デプロイ例のイメージのバージョンが要件に合わない場合 |
| コンピュートリソースの割り当て | `requests` / `limits` | 任意 | CPU とメモリの使用量を制限する場合 |
| 起動パラメーターの変更 | `configMaps` | 任意 | デフォルトの起動パラメーターを変更する場合 |
| 存活プローブのタイムアウト | `liveTimeout` | 任意 | デフォルトの 180 秒が要件に合わない場合 |
| 起動タイムアウト | `startTimeout` | 任意 | デフォルトの 300 秒が要件に合わない場合 |

## 1. FoundationDB に接続する {#1-connect-to-foundationdb}

MetaService はメタデータの保存に FoundationDB を使用するため、FoundationDB へのアクセス情報を設定する必要があります。FoundationDB のデプロイ方法に応じて、設定方法は二通りあります。

| FoundationDB のデプロイ方法 | 推奨される設定方法 | 設定フィールド |
|----------------------|--------------|----------|
| `fdb-kubernetes-operator` を使って Kubernetes 上にデプロイ | Operator が自動生成する ConfigMap を参照する | `fdb.configMapNamespaceName` |
| 物理マシンに直接デプロイ | アクセス先アドレスを直接指定する | `fdb.address` |

### 方法 1: ConfigMap を使ってアクセス情報を設定する {#method-1-configure-access-information-through-a-configmap}

FoundationDB クラスターを `fdb-kubernetes-operator` でデプロイした場合は、Operator が自動生成する、FoundationDB のアクセス先アドレスを含む ConfigMap をそのまま使用できます。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}
        namespace: ${namespace}
```

パラメーターの説明:

- `${foundationdbConfigMapName}`: ConfigMap の名前
- `${namespace}`: FoundationDB をデプロイした namespace

`fdb-kubernetes-operator` が生成した ConfigMap の探し方については、FoundationDB のデプロイに関する章の[FoundationDB のアクセス情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

### 方法 2: アクセス先アドレスを直接設定する {#method-2-configure-the-access-address-directly}

FoundationDB を物理マシンにデプロイした場合は、MetaService の設定でアクセス先アドレスを直接指定できます。

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

パラメーターの説明:

- `${fdbEndpoint}`: FoundationDB へのアクセスに使用するアドレス

物理マシンにデプロイした場合のアドレスの探し方については、ストレージ・コンピュート分離に関する章の[MetaService のデプロイに使用する `fdb_cluster` の取得方法](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

## 2. イメージを変更する {#2-customize-the-image}

デプロイ例で MetaService に設定されているイメージは、最新版ではない可能性があります。イメージのバージョンを指定するには、次の形式を使用します。

```yaml
spec:
  metaService:
    image: ${msImage}
```

パラメーターの説明:

- `${msImage}`: デプロイする MetaService のイメージ。Doris 公式の[MetaService イメージ](https://hub.docker.com/r/apache/doris)を使用してください。イメージのタグには `ms` プレフィックスが含まれます。

## 3. コンピュートリソースを割り当てる {#3-allocate-compute-resources}

Kubernetes のリソース制限を使って、MetaService に適切な CPU とメモリを割り当てます。たとえば、次の設定では MetaService を 4 CPU コア、4Gi のメモリに制限します。

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

上記の設定を、[デプロイする DorisDisaggregatedCluster リソース](./install-doris-cluster.md#2-modify-key-configurations)に適用してください。

## 4. 起動設定を変更する {#4-customize-startup-configuration}

デフォルトの起動パラメーターが要件に合わない場合は、ConfigMap を使ってカスタムの起動設定ファイルをマウントできます。Doris-Operator は、各コンポーネントの起動設定ファイルを ConfigMap からマウントすることで、設定の変更を実現します。

全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `doris_cloud.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントする |
| 出力 | MetaService がカスタム設定を使用して起動する |

:::tip ヒント
Doris-Operator は、MetaService の起動設定に FoundationDB 関連の設定を自動的に追加します。そのため、起動設定を変更する際に `fdb_cluster` を設定する必要はなく、設定しないでください。
:::

### ステップ 1: カスタム ConfigMap を作成する {#step-1-create-a-custom-configmap}

起動設定ファイルの名前は `doris_cloud.conf` にする必要があります。以下に例を示します。

```yaml
apiVersion: v1
data:
  doris_cloud.conf: |
    # // meta_service
    brpc_listen_port = 5000
    brpc_num_threads = -1
    brpc_idle_timeout_sec = 30
    http_token = <custom-http-token>

    # // doris txn config
    label_keep_max_second = 259200
    expired_txn_scan_key_nums = 1000

    # // logging
    log_dir = ./log/
    # info warn error
    log_level = info
    log_size_mb = 1024
    log_filenum_quota = 10
    log_immediate_flush = false
    # log_verbose_modules = *

    # //max stage num
    max_num_stages = 40
kind: ConfigMap
metadata:
  name: doris-metaservice
  namespace: default
```

### ステップ 2: カスタムの起動設定をマウントする {#step-2-mount-the-custom-startup-configuration}

`DorisDisaggregatedCluster` リソースで、`metaService.configMaps` を使って上記の ConfigMap をマウントします。

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

パラメーターの説明:

- `${msConfigMapName}`: MetaService の起動設定を含む ConfigMap の名前
- `mountPath`: マウント先は `/etc/doris` にする必要があります

上記の設定を、デプロイする[DorisDisaggregatedCluster リソース](./install-doris-cluster.md#2-modify-key-configurations)に適用してください。

### 管理 HTTP トークンを変更する {#ms-http-token}

`http_token` は、MetaService の管理 HTTP API リクエストの認証に使用されます。デフォルト値は `greedisgood9999` です。例の `<custom-http-token>` を独自の値に置き換え、`doris_cloud.conf` のその他の設定は維持してください。ファイルを ConfigMap の `doris_cloud.conf` キーに格納し、上記のように `spec.metaService.configMaps` からその ConfigMap を参照します。

すべての MetaService レプリカに同じトークンを設定し、起動設定を読み込ませるために再起動してください。API クライアントは、その値を `token` クエリパラメーターで渡す必要があります。Doris Operator も、管理 HTTP リクエストに使用する `http_token` を、参照先の MS ConfigMap から読み取ります。Pod 内のファイルだけを変更すると、Operator の設定との間に不整合が生じます。

FE と BE のメタデータ RPC では、この管理 HTTP トークンを設定する必要はありません。`spec.authSecret` の SQL 管理用認証情報は、`http_token` とは別のものです。

## 5. サービスのプローブのタイムアウトを設定する {#5-configure-service-probe-timeouts}

Doris Operator では、ストレージ・コンピュート分離型クラスターのサービスに対して、次の二種類のタイムアウトパラメーターを設定できます。

| プローブの種類 | 設定フィールド | デフォルト値 | 適用される段階 | 再起動の条件 |
|----------|----------|--------|----------|----------|
| 存活プローブ（LivenessProbe） | `liveTimeout` | 180 秒 | サービスの稼働中 | プローブの失敗がしきい値を超えて続くと、サービスが強制的に再起動される |
| 起動タイムアウト | `startTimeout` | 300 秒 | サービスの起動中 | 起動時間がしきい値を超えると、サービスが強制的に再起動される |

### 存活プローブのタイムアウト設定 {#liveness-probe-timeout-configuration}

存活プローブは、サービスの稼働状態を監視します。たとえば、存活プローブのタイムアウトを 30 秒に設定するには、次のようにします。

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### 起動タイムアウトの設定 {#startup-timeout-configuration}

起動タイムアウトは、サービスの起動に時間がかかりすぎる場合に使用します。たとえば、起動タイムアウトを 120 秒に設定するには、次のようにします。

```yaml
spec:
  metaService:
    startTimeout: 120
```
