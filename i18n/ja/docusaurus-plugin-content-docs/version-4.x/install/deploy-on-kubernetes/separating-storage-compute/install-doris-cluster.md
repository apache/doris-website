---
{
    "title": "完全な Doris コンピュート・ストレージ分離型クラスターのデプロイ",
    "language": "ja",
    "description": "Kubernetes 上で、実際に利用できる Doris コンピュート・ストレージ分離型クラスターをゼロから構築するエンドツーエンドのチュートリアルです。FoundationDB、Doris Operator、Doris クラスターのデプロイから Storage Vault の作成までを説明します。",
    "keywords": ["Doris", "コンピュート・ストレージ分離", "Kubernetes", "クラスターのデプロイ", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

このドキュメントは、Kubernetes 上で初めて Doris のコンピュート・ストレージ分離型クラスターを構築するユーザーを対象に、ゼロからデプロイしてデータを書き込めるようになるまでを説明します。読み終えると、次のことができるようになります。

- FoundationDB（メタデータストレージ）のデプロイまたは接続
- Kubernetes 上への Doris Operator のデプロイ
- Doris Operator を使用した、完全なコンピュート・ストレージ分離型クラスターのデプロイ
- SQL を使用したオブジェクトストレージバックエンド（Storage Vault）の作成

## デプロイ後の構成 {#deployment-outcome}

このチュートリアルを完了すると、次のコンポーネントで構成される Doris コンピュート・ストレージ分離型クラスターが稼働します。

| コンポーネント | 説明 | デフォルトのレプリカ数 |
|------|------|-----------|
| FE | SQL の解析と処理の調整を担当 | 1 |
| MS (MetaService) | メタデータの管理 | 1 |
| Compute Group (CG) | データの取り込みとキャッシュ | 2 |
| FoundationDB | メタデータの保存 | - |
| Storage Vault | S3 互換のオブジェクトストレージ | - |

## デプロイ手順の概要 {#deployment-path-overview}

全体の作業は、順番に実施する 5 つのステップに分かれます。各ステップの入力と出力は次のとおりです。

| ステップ | 目的 | 入力 | 出力 |
|------|----------|------|------|
| ステップ 1 | FoundationDB のデプロイ | K8s クラスター / 利用可能なマシン | 利用可能な FDB クラスターとアクセス情報 |
| ステップ 2 | Doris Operator のデプロイ | K8s クラスターへのアクセス | 稼働中の Operator と CRD |
| ステップ 3 | Doris コンピュート・ストレージ分離型クラスターのデプロイ | `ddc-sample.yaml` と FDB のアクセス情報 | 稼働中のコンピュート・ストレージ分離型クラスター |
| ステップ 4 | リモートストレージバックエンドの作成 | 稼働中のクラスターと S3 互換オブジェクトストレージの認証情報 | データの永続化に利用できる Storage Vault |
| ステップ 5 | クラスターへの接続とエンドツーエンドの検証 | ステップ 4 で確立した MySQL 接続 | 読み書きによって動作を確認したクラスター |

ステップ 4 の完了後、クラスターへの書き込みが可能になります。ステップ 5 では、SQL を使用してエンドツーエンドの動作を検証します。FE / MS / Compute Group の詳細なカスタマイズについては、文末の[高度な設定](#advanced-configuration)を参照してください。

## ステップ 1：FoundationDB をデプロイする {#step-1-deploy-foundationdb}

コンピュート・ストレージ分離型クラスターは、メタデータの保存に FoundationDB（FDB）を使用します。クラスターをデプロイする前に、利用可能な FDB を用意してください。既存のインフラに応じてデプロイ方法を選びます。

| デプロイ方法 | 適した状況 | 次の作業 |
|----------|----------|----------|
| マシンへの直接デプロイ（推奨） | 利用可能な物理マシンまたは仮想マシンがある | [コンピュート・ストレージ分離型クラスターのデプロイ前の準備](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してデプロイし、デプロイ先のマシンと K8s クラスターが同じ LAN 内にあることを確認する |
| Kubernetes 上へのデプロイ | K8s 内で FDB を一元管理したい | 以下の「K8s でのクイックデプロイ」を実施する |

### K8s でのクイックデプロイ（開発用） {#k8s-quick-deployment-development}

[FoundationDB のデプロイ](install-fdb.md)に従い、バージョンが固定された CRD、FDB Operator、Monitor RBAC、および**単一レプリカの開発用プロファイル**をインストールします。クイックデプロイと完全なガイドは、同じバージョンのリソースを使用します。古いデプロイ用 YAML と新しい CRD を混在させないでください。

1. MetaService クライアントの互換性を確認します。7.3.69 プロファイルは互換性のあるクライアントでのみ使用してください。それ以外の場合は、ガイドの [7.1 用の構成](install-fdb.md#fdb-71)に従ってください。
2. SSD の StorageClass を選び、[リソース計画](install-fdb.md#resource-planning)を確認します。単一レプリカのプロファイルでは、サイドカーを含めて 4.4 CPU / 5Gi を要求し、PVC に 20Gi を使用します。これは本番用のプロファイルではありません。
3. ガイドに従ってインストールし、可用性、完全なレプリケーション、調整処理を確認します。その後、`fdb-single-config` ConfigMap が `fdb-system` に生成されたことを確認して記録し、以下のステップ 3 で使用します。実際に MetaService から接続できることも確認してください。

二重レプリカの初期構成については、ガイドに別のプロファイルが用意されています。このプロファイルは、サイドカーを含めて 17.6 CPU / 132Gi を要求し、PVC に 1000Gi を使用します。Operator と Doris のリソースは含まれません。本番環境で使用する前に、ホストごとに独立した障害ドメイン、ワークロードを処理するための容量、障害時の交換に必要な余力を計画してください。

## ステップ 2：Doris Operator をデプロイする {#step-2-deploy-doris-operator}

**入力**：Kubernetes クラスターへのアクセス
**操作**：CRD リソース定義を適用し、Operator と RBAC ルールをデプロイする
**出力**：`doris` namespace で稼働する Doris Operator

### 1. CRD リソース定義を適用する {#1-apply-crd-resource-definitions}

現在のクラスターの状態に応じて、該当するコマンドを選びます。

- **シナリオ A：初めてデプロイする場合（またはコンピュート・ストレージ分離型クラスターのみをデプロイする場合）**：すべての CRD を適用します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **シナリオ B：非分離型クラスターをすでにデプロイしている場合**：コンピュート・ストレージ分離型クラスターに関連する CRD だけを追加します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Operator と RBAC ルールをデプロイする {#2-deploy-the-operator-and-rbac-rules}

次のコマンドを実行して、Doris Operator と、Operator が必要とする RBAC ルールをデプロイします。

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

デプロイ後、Operator Pod の状態を確認します。

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS` が `Running` なら、Operator は準備完了です。

## ステップ 3：コンピュート・ストレージ分離型クラスターをデプロイする {#step-3-deploy-the-compute-storage-decoupled-cluster}

**入力**：デプロイ例 `ddc-sample.yaml` と FoundationDB のアクセス情報
**操作**：サンプルをダウンロードし、必要な主要フィールドを変更してクラスターをデプロイする
**出力**：稼働中の Doris コンピュート・ストレージ分離型クラスター

### 1. デプロイ例をダウンロードする {#1-download-the-deployment-example}

Doris Operator リポジトリから、デフォルトのデプロイ例をダウンロードします。

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 主要な設定を変更する {#2-modify-key-configurations}

サンプルをダウンロードしたら、デプロイ前に少なくとも次の二種類のフィールドを変更する必要があります。その他のフィールドはデフォルト値のままにします。

| フィールド | 必須 / 任意 | 説明 |
|------|-------------|------|
| `spec.metaService.fdb` | **必須** | ステップ 1 でデプロイした FDB のアクセス情報（アドレスまたは ConfigMap のどちらかを選択） |
| `spec.computeGroups[].image` | **必須** | BE イメージのバージョン。使用する Doris のバージョンと一致させる必要がある |
| `spec.metaService.image` | 任意 | MetaService イメージのバージョン。デフォルトではサンプルに記載されたバージョンを使用する |
| `spec.feSpec.electionNumber` | 任意 | FE Follower の数。デフォルトは 1。**デプロイ後は変更できない** |
| `spec.computeGroups[].replicas` | 任意 | Compute Group のレプリカ数。デフォルトはサンプルに記載された値 |
| `spec.feSpec.requests` / `limits` | 任意 | FE のコンピュートリソースの制限（本番環境では設定を推奨） |

変更後の `spec` セクションは、おおむね次のようになります（**方法 A：FDB をマシン上にデプロイする場合**）。

```yaml
spec:
  metaService:
    fdb:
      address: ${fdbEndpoint}      # Required: FDB client access address (machine deployment)
  feSpec:
    electionNumber: 1
    requests:
      cpu: 8
      memory: 8Gi
    limits:
      cpu: 8
      memory: 8Gi
  computeGroups:
    - uniqueId: cg1
      image: ${beImage}            # Required: BE image
      replicas: 2
      requests:
        cpu: 8
        memory: 8Gi
      limits:
        cpu: 8
        memory: 8Gi
```

**方法 B：FDB を K8s 上にデプロイする場合**：`metaService.fdb` セクションを次の内容に置き換えます。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

ConfigMap を確認するには、`kubectl get configmap` を実行します。詳しくは、[FoundationDB のデプロイ - アクセス情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

パラメータの説明：

| パラメータ | 説明 |
|------|------|
| `${fdbEndpoint}` | FoundationDB クライアントのアクセスアドレス。デフォルトの Linux VM デプロイでは、`/etc/foundationdb/fdb.cluster` に保存されます。詳しくは、[FoundationDB のクラスター ファイルに関するドキュメント](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)を参照してください |
| `${beImage}` | BE イメージ。[Apache Doris 公式イメージリポジトリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用してください |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator` が生成した ConfigMap の名前 |
| `${namespace}` | ConfigMap が存在する namespace |

### 3. デプロイして確認する {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

リソースを適用したら、クラスターのセットアップが自動的に完了するまで待ちます。次のコマンドでクラスターの状態を確認します。

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**準備完了の判定基準：** `CLUSTERHEALTH` が `green` で、`CGAVAILABLECOUNT` が `CGCOUNT` と等しいこと。

## ステップ 4：リモートストレージバックエンドを作成する {#step-4-create-the-remote-storage-backend}

**入力**：稼働中の Doris クラスターと S3 互換オブジェクトストレージの認証情報
**操作**：MySQL クライアントから SQL を実行し、Vault を作成して有効にする
**出力**：データの永続化に使用できる、設定済みのストレージバックエンド

クラスターが正常に起動したら、SQL を使用してオブジェクトストレージを永続化用のストレージバックエンドとして登録し、デフォルトの Vault に設定します。Doris では、このストレージバックエンドを Vault と呼びます。これにより、書き込んだデータを永続化できます。

### 1. FE Service のアクセスアドレスを取得する {#1-get-the-access-address-of-the-fe-service}

次のコマンドを実行して、FE にアクセスできる Service を探します。

```shell
kubectl get svc
```

出力例：

```shell
NAME                                     TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                               AGE
test-disaggregated-cluster-fe            ClusterIP   10.96.147.97   <none>        8030/TCP,9020/TCP,9030/TCP,9010/TCP   15m
test-disaggregated-cluster-fe-internal   ClusterIP   None           <none>        9030/TCP                              15m
test-disaggregated-cluster-ms            ClusterIP   10.96.169.8    <none>        5000/TCP                              15m
test-disaggregated-cluster-cg1           ClusterIP   10.96.47.90    <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
test-disaggregated-cluster-cg2           ClusterIP   10.96.50.199   <none>        9060/TCP,8040/TCP,9050/TCP,8060/TCP   14m
```

`-internal` サフィックスのない Service を外部アクセスに使用します。

### 2. MySQL クライアントから接続する {#2-connect-through-a-mysql-client}

Kubernetes クラスター内で MySQL Client を含む一時的な Pod を起動し、その Pod に入ります。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 内で FE Service の名前を指定し、Doris クラスターに接続します。

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Storage Vault を作成する {#3-create-a-storage-vault}

SQL を使用して、S3 プロトコルに対応したオブジェクトストレージを Vault として作成します。次の例では Alibaba Cloud OSS を使用します。

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

その他のストレージバックエンドの作成方法と各フィールドの詳細については、コンピュート・ストレージ分離型クラスターのドキュメントにある[Storage Vault の管理](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

### 4. デフォルトの Storage Vault を設定する {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

`${vaultName}` には、使用する Vault の名前（前の手順で作成した `s3_vault` など）を指定します。

これでクラスターへの書き込みが可能になりました。次のステップでは、SQL を使用してエンドツーエンドの動作を検証します。

## ステップ 5：クラスターに接続してエンドツーエンドで検証する {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**入力**：ステップ 4 で確立した MySQL 接続
**操作**：検証用の SQL を実行し、クラスターが準備完了で、正常に読み書きできることを確認する
**出力**：エンドツーエンドの検証を通過した、利用可能なクラスター

ステップ 4 で確立した MySQL クライアント接続をそのまま使用し、次のコマンドを順番に実行します。すでに接続を終了している場合は、[ステップ 4 - MySQL クライアントから接続する](#2-connect-through-a-mysql-client)を繰り返してください。

### 1. BE ノードが稼働していることを確認する {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

出力で各 BE ノードの `Alive` 列が `true` であれば、Compute Group 内の BE が準備完了であり、FE に認識されています。

### 2. Storage Vault が有効であることを確認する {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

出力にステップ 4 で作成した Vault（`s3_vault` など）が表示され、その `IsDefault` が `true` であれば、ストレージバックエンドは準備完了です。

### 3. テストデータを書き込み、クエリを実行する {#3-write-and-query-test-data}

次の SQL を実行して、「データベースの作成、テーブルの作成、書き込み、クエリ」の一連の処理を確認します。

```mysql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE IF NOT EXISTS hello (
    id INT,
    msg VARCHAR(64)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO hello VALUES (1, 'hello doris');
SELECT * FROM hello;
```

`SELECT` で書き込んだデータが返されれば、FE から MetaService、Compute Group、Storage Vault までの一連の処理が正常に動作しており、クラスターを使用できます。

## 高度な設定 {#advanced-configuration}

上記の 5 つのステップを完了すると、クラスターを使用できます。本番環境では、通常、さらにカスタマイズが必要です。目的に応じて、次のドキュメントを参照してください。

| トピック | 参照ドキュメント | 主な内容 |
|--------|----------|----------|
| FoundationDB のデプロイの詳細、二重レプリカ構成 / 本番モード、FQDN を使用したデプロイ、プライベートイメージリポジトリ | [FoundationDB のデプロイ](install-fdb.md) | FDB の仕組みとすべてのデプロイ方法 |
| MetaService イメージの変更、リソースの調整、起動パラメータのカスタマイズ、稼働状態プローブのタイムアウトの調整 | [MetaService の設定](config-ms.md) | `spec.metaService.*` 以下のすべてのフィールド |
| FE リソースの調整、Follower 数の変更、起動設定のカスタマイズ、アクセス方式（NodePort / LoadBalancer）の設定、永続ストレージ | [FE の設定](config-fe.md) | `spec.feSpec.*` 以下のすべてのフィールド |
| 単一グループ / 複数グループの Compute Group、リソース制限、アクセス方式の設定、キャッシュとログの永続化 | [Compute Group の設定](config-cg.md) | `spec.computeGroups[*]` 以下のすべてのフィールド |
| root / 非 root の管理ユーザーのパスワード設定、Secret による認証情報、Kerberos 認証ファイルのマウント | [認証の設定](config-cluster.md) | クラスター全体の認証情報と Kerberos |
| BE ノードのスケーリング、Compute Group の追加または削除、スケールインと PVC のクリーンアップの確認 | [コンピュート容量の調整](config-cg.md#scaling-compute-groups) | 操作手順、廃止時の動作、結果の検証 |
