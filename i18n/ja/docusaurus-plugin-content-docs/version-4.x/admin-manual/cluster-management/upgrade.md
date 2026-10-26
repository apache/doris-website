---
{
    "title": "クラスターのアップグレード",
    "language": "ja",
    "description": "Apache Doris クラスターのローリングアップグレードガイド。バージョン互換性のルール、メタデータ互換性テスト、BE/FE ノードのアップグレード手順、よくある問題への対処を説明します。",
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

Apache Doris は、FE ノードと BE ノードのバイナリを順次置き換えるローリングアップグレードに対応しています。これにより、ダウンタイムを最小限に抑え、アップグレード中もクラスターを利用できます。このドキュメントはクラスター管理者向けに、バージョン互換性のルール、メタデータ互換性テストの手順、詳細なアップグレード手順を説明します。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 適用可否 | 備考 |
| --- | --- | --- |
| 同じマイナーバージョン内でのパッチバージョンのアップグレード（例：2.1.3 から 2.1.7） | 可能 | ローリングアップグレードを直接実行できます |
| マイナーバージョンをまたぐアップグレード（例：3.0 から 3.3） | 段階的に実行すれば可能 | 3.0 から 3.1、3.1 から 3.2、3.2 から 3.3 の順にアップグレードします |
| メジャーバージョンのアップグレード（例：2.x から 3.x） | 段階的に実行すれば可能 | メジャーバージョンをまたいで直接アップグレードすることは推奨しません。マイナーバージョンごとに順次アップグレードしてください |
| FE が 1 台のクラスターのアップグレード | 互換性テスト後に可能 | 先に FE が 3 台の高可用性構成へ拡張するか、アップグレード前にメタデータ互換性テストを実行します |
| メタデータに互換性がない可能性があるバージョン間のアップグレード | 互換性テスト後に可能 | アップグレード前にメタデータ互換性を確認する必要があります |

## 前提条件 {#prerequisites}

アップグレードを実行する前に、以下を確認してください。

- 対象バージョンのリリースノートを読み、バージョン間の動作変更と互換性を把握していること。
- アップグレードが失敗してもデータが失われないよう、データを 3 レプリカで保存していること。
- クライアントのタスクに再試行処理が実装されていること（後述の「アップグレード時の注意事項」を参照）。
- メタデータ互換性テストに使用できる開発マシンまたは BE ノードがあること。
- 対象バージョンのインストールパッケージをダウンロードして展開済みであること（以下の手順では、`${DORIS_NEW_HOME}` は新バージョンのルートディレクトリ、`${DORIS_OLD_HOME}` は本番環境で稼働中の旧バージョンのルートディレクトリを指します）。

## バージョン互換性 {#version-compatibility}

Doris のバージョン番号は 3 桁で構成されます。第 1 桁はメジャーマイルストーンバージョン、第 2 桁は機能バージョン、第 3 桁はバグ修正バージョンです。第 3 桁のみが変わるバージョンでは、新機能はリリースされません。Doris 2.1.3 を例にすると、次のようになります。

| 位置 | 値の例 | 意味 |
| --- | --- | --- |
| 第 1 桁 | 2 | 2 番目のマイルストーンバージョン |
| 第 2 桁 | 1 | そのマイルストーンに属する機能バージョン |
| 第 3 桁 | 3 | その機能バージョンに属する 3 番目のバグ修正バージョン |

アップグレード時は、次のルールに従ってください。

| アップグレードの種類 | バージョンをまたぐアップグレード | 推奨される経路 |
| --- | --- | --- |
| 第 3 桁のバージョン（第 2 桁が同じ） | 対応 | 例：2.1.3 から 2.1.7 へ直接アップグレードします |
| 第 2 桁のバージョン | 飛び越しは非推奨 | 例：3.0 から 3.1、3.2、3.3 へ、第 2 桁のバージョンごとに順次アップグレードします |
| 第 1 桁のバージョン | 飛び越しは非推奨 | まず同じ第 1 桁の中で最新の第 2 桁のバージョンにアップグレードし、その後メジャーバージョンをまたいでアップグレードします |

バージョンの詳細については、[バージョン番号のルール](https://doris.apache.org/community/release-and-verify/release-versioning)を参照してください。

## アップグレード時の注意事項 {#upgrade-considerations}

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード前に、次の 3 点に注意してください。

| 注意事項 | 対処方法 |
| --- | --- |
| バージョン間の動作変更 | アップグレード前に対象バージョンのリリースノートを読み、互換性のない動作変更がないか確認します |
| クライアントタスクの再試行 | アップグレード中はノードを順番に再起動するため、Stream Load とクエリタスクには再試行処理が必要です。Routine Load、Flink Doris Connector、Spark Doris Connector には再試行機能が組み込まれているため、追加の対応は不要です |
| レプリカの修復とバランシング | アップグレード前にレプリカの修復とバランシングを無効にする必要があります。アップグレードの成否にかかわらず、完了後には再度有効にしてください |

:::caution 注意

Doris のアップグレードでは、FE ディレクトリ内の `/bin` と `/lib`、および BE ディレクトリ内の `/bin` と `/lib` を置き換えるだけで済みます。

バージョン 2.0.2 以降では、FE と BE の両方の配置パスに `custom_lib/` ディレクトリが追加されています（存在しない場合は手動で作成してください）。このディレクトリには、ユーザーが追加したサードパーティーの jar ファイル（`hadoop-lzo-*.jar` や `orai18n.jar` など）を保存します。アップグレード時に置き換える必要はありません。

:::

## メタデータ互換性テスト {#metadata-compatibility-test}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

メタデータ互換性テストでは、新バージョンが既存のメタデータを正しく読み込めることをアップグレード前に確認します。これにより、アップグレード失敗に伴うデータ損失を防ぎます。アップグレードのたびに、このテストを実行することを推奨します。

:::caution 注意

本番環境では、3 台以上の FE ノードによる高可用性構成を推奨します。FE ノードが 1 台だけの場合は、アップグレード前にメタデータ互換性テストを必ず実行してください。メタデータ互換性は極めて重要です。互換性がないためにアップグレードが失敗すると、データが失われる可能性があります。

次の点にも注意してください。

- メタデータ互換性テストは、開発マシンまたは BE ノードで実行し、FE ノードでの実行は避けることを推奨します。
- FE ノードでしかテストを実行できない場合は、Master ではないノードを選び、先にそのノードの元の FE プロセスを停止してください。

:::

### 1. メタデータをバックアップする {#1-back-up-metadata}

アップグレードを開始する前に、Master FE ノードのメタデータをバックアップします。

Master FE ノードは、`IsMaster` 列で識別できます。この列は `show frontends` で確認できます。FE メタデータは FE プロセスを停止せずにバックアップできます。デフォルトでは、FE メタデータは `fe/doris-meta` ディレクトリに保存されています。メタデータディレクトリは、`fe.conf` の `meta_dir` パラメーターでも確認できます。

### 2. テスト用の FE 設定ファイルを変更する {#2-modify-the-fe-configuration-file-for-testing}

テスト環境の `fe.conf` を編集します。

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

すべてのポートを本番環境と異なる値に設定し、`clusterId` パラメーターも変更します。

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

テスト環境のポート設定例は次のとおりです。

| パラメーター | 設定例 | 説明 |
| --- | --- | --- |
| `http_port` | 18030 | FE HTTP サービスのポート |
| `rpc_port` | 19020 | FE Thrift Server のポート |
| `query_port` | 19030 | FE MySQL プロトコルのクエリポート |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL のポート |
| `edit_log_port` | 19010 | FE BDBJE 通信用ポート |
| `clusterId` | 123456 | テストクラスターの ID。本番環境とは異なる値にします |

### 3. Master FE のメタデータをコピーする {#3-copy-the-master-fe-metadata}

バックアップした Master FE のメタデータを、新しい互換性テスト環境にコピーします。

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. メタデータの VERSION ファイルにある cluster\_id を変更する {#4-modify-the-cluster_id-in-the-metadata-version-file}

コピーしたメタデータディレクトリ内の `VERSION` ファイルにある `cluster_id` を、新しいクラスター ID に変更します。たとえば、上記の例では 123456 にします。

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. テスト環境の FE プロセスを起動する {#5-start-the-fe-process-in-the-test-environment}

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

バージョン 2.0.2 より前では、先に `fe.conf` に `metadata_failure_recovery=true` を追加してから FE プロセスを起動します。

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. FE が正常に起動したことを確認する {#6-verify-that-the-fe-started-successfully}

MySQL クライアントからテスト用 FE に接続します。次の例では、上記の `query_port` 19030 を使用します。

```shell
mysql -uroot -P19030 -h127.0.0.1
```

接続に成功したら、新バージョンは現在のメタデータを正しく読み込めており、メタデータ互換性テストは合格です。

## アップグレードの流れ {#upgrade-flow-overview}

アップグレード全体の流れは次のとおりです。必ずこの順番で実行してください。

1. レプリカの修復とバランシングを無効にします。
2. BE ノードをアップグレードします（複数レプリカのクラスターではカナリアアップグレードが可能です）。
3. FE ノードをアップグレードします（Observer/Follower ノードを先に、Master を最後にアップグレードします）。
4. レプリカの修復とバランシングを再度有効にします。

基本原則は、**先に BE、次に FE をアップグレードする**ことです。FE のアップグレードでは、**Observer FE ノードと Follower FE ノードを先にアップグレードし、Master FE ノードを最後にアップグレードします**。

## アップグレード手順 {#upgrade-steps}

### ステップ 1：レプリカの修復とバランシングを無効にする {#step-1-disable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

アップグレード中のノード再起動により、不要なクラスターのバランシングやレプリカ修復が発生する可能性があります。最初に、次の 3 つの設定を無効にします。

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

対象となる設定は次のとおりです。

| 設定 | アップグレード前の値 | 効果 |
| --- | --- | --- |
| `disable_balance` | `true` | レプリカのバランシングを無効にし、ノード再起動によるレプリカ移行を防ぎます |
| `disable_colocate_balance` | `true` | Colocate Join テーブルのレプリカのバランシングを無効にします |
| `disable_tablet_scheduler` | `true` | タブレットのスケジューリングを無効にし、レプリカの修復を防ぎます |

### ステップ 2：BE ノードをアップグレードする {#step-2-upgrade-be-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info 注意

データの安全性を確保するため、アップグレード時の誤操作や障害によるデータ損失を避けられるよう、データを 3 レプリカで保存してください。

:::

複数レプリカのクラスターでは、BE ノードを 1 台選んでカナリアアップグレードを実行できます。その動作を確認した後、残りのノードを 1 台ずつアップグレードします。

#### 2.1 アップグレード対象の BE ノードを停止する {#21-stop-the-be-node-to-be-upgraded}

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 既存の `/bin` と `/lib` ディレクトリをバックアップする {#22-back-up-the-existing-bin-and-lib-directories}

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 新バージョンの `/bin` と `/lib` ディレクトリをコピーする {#23-copy-the-new-versions-bin-and-lib-directories}

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

BE ノードの `Alive` が `true` で、`Version` が新バージョンを示していれば、そのノードのアップグレードは成功です。確認後、残りの BE ノードも同じ方法で 1 台ずつアップグレードします。

### ステップ 3：FE ノードをアップグレードする {#step-3-upgrade-fe-nodes}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

FE ノードが複数ある場合は、Master 以外のノード（Observer または Follower）を先にアップグレードし、すべて完了してから Master ノードを最後にアップグレードします。

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

FE ノードの `Alive` が `true` で、`Version` が新バージョンを示していれば、そのノードのアップグレードは成功です。

#### 3.6 残りの FE ノードを 1 台ずつアップグレードする {#36-upgrade-the-remaining-fe-nodes-one-by-one}

Master 以外の残りの FE ノードを同じ方法で 1 台ずつアップグレードし、**Master FE ノードは最後にアップグレードします**。

### ステップ 4：レプリカの修復とバランシングを再度有効にする {#step-4-re-enable-replica-repair-and-balance}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

アップグレードが完了し、すべての BE ノードの `Alive` が true に戻ったら、クラスターのレプリカ修復とバランシングを再度有効にします。

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## バージョン別のアップグレードに関する注意事項 {#per-version-upgrade-notes}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

このセクションでは、特定のバージョンにアップグレードする際に特に注意が必要な動作変更を記載します。変更点の全体については、このセクションに加えて、必ず対象バージョンのリリースノートを確認してください。

### 3.x から 4.0 へのアップグレード時のセッション変数の移行 {#session-variable-migration-when-upgrading-from-3x-to-40}

FE は、内部変数 `variable_version` を使用してセッション変数のデフォルト値の移行状況を追跡します。3.x から 4.0 へアップグレードする際（`variable_version` が 400 未満の場合）、FE は次の変数の**グローバルデフォルト値**を自動的に調整します。

| 変数 | 移行後のデフォルト値 | 説明 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | アップグレード後に意味が変わらないよう、3.x のクエリ構成の動作を維持します |
| `enable_new_type_coercion_behavior` | `false` | 3.x の型強制変換の動作を維持します |
| `enable_sql_cache` | `true` | SQL Cache を有効にします |
| `enable_nereids_distribute_planner` | `true` | **バージョン 4.0.8 で追加された移行項目**です。詳細は後述します |

移行は、`variable_version` が 400 未満から 400 に引き上げられるときに一度だけ実行されます。その後にユーザーが明示的に設定した値が上書きされることはありません。

### 4.0.8 へのアップグレード {#upgrading-to-408}

:::caution Nereids distribute planner が有効になります

バージョン 4.0.8 以降では、3.x から 4.0 にアップグレードすると、Nereids distribute planner（`enable_nereids_distribute_planner`）が有効になります。

4.0.8 より前は、クラスターのメタデータイメージに `enable_nereids_distribute_planner=false` が保存されていた場合、アップグレード後もその値がそのまま復元され、従来の distribute planner が使われ続けました。バージョン 4.0.8 では、この変数が `variable_version=400` の移行対象に追加され、アップグレード後に新しい distribute planner が一貫して有効になります。

クエリプランの分散がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

4.0.8 へのアップグレードでは、次の変更点にも注意が必要です。

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| メモリ使用量が多い場合でも Compaction が一時停止されなくなります（BE 設定 `enable_compaction_pause_on_high_memory` のデフォルト値が `true` → `false` に変更） | すべてのデプロイモード | 従来の動作を維持するには `true` に戻します。[BE の設定](../config/be-config)を参照してください |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成されたテーブル | 新しく作成されるパーティションにのみ影響します。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| BE の `_stream_load_forward` エンドポイントは、設定の有効化とリクエストの認証を必要とします | 分離モードで Group Commit の BE 転送を利用する環境 | 各 `be.conf` で `enable_group_commit_streamload_be_forward=true` を設定し、データロード用アカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |
| ノード管理 API にグローバルな `ADMIN` 権限が必要になります | `/rest/v2/manager/node/{action}/{be\|fe\|broker}` を呼び出す自動化処理 | 呼び出し元に `ADMIN` アカウントによる認証を追加します。[Node Action](../open-api/fe-http/node-action)を参照してください |
| Stream Load は、リクエストを実際に処理するコンピュートグループへのアカウントのアクセス権を検証します | 分離モードの Stream Load | データロード用アカウントに、該当するコンピュートグループへのアクセス権を付与します。[Stream Load](../../data-operate/import/import-way/stream-load-manual)を参照してください |
| 分離モードでは、データサイズが一貫してリモートサイズとして報告されます | `SHOW TABLETS` または `information_schema.partitions` から容量を計算するスクリプト | 代わりに `REMOTE_DATA_SIZE` を使用します。[partitions](../system-tables/information_schema/partitions)を参照してください |
| Routine Load ジョブの機密性の高い Kafka プロパティーは、クエリ結果で `******` としてマスクされます | `SHOW ROUTINE LOAD` から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得します。[SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD)を参照してください |
| ウォームアップのタイムスタンプ形式が `HH:mm:ss` から `yyyy-MM-dd HH:mm:ss` に変わります | ウォームアップジョブの状態を解析するスクリプト | 時刻の解析形式を調整します。[読み書きの分離](../../compute-storage-decoupled/rw/read-write-separation)を参照してください |
| スキャンエラーに `failed to initialize storage reader` というプレフィックスが付かなくなります | このプレフィックスに一致させる監視ルール | 代わりにエラーコードと `tablet=` / `backend=` の情報を使用します |

### 4.1.4 へのアップグレード {#upgrading-to-414}

:::caution Nereids distribute planner が有効になります

バージョン 4.1.4 以降では、**3.x から 4.1.4 への**アップグレード時に、セッション変数 `enable_nereids_distribute_planner` のグローバルデフォルト値が `true` に更新されます。4.0 系列では、4.0.8 以降、同じ動作になっています。

この更新は、クラスターの `variable_version` が `400` 未満の場合にのみ行われます。そのため、すでに 4.0.x または 4.1.x を実行しているクラスターでは、この変数に保存済みの値が維持されます。

クエリプランの分散がアップグレード前と異なる場合は、`SET GLOBAL enable_nereids_distribute_planner = false;` で元に戻し、影響を受けたクエリを報告してください。

:::

:::caution 浮動小数点値の文字列表現が変わります

バージョン 4.1.4 以降では、FLOAT / DOUBLE 値を文字列に変換すると、固定桁数の有効数字ではなく、**再び元の値に変換できる最短の文字列**が生成されます。保存されている値は変わりませんが、テキスト表現が 4.1.3 と異なる場合があります（例：`246.9120025634766` は `246.91200256347656` に、`0.0000123456` は `1.23456e-05` になります）。

これは、MySQL プロトコルのクエリ結果、`CAST(... AS STRING)`、複合型 / JSON / VARIANT の表示、`SELECT INTO OUTFILE`、EXPORT、外部テーブルの浮動小数点列に影響します。下流のシステムで浮動小数点値の文字列表現を完全一致で比較している場合は、アップグレード後に調整してください。[浮動小数点型](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)を参照してください。

:::

4.1.4 へのアップグレードでは、次の変更点にも注意が必要です。

**削除されたインターフェースと構文**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| `iceberg_meta()` テーブル関数が削除されます | このテーブル関数を使って Iceberg のメタデータを読み取る SQL | 代わりに Iceberg システムテーブル `<table>$<system_table_name>` を使用します。[ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta)を参照してください |
| FE の `/api/<ns>/<db>/<tbl>/upload` エンドポイントと FE 設定 `http_load_submitter_max_worker_threads` が削除されます | これらのエンドポイントを通じてデータロード用の小さなファイルをアップロードするスクリプト | 代わりに Stream Load または S3 / HDFS / LOCAL TVF を使用します。[Upload Action](../open-api/fe-http/upload-action)を参照してください |
| `PLAN REPLAYER PLAY '<file>'` 文が削除されます | minidump を再生するデバッグ手順 | `PLAN REPLAYER DUMP` のみが残ります |
| ワークロードポリシーの `set_session_variable` アクションが削除されます | このアクションを使用するワークロードポリシー | 代わりに `cancel_query` / `move_query_to_group` を使用します |
| BE 設定 `get_stack_trace_tool` が削除され、BE スレッドスタックの HTTP 出力フィールドが変わります | BE スレッドスタックを収集するスクリプト | 新しい出力フィールドを解析するよう変更します |
| 分離モードの BE 設定 `s3_client_retry_slow_down` が削除されます | この設定で S3 スロットリング時の再試行を制御している環境 | 設定は不要です。BE は S3 の 429 / 503 に対して常に再試行し、Recycler は再試行しません |
| クエリプロファイルから `HdfsIO` タイマーとその 7 つのカウンターが削除されます | プロファイルを解析する自動化処理 | 代わりに、ほかの IO 関連カウンターを使用します |

**デフォルト値と動作の変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| 自動バケット数の最小値が 1 から 3 に引き上げられます（FE 設定 `autobucket_min_buckets`） | `BUCKETS AUTO` で作成されたテーブル | 新しく作成されるパーティションにのみ影響します。[データのバケット分割](../../table-design/data-partitioning/data-bucketing)を参照してください |
| セッション変数 `max_scanners_concurrency` のデフォルト値が 4 から 8 に変わります | すべてのクエリ | 従来の動作を維持するには 4 に戻します |
| FE 設定 `default_get_version_from_ms_timeout_second` のデフォルト値が 3 から 30 に変わります | 分離モード | 対応は不要です。Meta Service の応答時間の変動によるクエリ失敗が減ります |
| BE 設定 `enable_cache_read_from_peer` のデフォルト値が `true` から `false` に変わり、`cache_read_from_peer_expired_seconds` が削除されます | コンピュートグループ間でピアキャッシュの読み取りを利用している環境 | 従来の動作を維持するには、`be.conf` で `enable_cache_read_from_peer=true` を明示的に設定します |
| セッション変数 `eager_aggregation_on_join` が削除され、`eager_aggregation_on_broadcast_join`（デフォルト値 `true`）と `eager_agg_broadcast_row_count`（デフォルト値 250000）が追加されます | `eager_aggregation_on_join` を設定するセッションやスクリプト | この変数への代入を削除します |
| `jobs()` テーブル関数では、ストリーミングジョブの `Lag` 列が `LagBytes` に改名され、単位が秒からバイトに変わります。また、`LastSourceEventTimestamp` 列が追加されます | `jobs()` の出力を解析するスクリプト、`streaming_job_per_job_lag` メトリクスに基づく監視 | `LagBytes` 列と `streaming_job_per_job_lag_bytes` メトリクスを使用します。[継続的データロード](../../data-operate/import/import-way/streaming-job/continuous-load-overview)を参照してください |
| Arrow Flight SQL は、`DATETIME` / `DATETIMEV2` を**タイムゾーンなし**の Arrow Timestamp として返します（`TIMESTAMPTZ` は引き続きタイムゾーン付き） | Arrow Flight SQL 経由で時刻列を読み取るクライアント | 値をタイムゾーンなしとして解釈します |
| 引数の中に別の集約関数を含む集約関数は、`aggregate function cannot contain aggregate parameters` を報告するようになります | `group_concat(x ORDER BY sum(k))` などの既存の SQL | 先に集約し、その結果を参照するよう SQL を書き換えます |
| `default.replication_num` または `default.replication_allocation` を変更すると、競合する旧プロパティーが削除されるようになります | メタデータに両方のプロパティーが残っている既存のテーブル | 対応は不要です。`SHOW CREATE TABLE` と実際のレプリカ割り当てが一致するようになります。**ローリングアップグレード中は**、すべての FE のアップグレードが完了してからこの 2 つのプロパティーを変更してください。そうしないと、旧 FE と新 FE で異なるレプリカ設定が適用される可能性があります |
| Paimon の `paimon.table-option.*` カタログプロパティーが、7 つのキーからなる許可リストに制限されます | それ以外の `paimon.table-option.*` キーを使用するカタログ | 許可リストにないキーを削除します。[Paimon Catalog](../../lakehouse/catalogs/paimon-catalog)を参照してください |
| ストレージプロパティーに予約済みキー `doris.fs.cache.key` が追加され、暗黙のデフォルト設定 `fs.<schema>.impl.disable.cache=true` が適用されなくなります | 外部ストレージを使用するカタログ / TVF | **FE ノードより先に BE ノードをアップグレードしてください** |
| 分離モードでは、`ADMIN SET FRONTEND CONFIG` を実行できるユーザーが `root` に制限されます | root 以外のアカウントで実行時に FE 設定を変更するスクリプト | root アカウントを使用するか、代わりに `fe.conf` に設定します |
| FE 設定 `s3_load_endpoint_white_list`、`jdbc_driver_url_white_list`、`force_sqlserver_jdbc_encrypt_false` は実行時に変更できなくなります | `ADMIN SET FRONTEND CONFIG` でこれらの設定を変更するスクリプト | `fe.conf` に設定し、FE を再起動します |
| Routine Load の機密性の高い Kafka プロパティーと、`information_schema` の暗号化キーの `IV` / `CIPHER` 列は、クエリ結果で `******` としてマスクされます | これらの結果から認証情報を読み取るスクリプト | 元の値は設定管理システムから取得します |

**デプロイと設定ファイルの変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| JDK 17 の `JAVA_OPTS` で、`--add-opens=java.base/java.nio=ALL-UNNAMED` を `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED` に変更する必要があります | `fe.conf` / `be.conf` の `JAVA_OPTS_FOR_JDK_17` をカスタマイズしている環境 | 新しいリリースパッケージに含まれる `fe.conf` / `be.conf` からこのオプションを反映します。反映しない場合、Arrow Flight SQL などの Arrow ベースの機能が起動または動作できない可能性があります |
| be-java-extensions の `paimon-scanner` モジュールが `paimon-connector` に改名されます | `be/lib/java_extensions/paimon-scanner` を参照する独自のデプロイスクリプト | パスを `paimon-connector` に変更します |
| BE の `_stream_load_forward` エンドポイントは、設定の有効化とリクエストの認証を必要とします | 分離モードで Group Commit の BE 転送を利用する環境 | 各 `be.conf` で `enable_group_commit_streamload_be_forward=true` を設定し、データロード用アカウントにグローバルな `LOAD` 権限があることを確認します。[Group Commit](../../data-operate/import/load-best-practices/group-commit-manual)を参照してください |

### 4.1.5 へのアップグレード {#upgrading-to-415}

以下の変更点は 4.1.4.1 との比較です。アップグレード前に、V1 転置インデックスの設定、外部テーブルの型マッピング、過去の日付を含むファイルを確認してください。

**削除されたインターフェースと構文**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| V1 転置インデックスの作成が禁止され、既存の V1 テーブルに転置インデックスを追加できなくなります | `CREATE TABLE`、`CREATE INDEX`、`ALTER TABLE ADD INDEX` | 新しいテーブルには V2 または V3 を使用します。既存のテーブルは引き続き読み取れます。新しいインデックスが必要な場合はテーブルを作り直してください。`ALTER TABLE` ではストレージ形式を変換できません |
| カスタム関数で可変長引数の `...` シグネチャーが使用できなくなります | Java / Python の UDF、UDAF、UDTF、ALIAS FUNCTION | 固定数のパラメーター、または複数の値を受け取る単一の `ARRAY` パラメーターを使用します。[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION.md)を参照してください |
| `native` ファイル形式が削除されます | この形式を使用するファイルの読み取りやエクスポート | Parquet や ORC など、対応する形式を使用します。古いファイルは、アップグレード前に旧バージョンの Doris で変換してください |

**デフォルト値と動作の変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| カタログのバイナリ型は常に `VARBINARY` に、タイムゾーン付きタイムスタンプ型は常に `TIMESTAMPTZ` にマッピングされます | Hive、Iceberg、Paimon、および関連する JDBC の型マッピング | `enable.mapping.varbinary` と `enable.mapping.timestamp_tz` は互換性のためのマーカーとして残りますが、`false` に設定しても以前のマッピングには戻せません。Master FE は、古いカタログのマーカーを `true` として保存します。クライアント側のフィールド型、タイムゾーン、明示的なキャストを確認してください |
| S3 / HDFS / LOCAL TVF では、タイムスタンプのタイムゾーンの意味が常に保持されます | TVF を介して Parquet の UTC Timestamp または ORC の `TIMESTAMP_INSTANT` を読み取る場合 | `enable_mapping_timestamp_tz` は互換性のために受け付けられますが、`false` に設定しても無視されます。TVF パラメーター `enable_mapping_varbinary` は引き続き設定可能で、デフォルト値は `false` です |
| BE 設定とセッション変数 `enable_file_cache` のデフォルト値が `false` から `true` に変わります | 統合モードでのリモートファイルの読み取り。コンピュートとストレージの分離モードの BE では、すでに強制的に有効になっています | キャッシュパス、ディスク容量、既存の明示的な BE 設定、保存済みのグローバル変数を確認します。[File Cache](../../compute-storage-decoupled/file-cache/file-cache.md)を参照してください |
| FE の `meta_service_rpc_rate_limit_enabled` がデフォルトで有効になり、新しいドライランモードもデフォルトで有効になります | コンピュートとストレージの分離モードにおける FE から Meta Service への RPC | デフォルトでは、レート制限を評価して記録するだけです。制限を適用するには `meta_service_rpc_rate_limit_dry_run=false` を設定します。新しい 2 つの BE ドライランスイッチも、実際に待機を発生させるには無効にする必要があります。[FE の設定](../config/fe-config.md#meta_service_rpc_rate_limit_dry_run)と[BE の設定](../config/be-config.md#enable_ms_rpc_host_level_rate_limit_dry_run)を参照してください |
| `cloud_version_syncer_interval_second` のデフォルト値が `20` から `60` 秒に、`cloud_get_version_task_batch_size` が `2000` から `200` に変わり、新しい最大試行回数は `3` になります | バックグラウンドでバージョンを同期する、コンピュートとストレージが分離されたクラスター | 従来の頻度やバッチサイズが必要な場合は、値を明示的に設定します。間隔の変更には FE の再起動が必要です |
| FE の `streaming_cdc_fetch_splits_batch_size` のデフォルト値が `100` から `16` に、BE の `request_cdc_client_timeout_ms` が `60000` から `120000` に変わります | Streaming CDC による取り込み | 移行作業は不要です。スループットやタイムアウトを調整している場合は、明示的な設定を確認してください |
| 従来の LDAP 認証経路では、空のパスワードがデフォルトで拒否されます | LDAP の未認証 Bind に依存するログイン | 有効なパスワードを使用します。互換性用スイッチ `ldap_allow_empty_pass` のデフォルト値は `false` で、変更には FE の再起動が必要です。LDAP 認証プラグインでは、空のパスワードが常に拒否されます。[LDAP](../auth/authentication/ldap.md#empty-password-login)を参照してください |
| コミット済みの Iceberg スナップショットでデータファイルまたは削除ファイルが見つからない場合、常にエラーになります | `ignore_not_found_file_in_external_table=true` を使用する Iceberg クエリ | 見つからないファイルを復元するか、有効なスナップショットを使用します。このスイッチでは、コミット済みの Iceberg ファイルをスキップできなくなります |
| 無効な Iceberg `schema.name-mapping.default` 値は、許容して読み取る代わりにエラーになります | 無効な名前マッピングプロパティーを持つテーブル | 書き込み側からプロパティーを修正または削除し、Doris のメタデータを更新します。[Iceberg Catalog](../../lakehouse/catalogs/iceberg-catalog.mdx)を参照してください |
| Dictionary、ウォームアップ、制約などのコマンドに権限チェックが追加され、列レベルの GRANT / REVOKE では操作するユーザー自身の権限が確認されます | 関連する操作用アカウントと自動化スクリプト | 対象オブジェクトと関連オブジェクトに必要な権限を付与します。各コマンドのドキュメントを参照してください |
| root が新規作成した AI Resources は、root のみが変更または削除できます | 4.1.5 以降に root マーカー付きで作成された AI Resources | これらの操作には root を使用します。アップグレード前に作成され、マーカーがないリソースは影響を受けません。[AI Resources](../../sql-manual/sql-functions/ai-functions/overview.md)を参照してください |

**デプロイと設定ファイルの変更**

| 変更点 | 影響範囲 | 対応方法 |
| --- | --- | --- |
| FE の実効設定が `inverted_index_storage_format=V1` の場合、起動できなくなります | `fe.conf` または `fe_custom.conf` で V1 を設定しているクラスター | **アップグレード前に** `V2` または `V3` に変更し、`fe_custom.conf` が `fe.conf` を上書きしていないか確認します |
| Parquet エクスポートの `enable_int96_timestamps` はデフォルトで `false` となり、論理型付きの INT64 タイムスタンプが使用されます | 従来の INT96 形式に依存する Outfile / Export の利用側 | 論理型付き INT64 タイムスタンプに対応していることを確認します。従来の形式が必要な場合は、`enable_int96_timestamps=true` を明示的に設定します。使用できる値は `true` と `false` のみです |
| 旧 Doris DATE エンコーディングを使用したファイルでは、年が 0 の日付にずれが生じることがあります | Doris がエクスポートした、`0000-01-01` から `0000-02-28` を含む ORC / Parquet ファイル | ファイルの生成元を確認し、後述の方法で移行します。リーダーのアップグレードだけでは元の日付を復元できません |
| 同梱の Thrift が 0.16.0 から 0.24.0 に、Iceberg SDK が 1.10.1 から 1.11.0 にアップグレードされます | Doris をビルドする環境や、サードパーティーの依存アーティファクトを再利用する環境 | このリリースのソースから依存関係を用意します。古い Thrift ジェネレーターの再利用や、異なるバージョンの JAR の混在は避けてください |

#### コマンドの権限チェック {#command-privilege-checks}

バージョン 4.1.5 では、次の操作経路に権限チェックが追加されます。運用スクリプトや権限を委譲されたアカウントについては、対象オブジェクトに加え、連鎖する操作で変更されるオブジェクトの権限も確認してください。

| 操作 | 必要な権限 |
| --- | --- |
| `ADD CONSTRAINT` / `DROP CONSTRAINT` | 対象テーブルに対する `ALTER`。外部キーの追加には参照先テーブルに対する `ALTER` も必要です。主キーを削除して外部キーにも変更が連鎖する場合は、その連鎖によって変更されるすべてのテーブルに対する `ALTER` も必要です |
| `CREATE DICTIONARY` / `DROP DICTIONARY` | 作成には Dictionary に対する `CREATE` とソーステーブルに対する `SELECT`、削除には Dictionary に対する `DROP` が必要です |
| `WARM UP COMPUTE GROUP` | 対象グループおよび指定したソースグループに対する `USAGE` と、明示的に指定したテーブルに対する `SELECT` が必要です。`ON TABLES` ルールにはグローバルな `ADMIN` も必要です |
| ウォームアップのキャンセル、カタログのごみ箱のクリーンアップ、stage の削除、TDE ルートキーの管理 | グローバルな `ADMIN` |
| 管理者権限が必要な `/rest/v1` エンドポイント | Basic 認証と Cookie 認証のどちらでも、グローバルな `ADMIN` または `NODE` が必要です。`/login` に成功するとユーザーは認証されますが、管理用エンドポイントへのアクセス権は付与されません |

メタデータのクエリも、より寛容になります。`information_schema.view_dependency` は、定義を解析できないビューや無効なオブジェクトを参照するビューを、クエリ全体を失敗させる代わりにスキップします。結果にビューが含まれない場合は、その定義と FE の警告ログを確認してください。行がないことは、そのビューに依存関係がないことを意味しません。

#### 年が 0 の DATE ファイルの移行 {#year-zero-date-file-migration}

バージョン 4.1.5 では、Arrow、Parquet、ORC V2 における DATE 値から先発グレゴリオ暦のエポック日数への変換が修正されます。旧 Doris のエンコーディングでは、`0000-01-01` から `0000-02-28` について、期待値より 1 大きいエポック日数が書き込まれていました。`0000-03-01` 以降の日付は影響を受けず、`0000-02-29` は引き続き Doris が対応する DATE の範囲外です。

古い値と有効な新しいエンコーディングを自動的に区別することはできません。ファイルの書き込み元を確認してください。**すべての DATE フィールド**が旧 Doris エンコーディングを使用していると確認できたファイルには、このリリースのソースに含まれる[オフライン移行ツール](https://github.com/apache/doris/tree/4.1.5-release/tools/legacy_date_migration)を使用します。

```bash
python tools/legacy_date_migration/migrate_legacy_dates.py \
  --input legacy.parquet --output migrated.parquet --format parquet \
  --confirm-legacy-doris-date-encoding
```

ORC ファイルの場合は、`--format` を `orc` に変更します。このツールには Python 3.8+ と、選択した形式に対応する PyArrow が必要です。新しいファイルを書き込み、元のファイルは上書きしません。ほかの書き込み元で作成されたファイル、生成元が混在するファイル、すでに移行済みのファイルには使用しないでください。移行後は、利用側を切り替える前に `enable_file_scanner_v2=true` を使用し、境界の日付、行数、NULL 値を信頼できるソースと照合してください。Iceberg などのテーブル形式では、データファイルをその場で置き換えないでください。テーブル形式のライターを通じてテーブルを作り直すか、対応するトランザクション型の再書き込みを実行し、パーティション、統計情報、スナップショットのメタデータが整合性を保って再計算されるようにしてください。

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### Q：アップグレード後、BE / FE ノードの `Alive` が `false` で、`Version` が旧バージョンのままです。どうすればよいですか？ {#q-after-the-upgrade-a-be--fe-node-shows-alive-as-false-and-version-is-still-the-old-version-what-should-i-do}

プロセスが起動していないか、新バージョンの起動に失敗しています。`be.log` / `fe.log` のエラーログを確認し、`/bin` と `/lib` が正しく置き換えられているか確認してください。

### Q：アップグレード後、メタデータ非互換のエラーで FE を起動できません。どうすればよいですか？ {#q-after-the-upgrade-the-fe-fails-to-start-with-a-metadata-incompatibility-error-what-should-i-do}

バージョン間の飛び越しが大きすぎたか、メタデータ互換性テストを実行していません。旧バージョンに戻し、このドキュメントの「メタデータ互換性テスト」の手順に従ってテストを実行してください。必要に応じて、段階的にアップグレードします。

### Q：アップグレード後、`custom_lib/` 内の jar ファイルが見つかりません。何が起きたのでしょうか？ {#q-after-the-upgrade-jar-files-in-custom_lib-are-missing-what-happened}

誤って `custom_lib/` を上書きした可能性があります。置き換えるのは `/bin` と `/lib` のみです。`custom_lib/` は置き換えないでください。

### Q：アップグレード中に Stream Load のタスクが失敗します。なぜですか？ {#q-stream-load-tasks-fail-during-the-upgrade-why}

ノードの再起動により、クライアント接続が切断されるためです。クライアント側に再試行処理を追加してください。Routine Load と Flink/Spark Doris Connector には再試行機能が組み込まれています。

### Q：アップグレード後、レプリカ数が異常になったり、レプリカの移行が頻繁に発生したりします。原因は何ですか？ {#q-after-the-upgrade-the-replica-count-is-abnormal-or-replica-migration-happens-frequently-what-is-wrong}

`disable_balance` / `disable_tablet_scheduler` を無効にしていなかったか、アップグレード後に再度有効にしていない可能性があります。これらの設定の有効・無効を切り替える流れを確認してください。アップグレード前に無効にし、完了後に再度有効にします。

### Q：マイナーバージョンをまたぐアップグレードに失敗しました。なぜですか？ {#q-a-cross-minor-version-upgrade-failed-why}

バージョン順にアップグレードしていなかったためです。旧バージョンに戻し、`3.0 to 3.1 to 3.2 to 3.3` のように段階的にアップグレードしてください。

### Q：FE が 1 台のクラスターでアップグレードに失敗し、メタデータが失われました。どうすればよいですか？ {#q-a-single-fe-cluster-upgrade-failed-and-metadata-was-lost-what-should-i-do}

メタデータ互換性テストを実行していなかった可能性があります。アップグレード前に FE が 3 台の高可用性構成へ拡張するか、開発マシンまたは BE ノードでメタデータ互換性テストを実行してください。
