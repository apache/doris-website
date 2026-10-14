---
{
    "title": "コンピュートとストレージを分離した Doris クラスターのデプロイ",
    "language": "ja",
    "description": "Kubernetes 上でコンピュートとストレージを分離した Doris クラスターを一から構築するためのチュートリアルです。FoundationDB と Doris Operator のデプロイ、Doris クラスターのデプロイ、Storage Vault の作成までを説明します。",
    "keywords": ["Doris", "コンピュートとストレージの分離", "Kubernetes", "クラスターのデプロイ", "FoundationDB", "Doris Operator", "Storage Vault"]
}
---

このドキュメントは、Kubernetes 上でコンピュートとストレージを分離した Doris クラスターを初めて構築するユーザーを対象としています。デプロイ前の状態からデータを書き込める状態になるまでの手順を説明します。このドキュメントを読むと、次の作業を行えるようになります。

- FoundationDB（メタデータストレージ）のデプロイ、または既存の FoundationDB への接続
- Kubernetes 上への Doris Operator のデプロイ
- Doris Operator を使用した、コンピュートとストレージを分離したクラスター全体のデプロイ
- SQL を使用したオブジェクトストレージのバックエンド（Storage Vault）の作成

## デプロイ後の構成 {#deployment-outcome}

このチュートリアルを完了すると、次のコンポーネントで構成される、コンピュートとストレージを分離した Doris クラスターが稼働します。

| コンポーネント | 説明 | デフォルトのレプリカ数 |
|------|------|-----------|
| FE | SQL の解析と処理の調整を担当 | 1 |
| MS (MetaService) | メタデータの管理 | 1 |
| Compute Group (CG) | データの取り込みとキャッシュ | 2 |
| FoundationDB | メタデータストレージ | - |
| Storage Vault | S3 互換のオブジェクトストレージ | - |

## デプロイ手順の概要 {#deployment-path-overview}

全体の流れは、順番に実行する 5 つのステップで構成されます。各ステップの入力と出力は次のとおりです。

| ステップ | 目的 | 入力 | 出力 |
|------|----------|------|------|
| ステップ 1 | FoundationDB をデプロイする | K8s クラスター／利用可能なマシン | 利用可能な FDB クラスターと接続情報 |
| ステップ 2 | Doris Operator をデプロイする | K8s クラスターへのアクセス | 稼働中の Operator と CRD |
| ステップ 3 | コンピュートとストレージを分離した Doris クラスターをデプロイする | `ddc-sample.yaml` と FDB 接続情報 | 稼働中のクラスター |
| ステップ 4 | リモートストレージのバックエンドを作成する | 稼働中のクラスターと S3 互換オブジェクトストレージの認証情報 | データの永続化に使用できる Storage Vault |
| ステップ 5 | クラスターに接続し、エンドツーエンドで検証する | ステップ 4 で確立した MySQL 接続 | 読み書きで動作確認済みのクラスター |

