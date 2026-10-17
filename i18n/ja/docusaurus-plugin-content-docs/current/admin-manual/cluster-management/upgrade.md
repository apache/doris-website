---
{
    "title": "クラスターのアップグレード",
    "language": "ja",
    "description": "Apache Doris クラスターのローリングアップグレードガイド。バージョン互換性のルール、メタデータ互換性テスト、BE/FE ノードのアップグレード手順、一般的なトラブルシューティングについて説明します。",
    "keywords": [
        "Doris のアップグレード",
        "Doris のローリングアップグレード",
        "Doris クラスターのアップグレード",
        "FE のアップグレード",
        "BE のアップグレード",
        "メタデータ互換性テスト",
        "metadata_failure_recovery",
        "disable_balance",
        "レプリカの修復とバランシング",
        "Doris のバージョン番号",
        "バージョンをまたぐアップグレード",
        "カナリアアップグレード"
    ]
}
---

Apache Doris は、FE ノードと BE ノードのバイナリを順次置き換えるローリングアップグレードをサポートしています。これにより、ダウンタイムを最小限に抑え、アップグレード中もクラスターの可用性を維持できます。このドキュメントはクラスター管理者を対象とし、バージョン互換性のルール、メタデータ互換性のテスト手順、詳細なアップグレード手順を説明します。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 適用可否 | 備考 |
| --- | --- | --- |
| 同じマイナーバージョン内でのパッチバージョンのアップグレード（例：2.1.3 から 2.1.7） | 可 | ローリングアップグレードを直接実施できます |
| マイナーバージョンをまたぐアップグレード（例：3.0 から 3.3） | 可、段階的に実施 | 3.0 から 3.1、3.1 から 3.2、3.2 から 3.3 の順にアップグレードします |
| メジャーバージョンのアップグレード（例：2.x から 3.x） | 可、段階的に実施 | メジャーバージョンをまたいで直接アップグレードすることは推奨しません。マイナーバージョンごとに順次アップグレードします |
| FE が 1 台のクラスターのアップグレード | 可、互換性テスト後 | 先に FE 3 台の高可用性構成に拡張するか、アップグレード前にメタデータ互換性テストを実施します |
| メタデータに互換性がない可能性のあるバージョン間のアップグレード | 可、互換性テスト後 | アップグレード前にメタデータの互換性を確認する必要があります |

## 前提条件 {#prerequisites}

アップグレードを実施する前に、以下を確認してください。

- 対象バージョンのリリースノートを読み、バージョン間の動作の変更点と互換性を理解していること。
- アップグレードに失敗してもデータが失われないよう、データを 3 レプリカで保存していること。
- クライアント側のタスクにリトライ処理が実装されていること（後述の「アップグレード時の注意事項」を参照）。
- メタデータ互換性テストに使用できる開発用マシンまたは BE ノードがあること。
- 対象バージョンのインストールパッケージをダウンロードして展開済みであること（以下の手順では、`${DORIS_NEW_HOME}` は新バージョンのルートディレクトリ、`${DORIS_OLD_HOME}` は本番環境で稼働中の旧バージョンのルートディレクトリを指します）。

## バージョンの互換性 {#version-compatibility}

Doris のバージョン番号は 3 つの数字で構成されます。最初の数字はメジャーマイルストーンバージョン、2 番目は機能バージョン、3 番目はバグ修正バージョンを表します。3 番目の数字が変わるバージョンでは、新機能はリリースされません。Doris 2.1.3 を例に説明します。

| 位置 | 値の例 | 意味 |
| --- | --- | --- |
| 最初の数字 | 2 | 2 番目のマイルストーンバージョン |
| 2 番目の数字 | 1 | そのマイルストーンに属する機能バージョン |
| 3 番目の数字 | 3 | その機能バージョンに属する 3 番目のバグ修正バージョン |

アップグレード時は、以下のルールに従ってください。

| アップグレードの種類 | バージョンを飛ばしたアップグレード | 推奨経路 |
| --- | --- | --- |
| 3 番目の数字が変わるバージョン（2 番目の数字は同じ） | サポート対象 | 直接アップグレードします。例：2.1.3 から 2.1.7 |
| 2 番目の数字が変わるバージョン | バージョンを飛ばすことは非推奨 | 2 番目の数字が示すバージョンごとにアップグレードします。例：3.0 から 3.1、3.2、3.3 の順 |
| 最初の数字が変わるバージョン | バージョンを飛ばすことは非推奨 | まず同じメジャーバージョン内で最新のマイナーバージョンにアップグレードし、その後メジャーバージョンをまたいでアップグレードします |

