---
{
    "title": "FoundationDB のデプロイ",
    "language": "ja",
    "description": "fdb-kubernetes-operator を使用して Kubernetes 上に FoundationDB クラスターをデプロイする手順を詳しく説明します。リソース定義、Operator のデプロイ、クラスターの設定、状態の確認を扱います。FoundationDB は、コンピュートとストレージを分離した Doris クラスターのメタデータストアとして使用されます。",
    "keywords": ["Doris", "コンピュートとストレージの分離", "Kubernetes", "FoundationDB", "fdb-kubernetes-operator", "メタデータストア", "K8s"]
}
---

[FoundationDB](https://apple.github.io/foundationdb/#overview) は、構造化データ向けの強い一貫性を備えた分散データベースで、Apache 2.0 オープンソースライセンスの下で公開されています。Doris は、コンピュートとストレージを分離したモードで FoundationDB をメタデータストアとして使用します。

Kubernetes 上にコンピュートとストレージを分離したクラスターをデプロイするには、事前に FoundationDB サービスをデプロイする必要があります。推奨されるデプロイ方法は次の二つです。

- マシン（物理マシンを含む）に直接デプロイする。FoundationDB をマシンに直接デプロイする場合は、Doris のコンピュートとストレージを分離した構成の公式ドキュメントにある[デプロイ前の準備](../../deploy-manually/separating-storage-compute-deploy-manually)を参照して、FoundationDB クラスターを構築してください。デプロイ前に、FoundationDB を実行するマシンと Doris を実行する Kubernetes クラスターが同じローカルエリアネットワーク内にあることを確認してください。

- FoundationDB を Kubernetes 上にデプロイする。FoundationDB は、Kubernetes 上で FoundationDB をデプロイおよび管理するための [fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) を公式に提供しています。

## Kubernetes 上に FoundationDB をデプロイする

Kubernetes 上への FoundationDB のデプロイは、次の 4 ステップで行います。

1. FoundationDB のリソース定義をデプロイする。
2. fdb-kubernetes-operator サービスをデプロイする。
3. FoundationDB クラスターをデプロイする。
4. FoundationDB の状態を確認する。

### ステップ 1：FoundationDB のリソース定義をデプロイする

次のコマンドで FoundationDB のリソース定義を適用します。

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

期待される結果：

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbclusters.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbbackups.apps.foundationdb.org created
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
customresourcedefinition.apiextensions.k8s.io/foundationdbrestores.apps.foundationdb.org created
```

### ステップ 2：fdb-kubernetes-operator サービスをデプロイする

fdb-kubernetes-operator リポジトリには、FoundationDB クラスターを IP モードでデプロイするサンプルがあります。doris-operator リポジトリには、FQDN モードでデプロイするサンプルがあります。用途に合うものをダウンロードしてください。

1. デプロイ用サンプルをダウンロードする

    - 公式の fdb-kubernetes-operator リポジトリからダウンロードする
      fdb-kubernetes-operator は、デフォルトで FoundationDB クラスターを IP モードでデプロイします。[デフォルトの fdb-kubernetes-operator デプロイ用 YAML ファイル](https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml)をダウンロードできます。FQDN デプロイモードを使用する場合は、公式ドキュメントの [DNS の使用](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#using-dns)に従って、ドメイン名を使用するモードにカスタマイズしてください。

      ```shell
      wget -O fdb-operator.yaml https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/deployment.yaml
      ```

    - doris-operator リポジトリからダウンロードする
      doris-operator リポジトリには、fdb-kubernetes-operator バージョン 1.46.0 を基にカスタマイズしたデプロイ例があります。この例を使用して FoundationDB クラスターを直接デプロイできます。

      ```shell
      wget https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
      ```

2. fdb-kubernetes-operator サービスをデプロイする

    `fdb-kubernetes-operator` のデプロイ用 YAML をカスタマイズした後、次のコマンドで fdb-kubernetes-operator をデプロイします。

    ```shell
    kubectl apply -f fdb-operator.yaml
    ```

    期待される結果：

    ```shell
    serviceaccount/fdb-kubernetes-operator-controller-manager created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrole created
    clusterrole.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-role created
    rolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-rolebinding created
    clusterrolebinding.rbac.authorization.k8s.io/fdb-kubernetes-operator-manager-clusterrolebinding created
    deployment.apps/fdb-kubernetes-operator-controller-manager created
    ```
### ステップ 3：FoundationDB クラスターをデプロイする

[fdb-kubernetes-operator リポジトリ](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/config/samples/cluster.yaml)には、FoundationDB をデプロイするためのサンプルがあります。次のコマンドで直接ダウンロードしてください。

1. デプロイ用サンプルをダウンロードする

    FoundationDB の公式リポジトリから、IP モードのデプロイ用サンプルをダウンロードします。

    ```shell
    wget https://raw.githubusercontent.com/foundationdb/fdb-kubernetes-operator/main/config/samples/cluster.yaml
    ```

2. デプロイ用サンプルをカスタマイズする

    - Docker Hub にアクセスできる環境
      公式サイトの[ユーザーマニュアル](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/index.md)に従って、デプロイ時の最終状態をカスタマイズします。FQDN モードでデプロイする場合は、`routing.useDNSInClusterFile` フィールドを true に設定します。設定は次のとおりです。
      doris-operator の公式リポジトリには、ダウンロードして直接使用できる [FQDN モードでの FoundationDB デプロイ用サンプル](https://github.com/apache/doris-operator/blob/master/doc/examples/disaggregated/fdb/)があります。

      ```yaml
      spec:
          routing:
              useDNSInClusterFile: true
      ```

    - プライベートネットワーク環境
      Docker Hub に直接アクセスできないプライベートネットワーク環境では、必要なイメージを FoundationDB の公式リポジトリからダウンロードし、プライベートレジストリにプッシュします。fdb-kubernetes-operator は [foundationdb/fdb-kubernetes-operator](https://hub.docker.com/r/foundationdb/fdb-kubernetes-operator) と [foundationdb/foundationdb-kubernetes-sidecar](https://hub.docker.com/r/foundationdb/foundationdb-kubernetes-sidecar) に依存します。
      FoundationDB のデプロイに必要なイメージは [fdb-kubernetes-monitor](https://hub.docker.com/r/foundationdb/fdb-kubernetes-monitor/tags) です。
      プライベートレジストリにプッシュした後、fdb-kubernetes-operator の公式ドキュメントの [FoundationDB イメージのカスタマイズ](https://github.com/FoundationDB/fdb-kubernetes-operator/blob/main/docs/manual/customization.md#customizing-the-foundationdb-image)に従って設定します。
      プライベートレジストリのイメージ設定を追加する際は、次の設定を参照してください。

      ```yaml
      spec:
          mainContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          sidecarContainer:
              imageConfigs:
                  - baseImage: foundationdb/fdb-kubernetes-monitor
                    tag: 7.1.38
          version: 7.1.38
      ```

    doris-operator リポジトリには、FoundationDB のデプロイ構成として、[最小構成の単一レプリカデプロイ](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml)、[最小構成でレプリカを二つ使用するデプロイ](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster.yaml)、[本番環境向けにレプリカを二つ使用するデプロイ](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product.yaml)、[プライベートレジストリのイメージを使用し、本番環境向けにレプリカを二つ使用するデプロイ](https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/fdb_product_private_env.yaml)の 4 種類がまとめられています。

:::tip ヒント
- FoundationDB をデプロイする際は、FoundationDBCluster リソースの `.spec.version` フィールドを設定する必要があります。値には、リリース済みの FoundationDB のバージョン番号を指定してください。
- FoundationDB は fdb-kubernetes-operator を使用してデプロイします。本番環境の高可用性要件を満たすには、Kubernetes クラスターに少なくとも三台のホストマシンが必要です。
:::

### ステップ 4：FoundationDB の状態を確認する

FoundationDB は fdb-kubernetes-operator を使用してデプロイします。次のコマンドで FoundationDB クラスターの状態を確認できます。

```shell
kubectl get fdb
```

期待される結果。`AVAILABLE` が `true` の場合、クラスターは利用可能です。

```shell
NAME           GENERATION   RECONCILED   AVAILABLE   FULLREPLICATION   VERSION   AGE
test-cluster   1            1            true        true              7.1.26    13m
```

## FoundationDB のアクセス情報を含む ConfigMap を取得する

[fdb-kubernetes-operator](https://github.com/FoundationDB/fdb-kubernetes-operator) を使用して FoundationDB をデプロイすると、デプロイ先の名前空間に FoundationDB のアクセス情報を含む ConfigMap が生成されます。この ConfigMap の名前は、デプロイした FoundationDB のリソース名に「-config」を付けたものです。次のコマンドで ConfigMap を確認します。

```shell
kubectl get configmap
```

期待される結果：

```shell
test-cluster-config   5      15d
```

:::tip ヒント
Kubernetes 上でデプロイした場合、FoundationDBCluster リソースを削除するとメタデータが失われます。FoundationDBCluster リソースの取り扱いには注意してください。
:::
