---
{
    "title": "MetaService の設定",
    "language": "ja",
    "description": "MetaService メタデータ管理コンポーネントの設定について、FoundationDB へのアクセス、イメージ、リソース、起動パラメータ、サービスのプローブタイムアウトを詳しく説明します。",
    "keywords": ["Doris", "Storage-Compute Decoupled", "Kubernetes", "MetaService", "FoundationDB", "Metadata", "Configuration"]
}
---

FDB へのアクセスを設定する前に、MetaService のビルドに含まれるクライアントが FDB サーバーの系列と互換性があることを確認してください。Operator クライアントをインストールしても、MetaService は更新されません。バージョンを固定したインストール方法と互換性に関する選択肢については、[FoundationDB のデプロイ](install-fdb.md)を参照してください。個別の Doris クラスターを削除する際は、共有 FDB を残してください。

## この章で学ぶこと {#what-you-will-learn-in-this-chapter}

- MetaService が FoundationDB にアクセスするための接続情報を設定する
- MetaService のイメージバージョンをカスタマイズする
- MetaService に適切な計算リソースを割り当てる
- ConfigMap を使用して MetaService の起動パラメータをカスタマイズする
- MetaService の稼働プローブのタイムアウトと起動タイムアウトを設定する

## 概要 {#overview}

MetaService は、Doris のストレージとコンピュートを分離したクラスターにおけるメタデータ管理コンポーネントです。クラスター内部でのみ使用され、外部には公開されません。ステートレスなサービスで、通常はアクティブ・スタンバイ構成でデプロイされます。この章では、`DorisDisaggregatedCluster` リソースで MetaService を設定する方法を説明します。

設定項目の一覧を次に示します。

| 設定する内容 | 設定フィールド | 必須かどうか | 適用する場面 |
|----------|----------|----------|----------|
| FoundationDB への接続 | `fdb.configMapNamespaceName` または `fdb.address` | 必須 | すべての場合 |
| イメージのカスタマイズ | `image` | 任意 | デプロイ例のイメージバージョンが要件に合わない場合 |
| 計算リソースの割り当て | `requests` / `limits` | 任意 | CPU とメモリの使用量を制限する場合 |
| 起動パラメータのカスタマイズ | `configMaps` | 任意 | デフォルトの起動パラメータを変更する場合 |
| 稼働プローブのタイムアウト | `liveTimeout` | 任意 | デフォルトの 180 秒が要件に合わない場合 |
| 起動タイムアウト | `startTimeout` | 任意 | デフォルトの 300 秒が要件に合わない場合 |

## 1. FoundationDB に接続する {#1-connect-to-foundationdb}

MetaService はメタデータの保存に FoundationDB を使用するため、FoundationDB へのアクセス情報を設定する必要があります。FoundationDB のデプロイ方法に応じて、次のいずれかの方法を使用します。

| FoundationDB のデプロイ方法 | 推奨される設定方法 | 設定フィールド |
|----------------------|--------------|----------|
| `fdb-kubernetes-operator` を使用して Kubernetes 上にデプロイ | Operator が自動生成した ConfigMap を参照する | `fdb.configMapNamespaceName` |
| 物理マシンに直接デプロイ | アクセス先アドレスを直接指定する | `fdb.address` |

### 方法 1: ConfigMap を使用してアクセス情報を設定する {#method-1-configure-access-information-through-a-configmap}

FoundationDB クラスターを `fdb-kubernetes-operator` でデプロイした場合は、Operator が自動生成した、FoundationDB のアクセス先アドレスを含む ConfigMap をそのまま使用できます。

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
- `${namespace}`: FoundationDB をデプロイした名前空間

`fdb-kubernetes-operator` が生成した ConfigMap を探す方法については、FoundationDB のデプロイに関する章の[FoundationDB のアクセス情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

### 方法 2: アクセス先アドレスを直接設定する {#method-2-configure-the-access-address-directly}

FoundationDB を物理マシンにデプロイした場合は、MetaService の設定でアクセス先アドレスを直接指定できます。

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}
```

パラメータの説明:

- `${fdbEndpoint}`: FoundationDB へのアクセスに使用するアドレス

物理マシンへのデプロイでこのアドレスを確認する方法については、ストレージとコンピュートの分離に関する章の[MetaService のデプロイに使用する `fdb_cluster` の取得方法](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

## 2. イメージをカスタマイズする {#2-customize-the-image}

デプロイ例で MetaService に設定されているイメージは、最新バージョンとは限りません。イメージバージョンを指定するには、次の形式を使用します。

```yaml
spec:
  metaService:
    image: ${msImage}
