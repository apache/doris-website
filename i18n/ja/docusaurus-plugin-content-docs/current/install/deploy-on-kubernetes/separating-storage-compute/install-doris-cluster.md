---
{
    "title": "Doris の完全なコンピュート・ストレージ分離クラスターのデプロイ",
    "language": "ja",
    "description": "Kubernetes 上で稼働する Doris のコンピュート・ストレージ分離クラスターをゼロから構築するためのエンドツーエンドのチュートリアルです。FoundationDB と Doris Operator のデプロイ、Doris クラスターのデプロイ、Storage Vault の作成までを説明します。",
    "keywords": ["Doris", "コンピュート・ストレージ分離", "Kubernetes", "クラスターデプロイ", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

このドキュメントは、Kubernetes 上で Doris のコンピュート・ストレージ分離クラスターを初めて構築する方を対象に、ゼロからのデプロイからデータの書き込みまでを順を追って説明します。読み終えると、次のことができるようになります。

- FoundationDB（メタデータストレージ）のデプロイ、または既存の FoundationDB への接続
- Kubernetes 上への Doris Operator のデプロイ
- Doris Operator を使用した完全なコンピュート・ストレージ分離クラスターのデプロイ
- SQL を使用したオブジェクトストレージバックエンド（Storage Vault）の作成

## デプロイ後の構成 {#deployment-outcome}

このチュートリアルを完了すると、次のコンポーネントで構成される Doris のコンピュート・ストレージ分離クラスターが稼働します。

| コンポーネント | 説明 | デフォルトのレプリカ数 |
|------|------|-----------|
| FE | SQL の解析と処理の調整を担当 | 1 |
| MS (MetaService) | メタデータの管理 | 1 |
| Compute Group (CG) | データの取り込みとキャッシュ | 2 |
| FoundationDB | メタデータストレージ | - |
| Storage Vault | S3 互換のオブジェクトストレージ | - |

## デプロイ手順の概要 {#deployment-path-overview}

作業は順番に進める 5 つのステップに分かれます。各ステップの入力と出力は次のとおりです。

| ステップ | 目標 | 入力 | 出力 |
|------|----------|------|------|
| ステップ 1 | FoundationDB をデプロイする | K8s クラスター / 利用可能なマシン | 利用可能な FDB クラスターと接続情報 |
| ステップ 2 | Doris Operator をデプロイする | K8s クラスターへのアクセス | 稼働中の Operator と CRD |
| ステップ 3 | Doris のコンピュート・ストレージ分離クラスターをデプロイする | `ddc-sample.yaml` と FDB の接続情報 | 稼働中のコンピュート・ストレージ分離クラスター |
| ステップ 4 | リモートストレージバックエンドを作成する | 稼働中のクラスターと S3 互換オブジェクトストレージの認証情報 | データの永続化に使用できる Storage Vault |
| ステップ 5 | クラスターに接続してエンドツーエンドで検証する | ステップ 4 で確立した MySQL 接続 | 読み書きによって稼働を確認したクラスター |

ステップ 4 の完了後、クラスターは書き込みを受け付けられます。ステップ 5 では SQL を使ってエンドツーエンドの検証を行います。FE / MS / Compute Group の詳細なカスタマイズについては、ドキュメント末尾の[詳細設定](#advanced-configuration)を参照してください。

## ステップ 1：FoundationDB をデプロイする {#step-1-deploy-foundationdb}

コンピュート・ストレージ分離クラスターは、メタデータの保存に FoundationDB（FDB）を使用します。クラスターをデプロイする前に、利用可能な FDB を用意する必要があります。既存のインフラに応じてデプロイ方法を選んでください。

| デプロイ方法 | 適した状況 | 次に行う作業 |
|----------|----------|----------|
| マシンに直接デプロイする（推奨） | 利用可能な物理マシンまたは仮想マシンがある | [コンピュート・ストレージ分離：デプロイ前の準備](../../deploy-manually/separating-storage-compute-deploy-manually)に従ってデプロイし、デプロイ先のマシンと K8s クラスターが同じ LAN 内にあることを確認する |
| Kubernetes 上にデプロイする | K8s 内で FDB を一元管理したい | 以下の「K8s へのクイックデプロイ」を実行する |

### K8s へのクイックデプロイ（開発用） {#k8s-quick-deployment-development}

[FoundationDB のデプロイ](install-fdb.md)に従い、バージョンが固定された CRD、FDB Operator、Monitor RBAC、および**単一レプリカの開発用プロファイル**をインストールしてください。クイックデプロイと詳細ガイドで同じバージョンのリソースを使用できます。古いデプロイ用 YAML と新しい CRD を混在させないでください。

1. MetaService クライアントとの互換性を確認します。7.3.69 のプロファイルは互換性のあるクライアントでのみ使用してください。互換性がない場合は、ガイドの[7.1 向けの方法](install-fdb.md#fdb-71)に従ってください。
2. SSD StorageClass を選び、[リソース計画](install-fdb.md#resource-planning)を確認します。単一レプリカのプロファイルでは、サイドカーを含めて 4.4 CPU / 5Gi を要求し、PVC に 20Gi を使用します。このプロファイルは本番環境向けではありません。
3. ガイドに従ってインストールと、可用性、完全なレプリケーション、リコンシリエーションの確認を完了します。その後、生成された `fdb-single-config` ConfigMap を `fdb-system` で確認し、以下のステップ 3 で使えるように記録してください。MetaService が実際に接続できることも確認してください。

二重レプリカの初期構成には、ガイドに別のプロファイルが用意されています。このプロファイルでは、サイドカーを含めて 17.6 CPU / 132Gi を要求し、PVC に 1000Gi を使用します。Operator と Doris のリソースは含まれません。本番環境で使用する前に、独立したホスト障害ドメイン、ワークロードに必要な容量、障害時の置き換えに備えた余裕を計画してください。

## ステップ 2：Doris Operator をデプロイする {#step-2-deploy-doris-operator}

**入力**：Kubernetes クラスターへのアクセス
**作業**：CRD リソース定義を適用し、Operator と RBAC ルールをデプロイする
**出力**：`doris` 名前空間で稼働する Doris Operator

### 1. CRD リソース定義を適用する {#1-apply-crd-resource-definitions}

現在のクラスターの状態に応じて、該当するコマンドを選んでください。

- **ケース A：初めてデプロイする場合（またはコンピュート・ストレージ分離クラスターのみをデプロイする場合）**：すべての CRD を適用します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **ケース B：分離構成ではないクラスターをすでにデプロイしている場合**：コンピュート・ストレージ分離に関連する CRD だけを追加します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Operator と RBAC ルールをデプロイする {#2-deploy-the-operator-and-rbac-rules}

次のコマンドを実行して、Doris Operator と、それが必要とする RBAC ルールをデプロイします。

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

デプロイ後、Operator Pod の状態を確認します。

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS` が `Running` であれば、Operator の準備は完了しています。

## ステップ 3：コンピュート・ストレージ分離クラスターをデプロイする {#step-3-deploy-the-compute-storage-decoupled-cluster}

**入力**：デプロイ例 `ddc-sample.yaml` と FoundationDB の接続情報
**作業**：サンプルをダウンロードし、必要な主要フィールドを変更してクラスターをデプロイする
**出力**：稼働中の Doris コンピュート・ストレージ分離クラスター

### 1. デプロイ例をダウンロードする {#1-download-the-deployment-example}

Doris Operator リポジトリからデフォルトのデプロイ例をダウンロードします。

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 主要な設定を変更する {#2-modify-key-configurations}

サンプルをダウンロードしたら、デプロイ前に少なくとも次の必須フィールドを変更してください。それ以外のフィールドはデフォルト値のままで構いません。

| フィールド | 必須 / 任意 | 説明 |
|------|-------------|------|
| `spec.metaService.fdb` | **必須** | ステップ 1 でデプロイした FDB の接続情報（アドレスか ConfigMap のいずれかを選択） |
| `spec.computeGroups[].image` | **必須** | BE イメージのバージョン。使用する Doris のバージョンと一致させる必要がある |
| `spec.metaService.image` | 任意 | MetaService イメージのバージョン。デフォルトではサンプル内のバージョンを使用する |
| `spec.feSpec.electionNumber` | 任意 | FE Follower の数。デフォルトは 1。**デプロイ後は変更できない** |
| `spec.computeGroups[].replicas` | 任意 | Compute Group のレプリカ数。デフォルトではサンプルの値を使用する |
| `spec.feSpec.requests` / `limits` | 任意 | FE のコンピュートリソースの制限（本番環境では設定を推奨） |

変更後の `spec` セクションは、おおむね次のようになります（**方法 A：FDB をマシンにデプロイした場合**）。

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

**方法 B：FDB を K8s 上にデプロイした場合**：`metaService.fdb` セクションを次の内容に置き換えます。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

ConfigMap を調べるには、`kubectl get configmap` を実行します。詳しくは、[FoundationDB のデプロイ：接続情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

パラメータの説明：

| パラメータ | 説明 |
|------|------|
| `${fdbEndpoint}` | FoundationDB クライアントの接続アドレス。デフォルトの Linux VM デプロイでは `/etc/foundationdb/fdb.cluster` に保存されます。詳しくは [FoundationDB のクラスター ファイルに関するドキュメント](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)を参照してください |
| `${beImage}` | BE イメージ。[Apache Doris 公式イメージリポジトリ](https://hub.docker.com/r/apache/doris)で提供されているイメージを使用してください |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator` が生成した ConfigMap の名前 |
| `${namespace}` | ConfigMap が存在する名前空間 |

### 3. デプロイして確認する {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

リソースの適用後、クラスターが自動的に構築されるのを待ちます。次のコマンドでクラスターの状態を確認します。

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**準備完了の判定基準：** `CLUSTERHEALTH` が `green` であり、`CGAVAILABLECOUNT` が `CGCOUNT` と等しいこと。

## ステップ 4：リモートストレージバックエンドを作成する {#step-4-create-the-remote-storage-backend}

**入力**：稼働中の Doris クラスターと S3 互換オブジェクトストレージの認証情報
**作業**：MySQL クライアントから SQL を実行し、Vault を作成して有効にする
**出力**：データの永続化に使用できる、設定済みのストレージバックエンド

クラスターの起動に成功したら、SQL を使用してオブジェクトストレージを永続ストレージバックエンドとして登録し、デフォルトの Vault に設定します。Doris では、このバックエンドを Vault と呼びます。この設定によって、書き込んだデータを永続化できます。

### 1. FE Service の接続先アドレスを取得する {#1-get-the-access-address-of-the-fe-service}

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

`-internal` サフィックスのない Service は、外部アクセスに使用します。

### 2. MySQL クライアントから接続する {#2-connect-through-a-mysql-client}

Kubernetes クラスター内で MySQL Client を含む一時 Pod を起動し、その Pod に入ります。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 内で FE Service 名を使い、Doris クラスターに接続します。

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Storage Vault を作成する {#3-create-a-storage-vault}

SQL を使用して、S3 プロトコルに対応するオブジェクトストレージを Vault として作成します。次の例では Alibaba Cloud OSS を使用します。

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

ほかのストレージバックエンドの作成方法と各フィールドの詳細については、コンピュート・ストレージ分離のドキュメントにある[Storage Vault の管理](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

### 4. デフォルトの Storage Vault を設定する {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

`${vaultName}` には、使用する Vault の名前を指定します。たとえば、前の手順で作成した `s3_vault` です。

これでクラスターは書き込みを受け付けられます。次のステップでは、SQL を使ってエンドツーエンドの検証を行います。

## ステップ 5：クラスターに接続してエンドツーエンドで検証する {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**入力**：ステップ 4 で確立した MySQL 接続
**作業**：検証用 SQL を実行し、クラスターの準備が完了していて正常に読み書きできることを確認する
**出力**：エンドツーエンドの検証に合格した、利用可能なクラスター

ステップ 4 で確立した MySQL クライアント接続を引き続き使用し、次のコマンドを順番に実行してください。すでに接続を終了した場合は、[ステップ 4：MySQL クライアントから接続する](#2-connect-through-a-mysql-client)を繰り返してください。

### 1. BE ノードが稼働していることを確認する {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

出力で各 BE ノードの `Alive` 列が `true` であれば、Compute Group 内の BE の準備が完了し、FE に認識されています。

### 2. Storage Vault が有効になっていることを確認する {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

出力にステップ 4 で作成した Vault（`s3_vault` など）が表示され、`IsDefault` が `true` であれば、ストレージバックエンドの準備は完了しています。

### 3. テストデータを書き込んでクエリする {#3-write-and-query-test-data}

次の SQL を順番に実行し、「データベースの作成、テーブルの作成、書き込み、クエリ」の一連の処理を確認します。

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

`SELECT` で書き込んだデータが返されれば、FE から MetaService、Compute Group、Storage Vault までのエンドツーエンドの経路が正常に機能しており、クラスターを利用できます。

## 詳細設定 {#advanced-configuration}

以上の 5 つのステップを完了すると、クラスターを利用できます。本番環境では、通常、さらにカスタマイズが必要です。目的に応じて、次のドキュメントを参照してください。

| トピック | 参照ドキュメント | 主な内容 |
|--------|----------|----------|
| FoundationDB のデプロイの詳細、二重レプリカ構成と本番モード、FQDN を使ったデプロイ、プライベートイメージリポジトリ | [FoundationDB のデプロイ](install-fdb.md) | FDB の仕組みとすべてのデプロイ方法 |
| MetaService イメージの切り替え、リソースの調整、起動パラメータのカスタマイズ、liveness probe のタイムアウトの調整 | [MetaService の設定](config-ms.md) | `spec.metaService.*` 配下のすべてのフィールド |
| FE リソースの調整、Follower 数の変更、起動設定のカスタマイズ、アクセス方法（NodePort / LoadBalancer）の設定、永続ストレージ | [FE の設定](config-fe.md) | `spec.feSpec.*` 配下のすべてのフィールド |
| 単一グループまたは複数グループの Compute Group、リソース制限、アクセス方法の設定、キャッシュとログの永続化 | [Compute Group の設定](config-cg.md) | `spec.computeGroups[*]` 配下のすべてのフィールド |
| root / 非 root の管理ユーザーのパスワード設定、Secret の認証情報、Kerberos 認証ファイルのマウント | [認証の設定](config-cluster.md) | クラスター全体の認証情報と Kerberos |
| BE ノードのスケール変更、Compute Group の追加または削除、スケールインと PVC のクリーンアップの確認 | [コンピュート容量のスケーリング](config-cg.md#scaling-compute-groups) | 操作手順、デコミッション時の動作、結果の検証 |
