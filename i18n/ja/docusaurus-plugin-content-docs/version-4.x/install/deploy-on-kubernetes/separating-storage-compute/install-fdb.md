---
{
    "title": "FoundationDB のデプロイ",
    "language": "ja",
    "description": "Kubernetes にバージョンを固定した FoundationDB Operator とデータベースをインストールし、ミラーリングしたイメージ、リソース計画、クライアントの互換性、稼働確認を扱います。",
    "keywords": [
        "Doris",
        "Kubernetes",
        "FoundationDB",
        "fdb-kubernetes-operator",
        "resources",
        "VeloDB"
    ]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview)（FDB）は、強い一貫性を提供する分散データベースです。Doris はコンピュートとストレージを分離したモードで、メタデータの保存に FoundationDB を使用します。

Doris をデプロイする前に、FoundationDB サービスを準備してください。環境に応じてデプロイ方法を選びます。

- マシンに直接デプロイする場合は、[手動デプロイガイド](../../deploy-manually/separating-storage-compute-deploy-manually.md)に従ってください。デプロイ後、MetaService から FoundationDB にアクセスできることを確認します。
- Kubernetes に fdb-kubernetes-operator を使用してデプロイする場合は、以下の手順に従ってください。

## はじめる前に {#before-you-start}

Kubernetes に FoundationDB をデプロイするには、以下を準備します。

- CRD、RBAC リソース、ワークロードを作成する権限を持つ Kubernetes アカウント。
- 書き込み可能な SSD を使用する StorageClass と、以下に示すリソースを確保できるノード。
- 正常に機能するクラスタ DNS と、MetaService から FDB Pod へのネットワーク接続。

