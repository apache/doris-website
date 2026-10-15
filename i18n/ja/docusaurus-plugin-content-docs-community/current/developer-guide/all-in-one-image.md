---
title: "All-in-One イメージ: 単一コンテナー、マルチノード、コンピュート・ストレージ分離クラスター"
sidebar_label: All-in-One イメージ
language: ja
description: Apache Doris 公式の all-in-one イメージは、e2e / CI テスト用に FE と BE を一つずつ単一コンテナーで実行する方法、Docker Compose による 3 FE + 3 BE のマルチノードクラスター、ローカル開発やデモ向けの Meta Service・FoundationDB・MinIO を使用するコンピュート・ストレージ分離クラスターという三通りの方法で実行できます。イメージタグ、複数アーキテクチャへの対応、設定、自分でイメージをビルドする方法も説明します。
keywords:
    - Apache Doris
    - all-in-one イメージ
    - 統合テスト
    - e2e テスト
    - CI
    - Docker
    - Docker Compose
    - GitHub Actions
    - マルチノードクラスター
    - コンピュート・ストレージ分離
    - コンピュートグループ
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge Type: Tool Usage -->
<!-- Applicable Scenarios: Ecosystem project integration testing / CI environment setup / local multi-node and compute-storage separated clusters -->

Apache Doris 公式の all-in-one イメージ `apache/doris:all-in-one-<version>` には、リリース済みの FE、BE、Meta Service が一つにまとめられています。起動時にコンテナーが何を実行するかは、環境変数 `DORIS_ROLE` で決まります。同じイメージを次の三つの用途に使用できます。

