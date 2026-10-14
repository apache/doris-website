---
{
    "title": "MetaService の設定",
    "language": "ja",
    "description": "FoundationDB へのアクセス設定、イメージ設定、リソース設定、起動パラメータ設定、サービスのプローブのタイムアウト設定など、メタデータ管理コンポーネント MetaService の設定について詳しく説明します。",
    "keywords": ["Doris", "ストレージとコンピュートの分離", "Kubernetes", "MetaService", "FoundationDB", "メタデータ", "設定"]
}
---

## この章で学ぶこと

- MetaService が FoundationDB にアクセスするための接続情報を設定する
- MetaService のイメージのバージョンをカスタマイズする
- MetaService に適切なコンピューティングリソースを割り当てる
- ConfigMap を使って MetaService の起動パラメータをカスタマイズする
- MetaService のライブネスプローブのタイムアウトと起動タイムアウトを設定する

## 概要

MetaService は、Doris のストレージとコンピュートを分離したクラスターでメタデータを管理するコンポーネントです。クラスター内部でのみ使用され、外部には公開されません。ステートレスなサービスで、通常はアクティブ・スタンバイ構成でデプロイされます。この章では、`DorisDisaggregatedCluster` リソースで MetaService を設定する方法を説明します。

設定項目の一覧を次に示します。

| 設定する内容 | 設定フィールド | 必須かどうか | 適用する場面 |
|----------|----------|----------|----------|
| FoundationDB への接続 | `fdb.configMapNamespaceName` または `fdb.address` | 必須 | すべての場合 |
| イメージのカスタマイズ | `image` | 任意 | デプロイ例のイメージのバージョンが要件に合わない場合 |
| コンピューティングリソースの割り当て | `requests` / `limits` | 任意 | CPU とメモリの使用量を制限する場合 |
| 起動パラメータのカスタマイズ | `configMaps` | 任意 | デフォルトの起動パラメータを変更する場合 |
| ライブネスプローブのタイムアウト | `liveTimeout` | 任意 | デフォルトの 180 秒が要件に合わない場合 |
| 起動タイムアウト | `startTimeout` | 任意 | デフォルトの 300 秒が要件に合わない場合 |

## 1. FoundationDB への接続

MetaService はメタデータの保存に FoundationDB を使用するため、FoundationDB へのアクセス情報を設定する必要があります。FoundationDB のデプロイ方法に応じて、次の二つの設定方法があります。

| FoundationDB のデプロイ方法 | 推奨される設定方法 | 設定フィールド |
|----------------------|--------------|----------|
| `fdb-kubernetes-operator` を使って Kubernetes にデプロイ | Operator が自動生成した ConfigMap を参照する | `fdb.configMapNamespaceName` |
| 物理マシンに直接デプロイ | アクセス先のアドレスを直接指定する | `fdb.address` |

### 方法 1: ConfigMap を使ってアクセス情報を設定する

FoundationDB クラスターを `fdb-kubernetes-operator` でデプロイした場合は、Operator が自動生成する ConfigMap をそのまま使用できます。この ConfigMap には FoundationDB へのアクセス先アドレスが含まれています。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}
        namespace: ${namespace}
```

パラメータの説明:

- `${foundationdbConfigMapName}`: ConfigMap の名前
- `${namespace}`: FoundationDB がデプロイされている名前空間

`fdb-kubernetes-operator` が生成した ConfigMap の探し方については、FoundationDB のデプロイに関する章の [FoundationDB のアクセス情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

### 方法 2: アクセス先アドレスを直接設定する

FoundationDB を物理マシンにデプロイした場合は、MetaService の設定でアクセス先アドレスを直接指定できます。

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

パラメータの説明:

- `${fdbEndpoint}`: FoundationDB へのアクセスに使用するアドレス

物理マシンへのデプロイでこのアドレスを確認する方法については、ストレージとコンピュートの分離に関する章の [MetaService のデプロイに必要な `fdb_cluster` の取得方法](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

## 2. イメージのカスタマイズ

デプロイ例で MetaService に設定されているイメージは、最新バージョンではない場合があります。イメージのバージョンを指定するには、次の形式を使用します。

```yaml
spec:
  metaService:
    image: ${msImage}
```

パラメータの説明:

- `${msImage}`: デプロイする MetaService のイメージ。Doris 公式の [MetaService イメージ](https://hub.docker.com/r/apache/doris)を使用してください（イメージタグには `ms` プレフィックスが含まれます）。

## 3. コンピューティングリソースの割り当て

Kubernetes のリソース制限を使って、MetaService に適切な CPU とメモリを割り当てます。たとえば、次の設定では MetaService の CPU を 4 コア、メモリを 4Gi に制限します。

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

## 4. 起動設定のカスタマイズ

デフォルトの起動パラメータが要件に合わない場合は、ConfigMap を使ってカスタムの起動設定ファイルをマウントできます。Doris-Operator では、各コンポーネントの起動設定ファイルを ConfigMap でマウントすることでカスタマイズします。

全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `doris_cloud.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントする |
| 結果 | MetaService がカスタム設定で起動する |

:::tip ヒント
Doris-Operator は、MetaService の起動設定に FoundationDB 関連の設定を自動的に追加します。そのため、起動設定をカスタマイズする際に `fdb_cluster` を設定する必要はなく、設定しないでください。
:::

### ステップ 1: カスタム ConfigMap を作成する

起動設定ファイルの名前は `doris_cloud.conf` にする必要があります。次に例を示します。

```yaml
apiVersion: v1
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

### ステップ 2: カスタムの起動設定をマウントする

`DorisDisaggregatedCluster` リソースで、`metaService.configMaps` を使って上記の ConfigMap をマウントします。

```yaml
spec:
  metaService:
    configMaps:
    - name: ${msConfigMapName}
      mountPath: /etc/doris
```

パラメータの説明:

- `${msConfigMapName}`: MetaService の起動設定を含む ConfigMap の名前
- `mountPath`: マウント先は `/etc/doris` にする必要があります

上記の設定を、デプロイする [DorisDisaggregatedCluster リソース](./install-doris-cluster.md#2-modify-key-configurations)に適用してください。

## 5. サービスのプローブのタイムアウト設定

Doris Operator は、ストレージとコンピュートを分離したクラスターのサービス向けに、次の二つのタイムアウトパラメータを提供します。

| プローブの種類 | 設定フィールド | デフォルト値 | 段階 | 発動条件 |
|----------|----------|--------|----------|----------|
| ライブネスプローブ（LivenessProbe） | `liveTimeout` | 180 秒 | サービスの稼働中 | プローブの失敗がしきい値を超えると、サービスが強制的に再起動される |
| 起動タイムアウト | `startTimeout` | 300 秒 | サービスの起動中 | 起動にかかる時間がしきい値を超えると、サービスが強制的に再起動される |

### ライブネスプローブのタイムアウト設定

ライブネスプローブはサービスの稼働状態を監視します。たとえば、ライブネスプローブのタイムアウトを 30 秒に設定するには、次のようにします。

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### 起動タイムアウトの設定

起動タイムアウトは、サービスの起動に時間がかかりすぎる場合に使用します。たとえば、起動タイムアウトを 120 秒に設定するには、次のようにします。

```yaml
spec:
  metaService:
    startTimeout: 120
```