```

パラメータの説明:

- `${msImage}`: デプロイする MetaService イメージ。Doris 公式の [MetaService イメージ](https://hub.docker.com/r/apache/doris)を使用してください。イメージタグには `ms` プレフィックスが含まれます。

## 3. 計算リソースを割り当てる {#3-allocate-compute-resources}

Kubernetes のリソース制限を使用して、MetaService に適切な CPU とメモリを割り当てます。たとえば、次の設定では MetaService を CPU 4 コア、メモリ 4Gi に制限します。

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

## 4. 起動設定をカスタマイズする {#4-customize-startup-configuration}

デフォルトの起動パラメータが要件に合わない場合は、ConfigMap を使用してカスタムの起動設定ファイルをマウントできます。Doris-Operator は、各コンポーネントの起動設定ファイルを ConfigMap からマウントすることで、カスタマイズを実現します。

全体の流れは次のとおりです。

| 段階 | 説明 |
|------|------|
| 入力 | カスタムの `doris_cloud.conf` 設定ファイル |
| 操作 | ConfigMap を作成し、`/etc/doris` ディレクトリにマウントする |
| 結果 | MetaService がカスタム設定で起動する |

:::tip ヒント
Doris-Operator は、MetaService の起動設定に FoundationDB 関連の設定を自動的に追加します。そのため、起動設定をカスタマイズする際に `fdb_cluster` を設定する必要はなく、設定しないでください。
:::

### ステップ 1: カスタム ConfigMap を作成する {#step-1-create-a-custom-configmap}

起動設定ファイルの名前は `doris_cloud.conf` にする必要があります。次に例を示します。

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

`DorisDisaggregatedCluster` リソースで、`metaService.configMaps` を使用して上記の ConfigMap をマウントします。

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

### 管理用 HTTP トークンをカスタマイズする {#ms-http-token}

`http_token` は、MetaService の管理用 HTTP API リクエストの認証に使用されます。デフォルト値は `greedisgood9999` です。例の `<custom-http-token>` を、任意のランダムな文字列に置き換えてください。`doris_cloud.conf` を同名の ConfigMap キーに格納し、上記のとおり `spec.metaService.configMaps` を使用してその ConfigMap を参照してください。

API クライアントは、`token` クエリパラメータでトークンを渡します。Doris Operator は、管理用 HTTP リクエストに使用する `http_token` を参照先の ConfigMap から読み取ります。そのため、Operator と MetaService の設定が一致するように ConfigMap を更新してください。FE と BE のメタデータ RPC では、このトークンを使用しません。Doris 4.1.5 など、FE SQL を使用してノードを登録するイメージでは、このトークンを変更しても FE や BE の変更や再起動は不要です。[`spec.authSecret` に設定する Doris 管理アカウントの認証情報](config-cluster.md)は、`http_token` とは独立しています。

デプロイ後にトークンをローテーションするには、次の手順を実行します。

1. 参照先の ConfigMap にある `doris_cloud.conf` 内の `http_token` を更新し、ほかの設定は保持します。すべての MetaService レプリカで同じ新しいトークンを使用してください。
2. MetaService Pod を一つずつ再起動し、各 Pod が Ready になってから次に進みます。単一レプリカ構成では、再起動中に MetaService が一時的に利用できなくなります。
3. トークン認証が必要な読み取り専用の管理用 HTTP API を使用して、各 MetaService レプリカで新しいトークンを検証します。Pod が Ready になっただけでは、トークンが変更されたことを確認できません。
4. これらの API を呼び出す運用ツールを更新します。

MetaService は起動時に `http_token` を読み込みます。ConfigMap を更新するだけでは、実行中のプロセスで使用するトークンは変わらず、自動的に再起動する保証もありません。ローテーション中は、レプリカ間で一時的に異なるトークンが使用され、管理用 HTTP リクエストの認証に失敗する可能性があります。この間は、これらの API に依存するノード管理操作を避けてください。

## 5. サービスのプローブタイムアウトを設定する {#5-configure-service-probe-timeouts}

Doris Operator は、ストレージとコンピュートを分離したクラスターのサービスに対して、次のタイムアウトパラメータを提供します。

| プローブの種類 | 設定フィールド | デフォルト値 | 適用される段階 | 発動条件 |
|----------|----------|--------|----------|----------|
| 稼働プローブ（LivenessProbe） | `liveTimeout` | 180 秒 | サービスの実行中 | プローブの失敗がしきい値を超えて続くと、サービスが強制的に再起動される |
| 起動タイムアウト | `startTimeout` | 300 秒 | サービスの起動中 | 起動時間がしきい値を超えると、サービスが強制的に再起動される |

### 稼働プローブのタイムアウトを設定する {#liveness-probe-timeout-configuration}

稼働プローブは、サービスの実行状態を監視します。たとえば、稼働プローブのタイムアウトを 30 秒に設定するには、次のように指定します。

```yaml
spec:
  metaService:
    liveTimeout: 30
```

### 起動タイムアウトを設定する {#startup-timeout-configuration}

起動タイムアウトは、サービスの起動に時間がかかりすぎる場合に使用します。たとえば、起動タイムアウトを 120 秒に設定するには、次のように指定します。

```yaml
spec:
  metaService:
    startTimeout: 120
```