バージョンの詳細については、[バージョニングルール](https://doris.apache.org/community/release-and-verify/release-versioning)を参照してください。

## アップグレード時の注意事項 {#upgrade-considerations}

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード前に、以下の 3 点に注意してください。

| 注意事項 | 対応方法 |
| --- | --- |
| バージョン間の動作の変更 | アップグレード前に対象バージョンのリリースノートを読み、互換性のない動作変更がないか確認します |
| クライアントタスクのリトライ | アップグレード中はノードを順次再起動するため、Stream Load とクエリタスクにリトライ処理を追加する必要があります。Routine Load、Flink Doris Connector、Spark Doris Connector にはリトライ処理が組み込まれているため、追加の対応は不要です |
| レプリカの修復とバランシング | アップグレード前にレプリカの修復とバランシングを無効にする必要があります。アップグレードの成否にかかわらず、作業完了後には再び有効にする必要があります |

:::caution 注意

Doris のアップグレードでは、FE ディレクトリ直下の `/bin` と `/lib`、および BE ディレクトリ直下の `/bin` と `/lib` を置き換えるだけで済みます。

バージョン 2.0.2 以降では、FE と BE の両方のデプロイ先に `custom_lib/` ディレクトリが追加されています（存在しない場合は手動で作成してください）。このディレクトリには、ユーザー定義のサードパーティー製 jar ファイル（`hadoop-lzo-*.jar` や `orai18n.jar` など）を保存します。アップグレード時にこのディレクトリを置き換える必要はありません。

:::

## メタデータ互換性テスト {#metadata-compatibility-test}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

メタデータ互換性テストでは、新バージョンが既存のメタデータを正しく読み込めるかをアップグレード前に確認します。これにより、アップグレードの失敗によるデータ損失を防ぎます。アップグレードのたびに、このテストを実施することを推奨します。

:::caution 注意

本番環境では、FE ノードを 3 台以上配置した高可用性構成を推奨します。FE ノードが 1 台しかない場合は、アップグレード前にメタデータ互換性テストを必ず実施してください。メタデータの互換性は重要です。互換性がないためにアップグレードに失敗すると、データが失われる可能性があります。

次の点にも注意してください。

- メタデータ互換性テストは開発用マシンまたは BE ノードで実施し、FE ノードでの実施は避けることを推奨します。
- FE ノードでしかテストを実施できない場合は、Master 以外のノードを選び、先にそのノードで稼働中の FE プロセスを停止してください。

:::

### 1. メタデータをバックアップする {#1-back-up-metadata}

アップグレードを開始する前に、Master FE ノードのメタデータをバックアップします。

Master FE ノードは、`show frontends` の `IsMaster` 列で確認できます。FE プロセスを停止せずに、稼働中の FE メタデータをバックアップできます。デフォルトでは、FE メタデータは `fe/doris-meta` ディレクトリに保存されます。メタデータディレクトリは、`fe.conf` の `meta_dir` パラメーターでも確認できます。

### 2. テスト用の FE 設定ファイルを変更する {#2-modify-the-fe-configuration-file-for-testing}

テスト環境の `fe.conf` を編集します。

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

すべてのポートを本番環境とは異なる値に設定し、`clusterId` パラメーターも変更します。

```text
...
## modify port
http_port = 18030
rpc_port = 19020
query_port = 19030
arrow_flight_sql_port = 19040
edit_log_port = 19010

## modify clusterIP
clusterId=<a_new_clusterID, such as 123456>
...
```

テスト環境で使用するポートの例を次に示します。

| パラメーター | 値の例 | 説明 |
| --- | --- | --- |
| `http_port` | 18030 | FE HTTP サービスのポート |
| `rpc_port` | 19020 | FE Thrift Server のポート |
| `query_port` | 19030 | FE MySQL プロトコルのクエリポート |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL のポート |
| `edit_log_port` | 19010 | FE BDBJE 通信のポート |
| `clusterId` | 123456 | テストクラスターの ID。本番環境とは異なる値にする必要があります |

### 3. Master FE のメタデータをコピーする {#3-copy-the-master-fe-metadata}

バックアップした Master FE のメタデータを、新しい互換性テスト環境にコピーします。

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. メタデータの VERSION ファイル内の cluster\_id を変更する {#4-modify-the-cluster_id-in-the-metadata-version-file}

コピーしたメタデータディレクトリ内の `VERSION` ファイルで、`cluster_id` を新しいクラスター ID に変更します。上記の例では 123456 です。

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. テスト環境で FE プロセスを起動する {#5-start-the-fe-process-in-the-test-environment}

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

バージョン 2.0.2 より前では、先に `fe.conf` に `metadata_failure_recovery=true` を追加してから、FE プロセスを起動します。

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. FE が正常に起動したことを確認する {#6-verify-that-the-fe-started-successfully}

MySQL クライアントからテスト用 FE に接続します。上記の例では `query_port` の 19030 を使用します。

```shell
mysql -uroot -P19030 -h127.0.0.1
```

接続に成功すれば、新バージョンが現在のメタデータを正しく読み込めており、メタデータ互換性テストは合格です。

## アップグレードの全体的な流れ {#upgrade-flow-overview}

アップグレードの全手順は次のとおりです。必ずこの順序で実施してください。

1. レプリカの修復とバランシングを無効にします。
2. BE ノードをアップグレードします（複数レプリカのクラスターではカナリアアップグレードを実施できます）。
3. FE ノードをアップグレードします（Observer/Follower ノードを先に、Master を最後にアップグレードします）。
4. レプリカの修復とバランシングを再び有効にします。

基本方針は、**BE を先に、FE を後にアップグレードする**ことです。FE のアップグレードでは、**Observer FE ノードと Follower FE ノードを先に、Master FE ノードを最後にアップグレードします**。

## アップグレード手順 {#upgrade-steps}

### ステップ 1：レプリカの修復とバランシングを無効にする {#step-1-disable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード中はノードが再起動されるため、不要なクラスターのバランシングやレプリカの修復が発生する可能性があります。まず、以下の 3 つの設定を無効にします。

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

対象となる設定は次のとおりです。

| 設定 | アップグレード前の値 | 効果 |
| --- | --- | --- |
| `disable_balance` | `true` | レプリカのバランシングを無効にし、ノード再起動に伴うレプリカの移行を防ぎます |
| `disable_colocate_balance` | `true` | Colocate Join テーブルのレプリカのバランシングを無効にします |
| `disable_tablet_scheduler` | `true` | タブレットのスケジューリングを無効にし、レプリカの修復を防ぎます |

### ステップ 2：BE ノードをアップグレードする {#step-2-upgrade-be-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info 注意

データの安全性を確保するため、アップグレード時の操作ミスや障害によるデータ損失を避けられるよう、データを 3 レプリカで保存してください。

:::

複数レプリカのクラスターでは、BE ノードを 1 台選んでカナリアアップグレードを実施できます。その結果を確認してから、残りのノードを 1 台ずつアップグレードします。

#### 2.1 アップグレード対象の BE ノードを停止する {#21-stop-the-be-node-to-be-upgraded}

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 既存の `/bin` ディレクトリと `/lib` ディレクトリをバックアップする {#22-back-up-the-existing-bin-and-lib-directories}

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 新バージョンの `/bin` ディレクトリと `/lib` ディレクトリをコピーする {#23-copy-the-new-versions-bin-and-lib-directories}

```shell
cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
```

#### 2.4 BE ノードを起動する {#24-start-the-be-node}

```shell
sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
```

#### 2.5 アップグレードを確認する {#25-verify-the-upgrade}

クラスターに接続し、ノード情報を確認します。

```sql
show backends\G
```

BE ノードの `Alive` が `true` で、`Version` の値が新バージョンであれば、そのノードのアップグレードは成功です。確認後、残りの BE ノードも同じ方法で 1 台ずつアップグレードします。

### ステップ 3：FE ノードをアップグレードする {#step-3-upgrade-fe-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

FE ノードが複数ある場合は、Master 以外のノード（Observer または Follower）を先にアップグレードします。ほかのノードがすべて完了してから、Master ノードを最後にアップグレードします。

#### 3.1 アップグレード対象の FE ノードを停止する {#31-stop-the-fe-node-to-be-upgraded}

```shell
sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
```

#### 3.2 既存のディレクトリをバックアップする {#32-back-up-the-existing-directories}

`/bin`、`/lib`、`/mysql_ssl_default_certificate` の 3 つのディレクトリをバックアップします。

```shell
mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
```

#### 3.3 新バージョンのディレクトリをコピーする {#33-copy-the-new-versions-directories}

```shell
cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
```

#### 3.4 FE ノードを起動する {#34-start-the-fe-node}

```shell
sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
```

#### 3.5 アップグレードを確認する {#35-verify-the-upgrade}

クラスターに接続し、ノード情報を確認します。

```sql
show frontends\G
```

FE ノードの `Alive` が `true` で、`Version` の値が新バージョンであれば、そのノードのアップグレードは成功です。

#### 3.6 残りの FE ノードを 1 台ずつアップグレードする {#36-upgrade-the-remaining-fe-nodes-one-by-one}

Master 以外の残りの FE ノードを同じ方法で 1 台ずつアップグレードし、**Master FE ノードを最後にアップグレードします**。

### ステップ 4：レプリカの修復とバランシングを再び有効にする {#step-4-re-enable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

アップグレードが完了し、すべての BE ノードの `Alive` が true に戻ったら、クラスターのレプリカの修復とバランシングを再び有効にします。

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## バージョン別のアップグレード時の注意点 {#per-version-upgrade-notes}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

このセクションでは、特定のバージョンにアップグレードする際に特に注意が必要な動作変更を記載します。変更点の完全な一覧については、このセクションに加えて、必ず対象バージョンのリリースノートを読んでください。

### 3.x から 4.0 へのアップグレード時のセッション変数の移行 {#session-variable-migration-when-upgrading-from-3x-to-40}

FE は、内部変数 `variable_version` を使用して、セッション変数のデフォルト値の移行状況を管理します。3.x から 4.0 へのアップグレード時（`variable_version` が 400 未満の場合）、FE は以下の変数の**グローバルデフォルト値**を自動的に調整します。

| 変数 | 移行後のデフォルト値 | 説明 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | 3.x のクエリ編成動作を維持し、アップグレード後に意味論が変わらないようにします |
| `enable_new_type_coercion_behavior` | `false` | 3.x の型強制変換の動作を維持します |
| `enable_sql_cache` | `true` | SQL Cache を有効にします |
| `enable_nereids_distribute_planner` | `true` | **バージョン 4.0.8 で追加された移行項目です**。以下を参照してください |

この移行は、`variable_version` が 400 未満から 400 に引き上げられるときに 1 回だけ実行されます。その後、ユーザーが明示的に設定した値を上書きすることはありません。

### 4.0.8 へのアップグレード {#upgrading-to-408}

:::caution Nereids distribute planner が有効になります

バージョン 4.0.8 以降では、3.x から 4.0 にアップグレードすると、Nereids distribute planner（`enable_nereids_distribute_planner`）が有効になります。

4.0.8 より前は、クラスターのメタデータイメージに `enable_nereids_distribute_planner=false` が保存されていた場合、アップグレード後もその値がそのまま復元され、従来の distribute planner が引き続き使用されていました。バージョン 4.0.8 では、この変数が `variable_version=400` の移行対象に追加され、アップグレード後に新しい distribute planner が一貫して有効になります。

アップグレード前後でクエリプランの分散方法が異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

4.0.8 へのアップグレード時には、以下の変更点にも注意が必要です。

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| メモリ使用量が多い場合でも Compaction が一時停止しなくなります（BE 設定 `enable_compaction_pause_on_high_memory` のデフォルト値が `true` → `false` に変更） | すべてのデプロイモード | 従来の動作を維持するには、`true` に戻します。[BE 設定](../config/be-config)を参照してください |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成したテーブル | 新しく作成するパーティションだけが影響を受けます。[データのバケット化](../../table-design/data-partitioning/data-bucketing)を参照してください |
| BE の `_stream_load_forward` エンドポイントでは、設定の有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を使用するデプロイ | すべての `be.conf` で `enable_group_commit_streamload_be_forward=true` を設定し、データロード用アカウントにグローバル `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |
| ノード管理 API でグローバル `ADMIN` 権限が必要になります | `/rest/v2/manager/node/{action}/{be\|fe\|broker}` を呼び出す自動化処理 | 呼び出し元に `ADMIN` アカウントによる認証を追加します。[Node Action](../open-api/fe-http/node-action)を参照してください |
| Stream Load で、リクエストを実際に処理するコンピュートグループへのアカウントのアクセス権が検証されます | 分離モードでの Stream Load | データロード用アカウントに、該当するコンピュートグループへのアクセス権を付与します。[Stream Load](../../data-operate/import/import-way/stream-load-manual)を参照してください |
| 分離モードでは、データサイズが一貫してリモートサイズとして報告されます | `SHOW TABLETS` または `information_schema.partitions` から容量を計算するスクリプト | 代わりに `REMOTE_DATA_SIZE` を使用します。[partitions](../system-tables/information_schema/partitions)を参照してください |
| Routine Load ジョブの機密性の高い Kafka プロパティーが、クエリ結果では `******` と表示されます | `SHOW ROUTINE LOAD` から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得してください。[SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD)を参照してください |
| ウォームアップのタイムスタンプ形式が `HH:mm:ss` から `yyyy-MM-dd HH:mm:ss` に変わります | ウォームアップジョブのステータスを解析するスクリプト | 時刻の解析形式を調整します。[読み書き分離](../../compute-storage-decoupled/rw/read-write-separation)を参照してください |
| スキャンエラーに `failed to initialize storage reader` という接頭辞が付かなくなります | その接頭辞に一致する監視ルール | 代わりにエラーコードと `tablet=` / `backend=` の情報を使用します |

### 4.1.4 へのアップグレード {#upgrading-to-414}

:::caution Nereids distribute planner が有効になります

バージョン 4.1.4 以降では、**3.x から 4.1.4 への**アップグレード時に、セッション変数 `enable_nereids_distribute_planner` のグローバルデフォルト値が `true` に更新されます。4.0 系列では、4.0.8 以降この動作になっています。

この更新は、クラスターの `variable_version` が `400` 未満の場合にのみ行われます。そのため、すでに 4.0.x または 4.1.x を実行しているクラスターでは、この変数に保存済みの値が維持されます。

アップグレード前後でクエリプランの分散方法が異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

:::caution 浮動小数点値の文字列表現が変わります

バージョン 4.1.4 以降では、FLOAT / DOUBLE 値を文字列に変換すると、固定の有効桁数ではなく、**再変換すると同じ値に戻る最短の文字列**が生成されます。保存されている値は変わりませんが、テキスト形式は 4.1.3 と異なる場合があります（例：`246.9120025634766` が `246.91200256347656` に、`0.0000123456` が `1.23456e-05` に変わります）。

これは、MySQL プロトコルのクエリ結果、`CAST(... AS STRING)`、複合型 / JSON / VARIANT の表示、`SELECT INTO OUTFILE`、EXPORT、外部テーブルの浮動小数点列に影響します。後続システムが浮動小数点値の文字列表現を厳密に比較する場合は、アップグレード後に調整してください。[浮動小数点型](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)を参照してください。

:::

4.1.4 へのアップグレード時には、以下の変更点にも注意が必要です。

**削除されたインターフェースと構文**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| `iceberg_meta()` テーブル関数が削除されます | このテーブル関数を通じて Iceberg メタデータを読み取る SQL | 代わりに Iceberg のシステムテーブル `<table>$<system_table_name>` を使用します。[ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta)を参照してください |
| FE の `/api/<ns>/<db>/<tbl>/upload` エンドポイントと FE 設定 `http_load_submitter_max_worker_threads` が削除されます | これらのエンドポイントを通じて小さなファイルをアップロードし、データロードするスクリプト | 代わりに Stream Load または S3 / HDFS / LOCAL TVF を使用します。[Upload Action](../open-api/fe-http/upload-action)を参照してください |
| `PLAN REPLAYER PLAY '<file>'` 文が削除されます | minidump を再生するデバッグ手順 | `PLAN REPLAYER DUMP` のみが残ります |
| ワークロードポリシーの `set_session_variable` アクションが削除されます | このアクションを使用するワークロードポリシー | 代わりに `cancel_query` / `move_query_to_group` を使用します |
| BE 設定 `get_stack_trace_tool` が削除され、BE スレッドスタックの HTTP 出力フィールドが変わります | BE スレッドスタックを収集するスクリプト | 新しい出力フィールドを解析します |
| 分離モードで BE 設定 `s3_client_retry_slow_down` が削除されます | この設定で S3 のスロットリング時のリトライを制御しているデプロイ | 設定は不要です。BE は S3 の 429 / 503 に対して常にリトライし、Recycler はリトライしません |
| クエリプロファイルから `HdfsIO` タイマーとその 7 つのカウンターが削除されます | プロファイルを解析する自動化処理 | 代わりにほかの IO 関連カウンターを使用します |

**デフォルト値と動作の変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成したテーブル | 新しく作成するパーティションだけが影響を受けます。[データのバケット化](../../table-design/data-partitioning/data-bucketing)を参照してください |
| FE 設定 `default_get_version_from_ms_timeout_second` のデフォルト値が 3 から 30 に変わります | 分離モード | 対応は不要です。Meta Service の一時的な変動によるクエリ失敗を減らします |
| BE 設定 `enable_cache_read_from_peer` のデフォルト値が `true` から `false` に変わり、`cache_read_from_peer_expired_seconds` が削除されます | コンピュートグループ間のピアキャッシュ読み取りを使用するデプロイ | 従来の動作を維持するには、`be.conf` で `enable_cache_read_from_peer=true` を明示的に設定します |
| セッション変数 `eager_aggregation_on_join` が削除され、`eager_aggregation_on_broadcast_join`（デフォルト `true`）と `eager_agg_broadcast_row_count`（デフォルト 250000）が追加されます | `eager_aggregation_on_join` を設定するセッションやスクリプト | この変数への代入を削除します |
| `jobs()` テーブル関数では、ストリーミングジョブの列 `Lag` が `LagBytes` に改名され、単位が秒からバイトに変わります。また、`LastSourceEventTimestamp` 列が追加されます | `jobs()` の出力を解析するスクリプト、`streaming_job_per_job_lag` メトリクスに基づく監視 | `LagBytes` 列と `streaming_job_per_job_lag_bytes` メトリクスを使用します。[継続的なデータロード](../../data-operate/import/import-way/streaming-job/continuous-load-overview)を参照してください |
| Arrow Flight SQL は `DATETIME` / `DATETIMEV2` を、**タイムゾーンなし**の Arrow Timestamp として返します（`TIMESTAMPTZ` は引き続きタイムゾーンを保持します） | Arrow Flight SQL で時刻列を読み取るクライアント | 値をタイムゾーンなしとして解釈します |
| 引数のいずれかに別の集約関数を含む集約関数は、`aggregate function cannot contain aggregate parameters` を報告するようになります | `group_concat(x ORDER BY sum(k))` のような既存の SQL | 先に集約し、その結果を参照するよう SQL を書き換えます |
| `default.replication_num` または `default.replication_allocation` を変更すると、競合する従来のプロパティーが削除されるようになります | メタデータに両方のプロパティーが残っている古いテーブル | 対応は不要です。`SHOW CREATE TABLE` と実際のレプリカ割り当てが一致するようになります。**ローリングアップグレード中は**、すべての FE のアップグレードが完了してから、この 2 つのプロパティーを変更してください。そうしないと、旧 FE と新 FE で異なるレプリカ設定が適用される可能性があります |
| Paimon の `paimon.table-option.*` カタログプロパティーは、7 つのキーからなる許可リストに制限されます | 許可リスト外の `paimon.table-option.*` キーを使用するカタログ | 許可リスト外のキーを削除します。[Paimon Catalog](../../lakehouse/catalogs/paimon-catalog)を参照してください |
| ストレージプロパティーに予約済みキー `doris.fs.cache.key` が追加され、暗黙のデフォルト値 `fs.<schema>.impl.disable.cache=true` が適用されなくなります | 外部ストレージを使用するカタログ / TVF | **FE ノードより先に BE ノードをアップグレードしてください** |
| 分離モードでは、`ADMIN SET FRONTEND CONFIG` の実行が `root` ユーザーに制限されます | root 以外のアカウントで実行時に FE 設定を変更するスクリプト | root アカウントを使用するか、代わりに `fe.conf` で設定します |
| FE 設定 `s3_load_endpoint_white_list`、`jdbc_driver_url_white_list`、`force_sqlserver_jdbc_encrypt_false` を実行時に変更できなくなります | `ADMIN SET FRONTEND CONFIG` でこれらの設定を変更するスクリプト | `fe.conf` で設定し、FE を再起動します |
| Routine Load の機密性の高い Kafka プロパティーと、`information_schema` の暗号化キーの `IV` / `CIPHER` 列が、クエリ結果では `******` と表示されます | これらの結果から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得してください |

**デプロイと設定ファイルの変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| JDK 17 の `JAVA_OPTS` では、`--add-opens=java.base/java.nio=ALL-UNNAMED` を `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED` に変更する必要があります | `fe.conf` / `be.conf` の `JAVA_OPTS_FOR_JDK_17` をカスタマイズしているデプロイ | 新リリースのパッケージに含まれる `fe.conf` / `be.conf` から、このオプションを反映してください。反映しないと、Arrow Flight SQL などの Arrow ベースの機能が起動または動作しない可能性があります |
| BE の `_stream_load_forward` エンドポイントでは、設定の有効化とリクエストの認証が必要になります | 分離モードで Group Commit の BE 転送を使用するデプロイ | すべての `be.conf` で `enable_group_commit_streamload_be_forward=true` を設定し、データロード用アカウントにグローバル `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |

### 4.1.5 へのアップグレード {#upgrading-to-415}

以下の変更点は 4.1.4.1 との比較です。アップグレード前に、V1 転置インデックスの設定、外部テーブルの型マッピング、過去の日付を含むファイルを確認してください。

**削除されたインターフェースと構文**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| V1 転置インデックスの作成が禁止され、既存の V1 テーブルにも転置インデックスを追加できなくなります | `CREATE TABLE`、`CREATE INDEX`、`ALTER TABLE ADD INDEX` | 新しいテーブルには V2 または V3 を使用します。既存のテーブルは引き続き読み取れます。新しいインデックスが必要な場合はテーブルを再作成してください。`ALTER TABLE` ではストレージ形式を変換できません |
| カスタム関数で可変長引数の `...` シグネチャーを使用できなくなります | Java / Python の UDF、UDAF、UDTF、ALIAS FUNCTION | 固定個数のパラメーターを使用するか、複数の値を受け取る単一の `ARRAY` パラメーターを使用します。[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION.md)を参照してください |
| `native` ファイル形式が削除されます | この形式を使用するファイルの読み取りまたはエクスポート | Parquet や ORC などのサポート対象形式を使用します。アップグレード前に、旧バージョンの Doris で古いファイルを変換してください |

**デフォルト値と動作の変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| カタログのバイナリ型は常に `VARBINARY` に、タイムゾーン付きタイムスタンプ型は常に `TIMESTAMPTZ` にマッピングされます | Hive、Iceberg、Paimon、および関連する JDBC の型マッピング | `enable.mapping.varbinary` と `enable.mapping.timestamp_tz` は互換性マーカーとして残りますが、`false` に設定しても以前のマッピングには戻せません。Master FE は古いカタログについて、これらのマーカーを `true` として保存します。クライアント側のフィールド型、タイムゾーン、明示的なキャストを確認してください |
| S3 / HDFS / LOCAL TVF は、タイムスタンプのタイムゾーンの意味を常に保持します | TVF を通じた Parquet UTC Timestamp または ORC `TIMESTAMP_INSTANT` の読み取り | 4.1.5 では、`enable_mapping_timestamp_tz` は互換性のために受け付けられますが、`false` でも無視されます。`enable_mapping_varbinary` は引き続き設定可能で、デフォルト値は `false` です。現在の開発ブランチでは、従来の両フラグを無視し、バイナリ型を常に `VARBINARY`、タイムゾーン付きタイムスタンプを常に `TIMESTAMPTZ` にマッピングします。[S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3.md)、[HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs.md)、[LOCAL TVF](../../sql-manual/sql-functions/table-valued-functions/local.md)を参照してください |
| BE 設定とセッション変数 `enable_file_cache` のデフォルト値が `false` から `true` に変わります | 統合モードでのリモートファイルの読み取り。コンピュートとストレージの分離モードの BE では、すでに強制的に有効になっています | キャッシュのパス、ディスク容量、既存の明示的な BE 設定、保存済みのグローバル変数を確認してください。[File Cache](../../compute-storage-decoupled/file-cache/file-cache.md)を参照してください |
| FE の `meta_service_rpc_rate_limit_enabled` がデフォルトで有効になり、新しいドライランモードもデフォルトで有効になります | コンピュートとストレージの分離モードでの FE から Meta Service への RPC | デフォルトではレート制限の評価と記録のみが行われます。実際に制限を適用するには `meta_service_rpc_rate_limit_dry_run=false` を設定します。新しい BE のドライランスイッチ 2 つも、実際の待機を発生させるには無効にする必要があります。[FE 設定](../config/fe-config.md#meta_service_rpc_rate_limit_dry_run)と[BE 設定](../config/be-config.md#enable_ms_rpc_host_level_rate_limit_dry_run)を参照してください |
| `cloud_version_syncer_interval_second` のデフォルト値が `20` 秒から `60` 秒に、`cloud_get_version_task_batch_size` が `2000` から `200` に変わり、新しい最大試行回数は `3` になります | バックグラウンドのバージョン同期を使用するコンピュートとストレージの分離クラスター | 従来の頻度またはバッチサイズが必要な場合は、値を明示的に設定します。間隔の変更には FE の再起動が必要です |
| FE の `streaming_cdc_fetch_splits_batch_size` のデフォルト値が `100` から `16` に、BE の `request_cdc_client_timeout_ms` が `60000` から `120000` に変わります | ストリーミング CDC の取り込み | 移行作業は不要です。スループットやタイムアウトを調整している場合は、明示的な設定を確認してください |
| 従来の LDAP 認証経路では、空のパスワードがデフォルトで拒否されます | LDAP の匿名 Bind に依存するログイン | 有効なパスワードを使用してください。互換性スイッチ `ldap_allow_empty_pass` のデフォルト値は `false` で、変更には FE の再起動が必要です。LDAP 認証プラグインは常に空のパスワードを拒否します。[LDAP](../auth/authentication/ldap.md#empty-password-login)を参照してください |
| コミット済みの Iceberg スナップショットでデータファイルまたは削除ファイルが見つからない場合、常にエラーになります | `ignore_not_found_file_in_external_table=true` を使用する Iceberg クエリ | 欠落ファイルを復元するか、有効なスナップショットを使用してください。このスイッチでは、コミット済みの Iceberg ファイルをスキップできなくなります |
| 無効な Iceberg の `schema.name-mapping.default` 値は、寛容に読み取られる代わりにエラーになります | 無効な名前マッピングプロパティーを持つテーブル | 書き込み側でプロパティーを修正または削除し、その後 Doris のメタデータを更新します。[Iceberg Catalog](../../lakehouse/catalogs/iceberg-catalog.mdx)を参照してください |
| Dictionary、ウォームアップ、制約などのコマンドに権限チェックが追加され、列レベルの GRANT / REVOKE では実行者自身の権限が確認されます | 関連する操作用アカウントと自動化スクリプト | 対象オブジェクトと関連オブジェクトに必要な権限を付与します。該当するコマンドのドキュメントを参照してください |
| root が新しく作成した AI Resources は、root だけが変更または削除できます | 4.1.5 以降に root マーカー付きで作成された AI Resources | これらの操作には root を使用してください。アップグレード前に作成され、マーカーがないリソースは影響を受けません。[AI Resources](../../sql-manual/sql-functions/ai-functions/overview.md)を参照してください |

**デプロイと設定ファイルの変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| 有効な FE 設定が `inverted_index_storage_format=V1` の場合、起動できません | `fe.conf` または `fe_custom.conf` で V1 を設定したクラスター | **アップグレード前に** `V2` または `V3` に変更し、`fe_custom.conf` が `fe.conf` の設定を上書きしていないか確認してください |
| Parquet エクスポートの `enable_int96_timestamps` のデフォルト値が `false` になり、論理型付きの INT64 タイムスタンプが使用されます | 従来の INT96 形式に依存する Outfile / Export の利用側 | 論理型付き INT64 タイムスタンプに対応していることを確認します。従来の形式が必要な場合は、`enable_int96_timestamps=true` を明示的に設定します。指定できる値は `true` と `false` のみです |
| 古い Doris の DATE エンコーディングを使用したファイルでは、西暦 0 年の日付にずれが生じる場合があります | Doris がエクスポートした、`0000-01-01` から `0000-02-28` を含む ORC / Parquet ファイル | ファイルの作成元を確認し、以下の手順で移行します。リーダーをアップグレードするだけでは元の日付を復元できません |
| 4.1.5 では、同梱の Thrift が 0.16.0 から 0.24.0 に、Iceberg SDK が 1.10.1 から 1.11.0 にアップグレードされます（現在の開発ブランチでは Iceberg SDK 1.12.0 を使用します） | Doris をビルドする、またはサードパーティーの依存アーティファクトを再利用するデプロイ | ビルドするバージョンのソースから依存関係を用意してください。古い Thrift ジェネレーターの再利用や、異なるバージョンの JAR の混在を避けてください |

#### コマンドの権限チェック {#command-privilege-checks}

バージョン 4.1.5 では、以下の操作経路に権限チェックが追加されます。運用スクリプトや権限を委任されたアカウントについては、対象オブジェクトと、連鎖的な操作で変更されるオブジェクトの両方に対する権限を確認してください。

| 操作 | 必要な権限 |
| --- | --- |
| `ADD CONSTRAINT` / `DROP CONSTRAINT` | 対象テーブルに対する `ALTER`。外部キーを追加する場合は参照先テーブルに対する `ALTER` も必要です。主キーを削除し、外部キーにも変更が波及する場合は、連鎖的に変更されるすべてのテーブルに対する `ALTER` も必要です |
| `CREATE DICTIONARY` / `DROP DICTIONARY` | 作成には Dictionary に対する `CREATE` と、そのソーステーブルに対する `SELECT` が必要です。削除には Dictionary に対する `DROP` が必要です |
| `WARM UP COMPUTE GROUP` | 対象グループと、指定されたソースグループに対する `USAGE`、および明示的に指定したテーブルに対する `SELECT` が必要です。`ON TABLES` ルールにはグローバル `ADMIN` も必要です |
| ウォームアップのキャンセル、カタログのごみ箱のクリーンアップ、ステージの削除、TDE ルートキーの管理 | グローバル `ADMIN` |
| 管理権限が必要な `/rest/v1` エンドポイント | Basic 認証と Cookie 認証のどちらでも、グローバル `ADMIN` または `NODE` が必要です。`/login` に成功するとユーザーは認証されますが、管理用エンドポイントへのアクセス権は付与されません |

メタデータのクエリも、より寛容になります。`information_schema.view_dependency` は、定義を解析できないビューや無効なオブジェクトを参照するビューがあっても、クエリ全体を失敗させず、それらのビューをスキップします。結果にビューが表示されない場合は、その定義と FE の警告ログを確認してください。行がないことは、そのビューに依存関係がないことを意味しません。

#### 西暦 0 年の DATE ファイルの移行 {#year-zero-date-file-migration}

バージョン 4.1.5 では、Arrow、Parquet、ORC V2 における DATE 値から先発グレゴリオ暦のエポック日への変換が修正されます。従来の Doris のエンコーディングでは、`0000-01-01` から `0000-02-28` について、想定より 1 大きいエポック日が書き込まれていました。`0000-03-01` 以降の日付には影響せず、`0000-02-29` は引き続き Doris のサポートする DATE の範囲外です。

古い値と有効な新しいエンコーディングを自動的に区別することはできません。ファイルの書き込み元を確認してください。**すべての DATE フィールド**で古い Doris のエンコーディングが使用されていると確認できたファイルには、このリリースのソースに含まれる[オフライン移行ツール](https://github.com/apache/doris/tree/4.1.5-release/tools/legacy_date_migration)を使用します。

```bash
python tools/legacy_date_migration/migrate_legacy_dates.py \
  --input legacy.parquet --output migrated.parquet --format parquet \
  --confirm-legacy-doris-date-encoding
```

ORC ファイルの場合は、`--format` を `orc` に変更します。このツールには Python 3.8+ と、選択した形式をサポートする PyArrow が必要です。新しいファイルを書き込み、元のファイルは上書きしません。ほかの書き込み元によるファイル、異なる作成元のデータが混在するファイル、移行済みのファイルには実行しないでください。移行後は `enable_file_scanner_v2=true` を使用し、利用側を切り替える前に、境界となる日付、行数、NULL 値を信頼できるデータと照合してください。Iceberg などのテーブル形式では、データファイルをその場で置き換えないでください。パーティション、統計情報、スナップショットのメタデータが整合性を保って再計算されるよう、テーブル形式の書き込み機能を使ってテーブルを再作成するか、サポートされるトランザクション型の書き換えを実行してください。

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### Q：アップグレード後、BE / FE ノードの `Alive` が `false` で、`Version` も旧バージョンのままです。どうすればよいですか？ {#q-after-the-upgrade-a-be--fe-node-shows-alive-as-false-and-version-is-still-the-old-version-what-should-i-do}

プロセスが起動していないか、新バージョンの起動に失敗しています。`be.log` / `fe.log` のエラーログを確認し、`/bin` と `/lib` が正しく置き換えられていることを確認してください。

### Q：アップグレード後、メタデータの非互換性エラーで FE が起動しません。どうすればよいですか？ {#q-after-the-upgrade-the-fe-fails-to-start-with-a-metadata-incompatibility-error-what-should-i-do}

バージョン間の隔たりが大きすぎたか、メタデータ互換性テストを実施していません。旧バージョンにロールバックし、このドキュメントの「メタデータ互換性テスト」の手順に従ってテストを実施してください。必要に応じて段階的にアップグレードします。

### Q：アップグレード後、`custom_lib/` 内の jar ファイルが見つかりません。何が起きたのですか？ {#q-after-the-upgrade-jar-files-in-custom_lib-are-missing-what-happened}

誤って `custom_lib/` を上書きした可能性があります。置き換えるのは `/bin` と `/lib` のみで、`custom_lib/` は置き換えてはいけません。

### Q：アップグレード中に Stream Load タスクが失敗します。なぜですか？ {#q-stream-load-tasks-fail-during-the-upgrade-why}

ノードの再起動によってクライアント接続が中断されるためです。クライアント側にリトライ処理を追加してください。Routine Load と Flink/Spark Doris Connector にはリトライ処理が組み込まれています。

### Q：アップグレード後、レプリカ数が異常になったり、レプリカの移行が頻繁に発生したりします。原因は何ですか？ {#q-after-the-upgrade-the-replica-count-is-abnormal-or-replica-migration-happens-frequently-what-is-wrong}

`disable_balance` / `disable_tablet_scheduler` をアップグレード前に無効にしていなかったか、アップグレード後に再び有効にしていなかった可能性があります。これらの設定の有効化と無効化の流れを確認してください。アップグレード前に無効にし、完了後に再び有効にします。

### Q：マイナーバージョンをまたぐアップグレードに失敗しました。なぜですか？ {#q-a-cross-minor-version-upgrade-failed-why}

バージョンを順番にアップグレードしていなかったためです。ロールバックし、`3.0 to 3.1 to 3.2 to 3.3` のように段階的にアップグレードしてください。

### Q：FE が 1 台のクラスターでアップグレードに失敗し、メタデータが失われました。どうすればよいですか？ {#q-a-single-fe-cluster-upgrade-failed-and-metadata-was-lost-what-should-i-do}

メタデータ互換性テストを実施していませんでした。アップグレード前に FE 3 台の高可用性構成に拡張するか、開発用マシンまたは BE ノードでメタデータ互換性テストを実施してください。
