---
{
    "title": "Doris のコンピュート・ストレージ分離型クラスターを一式デプロイする",
    "language": "ja",
    "description": "Kubernetes 上で、利用可能な Doris のコンピュート・ストレージ分離型クラスターをゼロから構築するエンドツーエンドのチュートリアルです。FoundationDB、Doris Operator、Doris クラスターをデプロイし、Storage Vault を作成します。",
    "keywords": ["Doris", "compute-storage decoupled", "Kubernetes", "deploy cluster", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

このドキュメントは、Kubernetes 上で初めて Doris のコンピュート・ストレージ分離型クラスターを構築する方向けに、ゼロからのデプロイからデータの書き込みまでを説明するエンドツーエンドのチュートリアルです。読み終えると、次のことができるようになります。

- FoundationDB（メタデータストレージ）をデプロイするか、既存の FoundationDB に接続する
- Kubernetes 上に Doris Operator をデプロイする
- Doris Operator を使用して、コンピュート・ストレージ分離型クラスターを一式デプロイする
- SQL を使用してオブジェクトストレージのバックエンド（Storage Vault）を作成する

## デプロイ後の構成 {#deployment-outcome}

このチュートリアルを完了すると、以下のコンポーネントで構成される Doris のコンピュート・ストレージ分離型クラスターが利用できます。

| コンポーネント | 説明 | デフォルトのレプリカ数 |
|------|------|-----------|
| FE | SQL の解析と処理の調整を担当 | 1 |
| MS (MetaService) | メタデータの管理 | 1 |
| Compute Group (CG) | データの取り込みとキャッシュ | 2 |
| FoundationDB | メタデータストレージ | - |
| Storage Vault | S3 互換のオブジェクトストレージ | - |

## デプロイ手順の概要 {#deployment-path-overview}

全体の作業は、順番に実行する 5 つのステップに分かれています。各ステップの入力と出力は次のとおりです。

| ステップ | 目的 | 入力 | 出力 |
|------|----------|------|------|
| ステップ 1 | FoundationDB をデプロイする | K8s クラスター / 利用可能なマシン | 利用可能な FDB クラスターと接続情報 |
| ステップ 2 | Doris Operator をデプロイする | K8s クラスターへのアクセス | 稼働中の Operator と CRD |
| ステップ 3 | Doris のコンピュート・ストレージ分離型クラスターをデプロイする | `ddc-sample.yaml` と FDB の接続情報 | 稼働中のコンピュート・ストレージ分離型クラスター |
| ステップ 4 | リモートストレージのバックエンドを作成する | 稼働中のクラスターと S3 互換オブジェクトストレージの認証情報 | データの永続化に使用できる Storage Vault |
| ステップ 5 | クラスターに接続し、エンドツーエンドで検証する | ステップ 4 で確立した MySQL 接続 | 読み書きによって動作を確認したクラスター |

ステップ 4 を完了すると、クラスターは書き込みを受け付けられる状態になります。ステップ 5 では、SQL を使用してエンドツーエンドの動作を検証します。FE / MS / Compute Group の詳細なカスタマイズについては、このドキュメントの末尾にある[高度な設定](#advanced-configuration)を参照してください。

## ステップ 1：FoundationDB をデプロイする {#step-1-deploy-foundationdb}

コンピュート・ストレージ分離型クラスターは、メタデータの保存に FoundationDB（FDB）を使用します。クラスターをデプロイする前に、利用可能な FDB を用意する必要があります。既存のインフラストラクチャに応じて、デプロイ方法を選択してください。

| デプロイ方法 | 適した状況 | 次の作業 |
|----------|----------|----------|
| マシンに直接デプロイする（推奨） | 利用可能な物理マシンまたは仮想マシンがある | [コンピュートとストレージの分離：デプロイ前の準備](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してデプロイを完了し、デプロイ先のマシンと K8s クラスターが同じ LAN 内にあることを確認する |
| Kubernetes 上にデプロイする | FDB を K8s 内で一元管理したい | 以下の「K8s でのクイックデプロイ」をそのまま実行する |

### K8s でのクイックデプロイ（最も簡単な方法） {#k8s-quick-deployment-simplest-path}

以下の 4 つの手順を順番に実行すると、K8s 上に最小構成の FDB クラスター（単一レプリカ）を起動できます。

**1. FoundationDB の CRD を適用する：**

```shell
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbclusters.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbbackups.yaml
kubectl apply -f https://raw.githubusercontent.com/FoundationDB/fdb-kubernetes-operator/main/config/crd/bases/apps.foundationdb.org_foundationdbrestores.yaml
```

**2. fdb-kubernetes-operator をデプロイする：**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/fdb-operator.yaml
```

**3. FoundationDB クラスターをデプロイする（単一レプリカの最小構成）：**

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/refs/heads/master/doc/examples/disaggregated/fdb/cluster-single.yaml
```

**4. FDB の状態を確認する：**

```shell
kubectl get fdb
```

`AVAILABLE` 列が `kubectl get fdb` の出力で `true` になれば、FDB クラスターの準備は完了です。

:::tip 高度なオプション
単一レプリカ構成は開発とテストにのみ適しています。本番環境では二つのレプリカを使用する構成を推奨します。また、Kubernetes クラスターには少なくとも三台のホストマシンが必要です。その他のデプロイ形態（二つのレプリカ、本番環境へのデプロイ、プライベートリポジトリのイメージ、FQDN モードなど）については、[FoundationDB のデプロイ](install-fdb.md)を参照してください。
:::

## ステップ 2：Doris Operator をデプロイする {#step-2-deploy-doris-operator}

**入力**：Kubernetes クラスターへのアクセス
**操作**：CRD のリソース定義を適用し、Operator と RBAC ルールをデプロイする
**出力**：`doris` 名前空間で稼働する Doris Operator

### 1. CRD のリソース定義を適用する {#1-apply-crd-resource-definitions}

現在のクラスターの状態に応じて、該当するコマンドを選択してください。

- **シナリオ A：初めてデプロイする場合（またはコンピュート・ストレージ分離型クラスターのみをデプロイする場合）**：すべての CRD を適用します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **シナリオ B：分離型ではないクラスターをすでにデプロイしている場合**：コンピュート・ストレージ分離型クラスターに関連する CRD のみを追加します。

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

`STATUS` が `Running` であれば、Operator の準備は完了です。

## ステップ 3：コンピュート・ストレージ分離型クラスターをデプロイする {#step-3-deploy-the-compute-storage-decoupled-cluster}

**入力**：デプロイ例の `ddc-sample.yaml` と FoundationDB の接続情報
**操作**：サンプルをダウンロードし、必要に応じて主要なフィールドを変更してクラスターをデプロイする
**出力**：稼働中の Doris コンピュート・ストレージ分離型クラスター

### 1. デプロイ例をダウンロードする {#1-download-the-deployment-example}

Doris Operator リポジトリから、デフォルトのデプロイ例をダウンロードします。

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 主要な設定を変更する {#2-modify-key-configurations}

サンプルをダウンロードしたら、デプロイ前に少なくとも以下の二種類のフィールドを変更する必要があります。その他のフィールドはデフォルト値のままにしてください。

| フィールド | 必須 / 任意 | 説明 |
|------|-------------|------|
| `spec.metaService.fdb` | **必須** | ステップ 1 でデプロイした FDB の接続情報（アドレスまたは ConfigMap を選択） |
| `spec.computeGroups[].image` | **必須** | BE イメージのバージョン。使用する Doris のバージョンと一致させる必要がある |
| `spec.metaService.image` | 任意 | MetaService イメージのバージョン。デフォルトではサンプル内のバージョンを使用する |
| `spec.feSpec.electionNumber` | 任意 | FE Follower の数。デフォルトは 1。**デプロイ後は変更できない** |
| `spec.computeGroups[].replicas` | 任意 | Compute Group のレプリカ数。デフォルトではサンプル内の値を使用する |
| `spec.feSpec.requests` / `limits` | 任意 | FE のコンピュートリソース制限（本番環境では設定を推奨） |

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

ConfigMap を確認するには `kubectl get configmap` を実行します。詳しくは、[FoundationDB のデプロイ：接続情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください。

パラメーターの説明：

| パラメーター | 説明 |
|------|------|
| `${fdbEndpoint}` | FoundationDB クライアントの接続先アドレス。Linux VM にデフォルトの方法でデプロイした場合は、`/etc/foundationdb/fdb.cluster` に保存される。詳しくは、[FoundationDB クラスターファイルのドキュメント](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)を参照 |
| `${beImage}` | BE イメージ。[Apache Doris の公式イメージリポジトリ](https://hub.docker.com/r/apache/doris)で提供されるイメージを使用する |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator` が生成した ConfigMap の名前 |
| `${namespace}` | ConfigMap が存在する名前空間 |

### 3. デプロイして確認する {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

リソースを適用したら、クラスターの自動構築が完了するまで待ちます。次のコマンドでクラスターの状態を確認します。

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**準備完了の判定基準：** `CLUSTERHEALTH` が `green` で、`CGAVAILABLECOUNT` が `CGCOUNT` と等しいこと。

## ステップ 4：リモートストレージのバックエンドを作成する {#step-4-create-the-remote-storage-backend}

**入力**：稼働中の Doris クラスターと S3 互換オブジェクトストレージの認証情報
**操作**：MySQL クライアントから SQL を実行し、Vault を作成して有効にする
**出力**：データの永続化に使用できる、設定済みのストレージバックエンド

クラスターが正常に起動したら、SQL を使用してオブジェクトストレージを永続ストレージのバックエンドとして登録し、デフォルトの Vault に設定する必要があります。Doris では、このバックエンドを Vault と呼びます。この設定によって、書き込んだデータを永続化できます。

### 1. FE Service の接続先アドレスを取得する {#1-get-the-access-address-of-the-fe-service}

次のコマンドを実行し、FE に接続できる Service を探します。

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

`-internal` という接尾辞のない Service は、外部からのアクセスに使用します。

### 2. MySQL クライアントから接続する {#2-connect-through-a-mysql-client}

Kubernetes クラスター内で MySQL Client を含む一時的な Pod を起動し、その中に入ります。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 内で FE Service の名前を指定し、Doris クラスターに接続します。

```shell
mysql -uroot -P9030 -h test-disaggregated-cluster-fe
```

### 3. Storage Vault を作成する {#3-create-a-storage-vault}

SQL を使用し、S3 プロトコルに対応するオブジェクトストレージを Vault として作成します。次の例では Alibaba Cloud OSS を使用します。

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

ほかのストレージバックエンドの作成方法や各フィールドの詳しい説明については、コンピュート・ストレージ分離のドキュメントにある[Storage Vault の管理](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

### 4. デフォルトの Storage Vault を設定する {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

`${vaultName}` には、使用する Vault の名前（前の手順で作成した `s3_vault` など）を指定します。

これでクラスターは書き込みを受け付けられる状態になります。次のステップでは、SQL を使用してエンドツーエンドの動作を検証します。

## ステップ 5：クラスターに接続し、エンドツーエンドで検証する {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**入力**：ステップ 4 で確立した MySQL 接続
**操作**：検証用の SQL を実行し、クラスターの準備が完了して正常に読み書きできることを確認する
**出力**：エンドツーエンドの検証に合格した、利用可能なクラスター

ステップ 4 で確立した MySQL クライアント接続を引き続き使用し、以下のコマンドを順番に実行して検証します。すでに接続を終了した場合は、[ステップ 4：MySQL クライアントから接続する](#2-connect-through-a-mysql-client)を繰り返してください。

### 1. BE ノードの稼働を確認する {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

出力にある各 BE ノードの `Alive` 列が `true` であれば、Compute Group 内の BE の準備が完了し、FE に認識されていることを示します。

### 2. Storage Vault が有効であることを確認する {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

出力にステップ 4 で作成した Vault（`s3_vault` など）が表示され、その `IsDefault` が `true` であれば、ストレージバックエンドの準備は完了です。

### 3. テストデータを書き込んでクエリを実行する {#3-write-and-query-test-data}

次の SQL を順番に実行し、「データベースの作成、テーブルの作成、書き込み、クエリ」という一連の処理を確認します。

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

`SELECT` で書き込んだデータが返されれば、FE から MetaService、Compute Group、Storage Vault に至るエンドツーエンドの経路が正常に動作しており、クラスターを使用できます。

## 高度な設定 {#advanced-configuration}

上記の 5 つのステップを完了すると、クラスターを使用できます。本番環境では、通常、要件に応じた追加のカスタマイズが必要です。該当するドキュメントを以下の一覧から参照してください。

| トピック | 参照ドキュメント | 主な内容 |
|--------|----------|----------|
| FoundationDB のデプロイの詳細、二つのレプリカを使用する構成と本番環境向け構成、FQDN を使用したデプロイ、プライベートイメージリポジトリ | [FoundationDB のデプロイ](install-fdb.md) | FDB の仕組みとすべてのデプロイ形態 |
| MetaService イメージの切り替え、リソースの調整、起動パラメーターのカスタマイズ、liveness probe のタイムアウト調整 | [MetaService の設定](config-ms.md) | `spec.metaService.*` 以下のすべてのフィールド |
| FE のリソースの調整、Follower 数の変更、起動設定のカスタマイズ、アクセス方式（NodePort / LoadBalancer）の設定、永続ストレージ | [FE の設定](config-fe.md) | `spec.feSpec.*` 以下のすべてのフィールド |
| 単一または複数の Compute Group、リソース制限、アクセス方式の設定、キャッシュとログの永続化 | [Compute Group の設定](config-cg.md) | `spec.computeGroups[*]` 以下のすべてのフィールド |
| root および root 以外の管理者ユーザーのパスワード設定、Secret の認証情報、Kerberos 認証ファイルのマウント | [認証の設定](config-cluster.md) | クラスター全体の認証情報と Kerberos |
| BE ノードのスケーリング、Compute Group の追加と削除、スケールインと PVC のクリーンアップの確認 | [コンピュート容量の調整](config-cg.md#scaling-compute-groups) | 操作手順、廃止時の動作、検証方法 |