ステップ 4 の後、クラスターは書き込みを受け付けられる状態になります。ステップ 5 では SQL を使用してエンドツーエンドの動作を検証します。FE／MS／Compute Group の詳細なカスタマイズについては、このドキュメントの最後にある[詳細設定](#advanced-configuration)を参照してください。

## ステップ 1：FoundationDB をデプロイする {#step-1-deploy-foundationdb}

コンピュートとストレージを分離したクラスターは、メタデータの保存に FoundationDB（FDB）を使用します。デプロイ前に、利用可能な FDB を用意する必要があります。既存のインフラストラクチャに応じてデプロイ方法を選択してください。

| デプロイ方法 | 適した状況 | 次に行う作業 |
|----------|----------|----------|
| マシンへの直接デプロイ（推奨） | 利用可能な物理マシン／仮想マシンがすでにある | [コンピュートとストレージの分離：デプロイ前の準備](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してデプロイを完了します。デプロイ先のマシンと K8s クラスターが同じ LAN 内にあることを確認してください |
| Kubernetes 上へのデプロイ | K8s 内で FDB を一元管理したい | 以下の「K8s でのクイックデプロイ」を直接実行します |

### K8s でのクイックデプロイ（最も簡単な方法） {#k8s-quick-deployment-simplest-path}

次の 4 つの手順を順番に実行すると、K8s 上に最小構成の FDB クラスター（単一レプリカ）が起動します。

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

`AVAILABLE` 列が `kubectl get fdb` の結果で `true` になっていれば、FDB クラスターは利用可能です。

:::tip 詳細な選択肢
単一レプリカ構成は開発とテストにのみ適しています。本番環境にはレプリカを二つ使う構成を推奨し、Kubernetes クラスターには少なくとも三台のホストマシンが必要です。その他のデプロイ方法（レプリカを二つ使う構成、本番環境へのデプロイ、プライベートリポジトリのイメージ、FQDN モードなど）については、[FoundationDB のデプロイ](install-fdb.md)を参照してください。
:::

## ステップ 2：Doris Operator をデプロイする {#step-2-deploy-doris-operator}

**入力**：Kubernetes クラスターへのアクセス
**操作**：CRD のリソース定義を適用し、Operator と RBAC ルールをデプロイする
**出力**：`doris` 名前空間で稼働する Doris Operator

### 1. CRD のリソース定義を適用する {#1-apply-crd-resource-definitions}

現在のクラスターの状態に応じてコマンドを選択してください。

- **シナリオ A：初回のデプロイ（またはコンピュートとストレージを分離したクラスターのみをデプロイする場合）**：すべての CRD を適用します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/crds.yaml
  ```

- **シナリオ B：コンピュートとストレージを分離していないクラスターをすでにデプロイしている場合**：コンピュートとストレージの分離に関係する CRD のみを追加します。

  ```shell
  kubectl create -f https://raw.githubusercontent.com/apache/doris-operator/master/config/crd/bases/disaggregated.cluster.doris.com_dorisdisaggregatedclusters.yaml
  ```

### 2. Operator と RBAC ルールをデプロイする {#2-deploy-the-operator-and-rbac-rules}

次のコマンドを実行し、Doris Operator と、それが依存する RBAC ルールをデプロイします。

```shell
kubectl apply -f https://raw.githubusercontent.com/apache/doris-operator/master/config/operator/disaggregated-operator.yaml
```

デプロイ後、Operator Pod の状態を確認します。

```shell
kubectl -n doris get pods
NAME                              READY   STATUS    RESTARTS   AGE
doris-operator-6b97df65c4-xwvw8   1/1     Running   0          19s
```

`STATUS` が `Running` なら、Operator を使用できます。

## ステップ 3：コンピュートとストレージを分離したクラスターをデプロイする {#step-3-deploy-the-compute-storage-decoupled-cluster}

**入力**：デプロイ例 `ddc-sample.yaml` と FoundationDB の接続情報
**操作**：サンプルをダウンロードし、必要に応じて主要なフィールドを変更してクラスターをデプロイする
**出力**：稼働中の、コンピュートとストレージを分離した Doris クラスター

### 1. デプロイ例をダウンロードする {#1-download-the-deployment-example}

Doris Operator リポジトリからデフォルトのデプロイ例をダウンロードします。

```shell
curl -O https://raw.githubusercontent.com/apache/doris-operator/master/doc/examples/disaggregated/cluster/ddc-sample.yaml
```

### 2. 主要な設定を変更する {#2-modify-key-configurations}

サンプルをダウンロードしたら、デプロイ前に少なくとも次の二種類のフィールドを変更する必要があります。その他のフィールドはデフォルト値のままにしてください。

| フィールド | 必須／任意 | 説明 |
|------|-------------|------|
| `spec.metaService.fdb` | **必須** | ステップ 1 でデプロイした FDB の接続情報（アドレスまたは ConfigMap のいずれかを選択） |
| `spec.computeGroups[].image` | **必須** | BE イメージのバージョン。使用する Doris のバージョンと一致させる必要があります |
| `spec.metaService.image` | 任意 | MetaService イメージのバージョン。デフォルトではサンプル内のバージョンを使用します |
| `spec.feSpec.electionNumber` | 任意 | FE Follower の数。デフォルトは 1 で、**デプロイ後には変更できません** |
| `spec.computeGroups[].replicas` | 任意 | Compute Group 内のレプリカ数。デフォルトではサンプルの値を使用します |
| `spec.feSpec.requests` / `limits` | 任意 | FE のコンピュートリソースの制限（本番環境では設定を推奨） |

変更後の `spec` セクションは、おおむね次のようになります（**方法 A：マシン上に FDB をデプロイした場合**）。

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

**方法 B：K8s 上に FDB をデプロイした場合**：`metaService.fdb` セクションを次の内容に置き換えます。

```yaml
spec:
  metaService:
    fdb:
      configMapNamespaceName:
        name: ${foundationdbConfigMapName}    # Required: ConfigMap name generated by fdb-kubernetes-operator (default is ${FDB resource name}-config)
        namespace: ${namespace}               # Required: Namespace where the ConfigMap resides
```

ConfigMap を取得するには、`kubectl get configmap` を実行します（詳細は、[FoundationDB のデプロイ：接続情報を含む ConfigMap の取得](install-fdb.md#get-the-configmap-that-contains-foundationdb-access-information)を参照してください）。

パラメーターの説明：

| パラメーター | 説明 |
|------|------|
| `${fdbEndpoint}` | FoundationDB クライアントの接続アドレス。デフォルトの Linux VM デプロイでは、`/etc/foundationdb/fdb.cluster` に保存されます。詳細は [FoundationDB のクラスターファイルに関するドキュメント](https://apple.github.io/foundationdb/administration.html#foundationdb-cluster-file)を参照してください |
| `${beImage}` | BE イメージ。[Apache Doris 公式イメージリポジトリ](https://hub.docker.com/r/apache/doris)が提供するイメージを使用します |
| `${foundationdbConfigMapName}` | `fdb-kubernetes-operator` が生成する ConfigMap の名前 |
| `${namespace}` | ConfigMap が存在する名前空間 |

### 3. デプロイして確認する {#3-deploy-and-verify}

```shell
kubectl apply -f ddc-sample.yaml
```

リソースの適用後、クラスターが自動的に構築されるまで待ちます。次のコマンドでクラスターの状態を確認します。

```shell
kubectl get ddc
NAME                         CLUSTERHEALTH   FEPHASE   CGCOUNT   CGAVAILABLECOUNT   CGFULLAVAILABLECOUNT
test-disaggregated-cluster   green           Ready     2         2                  2
```

**利用可能と判断する条件：** `CLUSTERHEALTH` が `green` で、`CGAVAILABLECOUNT` が `CGCOUNT` と等しいこと。

## ステップ 4：リモートストレージのバックエンドを作成する {#step-4-create-the-remote-storage-backend}

**入力**：稼働中の Doris クラスターと S3 互換オブジェクトストレージの認証情報
**操作**：MySQL クライアントから SQL を実行し、Vault を作成して有効にする
**出力**：データの永続化に使用できる、設定済みのストレージバックエンド

クラスターの起動に成功したら、SQL を使用してオブジェクトストレージを永続ストレージのバックエンド（Doris では Vault と呼びます）として登録し、デフォルトの Vault に設定する必要があります。これにより、書き込んだデータを永続化できます。

### 1. FE Service の接続アドレスを取得する {#1-get-the-access-address-of-the-fe-service}

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

`-internal` 接尾辞のない Service は、外部からのアクセスに使用します。

### 2. MySQL クライアントから接続する {#2-connect-through-a-mysql-client}

Kubernetes クラスター内で MySQL Client を含む一時 Pod を起動し、その中に入ります。

```shell
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash
```

Pod 内で FE Service 名を指定し、Doris クラスターに接続します。

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

その他のストレージバックエンドの作成方法と各フィールドの詳しい説明については、コンピュートとストレージの分離に関するドキュメントの [Storage Vault の管理](../../deploy-manually/separating-storage-compute-deploy-manually)を参照してください。

### 4. デフォルトの Storage Vault を設定する {#4-set-the-default-storage-vault}

```mysql
SET ${vaultName} AS DEFAULT STORAGE VAULT;
```

`${vaultName}` には、使用する Vault の名前（前の手順の `s3_vault` など）を指定します。

これで、クラスターは書き込みを受け付けられる状態になります。次のステップでは、SQL を使用してエンドツーエンドの動作を検証します。

## ステップ 5：クラスターに接続し、エンドツーエンドで検証する {#step-5-connect-to-the-cluster-and-verify-end-to-end}

**入力**：ステップ 4 で確立した MySQL 接続
**操作**：検証用 SQL を実行し、クラスターが利用可能で正常に読み書きできることを確認する
**出力**：エンドツーエンドの検証に合格した、利用可能なクラスター

ステップ 4 で確立した MySQL クライアント接続を使用し（すでに終了している場合は、[ステップ 4：MySQL クライアントから接続する](#2-connect-through-a-mysql-client)を繰り返してください）、次のコマンドを順番に実行して検証します。

### 1. BE ノードが稼働していることを確認する {#1-confirm-that-be-nodes-are-alive}

```mysql
SHOW BACKENDS;
```

出力で各 BE ノードの `Alive` 列が `true` になっていれば、Compute Group 内の BE が使用可能で、FE に認識されています。

### 2. Storage Vault が有効になっていることを確認する {#2-confirm-that-the-storage-vault-is-in-effect}

```mysql
SHOW STORAGE VAULTS;
```

出力にステップ 4 で作成した Vault（`s3_vault` など）が表示され、`IsDefault` が `true` になっていれば、ストレージバックエンドを使用できます。

### 3. テストデータを書き込んでクエリする {#3-write-and-query-test-data}

次の SQL を実行し、「データベースの作成、テーブルの作成、書き込み、クエリ」という一連の処理を確認します。

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

`SELECT` で書き込んだデータが返されれば、FE から MetaService、Compute Group、Storage Vault までの経路が正常に機能しており、クラスターを使用できます。

## 詳細設定 {#advanced-configuration}

上記の 5 つのステップが完了すると、クラスターを使用できます。本番環境では、通常、さらにカスタマイズが必要です。該当するドキュメントを次の一覧から参照してください。

| トピック | 参照ドキュメント | 主な内容 |
|--------|----------|----------|
| FoundationDB のデプロイの詳細、レプリカを二つ使う構成／本番環境向け構成、FQDN でのデプロイ、プライベートイメージリポジトリ | [FoundationDB のデプロイ](install-fdb.md) | FDB の全体的な仕組みとすべてのデプロイ方法 |
| MetaService イメージの切り替え、リソースの調整、起動パラメーターのカスタマイズ、liveness probe のタイムアウトの調整 | [MetaService の設定](config-ms.md) | `spec.metaService.*` 以下のすべてのフィールド |
| FE リソースの調整、Follower 数の変更、起動設定のカスタマイズ、アクセスモード（NodePort／LoadBalancer）の設定、永続ストレージ | [FE の設定](config-fe.md) | `spec.feSpec.*` 以下のすべてのフィールド |
| 単一／複数グループの Compute Group、リソース制限、アクセスモードの設定、キャッシュとログの永続化 | [Compute Group の設定](config-cg.md) | `spec.computeGroups[*]` 以下のすべてのフィールド |
| root／root 以外の管理者ユーザーのパスワード設定、Secret の認証情報、Kerberos 認証ファイルのマウント | [認証の設定](config-cluster.md) | クラスターレベルの認証情報と Kerberos |