この例では FDB 7.3.69 を使用するため、MetaService には互換性のある 7.3 クライアントライブラリが必要です。使用中の Doris バージョンが 7.1 クライアントを使用する場合は、[FDB 7.1 の手順](#fdb-71)に従ってください。Operator のクライアントはコントローラーが使用するものであり、MetaService のクライアントライブラリは更新しません。

:::tip
このガイドでは FDB の新規インストールについて説明します。FDB Operator がすでにインストールされている場合は、同じ namespace を複数のコントローラーが管理しないよう、既存の Operator を再利用できるか確認してください。CRD はクラスタ全体に適用されるため、更新前に既存の FDB クラスタとの互換性を確認してください。既存クラスタのアップグレードは別途計画してください。
:::

## バージョンとイメージの入手元 {#versions-and-image-sources}

このガイドでは、[VeloDB FDB Operator が提供するデプロイ例](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/samples/velodb)を使用します。CRD は Operator v2.35.0 に対応する[VeloDB FDB Operator リポジトリの branch-2.35.0](https://github.com/velodb/fdb-kubernetes-operator/tree/branch-2.35.0/config/crd/bases)からダウンロードします。互換性とデプロイ設定の変更については、[サンプルガイド](https://github.com/velodb/fdb-kubernetes-operator/blob/branch-2.35.0/config/samples/velodb/README.md)を参照してください。以下のイメージを使用します。

| コンポーネント | バージョン | VeloDB イメージ |
| --- | --- | --- |
| FDB Operator / 対応する CRD | v2.35.0 | `velodb/fdb-kubernetes-operator:v2.35.0` |
| コントローラーのクライアント初期化コンテナー / FDB データベース | 7.3.69 | `velodb/fdb-kubernetes-monitor:7.3.69` |

これらのイメージは linux/amd64 と linux/arm64 に対応しています。例では `imageType: unified` を使用するため、FDB のメインコンテナーと sidecar は Monitor イメージを共有します。コントローラーもクライアントの初期化にこのイメージを使用します。

このガイドで示す CRD、Operator、クラスタの例は組み合わせて使用してください。`config/samples/` 直下の汎用的な例と Helm チャートは別のインストール方法です。これらのコントローラー、クライアント、データベースの設定を、このガイドのバージョンを指定した構成と混在させないでください。

## リソース計画 {#resource-planning}

FDB Operator と FDB クラスタの両方に必要なリソースを計画してください。Operator のリソース要求量と上限はどちらも **500m CPU / 256Mi**、クライアント初期化コンテナーの要求量と上限はどちらも **10m CPU / 50Mi** です。

VeloDB FDB Operator リポジトリには、単一レプリカと二重レプリカのクラスタ例があります。用途に応じて選んでください。

| 設定 | 単一レプリカ（開発用） | 二重レプリカ |
| --- | --- | --- |
| storage / log / stateless Pod | 1 / 1 / 2 | 3 / 4 / 9 |
| Pod ごとのメインコンテナーの要求量 | 1 CPU / 1Gi | 1 CPU / 8Gi |
| Pod ごとのメインコンテナーの上限 | 1 CPU / 2Gi | 2 CPU / 8Gi |
| Pod ごとの sidecar の要求量 = 上限 | 100m CPU / 256Mi | 100m CPU / 256Mi |
| storage / log Pod ごとの PVC | 10Gi / 10Gi | 200Gi / 100Gi |
| Pod / PVC の総数 | 4 / 2 | 16 / 7 |
| sidecar を含む要求量の合計 | **4.4 CPU / 5Gi** | **17.6 CPU / 132Gi** |
| 要求する PVC 容量の合計 | 20Gi | 1000Gi |

合計には sidecar を含み、Operator、MS/FE/BE、Kubernetes のオーバーヘッドは含みません。Stateless Pod には永続データ用の PVC は不要です。ローリング置換に備えて、Pod とストレージの容量に余裕を持たせてください。

単一レプリカの例は、小規模な機能テスト向けです。メモリ設定を抑えているため、ワークロードに応じてメモリとキャッシュの設定を確認し、OOM エラーを監視してください。アップストリームでは、メインコンテナーのデフォルトは 1 CPU / 8Gi で、要求量と上限は同じです。[リソース要件](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/warnings.md#resource-requirements)を参照してください。

二重レプリカのクラスタには、独立したホスト障害ドメインが少なくとも三つ必要です。デプロイ後、storage、log、coordinator の各プロセスがノード間に適切に分散していることを確認してください。例では優先度付きのアンチアフィニティを使用しているため、同じ役割の複数の Pod を一つのノードに配置できます。各役割の Pod を一つのノードにつき一つに制限する場合、九つの stateless Pod のために、スケジュール可能なノードが少なくとも九つ必要です。[障害ドメインの設定](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/v2.35.0/docs/manual/fault_domains.md)を参照してください。

本番環境では SSD ストレージを使用し、メタデータのサイズ、書き込み負荷、復旧に必要な空き容量に応じてリソースを調整してください。この例では、storage Pod ごとに 200Gi、log Pod ごとに 100Gi を割り当てています。必要に応じて変更してください。複数の Doris クラスタで FDB を共有する場合は、合計負荷を見込んで計画し、本番利用前に容量を検証してください。各 storage/log Pod はサーバーを一つ実行します。プロセス数を増やす場合は、CPU とメモリを調整してください。

## Kubernetes に FoundationDB をデプロイする {#deploy-foundationdb-on-kubernetes}

Kubernetes への FoundationDB のデプロイは、次の四つの手順で行います。

1. デプロイファイルをダウンロードします。
2. CRD、FDB Operator、Monitor RBAC をデプロイします。
3. FoundationDB クラスタをデプロイします。
4. クラスタの状態を確認します。

以下の手順では `fdb-system` namespace を使用します。Operator が管理する FDB クラスタは、この namespace 内のものだけです。別の namespace を使用する場合は、デプロイファイル内のオブジェクトの namespace と RBAC subject の namespace を合わせて変更してください。

### ステップ 1：インストール用ファイルをダウンロードする {#step-1-download-the-installation-assets}

`/path/to/kubeconfig` を Kubernetes クラスタの設定ファイルに置き換えてから、既存の FDB リソース、コントローラー、StorageClass を確認します。

```shell
export KUBECONFIG=/path/to/kubeconfig
kubectl --kubeconfig "$KUBECONFIG" get crd foundationdbclusters.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" get deployments -A
kubectl --kubeconfig "$KUBECONFIG" get storageclass
```

FDB の CRD またはコントローラーがすでに存在する場合は、まず再利用できるか確認してください。新しい環境では、以下のコマンドでデプロイファイルをダウンロードします。

```shell
mkdir fdb-install-v2.35.0
cd fdb-install-v2.35.0
FDB_CRDS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/crd/bases
FDB_ASSETS=https://raw.githubusercontent.com/velodb/fdb-kubernetes-operator/branch-2.35.0/config/samples/velodb
for resource in clusters backups restores; do
  curl -fSL "$FDB_CRDS/apps.foundationdb.org_foundationdb${resource}.yaml" -o "fdb-${resource}-crd.yaml"
done
curl -fSL "$FDB_ASSETS/operator.yaml" -o fdb-operator.yaml
curl -fSL "$FDB_ASSETS/monitor-rbac.yaml" -o fdb-monitor-rbac.yaml
# Development profile. Use cluster-double.yaml instead for the double profile.
curl -fSL "$FDB_ASSETS/cluster-single.yaml" -o fdb-cluster.yaml
```

### ステップ 2：CRD、コントローラー、Monitor RBAC をインストールする {#step-2-install-crds-the-controller-and-monitor-rbac}

ダウンロードした Operator、初期化コンテナー、データベースの構成では、すでに上記の VeloDB イメージが使用されています。

以下のコマンドで CRD、Operator、Monitor RBAC をデプロイします。

```shell
kubectl --kubeconfig "$KUBECONFIG" create namespace fdb-system
kubectl --kubeconfig "$KUBECONFIG" apply --server-side \
  -f fdb-clusters-crd.yaml -f fdb-backups-crd.yaml -f fdb-restores-crd.yaml
kubectl --kubeconfig "$KUBECONFIG" wait --for=condition=Established --timeout=60s \
  crd/foundationdbclusters.apps.foundationdb.org \
  crd/foundationdbbackups.apps.foundationdb.org \
  crd/foundationdbrestores.apps.foundationdb.org
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-operator.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-monitor-rbac.yaml
```

三つの CRD がすべて Established になり、Operator Deployment のロールアウトが成功したら、FDB クラスタの作業に進みます。CRD ファイルはクライアント側の last-applied アノテーションには大きすぎるため、`--server-side` を使用します。既存リソースと競合する場合は、`--force-conflicts` で上書きする前に、バージョンと所有者を確認してください。

`fdb-monitor-rbac.yaml` は FDB Pod 専用の `fdb-monitor` ServiceAccount を作成し、この namespace 内の Pod に対する get/list/watch/patch 権限を付与します。

### ステップ 3：データベースを設定して作成する {#step-3-configure-and-create-the-database}

`fdb-cluster.yaml` を開き、両方の `REPLACE_WITH_SSD_STORAGE_CLASS` を使用する StorageClass に置き換えます。上記のリソース計画に従って、CPU、メモリ、PVC 容量を調整してください。単一レプリカの例は開発用です。本番環境では二重レプリカを選び、ワークロードに合わせて容量を設定してください。

この例では、Monitor ServiceAccount、ホスト障害ドメイン、FQDN ルーティング、Pod ごとに一つのサーバーを実行する設定がすでに含まれています。設定を変更する際は、以下を確認してください。

- `spec.version`、`mainContainer.imageConfigs[].version`、`tag` を、イメージ内の FDB バージョンと一致させます。7.1 を使用する場合は、先に[FDB 7.1 の設定](#fdb-71)を完了してください。
- コンテナーは UID/GID 4059 で実行され、ボリュームのアクセス権限には `fsGroup: 4059` を使用します。CSI ドライバーがこのグループによる書き込みに対応していることを確認してください。カスタムイメージを使用する場合は、イメージに合わせて実行ユーザーとグループを調整してください。

設定を更新したら、クラスタをデプロイします。

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system apply -f fdb-cluster.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb
```

単一レプリカの例では `fdb-single`、二重レプリカの例では `fdb-double` が作成されます。以下のコマンドでは `fdb-single` を使用します。必要に応じて `fdb-double` に置き換えてください。

### ステップ 4：可用性と調整状態を確認する {#step-4-verify-availability-and-reconciliation}

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get pods,pvc
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get fdb fdb-single -o yaml
```

デプロイ後、以下を確認してください。

- ボリュームがバインドされ、データベースコンテナーが正常に起動していること。Pod が Running であることだけでは十分ではありません。
- `status.configured`、`status.health.available`、`status.health.fullReplication` が `true` であること。
- `status.generations.reconciled` が `metadata.generation` に追いついていること。データベースが利用可能でも、置換や縮小の調整が続いている場合があります。

これらを確認したら、生成された ConfigMap を使って MetaService を設定し、テーブルを作成する前に FDB への接続を確認してください。本番利用前には、クラスタの正常性、coordinator の配置、ホスト障害時の可用性も検証してください。

## FoundationDB の接続情報を含む ConfigMap を取得する {#get-the-configmap-that-contains-foundationdb-access-information}

Operator はデータベースの namespace に `<FoundationDBCluster name>-config` を作成します。

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get configmap fdb-single-config -o yaml
```

Doris リソースを以下のように設定します。二重レプリカの例では `fdb-double-config` を使用してください。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        namespace: fdb-system
        name: fdb-single-config
```

この設定を `DorisDisaggregatedCluster` リソースに追加します。詳しくは、[MetaService の設定](config-ms.md)を参照してください。

:::tip
複数の Doris クラスタで一つの FDB を共有できます。個々の Doris クラスタを削除する際は、共有 FDB を残してください。FDB リソースや PVC を削除するとメタデータが失われる可能性があるため、バックアップと復旧を計画してください。
:::

## MetaService ビルドで FDB 7.1 が必要な場合 {#fdb-71}

MetaService が 7.1 クライアントを使用する場合は、amd64 ノード上に FDB 7.1.67 クラスタを作成できます。FDB クラスタをデプロイする前に、以下のコマンドで Operator に 7.1 クライアントを追加してください。

```shell
curl -fSL "$FDB_ASSETS/operator-client-7.1.patch.yaml" -o fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system patch \
  deployment fdb-kubernetes-operator-controller-manager --type=strategic \
  --patch-file fdb-client-7.1.patch.yaml
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system rollout status \
  deployment/fdb-kubernetes-operator-controller-manager --timeout=300s
```

コピーしたクラスタ YAML で、`spec.version` とメインイメージ設定の `version` および `tag` を `7.1.67` に変更します。7.1.67 イメージは amd64 専用です。異なるアーキテクチャのノードが混在するクラスタでは、コントローラーとすべてのデータベース Pod テンプレートに `nodeSelector: {kubernetes.io/arch: amd64}` を設定してください。この設定は MetaService と互換性のある新規クラスタを作成するためのものであり、既存の FDB クラスタをダウングレードする手順ではありません。

## プライベートレジストリとトラブルシューティング {#private-registries-and-troubleshooting}

環境から Docker Hub にアクセスできない場合は、必要なイメージをプライベートレジストリにコピーし、デプロイファイルを更新してください。

- Operator と初期化コンテナー：`image` を変更します。
- FDB クラスタ：`mainContainer.imageConfigs[].baseImage` を変更し、イメージ内の FDB バージョンを `spec.version` と一致させます。unified モードでは、メインコンテナーと sidecar がこのイメージを共有します。
- レジストリで認証が必要な場合は、Operator と FDB の両方の Pod テンプレートに `imagePullSecrets` を設定します。

有効にしたクライアント初期化コンテナーのイメージをすべて含め、ノードに合ったプラットフォームを選択してください。よくあるデプロイ上の問題と確認項目を以下に示します。

| 症状 | 確認項目 |
| --- | --- |
| コントローラーの init が失敗する / イメージを実行できない | ミラーへのアクセス、tag、ノードのアーキテクチャ。オプションの 7.1 初期化イメージは amd64 専用 |
| PVC または Pod が Pending のままになる | StorageClass、CSI によるプロビジョニング、容量、リソース要求量、ノードセレクター、アンチアフィニティ |
| `File could not be written` | ボリュームの所有者、UID/GID/fsGroup、CSI による権限の処理 |
| FDB の調整が完了しない | コントローラーが監視する namespace と RBAC、Events、コントローラーのログ、置換用の容量、復旧の進捗 |
| FDB は利用可能だが MS が接続できない | MetaService クライアントの互換性、生成された接続情報、DNS、Pod ネットワーク |

```shell
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system get events --sort-by=.metadata.creationTimestamp
kubectl --kubeconfig "$KUBECONFIG" -n fdb-system logs \
  deployment/fdb-kubernetes-operator-controller-manager -c manager --tail=100
```

トラブルシューティング中は、既存クラスタが使用するデータを保護するため、共有 CRD、FDB クラスタ、PVC を残してください。