| モード | 起動方法 | 用途 |
| --- | --- | --- |
| **[単一コンテナー](#single-container)**<br />一つのコンテナー内に 1 FE + 1 BE。約 20 秒で正常状態に到達 | `docker run apache/doris:all-in-one-4.1.3` | コネクター、SDK、データ統合ツールなどのエコシステムプロジェクト向け e2e / CI テスト環境。モックの代わりに実際の Doris インスタンスを使用 |
| **[マルチノードクラスター](#multi-node)**<br />3 FE + 3 BE。ノードごとに一つのコンテナー。約 35 秒で正常状態に到達 | `docker compose -f multi-node.yml up --wait` | 単一コンテナーでは確認できない FE の選出とフェイルオーバー、三つのレプリカ、バランシング、ノードの廃止をローカルで検証 |
| **[コンピュート・ストレージ分離クラスター](#cloud)**<br />FoundationDB + Meta Service + Recycler + MinIO + 1～3 FE + 3 BE（2 つのコンピュートグループ）。約 50 秒で正常状態に到達 | `docker compose -f cloud.yml up --wait` | 外部クラウドリソースを使わずに、コンピュートグループ、ストレージボールト、クラウドモードでの FE フェイルオーバーをローカルで開発・デモ |

単一コンテナーは CI 向けで、`docker run` だけで起動できます。二つの Compose ファイルは Doris 本体リポジトリの [`docker/runtime/all-in-one/4.1/compose/`](https://github.com/apache/doris/tree/master/docker/runtime/all-in-one/4.1/compose) にあり、ローカルでの機能開発やデモ向けです。三つのモードすべてにヘルスチェックがあります。`healthy` はクラスターの構成が完了したことを意味するため、後続の処理でポーリングや `sleep` を行う必要はありません。

:::caution 注意

三つのモードはいずれもテスト・開発環境であり、本番環境へのデプロイには適していません。メモリ設定は CI ランナーやワークステーションに合わせて抑えられ、単一コンテナーは単一レプリカで、デフォルトではデータが永続化されません。また、マルチノードおよびコンピュート・ストレージ分離クラスターは回帰テストパイプラインの代わりにはなりません。`docker()` スイート（`regression-test/suites/cloud_p0` 配下）には、引き続き `doris-compose` が必要です。

:::

## イメージの概要

イメージタグは `apache/doris:all-in-one-<version>` という形式で、たとえば `apache/doris:all-in-one-4.1.3` です。以下の例はすべて 4.1.3 を使用しています。必要なバージョンに置き換えてください。利用可能なタグは、Docker Hub の [apache/doris リポジトリ](https://hub.docker.com/r/apache/doris/tags?name=all-in-one) を参照してください。

このイメージは公式の `apache/doris:fe-<version>`、`be-<version>`、`ms-<version>` イメージから組み立てられているため、内部で実行されるのはリリースされた成果物そのものです。サイズを抑えるための処理は二つだけです。`doris_be`、Meta Service の `doris_cloud` と `libfdb_c.so` からデバッグ情報を削除し（`.symtab` は保持されるため、クラッシュ時のバックトレースで関数名を特定できます）、タグに不要な JNI スキャナーのディレクトリを削除しています。

### 二つのタグ: ベース版と -full 版

| タグ | 対応範囲 | イメージサイズ（4.1.3、非圧縮） |
| --- | --- | --- |
| `apache/doris:all-in-one-<version>` | 内部テーブル、Hive、Iceberg（システムテーブルを含む）、Paimon、JDBC カタログ、外部テーブルへの書き戻し、Java UDF | 約 2.7 GB |
| `apache/doris:all-in-one-<version>-full` | 上記すべてに加え、Hudi、Trino コネクター、MaxCompute | 約 3.2 GB |

これらのサイズは 4.1.3 で測定した非圧縮レイヤーの合計です。それぞれ約 0.2 GB は、コンピュート・ストレージ分離クラスターだけで使用する Meta Service が占めています。参考までに、デバッグ情報の削除や不要ファイルの整理を行わない場合、同じ内容で約 5.6 GB です。

**テストで実際に Hudi テーブルを読み取る、Trino コネクターを使う、または MaxCompute を使用する場合に限り、`-full` を選択してください。** それ以外の場合は、接尾辞のないタグを使用します。三つのモードのいずれも特定のタグを必要としません。Compose クラスターでは、`-full` または自分でビルドしたタグへの切り替えに環境変数 `DORIS_IMAGE` を使います。

二つのタグの違いは、BE によるスキャナーの読み込み方法に由来します。起動時に BE は `be/lib/java_extensions/` 配下のディレクトリを列挙し、JNI スキャナーを読み込みます。リストや設定キーはないため、各タグが対応する形式は、含まれているディレクトリによって正確に決まります。Hive と Iceberg の**データ**の読み取りには、これらの JNI スキャナーではなく BE のネイティブ parquet / orc リーダーが使われるため、両方のタグで対応しています。

### 複数アーキテクチャへの対応

`apache/doris:all-in-one-4.1.3` は、linux/amd64 と linux/arm64 のマニフェストを一つずつ含む OCI イメージインデックスです。`docker pull` は、`apache/doris:fe-4.1.3` の場合と同様にホストに合うものを自動的に選択します。そのため、CI でランナーのアーキテクチャごとに異なるタグを指定する必要はありません。

```shell
docker buildx imagetools inspect apache/doris:all-in-one-4.1.3
```

:::caution 注意

Doris BE は通常、異なるアーキテクチャのエミュレーション環境では実行できません。たとえば Apple Silicon 上で amd64 イメージを、`--platform linux/amd64` の指定で起動すると、セグメンテーション違反が発生します。公式の `apache/doris:be-*` イメージも同様です。対応するアーキテクチャの実機でイメージを実行してください。

:::

## 単一コンテナー: 統合テスト用環境 {#single-container}

Apache Doris の周辺にあるコネクター、SDK、データ統合ツールなどのエコシステムプロジェクトでは、e2e / CI テストにモックではなく実際の Doris インスタンスが必要になることがよくあります。単一コンテナーモードはまさにその用途向けです。一つのコンテナーで FE と BE をそれぞれ一基ずつ実行し、起動後すぐにテスト用環境として利用できます。

統合テストで重要な動作は次のとおりです。

| 機能 | 説明 |
| --- | --- |
| 起動後すぐに利用可能 | FE の起動、`ALTER SYSTEM ADD BACKEND` による BE の登録、BE がオンラインになるまでの待機はすべてコンテナー内で行われます。外部スクリプトは不要です |
| ヘルスチェック | イメージには `HEALTHCHECK` が含まれています。FE の準備が整い、BE がオンラインになって初めて `healthy` になります。通常は 20 秒以内です。CI は `sleep` の代わりにこの状態を待機できます |
| 単一レプリカ | `force_olap_table_replication_num = 1` が設定されるため、`CREATE TABLE` で `replication_num` を指定する必要はありません |
| リソースの制限 | CI ランナー向けにメモリ設定を抑えています。FE ヒープは `-Xmx2048m`、BE 側の JNI ヒープは `-Xmx1024m`、BE は `mem_limit = 40%` です |
| 異常時の即時終了 | FE または BE のどちらかが終了すると、コンテナーは黙って再起動せず、直ちに非ゼロの終了コードで終了します。そのため、CI ですぐに障害を検知できます |
| 正常なシャットダウン | `docker stop` は BE、FE の順に停止し、終了コード 0 で終了します |
| 複数アーキテクチャ | 一つのタグで linux/amd64 と linux/arm64 の両方に対応します |

### 接続情報

| 項目 | 説明 |
| --- | --- |
| MySQL プロトコル | ポート `9030`、ユーザー `root`、パスワードなし |
| FE HTTP | ポート `8030`。`/api/health` に認証は不要です |
| BE HTTP | ポート `8040`。Stream Load のエンドポイントです |
| BE ハートビート | ポート `9050`。コンテナー内部で使用され、通常はホストに公開しません |

### docker run で直接起動する

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    apache/doris:all-in-one-4.1.3

# Wait until the container is healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' doris)" = healthy ]; do sleep 1; done

mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

イメージには MySQL クライアントが含まれています。ホストにクライアントがない場合は、代わりにコンテナー内で実行してください。

```shell
docker exec doris mysql -uroot -h127.0.0.1 -P9030 -e "SHOW BACKENDS"
```

### Docker Compose

`depends_on` と `service_healthy` を使うと、Doris が実際に利用可能になってからテスト用コンテナーが起動します。

```yaml
services:
  doris:
    image: apache/doris:all-in-one-4.1.3
    ports: ["9030:9030", "8030:8030", "8040:8040"]

  integration-test:
    image: my-project-tests:latest
    depends_on:
      doris:
        condition: service_healthy
```

### GitHub Actions

GitHub Actions はサービスコンテナーが `healthy` になるまで待ってから `steps` を実行します。そのため、テストコードに独自の再試行・待機処理は不要です。

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      doris:
        image: apache/doris:all-in-one-4.1.3
        ports: ['9030:9030', '8030:8030', '8040:8040']
    steps:
      - uses: actions/checkout@v4
      - run: mvn -B verify -Pe2e
```

### 設定の調整

このイメージには、統合テスト向けのデフォルト設定があらかじめ含まれています。設定を変更するには、以下の環境変数を使用してください。コンテナーの起動時に `fe.conf` / `be.conf` に書き込まれ、最後の設定値が優先されます。

```shell
docker run -d --name doris \
    -p 9030:9030 -p 8030:8030 -p 8040:8040 \
    -e BE_CONFIG_EXTRA="mem_limit = 80%" \
    -e FE_CONFIG_EXTRA="qe_max_connection = 2048" \
    -e FE_HEAP=4096m \
    apache/doris:all-in-one-4.1.3
```

| 環境変数 | 効果 |
| --- | --- |
| `FE_CONFIG_EXTRA` | `fe.conf` に追記します。複数の項目は改行で区切ります |
| `BE_CONFIG_EXTRA` | `be.conf` に追記します。複数の項目は改行で区切ります |
| `FE_HEAP` / `BE_HEAP` | FE / BE 側 JVM の `-Xmx` を上書きします（例: `4096m`）。デフォルトはそれぞれ `2048m` と `1024m` です |

**データの永続化**: デフォルトでは永続化されないため、コンテナーを削除するとデータも失われます。通常、CI にはこの動作が適しています。データを保持するには、`/opt/apache-doris/fe/doris-meta` と `/opt/apache-doris/be/storage` をマウントしてください。起動処理は冪等なので、同じデータディレクトリを繰り返し使用して起動できます。

### トラブルシューティング

- `docker logs <container>` には、エントリーポイントの起動ログと FE のコンソール出力が記録されます。起動中にクラスターがどこで止まっているか確認できます。
- 完全なログはコンテナー内の `fe/log/fe.log` と `be/log/be.INFO` にあります。
- コンテナーが非ゼロの終了コードで終了した場合は、FE または BE が停止しています。終了直前のログに、停止したプロセスと確認すべきログファイルが示されます。
- 大量のデータを扱うテストでは、**ホスト上で** `vm.max_map_count` を増やす必要がある場合があります（`sysctl -w vm.max_map_count=2000000`）。これは名前空間ごとの sysctl ではなく、コンテナー内から設定できません。そのため、イメージは `start_be.sh` のこの値に対するチェックを省略しています。

## マルチノードクラスターとコンピュート・ストレージ分離クラスター

二つの Compose ファイルは Doris 本体リポジトリの `docker/runtime/all-in-one/4.1/compose/` にあり、Docker Compose v2（`docker compose` サブコマンド）が必要です。デフォルトのイメージは `apache/doris:all-in-one-4.1.3` で、環境変数 `DORIS_IMAGE` または Compose ファイルと同じ場所にある `.env` ファイルで変更できます。他の設定項目も同じ方法で渡せます。各ファイルの先頭にあるコメントに、すべての項目が列挙されています。

```shell
cd <doris repository>/docker/runtime/all-in-one/4.1/compose
```

両方のファイルには `client` サービスが含まれています。すべてのノードが稼働して初めて `healthy` になるため、`docker compose up --wait` はその状態まで待機します。その後もクラスターのネットワーク内で `mysql` と `curl` を使える状態で待機するので、`docker compose exec client ...` からクラスターにアクセスできます。

### マルチノードクラスター: multi-node.yml {#multi-node}

```shell
docker compose -f multi-node.yml up --wait          # healthy in about 35 s
docker compose -f multi-node.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f multi-node.yml kill fe-1          # a new master in a few seconds
docker compose -f multi-node.yml start fe-1         # rejoins as a follower
docker compose -f multi-node.yml down               # tears the cluster down; nothing persists
```

```
fe-1 ─┬─ fe-2, fe-3
      ├─ be-1, be-2, be-3
      └─ client
```

- `fe-1` がクラスターを初期化し、`fe-2` と `fe-3` はフォロワーとして参加します。`FE3_ROLE=observer` を指定すると、`fe-3` はオブザーバーになります。
- テーブルのデフォルトは、実際のクラスターと同様に BE ごとに一つずつ、合計三つのレプリカです。
- ホスト側のポート: `9030` / `8030` が `fe-1`、`9031` / `8031` が `fe-2`、`9032` / `8032` が `fe-3` 用で、`8040` が `be-1` の HTTP ポートです。
- 設定項目: `DORIS_IMAGE`、`SUBNET`（デフォルトは `172.31.81`）、ホスト側のポート、`FE_HEAP`（デフォルトは `1024m`）、`BE_MEM_LIMIT`（デフォルトは `25%`）、`FE3_ROLE`。

### コンピュート・ストレージ分離クラスター: cloud.yml {#cloud}

```shell
docker compose -f cloud.yml up --wait                  # 1 FE + 3 BE, healthy in about 50 s
docker compose -f cloud.yml --profile ha up --wait     # ... plus two follower FEs, 3 FEs in total
docker compose -f cloud.yml exec client mysql -uroot -hfe-1 -P9030
docker compose -f cloud.yml down                       # tears the cluster down; nothing persists
```

```
fdb ─ fdb-init ─┬─ ms ─ cloud-init ─ fe-1 ─┬─ be-1, be-2  (cg_a)
                └─ recycler                 ├─ be-3        (cg_b)
minio ─ minio-init ─┘                       └─ client
```

- Doris の各プロセス（FE、BE、Meta Service、Recycler）は all-in-one イメージから実行されます。FoundationDB と MinIO は、それぞれの提供元のイメージから実行されます。
- `cloud-init` は、MinIO をボールトとして使用し（パス形式、通常の HTTP）、ストレージボールトモードで Meta Service 上にインスタンスを作成して終了する、一度だけ実行されるコンテナーです。その後、`fe-1` は `built_in_storage_vault` をデフォルトのボールトに設定するため、`CREATE TABLE` でボールト名を指定せずに済みます。どちらの処理も冪等です。
- 三つの BE は二つのコンピュートグループを構成します。`be-1` と `be-2` は `cg_a`、`be-3` は `cg_b` に属します。これにより、`use @cg_b`、`SHOW COMPUTE GROUPS`、`ALTER SYSTEM ADD BACKEND ... ("tag.compute_group_name" = ...)`、ストレージボールト、ウォームアップ、クラウドモードでの FE フェイルオーバーを実際に試し、オブジェクトが MinIO に保存される様子も確認できます。
- ホスト側のポート: `9030` / `8030` が `fe-1` 用、`9031` / `8031` と `9032` / `8032` がそれぞれ `fe-2` と `fe-3` 用（`ha` プロファイル使用時）、`8040` が `be-1` の HTTP ポート、`15000` が Meta Service の HTTP API（macOS では AirPlay が `5000` を使用）、`9000` が MinIO、`9001` が MinIO コンソール（`minioadmin` / `minioadmin`）用です。
- 設定項目: `DORIS_IMAGE`、`SUBNET`（デフォルトは `172.31.80`）、ホスト側のポート、`FE_HEAP`、`BE_MEM_LIMIT`、`CG_A` / `CG_B`（コンピュートグループ名）、`INSTANCE_ID`（デフォルトは `100001`。FE の `cluster_id` にも使用）、`S3_BUCKET` / `S3_AK` / `S3_SK`、`FDB_IMAGE` / `FDB_PLATFORM`。
- `--profile ha` で起動したクラスターは、`fe-2` と `fe-3` も他のコンテナーと一緒に処理されるように、停止・削除時にも同じフラグを指定してください。

### 知っておくべきこと

- **データの保持。** `docker compose stop` / `start`（または再度の `up`）ではデータが保持されます。インスタンスの作成、デフォルトボールトの設定、ノードの登録はいずれも冪等です。`down` はコンテナーとネットワークを削除し、データも失われます。
- **ノードのアドレス。** ノードにはプライベートサブネット上の固定 IP が割り当てられます（`SUBNET`。デフォルトはマルチノードで `172.31.81`、クラウドで `172.31.80`）。コンテナーを再起動しても、Doris が認識しているノードの識別情報が維持されます。二つのファイルでは異なるサブネットを使用するため、一方のホスト側ポートを変更すれば両方のクラスターを同時に実行できます。
- **ホストからのアクセス。** 公開済みのポートを使用してください。Docker Desktop（macOS / Windows）では、ホストからコンテナーのアドレスに直接ルーティングできません。そのため、ホストから開始した Stream Load は、FE から BE へのリダイレクトをたどれません。代わりに `client` サービスから実行してください（`docker compose -f <file> exec client curl ...`）。Linux ホストからはノードに直接アクセスできます。
- **メモリ。** デフォルトは `FE_HEAP=1024m`、BE ごとに `mem_limit = 25%` です。完全なコンピュート・ストレージ分離クラスターは約 9 GB を使用します。Docker Desktop には 12 GB 以上を割り当ててください。16 GB の VM で両方の構成を並行して動かすことは想定しないでください。
- **Apple Silicon 上の FoundationDB。** 提供元の `foundationdb/foundationdb:7.1.x` イメージは amd64 専用です。そのため、Apple Silicon 上では `fdb` がエミュレーションで実行されますが、この用途では問題ありません。`FDB_IMAGE` / `FDB_PLATFORM` で変更できます。Meta Service は 7.1 クライアントにリンクしているため、サーバーも 7.1 を使用してください。
- **スモークテスト。** `compose/smoke-test.sh <multi-node|cloud> [image:tag]` は、独自のプロジェクト名、サブネット、ホスト側ポートで構成を起動し、レプリカまたはコンピュートグループとボールトを確認します。さらに、client 経由で Stream Load を実行し、マスター FE を停止し、その停止中に BE を再起動し、マスターを復旧させてから、すべてを削除します。各構成に約二分かかります。

### コンテナーの役割: DORIS_ROLE

両方の Compose ファイルは、同じイメージの各役割を組み合わせています。エントリーポイントは `DORIS_ROLE` に応じて、コンテナーで実行するものを決めます。同じ方法で、たとえば 1 FE + 5 BE の独自構成も作れます。

| `DORIS_ROLE` | 実行内容 | 必須の変数 |
| --- | --- | --- |
| `all`（デフォルト） | 一つのコンテナーで FE + BE を実行する単一コンテナーモード | なし |
| `fe` | 一基の FE。`FE_MASTER` が空の場合は新しいクラスターを初期化し、それ以外の場合は `FE_ROLE`（`follower` \| `observer`）として登録して参加 | `FE_MASTER` |
| `be` | `FE_MASTER` に登録される一基の BE。コンピュート・ストレージ分離モードでは、`COMPUTE_GROUP` で指定したコンピュートグループに参加 | `FE_MASTER` |
| `ms` / `recycler` | コンピュート・ストレージ分離モードの Meta Service / Recycler | `FDB_CLUSTER` |
| `cloud-init` | 一度だけ実行。S3 互換オブジェクトストア上にコンピュート・ストレージ分離インスタンスを作成して終了 | `MS_ENDPOINT`、`INSTANCE_ID`、`S3_*` |
| `client` | 稼働中のノードが `EXPECT_FE` / `EXPECT_BE` で指定した数になるまで待ち、`mysql` と `curl` を使える状態で待機 | `FE_MASTER` |

- `DEPLOY_MODE=cloud` は `fe` と `be` をコンピュート・ストレージ分離ノードにします（`deploy_mode`、`meta_service_endpoint`、ファイルキャッシュなどは自動的に設定されます）。FE は `INSTANCE_ID` を `cluster_id` として使用し、SQL でノードを管理するため、`cloud_unique_id` を個別に割り当てる必要はありません。
- `FE_MASTER` には複数の FE（`fe-1,fe-2,fe-3`）を列挙できます。最初に応答した FE が使用されるため、ノードの再起動時に、たまたま停止している FE だけを待ち続けることはありません。すでにメタデータを持つ FE は自動的に再参加します。
- すべての役割で `FE_CONFIG_EXTRA` / `BE_CONFIG_EXTRA` / `MS_CONFIG_EXTRA` と `FE_HEAP` / `BE_HEAP` が適用され、起動が完了すると ready フラグが作成されます。イメージの `HEALTHCHECK` はそのフラグを確認します。そのため、`docker compose up --wait` はクラスター全体の構成が完了するまで待機し、プロセスが停止した場合もコンテナーは非ゼロの終了コードで終了します。
- 構成に依存する設定（`priority_networks`、レプリカ数、バランシング、コンピュート・ストレージ分離の設定キー）は、コンテナー起動時に役割ごとにエントリーポイントが書き込みます。イメージに組み込まれた conf ファイルには、サイズに関するデフォルト設定のみが含まれます。

## イメージを自分でビルドする

Dockerfile とビルドスクリプトは、Doris 本体リポジトリの `docker/runtime/all-in-one/<release-line>/` 配下にあります。現在利用できるリリース系列は `4.1` です。リリース系列ごとに成果物の配置が大きく異なるため、単一の Dockerfile でバージョンを切り替えるのではなく、系列ごとに専用のディレクトリがあります。

`build.sh` が唯一のエントリーポイントです。スクリプト自体はどのディレクトリからでも実行できます。

```shell
# Build both the base and the -full tag from the official 4.1.3 component images
# (fe / be / ms), host architecture only
./build.sh -v 4.1.3

# Build base only, then run a smoke test against it
./build.sh -v 4.1.3 -f base -t

# Build from a local ./output, which is handy for verifying your own changes.
# Build Doris with build.sh --fe --be --cloud first; without --cloud there is no
# ./output/ms and the resulting image cannot serve the compute-storage separated cluster
./build.sh -v dev -s local

# Build from an extracted release tarball, e.g. while the component images of a
# new release are not on Docker Hub yet
./build.sh -v 4.1.4 -s tarball --tarball-dir ~/apache-doris-4.1.4-bin-x64
```

ビルドコンテキストは常にリポジトリのルートです（`Dockerfile.dockerignore` により数 KB に絞られます）。ローカルの `./output` または tarball のディレクトリは BuildKit の名前付きコンテキストとして渡されるため、どこにあってもかまいませんが、`docker buildx` が必要です。自分でビルドしたイメージは、両方の Compose ファイルですぐに使用できます。

```shell
DORIS_IMAGE=apache/doris:all-in-one-dev docker compose -f multi-node.yml up --wait
```

`--platform` を指定しない場合は、ホストのアーキテクチャ向けだけにビルドされます。複数アーキテクチャ向けのビルドでは、たとえば `./build.sh -v 4.1.3 --platform linux/amd64,linux/arm64 --push` のように明示する必要があります。異なるアーキテクチャ向けのビルドはエミュレーションを経由して時間がかかるため、リリース時は各アーキテクチャをそれぞれの実機でビルドし、`docker buildx imagetools create` で結果をまとめる方が適しています。

その他のオプションは `./build.sh --help` に一覧表示されます。

:::tip

実装の詳細、つまりイメージから削除されるもの、外部テーブル用の追加ファイルに見えても削除してはいけないディレクトリがある理由、サイズの内訳、スモークテストの実行方法については、このディレクトリの [README](https://github.com/apache/doris/blob/master/docker/runtime/all-in-one/4.1/README.md) を参照してください。

:::
